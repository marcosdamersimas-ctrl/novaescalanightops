import React, { useState } from 'react';
import { EscalaMeta, FuncaoEscala, Militar } from '../types';
import { 
  X, Trash2, ChefHat, 
  Users, CheckSquare, Square, Search, Layers, Sparkles
} from 'lucide-react';
import { triggerHaptic, getParticipantsForScale } from '../utils/helpers';

interface ScaleEditorModalProps {
  scaleToEdit?: EscalaMeta | null;
  militares: Militar[];
  onSaveScale: (scale: EscalaMeta) => void;
  onDeleteScale?: (scaleId: string) => void;
  onClose: () => void;
}

const DEFAULT_PRESET_FUNCTIONS: { group: string; items: FuncaoEscala[] }[] = [
  {
    group: 'Permanência',
    items: [{ id: 'f-perm', nome: 'Permanência', sigla: 'P' }]
  },
  {
    group: 'Cozinha',
    items: [
      { id: 'f-cz', nome: 'Cozinheiro', sigla: 'CZ' },
      { id: 'f-a1', nome: '1º Auxiliar', sigla: 'A1' },
      { id: 'f-a2', nome: '2º Auxiliar', sigla: 'A2' },
      { id: 'f-lav', nome: 'Lavagem de Talheres', sigla: 'LAV' },
    ]
  },
  {
    group: 'Cassino',
    items: [
      { id: 'f-cs', nome: 'Cassineiro dos Sargentos', sigla: 'CS' },
      { id: 'f-co', nome: 'Cassineiro dos Oficiais', sigla: 'CO' },
    ]
  },
  {
    group: 'Padaria',
    items: [
      { id: 'f-pd', nome: 'Padeiro Diurno', sigla: 'PD' },
      { id: 'f-pn', nome: 'Padeiro Noturno', sigla: 'PN' },
    ]
  },
  {
    group: 'Tático / Guarda',
    items: [
      { id: 'f-gda', nome: 'Guarda / Sentinela', sigla: 'G' },
      { id: 'f-plt', nome: 'Plantão', sigla: 'PL' },
    ]
  }
];

