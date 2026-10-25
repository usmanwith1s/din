export type Priority = 'low' | 'medium' | 'high';

export interface ClassItem {
  id: string;
  name: string;
  /** 0 = Monday … 6 = Sunday */
  day: number;
  start: string; // "HH:MM" 24h
  end: string; // "HH:MM" 24h
  room?: string;
  code?: string;
  instructor?: string;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  priority: Priority;
  /** "YYYY-MM-DD" local date, optional */
  deadline?: string;
  /** "HH:MM" optional, only meaningful with a deadline */
  deadlineTime?: string;
  estimateMin: number;
  done: boolean;
  completedAt?: string;
}

export interface Habit {
  id: string;
  name: string;
  /** "YYYY-MM-DD" dates that were checked in */
  log: string[];
}

export interface DinData {
  version: 1;
  classes: ClassItem[];
  tasks: Task[];
  habits: Habit[];
}

export const emptyData = (): DinData => ({ version: 1, classes: [], tasks: [], habits: [] });
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
export const DEFAULT_CATEGORIES = ['Study', 'Assignment', 'Exam prep', 'Project', 'Personal'];
