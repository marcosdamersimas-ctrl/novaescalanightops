import React, { useState, useEffect } from 'react';
import { LogOut, UserCheck, LayoutGrid, Download, X } from 'lucide-react';
import { UserSession, AppPage, Organization } from '../types';
import { SgeLogo } from './SgeLogo';
import { triggerHaptic } from '../utils/helpers';

interface MilitaryHeaderProps {
  session: UserSession;
  currentPage: AppPage;
  currentOrg?: Organization;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
  onReplayAbertura: () => void;
}

export const MilitaryHeader: React.FC<MilitaryHeaderProps> = ({
  session,
  currentPage,
  currentOrg,
  onNavigate,
  onLogout,
}) => {
  const [time, setTime] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);

  const isIOSSafari = () => {
    if (typeof navigator === 'undefined') return false;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = (window.navigator as any).standalone;
    return isIOS && !isStandalone;
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      }
      setDeferredPrompt(null);
    } else if (isIOSSafari()) {
      setShowIOSModal(true);
    }
  };

  const handleLogoutClick = () => {
    triggerHaptic();
    onLogout();
  };

  const showInstallButton = Boolean(deferredPrompt || isIOSSafari());

  return (
    <header
      className="bg-slate-900 border-b border-emerald-950/80 text-slate-100 sticky top-0 z-40 shadow-md"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        {/* Brand Title & Logo */}
        <button
          onClick={() => onNavigate('menu')}
          className="flex items-center space-x-3 text-left hover:opacity-90 transition-opacity cursor-pointer group active:scale-95"
        >
          <SgeLogo size="sm" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-extrabold tracking-wide text-slate-100 font-sans">
                Sistema de Gestão de Escalas
              </h1>
              {currentOrg && (
                <span className="hidden sm:inline-block text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded">
                  {currentOrg.sigla}
                </span>
              )}
            </div>
            <p className="text-[10px] text-emerald-400 font-mono font-semibold">
              SGE • CONTROLE DE ESCALAS
            </p>
          </div>
        </button>

        {/* Right Controls & User Info */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* PWA Install Button when prompt or iOS is available */}
          {showInstallButton && (
            <button
              onClick={handleInstallClick}
              className="flex items-center space-x-1.5 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer animate-pulse active:scale-95"
              title="Instalar o aplicativo no dispositivo"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Instalar App</span>
            </button>
          )}

          {/* Main Menu Quick Return Button if not on menu */}
          {currentPage !== 'menu' && (
            <button
              onClick={() => onNavigate('menu')}
              className="flex items-center space-x-1.5 text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 bg-slate-950 border border-emerald-800/60 px-3 py-1.5 rounded-lg transition-all cursor-pointer hover:bg-slate-900 active:scale-95"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Menu Principal</span>
            </button>
          )}

          <div className="hidden md:flex items-center space-x-2 bg-slate-950/90 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-200 font-bold">{session.nomeGuerra}</span>
          </div>

          <span className="text-amber-400 font-mono font-bold text-xs hidden sm:inline-block">
            {time}
          </span>

          <button
            onClick={handleLogoutClick}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-950 border border-slate-800 rounded-lg transition-all cursor-pointer active:scale-95"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-slate-200 font-mono space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-emerald-400">Instalar aplicativo</h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg active:scale-95 transition-transform cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Para instalar: toque no ícone Compartilhar do Safari e selecione &apos;Adicionar à Tela de Início&apos;.
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowIOSModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs active:scale-95 transition-transform cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};




