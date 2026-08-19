import React, { useState } from 'react';
import { 
  User, 
  KeyRound, 
  ArrowRight, 
  AlertCircle,
  Lock
} from 'lucide-react';
import { UserSession, UserAccount } from '../types';
import { SgeLogo } from './SgeLogo';
import { INITIAL_USERS } from '../lib/firebase';
import { triggerHaptic } from '../utils/helpers';

interface LoginScreenProps {
  users?: UserAccount[];
  onLoginSuccess: (session: UserSession) => void;
  onReplayJarvis: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  users = INITIAL_USERS, 
  onLoginSuccess, 
  onReplayJarvis 
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Por favor, informe o usuário e a senha de acesso.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const cleanUser = username.trim().toUpperCase();
      
      // Look up in users list
      const matchedUser = users.find(
        (u) => u.username.toUpperCase() === cleanUser && u.password === password
      );

      if (matchedUser) {
        // Clean display name so rank/grad is never duplicated
        const cleanNome = matchedUser.nomeGuerra.replace(new RegExp(`^${matchedUser.grad}\\s*`, 'i'), '').trim();
        onLoginSuccess({
          id: matchedUser.id,
          username: matchedUser.username,
          nomeGuerra: cleanNome || matchedUser.nomeGuerra,
          grad: matchedUser.grad,
          role: matchedUser.role,
          setor: matchedUser.orgId,
          orgId: matchedUser.orgId
        });
      } else if (cleanUser === '1SGTSIMAS' && password === 'Damer1986@') {
        // Fallback default admin
        onLoginSuccess({
          id: 'user-simas-master',
          username: '1SGTSIMAS',
          nomeGuerra: 'Simas',
          grad: '1º Sgt',
          role: 'SUPER_ADMIN',
          setor: 'rancho',
          orgId: 'rancho'
        });
      } else {
        setError('Usuário ou senha incorretos. Verifique suas credenciais.');
      }
      setLoading(false);
    }, 200);
  };

  return (
    <div 
      className="min-h-screen bg-[#0A0C10] text-[#F1F3F5] flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden font-sans select-none"
      style={{
        paddingTop: 'env(safe-area-inset-top, 16px)',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)'
      }}
    >
      {/* Discreet Technical Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#FF7A29 1px, transparent 1px), linear-gradient(90deg, #FF7A29 1px, transparent 1px)`,
          backgroundSize: '36px 36px'
        }}
      />

      {/* Center Authentication Container */}
      <div className="w-full max-w-md relative z-10 flex flex-col items-center space-y-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3.5 rounded-2xl bg-[#13161C] border border-[rgba(255,255,255,0.06)] shadow-[0_0_25px_rgba(255,122,41,0.12)]">
            <SgeLogo size="md" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-wider text-[#F1F3F5] uppercase leading-none">
              SGE
            </h1>
            <p className="text-[10px] md:text-xs text-[#9AA3AE] font-mono tracking-widest uppercase mt-1">
              SISTEMA DE GESTÃO DE ESCALAS
            </p>
          </div>
        </div>

        {/* Dark Login Card */}
        <div className="w-full bg-[#13161C] border border-[rgba(255,255,255,0.06)] rounded-[22px] p-6 md:p-8 shadow-2xl space-y-5">
          
          <div className="pb-3 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#FF7A29]" />
              <span className="text-xs font-mono font-bold text-[#F1F3F5] uppercase tracking-wider">
                Autenticação de Acesso
              </span>
            </div>
            <span className="text-[9px] font-mono text-[#5B6470]">
              v4.2 PRO
            </span>
          </div>

          {error && (
            <div className="p-3 bg-[#2A0C10] border border-[#E8384F]/40 rounded-[12px] flex items-center space-x-2.5 text-[#E8384F] text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-[#9AA3AE] uppercase tracking-wider font-bold mb-1.5">
                USUÁRIO OU MATRÍCULA
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B6470]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  placeholder="Ex: 1SGTSIMAS"
                  className="w-full bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/50 focus:border-[#FF7A29] rounded-[12px] pl-10 pr-3.5 py-3 text-xs text-[#F1F3F5] font-mono placeholder:text-[#5B6470] focus:outline-none transition-all uppercase shadow-inner"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck="false"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-[#9AA3AE] uppercase tracking-wider font-bold mb-1.5">
                SENHA DE ACESSO
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5B6470]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••••••"
                  className="w-full bg-[#1B1F27] border border-[rgba(255,255,255,0.06)] hover:border-[#FF7A29]/50 focus:border-[#FF7A29] rounded-[12px] pl-10 pr-3.5 py-3 text-xs text-[#F1F3F5] font-mono placeholder:text-[#5B6470] focus:outline-none transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#FF7A29] hover:bg-[#ff8e47] active:scale-[0.99] text-[#0A0C10] font-black rounded-[12px] text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-[0_0_20px_rgba(255,122,41,0.25)] mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-[#0A0C10] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>ENTRAR NO SISTEMA</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-[9px] font-mono text-[#5B6470]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ED598]" />
              <span>Conexão Segura</span>
            </span>
            <button
              onClick={onReplayJarvis}
              className="text-[#9AA3AE] hover:text-[#FF7A29] transition-colors cursor-pointer"
            >
              Ver Abertura
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
