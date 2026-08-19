import { Militar, Destino, EscalaAssignment, EscalaMeta } from '../types';

export const INITIAL_ESCALAS: Record<string, EscalaMeta> = {
  permanencia: {
    id: 'permanencia',
    nome: 'Permanência',
    descricao: 'Serviço de Guarda e Permanência',
    sigla: 'PERM',
    cor: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
    funcoes: [
      { id: 'f-perm', nome: 'Permanência', sigla: 'P' }
    ]
  },
  cozinheiro: {
    id: 'cozinheiro',
    nome: 'Cozinheiro',
    descricao: 'Preparo das refeições do Aprovisionamento',
    sigla: 'COZ',
    cor: 'bg-amber-600/20 text-amber-400 border-amber-500/30',
    funcoes: [
      { id: 'f-coz', nome: 'Cozinheiro', sigla: 'Coz' }
    ]
  },
  aux_cozinheiro: {
    id: 'aux_cozinheiro',
    nome: 'Auxiliar de Cozinheiro',
    descricao: 'Auxiliares do preparo e lavagem de talheres',
    sigla: 'AUX_COZ',
    cor: 'bg-orange-600/20 text-orange-400 border-orange-500/30',
    funcoes: [
      { id: 'f-aux1', nome: '1º Auxiliar de Cozinheiro', sigla: 'A1' },
      { id: 'f-aux2', nome: '2º Auxiliar de Cozinheiro', sigla: 'A2' },
      { id: 'f-lav', nome: 'Lavagem de Talheres (Folgas)', sigla: 'LAV' }
    ]
  },
  cassineiro: {
    id: 'cassineiro',
    nome: 'Cassineiro',
    descricao: 'Atendimento e organização do Cassino (Sgt e Of)',
    sigla: 'CASS',
    cor: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
    funcoes: [
      { id: 'f-cas-sgt', nome: 'Cassineiro dos Sargentos', sigla: 'CS' },
      { id: 'f-cas-of', nome: 'Cassineiro dos Oficiais (Folgas)', sigla: 'CO' }
    ]
  },
  padeiro: {
    id: 'padeiro',
    nome: 'Padeiro',
    descricao: 'Produção diária de pães e massas (Diurno e Noturno)',
    sigla: 'PAD',
    cor: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
    funcoes: [
      { id: 'f-pad-d', nome: 'Padeiro Diurno', sigla: 'PD' },
      { id: 'f-pad-n', nome: 'Padeiro Noturno', sigla: 'PN' },
      { id: 'f-pad-dn', nome: 'Padeiro Diurno + Noturno', sigla: 'PD+PN' }
    ]
  }
};

export const ESCALA_METAS = INITIAL_ESCALAS;

export const INITIAL_MILITARES: Militar[] = [
  { id: 'mil-01', ordem: 1, grad: '1º Sgt', nomeGuerra: 'Simas', nomeCompleto: 'Marcos Damer Simas', matricula: '02194821', setor: 'Esqd Cap', ativo: true },
  { id: 'mil-02', ordem: 2, grad: '2º Sgt', nomeGuerra: 'Oliveira', nomeCompleto: 'Carlos Oliveira Lima', matricula: '02194822', setor: '1º esqd c mec', ativo: true },
  { id: 'mil-03', ordem: 3, grad: '3º Sgt', nomeGuerra: 'Souza', nomeCompleto: 'Marcos Souza Pereira', matricula: '02194823', setor: 'Esqd Cap', ativo: true, funcaoPadrao: 'cozinheiro' },
  { id: 'mil-04', ordem: 4, grad: '3º Sgt', nomeGuerra: 'Ferreira', nomeCompleto: 'Roberto Ferreira Filho', matricula: '02194824', setor: 'Esqd Cap', ativo: true, funcaoPadrao: 'padeiro' },
  { id: 'mil-05', ordem: 5, grad: 'Cb', nomeGuerra: 'Costa', nomeCompleto: 'Antônio Costa Neto', matricula: '02194825', setor: '2º esqd c mec', ativo: true, funcaoPadrao: 'cozinheiro' },
  { id: 'mil-06', ordem: 6, grad: 'Cb', nomeGuerra: 'Almeida', nomeCompleto: 'Lucas Almeida Santos', matricula: '02194826', setor: '1º esqd c mec', ativo: true, funcaoPadrao: 'aux_cozinheiro' },
  { id: 'mil-07', ordem: 7, grad: 'Cb', nomeGuerra: 'Ribeiro', nomeCompleto: 'Gabriel Ribeiro Rocha', matricula: '02194827', setor: 'fanfarra', ativo: true },
  { id: 'mil-08', ordem: 8, grad: 'Sd', nomeGuerra: 'Santos', nomeCompleto: 'Felipe Santos Oliveira', matricula: '02194828', setor: '3º esqd c mec', ativo: true },
  { id: 'mil-09', ordem: 9, grad: 'Sd', nomeGuerra: 'Carvalho', nomeCompleto: 'Matheus Carvalho e Silva', matricula: '02194829', setor: '3º esqd c mec', ativo: true },
  { id: 'mil-10', ordem: 10, grad: 'Sd', nomeGuerra: 'Gomes', nomeCompleto: 'Rodrigo Gomes Barbosa', matricula: '02194830', setor: 'pmgu', ativo: true, funcaoPadrao: 'cassineiro' },
  { id: 'mil-11', ordem: 11, grad: 'Sd', nomeGuerra: 'Martins', nomeCompleto: 'Thiago Martins de Souza', matricula: '02194831', setor: '1º esqd c mec', ativo: true, funcaoPadrao: 'aux_cozinheiro' },
  { id: 'mil-12', ordem: 12, grad: 'Sd', nomeGuerra: 'Araújo', nomeCompleto: 'Bruno Araújo Mendonça', matricula: '02194832', setor: '2º esqd c mec', ativo: true, funcaoPadrao: 'padeiro' },
  { id: 'mil-13', ordem: 13, grad: 'Sd', nomeGuerra: 'Barbosa', nomeCompleto: 'Vinícius Barbosa Ramos', matricula: '02194833', setor: '3º esqd c mec', ativo: true },
  { id: 'mil-14', ordem: 14, grad: 'Sd', nomeGuerra: 'Lima', nomeCompleto: 'Daniel Lima Cavalcante', matricula: '02194834', setor: 'pmgu', ativo: true },
  { id: 'mil-15', ordem: 15, grad: 'Sd', nomeGuerra: 'Melo', nomeCompleto: 'Henrique Melo Cardoso', matricula: '02194835', setor: 'fanfarra', ativo: true }
];

