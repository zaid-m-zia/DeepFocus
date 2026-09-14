import { Task, FocusSession, StreakState, Badge } from '../types';

const TASKS_KEY = 'deepfocus_tasks_v2';
const SESSIONS_KEY = 'deepfocus_sessions_v2';
const STREAK_KEY = 'deepfocus_streak_v2';

// Immediately purge any legacy mock data cached in localStorage
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('deepfocus_tasks_v1');
    localStorage.removeItem('deepfocus_sessions_v1');
    localStorage.removeItem('deepfocus_streak_v1');
  }
} catch {
  // Graceful fallback
}

// Format YYYY-MM-DD
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getStoredTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks', err);
  }
}

export function getStoredSessions(): FocusSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSessions(sessions: FocusSession[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error('Failed to save sessions', err);
  }
}

export function getStreakState(): StreakState {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) {
      return { currentStreak: 0, bestStreak: 0, lastActiveDate: null };
    }
    return JSON.parse(raw);
  } catch {
    return { currentStreak: 0, bestStreak: 0, lastActiveDate: null };
  }
}

export function saveStreakState(streak: StreakState): void {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  } catch (err) {
    console.error('Failed to save streak', err);
  }
}

export function clearAllData(): void {
  try {
    localStorage.removeItem(TASKS_KEY);
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(STREAK_KEY);
  } catch (err) {
    console.error('Failed to clear data', err);
  }
}

export function recordFocusSession(session: FocusSession): {
  sessions: FocusSession[];
  streak: StreakState;
  newlyUnlockedBadges: Badge[];
} {
  const currentSessions = getStoredSessions();
  const updatedSessions = [session, ...currentSessions];
  saveSessions(updatedSessions);

  // Update task if linked
  if (session.taskId && session.completed) {
    const tasks = getStoredTasks();
    const taskIndex = tasks.findIndex((t) => t.id === session.taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].focusMinutesSpent = (tasks[taskIndex].focusMinutesSpent || 0) + Math.round(session.actualDurationSec / 60);
      saveTasks(tasks);
    }
  }

  // Update streak if session completed
  const currentStreakState = getStreakState();
  let updatedStreak = { ...currentStreakState };
  const todayKey = formatDateKey(new Date());

  if (session.completed) {
    if (!updatedStreak.lastActiveDate) {
      updatedStreak.currentStreak = 1;
      updatedStreak.bestStreak = 1;
      updatedStreak.lastActiveDate = todayKey;
    } else if (updatedStreak.lastActiveDate === todayKey) {
      // Already studied today; maintain streak
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = formatDateKey(yesterday);

      if (updatedStreak.lastActiveDate === yesterdayKey) {
        updatedStreak.currentStreak += 1;
        if (updatedStreak.currentStreak > updatedStreak.bestStreak) {
          updatedStreak.bestStreak = updatedStreak.currentStreak;
        }
      } else {
        // Streak was broken prior to today
        updatedStreak.currentStreak = 1;
      }
      updatedStreak.lastActiveDate = todayKey;
    }
  } else {
    // User broke session early: do not increment streak
  }
  saveStreakState(updatedStreak);

  // Compute newly unlocked badges
  const prevBadges = calculateBadges(currentSessions, currentStreakState);
  const newBadges = calculateBadges(updatedSessions, updatedStreak);
  const newlyUnlockedBadges = newBadges.filter(
    (b) => b.unlocked && !prevBadges.find((pb) => pb.id === b.id)?.unlocked
  );

  return {
    sessions: updatedSessions,
    streak: updatedStreak,
    newlyUnlockedBadges,
  };
}

