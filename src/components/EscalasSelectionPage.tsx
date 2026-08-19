import React, { useState } from 'react';
import { EscalaTipo, Militar, EscalaMeta } from '../types';
import { getParticipantsForScale } from '../utils/helpers';
import { 
  Shield, ChefHat, Utensils, Coffee, Sandwich, UserPlus, 
  ArrowLeft, Plus, X, Settings,
  AlertCircle, Users, ChevronRight,
  CalendarDays
} from 'lucide-react';
import { MilitaryManagerModal } from './MilitaryManagerModal';
import { ScaleEditorModal } from './ScaleEditorModal';

interface EscalasSelectionPageProps {
  militares: Militar[];
  escalasMeta: Record<string, EscalaMeta>;
  onSelectScale: (escala: EscalaTipo) => void;
  onBackToMenu: () => void;
  onAddMilitar: (militar: Omit<Militar, 'id'>) => void;
  onUpdateMilitar: (militar: Militar) => void;
  onDeleteMilitar: (id: string) => void;
  onDeleteAllMilitares?: () => void;
  onAddScale: (newScale: EscalaMeta) => void;
  onDeleteScale: (scaleId: string) => void;
  onOpenMenuPersonalize?: () => void;
}

export const EscalasSelectionPage: React.FC<EscalasSelectionPageProps> = ({
  militares,
  escalasMeta,
  onSelectScale,
  onBackToMenu,
  onAddMilitar,
  onUpdateMilitar,
  onDeleteMilitar,
  onDeleteAllMilitares,
  onAddScale,
  onDeleteScale,
}) => {
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [scaleToEdit, setScaleToEdit] = useState<EscalaMeta | null>(null);

  const getIcon = (id: string) => {
    if (id === 'permanencia') return Shield;
    if (id === 'cozinheiro') return ChefHat;
    if (id === 'aux_cozinheiro') return Utensils;
    if (id === 'cassineiro') return Coffee;
    if (id === 'padeiro') return Sandwich;
    return CalendarDays;
  };

  const scaleList = Object.values(escalasMeta) as EscalaMeta[];
  const totalEfetivoApto = militares.filter(m => m.ativo !== false && m.concorreEscala !== false).length;

  return (
    <div className="space-y-4">
      {/* Compact Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMenu}
            className="p-2 rounded-lg bg-[#13161C] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#9AA3AE] hover:text-[#F1F3F5] transition-colors cursor-pointer"
            title="Voltar à Visão Geral"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-black text-[#F1F3F5] tracking-wide uppercase">
                CENTRAL DE ESCALAS
              </h2>
              <span className="text-[9px] font-mono font-bold bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#33C9EB] px-2 py-0.5 rounded-full">
                {scaleList.length} MODALIDADES
              </span>
            </div>
            <p className="text-[11px] text-[#9AA3AE] font-mono">
              Selecione uma modalidade para abrir a matriz operacional
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setScaleToEdit(null);
              setShowScaleModal(true);
            }}
            className="py-2 px-3 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black rounded-[10px] text-xs font-mono uppercase tracking-wider flex items-center space-x-1.5 shadow-[0_0_12px_rgba(255,122,41,0.25)] cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Escala</span>
          </button>

          <button
            onClick={() => setShowManagerModal(true)}
            className="py-2 px-3 bg-[#13161C] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#F1F3F5] font-bold rounded-[10px] text-xs font-mono uppercase tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#33C9EB]" />
            <span>Militares ({totalEfetivoApto})</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {scaleList.length === 0 ? (
        <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[20px] p-8 text-center max-w-xl mx-auto space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-[14px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FF7A29] mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-[#F1F3F5] uppercase font-mono">
              Nenhuma escala cadastrada
            </h3>
            <p className="text-xs text-[#9AA3AE] font-mono">
              Crie a primeira escala para iniciar o gerenciamento de serviços.
            </p>
          </div>
          <button
            onClick={() => {
              setScaleToEdit(null);
              setShowScaleModal(true);
            }}
            className="px-4 py-2 bg-[#FF7A29] text-[#0A0C10] font-black rounded-[10px] text-xs font-mono uppercase tracking-wider inline-flex items-center space-x-1.5 shadow-lg cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Primeira Escala</span>
          </button>
        </div>
      ) : (
        /* Scale Cards Grid (Compact & Dense) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {scaleList
            .sort((a, b) => {
              const standardOrder = ['permanencia', 'cozinheiro', 'aux_cozinheiro', 'cassineiro', 'padeiro'];
              const idxA = standardOrder.indexOf(a.id);
              const idxB = standardOrder.indexOf(b.id);
              if (idxA !== -1 && idxB !== -1) return idxA - idxB;
              if (idxA !== -1) return -1;
              if (idxB !== -1) return 1;
              return a.nome.localeCompare(b.nome);
            })
            .map((scale: EscalaMeta) => {
              const Icon = getIcon(scale.id);
              const countMilitares = getParticipantsForScale(scale.id, militares, scale).length;
              const funcoesCount = scale.funcoes ? scale.funcoes.length : 1;

              return (
                <div
                  key={scale.id}
                  onClick={() => onSelectScale(scale.id)}
                  className="group p-4 rounded-[18px] bg-[#13161C] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/50 transition-all duration-150 shadow-md cursor-pointer flex flex-col justify-between select-none"
                >
                  <div>
                    {/* Top bar with Icon + Edit Controls */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-[12px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#FF7A29] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setScaleToEdit(scale);
                            setShowScaleModal(true);
                          }}
                          className="p-1.5 text-[#9AA3AE] hover:text-[#F1F3F5] bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/40 rounded-[6px] transition-colors cursor-pointer"
                          title={`Configurar escala ${scale.nome}`}
                        >
                          <Settings className="w-3 h-3" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Deseja realmente EXCLUIR a escala "${scale.nome}"?`)) {
                              onDeleteScale(scale.id);
                            }
                          }}
                          className="p-1.5 text-[#9AA3AE] hover:text-[#E8384F] bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] hover:border-[#E8384F]/40 rounded-[6px] transition-colors cursor-pointer"
                          title={`Excluir escala ${scale.nome}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-mono font-black text-[#0A0C10] px-1.5 py-0.2 rounded bg-[#FF7A29] uppercase">
                          {scale.sigla}
                        </span>
                        <span className="text-[9px] font-mono text-[#9AA3AE] uppercase">
                          {funcoesCount} {funcoesCount === 1 ? 'Função' : 'Funções'}
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-[#F1F3F5] uppercase tracking-wide group-hover:text-[#FF7A29] transition-colors font-sans">
                        {scale.nome}
                      </h3>
                      <p className="text-[11px] text-[#9AA3AE] line-clamp-1 mt-0.5 font-mono">
                        {scale.descricao || 'Lançamentos diários e folgas automáticas.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs font-mono">
                    <span className="text-[#9AA3AE] flex items-center gap-1 text-[11px] font-bold">
                      <Users className="w-3 h-3 text-[#33C9EB]" />
                      <span>{countMilitares} Militares</span>
                    </span>
                    <span className="text-[#FF7A29] text-xs font-black flex items-center group-hover:translate-x-1 transition-transform">
                      <span>Abrir Matriz</span>
                      <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Modal for Creating / Editing Scale */}
      {showScaleModal && (
        <ScaleEditorModal
          scaleToEdit={scaleToEdit}
          militares={militares}
          onSaveScale={(scale) => {
            onAddScale(scale);
            setShowScaleModal(false);
          }}
          onDeleteScale={(scaleId) => {
            onDeleteScale(scaleId);
            setShowScaleModal(false);
          }}
          onClose={() => setShowScaleModal(false)}
        />
      )}

      {/* Modal for Military Management */}
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
