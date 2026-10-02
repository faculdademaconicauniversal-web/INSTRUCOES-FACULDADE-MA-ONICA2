import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MasonicNavbar } from './components/MasonicNavbar';
import { MasonicSidebar } from './components/MasonicSidebar';
import { AuthModal } from './components/auth/AuthModal';
import { StatusNotice } from './components/auth/StatusNotice';

// Brother Views
import { HomeDashboard } from './components/brother/HomeDashboard';
import { DegreesView } from './components/brother/DegreesView';
import { LessonsListView } from './components/brother/LessonsListView';
import { LessonDetailView } from './components/brother/LessonDetailView';
import { EvaluationsView } from './components/brother/EvaluationsView';
import { SubmissionsView } from './components/brother/SubmissionsView';
import { CertificatesView } from './components/brother/CertificatesView';
import { ProgressView } from './components/brother/ProgressView';
import { ProfileView } from './components/brother/ProfileView';
import { SalaryRequestView } from './components/brother/SalaryRequestView';

// Admin / Instructor Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UserManagementView } from './components/admin/UserManagementView';
import { DegreeConfigView } from './components/admin/DegreeConfigView';
import { LessonsManagerView } from './components/admin/LessonsManagerView';
import { QuizzesManagerView } from './components/admin/QuizzesManagerView';
import { SubmissionReviewView } from './components/admin/SubmissionReviewView';
import { DiscursiveGradingView } from './components/admin/DiscursiveGradingView';
import { NotificationsBroadcastView } from './components/admin/NotificationsBroadcastView';
import { ReportsView } from './components/admin/ReportsView';
import { SystemSettingsView } from './components/admin/SystemSettingsView';
import { AuditLogsView } from './components/admin/AuditLogsView';
import { DeliveredInstructionsView } from './components/admin/DeliveredInstructionsView';
import { SupportLibraryView } from './components/common/SupportLibraryView';

