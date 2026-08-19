import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  Building2, 
  Trash2, 
  UserCheck, 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  UserPlus 
} from 'lucide-react';
import { UserSession, Organization, UserAccount, Graduacao } from '../types';

interface GestaoViewProps {
  session: UserSession;
  organizations: Organization[];
  users: UserAccount[];
  onAddOrganization: (org: Organization) => void;
  onDeleteOrganization: (orgId: string) => void;
  onAddUser: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchOrg?: (orgId: string) => void;
  onResetToDefaultOrganizations?: () => void;
}

const GRADUACOES: Graduacao[] = [
  'Cel', 'Ten Cel', 'Maj', 'Cap', '1º Ten', '2º Ten', 'Asp',
  'Subten', '1º Sgt', '2º Sgt', '3º Sgt', 'Cb', 'Sd', 'Sd EV', 'Sd EP'
];

export const GestaoView: React.FC<GestaoViewProps> = ({
  session,
  organizations,
  users,
  onAddOrganization,
  onDeleteOrganization,
  onAddUser,
  onDeleteUser,
  onSwitchOrg,
  onResetToDefaultOrganizations
}) => {
  const isSuperAdmin = session.role === 'SUPER_ADMIN';
  const isOrgAdmin = session.role === 'ORG_ADMIN' || isSuperAdmin;

  // New Organization Form
  const [newOrgNome, setNewOrgNome] = useState('');
  const [newOrgSigla, setNewOrgSigla] = useState('');
  const [newOrgDesc, setNewOrgDesc] = useState('');
  const [showOrgModal, setShowOrgModal] = useState(false);

  // New User Form
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNomeGuerra, setNewNomeGuerra] = useState('');
  const [newGrad, setNewGrad] = useState<Graduacao>('3º Sgt');
  const [newOrgId, setNewOrgId] = useState<string>(
    isSuperAdmin ? (organizations[0]?.id || 'rancho') : session.orgId
  );
  const [newRole, setNewRole] = useState<'SUPER_ADMIN' | 'ORG_ADMIN' | 'OPERADOR'>('OPERADOR');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Subunit users count
  const currentSubunitUsers = users.filter((u) => u.orgId === (isSuperAdmin ? newOrgId : session.orgId));
  const maxUsersReached = !isSuperAdmin && currentSubunitUsers.length >= 3;

  // Custom confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgNome.trim() || !newOrgSigla.trim()) return;

    const orgId = newOrgSigla.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    const org: Organization = {
      id: orgId,
      nome: newOrgNome.trim(),
      sigla: newOrgSigla.trim().toUpperCase(),
      descricao: newOrgDesc.trim() || undefined,
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddOrganization(org);
    setNewOrgNome('');
    setNewOrgSigla('');
    setNewOrgDesc('');
    setShowOrgModal(false);
    setSuccessMsg(`Subunidade "${org.sigla}" criada com sucesso.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUsername = newUsername.trim().toUpperCase();
    if (!cleanUsername || !newPassword.trim() || !newNomeGuerra.trim()) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }

    if (users.some((u) => u.username.toUpperCase() === cleanUsername)) {
      setErrorMsg('Este nome de usuário já está em uso.');
      return;
    }

    if (!isSuperAdmin) {
      const orgUsers = users.filter((u) => u.orgId === session.orgId);
      if (orgUsers.length >= 3) {
        setErrorMsg('Limite atingido: cada subunidade pode cadastrar no máximo 3 usuários.');
        return;
      }
    }

    const targetOrgId = isSuperAdmin ? newOrgId : session.orgId;
    const targetRole = isSuperAdmin ? newRole : 'OPERADOR';

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      password: newPassword.trim(),
      nomeGuerra: newNomeGuerra.trim(),
      grad: newGrad,
      orgId: targetOrgId,
      role: targetRole,
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddUser(newUser);
    setNewUsername('');
    setNewPassword('');
    setNewNomeGuerra('');
    setShowUserModal(false);
    setSuccessMsg(`Usuário ${newUser.grad} ${newUser.nomeGuerra} (${newUser.username}) cadastrado com sucesso.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const getRoleLabel = (role: string) => {
    if (role === 'SUPER_ADMIN') return 'Administrador Geral';
    if (role === 'ORG_ADMIN') return 'Gestor da Subunidade';
    return 'Operador da Escala';
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[26px] p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-[14px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#FF7A29]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-black text-[#F1F3F5] uppercase tracking-wide font-sans">
                GESTÃO & CONTROLE DE ACESSOS
              </h2>
              <span className="text-[10px] bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#FF7A29] px-2 py-0.5 rounded font-black">
                {getRoleLabel(session.role)}
              </span>
            </div>
            <p className="text-xs text-[#9AA3AE] mt-0.5">
              {isSuperAdmin
                ? 'Administração Geral do Sistema: subunidades e permissões'
                : `Gerenciamento de operadores da subunidade (${currentSubunitUsers.length}/3 cadastrados)`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isSuperAdmin && (
            <button
              onClick={() => setShowOrgModal(true)}
              className="py-2.5 px-4 bg-[#0A0C10] hover:bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] text-[#F1F3F5] font-bold rounded-[12px] text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-[#33C9EB]" />
              <span>Nova Subunidade</span>
            </button>
          )}

          {isOrgAdmin && (
            <button
              onClick={() => setShowUserModal(true)}
              disabled={maxUsersReached}
              className={`py-2.5 px-4 font-black rounded-[12px] text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                maxUsersReached
                  ? 'bg-[#1B1F27] text-[#5B6470] border border-[rgba(255,255,255,0.06)] cursor-not-allowed'
                  : 'bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] shadow-[0_0_15px_rgba(255,122,41,0.25)]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Cadastrar Usuário</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {successMsg && (
        <div className="p-3.5 rounded-[14px] bg-[#1B1F27] border border-[#3ED598]/40 text-[#3ED598] text-xs flex items-center gap-2.5 shadow-sm">
          <Check className="w-4 h-4 text-[#3ED598] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Super Admin: Organizations Management Section */}
      {isSuperAdmin && (
        <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)] gap-2">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-[#33C9EB]" />
              <h3 className="text-sm font-black text-[#F1F3F5] uppercase tracking-wide font-sans">
                Subunidades Cadastradas ({organizations.length})
              </h3>
            </div>
            <div className="flex items-center space-x-3">
              {onResetToDefaultOrganizations && organizations.length > 1 && (
                <button
                  onClick={() => {
                    setConfirmAction({
                      title: 'Limpar Subunidades de Teste',
                      message: 'Deseja remover as subunidades demonstrativas e manter apenas a principal?',
                      confirmLabel: 'Restaurar Padrão',
                      isDanger: true,
                      onConfirm: () => {
                        onResetToDefaultOrganizations();
                        setConfirmAction(null);
                      }
                    });
                  }}
                  className="px-2.5 py-1 bg-[#2A0C10] hover:bg-[#351015] border border-[#E8384F]/40 text-[#E8384F] rounded-[8px] text-xs font-bold transition-colors cursor-pointer"
                >
                  Restaurar Padrão
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org) => {
              const orgUsersCount = users.filter((u) => u.orgId === org.id).length;
              const isCurrentSessionOrg = session.orgId === org.id;

              return (
                <div
                  key={org.id}
                  className={`p-4 rounded-[18px] border transition-colors flex flex-col justify-between ${
                    isCurrentSessionOrg
                      ? 'bg-[#1B1F27] border-[#FF7A29]/60 shadow-[0_0_15px_rgba(255,122,41,0.15)]'
                      : 'bg-[#0A0C10] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded-[6px] bg-[#13161C] border border-[rgba(255,255,255,0.06)] text-[#FF7A29]">
                        {org.sigla}
                      </span>
                      {org.isMaster && (
                        <span className="text-[10px] bg-[#1B1F27] text-[#F2B84B] border border-[#F2B84B]/40 px-1.5 py-0.5 rounded font-black">
                          Principal
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-[#F1F3F5] font-sans">{org.nome}</h4>
                    {org.descricao && (
                      <p className="text-xs text-[#9AA3AE] mt-1 line-clamp-2">{org.descricao}</p>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs">
                    <span className="text-[#9AA3AE]">
                      Usuários: <strong className="text-[#F1F3F5] font-tabular">{orgUsersCount}/3</strong>
                    </span>

                    <div className="flex items-center space-x-1.5">
                      {onSwitchOrg && !isCurrentSessionOrg && (
                        <button
                          onClick={() => onSwitchOrg(org.id)}
                          className="px-2.5 py-1 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] rounded-[8px] text-xs font-black cursor-pointer"
                        >
                          Acessar
                        </button>
                      )}
                      {!org.isMaster && (
                        <button
                          onClick={() => {
                            setConfirmAction({
                              title: 'Excluir Subunidade',
                              message: `Tem certeza que deseja excluir permanentemente a subunidade "${org.nome}" (${org.sigla})?`,
                              confirmLabel: 'Excluir Subunidade',
                              isDanger: true,
                              onConfirm: () => {
                                onDeleteOrganization(org.id);
                                setConfirmAction(null);
                              }
                            });
                          }}
                          className="p-1 text-[#9AA3AE] hover:text-[#E8384F] rounded cursor-pointer transition-colors"
                          title="Excluir subunidade"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#FF7A29]" />
            <h3 className="text-sm font-black text-[#F1F3F5] uppercase tracking-wide font-sans">
              Usuários Autorizados ({users.length})
            </h3>
          </div>
          <span className="text-xs text-[#9AA3AE]">
            {isSuperAdmin ? 'Todas as Subunidades' : `Subunidade: ${session.orgId}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0A0C10] text-[#9AA3AE] uppercase tracking-wider border-b border-[rgba(255,255,255,0.06)]">
              <tr>
                <th className="p-3 text-[#F1F3F5]">Militar</th>
                <th className="p-3 text-[#FF7A29]">Login</th>
                <th className="p-3">Subunidade</th>
                <th className="p-3">Perfil de Acesso</th>
                <th className="p-3">Data Cadastro</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)] bg-[#13161C]">
              {(isSuperAdmin ? users : users.filter((u) => u.orgId === session.orgId)).map((u) => {
                const org = organizations.find((o) => o.id === u.orgId);
                const isMasterSimas = u.username.toUpperCase() === '1SGTSIMAS';

                return (
                  <tr key={u.id} className="hover:bg-[#1B1F27] transition-colors">
                    <td className="p-3 font-bold text-[#F1F3F5] flex items-center space-x-2">
                      <UserCheck className="w-3.5 h-3.5 text-[#3ED598]" />
                      <span>{u.grad} {u.nomeGuerra}</span>
                    </td>
                    <td className="p-3 font-mono text-[#FF7A29] font-black">
                      {u.username}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[6px] text-[#9AA3AE] text-xs">
                        {org ? org.sigla : u.orgId}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-[6px] text-xs font-black uppercase ${
                        u.role === 'SUPER_ADMIN'
                          ? 'bg-[#1B1F27] text-[#FF7A29] border border-[#FF7A29]/40'
                          : u.role === 'ORG_ADMIN'
                          ? 'bg-[#1B1F27] text-[#33C9EB] border border-[#33C9EB]/40'
                          : 'bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] text-[#9AA3AE]'
                      }`}>
                        {getRoleLabel(u.role)}
                      </span>
                    </td>
                    <td className="p-3 text-[#9AA3AE] font-tabular">{u.createdAt}</td>
                    <td className="p-3 text-right">
                      {!isMasterSimas && (
                        <button
                          onClick={() => {
                            setConfirmAction({
                              title: 'Excluir Usuário',
                              message: `Deseja remover o usuário ${u.grad} ${u.nomeGuerra} (${u.username})?`,
                              confirmLabel: 'Excluir Usuário',
                              isDanger: true,
                              onConfirm: () => {
                                onDeleteUser(u.id);
                                setConfirmAction(null);
                              }
                            });
                          }}
                          className="p-1 text-[#9AA3AE] hover:text-[#E8384F] rounded transition-colors cursor-pointer"
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Criar Nova Subunidade */}
      {showOrgModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[22px] w-full max-w-md shadow-2xl overflow-hidden font-mono text-xs">
            <div className="p-4 bg-[#0A0C10] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-[#33C9EB]" />
                <h3 className="text-sm font-black text-[#F1F3F5] uppercase tracking-wide font-sans">
                  Cadastrar Subunidade
                </h3>
              </div>
              <button
                onClick={() => setShowOrgModal(false)}
                className="text-[#9AA3AE] hover:text-[#F1F3F5] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="p-5 space-y-4 text-xs text-[#F1F3F5]">
              <div>
                <label className="block text-[#9AA3AE] mb-1 font-bold uppercase">Nome da Subunidade / Seção</label>
                <input
                  type="text"
                  value={newOrgNome}
                  onChange={(e) => setNewOrgNome(e.target.value)}
                  placeholder="Ex: Rancho de Cabos e Soldados"
                  className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3.5 py-2.5 text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#9AA3AE] mb-1 font-bold uppercase">Sigla</label>
                <input
                  type="text"
                  value={newOrgSigla}
                  onChange={(e) => setNewOrgSigla(e.target.value)}
                  placeholder="Ex: RANCHO"
                  className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3.5 py-2.5 text-[#F1F3F5] uppercase focus:outline-none focus:border-[#FF7A29]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#9AA3AE] mb-1 font-bold uppercase">Descrição (Opcional)</label>
                <textarea
                  value={newOrgDesc}
                  onChange={(e) => setNewOrgDesc(e.target.value)}
                  placeholder="Ex: Seção responsável pelas escalas do aprovisionamento"
                  rows={2}
                  className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3.5 py-2.5 text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowOrgModal(false)}
                  className="py-2.5 px-4 bg-[#0A0C10] text-[#9AA3AE] rounded-[10px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black rounded-[10px] flex items-center space-x-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Subunidade</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Criar Usuário */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[22px] w-full max-w-md shadow-2xl overflow-hidden font-mono text-xs">
            <div className="p-4 bg-[#0A0C10] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-[#FF7A29]" />
                <h3 className="text-sm font-black text-[#F1F3F5] uppercase tracking-wide font-sans">
                  Cadastrar Novo Usuário
                </h3>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-[#9AA3AE] hover:text-[#F1F3F5] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mx-5 mt-4 p-2.5 bg-[#2A0C10] border border-[#E8384F]/40 text-[#E8384F] text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-xs text-[#F1F3F5]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9AA3AE] mb-1 font-bold uppercase">Posto / Graduação</label>
                  <select
                    value={newGrad}
                    onChange={(e) => setNewGrad(e.target.value as Graduacao)}
                    className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2 text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
                  >
                    {GRADUACOES.map((g) => (
                      <option key={g} value={g} className="bg-[#13161C]">{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#9AA3AE] mb-1 font-bold uppercase">Nome de Guerra</label>
                  <input
                    type="text"
                    value={newNomeGuerra}
                    onChange={(e) => setNewNomeGuerra(e.target.value)}
                    placeholder="Ex: Silva"
                    className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2 text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
                    required
                  />
                </div>
              </div>

              {isSuperAdmin && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#9AA3AE] mb-1 font-bold uppercase">Subunidade</label>
                    <select
                      value={newOrgId}
                      onChange={(e) => setNewOrgId(e.target.value)}
                      className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2 text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
                    >
                      {organizations.map((o) => (
                        <option key={o.id} value={o.id} className="bg-[#13161C]">{o.sigla} - {o.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#9AA3AE] mb-1 font-bold uppercase">Perfil de Acesso</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2 text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
                    >
                      <option value="OPERADOR" className="bg-[#13161C]">Operador de Escala</option>
                      <option value="ORG_ADMIN" className="bg-[#13161C]">Gestor da Subunidade</option>
                      <option value="SUPER_ADMIN" className="bg-[#13161C]">Administrador Geral</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[#9AA3AE] mb-1 font-bold uppercase">Login / Usuário</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ex: 3SGT_SILVA"
                  className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2 text-[#F1F3F5] font-mono uppercase focus:outline-none focus:border-[#FF7A29]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#9AA3AE] mb-1 font-bold uppercase">Senha de Acesso</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Senha de acesso"
                    className="w-full bg-[#0A0C10] border border-[rgba(255,255,255,0.06)] rounded-[12px] px-3 py-2 pr-9 text-[#F1F3F5] focus:outline-none focus:border-[#FF7A29]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-[#9AA3AE] hover:text-[#F1F3F5] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-[#FF7A29]" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="py-2.5 px-4 bg-[#0A0C10] text-[#9AA3AE] rounded-[10px] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-4 bg-[#FF7A29] hover:bg-[#ff8e47] text-[#0A0C10] font-black rounded-[10px] flex items-center space-x-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Cadastrar Usuário</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#13161C] border border-[#E8384F]/50 rounded-[22px] w-full max-w-md shadow-2xl overflow-hidden font-mono text-xs">
            <div className="p-4 bg-[#0A0C10] border-b border-[rgba(255,255,255,0.06)] flex items-center space-x-2.5">
              <Trash2 className="w-4 h-4 text-[#E8384F]" />
              <h3 className="text-sm font-black text-[#F1F3F5] font-sans">
                {confirmAction.title}
              </h3>
            </div>
            <div className="p-5 space-y-4 text-xs text-[#9AA3AE]">
              <p className="leading-relaxed">
                {confirmAction.message}
              </p>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="py-2.5 px-4 bg-[#0A0C10] text-[#9AA3AE] hover:text-[#F1F3F5] rounded-[10px] font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmAction.onConfirm}
                  className="py-2.5 px-4 bg-[#E8384F] hover:bg-[#ff4d63] text-[#0A0C10] font-black rounded-[10px] cursor-pointer transition-colors"
                >
                  {confirmAction.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
