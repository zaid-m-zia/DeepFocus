import React, { useState } from 'react';
import { Task, TaskPriority } from '../types';
import { playClick, triggerHaptic } from '../utils/audio';
import { formatDateKey } from '../utils/storage';
import { Check, Trash2, Play, Clock, Calendar, ArrowRight } from 'lucide-react';

interface TasksTabProps {
  tasks: Task[];
  onAddTask: (
    task: Omit<Task, 'id' | 'createdAt' | 'focusMinutesSpent'>,
    startImmediately?: boolean
  ) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onStartFocusForTask: (task: Task) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onStartFocusForTask,
}) => {
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [isAdding, setIsAdding] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('p2');
  const [startDate, setStartDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [estimatedDurationMin, setEstimatedDurationMin] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState<string>('');

  const todayStr = formatDateKey(new Date());

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setPriority('p2');
    setStartDate('');
    setStartTime('');
    setEstimatedDurationMin('');
    setDueDate('');
    setIsAdding(false);
  };

  const handleCreateTask = (e?: React.FormEvent, startImmediately = false) => {
    if (e) e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const parsedDuration =
      typeof estimatedDurationMin === 'number' && estimatedDurationMin > 0
        ? estimatedDurationMin
        : undefined;

    onAddTask(
      {
        title: trimmedTitle,
        notes: notes.trim() || undefined,
        priority,
        startDate: startDate || undefined,
        startTime: startTime || undefined,
        estimatedDurationMin: parsedDuration,
        dueDate: dueDate || undefined,
        completed: false,
      },
      startImmediately
    );

    resetForm();
    playClick();
    triggerHaptic('light');
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'completed') return t.completed;
    if (filter === 'today') {
      return (
        !t.completed &&
        (t.dueDate === todayStr || t.startDate === todayStr)
      );
    }
    if (filter === 'upcoming') {
      return (
        !t.completed &&
        ((t.dueDate && t.dueDate > todayStr) || (t.startDate && t.startDate > todayStr))
      );
    }
    return !t.completed;
  });

  return (
    <div className="space-y-6 pb-28 max-w-lg mx-auto">
      {/* Header & Filter Controls */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          Tasks
        </h1>
        <div className="flex gap-1 font-mono text-xs">
          {(['all', 'today', 'upcoming', 'completed'] as const).map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  playClick();
                }}
                className="px-2 py-1 border transition-colors"
                style={{
                  backgroundColor: isActive ? 'var(--main)' : 'var(--surface)',
                  color: isActive ? 'var(--bg)' : 'var(--sub)',
                  borderColor: isActive ? 'var(--main)' : 'var(--surface)',
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Task Trigger / Form */}
      {!isAdding ? (
        <button
          id="btn-open-add-task"
          onClick={() => {
            setIsAdding(true);
            playClick();
          }}
          className="w-full py-3 px-4 border text-left font-mono text-xs transition-opacity hover:opacity-90 flex items-center justify-between cursor-pointer"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--surface)',
            color: 'var(--sub)',
          }}
        >
          <span>+ add new task...</span>
          <span className="text-[10px]" style={{ color: 'var(--main)' }}>
            [start when • duration • due date]
          </span>
        </button>
      ) : (
        <form
          onSubmit={(e) => handleCreateTask(e, false)}
          className="p-4 border space-y-4 transition-all"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--main)',
          }}
        >
          {/* Header indicator */}
          <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: 'var(--sub)' }}>
            <span className="uppercase tracking-wider font-bold" style={{ color: 'var(--main)' }}>
              New Task
            </span>
            <span>all timing fields optional</span>
          </div>

          {/* Title Input */}
          <input
            type="text"
            placeholder="Task title (e.g. Read Neuro Chapter 4, Problem Set 2)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full p-2.5 text-sm font-sans border outline-none font-medium"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--sub)',
              color: 'var(--text)',
            }}
          />

          {/* Notes Input */}
          <input
            type="text"
            placeholder="Notes, study prompts or references (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 text-xs font-sans border outline-none"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--sub)',
              color: 'var(--text)',
            }}
          />

          {/* Priority Row */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t" style={{ borderColor: 'var(--bg)' }}>
            <span className="text-[11px] font-mono" style={{ color: 'var(--sub)' }}>
              priority:
            </span>
            <div className="flex items-center gap-1 font-mono text-xs">
              {(['p1', 'p2', 'p3', 'p4'] as const).map((p) => {
                const active = priority === p;
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => {
                      setPriority(p);
                      playClick();
                    }}
                    className="px-2.5 py-0.5 border uppercase font-bold"
                    style={{
                      backgroundColor: active ? 'var(--main)' : 'var(--bg)',
                      color: active ? 'var(--bg)' : 'var(--sub)',
                      borderColor: active ? 'var(--main)' : 'var(--sub)',
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timing Section: Start Date/Time, Duration, Due Date */}
          <div
            className="p-3 border space-y-3 font-mono text-xs"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--bg)',
            }}
          >
            {/* 1. When to start (optional) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase flex items-center gap-1" style={{ color: 'var(--main)' }}>
                  <Calendar className="w-3 h-3" />
                  <span>Start When (optional)</span>
                </span>
                {startDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate('');
                      setStartTime('');
                    }}
                    className="text-[10px] hover:opacity-100 opacity-60 underline"
                    style={{ color: 'var(--sub)' }}
                  >
                    clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="p-1.5 text-xs border outline-none flex-1 font-mono"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--sub)',
                    color: 'var(--text)',
                  }}
                />
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="p-1.5 text-xs border outline-none w-28 font-mono"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--sub)',
                    color: 'var(--text)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setStartDate(todayStr);
                    playClick();
                  }}
                  className="px-2 py-1.5 border text-[10px] uppercase font-bold"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--sub)',
                    color: 'var(--sub)',
                  }}
                >
                  today
                </button>
              </div>
            </div>

            {/* 2. Estimated Duration (optional) */}
            <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: 'var(--surface)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase flex items-center gap-1" style={{ color: 'var(--main)' }}>
                  <Clock className="w-3 h-3" />
                  <span>Duration (optional)</span>
                </span>
                {estimatedDurationMin !== '' && (
                  <button
                    type="button"
                    onClick={() => setEstimatedDurationMin('')}
                    className="text-[10px] hover:opacity-100 opacity-60 underline"
                    style={{ color: 'var(--sub)' }}
                  >
                    clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="480"
                  placeholder="Minutes (e.g. 25)"
                  value={estimatedDurationMin}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEstimatedDurationMin(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1));
                  }}
                  className="p-1.5 text-xs border outline-none w-32 font-mono"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--sub)',
                    color: 'var(--text)',
                  }}
                />

                {/* Quick Presets */}
                <div className="flex items-center gap-1 flex-wrap">
                  {[15, 25, 45, 60, 90].map((m) => {
                    const isSelected = estimatedDurationMin === m;
                    return (
                      <button
                        type="button"
                        key={m}
                        onClick={() => {
                          setEstimatedDurationMin(m);
                          playClick();
                        }}
                        className="px-2 py-1 border text-[10px] font-mono transition-colors"
                        style={{
                          backgroundColor: isSelected ? 'var(--main)' : 'var(--surface)',
                          color: isSelected ? 'var(--bg)' : 'var(--sub)',
                          borderColor: isSelected ? 'var(--main)' : 'var(--sub)',
                        }}
                      >
                        {m}m
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-[10px] font-mono" style={{ color: 'var(--sub)' }}>
                {estimatedDurationMin
                  ? `Specifying ${estimatedDurationMin}m enables instant 1-click focus session starting directly from this task.`
                  : 'Optional. If specified, you can launch a matching focus timer directly on this task.'}
              </p>
            </div>

            {/* 3. When is it due (optional) */}
            <div className="space-y-1 pt-2 border-t" style={{ borderColor: 'var(--surface)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase flex items-center gap-1" style={{ color: 'var(--main)' }}>
                  <Calendar className="w-3 h-3" />
                  <span>Due Date (optional)</span>
                </span>
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => setDueDate('')}
                    className="text-[10px] hover:opacity-100 opacity-60 underline"
                    style={{ color: 'var(--sub)' }}
                  >
                    clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="p-1.5 text-xs border outline-none flex-1 font-mono"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--sub)',
                    color: 'var(--text)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setDueDate(todayStr);
                    playClick();
                  }}
                  className="px-2 py-1.5 border text-[10px] uppercase font-bold"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--sub)',
                    color: 'var(--sub)',
                  }}
                >
                  today
                </button>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 font-mono text-xs border-t" style={{ borderColor: 'var(--bg)' }}>
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 transition-colors cursor-pointer hover:opacity-100 opacity-60"
              style={{ color: 'var(--sub)' }}
            >
              [cancel]
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-4 py-2 font-bold uppercase transition-opacity hover:opacity-90 disabled:opacity-40 border cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--main)',
                  color: 'var(--main)',
                }}
              >
                save task
              </button>

              {/* Option to start focus immediately upon adding if title is present */}
              <button
                type="button"
                disabled={!title.trim()}
                onClick={() => handleCreateTask(undefined, true)}
                className="px-4 py-2 font-bold uppercase transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                style={{
                  backgroundColor: 'var(--main)',
                  color: 'var(--bg)',
                }}
                title="Save and start focus session immediately"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>
                  {typeof estimatedDurationMin === 'number' && estimatedDurationMin > 0
                    ? `Save & Start ${estimatedDurationMin}m`
                    : 'Save & Start Focus'}
                </span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div
            className="p-8 border text-center font-mono text-xs space-y-1"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--surface)',
              color: 'var(--sub)',
            }}
          >
            <div>no tasks in this view</div>
            <div className="text-[10px]">add a task above with optional start time & duration</div>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const hasDuration = typeof task.estimatedDurationMin === 'number' && task.estimatedDurationMin > 0;

            return (
              <div
                key={task.id}
                id={`task-item-${task.id}`}
                className="p-3 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--surface)',
                  opacity: task.completed ? 0.6 : 1,
                }}
              >
                {/* Left: Square Checkbox & Title & Meta */}
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      onToggleTask(task.id);
                      playClick();
                      triggerHaptic('light');
                    }}
                    className="w-4 h-4 border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer"
                    style={{
                      backgroundColor: task.completed ? 'var(--main)' : 'var(--bg)',
                      borderColor: task.completed ? 'var(--main)' : 'var(--sub)',
                    }}
                    title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.completed && (
                      <Check className="w-3 h-3 stroke-[3]" style={{ color: 'var(--bg)' }} />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm font-sans break-words ${
                        task.completed ? 'line-through' : 'font-medium'
                      }`}
                      style={{ color: 'var(--text)' }}
                    >
                      {task.title}
                    </div>

                    {task.notes && (
                      <div className="text-xs font-sans mt-0.5 line-clamp-1" style={{ color: 'var(--sub)' }}>
                        {task.notes}
                      </div>
                    )}

                    {/* Metadata tags: Priority, Start, Duration, Due, Focus logged */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 font-mono text-[10px]" style={{ color: 'var(--sub)' }}>
                      <span className="uppercase font-bold" style={{ color: 'var(--main)' }}>
                        [{task.priority}]
                      </span>

                      {task.startDate && (
                        <span className="flex items-center gap-0.5">
                          <span style={{ color: 'var(--main)' }}>start:</span>
                          <span>
                            {task.startDate === todayStr ? 'today' : task.startDate}
                            {task.startTime ? ` ${task.startTime}` : ''}
                          </span>
                        </span>
                      )}

                      {hasDuration && (
                        <span className="flex items-center gap-0.5 font-bold" style={{ color: 'var(--main)' }}>
                          <Clock className="w-2.5 h-2.5 inline" />
                          <span>{task.estimatedDurationMin}m target</span>
                        </span>
                      )}

                      {task.dueDate && (
                        <span className="flex items-center gap-0.5">
                          <span>due:</span>
                          <span>{task.dueDate === todayStr ? 'today' : task.dueDate}</span>
                        </span>
                      )}

                      {task.focusMinutesSpent > 0 && (
                        <span className="underline">
                          {task.focusMinutesSpent}m focused
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Instant Focus Button & Delete */}
                <div className="flex items-center gap-2 font-mono text-xs shrink-0 self-end sm:self-center">
                  {!task.completed && (
                    <button
                      id={`btn-focus-task-${task.id}`}
                      onClick={() => {
                        playClick();
                        triggerHaptic('medium');
                        onStartFocusForTask(task);
                      }}
                      className="px-3 py-1.5 border font-bold uppercase transition-all hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      style={{
                        backgroundColor: hasDuration ? 'var(--main)' : 'var(--bg)',
                        borderColor: 'var(--main)',
                        color: hasDuration ? 'var(--bg)' : 'var(--main)',
                      }}
                      title={`Start focus timer right now for "${task.title}"`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>
                        {hasDuration ? `${task.estimatedDurationMin}m focus` : 'focus'}
                      </span>
                      <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onDeleteTask(task.id);
                      playClick();
                      triggerHaptic('light');
                    }}
                    className="p-1.5 transition-colors hover:opacity-100 opacity-50 cursor-pointer"
                    style={{ color: 'var(--sub)' }}
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
