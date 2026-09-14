import React, { useState } from 'react';
import { FocusSession, StreakState, Badge } from '../types';
import { getDailyChartData, getWeeklyChartData, calculateBadges } from '../utils/storage';
import { playClick } from '../utils/audio';

interface DashboardTabProps {
  sessions: FocusSession[];
  streak: StreakState;
  recoveryCode?: string;
  onClearHistory?: () => void;
  onOpenSettings?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  sessions,
  streak,
  recoveryCode,
  onClearHistory,
  onOpenSettings,
}) => {
  const [chartView, setChartView] = useState<'daily' | 'weekly'>('daily');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const dailyData = getDailyChartData(sessions);
  const weeklyData = getWeeklyChartData(sessions);
  const badges = calculateBadges(sessions, streak);

  const completedSessions = sessions.filter((s) => s.completed);
  const totalFocusedSeconds = completedSessions.reduce((acc, s) => acc + s.actualDurationSec, 0);
  const totalFocusedHours = (totalFocusedSeconds / 3600).toFixed(1);
  const zeroDistractionCount = completedSessions.filter((s) => s.distractionsCount === 0).length;
  const zeroDistractionRate = completedSessions.length > 0
    ? Math.round((zeroDistractionCount / completedSessions.length) * 100)
    : 100;

  const maxDayHours = Math.max(...dailyData.map((d) => d.hours), 2.5);
  const maxWeekHours = Math.max(...weeklyData.map((w) => w.hours), 5);
  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="space-y-8 pb-28 max-w-lg mx-auto">
      {/* Cloud Sync Status Strip */}
      {recoveryCode && onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="w-full p-3 text-left border flex items-center justify-between text-xs font-mono transition-opacity hover:opacity-90"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--surface)',
            color: 'var(--text)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5" style={{ backgroundColor: 'var(--main)' }} />
            <span style={{ color: 'var(--sub)' }}>cloud backup:</span>
            <span className="font-bold">{recoveryCode}</span>
          </div>
          <span className="underline text-[11px]" style={{ color: 'var(--main)' }}>settings &rarr;</span>
        </button>
      )}

      {/* Primary Key Metrics Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Streak */}
        <div
          className="p-4 border"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--surface)',
          }}
        >
          <div className="text-[11px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--sub)' }}>
            daily streak
          </div>
          <div className="text-4xl font-bold font-mono tabular-nums" style={{ color: 'var(--main)' }}>
            {streak.currentStreak}d
          </div>
          <div className="text-[11px] font-mono mt-2" style={{ color: 'var(--sub)' }}>
            best: {streak.bestStreak}d &bull; {streak.currentStreak > 0 ? 'active' : 'unstarted'}
          </div>
        </div>

        {/* Deep Hours */}
        <div
          className="p-4 border"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--surface)',
          }}
        >
          <div className="text-[11px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--sub)' }}>
            deep focus
          </div>
          <div className="text-4xl font-bold font-mono tabular-nums" style={{ color: 'var(--text)' }}>
            {totalFocusedHours}h
          </div>
          <div className="text-[11px] font-mono mt-2" style={{ color: 'var(--sub)' }}>
            {completedSessions.length} blocks &bull; {zeroDistractionRate}% zen
          </div>
        </div>
      </div>

      {/* Activity Velocity Chart */}
      <div
        className="p-4 border space-y-4"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--surface)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--sub)' }}>
              study velocity
            </div>
            <div className="text-sm font-bold font-sans" style={{ color: 'var(--text)' }}>
              Hours logged ({chartView === 'daily' ? 'past 7 days' : 'past 4 weeks'})
            </div>
          </div>

          <div className="flex gap-1 text-xs font-mono">
            <button
              onClick={() => {
                setChartView('daily');
                playClick();
              }}
              className="px-2 py-1 border transition-colors"
              style={{
                backgroundColor: chartView === 'daily' ? 'var(--main)' : 'var(--bg)',
                color: chartView === 'daily' ? 'var(--bg)' : 'var(--sub)',
                borderColor: chartView === 'daily' ? 'var(--main)' : 'var(--surface)',
              }}
            >
              daily
            </button>
            <button
              onClick={() => {
                setChartView('weekly');
                playClick();
              }}
              className="px-2 py-1 border transition-colors"
              style={{
                backgroundColor: chartView === 'weekly' ? 'var(--main)' : 'var(--bg)',
                color: chartView === 'weekly' ? 'var(--bg)' : 'var(--sub)',
                borderColor: chartView === 'weekly' ? 'var(--main)' : 'var(--surface)',
              }}
            >
              weekly
            </button>
          </div>
        </div>

        {/* Flat Bar Graph */}
        {chartView === 'daily' ? (
          <div className="pt-2">
            <div className="flex items-end justify-between gap-2 h-32 px-1">
              {dailyData.map((d) => {
                const heightPct = Math.max(6, Math.round((d.hours / maxDayHours) * 100));
                return (
                  <div key={d.fullDate} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-mono tabular-nums" style={{ color: 'var(--sub)' }}>
                      {d.hours > 0 ? `${d.hours}h` : '-'}
                    </span>
                    <div
                      className="w-full h-24 flex items-end"
                      style={{ backgroundColor: 'var(--bg)' }}
                    >
                      <div
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: d.isToday ? 'var(--main)' : d.hours > 0 ? 'var(--text)' : 'transparent',
                        }}
                        className="w-full transition-all duration-300"
                      />
                    </div>
                    <span
                      className="text-[10px] font-mono uppercase font-bold"
                      style={{ color: d.isToday ? 'var(--main)' : 'var(--sub)' }}
                    >
                      {d.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pt-2">
            <div className="flex items-end justify-between gap-4 h-32 px-2">
              {weeklyData.map((w, i) => {
                const heightPct = Math.max(6, Math.round((w.hours / maxWeekHours) * 100));
                const isCurrentWeek = i === weeklyData.length - 1;
                return (
                  <div key={w.weekLabel} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-mono tabular-nums" style={{ color: 'var(--sub)' }}>
                      {w.hours > 0 ? `${w.hours}h` : '-'}
                    </span>
                    <div
                      className="w-full h-24 flex items-end"
                      style={{ backgroundColor: 'var(--bg)' }}
                    >
                      <div
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: isCurrentWeek ? 'var(--main)' : w.hours > 0 ? 'var(--text)' : 'transparent',
                        }}
                        className="w-full transition-all duration-300"
                      />
                    </div>
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: isCurrentWeek ? 'var(--main)' : 'var(--sub)' }}
                    >
                      {w.weekLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Discipline Badges: Flat Monospaced Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--sub)' }}>
            discipline milestones
          </div>
          <span className="text-xs font-mono" style={{ color: 'var(--main)' }}>
            {unlockedBadgesCount}/{badges.length} unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {badges.map((badge) => {
            const isUnlocked = badge.unlocked;
            return (
              <button
                key={badge.id}
                onClick={() => {
                  setSelectedBadge(badge);
                  playClick();
                }}
                className="p-3 text-left border transition-colors"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: isUnlocked ? 'var(--main)' : 'var(--surface)',
                  color: isUnlocked ? 'var(--text)' : 'var(--sub)',
                  opacity: isUnlocked ? 1 : 0.65,
                }}
              >
                <div className="flex items-center justify-between text-[10px] font-mono uppercase mb-1">
                  <span style={{ color: isUnlocked ? 'var(--main)' : 'var(--sub)' }}>
                    {isUnlocked ? '[unlocked]' : '[locked]'}
                  </span>
                  <span>{badge.progress}/{badge.maxProgress}</span>
                </div>
                <div className="text-xs font-bold font-sans">{badge.title}</div>
                <div className="text-[11px] font-mono mt-0.5 line-clamp-1" style={{ color: 'var(--sub)' }}>
                  {badge.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Session History Log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--sub)' }}>
            session log ({sessions.length})
          </div>
          {onClearHistory && sessions.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all session history and reset streak?')) {
                  onClearHistory();
                }
              }}
              className="text-[11px] font-mono transition-opacity hover:opacity-100 opacity-60"
              style={{ color: 'var(--main)' }}
            >
              [clear log]
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div
            className="p-6 border text-center text-xs font-mono"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--surface)',
              color: 'var(--sub)',
            }}
          >
            no sessions recorded yet
          </div>
        ) : (
          <div className="space-y-1.5 font-mono text-xs">
            {sessions.slice(0, 10).map((s) => {
              const dateObj = new Date(s.startTime);
              const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
              const durationMin = Math.round(s.actualDurationSec / 60);

              return (
                <div
                  key={s.id}
                  className="p-2.5 border flex items-center justify-between"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--surface)',
                    color: 'var(--text)',
                  }}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold truncate font-sans text-xs">
                      {s.goal || 'General Study Session'}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--sub)' }}>
                      {dateStr} {timeStr} &bull; {durationMin}m &bull; {s.distractionsCount} distractions
                    </div>
                  </div>

                  <span
                    className="text-[10px] uppercase font-bold shrink-0"
                    style={{ color: s.completed ? 'var(--main)' : 'var(--sub)' }}
                  >
                    {s.completed ? 'finished' : 'aborted'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Badge Modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          <div
            className="max-w-xs w-full p-5 border space-y-4"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--main)',
              color: 'var(--text)',
            }}
          >
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--main)' }}>
                {selectedBadge.unlocked ? 'badge achieved' : 'badge in progress'}
              </span>
              <h3 className="text-base font-bold font-sans">{selectedBadge.title}</h3>
            </div>

            <p className="text-xs" style={{ color: 'var(--sub)' }}>{selectedBadge.description}</p>

            <div className="text-xs font-mono flex justify-between pt-1 border-t" style={{ borderColor: 'var(--bg)' }}>
              <span style={{ color: 'var(--sub)' }}>progress</span>
              <span className="font-bold" style={{ color: 'var(--main)' }}>
                {selectedBadge.progress} / {selectedBadge.maxProgress}
              </span>
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2 px-4 font-mono text-xs uppercase tracking-wider font-bold"
              style={{
                backgroundColor: 'var(--main)',
                color: 'var(--bg)',
              }}
            >
              close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
