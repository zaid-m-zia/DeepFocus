import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallButtonProps {
  onOpenAirDropModal: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ onOpenAirDropModal }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standaloneCheck =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standaloneCheck);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsStandalone(true);
        setDeferredPrompt(null);
      }
    } else {
      onOpenAirDropModal();
    }
  };

  if (isStandalone) {
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] uppercase border"
        style={{
          borderColor: 'var(--main)',
          color: 'var(--main)',
        }}
      >
        <span className="w-1.5 h-1.5" style={{ backgroundColor: 'var(--main)' }} />
        <span>installed</span>
      </div>
    );
  }

  return (
    <button
      id="btn-install-pwa"
      onClick={handleInstallClick}
      className="flex items-center gap-1 px-2.5 py-1 font-mono text-xs uppercase border transition-colors"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--surface)',
        color: 'var(--main)',
      }}
    >
      <span>{deferredPrompt ? 'install' : 'export/pwa'}</span>
    </button>
  );
};
