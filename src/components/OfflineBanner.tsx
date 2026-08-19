import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      id="offline-banner"
      className="bg-slate-900 text-amber-500 border-b border-amber-500/30 px-4 py-2 text-xs font-mono font-bold flex items-center justify-center gap-2 sticky top-[49px] z-30 shadow-md"
    >
      <WifiOff className="w-4 h-4 text-amber-500" />
      <span>Sem conexão — dados salvos localmente</span>
    </div>
  );
};
