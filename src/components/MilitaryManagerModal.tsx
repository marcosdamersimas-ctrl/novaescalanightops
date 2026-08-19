import React, { useState } from 'react';
import { Militar, Graduacao, EscalaTipo, SUBUNIDADES } from '../types';
import { UserPlus, Trash2, Edit2, Check, X, Shield, Search, UserMinus, UserCheck, Users } from 'lucide-react';
import { triggerHaptic } from '../utils/helpers';

interface MilitaryManagerModalProps {
  militares: Militar[];
  onAddMilitar: (militar: Omit<Militar, 'id'>) => void;
  onUpdateMilitar: (militar: Militar) => void;
  onDeleteMilitar: (id: string) => void;
  onDeleteAllMilitares?: () => void;
  onClose: () => void;
}

const GRADUACOES: Graduacao[] = [
  'Cel', 'Ten Cel', 'Maj', 'Cap', '1º Ten', '2º Ten', 'Asp', 
  'Subten', '1º Sgt', '2º Sgt', '3º Sgt', 'Cb', 'Sd', 'Sd EV', 'Sd EP'
];

export const MilitaryManagerModal: React.FC<MilitaryManagerModalProps> = ({
  militares,
  onAddMilitar,
  onUpdateMilitar,
  onDeleteMilitar,
  onDeleteAllMilitares,
  onClose,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [ordem, setOrdem] = useState<number>(militares.length + 1);
  const [grad, setGrad] = useState<Graduacao>('Sd');
  const [nomeGuerra, setNomeGuerra] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [matricula, setMatricula] = useState('');
  const [setor, setSetor] = useState<string>('Esqd C Ap');
  const [funcaoPadrao, setFuncaoPadrao] = useState<EscalaTipo | ''>('');
  const [concorreEscala, setConcorreEscala] = useState<boolean>(true);
  const [funcaoFixa, setFuncaoFixa] = useState<string>('');

  const resetForm = () => {
    setEditingId(null);
    setOrdem(militares.length + 1);
    setGrad('Sd');
    setNomeGuerra('');
    setNomeCompleto('');
    setMatricula('');
    setSetor('Esqd C Ap');
    setFuncaoPadrao('');
    setConcorreEscala(true);
    setFuncaoFixa('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    if (!nomeGuerra.trim()) return;

    if (editingId) {
      const existing = militares.find((m) => m.id === editingId);
      if (existing) {
        onUpdateMilitar({
          ...existing,
          ordem,
          grad,
          nomeGuerra: nomeGuerra.trim(),
          nomeCompleto: nomeCompleto.trim() || nomeGuerra.trim(),
          matricula: matricula.trim() || '---',
          setor,
          funcaoPadrao: concorreEscala ? (funcaoPadrao === '' ? undefined : (funcaoPadrao as EscalaTipo)) : undefined,
          concorreEscala,
          funcaoFixa: !concorreEscala ? (funcaoFixa.trim() || 'Função Fixa') : undefined,
        });
      }
    } else {
      onAddMilitar({
        ordem,
        grad,
        nomeGuerra: nomeGuerra.trim(),
        nomeCompleto: nomeCompleto.trim() || nomeGuerra.trim(),
        matricula: matricula.trim() || `02194${Math.floor(100 + Math.random() * 899)}`,
        setor,
        ativo: true,
        funcaoPadrao: concorreEscala ? (funcaoPadrao === '' ? undefined : (funcaoPadrao as EscalaTipo)) : undefined,
        concorreEscala,
        funcaoFixa: !concorreEscala ? (funcaoFixa.trim() || 'Função Fixa') : undefined,
      });
    }
    resetForm();
  };

  const handleStartEdit = (m: Militar) => {
    setEditingId(m.id);
    setOrdem(m.ordem);
    setGrad(m.grad);
    setNomeGuerra(m.nomeGuerra);
    setNomeCompleto(m.nomeCompleto);
    setMatricula(m.matricula);
    setSetor(m.setor);
    setFuncaoPadrao(m.funcaoPadrao || '');
    setConcorreEscala(m.concorreEscala !== false);
    setFuncaoFixa(m.funcaoFixa || '');
  };

  const filtered = militares.filter(
    (m) =>
      m.nomeGuerra.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.grad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.funcaoFixa && m.funcaoFixa.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto font-mono text-xs">
      <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[26px] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-[#0A0C10] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-[12px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FF7A29]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-black text-[#F1F3F5] uppercase tracking-wide font-sans">
                  EFETIVO & CADASTRO DE MILITARES
                </h2>
                <span className="text-[10px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#FF7A29] px-2 py-0.5 rounded font-black font-tabular">
                  {militares.length} REGISTROS
                </span>
              </div>
              <p className="text-xs text-[#9AA3AE] mt-0.5">
                Gestão do efetivo da subunidade para escalas e mapa da força
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#9AA3AE] hover:text-[#F1F3F5] hover:bg-[#1B1F27] rounded-[10px] transition-all cursor-pointer border border-[rgba(255,255,255,0.06)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 bg-[#0A0C10] border-b border-[rgba(255,255,255,0.06)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-[#9AA3AE] mb-1 uppercase font-bold">Nº de Ordem</label>
                <input
                  type="number"
                  value={ordem}
                  onChange={(e) => setOrdem(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#13161C] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 focus:border-[#FF7A29] rounded-[12px] px-3 py-2 text-xs text-[#F1F3F5] focus:outline-none font-tabular"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#9AA3AE] mb-1 uppercase font-bold">Posto / Graduação</label>
                <select
                  value={grad}
                  onChange={(e) => setGrad(e.target.value as Graduacao)}
                  className="w-full bg-[#13161C] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 focus:border-[#FF7A29] rounded-[12px] px-3 py-2 text-xs text-[#FF7A29] font-black focus:outline-none cursor-pointer"
                >
                  {GRADUACOES.map((g) => (
                    <option key={g} value={g} className="bg-[#13161C] text-[#F1F3F5]">
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#9AA3AE] mb-1 uppercase font-bold">Nome de Guerra</label>
                <input
                  type="text"
                  value={nomeGuerra}
                  onChange={(e) => setNomeGuerra(e.target.value)}
                  placeholder="Ex: Silva, Santos"
                  className="w-full bg-[#13161C] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 focus:border-[#FF7A29] rounded-[12px] px-3 py-2 text-xs text-[#F1F3F5] font-black focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#9AA3AE] mb-1 uppercase font-bold">Nome Completo</label>
                <input
                  type="text"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Ex: José Silva dos Santos"
                  className="w-full bg-[#13161C] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 focus:border-[#FF7A29] rounded-[12px] px-3 py-2 text-xs text-[#F1F3F5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#9AA3AE] mb-1 uppercase font-bold">Matrícula / Identidade</label>
                <input
                  type="text"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  placeholder="Ex: 02194821"
                  className="w-full bg-[#13161C] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 focus:border-[#FF7A29] rounded-[12px] px-3 py-2 text-xs text-[#F1F3F5] focus:outline-none font-tabular"
                />
              </div>

              <div>
                <label className="block text-xs text-[#9AA3AE] mb-1 uppercase font-bold">Subunidade</label>
                <select
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  className="w-full bg-[#13161C] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 focus:border-[#FF7A29] rounded-[12px] px-3 py-2 text-xs text-[#F1F3F5] focus:outline-none cursor-pointer"
                >
                  {SUBUNIDADES.map((su) => (
                    <option key={su} value={su} className="bg-[#13161C] text-[#F1F3F5]">
                      {su}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#9AA3AE] mb-1 uppercase font-bold">Concorre à Escala?</label>
                <select
                  value={concorreEscala ? 'sim' : 'nao'}
                  onChange={(e) => setConcorreEscala(e.target.value === 'sim')}
                  className="w-full bg-[#13161C] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 focus:border-[#FF7A29] rounded-[12px] px-3 py-2 text-xs text-[#F1F3F5] focus:outline-none cursor-pointer"
                >
                  <option value="sim" className="bg-[#13161C]">SIM - Concorre a Escalas</option>
                  <option value="nao" className="bg-[#13161C]">NÃO - Função Fixa / Sem Escala</option>
                </select>
              </div>

              {concorreEscala ? (
                <div>
                  <label className="block text-xs text-[#9AA3AE] mb-1 uppercase font-bold">Função Padrão</label>
                  <select
                    value={funcaoPadrao}
                    onChange={(e) => setFuncaoPadrao(e.target.value as any)}
                    className="w-full bg-[#13161C] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 focus:border-[#FF7A29] rounded-[12px] px-3 py-2 text-xs text-[#FF7A29] font-black focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-[#13161C] text-[#F1F3F5]">Permanência</option>
                    <option value="cozinheiro" className="bg-[#13161C] text-[#F1F3F5]">Cozinheiro</option>
                    <option value="aux_cozinheiro" className="bg-[#13161C] text-[#F1F3F5]">Aux. Cozinheiro</option>
                    <option value="cassineiro" className="bg-[#13161C] text-[#F1F3F5]">Cassineiro</option>
                    <option value="padeiro" className="bg-[#13161C] text-[#F1F3F5]">Padeiro</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-[#F2B84B] mb-1 uppercase font-black">Função Fixa</label>
                  <input
                    type="text"
                    value={funcaoFixa}
                    onChange={(e) => setFuncaoFixa(e.target.value)}
                    placeholder="Ex: Aprovisionador, Furriel"
                    className="w-full bg-[#13161C] border border-[#F2B84B]/50 rounded-[12px] px-3 py-2 text-xs text-[#F2B84B] placeholder-[#5B6470] focus:outline-none focus:border-[#F2B84B] font-black"
                    required={!concorreEscala}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="py-2.5 px-4 bg-[#0A0C10] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#9AA3AE] rounded-[10px] text-xs cursor-pointer transition-all"
                >
                  Cancelar Edição
                </button>
              )}
              <button
                type="submit"
                className="py-2.5 px-6 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black rounded-[10px] text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-[0_0_15px_rgba(255,122,41,0.25)]"
              >
                {editingId ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{editingId ? 'Salvar Alterações' : 'Cadastrar Militar'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h3 className="text-xs font-black text-[#F1F3F5] uppercase tracking-wider flex items-center gap-2 font-sans">
              <Shield className="w-4 h-4 text-[#FF7A29]" />
              <span>Efetivo da Subunidade ({militares.length})</span>
            </h3>

            <div className="flex items-center gap-3">
              {militares.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic();
                    if (confirm('Deseja realmente remover TODOS os militares cadastrados para inserir o efetivo real?')) {
                      if (onDeleteAllMilitares) {
                        onDeleteAllMilitares();
                      } else {
                        militares.forEach((m) => onDeleteMilitar(m.id));
                      }
                    }
                  }}
                  className="px-3 py-2 bg-[#2A0C10] border border-[#E8384F]/40 hover:bg-[#351015] text-[#E8384F] text-xs rounded-[10px] flex items-center gap-1.5 transition-all cursor-pointer font-bold"
                  title="Remover todo o efetivo cadastrado de uma vez"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Todos</span>
                </button>
              )}

              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#5B6470]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar militar..."
                  className="w-full pl-8 pr-3 py-2 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[10px] text-xs text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
                />
              </div>
            </div>
          </div>

          <div className="border border-[rgba(255,255,255,0.06)] rounded-[18px] overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0A0C10] text-[#9AA3AE] uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">
                <tr>
                  <th className="p-3 w-14 text-[#F2B84B] text-center">Nº</th>
                  <th className="p-3 text-[#FF7A29]">Grad</th>
                  <th className="p-3 text-[#F1F3F5]">Nome de Guerra</th>
                  <th className="p-3">Subunidade</th>
                  <th className="p-3">Concorre Escala?</th>
                  <th className="p-3">Função</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)] bg-[#13161C]">
                {filtered.map((m) => {
                  const isConcorre = m.concorreEscala !== false;
                  return (
                    <tr key={m.id} className="hover:bg-[#1B1F27] transition-all">
                      <td className="p-3 font-black text-[#F2B84B] text-center font-tabular">{m.ordem.toString().padStart(2, '0')}</td>
                      <td className="p-3 font-bold text-[#FF7A29]">{m.grad}</td>
                      <td className="p-3 font-bold text-[#F1F3F5]">
                        <div>{m.nomeGuerra}</div>
                        <div className="text-[10px] text-[#5B6470] font-normal">{m.nomeCompleto}</div>
                      </td>
                      <td className="p-3 text-[#9AA3AE]">{m.setor}</td>
                      <td className="p-3">
                        {isConcorre ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#3ED598] bg-[#1B1F27] border border-[#3ED598]/40 px-2 py-0.5 rounded-[6px]">
                            <UserCheck className="w-3 h-3" />
                            <span>Escala Ativa</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#F2B84B] bg-[#1B1F27] border border-[#F2B84B]/40 px-2 py-0.5 rounded-[6px]">
                            <UserMinus className="w-3 h-3" />
                            <span>Sem Escala</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-[#F1F3F5]">
                        {isConcorre ? (
                          <span className="capitalize">{m.funcaoPadrao || 'Permanência'}</span>
                        ) : (
                          <span className="text-[#F2B84B] font-bold">{m.funcaoFixa || 'Função Fixa'}</span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <button
                          onClick={() => handleStartEdit(m)}
                          className="p-1.5 text-[#9AA3AE] hover:text-[#33C9EB] hover:bg-[#1B1F27] rounded-lg cursor-pointer transition-all"
                          title="Editar Militar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            triggerHaptic();
                            onDeleteMilitar(m.id);
                          }}
                          className="p-1.5 text-[#9AA3AE] hover:text-[#E8384F] hover:bg-[#1B1F27] rounded-lg cursor-pointer transition-all"
                          title="Remover Militar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