export const ScaleEditorModal: React.FC<ScaleEditorModalProps> = ({
  scaleToEdit,
  militares,
  onSaveScale,
  onDeleteScale,
  onClose
}) => {
  const isEditing = !!scaleToEdit;

  const [nome, setNome] = useState(scaleToEdit?.nome || '');
  const [sigla, setSigla] = useState(scaleToEdit?.sigla || '');
  const [descricao, setDescricao] = useState(scaleToEdit?.descricao || '');
  const [funcoes, setFuncoes] = useState<FuncaoEscala[]>(
    scaleToEdit?.funcoes && scaleToEdit.funcoes.length > 0 
      ? [...scaleToEdit.funcoes]
      : [{ id: `f-${Date.now()}`, nome: scaleToEdit?.nome || 'Serviço', sigla: scaleToEdit?.sigla || 'P' }]
  );

  // Filter mode for militares
  const [filterMode, setFilterMode] = useState<'all' | 'specific'>('specific');

  const [selectedMilitarIds, setSelectedMilitarIds] = useState<string[]>(() => {
    if (scaleToEdit) {
      if (scaleToEdit.militaresPermitidos && scaleToEdit.militaresPermitidos.length > 0) {
        return scaleToEdit.militaresPermitidos;
      }
      return getParticipantsForScale(scaleToEdit.id, militares, scaleToEdit).map((m) => m.id);
    }
    return [];
  });

  const [militarFuncaoPreferencia, setMilitarFuncaoPreferencia] = useState<Record<string, string>>(
    scaleToEdit?.militarFuncaoPreferencia || {}
  );

  const handleSetMilitarFuncao = (militarId: string, funcSigla: string) => {
    setMilitarFuncaoPreferencia((prev) => ({
      ...prev,
      [militarId]: funcSigla
    }));
  };

  // New custom function inputs
  const [customFuncaoNome, setCustomFuncaoNome] = useState('');
  const [customFuncaoSigla, setCustomFuncaoSigla] = useState('');

  // Search filter inside military selection list
  const [militarSearch, setMilitarSearch] = useState('');

  // Add custom function
  const handleAddCustomFuncao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFuncaoNome.trim() || !customFuncaoSigla.trim()) return;
    const newFunc: FuncaoEscala = {
      id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nome: customFuncaoNome.trim(),
      sigla: customFuncaoSigla.trim().toUpperCase()
    };
    setFuncoes((prev) => [...prev, newFunc]);
    setCustomFuncaoNome('');
    setCustomFuncaoSigla('');
  };

  // Add preset function
  const handleAddPresetFuncao = (func: FuncaoEscala) => {
    if (funcoes.some((f) => f.sigla === func.sigla)) return;
    setFuncoes((prev) => [
      ...prev,
      {
        id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        nome: func.nome,
        sigla: func.sigla
      }
    ]);
  };

  // Remove function
  const handleRemoveFuncao = (funcId: string) => {
    if (funcoes.length <= 1) {
      alert('A escala deve conter ao menos 1 serviço/função.');
      return;
    }
    setFuncoes((prev) => prev.filter((f) => f.id !== funcId));
  };

  // Toggle military selection
  const handleToggleMilitar = (id: string) => {
    setSelectedMilitarIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleSelectAllMilitares = () => {
    setSelectedMilitarIds(militares.map((m) => m.id));
  };

  const handleDeselectAllMilitares = () => {
    setSelectedMilitarIds([]);
  };

  const handleSelectPracasOnly = () => {
    const pracas = militares.filter((m) =>
      ['3º Sgt', '2º Sgt', '1º Sgt', 'Subten', 'Cb', 'Sd', 'Sd EV', 'Sd EP'].includes(m.grad)
    );
    setSelectedMilitarIds(pracas.map((m) => m.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    if (!nome.trim() || !sigla.trim()) {
      alert('Preencha o Nome e a Sigla da escala.');
      return;
    }

    if (funcoes.length === 0) {
      alert('Adicione pelo menos uma função/serviço para esta escala.');
      return;
    }

    const scaleId = scaleToEdit?.id || nome.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const updatedScale: EscalaMeta = {
      id: scaleId,
      nome: nome.trim(),
      sigla: sigla.trim().toUpperCase(),
      descricao: descricao.trim() || 'Escala de serviço operacional',
      cor: scaleToEdit?.cor || 'bg-[#1B1F27] text-[#FF7A29] border-[#FF7A29]/40',
      funcoes,
      militaresPermitidos: filterMode === 'specific' ? selectedMilitarIds : undefined,
      militarFuncaoPreferencia,
      militarOrdemArray: scaleToEdit?.militarOrdemArray
    };

    onSaveScale(updatedScale);
    onClose();
  };

  const filteredMilitares = militares.filter((m) => {
    const term = militarSearch.toLowerCase();
    return (
      m.nomeGuerra.toLowerCase().includes(term) ||
      m.nomeCompleto.toLowerCase().includes(term) ||
      m.grad.toLowerCase().includes(term) ||
      m.setor.toLowerCase().includes(term)
    );
  });

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto font-mono text-xs">
      <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[26px] max-w-3xl w-full shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-[#0A0C10] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-[12px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FF7A29]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-[#F1F3F5] uppercase tracking-wide font-sans">
                {isEditing ? `CONFIGURAR ESCALA: ${scaleToEdit.nome}` : 'CRIAR NOVA ESCALA'}
              </h3>
              <p className="text-xs text-[#9AA3AE] mt-0.5">
                Definição de serviços, sub-funções e efetivo participante
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#9AA3AE] hover:text-[#F1F3F5] rounded-[10px] bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* 1. Basic Info */}
          <div className="bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] p-4 rounded-[18px] space-y-3 shadow-inner">
            <h4 className="text-[#FF7A29] font-black uppercase tracking-wider text-xs flex items-center space-x-2 font-sans">
              <Sparkles className="w-4 h-4 text-[#FF7A29]" />
              <span>1. Informações Básicas da Escala</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[#9AA3AE] mb-1 font-bold">Nome da Escala *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Escala de Campo / Guarda"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-[#13161C] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 focus:border-[#FF7A29] rounded-[12px] p-2.5 text-[#F1F3F5] focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[#9AA3AE] mb-1 font-bold">Sigla Curta *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Ex: CMP"
                  value={sigla}
                  onChange={(e) => setSigla(e.target.value)}
                  className="w-full bg-[#13161C] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 focus:border-[#FF7A29] rounded-[12px] p-2.5 text-[#FF7A29] focus:outline-none uppercase font-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#9AA3AE] mb-1 font-bold">Descrição / Finalidade</label>
              <input
                type="text"
                placeholder="Ex: Escala criada para controle diário de serviços..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full bg-[#13161C] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 focus:border-[#FF7A29] rounded-[12px] p-2 text-[#9AA3AE] focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Serviços / Funções da Escala */}
          <div className="bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] p-4 rounded-[18px] space-y-4 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-[#33C9EB] font-black uppercase tracking-wider text-xs flex items-center space-x-2 font-sans">
                <ChefHat className="w-4 h-4 text-[#33C9EB]" />
                <span>2. Serviços & Postos Incluídos ({funcoes.length})</span>
              </h4>
              <span className="text-[11px] text-[#9AA3AE]">
                Você pode mesclar múltiplos serviços em 1 única escala
              </span>
            </div>

            {/* Included Functions Badges */}
            <div className="flex flex-wrap gap-2 p-3 bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[14px] min-h-[50px] items-center">
              {funcoes.map((f) => (
                <div
                  key={f.id}
                  className="bg-[#1B1F27] border border-[#FF7A29]/40 text-[#F1F3F5] px-3 py-1.5 rounded-[10px] flex items-center space-x-2 shadow-sm"
                >
                  <span className="font-black text-[#FF7A29]">[{f.sigla}]:</span>
                  <span className="font-bold">{f.nome}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFuncao(f.id)}
                    className="hover:text-[#E8384F] text-[#9AA3AE] transition-colors p-0.5 cursor-pointer"
                    title="Remover esta função"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Presets Import */}
            <div className="space-y-2">
              <span className="text-[10px] text-[#9AA3AE] font-black uppercase block">
                Importar Serviços Rápidos:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_PRESET_FUNCTIONS.map((group) =>
                  group.items.map((item) => {
                    const exists = funcoes.some((f) => f.sigla === item.sigla);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddPresetFuncao(item)}
                        disabled={exists}
                        className={`px-2.5 py-1 rounded-[8px] text-[10px] font-bold border transition-all cursor-pointer ${
                          exists
                            ? 'bg-[#0A0C10] border-[rgba(255,255,255,0.03)] text-[#5B6470] opacity-40 cursor-not-allowed'
                            : 'bg-[#13161C] border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 text-[#9AA3AE] hover:text-[#F1F3F5]'
                        }`}
                      >
                        + {item.nome} ({item.sigla})
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Custom Function Form */}
            <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-[#9AA3AE] mb-1 text-[10px] uppercase font-bold">Novo Nome do Serviço</label>
                <input
                  type="text"
                  placeholder="Ex: Sentinela das Viaturas"
                  value={customFuncaoNome}
                  onChange={(e) => setCustomFuncaoNome(e.target.value)}
                  className="w-full bg-[#13161C] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 rounded-[10px] p-2 text-[#F1F3F5] focus:outline-none"
                />
              </div>
              <div className="w-28">
                <label className="block text-[#9AA3AE] mb-1 text-[10px] uppercase font-bold">Sigla</label>
                <input
                  type="text"
                  placeholder="Ex: SV"
                  maxLength={6}
                  value={customFuncaoSigla}
                  onChange={(e) => setCustomFuncaoSigla(e.target.value)}
                  className="w-full bg-[#13161C] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 rounded-[10px] p-2 text-[#FF7A29] focus:outline-none uppercase font-black"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomFuncao}
                className="py-2.5 px-4 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black rounded-[10px] uppercase cursor-pointer transition-all shadow-[0_0_15px_rgba(255,122,41,0.25)]"
              >
                + Adicionar
              </button>
            </div>
          </div>

          {/* 3. Seleção de Militares (Efetivo Participante) */}
          <div className="bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] p-4 rounded-[18px] space-y-3 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-[#F2B84B] font-black uppercase tracking-wider text-xs flex items-center space-x-2 font-sans">
                <Users className="w-4 h-4 text-[#F2B84B]" />
                <span>3. Efetivo Participante da Escala</span>
              </h4>
              <span className="text-[11px] font-black text-[#FF7A29] font-tabular">
                {filterMode === 'all'
                  ? `Todos os ${militares.length} Militares Ativos`
                  : `${selectedMilitarIds.length} de ${militares.length} Militares Selecionados`}
              </span>
            </div>

            {/* Mode Selector Radio */}
            <div className="flex items-center space-x-4 bg-[#13161C] p-2.5 rounded-[12px] border border-[rgba(255,255,255,0.06)]">
              <label className="flex items-center space-x-2 cursor-pointer text-[#F1F3F5] font-bold">
                <input
                  type="radio"
                  name="filterMode"
                  checked={filterMode === 'all'}
                  onChange={() => setFilterMode('all')}
                  className="text-[#FF7A29] focus:ring-[#FF7A29] cursor-pointer"
                />
                <span>Todos os Militares da Subunidade</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-[#F1F3F5] font-bold">
                <input
                  type="radio"
                  name="filterMode"
                  checked={filterMode === 'specific'}
                  onChange={() => setFilterMode('specific')}
                  className="text-[#FF7A29] focus:ring-[#FF7A29] cursor-pointer"
                />
                <span>Selecionar Militares Específicos</span>
              </label>
            </div>

            {/* Checklist when filterMode === 'specific' */}
            {filterMode === 'specific' && (
              <div className="space-y-3 pt-2">
                {/* Search & Quick Select Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="w-3.5 h-3.5 text-[#5B6470] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, graduação..."
                      value={militarSearch}
                      onChange={(e) => setMilitarSearch(e.target.value)}
                      className="w-full bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[10px] pl-8 pr-3 py-1.5 text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29] text-xs"
                    />
                  </div>

                  <div className="flex items-center space-x-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={handleSelectAllMilitares}
                      className="px-2.5 py-1.5 bg-[#13161C] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#FF7A29] font-bold rounded-[8px] cursor-pointer"
                    >
                      Marcar Todos
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectPracasOnly}
                      className="px-2.5 py-1.5 bg-[#13161C] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#F2B84B] font-bold rounded-[8px] cursor-pointer"
                    >
                      Apenas Praças
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllMilitares}
                      className="px-2.5 py-1.5 bg-[#13161C] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#9AA3AE] font-bold rounded-[8px] cursor-pointer"
                    >
                      Desmarcar Todos
                    </button>
                  </div>
                </div>

                {/* Military Grid Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-2 bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[14px]">
                  {filteredMilitares.map((m) => {
                    const checked = selectedMilitarIds.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-[12px] border flex flex-col justify-between space-y-1.5 transition-all select-none ${
                          checked
                            ? 'bg-[#1B1F27] border-[#FF7A29]/60 text-[#F1F3F5] shadow-sm'
                            : 'bg-[#0A0C10] border-[rgba(255,255,255,0.06)] text-[#9AA3AE] hover:border-[rgba(255,255,255,0.15)]'
                        }`}
                      >
                        <div
                          onClick={() => handleToggleMilitar(m.id)}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-[#FF7A29] mr-1">{m.grad}</span>
                            <span className="font-black text-[#F1F3F5]">{m.nomeGuerra}</span>
                            <span className="block text-[10px] text-[#5B6470] truncate">{m.setor}</span>
                          </div>
                          {checked ? (
                            <CheckSquare className="w-4 h-4 text-[#FF7A29] shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-[#5B6470] shrink-0" />
                          )}
                        </div>

                        {/* Preferred Function dropdown for this military in this scale */}
                        {checked && funcoes.length > 0 && (
                          <div className="pt-1.5 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-[#9AA3AE] shrink-0">Função:</span>
                            <select
                              value={militarFuncaoPreferencia[m.id] || funcoes[0].sigla}
                              onChange={(e) => handleSetMilitarFuncao(m.id, e.target.value)}
                              className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] text-[10px] font-black text-[#FF7A29] rounded px-1.5 py-0.5 focus:outline-none truncate cursor-pointer"
                            >
                              {funcoes.map((f) => (
                                <option key={f.id} value={f.sigla} className="bg-[#13161C] text-[#F1F3F5]">
                                  {f.sigla} - {f.nome}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <div>
              {isEditing && onDeleteScale && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    if (window.confirm(`Deseja realmente excluir a escala "${scaleToEdit.nome}"? Esta ação removerá a escala permanentemente do sistema.`)) {
                      onDeleteScale(scaleToEdit.id);
                      onClose();
                    }
                  }}
                  className="py-2.5 px-3.5 bg-[#2A0C10] hover:bg-[#351015] border border-[#E8384F]/40 text-[#E8384F] font-bold rounded-[10px] flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Escala</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-[#0A0C10] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#9AA3AE] font-bold rounded-[10px] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="py-2.5 px-6 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black rounded-[10px] uppercase tracking-wider shadow-[0_0_15px_rgba(255,122,41,0.25)] cursor-pointer transition-all"
              >
                {isEditing ? 'Salvar Alterações' : 'Criar Escala'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
