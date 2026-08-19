import React, { useState, useMemo, useEffect } from 'react';
import { Militar, EscalaAssignment, EscalaMeta } from '../types';
import { ESCALA_METAS } from '../data/initialMilitaryData';
import { 
  FileText, 
  Printer, 
  Calendar, 
  RotateCcw, 
  ShieldCheck, 
  CheckCircle2, 
  Save, 
  Cloud, 
  Check, 
  X, 
  Sparkles, 
  CalendarDays,
  Flame,
  Clock,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { saveAditamentoToFirebase, loadAditamentoFromFirebase } from '../lib/firebase';
import { triggerHaptic } from '../utils/helpers';

interface AditamentoViewProps {
  militares: Militar[];
  assignments: EscalaAssignment[];
  escalasMeta?: Record<string, EscalaMeta>;
  onBackToMenu?: () => void;
}

interface ServiceRowDefinition {
  id: string;
  title: string;
  escalaTipo: string;
  isReducedScale: boolean; // True if part of weekend/holiday reduced scale
  filterFn: (assignment: EscalaAssignment) => boolean;
}

export type AditamentoCategory = 'preta' | 'vermelha' | 'personalizado';

export const AditamentoView: React.FC<AditamentoViewProps> = ({
  militares,
  assignments,
  escalasMeta = ESCALA_METAS,
  onBackToMenu
}) => {
  // Navigation mode
  const [viewMode, setViewMode] = useState<'selection' | 'editor'>('selection');

  // Main Category Selector: 'preta' (Terça a Sexta normal), 'vermelha' (Sáb+Dom+Seg), 'personalizado' (Feriadão)
  const [category, setCategory] = useState<AditamentoCategory>('preta');
  
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Custom multi-day array for 'personalizado' with scale type per date ('preta' vs 'vermelha')
  const [customDaysConfig, setCustomDaysConfig] = useState<Record<string, 'preta' | 'vermelha'>>({});
  const [dateToAdd, setDateToAdd] = useState<string>('');
  const [customDayTypeToAdd, setCustomDayTypeToAdd] = useState<'preta' | 'vermelha'>('vermelha');

  const [numBoletim, setNumBoletim] = useState('084');
  const [hiddenRowIds, setHiddenRowIds] = useState<string[]>([]);
  const [isSigned, setIsSigned] = useState(false);
  const [signedAtTime, setSignedAtTime] = useState<string>('');

  // Editable sections
  const [parte2Text, setParte2Text] = useState('Sem alteração.');
  const [parte3Text, setParte3Text] = useState('Sem alteração.');
  const [parte4Text, setParte4Text] = useState('Sem alteração.');

  // Configurable Signer
  const [signerName, setSignerName] = useState('1º Sgt Simas');
  const [signerRole, setSignerRole] = useState('Aprovisionador(a)');

  // Sorted militares by ordem for signer selection
  const sortedMilitares = useMemo(() => {
    return [...militares].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }, [militares]);

  // Set default signer from militares if not yet loaded from firebase
  useEffect(() => {
    if (sortedMilitares.length === 0) return;
    const simasMilitar = sortedMilitares.find(
      (m) => m.nomeGuerra.toLowerCase().includes('simas') || `${m.grad} ${m.nomeGuerra}`.toLowerCase().includes('simas')
    );
    if (simasMilitar) {
      const name = `${simasMilitar.grad} ${simasMilitar.nomeGuerra}`;
      setSignerName((prev) => (prev === '1º Sgt Simas' ? name : prev));
      setSignerRole((prev) => (prev === 'Aprovisionador(a)' ? (simasMilitar.funcaoFixa || simasMilitar.funcaoPadrao || 'Aprovisionador(a)') : prev));
    } else {
      setSignerName((prev) => {
        if (prev === '1º Sgt Simas' && sortedMilitares.length > 0) {
          const first = sortedMilitares[0];
          setSignerRole(first.funcaoFixa || first.funcaoPadrao || 'Aprovisionador(a)');
          return `${first.grad} ${first.nomeGuerra}`;
        }
        return prev;
      });
    }
  }, [sortedMilitares]);

  // Firebase save status
  const [firebaseStatus, setFirebaseStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Compute weekend dates (Saturday, Sunday, Monday) based on selectedDate
  const weekendDates = useMemo(() => {
    const base = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = base.getDay();
    
    let satDate = new Date(base);
    if (dayOfWeek === 6) {
      satDate = new Date(base);
    } else if (dayOfWeek === 5) {
      satDate.setDate(base.getDate() + 1);
    } else if (dayOfWeek === 0) {
      satDate.setDate(base.getDate() - 1);
    } else if (dayOfWeek === 1) {
      satDate.setDate(base.getDate() - 2);
    } else {
      const diff = (6 - dayOfWeek + 7) % 7;
      satDate.setDate(base.getDate() + (diff === 0 ? 7 : diff));
    }

    const sunDate = new Date(satDate);
    sunDate.setDate(satDate.getDate() + 1);

    const monDate = new Date(satDate);
    monDate.setDate(satDate.getDate() + 2);

    const format = (d: Date) => d.toISOString().split('T')[0];
    return [format(satDate), format(sunDate), format(monDate)];
  }, [selectedDate]);

  // Compute active dates with their specific scale type ('preta' vs 'vermelha')
  const activeDaysList = useMemo<{ date: string; scaleType: 'preta' | 'vermelha' }[]>(() => {
    if (category === 'preta') {
      return [{ date: selectedDate, scaleType: 'preta' }];
    }
    if (category === 'vermelha') {
      return [
        { date: weekendDates[0], scaleType: 'vermelha' },
        { date: weekendDates[1], scaleType: 'vermelha' },
        { date: weekendDates[2], scaleType: 'preta' }
      ];
    }
    const dates = Object.keys(customDaysConfig).sort();
    if (dates.length === 0) {
      return [{ date: selectedDate, scaleType: 'preta' }];
    }
    return dates.map((d) => ({
      date: d,
      scaleType: customDaysConfig[d] || 'vermelha'
    }));
  }, [category, selectedDate, weekendDates, customDaysConfig]);

  // Load saved aditamento from Firebase when date changes
  useEffect(() => {
    let isMounted = true;
    async function fetchAditamento() {
      try {
        const data = await loadAditamentoFromFirebase(selectedDate);
        if (data && isMounted) {
          if (data.numBoletim) setNumBoletim(data.numBoletim);
          if (data.parte2Text) setParte2Text(data.parte2Text);
          if (data.parte3Text) setParte3Text(data.parte3Text);
          if (data.parte4Text) setParte4Text(data.parte4Text);
          if (data.signerName) setSignerName(data.signerName);
          if (data.signerRole) setSignerRole(data.signerRole);
          if (typeof data.isSigned === 'boolean') {
            setIsSigned(data.isSigned);
            if (data.signedAt) setSignedAtTime(data.signedAt);
          }
        }
      } catch (e) {
        console.error('Error loading aditamento from Firebase:', e);
      }
    }
    fetchAditamento();
    return () => { isMounted = false; };
  }, [selectedDate]);

  const handleSelectModality = (cat: AditamentoCategory) => {
    triggerHaptic();
    setCategory(cat);
    setViewMode('editor');
  };

  const handleToggleDigitalSignature = () => {
    triggerHaptic();
    const nextState = !isSigned;
    setIsSigned(nextState);
    if (nextState) {
      const now = new Date();
      const formatted = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSignedAtTime(formatted);
    } else {
      setSignedAtTime('');
    }
  };

  const handleSaveToFirebase = async () => {
    triggerHaptic();
    setFirebaseStatus('saving');
    try {
      await saveAditamentoToFirebase({
        id: `aditamento-${selectedDate}`,
        date: selectedDate,
        numBoletim,
        parte2Text,
        parte3Text,
        parte4Text,
        signerName,
        signerRole,
        isSigned,
        signedAt: signedAtTime || undefined,
        updatedAt: new Date().toISOString()
      });
      setFirebaseStatus('saved');
      setTimeout(() => setFirebaseStatus('idle'), 3000);
    } catch (e) {
      console.error(e);
      setFirebaseStatus('error');
    }
  };

  // Generate unique verification code
  const signatureHash = useMemo(() => {
    const raw = selectedDate.replace(/-/g, '') + numBoletim;
    return `SGE-${raw.substring(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}-AUT`;
  }, [selectedDate, numBoletim]);

  // Build rows definition for all standard services
  const serviceRows: ServiceRowDefinition[] = useMemo(() => {
    const standardRows: ServiceRowDefinition[] = [
      {
        id: 'permanencia_perm',
        title: 'PERMANÊNCIA DO SERVIÇO',
        escalaTipo: 'permanencia',
        isReducedScale: true,
        filterFn: (a) => a.escalaTipo === 'permanencia'
      },
      {
        id: 'cozinheiro_cz',
        title: 'COZINHEIRO DO DIA',
        escalaTipo: 'cozinheiro',
        isReducedScale: true,
        filterFn: (a) => a.escalaTipo === 'cozinheiro'
      },
      {
        id: 'aux_cozinheiro_a1',
        title: '1º AUXILIAR DE COZINHEIRO',
        escalaTipo: 'aux_cozinheiro',
        isReducedScale: true,
        filterFn: (a) => a.escalaTipo === 'aux_cozinheiro' && (a.funcaoSigla === 'A1' || a.funcaoSigla === '1º Aux' || !a.funcaoSigla)
      },
      {
        id: 'aux_cozinheiro_a2',
        title: '2º AUXILIAR DE COZINHEIRO',
        escalaTipo: 'aux_cozinheiro',
        isReducedScale: false,
        filterFn: (a) => a.escalaTipo === 'aux_cozinheiro' && (a.funcaoSigla === 'A2' || a.funcaoSigla === '2º Aux')
      },
      {
        id: 'aux_cozinheiro_lav',
        title: 'LAVAGEM DE TALHERES',
        escalaTipo: 'aux_cozinheiro',
        isReducedScale: false,
        filterFn: (a) => a.escalaTipo === 'aux_cozinheiro' && a.funcaoSigla === 'LAV'
      },
      {
        id: 'cassineiro_sgt',
        title: 'CASSINEIRO DOS SARGENTOS',
        escalaTipo: 'cassineiro',
        isReducedScale: true,
        filterFn: (a) => a.escalaTipo === 'cassineiro' && (a.funcaoSigla === 'CS' || a.funcaoSigla === 'C-SGT' || !a.funcaoSigla)
      },
      {
        id: 'cassineiro_of',
        title: 'CASSINEIRO DOS OFICIAIS',
        escalaTipo: 'cassineiro',
        isReducedScale: false,
        filterFn: (a) => a.escalaTipo === 'cassineiro' && (a.funcaoSigla === 'CO' || a.funcaoSigla === 'C-OF')
      },
      {
        id: 'padeiro_diurno',
        title: 'PADEIRO DIURNO',
        escalaTipo: 'padeiro',
        isReducedScale: true,
        filterFn: (a) => a.escalaTipo === 'padeiro' && (a.funcaoSigla === 'PAD-D' || a.funcaoSigla === 'PD' || !a.funcaoSigla)
      },
      {
        id: 'padeiro_noturno',
        title: 'PADEIRO NOTURNO',
        escalaTipo: 'padeiro',
        isReducedScale: false,
        filterFn: (a) => a.escalaTipo === 'padeiro' && (a.funcaoSigla === 'PAD-N' || a.funcaoSigla === 'PN')
      }
    ];

    const customScales = Object.values(escalasMeta).filter(
      (m) => !['permanencia', 'cozinheiro', 'aux_cozinheiro', 'cassineiro', 'padeiro'].includes(m.id)
    );

    customScales.forEach((scale) => {
      if (scale.funcoes && scale.funcoes.length > 1) {
        scale.funcoes.forEach((f) => {
          standardRows.push({
            id: `custom_${scale.id}_${f.id}`,
            title: `${f.nome.toUpperCase()} (${scale.nome.toUpperCase()})`,
            escalaTipo: scale.id,
            isReducedScale: false,
            filterFn: (a) => a.escalaTipo === scale.id && (a.funcaoSigla === f.sigla || a.funcaoId === f.id)
          });
        });
      } else {
        standardRows.push({
          id: `custom_${scale.id}`,
          title: `ESCALA DE ${scale.nome.toUpperCase()}`,
          escalaTipo: scale.id,
          isReducedScale: false,
          filterFn: (a) => a.escalaTipo === scale.id
        });
      }
    });

    return standardRows;
  }, [escalasMeta]);

  const handleRemoveRow = (rowId: string) => {
    setHiddenRowIds((prev) => [...prev, rowId]);
  };

  const handleRestoreRows = () => {
    setHiddenRowIds([]);
  };

  const handlePrint = () => {
    triggerHaptic();
    window.print();
  };

  const todayFormattedDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* ========================================================================= */}
      {/* STEP 1: 3-CARD MODALITY SELECTION                                         */}
      {/* ========================================================================= */}
      {viewMode === 'selection' && (
        <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[26px] p-6 shadow-xl relative overflow-hidden">
            {onBackToMenu && (
              <button
                onClick={onBackToMenu}
                className="inline-flex items-center space-x-1.5 text-[11px] font-mono text-[#9AA3AE] hover:text-[#F1F3F5] bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] px-3 py-1.5 rounded-[10px] mb-4 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar à Visão Geral</span>
              </button>
            )}

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-[16px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FF7A29]">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-black text-[#F1F3F5] uppercase tracking-wide font-sans">
                  ADITAMENTO AO BOLETIM • EMISSÃO OFICIAL
                </h2>
                <p className="text-xs text-[#9AA3AE] font-mono mt-0.5">
                  Selecione o tipo de escala e período para montagem do documento
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Option 1: Escala Preta */}
            <div
              onClick={() => handleSelectModality('preta')}
              className="p-6 rounded-[24px] bg-[#13161C] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/60 transition-all cursor-pointer shadow-xl flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-[14px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#FF7A29] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-black text-[#0A0C10] bg-[#FF7A29] px-2.5 py-0.5 rounded-full uppercase">
                  DIÁRIO / NORMAL
                </span>
                <h3 className="text-base font-black text-[#F1F3F5] uppercase mt-3 group-hover:text-[#FF7A29] transition-colors font-sans">
                  ESCALA PRETA (DIA ÚTIL)
                </h3>
                <p className="text-xs text-[#9AA3AE] mt-1.5 leading-relaxed">
                  Gera o aditamento para um único dia útil com todas as funções operacionais completas.
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs text-[#FF7A29] font-black">
                <span>Montar Aditamento</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Option 2: Escala Vermelha */}
            <div
              onClick={() => handleSelectModality('vermelha')}
              className="p-6 rounded-[24px] bg-[#13161C] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] hover:border-[#E8384F]/60 transition-all cursor-pointer shadow-xl flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-[14px] bg-[#2A0C10] border border-[#E8384F]/30 text-[#E8384F] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Flame className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-black text-[#E8384F] bg-[#2A0C10] border border-[#E8384F]/40 px-2.5 py-0.5 rounded-full uppercase">
                  FINAL DE SEMANA
                </span>
                <h3 className="text-base font-black text-[#F1F3F5] uppercase mt-3 group-hover:text-[#E8384F] transition-colors font-sans">
                  FINAL DE SEMANA (SÁB + DOM + SEG)
                </h3>
                <p className="text-xs text-[#9AA3AE] mt-1.5 leading-relaxed">
                  Emite o documento consolidado do fim de semana com a equipe de prontidão reduzida.
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs text-[#E8384F] font-black">
                <span>Montar Fim de Semana</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Option 3: Personalizado */}
            <div
              onClick={() => handleSelectModality('personalizado')}
              className="p-6 rounded-[24px] bg-[#13161C] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] hover:border-[#F2B84B]/60 transition-all cursor-pointer shadow-xl flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-[14px] bg-[#1B1F27] border border-[#F2B84B]/30 text-[#F2B84B] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-black text-[#F2B84B] bg-[#1B1F27] border border-[#F2B84B]/40 px-2.5 py-0.5 rounded-full uppercase">
                  FERIADÃO / DIAS MÚLTIPLOS
                </span>
                <h3 className="text-base font-black text-[#F1F3F5] uppercase mt-3 group-hover:text-[#F2B84B] transition-colors font-sans">
                  FERIADÃO PERSONALIZADO
                </h3>
                <p className="text-xs text-[#9AA3AE] mt-1.5 leading-relaxed">
                  Configure múltiplos dias consecutivos alternando entre escala preta e vermelha.
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs text-[#F2B84B] font-black">
                <span>Configurar Feriadão</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: WORKSPACE & DOCUMENT PREVIEW                                      */}
      {/* ========================================================================= */}
      {viewMode === 'editor' && (
        <div className="space-y-6">
          {/* Night Ops Top Header */}
          <div className="print:hidden bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode('selection')}
                className="py-1.5 px-3 bg-[#0A0C10] hover:bg-[#1B1F27] text-[#9AA3AE] hover:text-[#F1F3F5] border border-[rgba(255,255,255,0.06)] rounded-[10px] text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Escolher Modalidade</span>
              </button>
              <span className="text-xs font-black text-[#F1F3F5] uppercase font-sans">
                {category === 'preta'
                  ? 'Escala Preta (Dia Útil)'
                  : category === 'vermelha'
                  ? 'Fim de Semana (Sáb + Dom + Seg)'
                  : 'Feriadão Personalizado'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCategory('preta')}
                className={`px-3 py-1 rounded-[10px] text-[11px] font-bold uppercase transition-all cursor-pointer ${
                  category === 'preta'
                    ? 'bg-[#FF7A29] text-[#0A0C10] font-black'
                    : 'bg-[#1B1F27] text-[#9AA3AE]'
                }`}
              >
                Preta
              </button>
              <button
                onClick={() => setCategory('vermelha')}
                className={`px-3 py-1 rounded-[10px] text-[11px] font-bold uppercase transition-all cursor-pointer ${
                  category === 'vermelha'
                    ? 'bg-[#E8384F] text-[#0A0C10] font-black'
                    : 'bg-[#1B1F27] text-[#9AA3AE]'
                }`}
              >
                Vermelha
              </button>
              <button
                onClick={() => setCategory('personalizado')}
                className={`px-3 py-1 rounded-[10px] text-[11px] font-bold uppercase transition-all cursor-pointer ${
                  category === 'personalizado'
                    ? 'bg-[#F2B84B] text-[#0A0C10] font-black'
                    : 'bg-[#1B1F27] text-[#9AA3AE]'
                }`}
              >
                Personalizado
              </button>
            </div>
          </div>

          {/* Action & Date Controls Toolbar */}
          <div className="print:hidden bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Date Selector */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2">
                <Calendar className="w-4 h-4 text-[#FF7A29]" />
                <span className="text-[#9AA3AE] font-bold">Data Base:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-[#FF7A29] font-black focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center space-x-2 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2 text-[#F1F3F5]">
                <span className="font-bold text-[#9AA3AE]">Boletim Nº:</span>
                <input
                  type="text"
                  value={numBoletim}
                  onChange={(e) => setNumBoletim(e.target.value)}
                  className="w-16 bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] rounded px-1.5 py-0.5 text-center font-black text-[#F2B84B] focus:outline-none"
                />
              </div>

              {category === 'personalizado' && (
                <div className="flex items-center space-x-2 bg-[#0A0C10] border border-[#F2B84B]/40 rounded-[12px] p-1.5">
                  <input
                    type="date"
                    value={dateToAdd}
                    onChange={(e) => setDateToAdd(e.target.value)}
                    className="bg-transparent text-[#F1F3F5] text-xs px-1 focus:outline-none"
                  />
                  <select
                    value={customDayTypeToAdd}
                    onChange={(e) => setCustomDayTypeToAdd(e.target.value as any)}
                    className="bg-[#1B1F27] text-[#F2B84B] border border-[rgba(255,255,255,0.06)] rounded px-2 py-1 text-xs"
                  >
                    <option value="vermelha">Escala Vermelha (Reduzida)</option>
                    <option value="preta">Escala Preta (Normal)</option>
                  </select>
                  <button
                    onClick={() => {
                      if (dateToAdd) {
                        setCustomDaysConfig((prev) => ({
                          ...prev,
                          [dateToAdd]: customDayTypeToAdd
                        }));
                        setDateToAdd('');
                      }
                    }}
                    className="px-3 py-1 bg-[#F2B84B] text-[#0A0C10] font-black rounded-lg uppercase cursor-pointer"
                  >
                    + Adicionar
                  </button>
                </div>
              )}
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center space-x-1.5 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2 text-[#F1F3F5]">
                <span className="text-[#9AA3AE] font-bold hidden sm:inline">Signatário:</span>
                <select
                  value={signerName}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    setSignerName(selectedName);
                    const selectedMil = sortedMilitares.find((m) => `${m.grad} ${m.nomeGuerra}` === selectedName);
                    if (selectedMil) {
                      setSignerRole(selectedMil.funcaoFixa || selectedMil.funcaoPadrao || 'Aprovisionador(a)');
                    }
                  }}
                  className="bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] rounded px-2 py-1 font-black text-[#33C9EB] focus:outline-none cursor-pointer"
                >
                  {sortedMilitares.map((m) => {
                    const fullName = `${m.grad} ${m.nomeGuerra}`;
                    return (
                      <option key={m.id} value={fullName}>
                        {fullName}
                      </option>
                    );
                  })}
                  {signerName && !sortedMilitares.some((m) => `${m.grad} ${m.nomeGuerra}` === signerName) && (
                    <option value={signerName}>{signerName}</option>
                  )}
                </select>
              </div>

              <button
                onClick={handleToggleDigitalSignature}
                className={`py-2 px-3.5 border font-black rounded-[12px] uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer ${
                  isSigned
                    ? 'bg-[#1B1F27] border-[#3ED598] text-[#3ED598]'
                    : 'bg-[#1B1F27] border-[rgba(255,255,255,0.06)] text-[#FF7A29]'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#3ED598]" />
                <span>{isSigned ? 'Assinado Digital' : 'Assinar Digital'}</span>
              </button>

              {hiddenRowIds.length > 0 && (
                <button
                  onClick={handleRestoreRows}
                  className="py-2 px-3 bg-[#1B1F27] text-[#F2B84B] border border-[#F2B84B]/40 font-black rounded-[12px] uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar ({hiddenRowIds.length})</span>
                </button>
              )}

              <button
                onClick={handleSaveToFirebase}
                disabled={firebaseStatus === 'saving'}
                className={`py-2 px-3.5 border font-black rounded-[12px] uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer ${
                  firebaseStatus === 'saved'
                    ? 'bg-[#3ED598] text-[#0A0C10] border-[#3ED598]'
                    : 'bg-[#1B1F27] border-[rgba(255,255,255,0.06)] text-[#F1F3F5]'
                }`}
              >
                {firebaseStatus === 'saving' ? (
                  <Cloud className="w-4 h-4 animate-spin text-[#FF7A29]" />
                ) : firebaseStatus === 'saved' ? (
                  <Check className="w-4 h-4 text-[#0A0C10]" />
                ) : (
                  <Save className="w-4 h-4 text-[#FF7A29]" />
                )}
                <span>{firebaseStatus === 'saved' ? 'Salvo!' : 'Salvar'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="py-2 px-4 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black rounded-[12px] uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-[0_0_15px_rgba(255,122,41,0.25)] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir PDF</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DARK DESK CONTAINER ENCASING THE WHITE A4 DOCUMENT                        */}
          {/* ========================================================================= */}
          <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[28px] p-4 md:p-10 shadow-2xl overflow-x-auto">
            {/* The Crisp White A4 Document */}
            <div className="print-document bg-white text-[#111111] border border-slate-300 rounded-xl p-8 md:p-12 shadow-2xl font-mono max-w-4xl mx-auto ring-1 ring-black/10">
              {/* Document Header */}
              <div className="text-center border-b-2 border-[#111111] pb-5 mb-6">
                <h2 className="text-xs uppercase font-bold text-slate-700 tracking-widest font-sans">
                  SISTEMA DE GESTÃO DE ESCALAS • CONTROLE OPERACIONAL
                </h2>
                <h1 className="text-lg md:text-xl font-black text-[#111111] uppercase tracking-widest my-1.5 font-sans">
                  ADITAMENTO AO APROVISIONAMENTO
                </h1>
                <p className="text-xs text-slate-800 font-bold uppercase">
                  1ª PARTE - SERVIÇOS DIÁRIOS DE ESCALA{' '}
                  {activeDaysList.length > 1
                    ? `(PERÍODO DE ${new Date(activeDaysList[0].date + 'T12:00:00').toLocaleDateString('pt-BR')} A ${new Date(activeDaysList[activeDaysList.length - 1].date + 'T12:00:00').toLocaleDateString('pt-BR')})`
                    : `DO DIA ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}`}
                </p>
              </div>

              {/* 1ª PARTE: Service Tables for all selected dates */}
              <div className="space-y-6">
                <h3 className="font-black text-xs text-[#111111] uppercase tracking-wider font-sans">
                  1ª PARTE - ESCALA DE SERVIÇO DIÁRIO
                </h3>

                {activeDaysList.map((dayItem, dIdx) => {
                  const dateObj = new Date(dayItem.date + 'T12:00:00');
                  const dayFormatted = dateObj.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  });
                  const weekDayStr = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase();
                  const dayAssignments = assignments.filter((a) => a.data === dayItem.date);
                  const isReducedDay = dayItem.scaleType === 'vermelha';

                  const rowsForDay = serviceRows.filter((row) => {
                    if (hiddenRowIds.includes(row.id)) return false;
                    if (isReducedDay) {
                      return row.isReducedScale;
                    }
                    return true;
                  });

                  return (
                    <div key={dayItem.date} className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#111111] uppercase border-b border-slate-300 pb-1">
                        <span>
                          {dIdx + 1}. ESCALA PARA O DIA {dayFormatted} ({weekDayStr})
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 font-bold">
                          {isReducedDay ? 'ESCALA VERMELHA (REDUZIDA)' : 'ESCALA PRETA (NORMAL)'}
                        </span>
                      </div>

                      <div className="border border-slate-300 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-100 text-[#111111] uppercase border-b border-slate-300">
                            <tr>
                              <th className="p-3 w-5/12 font-black border-r border-slate-300">
                                SERVIÇO / ESCALA
                              </th>
                              <th className="p-3 w-7/12 font-black flex justify-between items-center">
                                <span>MILITAR(ES) ESCALADO(S)</span>
                                <span className="text-[10px] text-slate-500 font-normal normal-case print:hidden">
                                  Ação
                                </span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {rowsForDay.map((row) => {
                              const list = dayAssignments.filter(row.filterFn);

                              return (
                                <tr key={`${dayItem.date}-${row.id}`} className="hover:bg-slate-50">
                                  <td className="p-3 font-bold text-[#111111] border-r border-slate-300 align-middle bg-slate-50 uppercase">
                                    {row.title}
                                  </td>

                                  <td className="p-3 text-[#111111] align-middle">
                                    <div className="flex justify-between items-center gap-2">
                                      <div className="flex-1 space-y-1">
                                        {list.length === 0 ? (
                                          <span className="text-slate-400 italic text-[11px]">
                                            Sem alteração / Sem militar escalado
                                          </span>
                                        ) : (
                                          list.map((as) => {
                                            const mil = militares.find((m) => m.id === as.militarId);
                                            return (
                                              <div key={as.id} className="font-bold text-[#111111] flex items-center space-x-2">
                                                <span className="text-[#111111] font-black">•</span>
                                                <span>
                                                  {mil ? `${mil.grad} ${mil.nomeGuerra}` : 'Militar Desconhecido'}
                                                </span>
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>

                                      <button
                                        onClick={() => handleRemoveRow(row.id)}
                                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors print:hidden cursor-pointer"
                                        title="Remover esta linha do aditamento"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Editable Sections: 2ª, 3ª, 4ª Partes */}
              <div className="mt-8 space-y-6 pt-6 border-t border-slate-300">
                {/* 2ª PARTE - INSTRUÇÃO */}
                <div>
                  <h3 className="font-black text-xs text-[#111111] uppercase tracking-wider mb-2 font-sans">
                    2ª PARTE - INSTRUÇÃO
                  </h3>
                  <textarea
                    value={parte2Text}
                    onChange={(e) => setParte2Text(e.target.value)}
                    placeholder="Cole ou digite as instruções..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-[#111111] font-semibold focus:outline-none focus:border-slate-500 focus:bg-white print:border-none print:p-0 font-mono"
                  />
                </div>

                {/* 3ª PARTE - ASSUNTOS GERAIS */}
                <div>
                  <h3 className="font-black text-xs text-[#111111] uppercase tracking-wider mb-2 font-sans">
                    3ª PARTE - ASSUNTOS GERAIS
                  </h3>
                  <textarea
                    value={parte3Text}
                    onChange={(e) => setParte3Text(e.target.value)}
                    placeholder="Cole ou digite os assuntos gerais..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-[#111111] font-semibold focus:outline-none focus:border-slate-500 focus:bg-white print:border-none print:p-0 font-mono"
                  />
                </div>

                {/* 4ª PARTE - JUSTIÇA E DISCIPLINA */}
                <div>
                  <h3 className="font-black text-xs text-[#111111] uppercase tracking-wider mb-2 font-sans">
                    4ª PARTE - JUSTIÇA E DISCIPLINA
                  </h3>
                  <textarea
                    value={parte4Text}
                    onChange={(e) => setParte4Text(e.target.value)}
                    placeholder="Cole ou digite a parte de justiça e disciplina..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-[#111111] font-semibold focus:outline-none focus:border-slate-500 focus:bg-white print:border-none print:p-0 font-mono"
                  />
                </div>
              </div>

              {/* Date line */}
              <div className="mt-10 mb-8 font-black text-xs text-[#111111] text-center uppercase tracking-wide">
                Seção de Aprovisionamento, {todayFormattedDate}.
              </div>

              {/* Signature Block */}
              <div className="mt-6 text-center text-xs font-mono max-w-md mx-auto relative">
                {isSigned ? (
                  <div className="p-4 rounded-xl bg-slate-50 border-2 border-emerald-700 text-[#111111] text-xs font-mono shadow-md">
                    <div className="flex items-center space-x-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5 font-black text-emerald-800 uppercase tracking-wide text-[11px]">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>DOCUMENTO ASSINADO DIGITALMENTE</span>
                        </div>
                        <p className="text-[11px] text-[#111111] font-bold">
                          Assinado por: <strong>{signerName.toUpperCase()}</strong>
                        </p>
                        <p className="text-[10px] text-slate-700">
                          Cargo: <strong>{signerRole}</strong>
                        </p>
                        <p className="text-[10px] text-emerald-800 font-bold flex items-center gap-1 font-tabular">
                          <Clock className="w-3 h-3 inline" />
                          <span>Data/Hora: {signedAtTime || `${todayFormattedDate} às ${new Date().toLocaleTimeString('pt-BR')}`}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="h-16"></div>
                    <div className="border-b-2 border-[#111111] w-full my-1"></div>
                    <p className="font-black text-[#111111] uppercase text-xs pt-1">
                      {signerName}
                    </p>
                    <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                      {signerRole}
                    </p>
                  </div>
                )}

                <p className="text-[10px] text-slate-500 text-center pt-4 font-mono font-bold">
                  Código de Autenticidade: <strong className="text-[#111111] font-tabular">{signatureHash}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
