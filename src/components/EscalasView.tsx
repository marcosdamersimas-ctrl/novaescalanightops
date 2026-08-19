import React, { useState, useMemo } from 'react';
import { Militar, EscalaTipo, EscalaAssignment, Destino, EscalaMeta } from '../types';
import { ESCALA_METAS } from '../data/initialMilitaryData';
import { getParticipantsForScale } from '../utils/helpers';
import { 
  UserPlus, 
  ChevronLeft, ChevronRight, Trash2, ArrowLeft,
  Settings, X, Layers, Check, GripVertical, RotateCcw,
  Users
} from 'lucide-react';
import { MilitaryManagerModal } from './MilitaryManagerModal';
import { ScaleEditorModal } from './ScaleEditorModal';

interface EscalasViewProps {
  militares: Militar[];
  assignments: EscalaAssignment[];
  destinos: Destino[];
  escalasMeta?: Record<string, EscalaMeta>;
  activeEscala: EscalaTipo;
  setActiveEscala: (escala: EscalaTipo) => void;
  onBackToScales: () => void;
  onBackToMenu: () => void;
  onAddMilitar: (militar: Omit<Militar, 'id'>) => void;
  onUpdateMilitar: (militar: Militar) => void;
  onDeleteMilitar: (id: string) => void;
  onDeleteAllMilitares?: () => void;
  onAddScale?: (scale: EscalaMeta) => void;
  onDeleteScale?: (scaleId: string) => void;
  onToggleAssignment: (militarId: string, escalaTipo: EscalaTipo, dateStr: string, funcaoSigla?: string) => void;
  onAutoEscalar: (escalaTipo: EscalaTipo, year: number, month: number) => void;
  onClearMonthAssignments: (escalaTipo: EscalaTipo, year: number, month: number) => void;
  customRedDays?: Record<string, boolean>;
  onToggleRedDay?: (dateStr: string) => void;
  onRestoreOriginalScale?: () => void;
}

