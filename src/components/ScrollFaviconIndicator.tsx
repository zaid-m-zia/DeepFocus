import React, { useEffect, useState, useRef } from 'react';

export const ScrollFaviconIndicator: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [topPos, setTopPos] = useState(16);
  const [direction, setDirection] = useState<'down' | 'up'>('down');
  const timerRef = useRef<number | null>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const docElem = document.documentElement;
      const scrollTotal = docElem.scrollHeight - window.innerHeight;

      // Only show if the document has enough content to be scrolled
      if (scrollTotal <= 20) {
        setIsVisible(false);
        return;
      }

      const currentY = window.scrollY || docElem.scrollTop;
      const scrollDelta = currentY - lastScrollY.current;

      if (Math.abs(scrollDelta) > 1) {
        setDirection(scrollDelta > 0 ? 'down' : 'up');
      }
      lastScrollY.current = currentY;

      // Compute scroll percentage (0 to 1)
      const progress = Math.min(1, Math.max(0, currentY / scrollTotal));

      // Calculate track bounds (leave room for top safe area and bottom nav bar)
      const topMargin = 16;
      const bottomMargin = 84;
      const indicatorSize = 30;
      const availableTrack = Math.max(
        0,
        window.innerHeight - topMargin - bottomMargin - indicatorSize
      );

      const computedTop = topMargin + progress * availableTrack;
      setTopPos(computedTop);

      // Make visible immediately upon scroll
      setIsVisible(true);

      // Clear any pending fadeout timer
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      // Hide indicator after scrolling stops (850ms inactivity)
      timerRef.current = window.setTimeout(() => {
        setIsVisible(false);
      }, 850);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div
      id="scroll-favicon-indicator"
      className="fixed right-2 sm:right-3.5 z-50 pointer-events-none transition-all duration-300 select-none flex items-center justify-center"
      style={{
        top: `${topPos}px`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? `scale(1) translateY(0)`
          : `scale(0.65) translateY(${direction === 'down' ? '-4px' : '4px'})`,
        transitionProperty: 'opacity, transform, top',
        transitionDuration: isVisible ? '100ms, 180ms, 60ms' : '300ms, 300ms, 60ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      aria-hidden="true"
    >
      {/* Mini Favicon Floating Indicator Badge */}
      <div
        className="w-7 h-7 sm:w-7.5 sm:h-7.5 border flex items-center justify-center transition-colors"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--main)',
          outline: '1px solid var(--bg)',
        }}
        title="Scroll Position"
      >
        {/* DeepFocus Favicon SVG matching active theme */}
        <svg
          viewBox="0 0 512 512"
          className="w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform duration-200"
          style={{
            transform: direction === 'down' ? 'rotate(0deg)' : 'rotate(180deg)',
          }}
        >
          {/* Outer Focus Ring with dasharray */}
          <circle
            cx="256"
            cy="256"
            r="170"
            fill="none"
            stroke="var(--sub)"
            strokeWidth="32"
            strokeDasharray="28 20"
            strokeOpacity="0.45"
          />
          {/* Active Accent Arc */}
          <circle
            cx="256"
            cy="256"
            r="170"
            fill="none"
            stroke="var(--main)"
            strokeWidth="40"
            strokeLinecap="round"
            strokeDasharray="440 560"
          />
          {/* Mid Target Ring */}
          <circle
            cx="256"
            cy="256"
            r="105"
            fill="none"
            stroke="var(--sub)"
            strokeWidth="24"
            strokeOpacity="0.4"
          />
          {/* Inner Core Bullseye */}
          <circle cx="256" cy="256" r="56" fill="var(--main)" />
          {/* Center Pin */}
          <circle cx="256" cy="256" r="20" fill="var(--bg)" />
        </svg>
      </div>
    </div>
  );
};
