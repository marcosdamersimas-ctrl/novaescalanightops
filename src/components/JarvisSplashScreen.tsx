import React, { useEffect, useState } from 'react';
import { SgeLogo } from './SgeLogo';

interface JarvisSplashScreenProps {
  onComplete: () => void;
}

export const JarvisSplashScreen: React.FC<JarvisSplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 2;
      });
    }, 25);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const finishTimer = setTimeout(() => {
        onComplete();
      }, 400);
      return () => clearTimeout(finishTimer);
    }
  }, [progress, onComplete]);

  return (
    <div 
      onClick={onComplete}
      className="fixed inset-0 bg-[#0A0C10] text-[#F1F3F5] flex flex-col items-center justify-center p-6 z-50 select-none font-mono text-xs overflow-hidden cursor-pointer"
      style={{
        paddingTop: 'env(safe-area-inset-top, 24px)',
        paddingBottom: 'env(safe-area-inset-bottom, 24px)'
      }}
    >
      {/* Discreet Technical Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#FF7A29 1px, transparent 1px), linear-gradient(90deg, #FF7A29 1px, transparent 1px)`,
          backgroundSize: '36px 36px'
        }}
      />

      {/* Main Center Container */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center space-y-6">
        
        {/* SGE Logo with Subtle Tactical Orange Glow */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-4 rounded-full border border-[#FF7A29]/25 animate-[spin_12s_linear_infinite]" />
          <div className="absolute -inset-8 rounded-full border border-dashed border-[rgba(255,255,255,0.08)] animate-[spin_24s_linear_infinite_reverse]" />
          
          <div className="p-4 rounded-[24px] bg-[#13161C] border border-[rgba(255,255,255,0.08)] shadow-[0_0_35px_rgba(255,122,41,0.2)] flex items-center justify-center">
            <SgeLogo size="xl" />
          </div>
        </div>

        {/* Titles */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-widest text-[#F1F3F5] uppercase font-sans">
            SGE
          </h1>
          <p className="text-[10px] md:text-xs text-[#9AA3AE] font-mono tracking-widest uppercase">
            SISTEMA DE GESTÃO DE ESCALAS
          </p>
        </div>

        {/* Numerical Loading Bar */}
        <div className="w-full space-y-2 pt-2">
          <div className="flex justify-between items-center text-[10px] font-mono font-bold">
            <span className="text-[#9AA3AE] tracking-widest">INICIALIZANDO SISTEMA</span>
            <span className="text-[#FF7A29] text-xs font-black tracking-wider">{progress}%</span>
          </div>

          <div className="h-2 w-full bg-[#13161C] rounded-full overflow-hidden border border-[rgba(255,255,255,0.08)] p-[1px]">
            <div 
              className="h-full bg-[#FF7A29] rounded-full transition-all duration-75 ease-out shadow-[0_0_10px_rgba(255,122,41,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center space-y-1 text-[#5B6470]">
        <p className="text-[10px] font-bold text-[#9AA3AE] uppercase tracking-wider">
          PLATAFORMA OPERACIONAL MILITAR
        </p>
      </div>
    </div>
  );
};
