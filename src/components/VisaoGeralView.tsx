import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckSquare, 
  CalendarDays, 
  Plus, 
  Check, 
  ChevronRight, 
  ArrowUpRight,
  RotateCw,
  Target,
  CalendarRange
} from 'lucide-react';
import { 
  Militar, 
  EscalaAssignment, 
  EscalaMeta, 
  Destino, 
  Missao, 
  AgendaItem, 
  UserSession, 
  Organization, 
  AppPage 
} from '../types';
import { triggerHaptic, getParticipantsForScale } from '../utils/helpers';

interface VisaoGeralViewProps {
  session: UserSession;
  currentOrg?: Organization;
  militares: Militar[];
  assignments: EscalaAssignment[];
  escalasMeta: EscalaMeta[] | Record<string, EscalaMeta>;
  destinos: Destino[];
  missoes: Missao[];
  agenda: AgendaItem[];
  onNavigate: (page: AppPage) => void;
  onUpdateMissaoStatus: (missaoId: string, status: Missao['status']) => void;
}

export const VisaoGeralView: React.FC<VisaoGeralViewProps> = ({
  currentOrg,
  militares,
  assignments,
  escalasMeta,
  destinos,
  missoes,
  agenda,
  onNavigate,
  onUpdateMissaoStatus
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Convert escalasMeta to array if it's an object
  const scaleList: EscalaMeta[] = Array.isArray(escalasMeta)
    ? escalasMeta
    : Object.values(escalasMeta || {});

  // Active destinations today
  const getActiveDestino = (militarId: string) => {
    return destinos.find((dest) => {
      if (dest.militarId !== militarId) return false;
      return todayStr >= dest.dataInicio && todayStr <= dest.dataFim;
    });
  };

  // Aptos count based on real military data
  const militaresAptos = militares.filter(
    (m) => m.ativo !== false && m.concorreEscala !== false && !getActiveDestino(m.id)
  );

  // Missions logic
  const isMissionOverdue = (m: Missao) => {
    if (m.status === 'concluida') return false;
    if (!m.prazoData) return false;
    const now = new Date();
    const timeStr = m.prazoHora || '23:59';
    const deadline = new Date(`${m.prazoData}T${timeStr}:00`);
    return now > deadline;
  };

  const missoesPendentes = missoes.filter((m) => m.status === 'pendente' || m.status === 'em_andamento');
  const missoesAtrasadas = missoes.filter(isMissionOverdue);

  // Agenda items
  const agendaHoje = agenda.filter((a) => a.data === todayStr).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  // Assignments today
  const assignmentsHoje = assignments.filter((a) => a.data === todayStr);

  // Rotating Aptos Per Scale
  const [scaleIndex, setScaleIndex] = useState(0);

  // Calculate real aptos for each scale using the unified single source of truth
  const scaleStats = scaleList.map((scale) => {
    const aptosNaEscala = getParticipantsForScale(scale.id, militaresAptos, scale);
    return {
      id: scale.id,
      nome: scale.nome,
      sigla: scale.sigla,
      aptos: aptosNaEscala.length,
      funcoes: scale.funcoes ? scale.funcoes.length : 1
    };
  });

  useEffect(() => {
    if (scaleStats.length <= 1) return;
    const timer = setInterval(() => {
      setScaleIndex((prev) => (prev + 1) % scaleStats.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [scaleStats.length]);

  const currentScaleStat = scaleStats[scaleIndex] || {
    nome: 'Geral',
    sigla: 'GERAL',
    aptos: militaresAptos.length,
    funcoes: 1
  };

  return (
    <div className="space-y-4 md:space-y-5">
      
      {/* 4 Summary Stats Cards with SGE Night Ops V9 Retro-Illumination */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono">
        <button
          onClick={() => onNavigate('mapa_forca')}
          className="p-3.5 rounded-[16px] bg-[#13161C] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/60 hover:bg-[#1B1F27] text-left transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="text-[9px] text-[#9AA3AE] uppercase font-bold tracking-wider">EFETIVO APTO</div>
            <Users className="w-3.5 h-3.5 retro-icon" />
          </div>
          <div className="text-xl font-black text-[#FF7A29] mt-1 font-tabular">{militaresAptos.length}</div>
          <div className="text-[9px] text-[#5B6470] mt-0.5">de {militares.length} total</div>
        </button>

        <button
          onClick={() => onNavigate('escala_select')}
          className="p-3.5 rounded-[16px] bg-[#13161C] border border-[rgba(255,255,255,0.06)] hover:border-[#33C9EB]/60 hover:bg-[#1B1F27] text-left transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="text-[9px] text-[#9AA3AE] uppercase font-bold tracking-wider">ESCALADOS HOJE</div>
            <CalendarDays className="w-3.5 h-3.5 retro-icon-secondary" />
          </div>
          <div className="text-xl font-black text-[#F1F3F5] mt-1 font-tabular">{assignmentsHoje.length}</div>
          <div className="text-[9px] text-[#5B6470] mt-0.5">em serviço diário</div>
        </button>

        <button
          onClick={() => onNavigate('missoes')}
          className="p-3.5 rounded-[16px] bg-[#13161C] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/60 hover:bg-[#1B1F27] text-left transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="text-[9px] text-[#9AA3AE] uppercase font-bold tracking-wider">MISSÕES ATIVAS</div>
            <Target className="w-3.5 h-3.5 retro-icon" />
          </div>
          <div className={`text-xl font-black mt-1 font-tabular ${missoesAtrasadas.length > 0 ? 'text-[#E8384F]' : 'text-[#F1F3F5]'}`}>
            {missoesPendentes.length}
          </div>
          <div className="text-[9px] text-[#5B6470] mt-0.5">
            {missoesAtrasadas.length > 0 ? `${missoesAtrasadas.length} em atraso` : 'em andamento'}
          </div>
        </button>

        <button
          onClick={() => onNavigate('agenda')}
          className="p-3.5 rounded-[16px] bg-[#13161C] border border-[rgba(255,255,255,0.06)] hover:border-[#F2B84B]/60 hover:bg-[#1B1F27] text-left transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="text-[9px] text-[#9AA3AE] uppercase font-bold tracking-wider">AGENDA HOJE</div>
            <CalendarRange className="w-3.5 h-3.5 text-[#F2B84B]" />
          </div>
          <div className="text-xl font-black text-[#F2B84B] mt-1 font-tabular">{agendaHoje.length}</div>
          <div className="text-[9px] text-[#5B6470] mt-0.5">atividades</div>
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* OPERATIONAL PANEL (8 COLS) */}
        <div className="lg:col-span-8 bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-4 md:p-6 space-y-4 shadow-xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)] gap-2">
            <div>
              <div className="text-[9px] font-mono font-bold tracking-widest text-[#9AA3AE] uppercase">
                PAINEL OPERACIONAL
              </div>
              <h3 className="text-sm md:text-base font-black text-[#F1F3F5] uppercase tracking-wide mt-0.5">
                SITUAÇÃO ATIVA
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('missoes')}
                className="py-1.5 px-2.5 bg-[#1B1F27] hover:bg-[#FF7A29] text-[#F1F3F5] hover:text-[#0A0C10] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29] font-bold rounded-[10px] text-[10px] font-mono flex items-center space-x-1 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3 h-3" />
                <span>Missão</span>
              </button>

              <button
                onClick={() => onNavigate('agenda')}
                className="py-1.5 px-2.5 bg-[#1B1F27] hover:bg-[#F2B84B] text-[#F1F3F5] hover:text-[#0A0C10] border border-[rgba(255,255,255,0.06)] hover:border-[#F2B84B] font-bold rounded-[10px] text-[10px] font-mono flex items-center space-x-1 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3 h-3" />
                <span>Atividade</span>
              </button>
            </div>
          </div>

          {/* MISSÕES EM ANDAMENTO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-3.5 h-3.5 retro-icon" />
                <h4 className="text-[11px] font-black uppercase text-[#F1F3F5] tracking-wide font-mono">
                  MISSÕES EM ANDAMENTO
                </h4>
              </div>
              <button
                onClick={() => onNavigate('missoes')}
                className="text-[9px] font-mono text-[#FF7A29] hover:underline flex items-center gap-1 font-bold"
              >
                <span>Ver todas</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {missoesPendentes.length === 0 ? (
              <div className="p-3 rounded-[12px] bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] text-center text-[10px] text-[#5B6470] font-mono">
                Nenhuma missão pendente.
              </div>
            ) : (
              <div className="space-y-1.5">
                {missoesPendentes.slice(0, 3).map((m) => {
                  const overdue = isMissionOverdue(m);
                  return (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-[12px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/50 flex items-center justify-between gap-2.5 transition-all"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <button
                          onClick={() => {
                            triggerHaptic();
                            onUpdateMissaoStatus(m.id, 'concluida');
                          }}
                          className="w-4 h-4 rounded-[4px] border border-[rgba(255,255,255,0.15)] hover:border-[#3ED598] hover:bg-[#3ED598]/10 flex items-center justify-center text-transparent hover:text-[#3ED598] transition-all cursor-pointer shrink-0"
                          title="Concluir"
                        >
                          <Check className="w-2.5 h-2.5" />
                        </button>
                        <div className="min-w-0 truncate">
                          <div className="text-xs font-bold text-[#F1F3F5] truncate font-sans">
                            {m.titulo}
                          </div>
                          <div className="text-[9px] font-mono text-[#9AA3AE] truncate">
                            {m.prazoData ? `Prazo: ${m.prazoData} ${m.prazoHora || ''}` : ''} • {m.responsavelNome || 'Subunidade'}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-extrabold uppercase shrink-0 ${
                          overdue
                            ? 'bg-[#2A0C10] text-[#E8384F] border border-[#E8384F]/40'
                            : 'bg-[rgba(255,122,41,0.14)] text-[#FF7A29] border border-[#FF7A29]/40'
                        }`}
                      >
                        {overdue ? 'Atrasada' : m.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AGENDA DE HOJE */}
          <div className="space-y-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CalendarRange className="w-3.5 h-3.5 text-[#F2B84B]" />
                <h4 className="text-[11px] font-black uppercase text-[#F1F3F5] tracking-wide font-mono">
                  PROGRAMAÇÃO DE HOJE
                </h4>
              </div>
              <button
                onClick={() => onNavigate('agenda')}
                className="text-[9px] font-mono text-[#F2B84B] hover:underline flex items-center gap-1 font-bold"
              >
                <span>Ver agenda</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {agendaHoje.length === 0 ? (
              <div className="p-3 rounded-[12px] bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] text-center text-[10px] text-[#5B6470] font-mono">
                Sem eventos registrados para hoje.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {agendaHoje.slice(0, 4).map((ag) => (
                  <div
                    key={ag.id}
                    className="p-2.5 rounded-[12px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] flex items-start space-x-2"
                  >
                    <div className="px-1.5 py-0.5 rounded bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] text-[9px] font-mono font-bold text-[#F2B84B] shrink-0 font-tabular">
                      {ag.horaInicio}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#F1F3F5] truncate font-sans">
                        {ag.titulo}
                      </div>
                      <div className="text-[9px] font-mono text-[#9AA3AE] truncate">
                        {ag.local || 'Instalações'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR DISPONIBILIDADE (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Card: ROTAÇÃO DE EFETIVO APTO */}
          <div className="p-4 md:p-5 rounded-[22px] bg-[#13161C] border border-[rgba(255,255,255,0.06)] space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-2.5">
              <div className="flex items-center space-x-2">
                <RotateCw className="w-3.5 h-3.5 retro-icon" />
                <span className="text-[11px] font-black uppercase text-[#F1F3F5] font-mono">
                  DISPONIBILIDADE
                </span>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-[#1B1F27] border border-[#FF7A29]/40 text-[#FF7A29] font-bold">
                {scaleIndex + 1}/{scaleStats.length || 1}
              </span>
            </div>

            <div className="p-3.5 rounded-[14px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] space-y-1.5">
              <div className="text-[9px] text-[#9AA3AE] uppercase font-mono font-bold">
                MODALIDADE:
              </div>
              <div className="text-sm font-black text-[#F1F3F5] uppercase font-sans">
                {currentScaleStat.nome}
              </div>
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-2xl font-black text-[#FF7A29] font-mono font-tabular">
                  {currentScaleStat.aptos}
                </span>
                <span className="text-[10px] text-[#9AA3AE] font-mono">militares aptos</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('escala_select')}
              className="w-full py-2.5 px-3 bg-[#1B1F27] hover:bg-[#FF7A29] text-[#F1F3F5] hover:text-[#0A0C10] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29] font-bold rounded-[10px] text-[10px] font-mono flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm"
            >
              <span>Gerenciar Escalas</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