export const EscalasView: React.FC<EscalasViewProps> = ({
  militares,
  assignments,
  destinos,
  escalasMeta = ESCALA_METAS,
  activeEscala,
  onBackToScales,
  onAddMilitar,
  onUpdateMilitar,
  onDeleteMilitar,
  onDeleteAllMilitares,
  onAddScale,
  onDeleteScale,
  onToggleAssignment,
  onClearMonthAssignments,
  customRedDays = {},
  onToggleRedDay,
  onRestoreOriginalScale,
}) => {
  const today = new Date();
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showScaleEditorModal, setShowScaleEditorModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());

  // Multi-function cell picker modal state
  const [selectedCellForFunc, setSelectedCellForFunc] = useState<{
    militarId: string;
    militarNome: string;
    dateStr: string;
  } | null>(null);

  // Toggle Escala Vermelha for a specific date
  const handleToggleRedDay = (dateStr: string) => {
    if (onToggleRedDay) {
      onToggleRedDay(dateStr);
    }
  };

  // Navigation for Month
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Generate days array for selected Month
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days = [];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(selectedYear, selectedMonth, d);
      const dayOfWeekStr = dayNames[dateObj.getDay()];
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const formattedDateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      
      // Default: Sat/Sun = Vermelha, Mon-Fri = Preta, with manual override support
      const isRedDay = customRedDays[formattedDateStr] !== undefined 
        ? !!customRedDays[formattedDateStr] 
        : isWeekend;

      days.push({
        dayNum: d,
        dayOfWeek: dayOfWeekStr,
        isWeekend,
        isRedDay,
        dateStr: formattedDateStr,
      });
    }
    return days;
  }, [selectedYear, selectedMonth, customRedDays]);

  // Check if a military member has a registered Destino on a given date
  const getDestinoForMilitar = (militarId: string, dateStr: string) => {
    return destinos.find((dest) => {
      if (dest.militarId !== militarId || dest.bloqueiaEscala === false) return false;
      return dateStr >= dest.dataInicio && dateStr <= dest.dataFim;
    });
  };

  // Standardized military acronym for Destino
  const getDestinoAcronym = (tipo: string): string => {
    switch (tipo) {
      case 'Férias': return 'FÉR';
      case 'Baixa Hospitalar': return 'BH';
      case 'Dispensa Médica': return 'DM';
      case 'Licença Prêmio': return 'LP';
      case 'Serviço Externo': return 'SE';
      case 'Missão': return 'MIS';
      case 'Missão Especial': return 'ME';
      case 'Curso / Estágio': return 'CUR';
      case 'Dispensa como Recompensa': return 'DR';
      default: return tipo.substring(0, 3).toUpperCase();
    }
  };

  // Calculate carried-over folga counters (preta/vermelha) before day 1 of selectedMonth
  const initialCounters = useMemo(() => {
    const counters: Record<string, { preta: number; vermelha: number }> = {};
    militares.forEach((m) => {
      counters[m.id] = { preta: 0, vermelha: 0 };
    });

    const baselineYear = 2026;
    const baselineMonth = 6; // July (0-indexed month 6)

    if (selectedYear < baselineYear || (selectedYear === baselineYear && selectedMonth <= baselineMonth)) {
      return counters;
    }

    const simStart = new Date(baselineYear, baselineMonth, 1);
    const simEnd = new Date(selectedYear, selectedMonth, 0);

    for (let d = new Date(simStart); d <= simEnd; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear();
      const m = d.getMonth();
      const dayNum = d.getDate();
      const dateStr = `${y}-${(m + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;

      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const isRedDay = customRedDays[dateStr] !== undefined ? !!customRedDays[dateStr] : isWeekend;

      militares.forEach((militar) => {
        const dayAssignments = assignments.filter(
          (a) => a.militarId === militar.id && a.escalaTipo === activeEscala && a.data === dateStr
        );
        const unitAssignments = assignments.filter(
          (a) => a.militarId === militar.id && a.data === dateStr
        );

        const relevantAssignments = dayAssignments.length > 0 ? dayAssignments : unitAssignments;

        if (relevantAssignments.length > 0) {
          if (isRedDay) {
            counters[militar.id].vermelha = 0;
            // preta is paused/frozen on red days
          } else {
            counters[militar.id].preta = 0;
            // vermelha is paused/frozen on black days
          }
        } else {
          if (isRedDay) {
            counters[militar.id].vermelha += 1;
          } else {
            counters[militar.id].preta += 1;
          }
        }
      });
    }

    return counters;
  }, [selectedYear, selectedMonth, customRedDays, militares, assignments, activeEscala]);

  // Current Scale Metadata
  const currentMeta: EscalaMeta = escalasMeta[activeEscala] || {
    id: activeEscala,
    nome: activeEscala.toUpperCase(),
    sigla: activeEscala.substring(0, 3).toUpperCase(),
    descricao: '',
    cor: '',
    funcoes: [],
  };

  // Filter and order militares belonging exclusively to this scale
  const militaresDaEscala = useMemo(() => {
    let list = getParticipantsForScale(activeEscala, militares, currentMeta);

    // Apply custom military order if set
    if (currentMeta.militarOrdemArray && currentMeta.militarOrdemArray.length > 0) {
      const orderMap = new Map(currentMeta.militarOrdemArray.map((id, idx) => [id, idx]));
      list.sort((a, b) => {
        const idxA = orderMap.has(a.id) ? (orderMap.get(a.id) as number) : 9999;
        const idxB = orderMap.has(b.id) ? (orderMap.get(b.id) as number) : 9999;
        if (idxA !== idxB) return idxA - idxB;
        return (a.ordem ?? a.antiguidade ?? 999) - (b.ordem ?? b.antiguidade ?? 999);
      });
    } else {
      list.sort((a, b) => (a.ordem ?? a.antiguidade ?? 999) - (b.ordem ?? b.antiguidade ?? 999));
    }

    return list;
  }, [militares, currentMeta, activeEscala]);

  // Calculate day-by-day continuous folga count for each military member
  const militaryDaysGrid = useMemo(() => {
    const grid: Record<string, Record<string, { label: string; isRed: boolean; isDuty: boolean }>> = {};

    militaresDaEscala.forEach((m) => {
      grid[m.id] = {};
    });

    const runningCounters: Record<string, { preta: number; vermelha: number }> = {};
    militaresDaEscala.forEach((m) => {
      runningCounters[m.id] = {
        preta: initialCounters[m.id]?.preta || 0,
        vermelha: initialCounters[m.id]?.vermelha || 0,
      };
    });

    daysInMonth.forEach((day) => {
      militaresDaEscala.forEach((m) => {
        const dayAssignments = assignments.filter(
          (a) => a.militarId === m.id && a.escalaTipo === activeEscala && a.data === day.dateStr
        );
        const unitAssignments = assignments.filter(
          (a) => a.militarId === m.id && a.data === day.dateStr
        );
        const relevantAssignments = dayAssignments.length > 0 ? dayAssignments : unitAssignments;

        if (relevantAssignments.length > 0) {
          const sigla = dayAssignments.length > 0 && dayAssignments[0].funcaoSigla
            ? dayAssignments[0].funcaoSigla
            : currentMeta.militarFuncaoPreferencia?.[m.id] ||
              m.funcaoPadrao ||
              (currentMeta.funcoes && currentMeta.funcoes.length > 0 ? currentMeta.funcoes[0].sigla : currentMeta.sigla) ||
              'P';

          grid[m.id][day.dateStr] = {
            label: sigla,
            isRed: day.isRedDay,
            isDuty: true,
          };

          if (day.isRedDay) {
            runningCounters[m.id].vermelha = 0;
            // Preta sequence remains paused during red day
          } else {
            runningCounters[m.id].preta = 0;
            // Vermelha sequence remains paused during black day
          }
        } else {
          if (day.isRedDay) {
            runningCounters[m.id].vermelha += 1;
            grid[m.id][day.dateStr] = {
              label: runningCounters[m.id].vermelha.toString(),
              isRed: true,
              isDuty: false,
            };
          } else {
            runningCounters[m.id].preta += 1;
            grid[m.id][day.dateStr] = {
              label: runningCounters[m.id].preta.toString(),
              isRed: false,
              isDuty: false,
            };
          }
        }
      });
    });

    return grid;
  }, [militaresDaEscala, daysInMonth, assignments, activeEscala, currentMeta, initialCounters]);

  // Drag and drop handler for reordering military list
  const handleDragStartMilitar = (e: React.DragEvent, militarId: string) => {
    e.dataTransfer.setData('text/plain', militarId);
  };

  const handleDropMilitar = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;

    const currentOrder = militaresDaEscala.map((m) => m.id);
    const sourceIdx = currentOrder.indexOf(sourceId);
    const targetIdx = currentOrder.indexOf(targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const newOrder = [...currentOrder];
    const [removed] = newOrder.splice(sourceIdx, 1);
    newOrder.splice(targetIdx, 0, removed);

    if (onAddScale) {
      onAddScale({
        ...currentMeta,
        militarOrdemArray: newOrder
      });
    }
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
        <div>
          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-2 mb-2.5">
            <button
              onClick={onBackToScales}
              className="inline-flex items-center space-x-1.5 text-xs text-[#FF7A29] hover:underline bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 px-3 py-1 rounded-[10px] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>VOLTAR PARA ESCALAS</span>
            </button>
            <span className="text-[#5B6470]">/</span>
            <span className="text-xs text-[#9AA3AE] font-bold">
              {currentMeta.nome.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FF7A29]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#F1F3F5] uppercase tracking-wide font-sans">
                  MATRIZ DA ESCALA • {currentMeta.nome}
                </h2>
                <span className="text-[10px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#33C9EB] px-2 py-0.5 rounded font-black uppercase">
                  {currentMeta.sigla}
                </span>
              </div>
              <p className="text-[11px] text-[#9AA3AE] mt-0.5 font-mono">
                Controle diário de escala e contagem contínua de folgas preta/vermelha
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {onRestoreOriginalScale && (
            <button
              onClick={onRestoreOriginalScale}
              className="py-2 px-3 bg-[#1B1F27] hover:bg-[#1B1F27]/80 border border-[rgba(255,255,255,0.06)] text-[#9AA3AE] hover:text-[#F1F3F5] font-bold rounded-[10px] text-xs uppercase flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Restaurar dados completos da escala original"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#33C9EB]" />
              <span>Restaurar</span>
            </button>
          )}

          <button
            onClick={() => setShowScaleEditorModal(true)}
            className="py-2 px-3 bg-[#1B1F27] hover:bg-[#1B1F27]/80 border border-[rgba(255,255,255,0.06)] text-[#F2B84B] font-bold rounded-[10px] text-xs uppercase flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Configurar serviços e efetivo desta escala"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurar</span>
          </button>

          <button
            onClick={() => setShowManagerModal(true)}
            className="py-2 px-3.5 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black rounded-[10px] text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-[0_0_12px_rgba(255,122,41,0.25)] cursor-pointer transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Cadastrar Militar</span>
          </button>
        </div>
      </div>

      {/* Month Navigation & Clear Bar */}
      <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-4 shadow-xl font-mono">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold text-[#9AA3AE] uppercase">Modalidade:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#FF7A29] text-xs font-black uppercase">
              {currentMeta.sigla} - {currentMeta.nome}
            </span>
            <span className="text-xs text-[#5B6470]">•</span>
            <span className="text-xs text-[#F1F3F5] font-bold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#33C9EB]" />
              {militaresDaEscala.length} no Quadro
            </span>

            {currentMeta.funcoes && currentMeta.funcoes.length > 1 && (
              <div className="hidden lg:flex items-center space-x-1.5 pl-2 border-l border-[rgba(255,255,255,0.06)]">
                <span className="text-[10px] text-[#9AA3AE] uppercase">Funções:</span>
                {currentMeta.funcoes.map((f) => (
                  <span key={f.id} className="text-[10px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#33C9EB] font-bold px-2 py-0.5 rounded">
                    {f.sigla}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Month Selector Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center space-x-1 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] p-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 text-[#9AA3AE] hover:text-[#F1F3F5] rounded-lg hover:bg-[#1B1F27] transition-colors cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-black text-[#F1F3F5] px-3 min-w-[130px] text-center uppercase tracking-wider">
                {monthNames[selectedMonth]} {selectedYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 text-[#9AA3AE] hover:text-[#F1F3F5] rounded-lg hover:bg-[#1B1F27] transition-colors cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                if (window.confirm(`Deseja realmente LIMPAR todos os lançamentos da escala "${currentMeta.nome}" no mês de ${monthNames[selectedMonth]} de ${selectedYear}?`)) {
                  onClearMonthAssignments(activeEscala, selectedYear, selectedMonth);
                }
              }}
              className="py-2 px-3 bg-[#0A0C10] hover:bg-[#2A0C10] hover:text-[#E8384F] border border-[rgba(255,255,255,0.06)] hover:border-[#E8384F]/40 text-[#9AA3AE] rounded-[12px] text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all"
              title="Limpar marcações deste mês"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#E8384F]" />
              <span>Limpar Mês</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Matrix Table View */}
      <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[24px] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto relative max-h-[640px] overflow-y-auto">
          <table className="w-max min-w-full text-left text-xs font-mono border-collapse table-fixed">
            <thead>
              {/* Row 1: Weekday Header */}
              <tr className="bg-[#13161C] text-[#9AA3AE] uppercase border-b border-[rgba(255,255,255,0.06)] sticky top-0 z-30 shadow-md">
                <th className="hidden sm:table-cell p-2 w-11 bg-[#13161C] sticky left-0 z-40 border-r border-[rgba(255,255,255,0.06)] text-[#F2B84B] font-black text-center">
                  Nº
                </th>
                <th className="hidden sm:table-cell p-2 w-16 bg-[#13161C] sticky left-[44px] z-40 border-r border-[rgba(255,255,255,0.06)] text-[#33C9EB] font-black">
                  GRAD
                </th>
                <th className="p-2 w-36 sm:w-52 bg-[#13161C] sticky left-0 sm:left-[108px] z-40 border-r border-[rgba(255,255,255,0.06)] text-[#F1F3F5] font-black">
                  MILITAR
                </th>
                <th className="hidden sm:table-cell p-2 w-44 bg-[#13161C] sticky left-[316px] z-40 border-r-2 border-[#FF7A29]/50 text-[#F2B84B] font-black text-center shadow-[4px_0_12px_rgba(0,0,0,0.7)]">
                  ESCALA / SERVIÇO
                </th>

                {daysInMonth.map((day) => (
                  <th
                    key={day.dayNum}
                    onClick={() => handleToggleRedDay(day.dateStr)}
                    title="Clique para alternar Feriado / Escala Vermelha"
                    className={`p-1.5 text-center w-11 min-w-[44px] max-w-[44px] border-r border-[rgba(255,255,255,0.05)] cursor-pointer select-none transition-colors ${
                      day.isRedDay 
                        ? 'bg-[#2A0C10] text-[#E8384F] font-black border-b-2 border-b-[#E8384F]' 
                        : 'text-[#9AA3AE] hover:bg-[#1B1F27] hover:text-[#F1F3F5]'
                    }`}
                  >
                    {day.dayOfWeek}
                  </th>
                ))}
              </tr>

              {/* Row 2: Day of Month Numbers */}
              <tr className="bg-[#13161C] text-[#9AA3AE] border-b border-[rgba(255,255,255,0.06)] sticky top-[33px] z-30 shadow-md">
                <th className="hidden sm:table-cell p-1 bg-[#13161C] sticky left-0 z-40 border-r border-[rgba(255,255,255,0.06)] text-[9px] text-[#5B6470] text-center font-bold">
                  ORD
                </th>
                <th className="hidden sm:table-cell p-1 bg-[#13161C] sticky left-[44px] z-40 border-r border-[rgba(255,255,255,0.06)] text-[9px] text-[#5B6470] font-bold">
                  POSTO
                </th>
                <th className="p-1 bg-[#13161C] sticky left-0 sm:left-[108px] z-40 border-r border-[rgba(255,255,255,0.06)] text-[9px] text-[#5B6470] font-bold">
                  NOME
                </th>
                <th className="hidden sm:table-cell p-1 bg-[#13161C] sticky left-[316px] z-40 border-r-2 border-[#FF7A29]/50 text-[9px] text-[#F2B84B]/80 text-center shadow-[4px_0_12px_rgba(0,0,0,0.7)] font-bold">
                  PADRÃO
                </th>

                {daysInMonth.map((day) => (
                  <th
                    key={`num-${day.dayNum}`}
                    onClick={() => handleToggleRedDay(day.dateStr)}
                    title="Clique para alternar Feriado / Escala Vermelha"
                    className={`p-1 text-center font-black text-xs w-11 min-w-[44px] max-w-[44px] border-r border-[rgba(255,255,255,0.05)] cursor-pointer select-none transition-colors font-tabular ${
                      day.isRedDay ? 'text-[#E8384F] bg-[#2A0C10] font-black' : 'text-[#FF7A29] hover:bg-[#1B1F27]'
                    }`}
                  >
                    {day.dayNum.toString().padStart(2, '0')}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)] bg-[#13161C]">
              {militaresDaEscala.map((m, idx) => {
                const userGrid = militaryDaysGrid[m.id] || {};
                const currentMilitarSigla =
                  currentMeta.militarFuncaoPreferencia?.[m.id] ||
                  m.funcaoPadrao ||
                  (currentMeta.funcoes && currentMeta.funcoes.length > 0 ? currentMeta.funcoes[0].sigla : currentMeta.sigla) ||
                  'P';

                return (
                  <tr
                    key={m.id}
                    draggable
                    onDragStart={(e) => handleDragStartMilitar(e, m.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropMilitar(e, m.id)}
                    className="hover:bg-[#1B1F27]/60 transition-colors group"
                  >
                    {/* Frozen Column 1: Order # */}
                    <td className="hidden sm:table-cell p-2 font-black text-[#F2B84B] bg-[#13161C] group-hover:bg-[#1B1F27] sticky left-0 z-20 border-r border-[rgba(255,255,255,0.06)] text-center text-xs font-tabular">
                      {(idx + 1).toString().padStart(2, '0')}
                    </td>

                    {/* Frozen Column 2: Grad */}
                    <td className="hidden sm:table-cell p-2 font-black text-[#33C9EB] bg-[#13161C] group-hover:bg-[#1B1F27] sticky left-[44px] z-20 border-r border-[rgba(255,255,255,0.06)] truncate text-xs">
                      {m.grad}
                    </td>

                    {/* Frozen Column 3: Nome */}
                    <td className="p-2 w-36 sm:w-52 max-w-36 sm:max-w-52 font-bold text-[#F1F3F5] bg-[#13161C] group-hover:bg-[#1B1F27] sticky left-0 sm:left-[108px] z-20 border-r border-[rgba(255,255,255,0.06)] overflow-hidden">
                      <div className="flex items-center space-x-2">
                        <div
                          draggable
                          onDragStart={(e) => handleDragStartMilitar(e, m.id)}
                          className="cursor-grab active:cursor-grabbing text-[#5B6470] hover:text-[#F2B84B] p-1 rounded shrink-0 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] transition-colors"
                          title="Segure e arraste verticalmente para reordenar"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-black text-[#F1F3F5] text-xs tracking-wide whitespace-nowrap font-sans" title={m.nomeCompleto || m.nomeGuerra}>
                          {m.nomeGuerra}
                        </span>
                      </div>
                    </td>

                    {/* Frozen Column 4: Function Selector */}
                    <td className="hidden sm:table-cell p-1.5 bg-[#13161C] group-hover:bg-[#1B1F27] sticky left-[316px] z-20 border-r-2 border-[#FF7A29]/50 text-center shadow-[4px_0_12px_rgba(0,0,0,0.7)]">
                      <div className="flex flex-col items-center justify-center space-y-0.5">
                        <select
                          value={currentMilitarSigla}
                          onChange={(e) => {
                            if (onAddScale && currentMeta) {
                              onAddScale({
                                ...currentMeta,
                                militarFuncaoPreferencia: {
                                  ...(currentMeta.militarFuncaoPreferencia || {}),
                                  [m.id]: e.target.value
                                }
                              });
                            }
                          }}
                          className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] hover:border-[#F2B84B] text-[#F2B84B] font-black text-[11px] rounded-[8px] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#F2B84B] cursor-pointer uppercase truncate shadow-inner"
                          title="Escolha a escala/função padrão deste militar"
                        >
                          <option value="P">P - PERMANÊNCIA</option>
                          <option value="CS">CS - CASSINEIRO SGT</option>
                          <option value="CO">CO - CASSINEIRO OF</option>
                          <option value="PD">PD - PADEIRO DIURNO</option>
                          <option value="PN">PN - PADEIRO NOTURNO</option>
                          <option value="G">G - GUARDA / SENTINELA</option>
                          <option value="PL">PL - PLANTÃO</option>
                          <option value="AUX">AUX - AUXILIAR</option>
                          <option value="COZ">COZ - COZINHEIRO</option>
                          {currentMeta.funcoes && currentMeta.funcoes.map((f) => (
                            !['P','CS','CO','PD','PN','G','PL','AUX','COZ'].includes(f.sigla) && (
                              <option key={f.id} value={f.sigla}>
                                {f.sigla} - {f.nome}
                              </option>
                            )
                          ))}
                        </select>

                        {/* Active Destination Badge */}
                        {(() => {
                          const activeDest = destinos.find(
                            (d) => d.militarId === m.id && d.bloqueiaEscala !== false
                          );
                          if (activeDest) {
                            return (
                              <span
                                className="inline-block px-1.5 py-0.2 rounded bg-[#2A0C10] border border-[#E8384F]/40 text-[8px] text-[#E8384F] font-black uppercase truncate max-w-[90px]"
                                title={`AFASTADO: ${activeDest.tipo}`}
                              >
                                {getDestinoAcronym(activeDest.tipo)}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </td>

                    {/* Days Cells */}
                    {daysInMonth.map((day) => {
                      const destino = getDestinoForMilitar(m.id, day.dateStr);
                      const assignment = assignments.find(
                        (a) => a.militarId === m.id && a.escalaTipo === activeEscala && a.data === day.dateStr
                      );

                      const cellState = userGrid[day.dateStr] || { label: '-', isRed: day.isRedDay, isDuty: false };

                      return (
                        <td
                          key={`${m.id}-${day.dayNum}`}
                          className={`p-0.5 text-center w-11 min-w-[44px] max-w-[44px] h-9 border-r border-[rgba(255,255,255,0.04)] ${
                            day.isRedDay ? 'bg-[#2A0C10]/40' : ''
                          }`}
                        >
                          {destino ? (
                            <button
                              type="button"
                              onClick={() => {
                                const inicioFmt = destino.dataInicio.split('-').reverse().join('/');
                                const fimFmt = destino.dataFim.split('-').reverse().join('/');
                                alert(`ATENÇÃO MILITAR INDISPONÍVEL:\n${m.grad} ${m.nomeGuerra} possui o destino '${destino.tipo}' no período de ${inicioFmt} a ${fimFmt} e está bloqueado(a) na escala.`);
                              }}
                              className="w-full h-7 rounded-[6px] bg-[#2A0C10] border border-[#E8384F]/60 text-[#E8384F] text-[10px] font-black uppercase flex items-center justify-center cursor-not-allowed select-none font-tabular"
                              title={`BLOQUEADO: ${m.grad} ${m.nomeGuerra} em ${destino.tipo}`}
                            >
                              {getDestinoAcronym(destino.tipo)}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (currentMeta.funcoes && currentMeta.funcoes.length > 1) {
                                  setSelectedCellForFunc({
                                    militarId: m.id,
                                    militarNome: `${m.grad} ${m.nomeGuerra}`,
                                    dateStr: day.dateStr,
                                  });
                                } else {
                                  onToggleAssignment(m.id, activeEscala, day.dateStr);
                                }
                              }}
                              className={`w-full h-7 rounded-[6px] text-[11px] uppercase transition-all cursor-pointer flex items-center justify-center select-none font-tabular ${
                                assignment
                                  ? 'bg-[#0A0C10] border border-[#FF7A29] text-[#FF7A29] font-black shadow-[0_0_8px_rgba(255,122,41,0.3)]'
                                  : cellState.isRed
                                  ? 'bg-[#2A0C10]/70 text-[#E8384F] font-bold hover:bg-[#2A0C10]'
                                  : 'text-[#6B7280] hover:text-[#F1F3F5] hover:bg-[#1B1F27] font-normal'
                              }`}
                            >
                              {assignment ? (assignment.funcaoSigla || cellState.label) : cellState.label}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Multi-Function Service Selection */}
      {selectedCellForFunc && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-6 max-w-md w-full shadow-2xl space-y-4 font-mono text-xs text-[#F1F3F5]">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
              <div>
                <h3 className="text-sm font-black text-[#F1F3F5] uppercase flex items-center space-x-2 font-sans">
                  <Layers className="w-4 h-4 text-[#FF7A29]" />
                  <span>Escalar Serviço / Função</span>
                </h3>
                <p className="text-[#9AA3AE] text-[11px] mt-1 font-mono">
                  <span className="text-[#F2B84B] font-bold">{selectedCellForFunc.militarNome}</span> • Dia {selectedCellForFunc.dateStr.split('-').reverse().join('/')}
                </p>
              </div>
              <button
                onClick={() => setSelectedCellForFunc(null)}
                className="p-1.5 text-[#9AA3AE] hover:text-[#F1F3F5] rounded-lg bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-[#9AA3AE] font-bold">Selecione o serviço/posto a ser escalado:</p>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {currentMeta.funcoes?.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onToggleAssignment(
                        selectedCellForFunc.militarId,
                        activeEscala,
                        selectedCellForFunc.dateStr,
                        f.sigla
                      );
                      setSelectedCellForFunc(null);
                    }}
                    className="w-full p-3 bg-[#1B1F27] hover:bg-[#1B1F27]/80 border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/60 rounded-[12px] text-left flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div>
                      <span className="font-black text-[#F2B84B] mr-2">[{f.sigla}]</span>
                      <span className="font-bold text-[#F1F3F5] group-hover:text-[#FF7A29]">{f.nome}</span>
                    </div>
                    <Check className="w-4 h-4 text-[#FF7A29] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <button
                onClick={() => {
                  onToggleAssignment(
                    selectedCellForFunc.militarId,
                    activeEscala,
                    selectedCellForFunc.dateStr
                  );
                  setSelectedCellForFunc(null);
                }}
                className="py-2 px-3 bg-[#2A0C10] hover:bg-[#2A0C10]/80 border border-[#E8384F]/40 text-[#E8384F] font-bold rounded-[10px] cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Desescalar / Limpar</span>
              </button>

              <button
                onClick={() => setSelectedCellForFunc(null)}
                className="py-2 px-4 bg-[#1B1F27] hover:bg-[#1B1F27]/80 text-[#9AA3AE] font-bold rounded-[10px] cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Scale Editor */}
      {showScaleEditorModal && (
        <ScaleEditorModal
          scaleToEdit={currentMeta}
          militares={militares}
          onSaveScale={(scale) => {
            if (onAddScale) onAddScale(scale);
            setShowScaleEditorModal(false);
          }}
          onDeleteScale={(scaleId) => {
            if (onDeleteScale) onDeleteScale(scaleId);
            setShowScaleEditorModal(false);
            onBackToScales();
          }}
          onClose={() => setShowScaleEditorModal(false)}
        />
      )}

      {/* Modal for Adding/Managing Military */}
      {showManagerModal && (
        <MilitaryManagerModal
          militares={militares}
          onAddMilitar={onAddMilitar}
          onUpdateMilitar={onUpdateMilitar}
          onDeleteMilitar={onDeleteMilitar}
          onDeleteAllMilitares={onDeleteAllMilitares}
          onClose={() => setShowManagerModal(false)}
        />
      )}
    </div>
  );
};
