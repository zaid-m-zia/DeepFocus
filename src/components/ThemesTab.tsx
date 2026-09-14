import React, { useState } from 'react';
import { THEMES, Theme, applyTheme, setStoredThemeId, getStoredThemeId } from '../utils/theme';
import { playClick, triggerHaptic } from '../utils/audio';
import { Check } from 'lucide-react';

interface ThemesTabProps {
  currentThemeId?: string;
  onSelectTheme?: (themeId: string) => void;
}

export const ThemesTab: React.FC<ThemesTabProps> = ({
  currentThemeId: propThemeId,
  onSelectTheme,
}) => {
  const [localThemeId, setLocalThemeId] = useState<string>(() => propThemeId || getStoredThemeId());
  const [filterType, setFilterType] = useState<'all' | 'dark' | 'light'>('all');

  // Use the prop if passed, otherwise use local state
  const activeId = propThemeId || localThemeId;
  const currentTheme = THEMES.find((t) => t.id === activeId) || THEMES[0];

  const handleChoose = (theme: Theme) => {
    playClick();
    triggerHaptic('light');

    // 1. Immediately apply CSS variables to the document root
    applyTheme(theme);

    // 2. Persist to localStorage
    setStoredThemeId(theme.id);

    // 3. Update local state
    setLocalThemeId(theme.id);

    // 4. Notify parent component if provided
    if (onSelectTheme) {
      onSelectTheme(theme.id);
    }
  };

  const displayedThemes = THEMES.filter((t) => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  return (
    <div className="space-y-6 pb-28 max-w-lg mx-auto">
      {/* Editorial Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Themes
          </h1>
          <span
            className="text-xs font-mono px-2 py-0.5 border"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--surface)',
              color: 'var(--sub)',
            }}
          >
            {THEMES.length} palettes
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--sub)' }}>
          Click any palette to instantly re-theme the entire application.
        </p>
      </div>

      {/* Active Theme Info Strip */}
      <div
        className="p-3.5 flex items-center justify-between border"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--main)',
        }}
      >
        <div className="space-y-0.5">
          <div className="text-[10px] uppercase tracking-wider font-mono" style={{ color: 'var(--sub)' }}>
            active theme
          </div>
          <div className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <span>{currentTheme.name}</span>
            <span
              className="text-[10px] font-mono uppercase px-1.5 py-0.2"
              style={{
                backgroundColor: 'var(--bg)',
                color: 'var(--main)',
              }}
            >
              {currentTheme.type}
            </span>
          </div>
        </div>

        {/* 4-Color Swatch Strip */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-5 border"
            style={{ backgroundColor: currentTheme.bg, borderColor: 'var(--sub)' }}
            title="Background"
          />
          <div
            className="w-5 h-5 border"
            style={{ backgroundColor: currentTheme.surface, borderColor: 'var(--sub)' }}
            title="Surface"
          />
          <div
            className="w-5 h-5 border"
            style={{ backgroundColor: currentTheme.sub, borderColor: 'var(--sub)' }}
            title="Sub / Muted"
          />
          <div
            className="w-5 h-5 border"
            style={{ backgroundColor: currentTheme.main, borderColor: 'var(--sub)' }}
            title="Accent / Main"
          />
        </div>
      </div>

      {/* Filter Tabs (All / Dark / Light) */}
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-[11px]" style={{ color: 'var(--sub)' }}>
          showing {displayedThemes.length} of {THEMES.length}
        </span>
        <div className="flex gap-1">
          {(['all', 'dark', 'light'] as const).map((mode) => {
            const isSelected = filterType === mode;
            return (
              <button
                key={mode}
                onClick={() => {
                  setFilterType(mode);
                  playClick();
                }}
                className="px-2.5 py-1 border uppercase text-[10px] font-bold transition-colors cursor-pointer"
                style={{
                  backgroundColor: isSelected ? 'var(--main)' : 'var(--surface)',
                  color: isSelected ? 'var(--bg)' : 'var(--sub)',
                  borderColor: isSelected ? 'var(--main)' : 'var(--surface)',
                }}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of All Themes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayedThemes.map((theme) => {
          const isActive = theme.id === activeId;

          return (
            <button
              key={theme.id}
              id={`theme-btn-${theme.id}`}
              onClick={() => handleChoose(theme)}
              className="text-left p-3.5 transition-all border group cursor-pointer"
              style={{
                backgroundColor: theme.bg,
                borderColor: isActive ? theme.main : theme.surface,
                outline: isActive ? `1px solid ${theme.main}` : 'none',
              }}
            >
              {/* Card Header: Name + Badge */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="font-bold text-sm tracking-tight font-sans"
                    style={{ color: theme.text }}
                  >
                    {theme.name}
                  </span>
                  <span
                    className="text-[10px] font-mono px-1 py-0.2 uppercase"
                    style={{
                      backgroundColor: theme.surface,
                      color: theme.sub,
                    }}
                  >
                    {theme.type}
                  </span>
                </div>

                {isActive && (
                  <div
                    className="flex items-center gap-1 text-[11px] font-mono font-bold"
                    style={{ color: theme.main }}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>active</span>
                  </div>
                )}
              </div>

              {/* Sample Typography Preview in Theme's Palette */}
              <div
                className="p-2.5 mb-2.5 flex items-center justify-between border"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.surface,
                }}
              >
                <span
                  className="text-xs font-mono tabular-nums font-bold tracking-wider"
                  style={{ color: theme.main }}
                >
                  25:00
                </span>
                <span
                  className="text-[11px] font-sans"
                  style={{ color: theme.text }}
                >
                  deep study
                </span>
                <span
                  className="text-[10px] font-mono"
                  style={{ color: theme.sub }}
                >
                  focus
                </span>
              </div>

              {/* Color Swatch Dots */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-3.5 h-3.5 border"
                    style={{ backgroundColor: theme.bg, borderColor: theme.sub }}
                  />
                  <span
                    className="w-3.5 h-3.5 border"
                    style={{ backgroundColor: theme.surface, borderColor: theme.sub }}
                  />
                  <span
                    className="w-3.5 h-3.5 border"
                    style={{ backgroundColor: theme.sub, borderColor: theme.sub }}
                  />
                  <span
                    className="w-3.5 h-3.5"
                    style={{ backgroundColor: theme.main }}
                  />
                </div>

                <span
                  className="text-[10px] font-mono"
                  style={{ color: theme.sub }}
                >
                  {theme.id}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
