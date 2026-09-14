import React, { useState, useEffect, useRef } from 'react';
import { FocusSession, Task, AmbientSoundType } from '../types';
import { playChime, playWarning, triggerHaptic, startAmbient, stopAmbient } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Volume2, VolumeX } from 'lucide-react';

interface ActiveFocusModeProps {
  plannedDurationMin: number;
  goal: string;
  linkedTask?: Task;
  ambientSound: AmbientSoundType;
  onComplete: (session: FocusSession) => void;
  onEndEarly: (session: FocusSession) => void;
}

export const ActiveFocusMode: React.FC<ActiveFocusModeProps> = ({
  plannedDurationMin,
  goal,
  linkedTask,
  ambientSound,
  onComplete,
  onEndEarly,
}) => {
  const totalSeconds = plannedDurationMin * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [distractionsCount, setDistractionsCount] = useState(0);
  const [isDistractionModalOpen, setIsDistractionModalOpen] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const startTimeRef = useRef(new Date().toISOString());
  const distractionLogsRef = useRef<{ timestamp: string; reason: string }[]>([]);
  const isPausedRef = useRef(false);
  const secondsRemainingRef = useRef(totalSeconds);

  // Sync ref
  useEffect(() => {
    secondsRemainingRef.current = secondsRemaining;
  }, [secondsRemaining]);

  // Request Fullscreen on mount if supported
  useEffect(() => {
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {
      // Graceful fallback
    }

    if (ambientSound !== 'off' && !isMuted) {
      startAmbient(ambientSound);
    }

    return () => {
      stopAmbient();
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch {
        // Graceful fallback
      }
    };
  }, [ambientSound]);

  // Page Visibility API - Distraction Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isCompleted && secondsRemainingRef.current > 0) {
        isPausedRef.current = true;
        setDistractionsCount((prev) => prev + 1);
        distractionLogsRef.current.push({
          timestamp: new Date().toISOString(),
          reason: 'Switched tabs or backgrounded the study session',
        });
        playWarning();
        triggerHaptic('warning');
        setIsDistractionModalOpen(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isCompleted]);

  // Main Timer Loop
  useEffect(() => {
    if (isCompleted) return;

    const timer = setInterval(() => {
      if (isPausedRef.current || isDistractionModalOpen || showQuitConfirm) {
        return;
      }

      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSessionFinished();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, isDistractionModalOpen, showQuitConfirm]);

  const handleSessionFinished = () => {
    setIsCompleted(true);
    stopAmbient();
    playChime();
    triggerHaptic('success');

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#c25530', '#8a8277', '#282420'],
      });
    } catch {
      // fallback
    }
  };

  const handleResumeFromDistraction = () => {
    isPausedRef.current = false;
    setIsDistractionModalOpen(false);
    triggerHaptic('light');
  };

  const handleConfirmEndEarly = () => {
    stopAmbient();
    const actualDurationSec = totalSeconds - secondsRemaining;
    const session: FocusSession = {
      id: `session-${Date.now()}`,
      goal,
      taskId: linkedTask?.id,
      taskTitle: linkedTask?.title,
      plannedDurationMin,
      actualDurationSec,
      startTime: startTimeRef.current,
      endTime: new Date().toISOString(),
      completed: false,
      distractionsCount: distractionsCount + 1,
      distractionLogs: [
        ...distractionLogsRef.current,
        {
          timestamp: new Date().toISOString(),
          reason: 'Ended session early before timer expired',
        },
      ],
    };
    onEndEarly(session);
  };

  const handleCompleteDone = () => {
    const session: FocusSession = {
      id: `session-${Date.now()}`,
      goal,
      taskId: linkedTask?.id,
      taskTitle: linkedTask?.title,
      plannedDurationMin,
      actualDurationSec: totalSeconds,
      startTime: startTimeRef.current,
      endTime: new Date().toISOString(),
      completed: true,
      distractionsCount,
      distractionLogs: distractionLogsRef.current,
    };
    onComplete(session);
  };

  const toggleSound = () => {
    if (isMuted) {
      setIsMuted(false);
      if (ambientSound !== 'off') startAmbient(ambientSound);
    } else {
      setIsMuted(true);
      stopAmbient();
    }
  };

  // Format time
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressRatio = (totalSeconds - secondsRemaining) / totalSeconds;
  const progressPercent = Math.min(100, Math.max(0, Math.round(progressRatio * 100)));

  return (
    <div
      id="active-focus-screen"
      className="fixed inset-0 z-50 flex flex-col justify-between p-6 select-none overflow-hidden relative"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {/* Static Background Dot Matrix Pattern */}
      <div className="dot-grid-bg" aria-hidden="true" />

      {/* Top Bar: Minimal Status Row */}
      <div className="flex items-center justify-between w-full max-w-md mx-auto pt-2 text-xs font-mono relative z-10">
        <div className="flex items-center gap-2" style={{ color: 'var(--sub)' }}>
          <span className="w-1.5 h-1.5" style={{ backgroundColor: 'var(--main)' }} />
          <span>focus locked</span>
        </div>

        <div className="flex items-center gap-4">
          {ambientSound !== 'off' && (
            <button
              onClick={toggleSound}
              className="p-1 transition-colors"
              style={{ color: isMuted ? 'var(--sub)' : 'var(--main)' }}
              title="Toggle Audio"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}

          <div
            id="focus-distraction-counter"
            className="flex items-center gap-1 text-[11px]"
            style={{ color: distractionsCount > 0 ? 'var(--main)' : 'var(--sub)' }}
          >
            <span>distractions:</span>
            <span className="font-bold font-mono">{distractionsCount}</span>
          </div>
        </div>
      </div>

      {/* Main Focus Area: The Grand Tabular Timer */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto max-w-md mx-auto w-full relative z-10">
        {!isCompleted ? (
          <div className="space-y-6 text-center w-full">
            {/* Visual Centerpiece: Tabular Numeral Display */}
            <div className="space-y-4">
              <div
                id="focus-countdown-digits"
                className="text-7xl sm:text-9xl font-bold font-mono tabular-nums tracking-tighter leading-none"
                style={{ color: 'var(--main)' }}
              >
                {timeString}
              </div>

              {/* Ultra-Clean Hairline Progress Bar */}
              <div className="w-48 sm:w-64 mx-auto h-[2px] bg-transparent relative overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
                <div
                  className="h-full transition-all duration-1000 ease-linear"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: 'var(--main)',
                  }}
                />
              </div>

              <div className="text-xs font-mono" style={{ color: 'var(--sub)' }}>
                {progressPercent}% elapsed &bull; {plannedDurationMin}m target
              </div>
            </div>

            {/* Objective & Task Note */}
            <div className="pt-4 max-w-xs mx-auto space-y-1">
              <div className="text-sm font-sans font-medium line-clamp-2" style={{ color: 'var(--text)' }}>
                {goal}
              </div>
              {linkedTask && (
                <div className="text-[11px] font-mono" style={{ color: 'var(--sub)' }}>
                  task: {linkedTask.title}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Completion Screen: Crisp & Restrained */
          <div
            className="p-6 border max-w-sm w-full space-y-5 text-left"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--main)',
            }}
          >
            <div className="space-y-1">
              <div className="text-xs font-mono uppercase tracking-wider" style={{ color: 'var(--main)' }}>
                session complete
              </div>
              <h2 className="text-xl font-bold font-sans" style={{ color: 'var(--text)' }}>
                {plannedDurationMin} minutes logged.
              </h2>
            </div>

            <div className="space-y-2 border-t pt-3 font-mono text-xs" style={{ borderColor: 'var(--bg)' }}>
              <div className="flex justify-between">
                <span style={{ color: 'var(--sub)' }}>objective</span>
                <span className="truncate max-w-[170px]" style={{ color: 'var(--text)' }}>{goal}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--sub)' }}>distractions</span>
                <span style={{ color: distractionsCount === 0 ? 'var(--main)' : 'var(--text)' }}>
                  {distractionsCount === 0 ? '0 (clean run)' : distractionsCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--sub)' }}>streak status</span>
                <span className="font-bold" style={{ color: 'var(--main)' }}>maintained</span>
              </div>
            </div>

            <button
              id="return-hub-btn"
              onClick={handleCompleteDone}
              className="w-full py-3 px-4 font-mono text-xs uppercase tracking-widest font-bold transition-opacity hover:opacity-90"
              style={{
                backgroundColor: 'var(--main)',
                color: 'var(--bg)',
              }}
            >
              continue &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action: Minimal Quit Trigger */}
      {!isCompleted && (
        <div className="w-full max-w-xs mx-auto pb-4 text-center relative z-10">
          <button
            id="btn-end-session-early"
            onClick={() => setShowQuitConfirm(true)}
            className="font-mono text-xs tracking-wider transition-colors hover:opacity-100 opacity-60"
            style={{ color: 'var(--sub)' }}
          >
            [ abort session ]
          </button>
        </div>
      )}

      {/* Distraction Alert Overlay */}
      {isDistractionModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-5"
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
                incident recorded
              </span>
              <h3 className="text-base font-bold font-sans">Distraction Caught</h3>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--sub)' }}>
              You switched away from DeepFocus. The timer paused to protect data integrity. Return to your workspace to resume.
            </p>

            <button
              id="btn-resume-focus"
              onClick={handleResumeFromDistraction}
              className="w-full py-2.5 px-4 font-mono text-xs uppercase tracking-wider font-bold transition-opacity hover:opacity-90"
              style={{
                backgroundColor: 'var(--main)',
                color: 'var(--bg)',
              }}
            >
              resume timer
            </button>
          </div>
        </div>
      )}

      {/* Quit Early Confirmation Modal */}
      {showQuitConfirm && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-5"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          <div
            className="max-w-xs w-full p-5 border space-y-4"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--sub)',
              color: 'var(--text)',
            }}
          >
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--main)' }}>
                confirm quit
              </span>
              <h3 className="text-base font-bold font-sans">Abandon this block?</h3>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--sub)' }}>
              Ending now logs this block as incomplete and breaks your streak progression.
            </p>

            <div className="space-y-2 pt-1 font-mono text-xs">
              <button
                id="btn-keep-focusing"
                onClick={() => setShowQuitConfirm(false)}
                className="w-full py-2.5 px-4 uppercase font-bold"
                style={{
                  backgroundColor: 'var(--main)',
                  color: 'var(--bg)',
                }}
              >
                keep focusing
              </button>
              <button
                id="btn-confirm-quit"
                onClick={handleConfirmEndEarly}
                className="w-full py-2 px-4 uppercase border transition-colors"
                style={{
                  borderColor: 'var(--sub)',
                  color: 'var(--sub)',
                }}
              >
                abort anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
