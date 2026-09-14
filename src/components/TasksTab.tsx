import React, { useState } from 'react';
import { Task, TaskPriority } from '../types';
import { playClick, triggerHaptic } from '../utils/audio';
import { formatDateKey } from '../utils/storage';
import { Check, Plus, Trash2 } from 'lucide-react';

interface TasksTabProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'focusMinutesSpent'>) => void;
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
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('p2');
  const [dueDate, setDueDate] = useState<string>(formatDateKey(new Date()));

  const todayStr = formatDateKey(new Date());

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      notes: notes.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      completed: false,
    });

    setTitle('');
    setNotes('');
    setIsAdding(false);
    playClick();
    triggerHaptic('light');
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'completed') return t.completed;
    if (filter === 'today') return !t.completed && t.dueDate === todayStr;
    if (filter === 'upcoming') return !t.completed && t.dueDate && t.dueDate > todayStr;
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
          className="w-full py-3 px-4 border text-left font-mono text-xs transition-opacity hover:opacity-90 flex items-center justify-between"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--surface)',
            color: 'var(--sub)',
          }}
        >
          <span>+ add new task...</span>
          <span className="text-[10px]" style={{ color: 'var(--main)' }}>[press to write]</span>
        </button>
      ) : (
        <form
          onSubmit={handleCreateTask}
          className="p-4 border space-y-3"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--main)',
          }}
        >
          <input
            type="text"
            placeholder="Task title (e.g. Read Neuro Chapter 4, Problem Set 2)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full p-2 text-sm font-sans border outline-none"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--sub)',
              color: 'var(--text)',
            }}
          />

          <input
            type="text"
            placeholder="Notes or study prompts (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 text-xs font-sans border outline-none"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--sub)',
              color: 'var(--text)',
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {/* Priority Selector */}
            <div className="flex items-center gap-1 font-mono text-xs">
              <span className="text-[10px] mr-1" style={{ color: 'var(--sub)' }}>pri:</span>
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
                    className="px-2 py-0.5 border uppercase font-bold"
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

            {/* Due Date Picker */}
            <div className="flex items-center gap-1 font-mono text-xs">
              <span className="text-[10px]" style={{ color: 'var(--sub)' }}>due:</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="p-1 text-xs border outline-none"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--sub)',
                  color: 'var(--text)',
                }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 transition-colors"
              style={{ color: 'var(--sub)' }}
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-1.5 font-bold uppercase transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{
                backgroundColor: 'var(--main)',
                color: 'var(--bg)',
              }}
            >
              save task
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div
            className="p-8 border text-center font-mono text-xs"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--surface)',
              color: 'var(--sub)',
            }}
          >
            no tasks in this view
          </div>
        ) : (
          filteredTasks.map((task) => {
            return (
              <div
                key={task.id}
                className="p-3 border flex items-center justify-between gap-3 transition-colors"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--surface)',
                  opacity: task.completed ? 0.6 : 1,
                }}
              >
                {/* Left: Square Checkbox & Title */}
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      onToggleTask(task.id);
                      playClick();
                      triggerHaptic('light');
                    }}
                    className="w-4 h-4 border flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      backgroundColor: task.completed ? 'var(--main)' : 'var(--bg)',
                      borderColor: task.completed ? 'var(--main)' : 'var(--sub)',
                    }}
                  >
                    {task.completed && (
                      <Check className="w-3 h-3 stroke-[3]" style={{ color: 'var(--bg)' }} />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm font-sans ${
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

                    <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px]" style={{ color: 'var(--sub)' }}>
                      <span className="uppercase font-bold" style={{ color: 'var(--main)' }}>
                        [{task.priority}]
                      </span>
                      {task.dueDate && (
                        <span>{task.dueDate === todayStr ? 'today' : task.dueDate}</span>
                      )}
                      {task.focusMinutesSpent > 0 && (
                        <span>{task.focusMinutesSpent}m focused</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                  {!task.completed && (
                    <button
                      onClick={() => onStartFocusForTask(task)}
                      className="px-2 py-1 border font-bold uppercase transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: 'var(--bg)',
                        borderColor: 'var(--main)',
                        color: 'var(--main)',
                      }}
                      title="Focus on this task now"
                    >
                      focus
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onDeleteTask(task.id);
                      playClick();
                      triggerHaptic('light');
                    }}
                    className="p-1 transition-colors hover:opacity-100 opacity-50"
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
