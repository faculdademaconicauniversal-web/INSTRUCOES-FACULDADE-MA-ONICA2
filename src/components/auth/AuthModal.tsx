import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  Building,
  Award,
  FileCheck,
  AlertCircle,
  CheckCircle,
  LogIn,
  UserPlus,
  KeyRound,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { FACULDADE_SEAL_IMG } from '../../assets/logo';

export interface AuthModalProps {
  isOpen?: boolean;
  initialMode?: 'login' | 'register' | 'forgot';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen = true,
  initialMode = 'login',
  onClose,
}) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync mode when initialMode prop changes
  React.useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
      setError(null);
      setSuccess(null);
    }
  }, [initialMode]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [masonicName, setMasonicName] = useState('');
  const [phone, setPhone] = useState('');
  const [lodge, setLodge] = useState('');
  const [grandLodge, setGrandLodge] = useState('Grande oriente Maçonico Universal GOMAU');
  const [degree, setDegree] = useState<number>(1);
  const [cimNumber, setCimNumber] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [photoURL, setPhotoURL] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [recognizedAuth, setRecognizedAuth] = useState<{
    degree: number;
    fullName?: string;
    lodge?: string;
  } | null>(null);
  const [recognizedLockRecord, setRecognizedLockRecord] = useState<{
    found: boolean;
    name?: string;
    cim?: string;
    age?: number;
    degree?: number;
    lodge?: string;
    isRoot?: boolean;
  } | null>(null);

  // Check authCode or email when changed in register mode
  const handleAuthCodeChange = (code: string) => {
    setAuthCode(code);
    if (code.trim()) {
      const auth = dataStore.getAuthorizationByCode(code.trim());
      if (auth && auth.status === 'pending') {
        setRecognizedAuth({ degree: auth.authorizedDegree, fullName: auth.fullName, lodge: auth.lodge });
        setDegree(auth.authorizedDegree);
        if (auth.fullName && !fullName) setFullName(auth.fullName);
        if (auth.lodge && !lodge) setLodge(auth.lodge);
        if (auth.cimNumber && !cimNumber) setCimNumber(auth.cimNumber);
        if (auth.email && !email) setEmail(auth.email);
        if (auth.age && !age) setAge(auth.age);
      } else {
        setRecognizedAuth(null);
      }
    } else {
      setRecognizedAuth(null);
    }
  };

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    const clean = newEmail.trim().toLowerCase();
    if (clean) {
      // Check pre-registered lock record (users + member_authorizations)
      const lockRecord = dataStore.findAccessLocksRecord(clean);
      if (lockRecord.found) {
        setRecognizedLockRecord({
          found: true,
          name: lockRecord.expectedFullName,
          cim: lockRecord.expectedCim,
          age: lockRecord.expectedAge,
          degree: lockRecord.user?.degree || lockRecord.authorization?.authorizedDegree || (lockRecord.isRootAdmin ? 3 : 1),
          lodge: lockRecord.user?.lodge || lockRecord.authorization?.lodge,
          isRoot: lockRecord.isRootAdmin,
        });
        if (lockRecord.expectedFullName && !fullName) {
          setFullName(lockRecord.expectedFullName);
        }
        if (lockRecord.expectedCim && !cimNumber) {
          setCimNumber(lockRecord.expectedCim);
        }
        if (lockRecord.expectedAge && !age) {
          setAge(lockRecord.expectedAge);
        }
      } else {
        setRecognizedLockRecord({ found: false });
      }

      // Check pending pre-authorizations in register mode
      if (!authCode.trim()) {
        const auth = dataStore.getAuthorizationByEmail(clean);
        if (auth && auth.status === 'pending') {
          setRecognizedAuth({ degree: auth.authorizedDegree, fullName: auth.fullName, lodge: auth.lodge });
          setDegree(auth.authorizedDegree);
          if (auth.fullName && !fullName) setFullName(auth.fullName);
          if (auth.lodge && !lodge) setLodge(auth.lodge);
          if (auth.cimNumber && !cimNumber) setCimNumber(auth.cimNumber);
          if (auth.age && !age) setAge(auth.age);
        }
      }
    } else {
      setRecognizedLockRecord(null);
      setRecognizedAuth(null);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !fullName.trim()) {
          setError('As Travas de Segurança são obrigatórias: informe o E-mail e o Nome Completo previamente cadastrados pelo Administrador.');
          setLoading(false);
          return;
        }
        await loginWithEmail(
          email.trim(),
          password,
          cimNumber.trim() || undefined,
          age ? Number(age) : undefined,
          fullName.trim()
        );
        onClose();
      } else if (mode === 'register') {
        if (!fullName || !email || !lodge) {
          setError('Por favor, preencha todos os campos obrigatórios (*), incluindo Nome Completo e E-mail.');
          setLoading(false);
          return;
        }
        await registerWithEmail(
          email,
          password,
          {
            fullName,
            masonicName: masonicName || undefined,
            phone: phone || undefined,
            age: Number(age),
            lodge,
            grandLodge,
            degree,
            cimNumber,
            photoURL: photoURL || undefined,
          },
          authCode.trim() || undefined
        );
        setSuccess(
          recognizedAuth
            ? `Autorização validada com sucesso! Seu acesso no Grau 0${recognizedAuth.degree} foi liberado imediatamente.`
            : 'Cadastro realizado! Seu registro está ativo ou aguardando aprovação da administração.'
        );
        setTimeout(() => onClose(), 2500);
      } else if (mode === 'forgot') {
        if (!email) {
          setError('Informe seu e-mail cadastrado.');
          setLoading(false);
          return;
        }
        await resetPassword(email);
        setSuccess('Instruções para redefinição de senha foram enviadas ao seu e-mail.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('Acesso não autorizado')) {
        setError(err.message);
      } else if (err.message && err.message.includes('Cadastro não permitido')) {
        setError(err.message);
      } else {
        setError(
          err.message?.includes('auth/invalid-credential') || err.message?.includes('auth/wrong-password')
            ? 'E-mail ou senha incorretos. Apenas membros cadastrados possuem acesso.'
            : err.message?.includes('auth/user-not-found')
            ? 'E-mail não encontrado nos registros do Templo.'
            : err.message?.includes('auth/email-already-in-use')
            ? 'Este e-mail já está cadastrado no sistema.'
            : err.message?.includes('weak-password')
            ? 'A senha deve conter no mínimo 6 caracteres.'
            : err.message || 'Ocorreu um erro ao processar sua solicitação.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.warn('Google login error in modal:', err);
      setError(
        err.message?.includes('Acesso não autorizado')
          ? err.message
          : 'Não foi possível completar o acesso via Google. Use o acesso por e-mail ou o botão de preenchimento da Chancelaria.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#111520] border border-amber-500/35 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Top Header with Masonic Design */}
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-black px-6 py-5 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-600 shadow-md flex items-center justify-center">
              <img
                src={FACULDADE_SEAL_IMG}
                alt="Brasão Oficial Faculdade Maçônica"
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-base font-bold font-masonic text-amber-200 tracking-wide">
                {mode === 'login'
                  ? 'Acesso ao Templo de Estudos'
                  : mode === 'register'
                  ? 'Solicitar Novo Acesso'
                  : 'Recuperação de Senha'}
              </h2>
              <p className="text-xs text-slate-400">Faculdade Maçônica Universal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* Direct Switcher Tabs */}
          {mode !== 'forgot' && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 rounded-xl border border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccess(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold font-masonic transition-all flex items-center justify-center space-x-1.5 ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Acessar o Templo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccess(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold font-masonic transition-all flex items-center justify-center space-x-1.5 ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Solicitar Novo Acesso</span>
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'login' && (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/35">
                  <div className="flex items-center space-x-2 text-amber-300 font-masonic text-xs font-bold mb-1">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>TRAVAS DE SEGURANÇA ATIVAS • ACESSO HOMOLOGADO</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Somente terão permissão para acessar o site os usuários cujo <strong>E-mail</strong> e <strong>Nome Completo</strong> foram previamente cadastrados pelo Administrador.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-masonic">
                    Credenciais Homologadas para Teste Imediato:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('faculdademaconicauniversal@gmail.com');
                        setFullName('Ir. João da Silva Guimarães');
                        setCimNumber('CIM-102938');
                        setAge(48);
                        setPassword('admin123');
                        setRecognizedLockRecord({
                          found: true,
                          name: 'Ir. João da Silva Guimarães',
                          cim: 'CIM-102938',
                          isRoot: true,
                        });
                      }}
                      className="px-2 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[10px] font-bold text-left transition-all hover:scale-[1.02]"
                    >
                      👑 Chanceler Geral
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('marcos.fontes@exemplo.com');
                        setFullName('Ir. Dr. Marcos Vinicius Fontes');
                        setCimNumber('CIM-119283');
                        setAge(50);
                        setPassword('Mestrado@2026');
                        setRecognizedLockRecord({
                          found: true,
                          name: 'Ir. Dr. Marcos Vinicius Fontes',
                          cim: 'CIM-119283',
                          degree: 3,
                        });
                      }}
                      className="px-2 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-200 text-[10px] font-bold text-left transition-all hover:scale-[1.02]"
                    >
                      🔵 Grau 3 • Mestre
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('roberto.campos@exemplo.com');
                        setFullName('Ir. Roberto Silveira Campos');
                        setCimNumber('CIM-293810');
                        setAge(42);
                        setPassword('Companheiro@2026');
                        setRecognizedLockRecord({
                          found: true,
                          name: 'Ir. Roberto Silveira Campos',
                          cim: 'CIM-293810',
                          degree: 2,
                        });
                      }}
                      className="px-2 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-[10px] font-bold text-left transition-all hover:scale-[1.02]"
                    >
                      🟣 Grau 2 • Companheiro
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('fernando.alencar@exemplo.com');
                        setFullName('Ir. Fernando Alencar Mendonça');
                        setCimNumber('CIM-448291');
                        setAge(35);
                        setPassword('Iniciado@2026');
                        setRecognizedLockRecord({
                          found: true,
                          name: 'Ir. Fernando Alencar Mendonça',
                          cim: 'CIM-448291',
                          degree: 1,
                        });
                      }}
                      className="px-2 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-[10px] font-bold text-left transition-all hover:scale-[1.02]"
                    >
                      🟢 Grau 1 • Aprendiz
                    </button>
                  </div>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Nome Completo *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ir. Nome Completo"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Nome Maçônico (opcional)
                    </label>
                    <input
                      type="text"
                      value={masonicName}
                      onChange={(e) => setMasonicName(e.target.value)}
                      placeholder="Ex: Salomão, Hermes..."
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Telefone / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(00) 00000-0000"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Registro Interno (CIM / Matrícula) *
                    </label>
                    <div className="relative">
                      <FileCheck className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={cimNumber}
                        onChange={(e) => setCimNumber(e.target.value)}
                        placeholder="Ex: CIM-123456"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Idade do Irmão (Anos) *
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="number"
                        min={18}
                        max={120}
                        required
                        value={age}
                        onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                        placeholder="Ex: 38"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Loja Maçônica *
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={lodge}
                        onChange={(e) => setLodge(e.target.value)}
                        placeholder="Ex: ARLS Luz do Oriente nº 123"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Potência Maçônica *
                    </label>
                    <select
                      value={grandLodge}
                      onChange={(e) => setGrandLodge(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    >
                      <option value="Grande oriente Maçonico Universal GOMAU">Grande oriente Maçonico Universal GOMAU</option>
                      <option value="Grande Loja do Estado de São Paulo (GLESP)">GLESP (CMSB)</option>
                      <option value="Grande Loja Maçônica de Minas Gerais (GLMEMG)">GLMEMG (CMSB)</option>
                      <option value="Grande Loja Maçônica do Rio de Janeiro (GLMERJ)">GLMERJ (CMSB)</option>
                      <option value="COMAB - Confederação Maçônica do Brasil">COMAB</option>
                      <option value="Outra Potência Regular">Outra Potência Regular</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Grau Atual na Ordem *
                  </label>
                  <select
                    value={degree}
                    onChange={(e) => setDegree(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-semibold focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  >
                    <option value={1}>Grau 01 • Aprendiz Maçom</option>
                    <option value={2}>Grau 02 • Companheiro Maçom</option>
                    <option value={3}>Grau 03 • Mestre Maçom</option>
                  </select>
                </div>

                {/* Token / Código de Autorização Maçônica */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Código de Autorização da Chancelaria (Opcional)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      value={authCode}
                      onChange={(e) => handleAuthCodeChange(e.target.value)}
                      placeholder="Ex: AUTH-G1-123456 (Caso possua convite prévio)"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-amber-200 font-mono placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  {recognizedAuth && (
                    <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        ✓ Autorização Válida! Acesso imediato liberado no <strong>Grau 0{recognizedAuth.degree}</strong> ({recognizedAuth.degree === 1 ? 'Aprendiz' : recognizedAuth.degree === 2 ? 'Companheiro' : 'Mestre'}).
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                E-mail Cadastrado * {mode === 'login' && <span className="text-amber-400 font-bold font-mono text-[10px] ml-1">🔒 [TRAVA 1]</span>}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="irmao@exemplo.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {mode === 'login' && recognizedLockRecord?.found && (
                <div className="mt-2 p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-[11px] flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    ✓ <strong>E-mail Homologado:</strong> Ir. {recognizedLockRecord.name} {recognizedLockRecord.isRoot ? '• 👑 Chanceler Geral' : recognizedLockRecord.cim ? `• ${recognizedLockRecord.cim}` : ''}
                  </span>
                </div>
              )}

              {mode === 'login' && recognizedLockRecord && !recognizedLockRecord.found && email.includes('@') && email.length > 5 && (
                <div className="mt-2 p-2 rounded-lg bg-red-950/70 border border-red-500/50 text-red-200 text-[11px] flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    🛑 <strong>Acesso Bloqueado:</strong> Este e-mail não foi previamente cadastrado pelo Administrador. Apenas usuários com E-mail e Nome previamente cadastrados têm permissão para acessar o site.
                  </span>
                </div>
              )}
            </div>

            {mode === 'login' && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Nome Completo do Irmão * <span className="text-amber-400 font-bold font-mono text-[10px] ml-1">🔒 [TRAVA 2]</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ir. Nome Completo (conforme cadastrado)"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-amber-200 font-medium placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Deve conferir com o nome previamente cadastrado pelo Administrador para este e-mail.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      CIM Maçônico (opcional)
                    </label>
                    <div className="relative">
                      <FileCheck className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        value={cimNumber}
                        onChange={(e) => setCimNumber(e.target.value)}
                        placeholder="Ex: CIM-102938"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 font-mono placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Idade do Irmão (opcional)
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="number"
                        min={18}
                        max={120}
                        value={age}
                        onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                        placeholder="Ex: 48"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 font-mono placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {mode !== 'forgot' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Senha de Acesso *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Acessar o Templo de Estudos</span>
                </>
              ) : mode === 'register' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Enviar Solicitação de Novo Acesso</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Enviar Link de Recuperação</span>
                </>
              )}
            </button>
          </form>

          {/* Google Single Sign-On Button */}
          {mode !== 'forgot' && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Acessar com Conta Google</span>
              </button>
            </div>
          )}

          {/* Footer Modes Toggle */}
          <div className="mt-5 text-center text-xs text-slate-400 space-y-1.5">
            {mode === 'login' ? (
              <>
                <div>
                  Ainda não possui cadastro ativo?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-amber-400 font-semibold hover:underline"
                  >
                    Solicitar Novo Acesso
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-slate-500 hover:text-slate-300 text-[11px]"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              </>
            ) : mode === 'register' ? (
              <div>
                Já possui autorização ou conta ativa?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-amber-400 font-semibold hover:underline"
                >
                  Acessar o Templo de Estudos
                </button>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-amber-400 font-semibold hover:underline"
                >
                  Voltar para o Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
