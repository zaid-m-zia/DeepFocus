import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { TabType, Task, FocusSession, StreakState, AmbientSoundType, Badge } from './types';
import {
  getStoredTasks,
  saveTasks,
  getStoredSessions,
  saveSessions,
  getStreakState,
  saveStreakState,
  recordFocusSession,
  clearAllData,
  calculateBadges,
} from './utils/storage';
import {
  initAnonymousAuth,
  syncUserDataToFirestore,
  fetchUserDataFromFirestore,
  getLocalRecoveryCode,
} from './firebase';
import {
  initTheme,
  getStoredThemeId,
  getThemeById,
  applyTheme,
  setStoredThemeId,
} from './utils/theme';
import { Navigation } from './components/Navigation';
import { FocusTab } from './components/FocusTab';
import { DashboardTab } from './components/DashboardTab';
import { TasksTab } from './components/TasksTab';
import { ThemesTab } from './components/ThemesTab';
import { ActiveFocusMode } from './components/ActiveFocusMode';
import { AirDropModal } from './components/AirDropModal';
import { SettingsModal } from './components/SettingsModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { ScrollFaviconIndicator } from './components/ScrollFaviconIndicator';
import { playClick, triggerHaptic } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('focus');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [streak, setStreak] = useState<StreakState>({ currentStreak: 0, bestStreak: 0, lastActiveDate: null });
  const [isFocusActive, setIsFocusActive] = useState<boolean>(false);
  const [showAirDropModal, setShowAirDropModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [unlockedBadgeBanner, setUnlockedBadgeBanner] = useState<Badge | null>(null);

  // Firebase Anonymous Auth & Cloud Sync State
  const [user, setUser] = useState<User | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string>(getLocalRecoveryCode() || '');
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [currentThemeId, setCurrentThemeId] = useState<string>(() => getStoredThemeId());

  const handleSelectTheme = (themeId: string) => {
    const theme = getThemeById(themeId);
    applyTheme(theme);
    setStoredThemeId(themeId);
    setCurrentThemeId(themeId);
  };

  const [focusConfig, setFocusConfig] = useState<{
    durationMin: number;
    goal: string;
    linkedTask?: Task;
    ambientSound: AmbientSoundType;
  }>({
    durationMin: 25,
    goal: 'Deep Study Block',
    linkedTask: undefined,
    ambientSound: 'off',
  });

  // Background Cloud Sync trigger
  const triggerCloudSync = (
    currentTasks: Task[],
    currentSessions: FocusSession[],
    currentStreak: StreakState
  ) => {
    if (user && recoveryCode) {
      syncUserDataToFirestore(user, recoveryCode, {
        tasks: currentTasks,
        sessions: currentSessions,
        streak: currentStreak,
        badges: calculateBadges(currentSessions, currentStreak),
      }).then((ok) => {
        if (ok) setIsCloudSynced(true);
      }).catch((e) => {
        console.warn('Cloud sync background error:', e);
      });
    }
  };

  // Initialize theme, storage, and Firebase silent anonymous auth
  useEffect(() => {
    // 0. Initialize theme engine
    initTheme();

    // 1. Instant local cache load for offline-first responsiveness
    const localTasks = getStoredTasks();
    const localSessions = getStoredSessions();
    const localStreak = getStreakState();
    setTasks(localTasks);
    setSessions(localSessions);
    setStreak(localStreak);

    // 2. Silent background anonymous authentication
    const unsubPromise = initAnonymousAuth(async (authUser, code) => {
      setUser(authUser);
      setRecoveryCode(code);

      try {
        const cloudData = await fetchUserDataFromFirestore(authUser);
        if (cloudData && (cloudData.sessions?.length > 0 || cloudData.tasks?.length > 0 || (cloudData.streak?.currentStreak ?? 0) > 0)) {
          const resolvedTasks = (cloudData.tasks && cloudData.tasks.length >= localTasks.length) ? cloudData.tasks : localTasks;
          const resolvedSessions = (cloudData.sessions && cloudData.sessions.length >= localSessions.length) ? cloudData.sessions : localSessions;
          const resolvedStreak = ((cloudData.streak?.currentStreak ?? 0) >= localStreak.currentStreak) ? cloudData.streak : localStreak;

          setTasks(resolvedTasks);
          saveTasks(resolvedTasks);
          setSessions(resolvedSessions);
          saveSessions(resolvedSessions);
          setStreak(resolvedStreak);
          saveStreakState(resolvedStreak);
          setIsCloudSynced(true);
        } else {
          await syncUserDataToFirestore(authUser, code, {
            tasks: localTasks,
            sessions: localSessions,
            streak: localStreak,
            badges: calculateBadges(localSessions, localStreak),
          });
          setIsCloudSynced(true);
        }
      } catch (err) {
        console.warn('Error syncing initial cloud data:', err);
      }
    });

    return () => {
      unsubPromise.then((unsub) => unsub && unsub());
    };
  }, []);

  // Launch Focus Mode
  const handleStartFocus = (
    durationMin: number,
    goal: string,
    linkedTask?: Task,
    ambientSound: AmbientSoundType = 'off'
  ) => {
    setFocusConfig({
      durationMin,
      goal,
      linkedTask,
      ambientSound,
    });
    setIsFocusActive(true);
  };

  // Focus on a specific task
  const handleStartFocusForTask = (task: Task) => {
    const duration =
      typeof task.estimatedDurationMin === 'number' && task.estimatedDurationMin > 0
        ? task.estimatedDurationMin
        : 25;
    setFocusConfig({
      durationMin: duration,
      goal: task.title,
      linkedTask: task,
      ambientSound: 'off',
    });
    setIsFocusActive(true);
  };

  // Completed session handler
  const handleFocusCompleted = (session: FocusSession) => {
    const { sessions: updatedSessions, streak: updatedStreak, newlyUnlockedBadges } = recordFocusSession(session);
    setSessions(updatedSessions);
    setStreak(updatedStreak);
    const updatedTasks = getStoredTasks();
    setTasks(updatedTasks);
    setIsFocusActive(false);

    triggerCloudSync(updatedTasks, updatedSessions, updatedStreak);

    if (newlyUnlockedBadges.length > 0) {
      setUnlockedBadgeBanner(newlyUnlockedBadges[0]);
      setTimeout(() => setUnlockedBadgeBanner(null), 5000);
    }

    setActiveTab('dashboard');
  };

  // End early session handler
  const handleFocusEndEarly = (session: FocusSession) => {
    const { sessions: updatedSessions, streak: updatedStreak } = recordFocusSession(session);
    setSessions(updatedSessions);
    setStreak(updatedStreak);
    setIsFocusActive(false);
    triggerCloudSync(tasks, updatedSessions, updatedStreak);
  };

  // Task Handlers
  const handleAddTask = (
    newTaskData: Omit<Task, 'id' | 'createdAt' | 'focusMinutesSpent'>,
    startImmediately = false
  ) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      focusMinutesSpent: 0,
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveTasks(updated);
    triggerCloudSync(updated, sessions, streak);

    if (startImmediately) {
      handleStartFocusForTask(newTask);
    }
  };

  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });
    setTasks(updated);
    saveTasks(updated);
    triggerCloudSync(updated, sessions, streak);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    saveTasks(updated);
    triggerCloudSync(updated, sessions, streak);
  };

  const handleClearHistory = () => {
    clearAllData();
    setSessions([]);
    const emptyStreak = { currentStreak: 0, bestStreak: 0, lastActiveDate: null };
    setStreak(emptyStreak);
    setTasks([]);
    triggerCloudSync([], [], emptyStreak);
  };

  const uncompletedTasksCount = tasks.filter((t) => !t.completed).length;

  if (isFocusActive) {
    return (
      <ActiveFocusMode
        plannedDurationMin={focusConfig.durationMin}
        goal={focusConfig.goal}
        linkedTask={focusConfig.linkedTask}
        ambientSound={focusConfig.ambientSound}
        onComplete={handleFocusCompleted}
        onEndEarly={handleFocusEndEarly}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-between relative"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {/* Static Background Dot Matrix Pattern */}
      <div className="dot-grid-bg" aria-hidden="true" />

      {/* Dynamic DeepFocus Favicon Scroll Indicator */}
      <ScrollFaviconIndicator />

      {/* Unlocked Badge Notification Banner */}
      {unlockedBadgeBanner && (
        <div
          className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto p-3 border font-mono text-xs flex items-center justify-between"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--main)',
            color: 'var(--text)',
          }}
        >
          <div>
            <span className="font-bold" style={{ color: 'var(--main)' }}>
              [milestone unlocked]
            </span>{' '}
            <span>{unlockedBadgeBanner.title}</span>
          </div>
          <button
            onClick={() => setUnlockedBadgeBanner(null)}
            className="hover:opacity-100 opacity-60"
            style={{ color: 'var(--sub)' }}
          >
            [dismiss]
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col px-4 pt-3 ios-safe-top relative z-10">
        {/* App Header: Editorial, Minimal, Zero Noise */}
        <header className="flex items-center justify-between py-3 mb-4 border-b" style={{ borderColor: 'var(--surface)' }}>
          {/* Logo & Title */}
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-base tracking-tight" style={{ color: 'var(--main)' }}>
              deepfocus
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--sub)' }}>
              v2
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                playClick();
                triggerHaptic('light');
              }}
              className="px-2 py-1 border transition-colors"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--surface)',
                color: 'var(--main)',
              }}
              title="View stats and streak"
            >
              {streak.currentStreak}d
            </button>

            <button
              id="open-settings-button"
              onClick={() => {
                setShowSettingsModal(true);
                playClick();
                triggerHaptic('light');
              }}
              className="px-2 py-1 border transition-colors"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--surface)',
                color: 'var(--sub)',
              }}
              title="Settings & Cloud Backup"
            >
              sync
            </button>

            <PWAInstallButton onOpenAirDropModal={() => setShowAirDropModal(true)} />
          </div>
        </header>

        {/* Tab View Content Area */}
        <main className="flex-1">
          {activeTab === 'focus' && (
            <FocusTab
              tasks={tasks}
              currentStreak={streak.currentStreak}
              onStartFocus={handleStartFocus}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardTab
              sessions={sessions}
              streak={streak}
              recoveryCode={recoveryCode}
              onClearHistory={handleClearHistory}
              onOpenSettings={() => setShowSettingsModal(true)}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksTab
              tasks={tasks}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onStartFocusForTask={handleStartFocusForTask}
            />
          )}

          {activeTab === 'themes' && (
            <ThemesTab
              currentThemeId={currentThemeId}
              onSelectTheme={handleSelectTheme}
            />
          )}
        </main>
      </div>

      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        tasksCount={uncompletedTasksCount}
      />

      {/* Settings & Cloud Backup Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        recoveryCode={recoveryCode}
        userId={user?.uid}
        isCloudSynced={isCloudSynced}
        onSyncNow={async () => {
          if (user && recoveryCode) {
            await syncUserDataToFirestore(user, recoveryCode, {
              tasks,
              sessions,
              streak,
              badges: calculateBadges(sessions, streak),
            });
            setIsCloudSynced(true);
          }
        }}
        onRestoreSuccess={(restored) => {
          setTasks(restored.tasks);
          saveTasks(restored.tasks);
          setSessions(restored.sessions);
          saveSessions(restored.sessions);
          setStreak(restored.streak);
          saveStreakState(restored.streak);
          setRecoveryCode(restored.recoveryCode);
          setIsCloudSynced(true);
          setShowSettingsModal(false);
          if (user) {
            syncUserDataToFirestore(user, restored.recoveryCode, {
              tasks: restored.tasks,
              sessions: restored.sessions,
              streak: restored.streak,
              badges: restored.badges || calculateBadges(restored.sessions, restored.streak),
            });
          }
        }}
        onClearAllData={handleClearHistory}
      />

      {/* AirDrop Modal */}
      <AirDropModal
        isOpen={showAirDropModal}
        onClose={() => setShowAirDropModal(false)}
      />
    </div>
  );
}