// Icons & UI
import {
  Compass,
  KeyRound,
  UserPlus,
  LogIn,
  AlertCircle,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { FACULDADE_SEAL_IMG } from './assets/logo';
import { loadAllDataFromFirestore } from './lib/firestoreSync';
import { dataStore } from './lib/dataStore';

const MainAppContent: React.FC = () => {
  const { userProfile, loading, logout, authError, clearAuthError } = useAuth();

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [navigationPayload, setNavigationPayload] = useState<any>(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setStoreRevision] = useState(0);

  useEffect(() => {
    // Subscribe to dataStore updates so all views immediately reflect cloud-loaded or uploaded data
    const unsubscribe = dataStore.subscribe(() => {
      setStoreRevision((prev) => prev + 1);
    });

    // Synchronize latest content from Firestore
    loadAllDataFromFirestore().catch(() => {});

    return () => unsubscribe();
  }, []);

  const handleNavigate = (view: string, payload?: any) => {
    // Normalize aliases
    const target = view === 'home' ? 'dashboard' : view;
    setCurrentView(target);
    setNavigationPayload(payload || null);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center text-center p-4">
        <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-600 shadow-2xl animate-pulse">
          <img
            src={FACULDADE_SEAL_IMG}
            alt="Faculdade Maçônica"
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
          />
        </div>
        <h2 className="mt-4 text-base font-bold font-masonic text-amber-200">
          Faculdade Maçônica Universal
        </h2>
        <p className="text-xs text-slate-500 mt-1">Carregando Templo de Estudos...</p>
      </div>
    );
  }

  // If not logged in -> Show Solene Landing / Portal
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
        {/* Solene Header */}
        <header className="border-b border-amber-500/20 bg-[#0c0f17]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-600 shadow-lg">
              <img
                src={FACULDADE_SEAL_IMG}
                alt="Brasão Oficial Faculdade Maçônica"
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-sm font-black font-masonic tracking-wider text-slate-100 uppercase block">
                Faculdade Maçônica
              </span>
              <span className="text-[10px] text-amber-400/90 font-masonic tracking-widest block">
                SISTEMA DE INSTRUÇÕES POR GRAUS
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setAuthModalMode('login')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center space-x-1.5"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>Entrar</span>
            </button>
            <button
              onClick={() => setAuthModalMode('register')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-lg transition-all flex items-center space-x-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Solicitar Novo Acesso</span>
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-6xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center text-center space-y-8">
          <div className="flex justify-center">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-600 shadow-2xl">
              <img
                src={FACULDADE_SEAL_IMG}
                alt="Brasão Oficial Faculdade Maçônica"
                className="w-full h-full object-cover rounded-full border border-amber-300/40"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-masonic mx-auto">
            <span>🏛️ À Glória do Grande Arquiteto do Universo</span>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-masonic text-slate-100 tracking-tight leading-tight">
              Aperfeiçoamento Filosófico e Doutrinário por <span className="gold-gradient-text">Graus Maçônicos</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Plataforma privativa e solene para formação contínua, peças de arquitetura, questionários avaliativos de 10 questões e certificações oficiais para irmãos regulares.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setAuthModalMode('login')}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black font-masonic text-sm shadow-xl hover:scale-105 transition-all flex items-center space-x-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Acessar o Templo de Estudos</span>
            </button>

            <button
              onClick={() => setAuthModalMode('register')}
              className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm shadow-lg transition-all flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Solicitar Novo Acesso</span>
            </button>
          </div>

          {authError && (
            <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start space-x-3 shadow-2xl animate-shake text-left">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-red-300 font-masonic uppercase tracking-wide">
                  Acesso Restrito a Membros Cadastrados
                </p>
                <p className="mt-1 leading-relaxed text-red-200/90">{authError}</p>
                <div className="mt-3 flex items-center space-x-3">
                  <button
                    onClick={() => setAuthModalMode('register')}
                    className="text-amber-300 hover:text-amber-200 font-bold underline text-xs"
                  >
                    Solicitar novo acesso ou validar código &rarr;
                  </button>
                  <button
                    onClick={clearAuthError}
                    className="text-slate-400 hover:text-slate-200 text-xs"
                  >
                    Dispensar aviso
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Secure Access Protocol Notice */}
          <div className="pt-6 max-w-xl mx-auto">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-amber-500/20 text-center flex items-center justify-center space-x-2 text-xs text-amber-200/80">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Ambiente de Ensino Iniciático Protegido • Apenas Irmãos previamente cadastrados pela Chancelaria
              </span>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-masonic">
          Faculdade Maçônica • Sistema de Instruções por Graus • T.’.F.’.A.’.
        </footer>

        {authModalMode && (
          <AuthModal
            isOpen={true}
            initialMode={authModalMode}
            onClose={() => setAuthModalMode(null)}
          />
        )}
      </div>
    );
  }

  // If user is pending or blocked -> Show StatusNotice
  if (userProfile.status !== 'approved') {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between">
        <MasonicNavbar
          onNavigate={handleNavigate}
          currentView={currentView}
          onOpenAuthModal={() => setAuthModalMode('login')}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          sidebarOpen={sidebarOpen}
        />
        <div className="p-4 flex-1 flex items-center justify-center">
          <StatusNotice />
        </div>
        {authModalMode && (
          <AuthModal
            isOpen={true}
            initialMode={authModalMode}
            onClose={() => setAuthModalMode(null)}
          />
        )}
      </div>
    );
  }

  // Authenticated and Approved User Dashboard Layout
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Solene Navigation Bar */}
      <MasonicNavbar
        onNavigate={handleNavigate}
        currentView={currentView}
        onOpenAuthModal={() => setAuthModalMode('login')}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex-1 flex w-full">
        {/* Left Role-Based Sidebar (Fixed flow on desktop, drawer on mobile) */}
        <MasonicSidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Viewport - Never overlapped by sidebar */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {/* BROTHER VIEWS */}
          {(currentView === 'dashboard' || currentView === 'home') && (
            <HomeDashboard onNavigate={handleNavigate} />
          )}

          {currentView === 'degrees' && (
            <DegreesView onNavigate={handleNavigate} />
          )}

          {currentView === 'lessons' && (
            <LessonsListView
              selectedDegreeFilter={navigationPayload?.degreeNumber}
              onNavigate={handleNavigate}
            />
          )}

          {(currentView === 'delivered-instructions' || currentView === 'admin-delivered-instructions') && (
            <DeliveredInstructionsView onNavigate={handleNavigate} />
          )}

          {(currentView === 'support-library' || currentView === 'admin-support-library') && (
            <SupportLibraryView onNavigate={handleNavigate} />
          )}

          {currentView === 'lesson-detail' && (
            <LessonDetailView
              lessonId={navigationPayload?.lessonId || 'inst_1_1'}
              onBack={() => handleNavigate('lessons')}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'evaluations' && (
            <EvaluationsView onNavigate={handleNavigate} />
          )}

          {currentView === 'submissions' && (
            <SubmissionsView onNavigate={handleNavigate} />
          )}

          {currentView === 'certificates' && (
            <CertificatesView onNavigate={handleNavigate} />
          )}

          {currentView === 'salary-request' && (
            <SalaryRequestView onNavigate={handleNavigate} />
          )}

          {currentView === 'progress' && (
            <ProgressView onNavigate={handleNavigate} />
          )}

          {currentView === 'profile' && <ProfileView />}

          {/* ADMIN / INSTRUCTOR VIEWS */}
          {currentView === 'admin-dashboard' && (
            <AdminDashboard onNavigate={handleNavigate} />
          )}

          {currentView === 'admin-new-user' && (
            <UserManagementView key="admin-new-user-view" initialTab="register-new" />
          )}

          {currentView === 'admin-users' && (
            <UserManagementView key="admin-users-view" initialTab="users" />
          )}

          {currentView === 'admin-degrees' && <DegreeConfigView />}

          {currentView === 'admin-lessons' && <LessonsManagerView />}

          {currentView === 'admin-quizzes' && <QuizzesManagerView />}

          {currentView === 'admin-submissions' && <SubmissionReviewView />}

          {currentView === 'admin-discursive' && <DiscursiveGradingView />}

          {currentView === 'admin-notifications' && <NotificationsBroadcastView />}

          {currentView === 'admin-reports' && <ReportsView />}

          {currentView === 'admin-certificates' && (
            <CertificatesView onNavigate={handleNavigate} />
          )}

          {currentView === 'admin-settings' && <SystemSettingsView />}

          {currentView === 'admin-audit' && <AuditLogsView />}
        </main>
      </div>

      {authModalMode && (
        <AuthModal
          isOpen={true}
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
