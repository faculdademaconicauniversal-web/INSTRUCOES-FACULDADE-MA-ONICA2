import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Shield,
  Award,
  Edit2,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  AlertCircle,
  Building,
  TrendingUp,
  Clock,
  Sparkles,
  MessageSquare,
  FileCheck,
  ArrowRight,
  Send,
  UserPlus,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { UserProfile, UserRole, UserStatus, SalaryIncreaseRequest, SalaryRequestStatus } from '../../types';
import { NewUserRegistrationView } from './NewUserRegistrationView';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface UserManagementViewProps {
  initialTab?: 'register-new' | 'users' | 'salary-requests';
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ initialTab = 'users' }) => {
  const { userProfile: currentAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'register-new' | 'users' | 'salary-requests'>(initialTab);

  // Sync tab if prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [users, setUsers] = useState<UserProfile[]>(() => dataStore.getUsers());
  const [salaryRequests, setSalaryRequests] = useState<SalaryIncreaseRequest[]>(() =>
    dataStore.getSalaryRequests()
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [degreeFilter, setDegreeFilter] = useState<'all' | number>('all');

  // Salary Requests Filter
  const [salaryStatusFilter, setSalaryStatusFilter] = useState<'all' | SalaryRequestStatus>('all');

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDegree, setEditDegree] = useState<number>(1);
  const [editRole, setEditRole] = useState<UserRole>('brother');
  const [editStatus, setEditStatus] = useState<UserStatus>('approved');
  const [editLodge, setEditLodge] = useState('');
  const [editCim, setEditCim] = useState('');
  const [editAge, setEditAge] = useState<number | ''>('');

  // Review Salary Request Modal State
  const [reviewingSalaryReq, setReviewingSalaryReq] = useState<SalaryIncreaseRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const [adminNotes, setAdminNotes] = useState('');

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const refreshData = () => {
    setUsers(dataStore.getUsers());
    setSalaryRequests(dataStore.getSalaryRequests());
  };

  const handleApproveUser = (userId: string, userName: string) => {
    dataStore.updateUser(
      userId,
      { status: 'approved' },
      currentAdmin?.fullName || 'Administrador'
    );
    // Sync with Firestore document
    updateDoc(doc(db, 'users', userId), { status: 'approved' }).catch((err) =>
      console.warn('Firestore user status sync:', err)
    );
    dataStore.addNotification({
      userId,
      title: 'Cadastro Aprovado!',
      message: 'Seu cadastro foi homologado pela administração. Bem-vindo à Faculdade Maçônica!',
      type: 'approval',
      isRead: false,
    });
    setFeedbackMsg(`Irmão ${userName} aprovado com sucesso!`);
    setTimeout(() => setFeedbackMsg(null), 3000);
    refreshData();
  };

  const handleBlockUser = (userId: string, userName: string) => {
    dataStore.updateUser(
      userId,
      { status: 'blocked' },
      currentAdmin?.fullName || 'Administrador'
    );
    // Sync with Firestore document
    updateDoc(doc(db, 'users', userId), { status: 'blocked' }).catch((err) =>
      console.warn('Firestore user status sync:', err)
    );
    setFeedbackMsg(`Acesso do Ir. ${userName} foi bloqueado.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
    refreshData();
  };

  const handleUnblockUser = (userId: string, userName: string) => {
    dataStore.updateUser(
      userId,
      { status: 'approved' },
      currentAdmin?.fullName || 'Administrador'
    );
    // Sync with Firestore document
    updateDoc(doc(db, 'users', userId), { status: 'approved' }).catch((err) =>
      console.warn('Firestore user status sync:', err)
    );
    setFeedbackMsg(`Acesso do Ir. ${userName} foi reativado.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
    refreshData();
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditEmail(user.email);
    setEditDegree(user.degree);
    setEditRole(user.role);
    setEditStatus(user.status);
    setEditLodge(user.lodge);
    setEditCim(user.cimNumber);
    setEditAge(user.age || '');
  };

  const handleSaveUserEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    dataStore.updateUser(
      editingUser.id,
      {
        fullName: editFullName.trim(),
        email: editEmail.toLowerCase().trim(),
        degree: editDegree,
        role: editRole,
        status: editStatus,
        lodge: editLodge.trim(),
        cimNumber: editCim.trim(),
        age: editAge ? Number(editAge) : undefined,
      },
      currentAdmin?.fullName || 'Administrador'
    );

    // Sync with Firestore document
    updateDoc(doc(db, 'users', editingUser.id), {
      fullName: editFullName.trim(),
      email: editEmail.toLowerCase().trim(),
      degree: editDegree,
      role: editRole,
      status: editStatus,
      lodge: editLodge.trim(),
      cimNumber: editCim.trim(),
      age: editAge ? Number(editAge) : null,
      updatedAt: new Date().toISOString(),
    }).catch((err) => console.warn('Firestore user edits sync:', err));

    setFeedbackMsg(`Travas e dados do Ir. ${editFullName} atualizados com sucesso.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
    setEditingUser(null);
    refreshData();
  };

  // Salary Request Reviews
  const handleOpenSalaryReview = (req: SalaryIncreaseRequest, action: 'approved' | 'rejected') => {
    setReviewingSalaryReq(req);
    setReviewAction(action);
    setAdminNotes(
      action === 'approved'
        ? 'Aprovado pelo Conselho de Mestres. O Aprendiz demonstrou pleno domínio dos questionários e instruções do Grau 1.'
        : 'Necessário aprofundamento nos estudos e pranchas antes da elevação.'
    );
  };

  const handleConfirmSalaryReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSalaryReq) return;

    dataStore.reviewSalaryRequest({
      requestId: reviewingSalaryReq.id,
      status: reviewAction,
      adminNotes,
      adminName: currentAdmin?.fullName || 'Chancelaria Geral',
      adminId: currentAdmin?.id || 'admin',
      autoPromoteDegree: reviewAction === 'approved',
    });

    setFeedbackMsg(
      reviewAction === 'approved'
        ? `Aumento de Salário de ${reviewingSalaryReq.userName} APROVADO! O Irmão foi elevado ao Grau 0${reviewingSalaryReq.targetDegree}.`
        : `Pedido de ${reviewingSalaryReq.userName} devolvido com observações.`
    );
    setTimeout(() => setFeedbackMsg(null), 4000);
    setReviewingSalaryReq(null);
    refreshData();
  };

  const pendingSalaryCount = salaryRequests.filter((r) => r.status === 'pending').length;
  const pendingUsersCount = users.filter((u) => u.status === 'pending').length;

  const filteredUsers = users.filter((u) => {
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (degreeFilter !== 'all' && u.degree !== degreeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.fullName.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchLodge = u.lodge.toLowerCase().includes(q);
      const matchCim = u.cimNumber.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchLodge && !matchCim) return false;
    }

    return true;
  });

  const filteredSalaryRequests = salaryRequests.filter((r) => {
    if (salaryStatusFilter !== 'all' && r.status !== salaryStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.userName.toLowerCase().includes(q);
      const matchLodge = r.userLodge.toLowerCase().includes(q);
      const matchCim = r.userCim.toLowerCase().includes(q);
      if (!matchName && !matchLodge && !matchCim) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b1418] via-[#141018] to-black border border-red-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-red-400 text-xs font-bold uppercase tracking-wider font-masonic mb-1">
            <Users className="w-4 h-4" />
            <span>Chancelaria & Membros</span>
          </div>
          <h1 className="text-2xl font-bold font-masonic text-slate-100">
            Gestão de Irmãos & Aumento de Salário
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Aprovação de novos cadastros, deliberação de Pedidos de Aumento de Salário (Elevações de Grau) e controle do quadro de obreiros.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-open-register-sheet"
            onClick={() => setActiveTab('register-new')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black font-masonic text-xs shadow-lg hover:scale-105 transition-all flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>➕ Cadastrar Novo Irmão (Abrir Ficha)</span>
          </button>

          <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Cadastros Pendentes</span>
            <span className="text-xl font-bold font-masonic text-amber-400">
              {pendingUsersCount}
            </span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <span className="text-[10px] text-amber-300 uppercase block font-semibold">Pedidos de Salário</span>
            <span className="text-xl font-bold font-masonic text-amber-400">
              {pendingSalaryCount}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('register-new')}
          className={`px-4 py-2.5 rounded-xl font-masonic text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'register-new'
              ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 shadow-lg scale-[1.02]'
              : 'bg-amber-950/30 text-amber-300 hover:text-white hover:bg-amber-900/50 border border-amber-500/40'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>➕ Cadastro de Novo Usuário (Acessos & Permissões)</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl font-masonic text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'users'
              ? 'bg-red-600 text-white shadow-lg'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Quadro de Irmãos ({users.length})</span>
          {pendingUsersCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
              {pendingUsersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('salary-requests')}
          className={`px-4 py-2.5 rounded-xl font-masonic text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'salary-requests'
              ? 'bg-amber-600 text-slate-950 shadow-lg'
              : 'bg-slate-900/80 text-slate-400 hover:text-amber-300 border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Pedidos de Aumento de Salário</span>
          {pendingSalaryCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black animate-pulse">
              {pendingSalaryCount} novo{pendingSalaryCount > 1 ? 's' : ''}
            </span>
          )}
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* TAB 0: CADASTRO DE NOVO USUÁRIO & LIBERAÇÃO DE ACESSOS */}
      {activeTab === 'register-new' && (
        <NewUserRegistrationView
          onUserRegistered={(newUser) => {
            refreshData();
            setFeedbackMsg(`Irmão ${newUser.fullName} cadastrado com sucesso no Grau 0${newUser.degree}!`);
          }}
          onNavigateTab={(tab) => setActiveTab(tab as any)}
        />
      )}

      {/* TAB 1: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-4 shadow-lg flex flex-col lg:flex-row gap-3 items-center justify-between">
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail, CIM ou Loja..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">⏳ Pendentes de Aprovação</option>
                <option value="approved">✓ Aprovados</option>
                <option value="blocked">✕ Bloqueados</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="all">Todas as Funções</option>
                <option value="admin">Administrador</option>
                <option value="instructor">Instrutor</option>
                <option value="brother">Irmão</option>
              </select>

              <select
                value={degreeFilter}
                onChange={(e) => setDegreeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="all">Todos os Graus</option>
                <option value={1}>Grau 01 (Aprendiz)</option>
                <option value={2}>Grau 02 (Companheiro)</option>
                <option value={3}>Grau 03 (Mestre)</option>
              </select>

              <button
                type="button"
                onClick={() => setActiveTab('register-new')}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow transition-all flex items-center space-x-1.5 shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>➕ Novo Irmão</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Irmão / Cadastro</th>
                    <th className="py-3 px-4">Loja & Potência</th>
                    <th className="py-3 px-4">Grau Atual</th>
                    <th className="py-3 px-4">Função</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-200">{u.fullName}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                        <div className="text-[10px] font-mono text-amber-400/80 mt-0.5 flex items-center space-x-1">
                          <span>CIM: {u.cimNumber}</span>
                          <span>•</span>
                          <span className="text-slate-400">{u.age ? `${u.age} anos` : 'Idade pendente'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-medium">{u.lodge}</div>
                        <div className="text-[11px] text-slate-400">{u.grandLodge}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          Grau 0{u.degree}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize text-slate-300">
                          {u.role === 'admin' ? 'Administrador' : u.role === 'instructor' ? 'Instrutor' : 'Irmão'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.status === 'approved' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 flex items-center w-fit space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Aprovado</span>
                          </span>
                        )}
                        {u.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40 flex items-center w-fit space-x-1 animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            <span>Pendente</span>
                          </span>
                        )}
                        {u.status === 'blocked' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-500/40 flex items-center w-fit space-x-1">
                            <XCircle className="w-3 h-3" />
                            <span>Bloqueado</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {u.status === 'pending' && (
                            <button
                              onClick={() => handleApproveUser(u.id, u.fullName)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow transition-colors"
                            >
                              Homologar
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Editar Perfil e Grau"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {u.status === 'approved' ? (
                            <button
                              onClick={() => handleBlockUser(u.id, u.fullName)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition-colors"
                              title="Suspender Acesso"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          ) : u.status === 'blocked' ? (
                            <button
                              onClick={() => handleUnblockUser(u.id, u.fullName)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-900/50 text-slate-400 hover:text-emerald-300 transition-colors"
                              title="Reativar Acesso"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALARY INCREASE REQUESTS */}
      {activeTab === 'salary-requests' && (
        <div className="space-y-4">
          <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por aprendiz, CIM ou Loja..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={salaryStatusFilter}
                onChange={(e) => setSalaryStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="all">Todos os Pedidos</option>
                <option value="pending">⏳ Aguardando Chancelaria</option>
                <option value="approved">✓ Homologados / Aprovados</option>
                <option value="rejected">✕ Devolvidos com Parecer</option>
              </select>
            </div>
          </div>

          {filteredSalaryRequests.length === 0 ? (
            <div className="bg-[#0e121a] border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <TrendingUp className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold font-masonic text-slate-300">
                Nenhum Pedido de Aumento de Salário Localizado
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Assim que um Irmão Aprendiz concluir todos os questionários avaliativos de todas as instruções do grau, ele poderá protocolar sua solicitação aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSalaryRequests.map((req) => (
                <div
                  key={req.id}
                  className={`rounded-2xl border p-5 space-y-4 shadow-xl transition-all ${
                    req.status === 'pending'
                      ? 'bg-gradient-to-b from-[#141926] to-[#0d1119] border-amber-500/50'
                      : req.status === 'approved'
                      ? 'bg-[#0f141d] border-emerald-500/30'
                      : 'bg-[#120f14] border-rose-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm font-masonic text-slate-100">
                          {req.userName}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 rounded text-amber-400">
                          CIM: {req.userCim}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {req.userLodge} • {req.userGrandLodge}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        req.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : req.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                      }`}
                    >
                      {req.status === 'approved'
                        ? 'Aprovado'
                        : req.status === 'rejected'
                        ? 'Devolvido'
                        : 'Pendente de Deliberação'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Questionários</span>
                      <span className="font-bold text-emerald-400">
                        {req.quizzesCompletedCount}/{req.totalQuizzesCount} (100%)
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Média Geral</span>
                      <span className="font-bold text-amber-300">{req.averageQuizScore}/100</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Grau Solicitado</span>
                      <span className="font-bold text-slate-100">Grau 0{req.targetDegree}</span>
                    </div>
                  </div>

                  {req.justificationText && (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                        Petição do Aprendiz:
                      </span>
                      <p className="text-slate-300 italic text-[11px]">"{req.justificationText}"</p>
                    </div>
                  )}

                  {req.adminNotes && (
                    <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200">
                      <span className="text-[10px] font-bold text-amber-400 uppercase block mb-0.5">
                        Parecer ({req.reviewedByName}):
                      </span>
                      <p className="text-[11px]">{req.adminNotes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span>Protocolado em: {new Date(req.createdAt).toLocaleDateString('pt-BR')}</span>

                    {req.status === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenSalaryReview(req, 'rejected')}
                          className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-all"
                        >
                          Devolver
                        </button>
                        <button
                          onClick={() => handleOpenSalaryReview(req, 'approved')}
                          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Homologar Aumento</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f131d] border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-masonic text-slate-100 border-b border-slate-800 pb-3">
              Editar Cadastro: {editingUser.fullName}
            </h3>

            <form onSubmit={handleSaveUserEdits} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    E-mail Maçônico <span className="text-amber-400 font-mono text-[10px]">🔒 [TRAVA 1]</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Grau Maçônico Atual
                </label>
                <select
                  value={editDegree}
                  onChange={(e) => setEditDegree(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-400"
                >
                  <option value={1}>Grau 01 - Aprendiz Maçom</option>
                  <option value={2}>Grau 02 - Companheiro Maçom</option>
                  <option value={3}>Grau 03 - Mestre Maçom</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Função no Sistema</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-400"
                >
                  <option value="brother">Irmão (Aluno / Estudante)</option>
                  <option value="instructor">Instrutor Maçônico (Corpo Docente)</option>
                  <option value="admin">Administrador Geral</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Status da Conta
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-400"
                >
                  <option value="approved">Aprovado (Acesso Liberado)</option>
                  <option value="pending">Pendente de Análise</option>
                  <option value="blocked">Bloqueado (Acesso Suspenso)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Loja</label>
                  <input
                    type="text"
                    value={editLodge}
                    onChange={(e) => setEditLodge(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    CIM / Matrícula <span className="text-amber-400 font-mono text-[10px]">🔒 [TRAVA]</span>
                  </label>
                  <input
                    type="text"
                    value={editCim}
                    onChange={(e) => setEditCim(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-amber-200 font-mono focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Idade (Anos) <span className="text-amber-400 font-mono text-[10px]">🔒 [TRAVA]</span>
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={120}
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-amber-200 font-mono focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  Salvar Modificações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW SALARY REQUEST MODAL */}
      {reviewingSalaryReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f131d] border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold font-masonic text-slate-100">
                {reviewAction === 'approved'
                  ? 'Homologar Aumento de Salário'
                  : 'Devolver Pedido com Parecer'}
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Irmão Solicitante:</span>
                <span className="font-bold text-slate-200">{reviewingSalaryReq.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Elevação de Grau:</span>
                <span className="font-bold text-amber-300">
                  Grau 0{reviewingSalaryReq.currentDegree} ➔ Grau 0{reviewingSalaryReq.targetDegree} ({reviewingSalaryReq.targetDegree === 2 ? 'Companheiro Maçom' : 'Mestre Maçom'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Média Geral nos Questionários:</span>
                <span className="font-bold text-emerald-400">{reviewingSalaryReq.averageQuizScore}/100</span>
              </div>
            </div>

            <form onSubmit={handleConfirmSalaryReview} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Parecer da Chancelaria / Mensagem para o Irmão:
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:border-amber-400 resize-none"
                  placeholder="Insira as observações solenes ou justificativa..."
                />
              </div>

              {reviewAction === 'approved' && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    A aprovação atualizará automaticamente o grau do Irmão para Grau 0{reviewingSalaryReq.targetDegree} e enviará a notificação oficial.
                  </span>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewingSalaryReq(null)}
                  className="px-4 py-2 font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl font-bold font-masonic text-xs shadow-lg transition-all ${
                    reviewAction === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  {reviewAction === 'approved' ? '✓ Confirmar Elevação' : 'Devolver com Parecer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
