export const SUBUNIDADES = [
  'Rancho',
  'Esqd Cap',
  '1º esqd c mec',
  '2º esqd c mec',
  '3º esqd c mec',
  'pmgu',
  'fanfarra',
  'Pel Com',
  'Btl / Regimento'
] as const;

export type Subunidade = typeof SUBUNIDADES[number];

export type Graduacao = 
  | 'Cel' 
  | 'Ten Cel' 
  | 'Maj' 
  | 'Cap' 
  | '1º Ten' 
  | '2º Ten' 
  | 'Asp' 
  | 'Subten' 
  | '1º Sgt' 
  | '2º Sgt' 
  | '3º Sgt' 
  | 'Cb' 
  | 'Sd'
  | 'Sd EV'
  | 'Sd EP';

export type PostoGraduacao = Graduacao | string;
export type SituacaoMilitar = 'Pronto' | 'Apto' | 'Férias' | 'Baixado' | 'Dispensado' | 'Missão' | 'Curso' | 'Licença' | 'Outros' | string;
export type SituacaoEscala = 'Preta' | 'Vermelha' | 'Dispensado' | 'SV' | 'Folga' | 'Curso' | 'Licença' | 'Férias' | 'Dispensa' | string;

export type DestinoTipo = 
  | 'Férias'
  | 'Baixa Hospitalar'
  | 'Dispensa Médica'
  | 'Licença Prêmio'
  | 'Serviço Externo'
  | 'Missão'
  | 'Missão Especial'
  | 'Curso / Estágio'
  | 'Dispensa como Recompensa'
  | string;

export interface Militar {
  id: string;
  ordem?: number; // Nº de Ordem (1, 2, 3...)
  grad?: Graduacao;
  nomeGuerra: string; // Nome de guerra (ex: Simas, Silva, Oliveira)
  nomeCompleto: string;
  matricula?: string;
  setor?: string;
  ativo: boolean;
  concorreEscala?: boolean; // Se false: Militar isento / não concorre a escalas
  funcaoFixa?: string; // Função administrativa fixa quando não concorre
  funcaoPadrao?: string; // Função padrão quando concorre à escala
  folgaPretaInicial?: number; // Folga Preta inicial acumulada
  folgaVermelhaInicial?: number; // Folga Vermelha inicial acumulada

  // Compatibility fields for legacy pages/services
  postoGraduacao?: PostoGraduacao;
  situacaoAtual?: SituacaoMilitar;
  funcaoId?: string;
  antiguidade?: number;
  telefone?: string;
  identidadeMilitar?: string;
}

export interface Funcao {
  id: string;
  nome: string;
  sigla?: string;
  descricao?: string;
  tipoEscala?: 'Preta' | 'Vermelha' | 'Ambas';
  postoMinimo?: PostoGraduacao;
  postoMaximo?: PostoGraduacao;
  ordem?: number;
}

export interface EscalaRegistro {
  id: string;
  data: string;
  militarId: string;
  funcaoId: string;
  tipo?: 'Preta' | 'Vermelha';
  situacao: SituacaoEscala;
  observacao?: string;
}

export interface Aditamento {
  id: string;
  numero?: string;
  data?: string;
  ano?: number;
  referencia?: string;
  registros?: EscalaRegistro[];
  dataAditamento?: string;
  boletimNumero?: string;
  cabecalho?: string;
  corpo?: string;
  assinadoPor?: string;
  funcaoAssinante?: string;
  escalaMês?: any;
  escalaMes?: any;
  criadoEm?: string;
  [key: string]: any;
}

export interface DestinoLancamento {
  id: string;
  militarId: string;
  tipo: DestinoTipo;
  dataInicio: string;
  dataFim: string;
  motivo?: string;
}

export interface Destino {
  id: string;
  militarId: string;
  tipo: DestinoTipo;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
  motivo?: string;
  bloqueiaEscala: boolean;
}

export type EscalaTipo = string;

