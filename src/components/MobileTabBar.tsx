import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Briefcase, 
  FileText, 
  Settings, 
  Database,
  ShieldCheck,
  Compass
} from 'lucide-react';

interface MobileTabBarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  systemMode?: 'prototype' | 'architecture';
  userRole?: 'admin' | 'guest';
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  currentTab,
  setCurrentTab,
  systemMode = 'prototype',
  userRole = 'admin'
}) => {
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'escala', label: 'Escala', icon: CalendarDays },
    { id: 'militares', label: 'Militares', icon: Users },
    { id: 'funcoes', label: 'Funções', icon: Briefcase },
    { id: 'aditamento', label: 'Aditamento', icon: FileText },
    { id: 'configuracoes', label: 'Config', icon: Settings },
  ];

  const archMenuItems = [
    { id: 'arch-diagram', label: 'Software', icon: Compass },
    { id: 'arch-db', label: 'Esquema SQL', icon: Database },
    { id: 'arch-plan', label: 'Cronograma', icon: ShieldCheck },
  ];

  const filteredPrototypeItems = userRole === 'guest'
    ? allMenuItems.filter(item => ['dashboard', 'escala', 'aditamento'].includes(item.id))
    : allMenuItems;

  const activeList = systemMode === 'prototype' ? filteredPrototypeItems : archMenuItems;
  const visibleItems = activeList.slice(0, 5);

  return (
    <nav
      id="mobile-tab-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 text-slate-300 md:hidden flex items-center justify-around px-2 py-1 select-none shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            id={`mobile-tab-${item.id}`}
            onClick={() => setCurrentTab(item.id)}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-semibold active:scale-95 transition-transform ${
              isActive
                ? 'text-emerald-400 bg-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span className="truncate max-w-[64px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
