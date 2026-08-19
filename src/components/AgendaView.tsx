import React, { useState } from 'react';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  Trash2, 
  Calendar as CalendarIcon, 
  X, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { AgendaItem, AgendaTipo, UserSession } from '../types';
import { triggerHaptic } from '../utils/helpers';

interface AgendaViewProps {
  session: UserSession;
  agenda: AgendaItem[];
  onSaveAgendaItem: (item: AgendaItem) => void;
  onDeleteAgendaItem: (itemId: string) => void;
}

const AGENDA_TIPOS: { tipo: AgendaTipo; label: string; color: string; bg: string; border: string }[] = [
  { tipo: 'REUNIÃO', label: 'Reunião', color: 'text-[#33C9EB]', bg: 'bg-[#1B1F27]', border: 'border-[#33C9EB]/40' },
  { tipo: 'COMPROMISSO', label: 'Compromisso', color: 'text-[#FF7A29]', bg: 'bg-[#1B1F27]', border: 'border-[#FF7A29]/40' },
  { tipo: 'PRAZO', label: 'Prazo', color: 'text-[#F2B84B]', bg: 'bg-[#1B1F27]', border: 'border-[#F2B84B]/40' },
  { tipo: 'EVENTO', label: 'Evento', color: 'text-[#3ED598]', bg: 'bg-[#1B1F27]', border: 'border-[#3ED598]/40' },
  { tipo: 'OUTRO', label: 'Outro', color: 'text-[#9AA3AE]', bg: 'bg-[#0A0C10]', border: 'border-[rgba(255,255,255,0.06)]' }
];

