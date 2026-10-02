import React, { useState } from 'react';
import {
  UserPlus,
  Shield,
  Award,
  KeyRound,
  CheckCircle2,
  Copy,
  Check,
  Building,
  Mail,
  User,
  Phone,
  FileCheck,
  Sparkles,
  AlertCircle,
  Clock,
  Send,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  Share2,
  Users,
  Search,
  Filter,
  CheckSquare,
  XCircle,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { UserProfile, UserRole, UserStatus, MemberAuthorization } from '../../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface NewUserRegistrationViewProps {
  onUserRegistered?: (user: UserProfile) => void;
  onNavigateTab?: (tabName: string) => void;
}

export const NewUserRegistrationView: React.FC<NewUserRegistrationViewProps> = ({
  onUserRegistered,
  onNavigateTab,
}) => {
  const { userProfile: currentAdmin } = useAuth();

  // Mode: 'direct' (cadastrar e ativar direto) | 'token' (gerar autorização prévia)
  const [creationMode, setCreationMode] = useState<'direct' | 'token'>('direct');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [masonicName, setMasonicName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cimNumber, setCimNumber] = useState('');
  const [age, setAge] = useState<number | ''>(35);
  const [lodge, setLodge] = useState('ARLS Acácia da Fraternidade nº 44');
  const [grandLodge, setGrandLodge] = useState('Grande oriente Maçonico Universal GOMAU');
  
  // Grau e Permissões
  const [selectedDegree, setSelectedDegree] = useState<number>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>('brother');
  const [initialStatus, setInitialStatus] = useState<UserStatus>('approved');
  const [temporaryPassword, setTemporaryPassword] = useState('Macom@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [notes, setNotes] = useState('');
  const [sendWelcomeNotification, setSendWelcomeNotification] = useState(true);

  // States for submission result
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    user?: UserProfile;
    authorization?: MemberAuthorization;
    generatedPassword?: string;
    tokenCode?: string;
    degreeName: string;
  } | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // List of authorizations for management
  const [authorizationsList, setAuthorizationsList] = useState<MemberAuthorization[]>(() =>
    dataStore.getAuthorizations()
  );
  const [authSearch, setAuthSearch] = useState('');
  const [authDegreeFilter, setAuthDegreeFilter] = useState<'all' | number>('all');
  const [authStatusFilter, setAuthStatusFilter] = useState<'all' | 'pending' | 'used' | 'revoked'>('all');

  // Pending users quick approval list
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>(() =>
    dataStore.getUsers().filter((u) => u.status === 'pending')
  );
  const [pendingDegreeSelections, setPendingDegreeSelections] = useState<Record<string, number>>({});
  const [pendingRoleSelections, setPendingRoleSelections] = useState<Record<string, UserRole>>({});

  const refreshLists = () => {
    setAuthorizationsList(dataStore.getAuthorizations());
    setPendingUsers(dataStore.getUsers().filter((u) => u.status === 'pending'));
  };

  const handleGenerateRandomPassword = () => {
    const prefixes = ['Macom', 'Frater', 'Luz', 'Templo', 'Acacia', 'Oriente', 'Esquadro'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setTemporaryPassword(`${randomPrefix}@${randomNum}`);
  };

  const getDegreeDetails = (deg: number) => {
    switch (deg) {
      case 1:
        return {
          title: 'Grau 01 • Aprendiz Maçom',
          badgeColor: 'from-amber-600 to-amber-500',
          textColor: 'text-amber-400',
          borderColor: 'border-amber-500/50',
          bgColor: 'bg-amber-500/10',
          desc: 'Acesso imediato às 3 Instruções de Aprendiz, 30 questões de questionários, submissão de Pranchas e certificados do 1º Grau.',
          permissions: ['Instruções do Grau 1', 'Questionários de Aprendiz', 'Pranchas do Grau 1', 'Certificado de Aprendiz'],
        };
      case 2:
        return {
          title: 'Grau 02 • Companheiro Maçom',
          badgeColor: 'from-blue-600 to-blue-500',
          textColor: 'text-blue-400',
          borderColor: 'border-blue-500/50',
          bgColor: 'bg-blue-500/10',
          desc: 'Acesso liberado diretamente aos Graus 1 e 2 (6 Instruções totais), rituais e mistérios de Companheiro e certificação.',
          permissions: ['Instruções dos Graus 1 e 2', 'Questionários de Companheiro', 'Pranchas dos Graus 1 e 2', 'Certificados Graus 1 e 2'],
        };
      case 3:
        return {
          title: 'Grau 03 • Mestre Maçom',
          badgeColor: 'from-purple-600 to-purple-500',
          textColor: 'text-purple-400',
          borderColor: 'border-purple-500/50',
          bgColor: 'bg-purple-500/10',
          desc: 'Acesso pleno e irrestrito aos Graus 1, 2 e 3 (todas as 9 Instruções), Câmara do Meio, Lenda de Hiram e plenitude maçônica.',
          permissions: ['Instruções dos Graus 1, 2 e 3', 'Câmara do Meio & Plenitude', 'Todas as Avaliações & Pranchas', 'Certificado de Mestre Maçom'],
        };
      default:
        return {
          title: `Grau 0${deg}`,
          badgeColor: 'from-amber-600 to-amber-500',
          textColor: 'text-amber-400',
          borderColor: 'border-amber-500/50',
          bgColor: 'bg-amber-500/10',
          desc: 'Acesso conforme matriz curricular.',
          permissions: ['Instruções Curriculares'],
        };
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    if (!fullName.trim() || !email.trim() || !lodge.trim() || !cimNumber.trim() || !age) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios (*), incluindo as 3 Travas de Acesso (E-mail, CIM e Idade).');
      setLoading(false);
      return;
    }

    try {
      const adminName = currentAdmin?.fullName || 'Ir. Administrador (Chanceler)';
      const degreeInfo = getDegreeDetails(selectedDegree);

      if (creationMode === 'direct') {
        // Direct Brother Registration with Access Activated
        const result = dataStore.createDirectAuthorizedBrother(
          {
            fullName,
            masonicName: masonicName || undefined,
            email,
            phone: phone || undefined,
            cimNumber,
            age: Number(age),
            lodge,
            grandLodge,
            degree: selectedDegree,
            role: selectedRole,
            status: initialStatus,
            temporaryPassword,
            notes,
            sendWelcomeNotification,
          },
          adminName
        );

        if (!result.success) {
          setErrorMessage(result.message);
          setLoading(false);
          return;
        }

        setSuccessResult({
          user: result.user,
          authorization: result.authorization,
          generatedPassword: temporaryPassword,
          tokenCode: result.authorization?.tokenCode,
          degreeName: degreeInfo.title,
        });

        if (result.user) {
          // Asynchronously sync directly registered user to Firestore
          setDoc(doc(db, 'users', result.user.id), result.user).catch((err) =>
            console.warn('Firestore user save notice:', err)
          );
        }

        if (result.user && onUserRegistered) {
          onUserRegistered(result.user);
        }
      } else {
        // Pre-Authorization Token Creation
        const auth = dataStore.createMemberAuthorization({
          fullName,
          email,
          phone: phone || undefined,
          cimNumber,
          age: Number(age),
          lodge,
          grandLodge,
          authorizedDegree: selectedDegree,
          role: selectedRole,
          temporaryPassword,
          notes,
          createdById: currentAdmin?.id || 'admin',
          createdByName: adminName,
        });

        setSuccessResult({
          authorization: auth,
          generatedPassword: temporaryPassword,
          tokenCode: auth.tokenCode,
          degreeName: degreeInfo.title,
        });
      }

      refreshLists();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao processar o cadastro de novo usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setFullName('');
    setMasonicName('');
    setEmail('');
    setPhone('');
    setCimNumber('');
    setNotes('');
    handleGenerateRandomPassword();
    setSuccessResult(null);
    setErrorMessage(null);
  };

  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const generateWhatsAppMessage = () => {
    if (!successResult) return '';
    const name = successResult.user?.fullName || fullName;
    const userEmail = successResult.user?.email || email;
    const pass = successResult.generatedPassword || temporaryPassword;
    const degTitle = successResult.degreeName;
    const token = successResult.tokenCode || 'LIBERADO';
    const appUrl = window.location.origin;

    return `🏛️ *FACULDADE MAÇÔNICA UNIVERSAL*
*Comunicação Oficial da Chancelaria*

Prezado e Venerável Irmão *${name}*,
Seu cadastro foi homologado e o seu acesso foi *LIBERADO* na plataforma de estudos!

📜 *Dados da Autorização:*
• *Grau Liberado:* ${degTitle}
• *Loja:* ${lodge}
• *Código de Autorização:* ${token}

🔒 *Suas 3 Travas de Segurança Obrigatórias para Login:*
1️⃣ *E-mail:* ${userEmail}
2️⃣ *CIM:* ${cimNumber}
3️⃣ *Idade:* ${age} anos

🔑 *Credenciais de Acesso:*
• *Portal:* ${appUrl}
• *Senha Provisória:* ${pass}

Recomendamos alterar sua senha no primeiro acesso em *Meu Perfil*.
Bons estudos em seus trabalhos litúrgicos e filosóficos!

Fraternalmente,
T.’.F.’.A.’.`;
  };

  // Quick Approval for Pending Users
  const handleApprovePendingUser = (user: UserProfile) => {
    const targetDeg = pendingDegreeSelections[user.id] || user.degree || 1;
    const targetRole = pendingRoleSelections[user.id] || user.role || 'brother';
    const adminName = currentAdmin?.fullName || 'Chanceler';

    dataStore.authorizePendingUser(user.id, targetDeg, adminName, targetRole);
    refreshLists();
  };

  const handleRevokeAuth = (authId: string) => {
    const adminName = currentAdmin?.fullName || 'Chanceler';
    dataStore.revokeMemberAuthorization(authId, adminName);
    refreshLists();
  };

  // Filtered Authorizations List
  const filteredAuthorizations = authorizationsList.filter((a) => {
    if (authDegreeFilter !== 'all' && a.authorizedDegree !== authDegreeFilter) return false;
    if (authStatusFilter !== 'all' && a.status !== authStatusFilter) return false;
    if (authSearch.trim()) {
      const q = authSearch.toLowerCase();
      return (
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.tokenCode.toLowerCase().includes(q) ||
        a.cimNumber.toLowerCase().includes(q) ||
        a.lodge.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Solene Banner */}
      <div className="bg-gradient-to-r from-[#1f1712] via-[#161219] to-black border border-amber-500/40 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-masonic mb-1">
            <Shield className="w-4 h-4" />
            <span>Chancelaria Geral • Controle de Acessos & Permissões</span>
          </div>
          <h1 className="text-2xl font-bold font-masonic text-slate-100 flex items-center space-x-2">
            <UserPlus className="w-6 h-6 text-amber-400" />
            <span>Cadastro de Novo Usuário</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
            Cadastre novos irmãos diretamente na plataforma com autorização imediata no respectivo grau (Grau 1 - Aprendiz, Grau 2 - Companheiro ou Grau 3 - Mestre), defina suas permissões de acesso, gere senhas provisórias e emita fichas oficiais de credenciamento.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {pendingUsers.length > 0 && (
            <div className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center space-x-2 animate-pulse">
              <Clock className="w-4 h-4" />
              <span>{pendingUsers.length} Aguardando Aprovação</span>
            </div>
          )}
        </div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL / CARD (AFTER REGISTRATION) */}
      {successResult && (
        <div className="bg-gradient-to-br from-[#121c17] via-[#0d1612] to-[#070e0b] border-2 border-emerald-500/60 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/30 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-masonic block">
                  Operação Concluída com Sucesso
                </span>
                <h3 className="text-xl font-bold font-masonic text-slate-100">
                  {creationMode === 'direct' ? 'Irmão Cadastrado e Acesso Liberado!' : 'Autorização de Cadastro Expedida!'}
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleResetForm}
                className="px-4 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40 text-xs font-bold transition-all flex items-center space-x-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Cadastrar Outro Irmão</span>
              </button>
            </div>
          </div>

          {/* Credentials Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] block">Nome do Irmão</span>
              <span className="font-bold text-slate-100 text-sm block truncate">
                {successResult.user?.fullName || fullName}
              </span>
              <span className="text-amber-400 text-[11px] block font-mono">
                CIM: {successResult.user?.cimNumber || cimNumber}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] block">Grau Autorizado</span>
              <span className="font-bold text-emerald-400 text-sm block">
                {successResult.degreeName}
              </span>
              <span className="text-slate-400 text-[11px] block">
                Loja: {successResult.user?.lodge || lodge}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] block">E-mail de Acesso (Login)</span>
              <span className="font-bold text-slate-100 text-sm block truncate font-mono">
                {successResult.user?.email || email}
              </span>
              <button
                onClick={() => handleCopyText(successResult.user?.email || email, 'email-res')}
                className="text-[11px] text-amber-400 hover:underline flex items-center space-x-1 mt-1"
              >
                {copiedField === 'email-res' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedField === 'email-res' ? 'Copiado!' : 'Copiar E-mail'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] block">Senha Provisória</span>
              <span className="font-bold text-amber-300 text-sm block font-mono">
                {successResult.generatedPassword || temporaryPassword}
              </span>
              <button
                onClick={() => handleCopyText(successResult.generatedPassword || temporaryPassword, 'pass-res')}
                className="text-[11px] text-amber-400 hover:underline flex items-center space-x-1 mt-1"
              >
                {copiedField === 'pass-res' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedField === 'pass-res' ? 'Copiada!' : 'Copiar Senha'}</span>
              </button>
            </div>
          </div>

          {/* Quick WhatsApp / Message Copy Box */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>Ficha de Acesso Pronta para Envio ao Irmão (WhatsApp / E-mail)</span>
              </span>

              <button
                onClick={() => handleCopyText(generateWhatsAppMessage(), 'whatsapp-msg')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center space-x-2"
              >
                {copiedField === 'whatsapp-msg' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Ficha Copiada com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Ficha Completa</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
              {generateWhatsAppMessage()}
            </pre>
          </div>
        </div>
      )}

      {/* MAIN REGISTRATION FORM */}
      <div className="bg-[#0c0f17] border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold font-masonic text-amber-200">
              Formulário de Cadastro & Atribuição de Grau
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Preencha os dados maçônicos e selecione o grau de entrada para liberação imediata.
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setCreationMode('direct')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                creationMode === 'direct'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cadastro Direto (Ativo)</span>
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('token')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                creationMode === 'token'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Gerar Código de Autorização</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: DADOS PESSOAIS E MAÇÔNICOS */}
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-masonic flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>1. Identificação do Irmão & Dados da Loja</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nome Completo (Civil) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Ir.'. Marcos Vinicius da Silva"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nome Maçônico / Simbólico (Opcional)
                </label>
                <input
                  type="text"
                  value={masonicName}
                  onChange={(e) => setMasonicName(e.target.value)}
                  placeholder="Ex: Salomão, Hermes, Acácia..."
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  E-mail de Login * <span className="text-amber-400 font-mono text-[10px]">🔒 [TRAVA 1]</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="irmao@exemplo.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  WhatsApp / Celular
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  CIM / Matrícula Maçônica * <span className="text-amber-400 font-mono text-[10px]">🔒 [TRAVA 2]</span>
                </label>
                <div className="relative">
                  <FileCheck className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={cimNumber}
                    onChange={(e) => setCimNumber(e.target.value)}
                    placeholder="Ex: CIM-849201"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-amber-200 font-mono placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Idade do Irmão (Anos) * <span className="text-amber-400 font-mono text-[10px]">🔒 [TRAVA 3]</span>
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
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-amber-200 font-mono placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  A∴R∴L∴S∴ (Loja Maçônica) *
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={lodge}
                    onChange={(e) => setLodge(e.target.value)}
                    placeholder="Ex: ARLS Luz do Oriente nº 123"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block font-semibold text-slate-300 mb-1">
                  Potência / Grande Loja
                </label>
                <select
                  value={grandLodge}
                  onChange={(e) => setGrandLodge(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-400"
                >
                  <option value="Grande oriente Maçonico Universal GOMAU">Grande oriente Maçonico Universal GOMAU</option>
                  <option value="Grande Loja do Estado de São Paulo (GLESP)">GLESP (CMSB)</option>
                  <option value="Grande Loja Maçônica de Minas Gerais (GLMEMG)">GLMEMG (CMSB)</option>
                  <option value="Grande Loja Maçônica do Rio de Janeiro (GLMERJ)">GLMERJ (CMSB)</option>
                  <option value="Grande Oriente do Brasil (GOB)">Grande Oriente do Brasil (GOB)</option>
                  <option value="COMAB - Confederação Maçônica do Brasil">COMAB</option>
                  <option value="Outra Potência Maçônica Regular">Outra Potência Maçônica Regular</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: SELEÇÃO DO GRAU AUTORIZADO (VISUAL INTERACTIVE CARDS) */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-masonic flex items-center space-x-2">
                <Award className="w-4 h-4" />
                <span>2. Selecione o Grau Maçônico Autorizado</span>
              </span>
              <span className="text-[11px] text-slate-400">
                O grau selecionado definirá as instruções e avaliações que o Irmão poderá acessar.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Grau 1 Card */}
              <div
                onClick={() => setSelectedDegree(1)}
                className={`rounded-2xl p-5 border-2 cursor-pointer transition-all space-y-3 relative overflow-hidden ${
                  selectedDegree === 1
                    ? 'bg-gradient-to-b from-[#1f1910] to-[#120e09] border-amber-400 shadow-xl scale-[1.02]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs font-masonic border border-amber-500/40">
                    GRAU 01
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedDegree === 1 ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-600'
                    }`}
                  >
                    {selectedDegree === 1 && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-base font-masonic text-slate-100">
                    Aprendiz Maçom
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Instruções sobre a Pedra Bruta, simbologia do Painel da Loja, Livro da Lei, ferramentas e deveres do Aprendiz.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <div className="text-[11px] text-amber-300/90 font-medium">✓ 3 Instruções Litúrgicas</div>
                  <div className="text-[11px] text-amber-300/90 font-medium">✓ 30 Questões Avaliativas</div>
                  <div className="text-[11px] text-amber-300/90 font-medium">✓ Submissão de Pranchas</div>
                </div>
              </div>

              {/* Grau 2 Card */}
              <div
                onClick={() => setSelectedDegree(2)}
                className={`rounded-2xl p-5 border-2 cursor-pointer transition-all space-y-3 relative overflow-hidden ${
                  selectedDegree === 2
                    ? 'bg-gradient-to-b from-[#101726] to-[#0a0e19] border-blue-400 shadow-xl scale-[1.02]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-bold text-xs font-masonic border border-blue-500/40">
                    GRAU 02
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedDegree === 2 ? 'border-blue-400 bg-blue-400 text-slate-950' : 'border-slate-600'
                    }`}
                  >
                    {selectedDegree === 2 && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-base font-masonic text-slate-100">
                    Companheiro Maçom
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Acesso direto liberado aos Graus 1 e 2. Estudo da Pedra Cúbica, Geometria Sagrada, 5 Sentidos e Artes Liberais.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <div className="text-[11px] text-blue-300/90 font-medium">✓ Graus 1 e 2 Desbloqueados</div>
                  <div className="text-[11px] text-blue-300/90 font-medium">✓ 6 Instruções Curriculares</div>
                  <div className="text-[11px] text-blue-300/90 font-medium">✓ 60 Questões Avaliativas</div>
                </div>
              </div>

              {/* Grau 3 Card */}
              <div
                onClick={() => setSelectedDegree(3)}
                className={`rounded-2xl p-5 border-2 cursor-pointer transition-all space-y-3 relative overflow-hidden ${
                  selectedDegree === 3
                    ? 'bg-gradient-to-b from-[#1c1226] to-[#110a19] border-purple-400 shadow-xl scale-[1.02]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs font-masonic border border-purple-500/40">
                    GRAU 03
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedDegree === 3 ? 'border-purple-400 bg-purple-400 text-slate-950' : 'border-slate-600'
                    }`}
                  >
                    {selectedDegree === 3 && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-base font-masonic text-slate-100">
                    Mestre Maçom
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Plenitude Maçônica. Acesso irrestrito a todos os Graus (1, 2 e 3), Câmara do Meio, Lenda de Hiram e todas as 9 instruções.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <div className="text-[11px] text-purple-300/90 font-medium">✓ Todos os Graus (1, 2 e 3)</div>
                  <div className="text-[11px] text-purple-300/90 font-medium">✓ Todas as 9 Instruções & 90 Qs</div>
                  <div className="text-[11px] text-purple-300/90 font-medium">✓ Câmara do Meio & Plenitude</div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: FUNÇÃO E PERMISSÕES NO SISTEMA */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-masonic flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>3. Perfil de Acesso & Permissões Administrativas</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div
                onClick={() => setSelectedRole('brother')}
                className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                  selectedRole === 'brother'
                    ? 'bg-amber-500/15 border-amber-400 text-slate-100'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-sm text-slate-200">Irmão (Aluno / Estudante)</div>
                <p className="text-[11px] text-slate-400">
                  Acesso aos estudos, questionários, peças de arquitetura e certificados do respectivo grau.
                </p>
              </div>

              <div
                onClick={() => setSelectedRole('instructor')}
                className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                  selectedRole === 'instructor'
                    ? 'bg-blue-500/15 border-blue-400 text-slate-100'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-sm text-slate-200">Instrutor (Corpo Docente)</div>
                <p className="text-[11px] text-slate-400">
                  Permissão para avaliar Pranchas de Arquitetura, responder dúvidas e orientar os trabalhos.
                </p>
              </div>

              <div
                onClick={() => setSelectedRole('admin')}
                className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                  selectedRole === 'admin'
                    ? 'bg-red-500/15 border-red-400 text-slate-100'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-sm text-slate-200">Administrador (Chanceler)</div>
                <p className="text-[11px] text-slate-400">
                  Acesso total ao painel administrativo, cadastro de membros, gestão de matriz e relatórios.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 4: SENHA PROVISÓRIA & CONFIGURAÇÕES */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-masonic flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>4. Credenciais & Observações da Chancelaria</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-300">
                    Senha Provisória de Acesso *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[11px] text-amber-400 hover:underline flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Gerar Nova Senha</span>
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={temporaryPassword}
                    onChange={(e) => setTemporaryPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Status Inicial da Conta
                </label>
                <select
                  value={initialStatus}
                  onChange={(e) => setInitialStatus(e.target.value as UserStatus)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-400"
                >
                  <option value="approved">✓ Aprovado Imediatamente (Acesso Total)</option>
                  <option value="pending">⏳ Pendente de Validação Documental</option>
                  <option value="blocked">✕ Bloqueado</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">
                  Observações da Chancelaria (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Iniciado em 10/02/2026. Autorização emitida pelo Venerável Mestre para estudos do Grau..."
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-amber-400 resize-none text-xs"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="sendNotif"
                checked={sendWelcomeNotification}
                onChange={(e) => setSendWelcomeNotification(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400"
              />
              <label htmlFor="sendNotif" className="text-xs text-slate-300 cursor-pointer">
                Enviar notificação interna oficial de boas-vindas e liberação de grau
              </label>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleResetForm}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Limpar Campos
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black font-masonic text-xs tracking-wider uppercase shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {creationMode === 'direct'
                  ? `🏛️ Cadastrar e Liberar no Grau 0${selectedDegree}`
                  : `🎫 Gerar Autorização para Grau 0${selectedDegree}`}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* QUICK APPROVAL QUEUE (PENDING BROTHERS WAITING FOR DEGREE AUTHORIZATION) */}
      {pendingUsers.length > 0 && (
        <div className="bg-[#0e121a] border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="text-base font-bold font-masonic text-amber-200">
                Homologação Rápida: Irmãos Aguardando Liberação de Grau ({pendingUsers.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Selecione o Grau e aprove diretamente
            </span>
          </div>

          <div className="space-y-3">
            {pendingUsers.map((u) => {
              const currentDegChoice = pendingDegreeSelections[u.id] || u.degree || 1;
              const currentRoleChoice = pendingRoleSelections[u.id] || u.role || 'brother';

              return (
                <div
                  key={u.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-200">{u.fullName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                        CIM: {u.cimNumber}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {u.email} • {u.lodge} • {u.grandLodge}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Cadastrado em: {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center space-x-1.5 text-xs">
                      <span className="text-slate-400">Grau:</span>
                      <select
                        value={currentDegChoice}
                        onChange={(e) =>
                          setPendingDegreeSelections((prev) => ({
                            ...prev,
                            [u.id]: Number(e.target.value),
                          }))
                        }
                        className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-amber-300 font-bold text-xs focus:border-amber-400"
                      >
                        <option value={1}>Grau 01 (Aprendiz)</option>
                        <option value={2}>Grau 02 (Companheiro)</option>
                        <option value={3}>Grau 03 (Mestre)</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-1.5 text-xs">
                      <span className="text-slate-400">Função:</span>
                      <select
                        value={currentRoleChoice}
                        onChange={(e) =>
                          setPendingRoleSelections((prev) => ({
                            ...prev,
                            [u.id]: e.target.value as UserRole,
                          }))
                        }
                        className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:border-amber-400"
                      >
                        <option value="brother">Irmão</option>
                        <option value="instructor">Instrutor</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleApprovePendingUser(u)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow transition-all flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Liberar Acesso no Grau 0{currentDegChoice}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 5: HISTÓRICO DE AUTORIZAÇÕES EXPEDIDAS */}
      <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold font-masonic text-slate-100 flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Autorizações Emitidas pela Chancelaria ({authorizationsList.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Registro histórico de todos os códigos de ingresso e convites concedidos por grau.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar autorização..."
                value={authSearch}
                onChange={(e) => setAuthSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
              />
            </div>

            <select
              value={authDegreeFilter}
              onChange={(e) => setAuthDegreeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-400"
            >
              <option value="all">Todos os Graus</option>
              <option value={1}>Grau 01 (Aprendiz)</option>
              <option value={2}>Grau 02 (Companheiro)</option>
              <option value={3}>Grau 03 (Mestre)</option>
            </select>

            <select
              value={authStatusFilter}
              onChange={(e) => setAuthStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-400"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">⏳ Pendente de Uso</option>
              <option value="used">✓ Utilizado / Ativo</option>
              <option value="revoked">✕ Revogado</option>
            </select>
          </div>
        </div>

        {filteredAuthorizations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Nenhuma autorização localizada com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Código / Token</th>
                  <th className="py-3 px-4">Irmão Autorizado</th>
                  <th className="py-3 px-4">Loja & CIM</th>
                  <th className="py-3 px-4">Grau Concedido</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Emitido por</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAuthorizations.map((auth) => (
                  <tr key={auth.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 block w-fit">
                        {auth.tokenCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-200">{auth.fullName}</div>
                      <div className="text-[11px] text-slate-400">{auth.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-300 font-medium">{auth.lodge}</div>
                      <div className="text-[10px] text-amber-400/80 font-mono">CIM: {auth.cimNumber}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          auth.authorizedDegree === 1
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : auth.authorizedDegree === 2
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        }`}
                      >
                        Grau 0{auth.authorizedDegree} • {auth.authorizedDegree === 1 ? 'Aprendiz' : auth.authorizedDegree === 2 ? 'Companheiro' : 'Mestre'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {auth.status === 'used' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 flex items-center w-fit space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Cadastrado / Ativo</span>
                        </span>
                      )}
                      {auth.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40 flex items-center w-fit space-x-1 animate-pulse">
                          <Clock className="w-3 h-3" />
                          <span>Pendente de Registro</span>
                        </span>
                      )}
                      {auth.status === 'revoked' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-500/40 flex items-center w-fit space-x-1">
                          <XCircle className="w-3 h-3" />
                          <span>Revogado</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-400">
                      <div>{auth.createdByName}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(auth.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleCopyText(auth.tokenCode, `tok-${auth.id}`)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors"
                          title="Copiar Código de Autorização"
                        >
                          {copiedField === `tok-${auth.id}` ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {auth.status === 'pending' && (
                          <button
                            onClick={() => handleRevokeAuth(auth.id)}
                            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition-colors"
                            title="Revogar Autorização"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
