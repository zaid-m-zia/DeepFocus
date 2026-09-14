export type TaskPriority = 'p1' | 'p2' | 'p3' | 'p4';

export interface Task {
  id: string;
  title: string;
  notes?: string;
  priority: TaskPriority;
  startDate?: string; // YYYY-MM-DD or empty
  startTime?: string; // HH:mm or empty
  estimatedDurationMin?: number; // Estimated duration in minutes
  dueDate?: string; // YYYY-MM-DD or empty
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  focusMinutesSpent: number;
}

export interface DistractionLog {
  timestamp: string;
  reason: string;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  taskTitle?: string;
  goal: string;
  plannedDurationMin: number;
  actualDurationSec: number;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  completed: boolean;
  distractionsCount: number;
  distractionLogs: DistractionLog[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'streak' | 'duration' | 'discipline' | 'milestone';
  progress: number;
  maxProgress: number;
}

export interface StreakState {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string | null;
}

export type TabType = 'focus' | 'dashboard' | 'tasks' | 'themes';

export type AmbientSoundType = 'off' | 'rain' | 'whitenoise' | 'binaural';
