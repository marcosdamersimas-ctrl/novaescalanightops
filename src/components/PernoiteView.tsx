import React, { useState, useEffect } from 'react';
import { 
  Bed, 
  Plus, 
  Printer, 
  Trash2, 
  Edit3, 
  Calendar, 
  Check, 
  ShieldCheck, 
  Users
} from 'lucide-react';
import { 
  Militar, 
  EscalaAssignment, 
  PernoiteDoc, 
  PernoiteItem, 
  UserSession, 
  Organization, 
  Graduacao 
} from '../types';
import { loadPernoiteFromFirebase, savePernoiteToFirebase } from '../lib/firebase';

interface PernoiteViewProps {
  session: UserSession;
  militares: Militar[];
  assignments: EscalaAssignment[];
  currentOrg?: Organization;
}

const GRADUACOES: Graduacao[] = [
  'Cel', 'Ten Cel', 'Maj', 'Cap', '1º Ten', '2º Ten', 'Asp',
  'Subten', '1º Sgt', '2º Sgt', '3º Sgt', 'Cb', 'Sd', 'Sd EV', 'Sd EP'
];

export const PernoiteView: React.FC<PernoiteViewProps> = ({
  session,
  militares,
  assignments,
  currentOrg
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [itens, setItens] = useState<PernoiteItem[]>([]);
  const [oficialDia, setOficialDia] = useState<string>('Oficial de Dia / Adjunto');
  const [sargenteante, setSargenteante] = useState<string>(`${session.grad} ${session.nomeGuerra}`);
  const [observacoes, setObservacoes] = useState<string>('Militares autorizados a pernoitar devidamente revistados e cientes das normas disciplinares do aquartelamento.');
  const [isSigned, setIsSigned] = useState<boolean>(false);
  const [signedAt, setSignedAt] = useState<string>('');
  const [showItemModal, setShowItemModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<PernoiteItem | null>(null);

  // Form inputs for modal
  const [formMilitarId, setFormMilitarId] = useState<string>('');
  const [formNomeGuerra, setFormNomeGuerra] = useState<string>('');
  const [formGrad, setFormGrad] = useState<Graduacao>('Sd EP');
  const [formSetor, setFormSetor] = useState<string>('1º Pelotão');
  const [formAlojamento, setFormAlojamento] = useState<string>('Alojamento Cabos e Soldados');
  const [formMotivo, setFormMotivo] = useState<string>('Serviço de Escala');
  const [formEntrada, setFormEntrada] = useState<string>('18:00');
  const [formSaida, setFormSaida] = useState<string>('06:30');
  const [formObs, setFormObs] = useState<string>('');

  const orgId = session.orgId || 'rancho';

  // Load existing pernoite for date
  useEffect(() => {
    async function loadData() {
      const docData = await loadPernoiteFromFirebase(selectedDate, orgId);
      if (docData) {
        setItens(docData.itens || []);
        setOficialDia(docData.oficialDiaOuAdjunto || 'Oficial de Dia / Adjunto');
        setObservacoes(docData.observacoesGerais || '');
        setIsSigned(!!docData.isSigned);
        setSignedAt(docData.signedAt || '');
        if (docData.signerName) setSargenteante(docData.signerName);
      } else {
        setItens([]);
        setIsSigned(false);
        setSignedAt('');
      }
    }
    loadData();
  }, [selectedDate, orgId]);

  const handleSaveDoc = async (newItens: PernoiteItem[], signed: boolean = isSigned) => {
    const docData: PernoiteDoc = {
      id: `pernoite-${orgId}-${selectedDate}`,
      orgId,
      data: selectedDate,
      oficialDiaOuAdjunto: oficialDia,
      itens: newItens,
      observacoesGerais: observacoes,
      isSigned: signed,
      signerName: sargenteante,
      signerRole: 'Sargenteante da Subunidade',
      signedAt: signed ? (signedAt || new Date().toLocaleString('pt-BR')) : undefined,
      updatedAt: new Date().toISOString()
    };
    await savePernoiteToFirebase(docData, orgId);
  };

  // Pull military members assigned to duty on this date
  const handlePuxarEscalados = () => {
    const dayAssignments = assignments.filter((a) => a.data === selectedDate);
    if (dayAssignments.length === 0) {
      alert(`Nenhum militar encontrado na escala do dia ${selectedDate.split('-').reverse().join('/')}.`);
      return;
    }

    const newItems: PernoiteItem[] = [...itens];
    let addedCount = 0;

    dayAssignments.forEach((asg) => {
      const mil = militares.find((m) => m.id === asg.militarId);
      if (mil && !newItems.some((i) => i.militarId === mil.id)) {
        newItems.push({
          id: `pern-${Date.now()}-${mil.id}`,
          militarId: mil.id,
          militarNomeGuerra: mil.nomeGuerra,
          grad: mil.grad,
          setor: mil.setor || 'Subunidade',
          alojamentoQuarto: mil.grad.includes('Sgt') || mil.grad.includes('Ten') ? 'Alojamento Subten / Sgt' : 'Alojamento Cb / Sd',
          motivoAutorizacao: `Serviço de Escala (${asg.funcaoSigla || asg.escalaTipo})`,
          horarioEntrada: '18:00',
          horarioSaida: '07:00',
          observacao: 'Escalado para o serviço'
        });
        addedCount++;
      }
    });

    setItens(newItems);
    handleSaveDoc(newItems);
    alert(`${addedCount} militares de serviço foram adicionados ao controle de pernoite!`);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormMilitarId('');
    setFormNomeGuerra('');
    setFormGrad('Sd EP');
    setFormSetor('1º Pelotão');
    setFormAlojamento('Alojamento Cabos e Soldados');
    setFormMotivo('Serviço de Escala');
    setFormEntrada('18:00');
    setFormSaida('06:30');
    setFormObs('');
    setShowItemModal(true);
  };

  const handleOpenEditModal = (item: PernoiteItem) => {
    setEditingItem(item);
    setFormMilitarId(item.militarId);
    setFormNomeGuerra(item.militarNomeGuerra);
    setFormGrad(item.grad);
    setFormSetor(item.setor);
    setFormAlojamento(item.alojamentoQuarto);
    setFormMotivo(item.motivoAutorizacao);
    setFormEntrada(item.horarioEntrada);
    setFormSaida(item.horarioSaida || '06:30');
    setFormObs(item.observacao || '');
    setShowItemModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNomeGuerra.trim()) return;

    let updatedList: PernoiteItem[];
    if (editingItem) {
      updatedList = itens.map((i) =>
        i.id === editingItem.id
          ? {
              ...i,
              militarId: formMilitarId || i.militarId,
              militarNomeGuerra: formNomeGuerra.trim(),
              grad: formGrad,
              setor: formSetor,
              alojamentoQuarto: formAlojamento,
              motivoAutorizacao: formMotivo,
              horarioEntrada: formEntrada,
              horarioSaida: formSaida,
              observacao: formObs
            }
          : i
      );
    } else {
      const newItem: PernoiteItem = {
        id: `pern-${Date.now()}`,
        militarId: formMilitarId || `mil-temp-${Date.now()}`,
        militarNomeGuerra: formNomeGuerra.trim(),
        grad: formGrad,
        setor: formSetor,
        alojamentoQuarto: formAlojamento,
        motivoAutorizacao: formMotivo,
        horarioEntrada: formEntrada,
        horarioSaida: formSaida,
        observacao: formObs
      };
      updatedList = [...itens, newItem];
    }

    setItens(updatedList);
    handleSaveDoc(updatedList);
    setShowItemModal(false);
  };

  const handleDeleteItem = (itemId: string) => {
    const updated = itens.filter((i) => i.id !== itemId);
    setItens(updated);
    handleSaveDoc(updated);
  };

  const handleToggleSign = () => {
    const now = new Date();
    const formatted = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newSignState = !isSigned;
    setIsSigned(newSignState);
    setSignedAt(newSignState ? formatted : '');
    handleSaveDoc(itens, newSignState);
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDateBR = selectedDate.split('-').reverse().join('/');
  const subunidadeNome = currentOrg?.nome || 'Subunidade';
  const subunidadeSigla = currentOrg?.sigla || session.orgId.toUpperCase();

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner (Hidden in Print) */}
      <div className="print:hidden bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[26px] p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-[14px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FF7A29]">
            <Bed className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-black text-[#F1F3F5] uppercase tracking-wide font-sans">
                CONTROLE DE PERNOITE DO EFETIVO
              </h2>
              <span className="text-[10px] font-black bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#FF7A29] px-2 py-0.5 rounded uppercase">
                {subunidadeSigla}
              </span>
            </div>
            <p className="text-xs text-[#9AA3AE] mt-0.5">
              Autorização, controle de alojamentos e pernoite dos militares
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3.5 py-2.5 text-xs">
            <Calendar className="w-4 h-4 text-[#FF7A29]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-[#F1F3F5] font-bold focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handlePuxarEscalados}
            className="py-2.5 px-4 bg-[#0A0C10] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#F1F3F5] rounded-[12px] text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Preencher com os militares que estão escalados no dia"
          >
            <Users className="w-4 h-4 text-[#33C9EB]" />
            <span>Puxar da Escala</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="py-2.5 px-4 bg-[#1B1F27] hover:bg-[#252a35] border border-[#FF7A29]/40 text-[#FF7A29] rounded-[12px] text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Militar</span>
          </button>

          <button
            onClick={handlePrint}
            className="py-2.5 px-4 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] rounded-[12px] text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-[0_0_15px_rgba(255,122,41,0.25)] cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir PDF</span>
          </button>
        </div>
      </div>

      {/* Interactive Controls & Stats (Hidden in Print) */}
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-4 flex items-center justify-between">
          <span className="text-[#9AA3AE] uppercase font-bold">Total em Pernoite:</span>
          <span className="text-base font-black text-[#FF7A29] font-tabular">{itens.length} Militares</span>
        </div>
        <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-4 flex items-center justify-between">
          <span className="text-[#9AA3AE] uppercase font-bold">Status Assinatura:</span>
          <span className={`font-bold px-2 py-0.5 rounded-[6px] text-xs ${
            isSigned ? 'bg-[#1B1F27] border border-[#3ED598]/40 text-[#3ED598]' : 'bg-[#1B1F27] border border-[#F2B84B]/40 text-[#F2B84B]'
          }`}>
            {isSigned ? 'ASSINADO DIGITALMENTE' : 'AGUARDANDO ASSINATURA'}
          </span>
        </div>
        <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-4 flex items-center justify-between">
          <button
            onClick={handleToggleSign}
            className={`w-full py-2 px-3 rounded-[10px] font-bold uppercase transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              isSigned
                ? 'bg-[#2A0C10] hover:bg-[#351015] border border-[#E8384F]/40 text-[#E8384F]'
                : 'bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSigned ? 'Revogar / Alterar' : 'Assinar Documento'}</span>
          </button>
        </div>
      </div>

      {/* OFFICIAL DOCUMENT CONTAINER */}
      <div className="p-4 sm:p-8 bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[24px] print:p-0 print:bg-transparent print:border-none">
        <div className="bg-white text-slate-950 p-6 md:p-10 rounded-2xl shadow-2xl border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none max-w-5xl mx-auto font-sans">
          {/* Military Document Header */}
          <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900 mb-6">
            <p className="text-xs font-serif font-black tracking-widest uppercase">
              MINISTÉRIO DA DEFESA • EXÉRCITO BRASILEIRO
            </p>
            <p className="text-sm font-serif font-bold tracking-wider uppercase">
              {subunidadeNome.toUpperCase()} ({subunidadeSigla})
            </p>
            <div className="pt-2">
              <h1 className="text-base md:text-lg font-black font-sans tracking-wide uppercase bg-slate-100 border border-slate-900 py-1.5 px-4 inline-block">
                RELAÇÃO DE MILITARES AUTORIZADOS A PERNOITAR NO QUARTEL (PERNOITE)
              </h1>
            </div>
            <p className="text-xs font-mono font-bold text-slate-700 pt-1">
              DATA DE REFERÊNCIA: <span className="text-slate-950 underline">{formattedDateBR}</span>
            </p>
          </div>

          {/* Table of Personnel Sleeping in Quarters */}
          {itens.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-300 rounded-xl my-6">
              <Bed className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">Nenhum militar cadastrado para pernoite nesta data.</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Clique em "+ Militar" ou "Puxar da Escala" para preencher a relação oficial.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-900">
                <thead className="bg-slate-200 text-slate-900 font-bold uppercase text-[11px] border-b-2 border-slate-900">
                  <tr>
                    <th className="p-2 border border-slate-900 text-center w-10">Nº</th>
                    <th className="p-2 border border-slate-900 w-24">Posto/Grad</th>
                    <th className="p-2 border border-slate-900">Nome de Guerra</th>
                    <th className="p-2 border border-slate-900">Pelotão / Setor</th>
                    <th className="p-2 border border-slate-900">Alojamento / Quarto</th>
                    <th className="p-2 border border-slate-900">Motivo da Pernoite</th>
                    <th className="p-2 border border-slate-900 text-center w-24">Entrada / Saída</th>
                    <th className="p-2 border border-slate-900 print:hidden text-center w-16">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-900 font-medium">
                  {itens.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2 border border-slate-900 text-center font-bold font-mono">
                        {(index + 1).toString().padStart(2, '0')}
                      </td>
                      <td className="p-2 border border-slate-900 font-bold">
                        {item.grad}
                      </td>
                      <td className="p-2 border border-slate-900 font-bold uppercase tracking-wider">
                        {item.militarNomeGuerra}
                      </td>
                      <td className="p-2 border border-slate-900">
                        {item.setor}
                      </td>
                      <td className="p-2 border border-slate-900 font-mono text-[11px]">
                        {item.alojamentoQuarto}
                      </td>
                      <td className="p-2 border border-slate-900">
                        {item.motivoAutorizacao}
                      </td>
                      <td className="p-2 border border-slate-900 text-center font-mono text-[11px]">
                        {item.horarioEntrada} às {item.horarioSaida || '06:30'}
                      </td>
                      <td className="p-2 border border-slate-900 print:hidden text-center space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                          title="Editar militar"
                        >
                          <Edit3 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
                          title="Remover militar"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* General Guidelines & Responsibilities */}
          <div className="mt-6 p-4 border border-slate-900 bg-slate-50 text-[11px] font-mono leading-relaxed space-y-2">
            <p className="font-bold uppercase text-slate-900">
              PRESCRIÇÕES DIVERSAS E NORMAS DE PERNOITE:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-800">
              <li>É terminantemente proibida a permanência de militares não autorizados nos alojamentos após o toque de silêncio (22:00h).</li>
              <li>O militar pernoitante responde pela conservação, asseio e disciplina do seu leito e dependências do aquartelamento.</li>
              <li>Qualquer alteração ou descumprimento de horário deverá ser imediatamente participado ao Oficial de Dia.</li>
            </ol>
          </div>

          {/* Official Signatures Section */}
          <div className="mt-12 pt-4 grid grid-cols-2 gap-8 text-center font-sans text-xs">
            <div className="flex flex-col items-center">
              <div className="w-64 border-b border-slate-900 pb-1 mb-1">
                <span className="font-bold uppercase">{sargenteante}</span>
              </div>
              <span className="font-mono text-[11px] text-slate-700 uppercase">
                Sargenteante da Subunidade
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-64 border-b border-slate-900 pb-1 mb-1">
                <span className="font-bold uppercase">{oficialDia}</span>
              </div>
              <span className="font-mono text-[11px] text-slate-700 uppercase">
                Visto: Oficial de Dia / Adjunto
              </span>
            </div>
          </div>

          {/* Digital Signature Security Stamp */}
          {isSigned && (
            <div className="mt-8 p-3 border border-emerald-700 bg-emerald-50 rounded-lg text-center font-mono text-[10px] text-emerald-950 space-y-0.5">
              <div className="flex items-center justify-center space-x-1.5 font-bold uppercase text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Documento Autenticado & Assinado Digitalmente • SGE Militar</span>
              </div>
              <p>Assinado por: <strong>{sargenteante}</strong> em {signedAt}</p>
              <p className="text-slate-500">Chave Criptográfica: SHA256-PERN-{orgId.toUpperCase()}-{selectedDate.replace(/-/g, '')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Adicionar / Editar Militar no Pernoite */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[22px] w-full max-w-md shadow-2xl overflow-hidden font-mono text-xs">
            <div className="p-5 bg-[#0A0C10] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bed className="w-5 h-5 text-[#FF7A29]" />
                <h3 className="text-sm font-black text-[#F1F3F5] uppercase tracking-wide font-sans">
                  {editingItem ? 'Editar Militar no Pernoite' : 'Adicionar Militar ao Pernoite'}
                </h3>
              </div>
              <button
                onClick={() => setShowItemModal(false)}
                className="text-[#9AA3AE] hover:text-[#F1F3F5] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4 text-xs text-[#F1F3F5]">
              {/* Quick Select from existing military roster */}
              {!editingItem && militares.length > 0 && (
                <div>
                  <label className="block text-[#9AA3AE] mb-1 uppercase font-bold">Selecionar do Efetivo</label>
                  <select
                    onChange={(e) => {
                      const mil = militares.find((m) => m.id === e.target.value);
                      if (mil) {
                        setFormMilitarId(mil.id);
                        setFormNomeGuerra(mil.nomeGuerra);
                        setFormGrad(mil.grad);
                        setFormSetor(mil.setor || 'Subunidade');
                      }
                    }}
                    className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2 text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
                  >
                    <option value="" className="bg-[#13161C]">-- Escolha um militar cadastrado --</option>
                    {militares.map((m) => (
                      <option key={m.id} value={m.id} className="bg-[#13161C]">
                        {m.grad} {m.nomeGuerra} ({m.setor})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9AA3AE] mb-1 uppercase font-bold">Graduação</label>
                  <select
                    value={formGrad}
                    onChange={(e) => setFormGrad(e.target.value as Graduacao)}
                    className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2 text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
                  >
                    {GRADUACOES.map((g) => (
                      <option key={g} value={g} className="bg-[#13161C]">{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#9AA3AE] mb-1 uppercase font-bold">Nome de Guerra</label>
                  <input
                    type="text"
                    value={formNomeGuerra}
                    onChange={(e) => setFormNomeGuerra(e.target.value)}
                    placeholder="Ex: Simas"
                    className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2 text-[#F1F3F5] uppercase font-bold focus:outline-none focus:border-[#FF7A29]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9AA3AE] mb-1 uppercase font-bold">Pelotão / Setor</label>
                  <input
                    type="text"
                    value={formSetor}
                    onChange={(e) => setFormSetor(e.target.value)}
                    placeholder="Ex: 1º Pel / Sargenteação"
                    className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2 text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
                  />
                </div>

                <div>
                  <label className="block text-[#9AA3AE] mb-1 uppercase font-bold">Alojamento / Cama</label>
                  <input
                    type="text"
                    value={formAlojamento}
                    onChange={(e) => setFormAlojamento(e.target.value)}
                    placeholder="Ex: Aloj Cb/Sd - Cama 08"
                    className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2 text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#9AA3AE] mb-1 uppercase font-bold">Motivo da Pernoite</label>
                <input
                  type="text"
                  value={formMotivo}
                  onChange={(e) => setFormMotivo(e.target.value)}
                  placeholder="Ex: Serviço de Escala / Instrução / Autorização Cmt"
                  className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2 text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9AA3AE] mb-1 uppercase font-bold">Horário de Entrada</label>
                  <input
                    type="text"
                    value={formEntrada}
                    onChange={(e) => setFormEntrada(e.target.value)}
                    placeholder="18:00"
                    className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2 text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
                  />
                </div>

                <div>
                  <label className="block text-[#9AA3AE] mb-1 uppercase font-bold">Horário de Saída</label>
                  <input
                    type="text"
                    value={formSaida}
                    onChange={(e) => setFormSaida(e.target.value)}
                    placeholder="06:30"
                    className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2 text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="py-2.5 px-4 bg-[#0A0C10] text-[#9AA3AE] rounded-[10px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black rounded-[10px] uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Militar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