export interface FuncaoEscala {
  id: string;
  nome: string;
  sigla: string;
}

export interface EscalaMeta {
  id: string;
  nome: string;
  descricao: string;
  sigla: string;
  cor: string;
  funcoes: FuncaoEscala[];
  militaresPermitidos?: string[];
  militarOrdemArray?: string[];
  militarFuncaoPreferencia?: Record<string, string>;
}

export interface EscalaAssignment {
  id: string;
  militarId: string;
  escalaTipo: string;
  data: string; // YYYY-MM-DD
  funcaoId?: string;
  funcaoSigla?: string;
  observacao?: string;
}

export interface Organization {
  id: string;
  nome: string;
  sigla: string;
  descricao?: string;
  createdAt: string;
  isMaster?: boolean;
  enabledModules?: ('escala_select' | 'mapa_forca' | 'aditamento' | 'destinos' | 'pernoite' | 'gestao')[];
}

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  nomeGuerra: string;
  grad: Graduacao;
  orgId: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'OPERADOR';
  createdAt: string;
}

export interface UserSession {
  id: string;
  username: string;
  nomeGuerra: string;
  grad: Graduacao;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'OPERADOR';
  setor: string;
  orgId: string;
}

export interface PernoiteItem {
  id: string;
  militarId: string;
  militarNomeGuerra: string;
  grad: Graduacao;
  setor: string;
  alojamentoQuarto: string;
  motivoAutorizacao: string;
  horarioEntrada: string;
  horarioSaida?: string;
  observacao?: string;
}

export interface PernoiteDoc {
  id: string;
  orgId: string;
  data: string;
  oficialDiaOuAdjunto: string;
  itens: PernoiteItem[];
  observacoesGerais?: string;
  isSigned?: boolean;
  signerName?: string;
  signerRole?: string;
  signedAt?: string;
  updatedAt: string;
}

export type ActiveTab = 'visao_geral' | 'escalas' | 'mapa_forca' | 'aditamento' | 'destinos' | 'missoes' | 'agenda' | 'pernoite' | 'gestao';

export type AppPage = 
  | 'visao_geral'
  | 'menu' 
  | 'escala_select' 
  | 'escala_detail' 
  | 'mapa_forca' 
  | 'aditamento' 
  | 'destinos'
  | 'missoes'
  | 'agenda'
  | 'pernoite'
  | 'gestao';

export type DayScaleCategory = 'preta' | 'vermelha';

// ==========================================
// MISSÕES / PLANNER OPERACIONAL
// ==========================================
export type MissaoPrioridade = 'normal' | 'importante' | 'urgente';
export type MissaoStatus = 'pendente' | 'em_andamento' | 'concluida';

export interface Missao {
  id: string;
  orgId: string;
  titulo: string;
  descricao?: string;
  criadoPor: string;
  criadoPorNome: string;
  designadoPara: string;
  designadoParaNome: string;
  prazoData?: string;
  prazoHora?: string;
  prioridade: MissaoPrioridade;
  status: MissaoStatus;
  dataCriacao: string;
  dataConclusao?: string;
  observacoes?: string;
  updatedAt: string;
}

// ==========================================
// AGENDA / PLANNER MENSAL
// ==========================================
export type AgendaTipo = 'REUNIÃO' | 'COMPROMISSO' | 'PRAZO' | 'EVENTO' | 'OUTRO';

export interface AgendaItem {
  id: string;
  orgId: string;
  titulo: string;
  descricao?: string;
  data: string;
  horaInicio: string;
  horaFim?: string;
  participantes?: string[];
  local?: string;
  observacao?: string;
  tipo: AgendaTipo;
  criadoPor: string;
  criadoPorNome: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// PWA PUSH NOTIFICATIONS
// ==========================================
export interface PushSubscriptionInfo {
  id: string;
  userId: string;
  orgId: string;
  endpoint: string;
  deviceInfo: string;
  subscribedAt: string;
  active: boolean;
}
