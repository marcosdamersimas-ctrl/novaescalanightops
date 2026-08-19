import React, { useState } from 'react';
import { 
  CalendarCheck, 
  FileText, 
  Users, 
  Bed, 
  Shield, 
  Sliders, 
  X, 
  Lock,
  Info,
  Activity,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { UserSession, Organization } from '../types';
import { triggerHaptic } from '../utils/helpers';

interface MainMenuScreenProps {
  session: UserSession;
  currentOrg?: Organization;
  onNavigate: (page: 'escala_select' | 'mapa_forca' | 'aditamento' | 'destinos' | 'pernoite' | 'gestao' | 'missoes' | 'agenda') => void;
  onUpdateOrgModules?: (updatedOrg: Organization) => void;
}

export const MainMenuScreen: React.FC<MainMenuScreenProps> = ({ 
  session, 
  currentOrg, 
  onNavigate,
  onUpdateOrgModules 
}) => {
  const isSuperAdmin = session.role === 'SUPER_ADMIN';
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // Default enabled modules if not configured:
  const enabledModules = currentOrg?.enabledModules || [
    'escala_select',
    'mapa_forca',
    'aditamento',
    'destinos',
    'gestao'
  ];

  const allAvailableModules = [
    {
      id: 'escala_select',
      title: 'Escala de Serviço',
      subtitle: 'Controle de serviços diários, escalas pretas e vermelhas',
      icon: CalendarCheck,
      isFixed: false,
      tag: 'Operacional'
    },
    {
      id: 'mapa_forca',
      title: 'Mapa da Força',
      subtitle: 'Efetivo total, militares prontos, destinos e funções fixas',
      icon: Activity,
      isFixed: true,
      tag: 'Efetivo'
    },
    {
      id: 'aditamento',
      title: 'Aditamento ao Boletim',
      subtitle: 'Escala de serviço diária oficial para publicação e impressão',
      icon: FileText,
      isFixed: true,
      tag: 'Boletim'
    },
    {
      id: 'destinos',
      title: 'Controle de Destinos',
      subtitle: 'Férias, baixas hospitalares, licenças, missões e afastamentos',
      icon: Users,
      isFixed: true,
      tag: 'Controle'
    },
    {
      id: 'pernoite',
      title: 'Pernoite',
      subtitle: 'Controle de pernoite e alojamento de militares',
      icon: Bed,
      isFixed: false,
      tag: 'Alojamento'
    },
    {
      id: 'gestao',
      title: 'Gestão e Acessos',
      subtitle: isSuperAdmin ? 'Criação de Subunidades, Administradores e permissões' : 'Gerenciamento de operadores da Subunidade',
      icon: Shield,
      isFixed: false,
      tag: 'Administração'
    }
  ];

  // Active filtered modules to display on the menu
  const visibleOptions = allAvailableModules.filter((m) => enabledModules.includes(m.id as any));

  const handleToggleModule = (modId: any) => {
    triggerHaptic();
    if (!currentOrg) return;
    const isCurrentlyEnabled = enabledModules.includes(modId);
    let nextList: any[];
    if (isCurrentlyEnabled) {
      nextList = enabledModules.filter((id) => id !== modId);
    } else {
      nextList = [...enabledModules, modId];
    }
    const updated: Organization = {
      ...currentOrg,
      enabledModules: nextList
    };
    if (onUpdateOrgModules) {
      onUpdateOrgModules(updated);
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'SUPER_ADMIN') return 'Administrador Geral';
    if (role === 'ORG_ADMIN') return 'Gestor da Subunidade';
    return 'Operador da Escala';
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Bar with Operator Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 shadow-xl gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-[14px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FF7A29]">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[#F1F3F5] font-bold text-sm flex items-center gap-2 font-sans">
              <span>{session.grad} {session.nomeGuerra}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-[6px] bg-[#1B1F27] text-[#FF7A29] border border-[rgba(255,255,255,0.06)] font-bold">
                {getRoleLabel(session.role)}
              </span>
            </div>
            <div className="text-xs text-[#9AA3AE] mt-0.5 font-mono">
              Subunidade: <span className="text-[#F1F3F5] font-bold">{currentOrg?.nome || session.orgId}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { triggerHaptic(); setShowCustomizeModal(true); }}
            className="px-3.5 py-2.5 bg-[#0A0C10] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#9AA3AE] hover:text-[#F1F3F5] font-bold rounded-[12px] text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#33C9EB]" />
            <span>Personalizar Módulos</span>
          </button>
        </div>
      </div>

      {/* Main Menu Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleOptions.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              onClick={() => { triggerHaptic(); onNavigate(opt.id as any); }}
              className="group p-6 rounded-[22px] bg-[#13161C] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/50 shadow-xl hover:shadow-[0_0_20px_rgba(255,122,41,0.15)] transition-all cursor-pointer flex flex-col justify-between text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-[14px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FF7A29] group-hover:scale-105 group-hover:text-[#ff8e47] transition-all">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-[6px] bg-[#0A0C10] text-[#9AA3AE] border border-[rgba(255,255,255,0.06)]">
                  {opt.tag}
                </span>
              </div>

              <div>
                <h3 className="text-sm md:text-base font-bold text-[#F1F3F5] group-hover:text-[#FF7A29] transition-colors flex items-center justify-between font-sans">
                  <span>{opt.title}</span>
                  <ArrowRight className="w-4 h-4 text-[#5B6470] group-hover:text-[#FF7A29] transition-colors" />
                </h3>
                <p className="text-xs text-[#9AA3AE] mt-1.5 leading-relaxed font-mono">
                  {opt.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* MODAL: PERSONALIZAR MENU */}
      {showCustomizeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 max-w-lg w-full shadow-2xl space-y-5 text-[#F1F3F5] font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
              <div className="flex items-center space-x-2.5">
                <Sliders className="w-5 h-5 text-[#33C9EB]" />
                <h3 className="text-sm font-bold text-[#F1F3F5] font-sans uppercase">
                  Personalizar Módulos da Subunidade
                </h3>
              </div>
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="p-1 hover:bg-[#1B1F27] text-[#9AA3AE] hover:text-[#F1F3F5] rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {allAvailableModules.map((mod) => {
                const Icon = mod.icon;
                const isEnabled = enabledModules.includes(mod.id as any);

                return (
                  <div
                    key={mod.id}
                    className={`p-3 rounded-[14px] border flex items-center justify-between transition-colors ${
                      isEnabled
                        ? 'bg-[#1B1F27] border-[rgba(255,255,255,0.1)] text-[#F1F3F5]'
                        : 'bg-[#0A0C10] border-[rgba(255,255,255,0.04)] text-[#5B6470] opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-[10px] bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] text-[#FF7A29] flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs flex items-center gap-2">
                          <span>{mod.title}</span>
                          {mod.isFixed && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#0A0C10] text-[#F2B84B] font-bold border border-[#F2B84B]/30">
                              Obrigatório
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#9AA3AE] mt-0.5">
                          {mod.subtitle}
                        </p>
                      </div>
                    </div>

                    {mod.isFixed ? (
                      <div className="p-2 text-[#5B6470]" title="Módulo obrigatório">
                        <Lock className="w-4 h-4" />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleToggleModule(mod.id)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          isEnabled ? 'bg-[#FF7A29]' : 'bg-[#1B1F27]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-[#0A0C10] transition-transform transform ${
                            isEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] p-3 rounded-[14px] flex items-start space-x-2.5 text-xs text-[#9AA3AE]">
              <Info className="w-4 h-4 text-[#33C9EB] shrink-0 mt-0.5" />
              <p>
                Os módulos <strong>Mapa da Força</strong>, <strong>Aditamento</strong> e <strong>Destinos</strong> são fundamentais para a gestão do efetivo e permanecem sempre ativos.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-[rgba(255,255,255,0.06)]">
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="px-4 py-2 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black rounded-[10px] text-xs cursor-pointer shadow-[0_0_15px_rgba(255,122,41,0.25)]"
              >
                Salvar Configuração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
