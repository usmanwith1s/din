import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Din - your day, in balance',
  description: 'A student planner for classes, tasks, and habits, with a planner that fits tasks into your free time.',
  themeColor: '#0b0e11',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
