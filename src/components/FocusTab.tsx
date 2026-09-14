import React, { useState } from 'react';
import { Task, AmbientSoundType } from '../types';
import { playClick, triggerHaptic } from '../utils/audio';

interface FocusTabProps {
  tasks: Task[];
  currentStreak: number;
  onStartFocus: (durationMin: number, goal: string, linkedTask?: Task, sound?: AmbientSoundType) => void;
}

const PRESETS = [
  { min: 15, label: '15' },
  { min: 25, label: '25' },
  { min: 50, label: '50' },
  { min: 90, label: '90' },
];

export const FocusTab: React.FC<FocusTabProps> = ({
  tasks,
  currentStreak,
  onStartFocus,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(25);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customMinutes, setCustomMinutes] = useState<number>(35);
  const [goal, setGoal] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('off');

  const uncompletedTasks = tasks.filter((t) => !t.completed);

  const handleSelectPreset = (min: number) => {
    setIsCustomMode(false);
    setSelectedDuration(min);
    playClick();
    triggerHaptic('light');
  };

  const handleCustomToggle = () => {
    setIsCustomMode(true);
    playClick();
    triggerHaptic('light');
  };

  const handleStart = () => {
    const finalDuration = isCustomMode ? customMinutes : selectedDuration;
    const linkedTask = tasks.find((t) => t.id === selectedTaskId);
    playClick();
    triggerHaptic('medium');
    onStartFocus(finalDuration, goal.trim() || 'Deep Study Session', linkedTask, ambientSound);
  };

  const currentDurationDisplay = isCustomMode ? customMinutes : selectedDuration;

  return (
    <div className="space-y-8 pb-28 max-w-lg mx-auto">
      {/* Top Status Strip: Streak & Mode Indicator */}
      <div className="flex items-center justify-between text-xs font-mono pt-1">
        <div className="flex items-center gap-2" style={{ color: 'var(--sub)' }}>
          <span>streak</span>
          <span className="font-bold" style={{ color: 'var(--main)' }}>
            {currentStreak}d
          </span>
        </div>
        <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--sub)' }}>
          lockdown focus
        </div>
      </div>

      {/* Hero Centerpiece: Massive Tabular Numeral Display */}
      <div className="text-center py-6 select-none">
        <div
          className="text-7xl sm:text-8xl font-bold font-mono tabular-nums tracking-tight leading-none"
          style={{ color: 'var(--main)' }}
        >
          {String(currentDurationDisplay).padStart(2, '0')}:00
        </div>
        <div className="text-xs font-mono uppercase tracking-widest mt-3" style={{ color: 'var(--sub)' }}>
          target duration
        </div>
      </div>

      {/* Preset Row: Minimalist Typewriter-style Selectors */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2">
          {PRESETS.map((p) => {
            const active = !isCustomMode && selectedDuration === p.min;
            return (
              <button
                key={p.min}
                id={`preset-btn-${p.min}`}
                onClick={() => handleSelectPreset(p.min)}
                className="px-4 py-2 text-sm font-mono transition-colors border"
                style={{
                  backgroundColor: active ? 'var(--main)' : 'var(--surface)',
                  color: active ? 'var(--bg)' : 'var(--text)',
                  borderColor: active ? 'var(--main)' : 'var(--surface)',
                }}
              >
                {p.label}m
              </button>
            );
          })}

          <button
            id="preset-btn-custom"
            onClick={handleCustomToggle}
            className="px-4 py-2 text-sm font-mono transition-colors border"
            style={{
              backgroundColor: isCustomMode ? 'var(--main)' : 'var(--surface)',
              color: isCustomMode ? 'var(--bg)' : 'var(--text)',
              borderColor: isCustomMode ? 'var(--main)' : 'var(--surface)',
            }}
          >
            custom
          </button>
        </div>

        {/* Custom Slider Drawer (if custom mode active) */}
        {isCustomMode && (
          <div
            className="p-4 border space-y-3"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--surface)',
            }}
          >
            <div className="flex justify-between text-xs font-mono">
              <span style={{ color: 'var(--sub)' }}>custom duration</span>
              <span className="font-bold" style={{ color: 'var(--main)' }}>
                {customMinutes} minutes
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="180"
              step="5"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Number(e.target.value))}
              className="w-full h-1 cursor-pointer appearance-none"
              style={{
                accentColor: 'var(--main)',
                backgroundColor: 'var(--sub)',
              }}
            />
            <div className="flex justify-between text-[10px] font-mono" style={{ color: 'var(--sub)' }}>
              <span>5m</span>
              <span>45m</span>
              <span>90m</span>
              <span>180m</span>
            </div>
          </div>
        )}
      </div>

      {/* Goal & Task Section: Sharp, Editorial, Flat */}
      <div className="space-y-4 pt-2">
        {/* Goal Input */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--sub)' }}>
            session objective
          </label>
          <input
            id="focus-goal-input"
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Chapter 4 problem set, Review biology notes..."
            className="w-full px-3.5 py-2.5 text-sm font-sans border transition-colors outline-none"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--surface)',
              color: 'var(--text)',
            }}
          />
        </div>

        {/* Link to Todoist Task (if tasks exist) */}
        {uncompletedTasks.length > 0 && (
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--sub)' }}>
              link to task
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => {
                setSelectedTaskId(e.target.value);
                const task = tasks.find((t) => t.id === e.target.value);
                if (task && (!goal || goal === 'Deep Study Session')) {
                  setGoal(task.title);
                }
              }}
              className="w-full px-3 py-2 text-xs font-mono border outline-none cursor-pointer"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--surface)',
                color: 'var(--text)',
              }}
            >
              <option value="">-- none (standalone session) --</option>
              {uncompletedTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.priority.toUpperCase()}] {t.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Ambient Tone Selector */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider mb-1.5" style={{ color: 'var(--sub)' }}>
            sound generator
          </label>
          <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
            {[
              { id: 'off', label: 'off' },
              { id: 'rain', label: 'rain' },
              { id: 'whitenoise', label: 'white' },
              { id: 'binaural', label: '40hz' },
            ].map((snd) => {
              const active = ambientSound === snd.id;
              return (
                <button
                  key={snd.id}
                  type="button"
                  onClick={() => {
                    setAmbientSound(snd.id as AmbientSoundType);
                    playClick();
                  }}
                  className="py-1.5 text-center transition-colors border"
                  style={{
                    backgroundColor: active ? 'var(--main)' : 'var(--surface)',
                    color: active ? 'var(--bg)' : 'var(--text)',
                    borderColor: active ? 'var(--main)' : 'var(--surface)',
                  }}
                >
                  {snd.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Start Action: Flat, High-contrast, Decisive */}
      <div className="pt-2 space-y-2">
        <button
          id="btn-start-focus-session"
          onClick={handleStart}
          className="w-full py-3.5 px-6 font-mono text-sm uppercase tracking-widest font-bold transition-opacity hover:opacity-90 active:opacity-100"
          style={{
            backgroundColor: 'var(--main)',
            color: 'var(--bg)',
          }}
        >
          start session &rarr;
        </button>

        <p className="text-center text-[10px] font-mono" style={{ color: 'var(--sub)' }}>
          tab switching triggers distraction detection
        </p>
      </div>
    </div>
  );
};
