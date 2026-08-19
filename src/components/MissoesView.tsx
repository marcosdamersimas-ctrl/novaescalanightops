import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Calendar, 
  Filter, 
  Search, 
  Trash2, 
  AlertTriangle, 
  Check, 
  X 
} from 'lucide-react';
import { Missao, MissaoPrioridade, MissaoStatus, Militar, UserSession, UserAccount } from '../types';
import { triggerHaptic } from '../utils/helpers';

interface MissoesViewProps {
  session: UserSession;
  militares: Militar[];
  users: UserAccount[];
  missoes: Missao[];
  onSaveMissao: (missao: Missao) => void;
  onUpdateStatus: (missaoId: string, status: MissaoStatus) => void;
  onDeleteMissao: (missaoId: string) => void;
}

export const MissoesView: React.FC<MissoesViewProps> = ({
  session,
  militares,
  users,
  missoes,
  onSaveMissao,
  onUpdateStatus,
  onDeleteMissao
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('TODAS');
  const [filterResponsavel, setFilterResponsavel] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  // Form State
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [designadoPara, setDesignadoPara] = useState('');
  const [prioridade, setPrioridade] = useState<MissaoPrioridade>('normal');
  const [prazoData, setPrazoData] = useState('');
  const [prazoHora, setPrazoHora] = useState('17:00');
  const [formError, setFormError] = useState('');

  // Build list of assignees
  const assigneeOptions = React.useMemo(() => {
    const map = new Map<string, { id: string; nome: string }>();

    users
      .filter((u) => u.orgId === session.orgId)
      .forEach((u) => {
        const label = `${u.grad} ${u.nomeGuerra}`;
        map.set(label, { id: u.id, nome: label });
      });

    militares
      .filter((m) => m.ativo !== false)
      .forEach((m) => {
        const label = `${m.grad} ${m.nomeGuerra}`;
        if (!map.has(label)) {
          map.set(label, { id: m.id, nome: label });
        }
      });

    return Array.from(map.values());
  }, [users, militares, session.orgId]);

  const isMissionOverdue = (m: Missao) => {
    if (m.status === 'concluida') return false;
    if (!m.prazoData) return false;

    const now = new Date();
    const timeStr = m.prazoHora || '23:59';
    const deadline = new Date(`${m.prazoData}T${timeStr}:00`);
    return now > deadline;
  };

  const filteredMissoes = missoes.filter((m) => {
    const isOverdue = isMissionOverdue(m);

    if (filterStatus === 'PENDENTE' && m.status !== 'pendente') return false;
    if (filterStatus === 'EM_ANDAMENTO' && m.status !== 'em_andamento') return false;
    if (filterStatus === 'CONCLUIDA' && m.status !== 'concluida') return false;
    if (filterStatus === 'ATRASADA' && !isOverdue) return false;

    if (filterResponsavel !== 'TODOS' && m.designadoParaNome !== filterResponsavel) {
      return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        m.titulo.toLowerCase().includes(term) ||
        (m.descricao && m.descricao.toLowerCase().includes(term)) ||
        m.designadoParaNome.toLowerCase().includes(term) ||
        m.criadoPorNome.toLowerCase().includes(term)
      );
    }

    return true;
  });

  const totalMissoes = missoes.length;
  const pendentesCount = missoes.filter((m) => m.status === 'pendente').length;
  const emAndamentoCount = missoes.filter((m) => m.status === 'em_andamento').length;
  const concluidasCount = missoes.filter((m) => m.status === 'concluida').length;
  const atrasadasCount = missoes.filter(isMissionOverdue).length;

  const handleOpenModal = () => {
    setTitulo('');
    setDescricao('');
    setDesignadoPara(assigneeOptions[0]?.nome || `${session.grad} ${session.nomeGuerra}`);
    setPrioridade('normal');
    setPrazoData(new Date().toISOString().split('T')[0]);
    setPrazoHora('17:00');
    setFormError('');
    setShowNewModal(true);
  };

  const handleCreateMissao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setFormError('Informe o título da missão.');
      return;
    }
    if (!designadoPara.trim()) {
      setFormError('Selecione o militar responsável.');
      return;
    }

    const newMissao: Missao = {
      id: `mis_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orgId: session.orgId,
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      criadoPor: session.id,
      criadoPorNome: `${session.grad} ${session.nomeGuerra}`,
      designadoPara: designadoPara,
      designadoParaNome: designadoPara,
      prioridade,
      status: 'pendente',
      prazoData: prazoData || undefined,
      prazoHora: prazoData ? prazoHora : undefined,
      dataCriacao: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveMissao(newMissao);
    triggerHaptic();
    setShowNewModal(false);
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[26px] p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-[14px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FF7A29]">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-[#F1F3F5] uppercase tracking-wide font-sans">
              MISSÕES / PLANNER OPERACIONAL
            </h2>
            <p className="text-xs text-[#9AA3AE] mt-0.5 font-mono">
              Distribuição, ordens de serviço e acompanhamento de tarefas da subunidade
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenModal}
          className="py-2.5 px-5 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black rounded-[12px] text-xs uppercase tracking-wider flex items-center space-x-2 transition-all shadow-[0_0_15px_rgba(255,122,41,0.25)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>NOVA MISSÃO</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setFilterStatus('TODAS')}
          className={`p-4 rounded-[18px] border text-left transition-all cursor-pointer ${
            filterStatus === 'TODAS'
              ? 'bg-[#1B1F27] border-[#FF7A29] text-[#FF7A29]'
              : 'bg-[#13161C] border-[rgba(255,255,255,0.06)] text-[#9AA3AE] hover:border-[rgba(255,255,255,0.14)]'
          }`}
        >
          <span className="text-[10px] uppercase block font-bold">Total</span>
          <span className="text-2xl font-black text-[#F1F3F5] mt-0.5 font-tabular">{totalMissoes}</span>
        </button>

        <button
          onClick={() => setFilterStatus('PENDENTE')}
          className={`p-4 rounded-[18px] border text-left transition-all cursor-pointer ${
            filterStatus === 'PENDENTE'
              ? 'bg-[#1B1F27] border-[#F2B84B] text-[#F2B84B]'
              : 'bg-[#13161C] border-[rgba(255,255,255,0.06)] text-[#9AA3AE] hover:border-[rgba(255,255,255,0.14)]'
          }`}
        >
          <span className="text-[10px] uppercase block font-bold text-[#F2B84B]">Pendentes</span>
          <span className="text-2xl font-black text-[#F2B84B] mt-0.5 font-tabular">{pendentesCount}</span>
        </button>

        <button
          onClick={() => setFilterStatus('EM_ANDAMENTO')}
          className={`p-4 rounded-[18px] border text-left transition-all cursor-pointer ${
            filterStatus === 'EM_ANDAMENTO'
              ? 'bg-[#1B1F27] border-[#33C9EB] text-[#33C9EB]'
              : 'bg-[#13161C] border-[rgba(255,255,255,0.06)] text-[#9AA3AE] hover:border-[rgba(255,255,255,0.14)]'
          }`}
        >
          <span className="text-[10px] uppercase block font-bold text-[#33C9EB]">Em Andamento</span>
          <span className="text-2xl font-black text-[#33C9EB] mt-0.5 font-tabular">{emAndamentoCount}</span>
        </button>

        <button
          onClick={() => setFilterStatus('CONCLUIDA')}
          className={`p-4 rounded-[18px] border text-left transition-all cursor-pointer ${
            filterStatus === 'CONCLUIDA'
              ? 'bg-[#1B1F27] border-[#3ED598] text-[#3ED598]'
              : 'bg-[#13161C] border-[rgba(255,255,255,0.06)] text-[#9AA3AE] hover:border-[rgba(255,255,255,0.14)]'
          }`}
        >
          <span className="text-[10px] uppercase block font-bold text-[#3ED598]">Concluídas</span>
          <span className="text-2xl font-black text-[#3ED598] mt-0.5 font-tabular">{concluidasCount}</span>
        </button>

        <button
          onClick={() => setFilterStatus('ATRASADA')}
          className={`p-4 rounded-[18px] border text-left transition-all col-span-2 sm:col-span-1 cursor-pointer ${
            filterStatus === 'ATRASADA'
              ? 'bg-[#2A0C10] border-[#E8384F] text-[#E8384F]'
              : 'bg-[#13161C] border-[rgba(255,255,255,0.06)] text-[#9AA3AE] hover:border-[rgba(255,255,255,0.14)]'
          }`}
        >
          <span className="text-[10px] uppercase block font-bold text-[#E8384F]">Em Atraso</span>
          <span className="text-2xl font-black text-[#E8384F] mt-0.5 font-tabular">{atrasadasCount}</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#5B6470] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por missão, militar designado ou descrição..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/50 rounded-[12px] text-xs text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2">
            <Filter className="w-4 h-4 text-[#FF7A29]" />
            <span className="text-[#9AA3AE] font-bold">Responsável:</span>
            <select
              value={filterResponsavel}
              onChange={(e) => setFilterResponsavel(e.target.value)}
              className="bg-transparent text-[#FF7A29] font-black focus:outline-none cursor-pointer"
            >
              <option value="TODOS" className="bg-[#13161C] text-[#F1F3F5]">Todos os Militares</option>
              {assigneeOptions.map((opt) => (
                <option key={opt.nome} value={opt.nome} className="bg-[#13161C] text-[#F1F3F5]">
                  {opt.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Missions List */}
      <div className="space-y-3">
        {filteredMissoes.length === 0 ? (
          <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-12 text-center text-[#9AA3AE]">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 text-[#5B6470]" />
            <p className="text-sm font-bold text-[#F1F3F5]">Nenhuma missão encontrada</p>
            <p className="text-xs text-[#5B6470] mt-1">
              {searchTerm || filterStatus !== 'TODAS' || filterResponsavel !== 'TODOS'
                ? 'Tente alterar os filtros aplicados.'
                : 'Clique em "NOVA MISSÃO" para registrar tarefas.'}
            </p>
          </div>
        ) : (
          filteredMissoes.map((m) => {
            const isOverdue = isMissionOverdue(m);

            return (
              <div
                key={m.id}
                className={`p-5 rounded-[22px] border transition-all duration-200 ${
                  isOverdue
                    ? 'bg-[#2A0C10] border-[#E8384F]/60'
                    : m.status === 'concluida'
                    ? 'bg-[#13161C] border-[rgba(255,255,255,0.04)] opacity-75'
                    : m.status === 'em_andamento'
                    ? 'bg-[#13161C] border-[#33C9EB]/40'
                    : 'bg-[#13161C] border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/50'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Priority Tag */}
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-[6px] uppercase border ${
                          m.prioridade === 'urgente'
                            ? 'bg-[#2A0C10] text-[#E8384F] border-[#E8384F]/60'
                            : m.prioridade === 'importante'
                            ? 'bg-[#1B1F27] text-[#F2B84B] border-[#F2B84B]/50'
                            : 'bg-[#0A0C10] text-[#9AA3AE] border-[rgba(255,255,255,0.06)]'
                        }`}
                      >
                        {m.prioridade.toUpperCase()}
                      </span>

                      {/* Status Tag */}
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-[6px] uppercase border ${
                          m.status === 'concluida'
                            ? 'bg-[#1B1F27] text-[#3ED598] border-[#3ED598]/50'
                            : m.status === 'em_andamento'
                            ? 'bg-[#1B1F27] text-[#33C9EB] border-[#33C9EB]/50'
                            : 'bg-[#1B1F27] text-[#F2B84B] border-[#F2B84B]/50'
                        }`}
                      >
                        {m.status === 'em_andamento' ? 'EM ANDAMENTO' : m.status.toUpperCase()}
                      </span>

                      {/* Overdue alert */}
                      {isOverdue && (
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-[6px] uppercase bg-[#E8384F] text-[#0A0C10] flex items-center gap-1 font-bold">
                          <AlertTriangle className="w-3 h-3" />
                          EM ATRASO
                        </span>
                      )}
                    </div>

                    <h3 className={`text-sm md:text-base font-black tracking-wide ${m.status === 'concluida' ? 'line-through text-[#5B6470]' : 'text-[#F1F3F5]'}`}>
                      {m.titulo}
                    </h3>

                    {m.descricao && (
                      <p className="text-xs text-[#9AA3AE] leading-relaxed font-sans">
                        {m.descricao}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#9AA3AE] pt-1">
                      <div className="flex items-center gap-1.5 text-[#FF7A29] font-bold">
                        <User className="w-3.5 h-3.5" />
                        <span>Designado: {m.designadoParaNome}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[#5B6470]">
                        <span>Determinada por: {m.criadoPorNome}</span>
                      </div>

                      {m.prazoData && (
                        <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-[#E8384F] font-bold' : 'text-[#F2B84B]'}`}>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            Prazo: {new Date(m.prazoData + 'T12:00:00').toLocaleDateString('pt-BR')} {m.prazoHora && `às ${m.prazoHora}`}
                          </span>
                        </div>
                      )}

                      {m.dataConclusao && (
                        <div className="flex items-center gap-1 text-[#3ED598]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Concluída em: {new Date(m.dataConclusao).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status Quick Toggles */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[rgba(255,255,255,0.06)]">
                    {m.status !== 'concluida' ? (
                      <>
                        {m.status === 'pendente' && (
                          <button
                            onClick={() => {
                              triggerHaptic();
                              onUpdateStatus(m.id, 'em_andamento');
                            }}
                            className="py-1.5 px-3 bg-[#1B1F27] hover:bg-[#1B1F27]/80 border border-[#33C9EB]/50 text-[#33C9EB] rounded-[10px] text-xs font-bold transition-all cursor-pointer"
                          >
                            Iniciar
                          </button>
                        )}

                        <button
                          onClick={() => {
                            triggerHaptic();
                            onUpdateStatus(m.id, 'concluida');
                          }}
                          className="py-1.5 px-3 bg-[#3ED598] hover:bg-[#4ff5b2] text-[#0A0C10] rounded-[10px] text-xs font-black flex items-center space-x-1 transition-all cursor-pointer shadow-md"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Concluir</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          triggerHaptic();
                          onUpdateStatus(m.id, 'pendente');
                        }}
                        className="py-1.5 px-3 bg-[#0A0C10] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#9AA3AE] rounded-[10px] text-xs transition-all cursor-pointer"
                      >
                        Reabrir
                      </button>
                    )}

                    <button
                      onClick={() => {
                        triggerHaptic();
                        onDeleteMissao(m.id);
                      }}
                      className="p-2 text-[#9AA3AE] hover:text-[#E8384F] hover:bg-[#2A0C10] rounded-lg transition-colors cursor-pointer"
                      title="Excluir Missão"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Nova Missão */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 font-mono text-[#F1F3F5]">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-[12px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FF7A29]">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-[#F1F3F5] font-sans">
                    NOVA MISSÃO / PLANNER
                  </h3>
                  <p className="text-xs text-[#9AA3AE]">
                    Lançamento de ordem de serviço operacional
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
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

            <form onSubmit={handleCreateMissao} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#9AA3AE] uppercase font-bold mb-1">
                  Determinada Por
                </label>
                <div className="p-2.5 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] text-[#FF7A29] font-bold flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{session.grad} {session.nomeGuerra}</span>
                </div>
              </div>

              <div>
                <label className="block text-[#9AA3AE] uppercase font-bold mb-1">
                  Designar Para (Militar Responsável) *
                </label>
                <select
                  value={designadoPara}
                  onChange={(e) => setDesignadoPara(e.target.value)}
                  className="w-full p-2.5 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] text-[#F1F3F5] focus:border-[#FF7A29] focus:outline-none cursor-pointer font-mono text-xs"
                >
                  {assigneeOptions.map((opt) => (
                    <option key={opt.nome} value={opt.nome} className="bg-[#13161C] text-[#F1F3F5]">
                      {opt.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#9AA3AE] uppercase font-bold mb-1">
                  Missão / Tarefa (Título) *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Conferência de gêneros e estoque no Rancho"
                  className="w-full p-2.5 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] text-[#F1F3F5] focus:border-[#FF7A29] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#9AA3AE] uppercase font-bold mb-1">
                  Detalhes / Instruções (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Instruções específicas para a execução da tarefa..."
                  className="w-full p-2.5 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] text-[#F1F3F5] focus:border-[#FF7A29] focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-[#9AA3AE] uppercase font-bold mb-1">
                  Prioridade
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['normal', 'importante', 'urgente'] as MissaoPrioridade[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrioridade(p)}
                      className={`p-2 rounded-[10px] uppercase font-bold text-center border transition-all cursor-pointer ${
                        prioridade === p
                          ? p === 'urgente'
                            ? 'bg-[#2A0C10] border-[#E8384F] text-[#E8384F]'
                            : p === 'importante'
                            ? 'bg-[#1B1F27] border-[#F2B84B] text-[#F2B84B]'
                            : 'bg-[#1B1F27] border-[#FF7A29] text-[#FF7A29]'
                          : 'bg-[#0A0C10] border-[rgba(255,255,255,0.06)] text-[#9AA3AE]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9AA3AE] uppercase font-bold mb-1">
                    Prazo - Data
                  </label>
                  <input
                    type="date"
                    value={prazoData}
                    onChange={(e) => setPrazoData(e.target.value)}
                    className="w-full p-2.5 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] text-[#F1F3F5] focus:border-[#FF7A29] focus:outline-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[#9AA3AE] uppercase font-bold mb-1">
                    Horário Limite
                  </label>
                  <input
                    type="time"
                    value={prazoHora}
                    onChange={(e) => setPrazoHora(e.target.value)}
                    className="w-full p-2.5 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] text-[#F1F3F5] focus:border-[#FF7A29] focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2.5 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] text-[#9AA3AE] hover:text-[#F1F3F5] rounded-[10px] uppercase font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black rounded-[10px] uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(255,122,41,0.25)] cursor-pointer"
                >
                  Registrar Missão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
