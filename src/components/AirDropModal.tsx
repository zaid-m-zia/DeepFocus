import React, { useState } from 'react';
import { downloadStandaloneHtmlFile } from '../utils/airdropHtml';
import { playClick, triggerHaptic } from '../utils/audio';

interface AirDropModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AirDropModal: React.FC<AirDropModalProps> = ({ isOpen, onClose }) => {
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    downloadStandaloneHtmlFile();
    setDownloaded(true);
    playClick();
    triggerHaptic('success');
    setTimeout(() => setDownloaded(false), 4000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
    >
      <div
        className="max-w-md w-full p-6 border space-y-5"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--main)',
          color: 'var(--text)',
        }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--bg)' }}>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--main)' }}>
              export & install
            </div>
            <h3 className="text-base font-bold font-sans">Single-File HTML & PWA</h3>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-xs hover:opacity-100 opacity-60"
            style={{ color: 'var(--sub)' }}
          >
            [close]
          </button>
        </div>

        {/* Download Standalone File Button */}
        <div
          className="p-4 border space-y-3"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--bg)',
          }}
        >
          <p className="text-xs leading-relaxed" style={{ color: 'var(--sub)' }}>
            Download the 100% self-contained single-file HTML version (all CSS, Web Audio synthesizer, and JS included, zero build step):
          </p>

          <button
            onClick={handleDownload}
            className="w-full py-2.5 px-4 font-mono text-xs uppercase font-bold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--main)',
              color: 'var(--bg)',
            }}
          >
            {downloaded ? 'download complete!' : 'download deepfocus.html (airdrop)'}
          </button>
        </div>

        {/* 3-Step iOS Safari Guide */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase" style={{ color: 'var(--sub)' }}>
            ios safari installation:
          </div>

          <div className="space-y-1.5 font-mono text-xs" style={{ color: 'var(--text)' }}>
            <div className="p-2 border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--bg)' }}>
              1. AirDrop downloaded DeepFocus.html to iPhone or open in Safari
            </div>
            <div className="p-2 border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--bg)' }}>
              2. Tap Share icon in Safari toolbar
            </div>
            <div className="p-2 border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--bg)' }}>
              3. Tap &quot;Add to Home Screen&quot; for fullscreen lockdown mode
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 border font-mono text-xs uppercase font-bold"
          style={{
            borderColor: 'var(--sub)',
            color: 'var(--text)',
          }}
        >
          close
        </button>
      </div>
    </div>
  );
};