export const INITIAL_DESTINOS: Destino[] = [
  {
    id: 'dest-01',
    militarId: 'mil-02',
    tipo: 'Férias',
    dataInicio: '2026-08-01',
    dataFim: '2026-08-15',
    motivo: 'Férias regulamentares',
    bloqueiaEscala: true
  },
  {
    id: 'dest-02',
    militarId: 'mil-07',
    tipo: 'Baixa Hospitalar',
    dataInicio: '2026-08-03',
    dataFim: '2026-08-07',
    motivo: 'Tratamento médico',
    bloqueiaEscala: true
  },
  {
    id: 'dest-03',
    militarId: 'mil-14',
    tipo: 'Curso / Estágio',
    dataInicio: '2026-08-05',
    dataFim: '2026-08-20',
    motivo: 'Curso de Especialização',
    bloqueiaEscala: true
  }
];

export const INITIAL_ASSIGNMENTS: EscalaAssignment[] = [
  // July Permanência (Histórico de Julho)
  { id: 'as-jul-01', militarId: 'mil-01', escalaTipo: 'permanencia', funcaoSigla: 'P', data: '2026-07-05' },
  { id: 'as-jul-02', militarId: 'mil-02', escalaTipo: 'permanencia', funcaoSigla: 'P', data: '2026-07-10' },
  { id: 'as-jul-03', militarId: 'mil-08', escalaTipo: 'permanencia', funcaoSigla: 'P', data: '2026-07-12' },
  { id: 'as-jul-04', militarId: 'mil-09', escalaTipo: 'permanencia', funcaoSigla: 'P', data: '2026-07-18' },
  { id: 'as-jul-05', militarId: 'mil-13', escalaTipo: 'permanencia', funcaoSigla: 'P', data: '2026-07-20' },
  { id: 'as-jul-06', militarId: 'mil-14', escalaTipo: 'permanencia', funcaoSigla: 'P', data: '2026-07-25' },
  { id: 'as-jul-07', militarId: 'mil-15', escalaTipo: 'permanencia', funcaoSigla: 'P', data: '2026-07-29' },

  // Permanência Agosto
  { id: 'as-01', militarId: 'mil-01', escalaTipo: 'permanencia', funcaoSigla: 'P', data: '2026-08-01' },
  { id: 'as-02', militarId: 'mil-08', escalaTipo: 'permanencia', funcaoSigla: 'P', data: '2026-08-02' },
  { id: 'as-03', militarId: 'mil-09', escalaTipo: 'permanencia', funcaoSigla: 'P', data: '2026-08-03' },
  { id: 'as-04', militarId: 'mil-13', escalaTipo: 'permanencia', funcaoSigla: 'P', data: '2026-08-04' },
  { id: 'as-05', militarId: 'mil-01', escalaTipo: 'permanencia', funcaoSigla: 'P', data: '2026-08-05' },

  // Cozinheiro
  { id: 'as-06', militarId: 'mil-03', escalaTipo: 'cozinheiro', funcaoSigla: 'CZ', data: '2026-08-01' },
  { id: 'as-07', militarId: 'mil-05', escalaTipo: 'cozinheiro', funcaoSigla: 'CZ', data: '2026-08-02' },

  // Aux Cozinheiro - Multiple roles (A1, A2, LAV)
  { id: 'as-09', militarId: 'mil-06', escalaTipo: 'aux_cozinheiro', funcaoSigla: 'A1', data: '2026-08-01' },
  { id: 'as-10', militarId: 'mil-11', escalaTipo: 'aux_cozinheiro', funcaoSigla: 'A2', data: '2026-08-01' },
  { id: 'as-11', militarId: 'mil-07', escalaTipo: 'aux_cozinheiro', funcaoSigla: 'LAV', data: '2026-08-01' }
];