export const AgendaView: React.FC<AgendaViewProps> = ({
  session,
  agenda,
  onSaveAgendaItem,
  onDeleteAgendaItem
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('09:00');
  const [local, setLocal] = useState('');
  const [participantes, setParticipantes] = useState('');
  const [tipo, setTipo] = useState<AgendaTipo>('REUNIÃO');
  const [observacao, setObservacao] = useState('');
  const [formError, setFormError] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar calculations
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 for Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  const getItemsForDate = (dateStr: string) => {
    return agenda.filter((a) => a.data === dateStr);
  };

  const handleOpenAddModal = (dateStr?: string) => {
    const targetDate = dateStr || selectedDateStr;
    setSelectedDateStr(targetDate);
    setTitulo('');
    setDescricao('');
    setHoraInicio('08:30');
    setHoraFim('09:30');
    setLocal('');
    setParticipantes('');
    setTipo('REUNIÃO');
    setObservacao('');
    setFormError('');
    setShowModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setFormError('Informe o título da atividade.');
      return;
    }

    const newItem: AgendaItem = {
      id: `age_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orgId: session.orgId,
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      data: selectedDateStr,
      horaInicio: horaInicio || '08:00',
      horaFim: horaFim.trim() || undefined,
      local: local.trim() || undefined,
      participantes: participantes.trim() ? participantes.split(',').map((p) => p.trim()) : undefined,
      observacao: observacao.trim() || undefined,
      tipo,
      criadoPor: session.id,
      criadoPorNome: `${session.grad} ${session.nomeGuerra}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveAgendaItem(newItem);
    triggerHaptic();
    setShowModal(false);
  };

  const selectedDayItems = getItemsForDate(selectedDateStr).sort((a, b) =>
    a.horaInicio.localeCompare(b.horaInicio)
  );

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header Banner */}
      <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[26px] p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-[14px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FF7A29]">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-[#F1F3F5] uppercase tracking-wide font-sans">
              AGENDA / PLANNER MENSAL
            </h2>
            <p className="text-xs text-[#9AA3AE] mt-0.5 font-mono">
              Planejamento de compromissos, reuniões e eventos da subunidade
            </p>
          </div>
        </div>

        {/* Month controls and action */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleToday}
            className="py-2.5 px-4 bg-[#0A0C10] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#F1F3F5] text-xs font-bold rounded-[12px] cursor-pointer"
          >
            Hoje
          </button>

          <div className="flex items-center space-x-1 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-[#1B1F27] text-[#9AA3AE] hover:text-[#F1F3F5] rounded-lg cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-black text-[#33C9EB] uppercase tracking-wider min-w-[140px] text-center font-tabular">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-[#1B1F27] text-[#9AA3AE] hover:text-[#F1F3F5] rounded-lg cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => handleOpenAddModal()}
            className="py-2.5 px-4 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black rounded-[12px] text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-[0_0_15px_rgba(255,122,41,0.25)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>NOVA ATIVIDADE</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Section: Monthly Calendar + Day Agenda Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (Col span 2) */}
        <div className="lg:col-span-2 bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-4 sm:p-6 shadow-xl space-y-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black text-[#9AA3AE] pb-2 border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[#E8384F]">DOM</span>
            <span>SEG</span>
            <span>TER</span>
            <span>QUA</span>
            <span>QUI</span>
            <span>SEX</span>
            <span className="text-[#E8384F]">SÁB</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Prev month fill */}
            {Array.from({ length: firstDayIndex }).map((_, i) => {
              const prevDayNum = daysInPrevMonth - firstDayIndex + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="min-h-[72px] sm:min-h-[90px] p-1.5 sm:p-2 rounded-[14px] bg-[#0A0C10]/40 border border-[rgba(255,255,255,0.03)] text-[#5B6470] text-xs opacity-40 select-none font-tabular"
                >
                  <span>{prevDayNum}</span>
                </div>
              );
            })}

            {/* Current Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayItems = getItemsForDate(dateStr);
              const isSelected = selectedDateStr === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              const dayOfWeek = new Date(year, month, dayNum).getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => {
                    triggerHaptic();
                    setSelectedDateStr(dateStr);
                  }}
                  className={`min-h-[76px] sm:min-h-[96px] p-1.5 sm:p-2 rounded-[14px] border transition-all cursor-pointer flex flex-col justify-between select-none ${
                    isSelected
                      ? 'bg-[#1B1F27] border-[#FF7A29] shadow-[0_0_15px_rgba(255,122,41,0.25)]'
                      : isToday
                      ? 'bg-[#1B1F27]/60 border-[#F2B84B]/60'
                      : 'bg-[#0A0C10] border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/50 hover:bg-[#1B1F27]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold font-tabular ${
                        isSelected
                          ? 'text-[#FF7A29] font-black'
                          : isToday
                          ? 'text-[#F2B84B] font-black'
                          : isWeekend
                          ? 'text-[#E8384F]'
                          : 'text-[#F1F3F5]'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {isToday && (
                      <span className="text-[9px] font-black uppercase text-[#F2B84B] bg-[#1B1F27] px-1 rounded border border-[#F2B84B]/40">
                        Hoje
                      </span>
                    )}
                  </div>

                  {/* Day activity pills */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayItems.slice(0, 2).map((item) => {
                      const typeConfig = AGENDA_TIPOS.find((t) => t.tipo === item.tipo) || AGENDA_TIPOS[0];
                      return (
                        <div
                          key={item.id}
                          className={`text-[9px] sm:text-[10px] truncate px-1.5 py-0.5 rounded-[6px] font-semibold border ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border}`}
                          title={`${item.horaInicio} - ${item.titulo}`}
                        >
                          {item.horaInicio} {item.titulo}
                        </div>
                      );
                    })}

                    {dayItems.length > 2 && (
                      <span className="text-[9px] text-[#33C9EB] font-bold block text-right font-tabular">
                        +{dayItems.length - 2} mais
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Detail Panel (Col span 1) */}
        <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
              <div>
                <span className="text-[10px] text-[#FF7A29] uppercase font-bold block">
                  ATIVIDADES DO DIA
                </span>
                <h3 className="text-sm md:text-base font-black text-[#F1F3F5] font-sans">
                  {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </h3>
              </div>

              <button
                onClick={() => handleOpenAddModal(selectedDateStr)}
                className="p-2 bg-[#1B1F27] hover:bg-[#1B1F27]/80 text-[#33C9EB] border border-[rgba(255,255,255,0.06)] rounded-[10px] transition-all cursor-pointer"
                title="Adicionar atividade nesta data"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* List of items */}
            <div className="space-y-3 mt-4 max-h-[500px] overflow-y-auto pr-1">
              {selectedDayItems.length === 0 ? (
                <div className="p-8 text-center text-[#5B6470]">
                  <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-[#5B6470]" />
                  <p className="text-xs font-bold text-[#9AA3AE]">Nenhum compromisso agendado</p>
                  <p className="text-[11px] text-[#5B6470] mt-1">
                    Toque no botão + para adicionar atividades para este dia.
                  </p>
                </div>
              ) : (
                selectedDayItems.map((item) => {
                  const typeConfig = AGENDA_TIPOS.find((t) => t.tipo === item.tipo) || AGENDA_TIPOS[0];

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-[16px] border ${typeConfig.bg} ${typeConfig.border} space-y-2`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-[6px] border ${typeConfig.border} ${typeConfig.color}`}>
                            {item.tipo}
                          </span>
                          <span className="text-xs font-bold text-[#F1F3F5] flex items-center gap-1 font-tabular">
                            <Clock className="w-3 h-3 text-[#33C9EB]" />
                            {item.horaInicio} {item.horaFim && `às ${item.horaFim}`}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            triggerHaptic();
                            onDeleteAgendaItem(item.id);
                          }}
                          className="p-1 text-[#9AA3AE] hover:text-[#E8384F] transition-colors cursor-pointer"
                          title="Excluir Atividade"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="text-sm font-bold text-[#F1F3F5] font-sans">{item.titulo}</h4>

                      {item.descricao && (
                        <p className="text-xs text-[#9AA3AE] leading-relaxed">
                          {item.descricao}
                        </p>
                      )}

                      <div className="space-y-1 text-[11px] text-[#9AA3AE] pt-1 border-t border-[rgba(255,255,255,0.06)]">
                        {item.local && (
                          <div className="flex items-center gap-1.5 text-[#F1F3F5]">
                            <MapPin className="w-3 h-3 text-[#F2B84B] shrink-0" />
                            <span>Local: {item.local}</span>
                          </div>
                        )}

                        {item.participantes && item.participantes.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[#33C9EB]">
                            <Users className="w-3 h-3 shrink-0" />
                            <span>Participantes: {item.participantes.join(', ')}</span>
                          </div>
                        )}

                        {item.observacao && (
                          <div className="flex items-center gap-1.5 text-[#9AA3AE] italic">
                            <FileText className="w-3 h-3 shrink-0" />
                            <span>Obs: {item.observacao}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={() => handleOpenAddModal(selectedDateStr)}
            className="w-full py-2.5 bg-[#0A0C10] hover:bg-[#1B1F27] border border-[#FF7A29]/40 text-[#FF7A29] font-bold rounded-[12px] text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Atividade no Dia</span>
          </button>
        </div>
      </div>

      {/* Modal: Nova Atividade */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 font-mono text-[#F1F3F5]">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-[12px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FF7A29]">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-[#F1F3F5] font-sans">
                    NOVA ATIVIDADE NA AGENDA
                  </h3>
                  <p className="text-xs text-[#9AA3AE]">
                    Planejamento para o dia {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-[#9AA3AE] hover:text-[#F1F3F5] rounded-lg bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-[#2A0C10] border border-[#E8384F]/40 text-[#E8384F] text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#9AA3AE] uppercase font-bold mb-1">
                  Tipo / Categoria
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {AGENDA_TIPOS.map((t) => (
                    <button
                      key={t.tipo}
                      type="button"
                      onClick={() => setTipo(t.tipo)}
                      className={`p-2 rounded-[10px] text-center font-bold text-[10px] uppercase border transition-all cursor-pointer ${
                        tipo === t.tipo
                          ? `${t.bg} ${t.color} ${t.border} shadow-md`
                          : 'bg-[#0A0C10] border-[rgba(255,255,255,0.06)] text-[#9AA3AE]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#9AA3AE] uppercase font-bold mb-1">
                  Título da Atividade *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Reunião de Coordenação do Rancho"
                  className="w-full p-2.5 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] text-[#F1F3F5] focus:border-[#FF7A29] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9AA3AE] uppercase font-bold mb-1">
                    Horário Inicial *
                  </label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full p-2.5 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] text-[#F1F3F5] focus:border-[#FF7A29] focus:outline-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[#9AA3AE] uppercase font-bold mb-1">
                    Horário Final (Opcional)
                  </label>
                  <input
                    type="time"
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                    className="w-full p-2.5 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] text-[#F1F3F5] focus:border-[#FF7A29] focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9AA3AE] uppercase font-bold mb-1">
                    Local (Opcional)
                  </label>
                  <input
                    type="text"
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    placeholder="Ex: Sala do Aprovisionador / Rancho"
                    className="w-full p-2.5 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] text-[#F1F3F5] focus:border-[#FF7A29] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#9AA3AE] uppercase font-bold mb-1">
                    Participantes (Opcional)
                  </label>
                  <input
                    type="text"
                    value={participantes}
                    onChange={(e) => setParticipantes(e.target.value)}
                    placeholder="Ex: Simas, Strieder, Silva"
                    className="w-full p-2.5 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] text-[#F1F3F5] focus:border-[#FF7A29] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#9AA3AE] uppercase font-bold mb-1">
                  Pauta / Descrição (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Pontos a serem tratados ou instruções..."
                  className="w-full p-2.5 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] text-[#F1F3F5] focus:border-[#FF7A29] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] text-[#9AA3AE] hover:text-[#F1F3F5] rounded-[10px] uppercase font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black rounded-[10px] uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(255,122,41,0.25)] cursor-pointer"
                >
                  Salvar na Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