export function calculateBadges(sessions: FocusSession[], streak: StreakState): Badge[] {
  const completedSessions = sessions.filter((s) => s.completed);
  const totalMinutes = Math.round(
    completedSessions.reduce((acc, s) => acc + s.actualDurationSec, 0) / 60
  );
  const zeroDistractionSessions = completedSessions.filter((s) => s.distractionsCount === 0);
  const has90MinSession = completedSessions.some((s) => s.plannedDurationMin >= 90);

  const badges: Badge[] = [
    {
      id: 'first_step',
      title: 'First Spark',
      description: 'Complete your first focused study session.',
      icon: 'zap',
      category: 'milestone',
      unlocked: completedSessions.length >= 1,
      progress: Math.min(completedSessions.length, 1),
      maxProgress: 1,
    },
    {
      id: 'streak_3',
      title: '3-Day Rhythm',
      description: 'Maintain study consistency for 3 consecutive days.',
      icon: 'flame',
      category: 'streak',
      unlocked: streak.currentStreak >= 3,
      progress: Math.min(streak.currentStreak, 3),
      maxProgress: 3,
    },
    {
      id: 'streak_7',
      title: '7-Day Unstoppable',
      description: 'Unbroken daily focus streak for a full week.',
      icon: 'trophy',
      category: 'streak',
      unlocked: streak.currentStreak >= 7,
      progress: Math.min(streak.currentStreak, 7),
      maxProgress: 7,
    },
    {
      id: 'streak_30',
      title: '30-Day Master',
      description: 'Reach the elite 30-day focus discipline milestone.',
      icon: 'crown',
      category: 'streak',
      unlocked: streak.currentStreak >= 30,
      progress: Math.min(streak.currentStreak, 30),
      maxProgress: 30,
    },
    {
      id: 'hours_5',
      title: '5 Hours Locked In',
      description: 'Accumulate over 300 minutes of deep study.',
      icon: 'clock',
      category: 'duration',
      unlocked: totalMinutes >= 300,
      progress: Math.min(totalMinutes, 300),
      maxProgress: 300,
    },
    {
      id: 'zen_master',
      title: 'Monk Focus',
      description: 'Complete a full session with exactly 0 tab switches or distractions.',
      icon: 'shield-check',
      category: 'discipline',
      unlocked: zeroDistractionSessions.length >= 1,
      progress: Math.min(zeroDistractionSessions.length, 1),
      maxProgress: 1,
    },
    {
      id: 'deep_diver',
      title: 'Deep Diver',
      description: 'Complete an intensive 90-minute study block.',
      icon: 'compass',
      category: 'duration',
      unlocked: has90MinSession,
      progress: has90MinSession ? 1 : 0,
      maxProgress: 1,
    },
    {
      id: 'pure_mind',
      title: 'Digital Armor',
      description: 'Complete 3 distinct sessions with zero distractions.',
      icon: 'sparkles',
      category: 'discipline',
      unlocked: zeroDistractionSessions.length >= 3,
      progress: Math.min(zeroDistractionSessions.length, 3),
      maxProgress: 3,
    },
  ];

  return badges;
}

export interface DayChartPoint {
  dayLabel: string;
  fullDate: string;
  hours: number;
  minutes: number;
  sessionsCount: number;
  isToday: boolean;
}

export interface WeekChartPoint {
  weekLabel: string;
  hours: number;
  sessionsCount: number;
}

export function getDailyChartData(sessions: FocusSession[]): DayChartPoint[] {
  const result: DayChartPoint[] = [];
  const completed = sessions.filter((s) => s.completed);
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = formatDateKey(d);
    const isToday = i === 0;

    const daySessions = completed.filter((s) => {
      const sKey = formatDateKey(new Date(s.startTime));
      return sKey === key;
    });

    const totalSeconds = daySessions.reduce((acc, s) => acc + s.actualDurationSec, 0);
    const totalMinutes = Math.round(totalSeconds / 60);
    const totalHours = parseFloat((totalMinutes / 60).toFixed(1));

    result.push({
      dayLabel: isToday ? 'Today' : dayNames[d.getDay()],
      fullDate: key,
      hours: totalHours,
      minutes: totalMinutes,
      sessionsCount: daySessions.length,
      isToday,
    });
  }

  return result;
}

export function getWeeklyChartData(sessions: FocusSession[]): WeekChartPoint[] {
  const result: WeekChartPoint[] = [];
  const completed = sessions.filter((s) => s.completed);
  const now = new Date();

  // Last 4 weeks
  for (let w = 3; w >= 0; w--) {
    const weekEnd = new Date(now.getTime() - w * 7 * 86400000);
    const weekStart = new Date(weekEnd.getTime() - 6 * 86400000);
    weekStart.setHours(0, 0, 0, 0);
    weekEnd.setHours(23, 59, 59, 999);

    const weekSessions = completed.filter((s) => {
      const t = new Date(s.startTime).getTime();
      return t >= weekStart.getTime() && t <= weekEnd.getTime();
    });

    const totalMinutes = Math.round(
      weekSessions.reduce((acc, s) => acc + s.actualDurationSec, 0) / 60
    );
    const totalHours = parseFloat((totalMinutes / 60).toFixed(1));

    const label = w === 0 ? 'This Wk' : `Wk -${w}`;
    result.push({
      weekLabel: label,
      hours: totalHours,
      sessionsCount: weekSessions.length,
    });
  }

  return result;
}
