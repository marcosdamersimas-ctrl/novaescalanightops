import React, { useState, useEffect } from 'react';
import { Militar, Destino, DestinoTipo } from '../types';
import { AlertTriangle, Plus, Trash2, Shield, Search, Lock, PlusCircle, X, Check, Sparkles } from 'lucide-react';

interface DestinosViewProps {
  militares: Militar[];
  destinos: Destino[];
  onAddDestino: (destino: Omit<Destino, 'id'>) => void;
  onDeleteDestino: (id: string) => void;
}

const DEFAULT_TIPOS: string[] = [
  'Férias',
  'Baixa Hospitalar',
  'Dispensa Médica',
  'Licença Prêmio',
  'Serviço Externo',
  'Missão',
  'Missão Especial',
  'Curso / Estágio',
  'Dispensa como Recompensa',
  'Licença Paternidade / Núpcias',
  'Trabalho de Campo / Manobra'
];

export const DestinosView: React.FC<DestinosViewProps> = ({
  militares,
  destinos,
  onAddDestino,
  onDeleteDestino,
}) => {
  const [tiposDestino, setTiposDestino] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sge_tipos_destino');
      if (saved) {
        return Array.from(new Set([...DEFAULT_TIPOS, ...JSON.parse(saved)]));
      }
    } catch {
      // fallback
    }
    return DEFAULT_TIPOS;
  });

  const [showNewTipoModal, setShowNewTipoModal] = useState(false);
  const [novoTipoNome, setNovoTipoNome] = useState('');

  const [selectedMilitarId, setSelectedMilitarId] = useState<string>(
    militares[0]?.id || ''
  );
  const [tipo, setTipo] = useState<string>(tiposDestino[0] || 'Férias');
  const [dataInicio, setDataInicio] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dataFim, setDataFim] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [motivo, setMotivo] = useState('');
  const [bloqueiaEscala] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!selectedMilitarId && militares.length > 0) {
      setSelectedMilitarId(militares[0].id);
    }
  }, [militares, selectedMilitarId]);

  const handleCreateNewTipo = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = novoTipoNome.trim();
    if (!trimmed) return;

    if (!tiposDestino.includes(trimmed)) {
      const updated = [...tiposDestino, trimmed];
      setTiposDestino(updated);
      try {
        localStorage.setItem('sge_tipos_destino', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving custom destino types', err);
      }
      setTipo(trimmed);
    } else {
      setTipo(trimmed);
    }

    setNovoTipoNome('');
    setShowNewTipoModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilitarId) return;

    onAddDestino({
      militarId: selectedMilitarId,
      tipo: tipo as DestinoTipo,
      dataInicio,
      dataFim,
      motivo: motivo.trim() || undefined,
      bloqueiaEscala,
    });

    setMotivo('');
  };

  const sortedMilitares = [...militares].sort((a, b) => a.ordem - b.ordem);

  const filteredDestinos = destinos.filter((d) => {
    const mil = militares.find((m) => m.id === d.militarId);
    if (!mil) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        mil.nomeGuerra.toLowerCase().includes(term) ||
        mil.nomeCompleto.toLowerCase().includes(term) ||
        mil.grad.toLowerCase().includes(term) ||
        d.tipo.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner Header */}
      <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[26px] p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-[14px] bg-[#2A0C10] border border-[#E8384F]/30 flex items-center justify-center text-[#E8384F]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-black text-[#F1F3F5] uppercase tracking-wide font-sans">
                GERENCIAR DESTINOS & BLOQUEIOS
              </h2>
              <span className="text-[10px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#FF7A29] px-2 py-0.5 rounded font-black font-tabular">
                {destinos.length} ATIVOS
              </span>
            </div>
            <p className="text-xs text-[#9AA3AE] mt-0.5 font-mono">
              Lançamento de férias, dispensas médicas e afastamentos que bloqueiam a escala
            </p>
          </div>
        </div>

        {/* Criar Destino Button */}
        <button
          onClick={() => setShowNewTipoModal(true)}
          className="py-2.5 px-4 bg-[#1B1F27] hover:bg-[#1B1F27]/80 text-[#33C9EB] border border-[rgba(255,255,255,0.06)] font-black rounded-[12px] text-xs uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Criar Tipo de Destino</span>
        </button>
      </div>

      {/* Modal: Criar Novo Tipo de Destino */}
      {showNewTipoModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[22px] w-full max-w-md shadow-2xl overflow-hidden font-mono text-xs">
            <div className="p-5 bg-[#1B1F27] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#FF7A29]" />
                <h3 className="text-sm font-black text-[#F1F3F5] uppercase tracking-wide font-sans">
                  Criar Novo Tipo de Destino
                </h3>
              </div>
              <button
                onClick={() => setShowNewTipoModal(false)}
                className="p-1.5 text-[#9AA3AE] hover:text-[#F1F3F5] rounded-lg bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTipo} className="p-6 space-y-4">
              <div>
                <label className="block text-[#9AA3AE] mb-1 uppercase font-bold">Nome do Destino / Motivo</label>
                <input
                  type="text"
                  value={novoTipoNome}
                  onChange={(e) => setNovoTipoNome(e.target.value)}
                  placeholder="Ex: Operação Fronteira, Guarda da Coudelaria..."
                  className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/50 focus:border-[#FF7A29] rounded-[12px] px-3.5 py-2.5 text-xs text-[#F1F3F5] focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewTipoModal(false)}
                  className="py-2.5 px-4 bg-[#0A0C10] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#9AA3AE] rounded-[10px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black rounded-[10px] uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer shadow-[0_0_15px_rgba(255,122,41,0.25)]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Destino</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form Card for Launching Destination */}
      <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[rgba(255,255,255,0.06)]">
          <h3 className="text-sm font-black text-[#F1F3F5] uppercase tracking-wide flex items-center gap-2 font-sans">
            <Plus className="w-4 h-4 text-[#FF7A29]" />
            <span>Lançar Destino para Militar</span>
          </h3>
          <button
            type="button"
            onClick={() => setShowNewTipoModal(true)}
            className="text-xs text-[#33C9EB] hover:underline cursor-pointer flex items-center gap-1 font-bold"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Adicionar Novo Tipo</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Select Military */}
          <div className="lg:col-span-1">
            <label className="block text-[#9AA3AE] mb-1 uppercase font-bold">Militar</label>
            <select
              value={selectedMilitarId}
              onChange={(e) => setSelectedMilitarId(e.target.value)}
              className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/50 rounded-[12px] px-3 py-2 text-xs text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29] cursor-pointer"
            >
              {sortedMilitares.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#13161C]">
                  {m.ordem.toString().padStart(2, '0')} - {m.grad} {m.nomeGuerra} ({m.setor})
                </option>
              ))}
            </select>
          </div>

          {/* Type of Destination */}
          <div>
            <label className="block text-[#9AA3AE] mb-1 uppercase font-bold">Tipo de Destino</label>
            <div className="flex items-center gap-1.5">
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] hover:border-[#F2B84B]/50 rounded-[12px] px-3 py-2 text-xs text-[#F2B84B] font-bold focus:outline-none focus:border-[#F2B84B] cursor-pointer"
              >
                {tiposDestino.map((t) => (
                  <option key={t} value={t} className="bg-[#13161C] text-[#F1F3F5]">
                    {t}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewTipoModal(true)}
                className="p-2 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29] text-[#FF7A29] rounded-[12px] cursor-pointer"
                title="Criar novo tipo de destino"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[#9AA3AE] mb-1 uppercase font-bold">Data Inicial</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/50 rounded-[12px] px-3 py-2 text-xs text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29] cursor-pointer font-bold"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[#9AA3AE] mb-1 uppercase font-bold">Data Final</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/50 rounded-[12px] px-3 py-2 text-xs text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29] cursor-pointer font-bold"
              required
            />
          </div>

          {/* Reason / Observation */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-[#9AA3AE] mb-1 uppercase font-bold">Motivo / Observação</label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Concessão de férias regulamentares, ordem de serviço, etc."
              className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/50 rounded-[12px] px-3.5 py-2 text-xs text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black rounded-[12px] text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-[0_0_15px_rgba(255,122,41,0.25)]"
            >
              <Lock className="w-4 h-4" />
              <span>Bloquear na Escala</span>
            </button>
          </div>
        </form>
      </div>

      {/* Destinations Table */}
      <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[24px] shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-black text-[#F1F3F5] uppercase tracking-wide flex items-center gap-2 font-sans">
            <Shield className="w-4 h-4 text-[#F2B84B]" />
            <span>Destinos Registrados ({destinos.length} Registros)</span>
          </h3>

          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#5B6470]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar militar ou destino..."
              className="w-full pl-8 pr-3 py-2 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/50 rounded-[12px] text-xs text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#13161C] text-[#9AA3AE] uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">
              <tr>
                <th className="p-3.5 w-14 text-center text-[#F2B84B]">Nº</th>
                <th className="p-3.5 text-[#F1F3F5]">Militar (Grad / Nome)</th>
                <th className="p-3.5">Tipo de Destino</th>
                <th className="p-3.5">Período</th>
                <th className="p-3.5">Motivo</th>
                <th className="p-3.5">Bloqueio</th>
                <th className="p-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)] bg-[#13161C]">
              {filteredDestinos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#5B6470] italic">
                    Nenhum destino lançado no momento.
                  </td>
                </tr>
              ) : (
                filteredDestinos.map((d) => {
                  const mil = militares.find((m) => m.id === d.militarId);
                  const inicioFmt = d.dataInicio.split('-').reverse().join('/');
                  const fimFmt = d.dataFim.split('-').reverse().join('/');

                  return (
                    <tr key={d.id} className="hover:bg-[#1B1F27] transition-colors">
                      <td className="p-3.5 font-black text-[#F2B84B] text-center font-tabular">
                        {mil ? mil.ordem.toString().padStart(2, '0') : '--'}
                      </td>
                      <td className="p-3.5 font-bold text-[#F1F3F5] font-sans">
                        {mil ? `${mil.grad} ${mil.nomeGuerra}` : 'Militar Desconhecido'}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-[8px] bg-[#2A0C10] border border-[#E8384F]/40 text-[#E8384F] font-black text-[10px] uppercase">
                          {d.tipo}
                        </span>
                      </td>
                      <td className="p-3.5 text-[#F1F3F5] font-bold font-tabular">
                        {inicioFmt} até {fimFmt}
                      </td>
                      <td className="p-3.5 text-[#9AA3AE]">
                        {d.motivo || '---'}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-[8px] bg-[#0A0C10] border border-[#3ED598]/40 text-[#3ED598] font-black text-[10px]">
                          BLOQUEADO
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => onDeleteDestino(d.id)}
                          className="p-1.5 text-[#9AA3AE] hover:text-[#E8384F] hover:bg-[#2A0C10] rounded-lg transition-all cursor-pointer"
                          title="Remover Destino"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
