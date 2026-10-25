import json, re, sys, datetime
from playwright.sync_api import sync_playwright, expect

URL = "http://localhost:3111/"
results = []
def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))
    print(("PASS " if cond else "FAIL ") + name + (f"  [{detail}]" if detail and not cond else ""))

MON_10 = datetime.datetime(2026, 10, 26, 10, 0, 0)

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1280, "height": 900}, accept_downloads=True)
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("dialog", lambda d: d.accept())
    page.clock.set_fixed_time(MON_10)
    page.goto(URL); page.wait_for_selector("text=Good morning")

    # 1 empty state
    check("empty: onboarding card shown", page.get_by_text("Set up your day").is_visible())
    check("empty: no-class message", page.get_by_text("No classes added yet").is_visible())

    # 2 classes + validation
    page.get_by_role("button", name="Timetable").first.click()
    page.get_by_role("button", name="Add class", exact=True).click()
    page.fill("#c-name", "Computer Organization"); page.select_option("#c-day", "0")
    page.fill("#c-start", "09:00"); page.fill("#c-end", "10:00"); page.fill("#c-room", "Lab 3")
    page.get_by_role("button", name="Add class").last.click()
    page.get_by_role("button", name="Add class", exact=True).click()
    page.fill("#c-name", "Statistics"); page.fill("#c-start", "11:00"); page.fill("#c-end", "10:00")
    page.get_by_role("button", name="Add class").last.click()
    check("validation: end before start rejected", page.get_by_text("End time must be after the start time.").is_visible())
    page.fill("#c-start", "09:30"); page.fill("#c-end", "10:30")
    page.get_by_role("button", name="Add class").last.click()
    check("validation: overlap rejected", page.get_by_text(re.compile("Overlaps with Computer Organization")).is_visible())
    page.fill("#c-start", "11:00"); page.fill("#c-end", "12:00"); page.fill("#c-code", "STAT-201"); page.fill("#c-inst", "Dr. Khan")
    page.get_by_role("button", name="Add class").last.click()
    check("class added after fixing errors", page.get_by_text("Statistics").first.is_visible())
    # back-to-back allowed + other day same time allowed
    page.get_by_role("button", name="Add class on Tuesday").click()
    page.fill("#c-name", "OOP"); page.fill("#c-start", "11:00"); page.fill("#c-end", "12:00")
    page.get_by_role("button", name="Add class").last.click()
    check("same time on a different day allowed", page.get_by_label("Edit OOP on Tuesday").is_visible())
    # edit
    page.get_by_label("Edit OOP on Tuesday").click()
    page.fill("#c-name", "OOP Lab"); page.get_by_role("button", name="Save changes").click()
    check("class edit works", page.get_by_label("Edit OOP Lab on Tuesday").is_visible())
    # delete
    page.get_by_label("Delete OOP Lab on Tuesday").click()
    check("class delete works", page.get_by_label("Edit OOP Lab on Tuesday").count() == 0)
    check("seven day columns", page.locator("section[aria-labelledby^=day-]").count() == 7)

    # 3 tasks
    page.get_by_role("button", name="Tasks").first.click()
    def add_task(title, cat, prio, deadline, est, time=""):
        page.get_by_role("button", name="Add task", exact=True).click()
        page.fill("#t-title", title); page.fill("#t-cat", cat); page.select_option("#t-prio", prio)
        if deadline: page.fill("#t-date", deadline)
        if time: page.fill("#t-time", time)
        page.fill("#t-est", str(est))
        page.get_by_role("button", name="Add task").last.click()
    page.get_by_role("button", name="Add task", exact=True).click()
    page.fill("#t-title", ""); page.fill("#t-est", "0")
    page.get_by_role("button", name="Add task").last.click()
    check("task validation: title + estimate", page.get_by_text("Enter a task title.").is_visible() and page.get_by_text(re.compile("between 1 and 1440")).is_visible())
    page.get_by_role("button", name="Cancel").click()
    add_task("Overdue report", "Assignment", "medium", "2026-10-24", 20)
    add_task("Quiz prep", "Exam prep", "high", "2026-10-26", 30, "18:00")
    add_task("Long project", "Project", "high", "2026-10-26", 90)
    add_task("Read chapter", "Study", "low", "2026-10-28", 15)
    add_task("Someday", "Personal", "low", "", 10)
    groups = [re.sub(r"\s*\d+$", "", h.inner_text().strip()) for h in page.locator("section[aria-label] > h4").all()]
    check("tasks grouped by urgency in order", groups == ["Overdue", "Due today", "This week", "No deadline"], str(groups))
    page.get_by_label('Mark "Someday" as done').click()
    page.get_by_role("button", name=re.compile("^Completed")).click()
    check("completed filter shows completed task", page.get_by_text("Someday").is_visible() and page.get_by_text("Quiz prep").count() == 0)
    page.get_by_role("button", name=re.compile("^All")).click()
    check("all filter shows both", page.get_by_text("Someday").is_visible() and page.get_by_text("Quiz prep").is_visible())
    page.get_by_role("button", name=re.compile("^Active")).click()
    page.get_by_label("Edit task Read chapter").click(); page.fill("#t-est", "25"); page.get_by_role("button", name="Save changes").click()
    check("task edit works", page.get_by_text("25 min").first.is_visible())

    # 4 habits
    page.get_by_role("button", name="Habits").first.click()
    page.get_by_role("button", name="Add habit", exact=True).click()
    page.get_by_role("button", name="Add habit").last.click()
    check("habit validation", page.get_by_text("Enter a habit name.").is_visible())
    page.fill("#h-name", "Study 30 minutes"); page.get_by_role("button", name="Add habit").last.click()
    page.get_by_role("button", name="Add habit", exact=True).click(); page.fill("#h-name", "Plan tomorrow"); page.get_by_role("button", name="Add habit").last.click()
    page.get_by_label("Study 30 minutes, today: not checked").click()
    page.get_by_label("Study 30 minutes, Sat: not checked").click()
    check("habit check-in + history toggle", page.get_by_label("Study 30 minutes, today: checked").is_visible() and page.get_by_text("2 of the last 7 days").is_visible())
    page.get_by_label("Study 30 minutes, Sat: checked").click()
    check("habit uncheck works (no penalty)", page.get_by_text("1 of the last 7 days").is_visible())
    page.get_by_label("Edit habit Plan tomorrow").click(); page.fill("#h-name", "Plan the next day"); page.get_by_role("button", name="Save changes").click()
    check("habit edit works", page.get_by_label("Edit habit Plan the next day").is_visible())
    check("no streak language in habits UI", "streak" not in page.locator("body").inner_text().lower())

    # 5 Today dashboard + Plan My Free Time (10:00, next class 11:00 → 60-10 = 50)
    page.get_by_role("button", name="Today").first.click()
    check("today: greeting + date", page.get_by_text("Good morning").is_visible() and page.get_by_text("Monday, October 26").is_visible())
    check("today: countdown 1h", page.get_by_label("Starts in 1h").is_visible())
    check("today: overdue/due-today tasks listed", page.locator("#due-title + ul li").count() == 3, str(page.locator("#due-title + ul li").count()))
    check("today: habit progress 1/2", page.get_by_text("1 / 2").first.is_visible())
    page.get_by_role("button", name="Plan my free time", exact=True).click()
    plan = page.locator("#plan-result").inner_text()
    print("--- PLAN ---\n" + plan + "\n------------")
    check("plan: 50 min window w/ buffer", "50 min free before Statistics" in plan and "10-minute buffer" in plan)
    check("plan: long (90m) task not recommended", "Long project: Needs 1 h 30 min" in plan and page.locator("ol[aria-label='Suggested tasks'] li", has_text="Long project").count() == 0)
    check("plan: reasons present", page.locator("ol[aria-label='Suggested tasks'] li").count() >= 1 and "overdue" in plan.lower())
    check("plan: alternatives (prepare + break)", "Prepare for Statistics" in plan and "Take a real break" in plan)
    check("plan: first is overdue task", page.locator("ol[aria-label='Suggested tasks'] li").first.inner_text().startswith("Start with: Overdue report"))
    page.get_by_label("Mark Overdue report as done").click()
    check("plan: marking done updates list", page.locator("ol[aria-label='Suggested tasks'] li", has_text="Overdue report").count() == 0)
    page.screenshot(path="/home/claude/e2e/today-desktop.png", full_page=True)

    # 6 persistence
    page.reload(); page.wait_for_selector("text=Good morning")
    check("persist: classes survive refresh", page.get_by_text("Statistics").first.is_visible())
    page.get_by_role("button", name="Tasks").first.click()
    check("persist: tasks survive refresh (completed state kept)", page.get_by_text("Quiz prep").is_visible() and page.get_by_text("Overdue report").count() == 0)
    page.get_by_role("button", name="Habits").first.click()
    check("persist: habit check-in survives", page.get_by_label("Study 30 minutes, today: checked").is_visible())

    # 7 export / import
    page.get_by_role("button", name="Backup and restore").click()
    with page.expect_download() as dl: page.get_by_role("button", name="Export JSON").click()
    path = dl.value.path(); exported = json.load(open(path))
    check("export: valid JSON w/ data", exported["version"] == 1 and len(exported["classes"]) == 2 and len(exported["tasks"]) == 5 and len(exported["habits"]) == 2)
    # import valid
    open("/tmp/bad.json", "w").write("{not json")
    page.set_input_files("input[type=file]", "/tmp/bad.json")
    page.get_by_text("not a valid Din backup").wait_for()
    check("import: malformed file rejected, data unchanged", True)
    mixed = {"version": 1, "classes": [{"name": "Imported", "day": 3, "start": "08:00", "end": "09:00"}, {"name": "x", "day": 99, "start": "08:00", "end": "09:00"}],
             "tasks": [{"title": "Imported task", "estimateMin": 10, "priority": "high"}, {"title": "bad", "estimateMin": -5}], "habits": [{"name": "Imported habit", "log": []}, "junk"]}
    json.dump(mixed, open("/tmp/mixed.json", "w"))
    page.set_input_files("input[type=file]", "/tmp/mixed.json")
    page.get_by_text(re.compile(r"Imported 1 class, 1 task, 1 habit \(3 invalid")).wait_for()
    check("import: partial import reports skipped records", True)
    page.keyboard.press("Escape")
    check("modal: Escape closes", page.get_by_role("dialog").count() == 0)
    page.get_by_role("button", name="Timetable").first.click()
    check("import: data replaced", page.get_by_text("Imported").first.is_visible() and page.get_by_text("Statistics").count() == 0)

    # 8 corrupt storage recovery
    page.evaluate("localStorage.setItem('din:v1', '{{{{ garbage')")
    page.reload(); page.wait_for_selector("text=Good morning")
    check("corrupt storage: app loads + notice", page.get_by_text(re.compile("could not be read")).is_visible() and page.get_by_text("Set up your day").is_visible())
    page.evaluate("localStorage.setItem('din:v1', JSON.stringify({version:1,classes:[{name:'Ok',day:0,start:'09:00',end:'10:00'},{name:null}],tasks:'oops',habits:[]}))")
    page.reload(); page.wait_for_selector("text=Good morning")
    check("partially corrupt storage: valid records kept", page.get_by_text("Ok").first.is_visible())

    # 9 keyboard / a11y
    page.get_by_role("button", name="Tasks").first.click()
    btn = page.get_by_role("button", name="Add task", exact=True)
    btn.focus(); page.keyboard.press("Enter")
    check("a11y: dialog opens with focus in title field", page.evaluate("document.activeElement.id") == "t-title")
    check("a11y: dialog has role + label", page.get_by_role("dialog", name="Add task").is_visible())
    page.keyboard.press("Escape")
    check("a11y: focus returns to trigger", page.evaluate("document.activeElement.textContent.trim()") == "Add task")
    page.keyboard.press("Tab")
    outline = page.evaluate("getComputedStyle(document.activeElement).outlineStyle")
    check("a11y: focus-visible outline on keyboard focus", outline == "solid", outline)

    # 10 reduced motion
    rm = ctx.new_page(); rm.emulate_media(reduced_motion="reduce"); rm.goto(URL); rm.wait_for_selector("text=Good")
    dur = rm.evaluate("getComputedStyle(document.querySelector('.din-bar')||document.body).transitionDuration")
    check("reduced motion: transitions neutralised", dur in ("1e-05s", "0.00001s", "0.01ms", "0s") or float(dur.replace('s',''))<0.001, dur)

    check("no console/page errors", len(errors) == 0, "; ".join(errors[:3]))
    b.close()

print(f"\n{sum(1 for r in results if r[1])}/{len(results)} passed")
sys.exit(0 if all(r[1] for r in results) else 1)
