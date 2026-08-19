import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  FileText, 
  MapPinned, 
  Route, 
  ClipboardCheck, 
  CalendarRange, 
  ShieldCheck, 
  Bed, 
  LogOut, 
  Menu as MenuIcon, 
  X, 
  UserCheck, 
  QrCode,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react';
import QRCode from 'qrcode';
import { AppPage, UserSession, Organization } from '../types';
import { SgeLogo } from './SgeLogo';
import { triggerHaptic } from '../utils/helpers';

interface NightOpsLayoutProps {
  session: UserSession;
  currentPage: AppPage;
  currentOrg?: Organization;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
  onReplayAbertura: () => void;
  badgeCounts?: {
    missoesAtrasadas?: number;
    missoesPendentes?: number;
    agendaHoje?: number;
  };
  children: React.ReactNode;
}

export const NightOpsLayout: React.FC<NightOpsLayoutProps> = ({
  session,
  currentPage,
  currentOrg,
  onNavigate,
  onLogout,
  badgeCounts,
  children
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isRetracted, setIsRetracted] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [time, setTime] = useState('');

  // Clean user display name so rank/grad is never duplicated
  const displayGrad = session.grad || '';
  const cleanNomeGuerra = session.nomeGuerra 
    ? session.nomeGuerra.replace(new RegExp(`^${displayGrad}\\s*`, 'i'), '').trim()
    : 'Operador';
  const fullDisplayName = `${displayGrad} ${cleanNomeGuerra}`.trim();

  // Generate QR Code with the current URL
  useEffect(() => {
    const currentUrl = window.location.href;
    QRCode.toDataURL(currentUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0A0C10',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Erro ao gerar QR Code:', err));
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems: {
    id: AppPage;
    label: string;
    subtitle: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { 
      id: 'visao_geral', 
      label: 'VISÃO GERAL', 
      subtitle: 'Situação operacional', 
      icon: LayoutDashboard 
    },
    { 
      id: 'escala_select', 
      label: 'ESCALAS', 
      subtitle: 'Selecionar modalidade', 
      icon: CalendarDays 
    },
    { 
      id: 'aditamento', 
      label: 'ADITAMENTO', 
      subtitle: 'Montagem e PDF', 
      icon: FileText 
    },
    { 
      id: 'mapa_forca', 
      label: 'MAPA DA FORÇA', 
      subtitle: 'Efetivo disponível', 
      icon: MapPinned 
    },
    { 
      id: 'destinos', 
      label: 'DESTINOS', 
      subtitle: 'Ausências e bloqueios', 
      icon: Route 
    },
    { 
      id: 'missoes', 
      label: 'MISSÕES', 
      subtitle: 'Planejamento operacional', 
      icon: ClipboardCheck,
      badge: (badgeCounts?.missoesAtrasadas || 0) > 0 ? badgeCounts?.missoesAtrasadas : badgeCounts?.missoesPendentes,
      badgeColor: (badgeCounts?.missoesAtrasadas || 0) > 0 ? 'bg-[#E8384F] text-[#F1F3F5] font-extrabold' : 'bg-[#FF7A29] text-[#0A0C10] font-bold'
    },
    { 
      id: 'agenda', 
      label: 'AGENDA', 
      subtitle: 'Programação mensal', 
      icon: CalendarRange,
      badge: badgeCounts?.agendaHoje,
      badgeColor: 'bg-[#F2B84B] text-[#0A0C10] font-bold'
    },
    { 
      id: 'gestao', 
      label: 'GESTÃO', 
      subtitle: 'Usuários e módulos', 
      icon: ShieldCheck 
    }
  ];

  if (currentOrg?.enabledModules?.includes('pernoite')) {
    navItems.splice(7, 0, { 
      id: 'pernoite', 
      label: 'PERNOITE', 
      subtitle: 'Controle de alojamento', 
      icon: Bed 
    });
  }

  const handleNavClick = (page: AppPage) => {
    triggerHaptic();
    onNavigate(page);
    setMobileDrawerOpen(false);
  };

  const isCurrent = (page: AppPage) => {
    if (page === 'escala_select' && (currentPage === 'escala_select' || currentPage === 'escala_detail')) {
      return true;
    }
    return currentPage === page;
  };

  const getPageTitle = (page: AppPage) => {
    switch (page) {
      case 'visao_geral': return 'SITUAÇÃO OPERACIONAL';
      case 'escala_select': return 'CENTRAL DE ESCALAS';
      case 'escala_detail': return 'MATRIZ DA ESCALA';
      case 'mapa_forca': return 'MAPA DA FORÇA';
      case 'aditamento': return 'ADITAMENTO AO BOLETIM';
      case 'destinos': return 'CENTRAL DE INDISPONIBILIDADES';
      case 'missoes': return 'CENTRAL DE MISSÕES';
      case 'agenda': return 'AGENDA OPERACIONAL';
      case 'pernoite': return 'CONTROLE DE PERNOITE';
      case 'gestao': return 'GESTÃO E CONTROLE DE ACESSO';
      default: return 'SISTEMA DE GESTÃO DE ESCALAS';
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#F1F3F5] flex flex-col md:flex-row font-sans selection:bg-[#FF7A29] selection:text-[#0A0C10] overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR (SGE NIGHT OPS V9 - RETRÁTIL: 240px OU 72px)               */}
      {/* ========================================================================= */}
      <aside 
        className={`hidden md:flex flex-col justify-between bg-[#13161C] border-r border-[rgba(255,255,255,0.06)] sticky top-0 h-screen select-none z-30 shadow-2xl shrink-0 transition-all duration-200 ${
          isRetracted ? 'w-[72px]' : 'w-[240px]'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto min-h-0">
          {/* Top Brand Header & Retract Toggle */}
          <div className="p-3.5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <button
              onClick={() => handleNavClick('visao_geral')}
              className="flex items-center space-x-2.5 text-left cursor-pointer group min-w-0"
              title="SGE - Gestão de Escalas"
            >
              <SgeLogo size="sm" />
              {!isRetracted && (
                <div className="min-w-0 truncate">
                  <h1 className="text-sm font-black tracking-wider text-[#F1F3F5] leading-none">
                    SGE
                  </h1>
                  <p className="text-[9px] text-[#9AA3AE] font-mono tracking-wider font-semibold uppercase mt-0.5">
                    GESTÃO DE ESCALAS
                  </p>
                </div>
              )}
            </button>

            <button
              onClick={() => setIsRetracted(!isRetracted)}
              className="p-1.5 rounded-lg text-[#9AA3AE] hover:text-[#FF7A29] hover:bg-[#1B1F27] transition-colors cursor-pointer"
              title={isRetracted ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            >
              {isRetracted ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-1 mt-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isCurrent(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={isRetracted ? item.label : undefined}
                  className={`w-full flex items-center justify-between p-2.5 rounded-[12px] text-left transition-all duration-150 cursor-pointer ${
                    active
                      ? 'bg-[rgba(255,122,41,0.16)] text-[#F1F3F5] font-bold border border-[#FF7A29]/50 shadow-[0_0_16px_rgba(255,122,41,0.25)]'
                      : 'text-[#9AA3AE] hover:text-[#F1F3F5] hover:bg-[#1B1F27] border border-transparent hover:border-[rgba(255,255,255,0.06)]'
                  }`}
                >
                  <div className={`flex items-center space-x-2.5 min-w-0 ${isRetracted ? 'mx-auto' : ''}`}>
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#FF7A29]' : 'text-[#33C9EB]'}`} />
                    {!isRetracted && (
                      <div className="min-w-0 truncate">
                        <div className={`text-[11px] font-black tracking-wide truncate uppercase leading-tight ${active ? 'text-[#FF7A29]' : 'text-[#F1F3F5]'}`}>
                          {item.label}
                        </div>
                        <div className={`text-[9px] font-mono truncate leading-tight ${active ? 'text-[#F1F3F5]/80' : 'text-[#5B6470]'}`}>
                          {item.subtitle}
                        </div>
                      </div>
                    )}
                  </div>

                  {!isRetracted && item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full shrink-0 ml-1 ${item.badgeColor || (active ? 'bg-[#FF7A29] text-[#0A0C10] font-black' : 'bg-[#1B1F27] text-[#33C9EB] font-bold')}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Mobile QR Shortcut */}
            <div className="pt-2 mt-2 border-t border-[rgba(255,255,255,0.06)]">
              <button
                onClick={() => {
                  triggerHaptic();
                  setShowQRModal(true);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-[12px] text-left transition-all duration-150 cursor-pointer bg-[#0A0C10] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 text-[#F1F3F5] group ${
                  isRetracted ? 'justify-center' : ''
                }`}
                title="Acessar no Celular (QR Code)"
              >
                <div className={`flex items-center space-x-2.5 min-w-0 ${isRetracted ? 'mx-auto' : ''}`}>
                  <QrCode className="w-4 h-4 text-[#FF7A29] shrink-0" />
                  {!isRetracted && (
                    <div className="min-w-0 truncate">
                      <div className="text-[11px] font-black tracking-wide truncate uppercase leading-tight text-[#FF7A29] group-hover:underline">
                        QR CELULAR
                      </div>
                      <div className="text-[9px] font-mono truncate leading-tight text-[#5B6470]">
                        Abrir Safari / Android
                      </div>
                    </div>
                  )}
                </div>
              </button>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[rgba(255,255,255,0.06)] bg-[#0A0C10] space-y-2 shrink-0">
          {!isRetracted && (
            <div className="flex items-center justify-between text-[10px] font-mono text-[#5B6470] px-1">
              <span className="flex items-center gap-1.5 text-[#3ED598]">
                <span className="w-2 h-2 rounded-full bg-[#3ED598] shadow-[0_0_6px_#3ED598] shrink-0" />
                <span className="text-[10px] font-bold">Firebase Conectado</span>
              </span>
              <span className="text-[#5B6470]">{time}</span>
            </div>
          )}

          {/* User Profile Card */}
          <div className={`p-2 rounded-[12px] bg-[#13161C] border border-[rgba(255,255,255,0.06)] flex items-center justify-between ${isRetracted ? 'justify-center p-1.5' : ''}`}>
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-[8px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FF7A29] shrink-0">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              {!isRetracted && (
                <div className="min-w-0 truncate">
                  <p className="text-[11px] font-extrabold text-[#F1F3F5] truncate leading-tight">
                    {fullDisplayName}
                  </p>
                  <p className="text-[9px] font-mono text-[#33C9EB] font-bold uppercase truncate leading-tight mt-0.5">
                    {currentOrg?.sigla || session.orgId.toUpperCase()}
                  </p>
                </div>
              )}
            </div>

            {!isRetracted && (
              <button
                onClick={() => {
                  triggerHaptic();
                  onLogout();
                }}
                className="p-1.5 text-[#5B6470] hover:text-[#E8384F] hover:bg-[#E8384F]/10 rounded-lg transition-colors cursor-pointer"
                title="Encerrar sessão"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT CONTAINER                                                   */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Compact Page Header */}
        <header className="bg-[#13161C]/95 border-b border-[rgba(255,255,255,0.06)] px-3 md:px-6 py-2.5 sticky top-0 z-20 backdrop-blur-md flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile Hamburger Button to open Drawer from LEFT */}
            <button
              onClick={() => {
                triggerHaptic();
                setMobileDrawerOpen(true);
              }}
              className="md:hidden p-2 rounded-lg bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] text-[#FF7A29] hover:border-[#FF7A29]/40 cursor-pointer shrink-0"
              title="Abrir Menu Lateral"
            >
              <MenuIcon className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <div className="text-[9px] font-mono font-bold tracking-wider text-[#9AA3AE] uppercase truncate">
                SGE / {currentOrg?.sigla || 'RANCHO'}
              </div>
              <h2 className="text-xs md:text-sm font-black text-[#F1F3F5] tracking-wide uppercase mt-0.5 truncate">
                {getPageTitle(currentPage)}
              </h2>
            </div>
          </div>

          {/* Right Status Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowQRModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0A0C10] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 text-[10px] font-mono text-[#FF7A29] font-bold cursor-pointer transition-all"
              title="QR Code para Celular"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">QR CELULAR</span>
            </button>

            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] text-[10px] font-mono text-[#9AA3AE]">
              {time}
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-7">
          <div className="max-w-[1540px] mx-auto page-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE LEFT DRAWER (DESLIZA DA ESQUERDA PARA A DIREITA)                   */}
      {/* ========================================================================= */}
      {mobileDrawerOpen && (
        <div 
          onClick={() => setMobileDrawerOpen(false)}
          className="md:hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-[280px] max-w-[85vw] h-full bg-[#13161C] border-r border-[rgba(255,255,255,0.06)] flex flex-col justify-between p-4 shadow-2xl overflow-y-auto"
            style={{
              paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))',
              paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))'
            }}
          >
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(255,255,255,0.06)]">
                <div className="flex items-center space-x-2.5">
                  <SgeLogo size="sm" />
                  <div>
                    <h3 className="text-xs font-black tracking-wider text-[#F1F3F5] leading-none">
                      SGE
                    </h3>
                    <p className="text-[9px] text-[#9AA3AE] font-mono tracking-wider uppercase mt-0.5">
                      {currentOrg?.sigla || 'RANCHO'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 text-[#9AA3AE] hover:text-[#F1F3F5] rounded-lg bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Logged Info */}
              <div className="p-2.5 my-3 rounded-[12px] bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FF7A29] shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0 truncate">
                  <p className="text-xs font-bold text-[#F1F3F5] truncate leading-tight">
                    {fullDisplayName}
                  </p>
                  <p className="text-[9px] font-mono text-[#33C9EB] uppercase truncate leading-tight mt-0.5">
                    {session.role}
                  </p>
                </div>
              </div>

              {/* Navigation List */}
              <nav className="space-y-1 mt-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isCurrent(item.id);

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-[12px] text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-[rgba(255,122,41,0.16)] text-[#F1F3F5] font-black border border-[#FF7A29]/50 shadow-[0_0_12px_rgba(255,122,41,0.25)]'
                          : 'text-[#9AA3AE] hover:text-[#F1F3F5] hover:bg-[#1B1F27] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#FF7A29]' : 'text-[#33C9EB]'}`} />
                        <span className={`text-xs font-black uppercase leading-tight ${active ? 'text-[#FF7A29]' : 'text-[#F1F3F5]'}`}>
                          {item.label}
                        </span>
                      </div>

                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ml-1 ${item.badgeColor || (active ? 'bg-[#FF7A29] text-[#0A0C10]' : 'bg-[#1B1F27] text-[#33C9EB]')}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] space-y-2">
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  setShowQRModal(true);
                }}
                className="w-full p-2.5 rounded-[12px] bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 text-[#FF7A29] flex items-center justify-between font-bold text-xs"
              >
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  <span>Acesso QR Code</span>
                </div>
                <Smartphone className="w-3.5 h-3.5 text-[#9AA3AE]" />
              </button>

              <div className="flex items-center justify-between px-1 text-[10px] font-mono text-[#5B6470]">
                <span className="flex items-center gap-1.5 text-[#3ED598]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3ED598]" />
                  <span>Conectado</span>
                </span>
                <span>{time}</span>
              </div>

              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onLogout();
                }}
                className="w-full py-2.5 px-3 bg-[#2A0C10] border border-[#E8384F]/40 hover:border-[#E8384F] text-[#E8384F] font-bold rounded-[12px] text-xs font-mono flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL QR CODE                                                             */}
      {/* ========================================================================= */}
      {showQRModal && (
        <div 
          onClick={() => setShowQRModal(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 max-w-sm w-full shadow-2xl text-[#F1F3F5] space-y-4 text-center relative"
          >
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#9AA3AE] hover:text-[#F1F3F5] hover:bg-[#1B1F27] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center space-y-1">
              <div className="p-3 rounded-2xl bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#FF7A29] mb-1">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase text-[#F1F3F5]">
                Acesso Móvel via QR Code
              </h3>
              <p className="text-[11px] text-[#9AA3AE]">
                Aponte a câmera do seu celular para abrir o SGE no navegador (Safari ou Chrome).
              </p>
            </div>

            <div className="p-3 bg-white rounded-[16px] flex items-center justify-center">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="QR Code Acesso Celular" 
                  className="w-48 h-48 rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs font-mono text-black">
                  Gerando QR Code...
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={copyUrl}
                className="w-full py-2 px-3 bg-[#0A0C10] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 text-[#FF7A29] rounded-[10px] text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
              </button>

              <button
                onClick={() => setShowQRModal(false)}
                className="w-full py-2 px-3 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black rounded-[10px] text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_16px_rgba(255,122,41,0.25)]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
