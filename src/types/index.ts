export interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  targetPerMonth: number;
  sortOrder: number;
  active: boolean;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: string;
  userId: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  status: 'reading' | 'completed' | 'backlog';
  progress: number;
  startedAt: string | null;
  finishedAt: string | null;
  userId: string;
}

export interface HealthMetrics {
  id: string;
  date: string;
  steps: number | null;
  calories: number | null;
  restingHr: number | null;
  workoutMinutes: number | null;
  userId: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
}

export interface HabitSummary {
  habitId: string;
  habitName: string;
  color: string;
  count: number;
  target: number;
}
