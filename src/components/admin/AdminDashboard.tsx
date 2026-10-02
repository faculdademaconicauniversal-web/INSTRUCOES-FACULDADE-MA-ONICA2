import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  HelpCircle,
  FileCheck,
  Award,
  Bell,
  TrendingUp,
  Shield,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  PenTool,
  Database,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { publishAllDataToFirestore } from '../../lib/firestoreSync';

interface AdminDashboardProps {
  onNavigate: (view: string, payload?: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { userProfile, isAdmin } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!userProfile) return null;

  const users = dataStore.getUsers();
  const degrees = dataStore.getDegrees();
  const lessons = dataStore.getLessons(99, true);
  const submissions = dataStore.getAllSubmissions();
  const quizAttempts = dataStore.getAllQuizAttempts();
  const certificates = dataStore.getAllCertificates();
  const logs = dataStore.getAuditLogs();
  const salaryRequests = dataStore.getSalaryRequests();

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const pendingSubmissions = submissions.filter((s) => s.status === 'enviada' || s.status === 'em_analise');
  const pendingDiscursives = quizAttempts.filter((a) => a.hasPendingManualGrading);
  const pendingSalaryRequests = salaryRequests.filter((r) => r.status === 'pending');

  const handleSyncDatabase = async () => {
    setSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await publishAllDataToFirestore();
      setSyncFeedback(res.message);
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch (e: any) {
      setSyncFeedback(`Erro ao sincronizar: ${e?.message || 'Falha na conexão com o Firestore'}`);
      setTimeout(() => setSyncFeedback(null), 6000);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b1418] via-[#141018] to-black border border-red-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-red-400 text-xs font-bold uppercase tracking-wider font-masonic mb-1">
            <Shield className="w-4 h-4" />
            <span>Chancelaria & Coordenação Pedagógica</span>
          </div>
          <h1 className="text-2xl font-bold font-masonic text-slate-100">
            Painel Geral de Administração & Docência
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Supervisão centralizada de aprovações de novos irmãos, gestão da matriz curricular de instruções por graus, correção de pranchas e relatórios estatísticos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleSyncDatabase}
            disabled={syncing}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
            title="Atualizar e sincronizar todas as informações com o banco de dados Cloud Firestore"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Sincronizando Cloud...' : '☁️ Atualizar Banco de Dados'}</span>
          </button>

          <button
            onClick={() => onNavigate('admin-new-user')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center space-x-2"
          >
            <Shield className="w-4 h-4" />
            <span>➕ Cadastrar Novo Irmão</span>
          </button>

          <button
            onClick={() => onNavigate('admin-users')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs shadow-lg transition-all flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>Quadro de Irmãos ({pendingUsers.length} pendentes)</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-4 rounded-2xl bg-sky-950/80 border border-sky-500/50 text-sky-200 text-xs flex items-center space-x-3 shadow-lg">
          <CheckCircle className="w-5 h-5 text-sky-400 shrink-0" />
          <span className="font-medium">{syncFeedback}</span>
        </div>
      )}

      {/* Admin Full Completion Status Badge Banner */}
      <div className="bg-gradient-to-r from-[#121c18] via-[#0c1613] to-[#080f0d] border border-emerald-500/40 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-masonic">
                Perfil de Administrador • Integralização 100% Concluída
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px]">
                100% CONCLUÍDO
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold font-masonic text-slate-100 mt-0.5">
              {userProfile.fullName} — Todas as Tarefas, Instruções e Questionários Concluídos
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Todas as 9 instruções, 90 questões de questionários (com nota 100/100) e 9 Pranchas de Arquitetura dos Graus 1, 2 e 3 constam integralmente aprovadas no sistema.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('progress')}
            className="px-4 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 text-xs font-bold transition-all flex items-center space-x-1.5"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Ver Meu Progresso</span>
          </button>
          <button
            onClick={() => onNavigate('certificates')}
            className="px-4 py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/50 text-xs font-bold transition-all flex items-center space-x-1.5"
          >
            <Award className="w-4 h-4" />
            <span>Meus Certificados</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('admin-users')}
          className="masonic-card hover:masonic-card-highlight rounded-2xl p-5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Irmãos Cadastrados</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-masonic text-slate-100">
              {users.length}
            </span>
            {pendingUsers.length > 0 && (
              <span className="text-xs text-amber-400 font-semibold">
                ({pendingUsers.length} p/ aprovação)
              </span>
            )}
          </div>
        </div>

        <div
          onClick={() => onNavigate('admin-submissions')}
          className="masonic-card hover:masonic-card-highlight rounded-2xl p-5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Pranchas Enviadas</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-masonic text-slate-100">
              {submissions.length}
            </span>
            {pendingSubmissions.length > 0 && (
              <span className="text-xs text-blue-400 font-semibold">
                ({pendingSubmissions.length} aguardando)
              </span>
            )}
          </div>
        </div>

        <div
          onClick={() => onNavigate('admin-lessons')}
          className="masonic-card hover:masonic-card-highlight rounded-2xl p-5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Instruções Ativas</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-masonic text-slate-100">
              {lessons.length}
            </span>
            <span className="text-xs text-slate-400">em {degrees.length} graus</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('admin-certificates')}
          className="masonic-card hover:masonic-card-highlight rounded-2xl p-5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Certificados Emitidos</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-masonic text-slate-100">
              {certificates.length}
            </span>
            <span className="text-xs text-purple-400 font-semibold">oficiais</span>
          </div>
        </div>
      </div>

      {/* Pending Salary Increase Requests Alert Banner (if any) */}
      {pendingSalaryRequests.length > 0 && (
        <div className="bg-gradient-to-r from-[#1c1810] via-[#16130d] to-[#0c0a07] border border-amber-500/50 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              <TrendingUp className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-masonic">
                  Deliberação da Chancelaria
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                  {pendingSalaryRequests.length} Solene{pendingSalaryRequests.length > 1 ? 's' : ''}
                </span>
              </div>
              <h3 className="text-base font-bold font-masonic text-slate-100 mt-0.5">
                {pendingSalaryRequests.length} Irmão{pendingSalaryRequests.length > 1 ? 's' : ''} concluiu 100% dos questionários e solicitou Aumento de Salário
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Os Aprendizes completaram todas as avaliações com aproveitamento e aguardam homologação para elevação ao Grau 2 (Companheiro Maçom).
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('admin-users')}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black font-masonic text-xs tracking-wider uppercase shadow-xl transition-all shrink-0 flex items-center justify-center space-x-2"
          >
            <span>Analisar Pedidos de Salário</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Urgent Action Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-[#0e121a] border border-amber-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold font-masonic text-amber-200">
                Irmãos Aguardando Homologação de Cadastro ({pendingUsers.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('admin-users')}
              className="text-xs text-amber-400 hover:underline"
            >
              Ver todos
            </button>
          </div>

          {pendingUsers.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Nenhum cadastro pendente de aprovação no momento.
            </p>
          ) : (
            <div className="space-y-2.5">
              {pendingUsers.slice(0, 3).map((u) => (
                <div
                  key={u.id}
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-200">{u.fullName}</div>
                    <div className="text-[11px] text-slate-400">
                      {u.lodge} • {u.cimNumber} • Grau Solicitado: 0{u.degree}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('admin-users')}
                    className="px-3 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all"
                  >
                    Aprovar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Pranchas to Grade */}
        <div className="bg-[#0e121a] border border-amber-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold font-masonic text-amber-200">
                Pranchas de Trabalho para Avaliação ({pendingSubmissions.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('admin-submissions')}
              className="text-xs text-amber-400 hover:underline"
            >
              Ver fila
            </button>
          </div>

          {pendingSubmissions.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Nenhuma prancha pendente de correção.
            </p>
          ) : (
            <div className="space-y-2.5">
              {pendingSubmissions.slice(0, 3).map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-200 line-clamp-1">
                      {s.title}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Por {s.userName} • Grau 0{s.degreeNumber}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('admin-submissions')}
                    className="px-3 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all"
                  >
                    Avaliar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold font-masonic text-amber-200">
          Ações Rápidas de Gestão Pedagógica
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('admin-lessons')}
            className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30 text-center transition-all group"
          >
            <BookOpen className="w-5 h-5 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-200 block">Nova Instrução</span>
          </button>

          <button
            onClick={() => onNavigate('admin-quizzes')}
            className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30 text-center transition-all group"
          >
            <HelpCircle className="w-5 h-5 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-200 block">Questionários</span>
          </button>

          <button
            onClick={() => onNavigate('admin-degrees')}
            className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30 text-center transition-all group"
          >
            <Layers className="w-5 h-5 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-200 block">Configurar Graus</span>
          </button>

          <button
            onClick={() => onNavigate('admin-discursive')}
            className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30 text-center transition-all group"
          >
            <PenTool className="w-5 h-5 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-200 block">Discursivas</span>
          </button>

          <button
            onClick={() => onNavigate('admin-notifications')}
            className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30 text-center transition-all group"
          >
            <Bell className="w-5 h-5 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-200 block">Enviar Aviso</span>
          </button>

          <button
            onClick={() => onNavigate('admin-reports')}
            className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30 text-center transition-all group"
          >
            <TrendingUp className="w-5 h-5 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-200 block">Relatórios</span>
          </button>
        </div>
      </div>
    </div>
  );
};
