import React, { useState } from 'react';
import { restoreFromRecoveryCode } from '../firebase';
import { playClick, triggerHaptic } from '../utils/audio';
import { Task, FocusSession, StreakState, Badge } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recoveryCode: string;
  userId?: string;
  isCloudSynced: boolean;
  onSyncNow: () => Promise<void>;
  onRestoreSuccess: (data: {
    tasks: Task[];
    sessions: FocusSession[];
    streak: StreakState;
    badges?: Badge[];
    recoveryCode: string;
  }) => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  recoveryCode,
  userId,
  isCloudSynced,
  onSyncNow,
  onRestoreSuccess,
  onClearAllData,
}) => {
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (!recoveryCode) return;
    navigator.clipboard.writeText(recoveryCode);
    setCopied(true);
    playClick();
    triggerHaptic('success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputCode.trim().toUpperCase();
    if (!trimmed) return;

    if (!confirm('Restoring will replace current study logs and tasks on this device with the cloud backup. Proceed?')) {
      return;
    }

    setIsRestoring(true);
    setRestoreStatus(null);
    playClick();

    try {
      const res = await restoreFromRecoveryCode(trimmed);
      if (res.success && res.data) {
        setRestoreStatus({ type: 'success', message: res.message });
        triggerHaptic('success');
        onRestoreSuccess(res.data);
        setInputCode('');
      } else {
        setRestoreStatus({ type: 'error', message: res.message });
        triggerHaptic('warning');
      }
    } catch {
      setRestoreStatus({
        type: 'error',
        message: 'An unexpected error occurred while restoring. Please check connection and retry.',
      });
      triggerHaptic('warning');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    playClick();
    await onSyncNow();
    setIsSyncing(false);
    triggerHaptic('success');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
    >
      <div
        className="max-w-md w-full p-6 border space-y-5 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--main)',
          color: 'var(--text)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--bg)' }}>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--main)' }}>
              anonymous sync
            </div>
            <h3 className="text-base font-bold font-sans">Settings & Cloud Backup</h3>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-xs hover:opacity-100 opacity-60"
            style={{ color: 'var(--sub)' }}
          >
            [close]
          </button>
        </div>

        {/* Sync Status */}
        <div
          className="flex items-center justify-between p-3 border text-xs font-mono"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--bg)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5"
              style={{ backgroundColor: isCloudSynced ? 'var(--main)' : 'var(--sub)' }}
            />
            <span style={{ color: 'var(--sub)' }}>
              {isCloudSynced ? 'cloud backup active' : 'syncing with firestore...'}
            </span>
          </div>

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-2 py-0.5 border uppercase text-[10px] transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{
              borderColor: 'var(--sub)',
              color: 'var(--main)',
            }}
          >
            {isSyncing ? 'syncing...' : 'sync now'}
          </button>
        </div>

        {/* Recovery Code Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: 'var(--sub)' }}>
            <span>YOUR RECOVERY CODE</span>
            {userId && <span>UID: {userId.slice(0, 8)}</span>}
          </div>

          <div
            className="p-3 border space-y-2"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--bg)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                id="user-recovery-code-display"
                className="text-lg font-bold font-mono tracking-wider select-all"
                style={{ color: 'var(--main)' }}
              >
                {recoveryCode || 'generating...'}
              </span>

              <button
                onClick={handleCopyCode}
                className="px-3 py-1 font-mono text-xs uppercase font-bold transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: 'var(--main)',
                  color: 'var(--bg)',
                }}
              >
                {copied ? 'copied!' : 'copy'}
              </button>
            </div>

            <p className="text-[11px] font-mono leading-relaxed pt-1" style={{ color: 'var(--sub)' }}>
              Save this code — it's the only way to restore your data on a new device. It cannot be recovered if lost.
            </p>
          </div>
        </div>

        {/* Restore Section */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase" style={{ color: 'var(--sub)' }}>
            RESTORE FROM CODE
          </div>

          <form onSubmit={handleRestore} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="DF-XXXX-XXXX"
                className="flex-1 p-2 text-xs font-mono border uppercase outline-none"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--sub)',
                  color: 'var(--text)',
                }}
              />
              <button
                type="submit"
                disabled={isRestoring || !inputCode.trim()}
                className="px-4 py-2 font-mono text-xs uppercase font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--main)',
                  color: 'var(--bg)',
                }}
              >
                {isRestoring ? 'restoring...' : 'restore'}
              </button>
            </div>

            {restoreStatus && (
              <div
                className="p-2 border text-xs font-mono"
                style={{
                  borderColor: restoreStatus.type === 'success' ? 'var(--main)' : 'var(--sub)',
                  color: restoreStatus.type === 'success' ? 'var(--main)' : 'var(--text)',
                }}
              >
                {restoreStatus.message}
              </div>
            )}
          </form>
        </div>

        {/* Reset / Actions */}
        <div className="pt-2 border-t flex justify-between items-center text-xs font-mono" style={{ borderColor: 'var(--bg)' }}>
          <button
            onClick={() => {
              if (confirm('Clear local study data on this device? (Cloud backup remains accessible via recovery code).')) {
                onClearAllData();
                onClose();
              }
            }}
            className="hover:opacity-100 opacity-60"
            style={{ color: 'var(--sub)' }}
          >
            [reset local data]
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1 border font-bold"
            style={{
              borderColor: 'var(--sub)',
              color: 'var(--text)',
            }}
          >
            close
          </button>
        </div>
      </div>
    </div>
  );
};
