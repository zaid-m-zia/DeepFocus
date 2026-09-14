import React from 'react';
import { TabType } from '../types';
import { triggerHaptic, playClick } from '../utils/audio';

interface NavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  tasksCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  tasksCount,
}) => {
  const handleTabClick = (tab: TabType) => {
    if (tab !== activeTab) {
      playClick();
      triggerHaptic('light');
      onChangeTab(tab);
    }
  };

  const navItems: { id: TabType; label: string; count?: number }[] = [
    { id: 'focus', label: 'focus' },
    { id: 'dashboard', label: 'stats' },
    { id: 'tasks', label: 'tasks', count: tasksCount },
    { id: 'themes', label: 'themes' },
  ];

  return (
    <nav
      id="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto border-t ios-safe-bottom"
      style={{
        backgroundColor: 'var(--bg)',
        borderColor: 'var(--surface)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => handleTabClick(item.id)}
              className="px-3 py-1.5 transition-colors relative flex items-center gap-1.5 font-mono text-xs tracking-wider"
              style={{
                color: isActive ? 'var(--main)' : 'var(--sub)',
              }}
            >
              <span className={isActive ? 'font-bold' : 'font-normal hover:opacity-80'}>
                {isActive ? `_${item.label}` : item.label}
              </span>

              {typeof item.count === 'number' && item.count > 0 && (
                <span
                  className="text-[10px] px-1 font-mono"
                  style={{
                    backgroundColor: isActive ? 'var(--main)' : 'var(--surface)',
                    color: isActive ? 'var(--bg)' : 'var(--sub)',
                  }}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
