import React, { useState, useMemo } from 'react';
import { Militar, Destino, SUBUNIDADES } from '../types';
import { getHierarquiaOrdenada, getGraduacaoHierarquiaRank } from '../utils/helpers';
import { 
  Printer, CheckCircle, AlertTriangle, Users, Search, 
  Calendar, Filter, ShieldCheck, Activity, GripVertical, AlertOctagon 
} from 'lucide-react';

interface MapaForcaViewProps {
  militares: Militar[];
  destinos: Destino[];
  onReorderMilitares?: (militares: Militar[]) => void;
}

export const MapaForcaView: React.FC<MapaForcaViewProps> = ({ 
  militares, 
  destinos,
  onReorderMilitares 
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'APTO' | 'FIXA' | 'DESTINO'>('TODOS');
  const [subunidadeFilter, setSubunidadeFilter] = useState<string>('TODOS');
  const [dragErrorMsg, setDragErrorMsg] = useState<string | null>(null);

  // Check if a military has an active destination on selected date
  const getActiveDestino = (militarId: string) => {
    return destinos.find((dest) => {
      if (dest.militarId !== militarId) return false;
      return selectedDate >= dest.dataInicio && selectedDate <= dest.dataFim;
    });
  };

  // Base ordered military list strictly respecting mandatory military hierarchy:
  // 1. Tenentes -> 2. 1º Sgt -> 3. 2º Sgt -> 4. 3º Sgt -> 5. Cb -> 6. Sd EP -> 7. Sd EV
  const orderedMilitares = useMemo(() => {
    return getHierarquiaOrdenada(militares);
  }, [militares]);

  // Calculate statistics
  const totalEfetivo = orderedMilitares.length;
  const militaresComDestino = orderedMilitares.filter((m) => getActiveDestino(m.id));
  const totalIndisponiveis = militaresComDestino.length;
  const militaresSemEscala = orderedMilitares.filter((m) => m.concorreEscala === false && !getActiveDestino(m.id));
  const totalFuncaoFixa = militaresSemEscala.length;
  const militaresAptosEscala = orderedMilitares.filter((m) => m.concorreEscala !== false && !getActiveDestino(m.id));
  const totalAptos = militaresAptosEscala.length;

  // Filtered military list
  const filteredMilitares = orderedMilitares.filter((m) => {
    const destino = getActiveDestino(m.id);
    const isFuncaoFixa = m.concorreEscala === false;
    const isAptoEscala = m.concorreEscala !== false && !destino;

    if (statusFilter === 'APTO' && !isAptoEscala) return false;
    if (statusFilter === 'FIXA' && (isFuncaoFixa === false || destino)) return false;
    if (statusFilter === 'DESTINO' && !destino) return false;
    if (subunidadeFilter !== 'TODOS' && m.setor !== subunidadeFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        m.nomeGuerra.toLowerCase().includes(term) ||
        m.nomeCompleto.toLowerCase().includes(term) ||
        m.grad.toLowerCase().includes(term) ||
        m.matricula.toLowerCase().includes(term) ||
        (m.funcaoFixa && m.funcaoFixa.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  // Drag & Drop handlers enforcing hierarchy preservation
  const handleDragStart = (e: React.DragEvent, militarId: string) => {
    e.dataTransfer.setData('text/plain', militarId);
    setDragErrorMsg(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;

    const sourceMilitar = orderedMilitares.find((m) => m.id === sourceId);
    const targetMilitar = orderedMilitares.find((m) => m.id === targetId);

    if (!sourceMilitar || !targetMilitar) return;

    const rankSource = getGraduacaoHierarquiaRank(sourceMilitar.grad || sourceMilitar.postoGraduacao);
    const rankTarget = getGraduacaoHierarquiaRank(targetMilitar.grad || targetMilitar.postoGraduacao);

    // Strict Rule: Prohibition of manual reordering across different rank tiers
    if (rankSource !== rankTarget) {
      setDragErrorMsg(
        `REORDENAÇÃO BLOQUEADA: A hierarquia militar é inviolável. Não é permitido mover ${sourceMilitar.grad} ${sourceMilitar.nomeGuerra} acima/abaixo de ${targetMilitar.grad} ${targetMilitar.nomeGuerra}.`
      );
      setTimeout(() => setDragErrorMsg(null), 5000);
      return;
    }

    // Reorder within the same rank tier
    const updatedList = [...orderedMilitares];
    const fromIndex = updatedList.findIndex((m) => m.id === sourceId);
    const toIndex = updatedList.findIndex((m) => m.id === targetId);

    if (fromIndex >= 0 && toIndex >= 0) {
      const [moved] = updatedList.splice(fromIndex, 1);
      updatedList.splice(toIndex, 0, moved);

      // Re-assign continuous numeric ordem
      const renumbered = updatedList.map((m, idx) => ({
        ...m,
        ordem: idx + 1,
        antiguidade: idx + 1,
      }));

      if (onReorderMilitares) {
        onReorderMilitares(renumbered);
      }
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Header Card */}
      <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[26px] p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-[14px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FF7A29]">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-black text-[#F1F3F5] uppercase tracking-wide font-sans">
                MAPA DA FORÇA DO EFETIVO
              </h2>
              <span className="text-[10px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#33C9EB] px-2 py-0.5 rounded font-black font-tabular">
                {totalEfetivo} EFETIVO TOTAL
              </span>
            </div>
            <p className="text-xs text-[#9AA3AE] mt-0.5">
              Data de Referência: <span className="text-[#FF7A29] font-bold font-tabular">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
            </p>
          </div>
        </div>

        {/* Date Selector & Print Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2">
            <Calendar className="w-4 h-4 text-[#FF7A29]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-[#F1F3F5] focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handlePrint}
            className="py-2.5 px-4 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black rounded-[12px] text-xs uppercase tracking-wider flex items-center space-x-2 transition-all shadow-[0_0_15px_rgba(255,122,41,0.25)] cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Mapa da Força</span>
          </button>
        </div>
      </div>

      {/* Warning Toast for Hierarchy Violation Attempt */}
      {dragErrorMsg && (
        <div className="p-3.5 rounded-[14px] bg-[#2A0C10] border border-[#E8384F] text-[#E8384F] text-xs font-bold flex items-center space-x-2.5 shadow-xl animate-shake">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>{dragErrorMsg}</span>
        </div>
      )}

      {/* KPI Stats Cards - Night Ops HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {/* Total Efetivo */}
        <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase text-[#9AA3AE] font-bold block">Efetivo Existente</span>
            <span className="text-2xl md:text-3xl font-black text-[#F1F3F5] mt-1 block font-tabular">{totalEfetivo}</span>
            <span className="text-[10px] text-[#5B6470]">Total Cadastrado na SU</span>
          </div>
          <div className="w-11 h-11 rounded-[12px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#9AA3AE]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Efetivo Pronto na Escala */}
        <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase text-[#FF7A29] font-black block">Prontos p/ Escala</span>
            <span className="text-2xl md:text-3xl font-black text-[#FF7A29] mt-1 block font-tabular">{totalAptos}</span>
            <span className="text-[10px] text-[#9AA3AE]">Escala Ordinária Ativa</span>
          </div>
          <div className="w-11 h-11 rounded-[12px] bg-[#1B1F27] border border-[#FF7A29]/30 flex items-center justify-center text-[#FF7A29]">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Efetivo Função Fixa */}
        <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase text-[#F2B84B] font-black block">Função Fixa</span>
            <span className="text-2xl md:text-3xl font-black text-[#F2B84B] mt-1 block font-tabular">{totalFuncaoFixa}</span>
            <span className="text-[10px] text-[#9AA3AE]">Sem Escala Ordinária</span>
          </div>
          <div className="w-11 h-11 rounded-[12px] bg-[#1B1F27] border border-[#F2B84B]/30 flex items-center justify-center text-[#F2B84B]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Efetivo Com Destino */}
        <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase text-[#E8384F] font-black block">Com Destino / Afastado</span>
            <span className="text-2xl md:text-3xl font-black text-[#E8384F] mt-1 block font-tabular">{totalIndisponiveis}</span>
            <span className="text-[10px] text-[#9AA3AE]">Férias, Baixas & Dispensas</span>
          </div>
          <div className="w-11 h-11 rounded-[12px] bg-[#2A0C10] border border-[#E8384F]/30 flex items-center justify-center text-[#E8384F]">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-4 flex flex-wrap items-center justify-between gap-4 print:hidden shadow-xl">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#5B6470]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome de guerra, graduação, matrícula ou função..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/50 rounded-[12px] text-xs text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Subunidade Filter */}
          <div className="flex items-center space-x-2 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2">
            <span className="text-[#9AA3AE] font-bold">Subunidade:</span>
            <select
              value={subunidadeFilter}
              onChange={(e) => setSubunidadeFilter(e.target.value)}
              className="bg-transparent text-[#33C9EB] font-black focus:outline-none cursor-pointer uppercase"
            >
              <option value="TODOS" className="bg-[#13161C] text-[#F1F3F5]">TODAS AS SUBUNIDADES</option>
              {SUBUNIDADES.map((su) => (
                <option key={su} value={su} className="bg-[#13161C] text-[#F1F3F5]">
                  {su}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] p-1">
            <Filter className="w-3.5 h-3.5 text-[#5B6470] ml-2 mr-1" />
            <button
              onClick={() => setStatusFilter('TODOS')}
              className={`px-3 py-1.5 rounded-[8px] font-black transition-all cursor-pointer ${
                statusFilter === 'TODOS' ? 'bg-[#FF7A29] text-[#0A0C10]' : 'text-[#9AA3AE] hover:text-[#F1F3F5]'
              }`}
            >
              TODOS
            </button>
            <button
              onClick={() => setStatusFilter('APTO')}
              className={`px-3 py-1.5 rounded-[8px] font-black transition-all cursor-pointer ${
                statusFilter === 'APTO' ? 'bg-[#FF7A29] text-[#0A0C10]' : 'text-[#9AA3AE] hover:text-[#F1F3F5]'
              }`}
            >
              PRONTOS
            </button>
            <button
              onClick={() => setStatusFilter('FIXA')}
              className={`px-3 py-1.5 rounded-[8px] font-black transition-all cursor-pointer ${
                statusFilter === 'FIXA' ? 'bg-[#F2B84B] text-[#0A0C10]' : 'text-[#9AA3AE] hover:text-[#F1F3F5]'
              }`}
            >
              FUNÇÃO FIXA
            </button>
            <button
              onClick={() => setStatusFilter('DESTINO')}
              className={`px-3 py-1.5 rounded-[8px] font-black transition-all cursor-pointer ${
                statusFilter === 'DESTINO' ? 'bg-[#E8384F] text-[#0A0C10]' : 'text-[#9AA3AE] hover:text-[#F1F3F5]'
              }`}
            >
              DESTINOS
            </button>
          </div>
        </div>
      </div>

      {/* Main Table with Strict Military Hierarchy & Safe Intra-Tier Reordering */}
      <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[24px] shadow-2xl overflow-hidden p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#13161C] text-[#9AA3AE] uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">
              <tr>
                <th className="p-3.5 w-14 text-[#F2B84B] font-black text-center">Nº</th>
                <th className="p-3.5 w-24 text-[#33C9EB]">Grad</th>
                <th className="p-3.5 text-[#F1F3F5]">Nome de Guerra</th>
                <th className="p-3.5 w-32">Subunidade</th>
                <th className="p-3.5">Função</th>
                <th className="p-3.5">Situação Operacional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)] bg-[#13161C]">
              {filteredMilitares.map((m, idx) => {
                const destino = getActiveDestino(m.id);
                
                const getFuncaoFormatada = () => {
                  if (m.funcaoFixa && m.funcaoFixa.trim()) return m.funcaoFixa.trim();
                  switch (m.funcaoPadrao) {
                    case 'cozinheiro': return 'Cozinheiro';
                    case 'aux_cozinheiro': return 'Aux. Cozinheiro';
                    case 'cassineiro': return 'Cassineiro';
                    case 'padeiro': return 'Padeiro';
                    case 'permanencia': return 'Permanência';
                    default: return m.funcaoPadrao || 'Permanência';
                  }
                };

                return (
                  <tr 
                    key={m.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, m.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, m.id)}
                    className="hover:bg-[#1B1F27] transition-colors group cursor-default"
                  >
                    <td className="p-3.5 font-black text-[#F2B84B] text-center font-tabular">
                      {(idx + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="p-3.5 font-bold text-[#33C9EB]">{m.grad}</td>
                    <td className="p-3.5 font-bold text-[#F1F3F5] font-sans">
                      <div className="flex items-center space-x-2">
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, m.id)}
                          className="cursor-grab active:cursor-grabbing text-[#5B6470] hover:text-[#F2B84B] p-1 rounded shrink-0 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] transition-colors"
                          title="Reordenar dentro da mesma graduação"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-black text-[#F1F3F5]">{m.nomeGuerra}</span>
                        {m.nomeCompleto && (
                          <span className="text-[10px] text-[#9AA3AE] font-normal hidden lg:inline">
                            ({m.nomeCompleto})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-[#9AA3AE] font-semibold">{m.setor}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] text-[#F2B84B] font-black text-[11px] uppercase">
                        {getFuncaoFormatada()}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {destino ? (
                        <div className="inline-flex flex-col">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] bg-[#2A0C10] border border-[#E8384F]/40 text-[#E8384F] font-black text-[10px] uppercase">
                            <AlertTriangle className="w-3 h-3 mr-1 text-[#E8384F]" />
                            {destino.tipo} ({destino.dataInicio.split('-').reverse().join('/')} a {destino.dataFim.split('-').reverse().join('/')})
                          </span>
                          {destino.motivo && (
                            <span className="text-[10px] text-[#9AA3AE] mt-0.5">
                              Obs: {destino.motivo}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] bg-[#0A0C10] border border-[#3ED598]/40 text-[#3ED598] font-black text-[10px] uppercase shadow-[0_0_8px_rgba(62,213,152,0.2)]">
                          <CheckCircle className="w-3 h-3 mr-1 text-[#3ED598]" />
                          APTO PARA O SERVIÇO
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
