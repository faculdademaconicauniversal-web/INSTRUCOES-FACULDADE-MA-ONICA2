import React from 'react';
import {
  Home,
  Layers,
  BookOpen,
  CheckSquare,
  FileText,
  BarChart3,
  Award,
  Bell,
  User,
  LogOut,
  Users,
  UserPlus,
  Sliders,
  FileCheck,
  FileSpreadsheet,
  Settings,
  Shield,
  HelpCircle,
  PenTool,
  X,
  Compass,
  TrendingUp,
  GraduationCap,
  Library,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { FACULDADE_SEAL_IMG } from '../assets/logo';

interface MasonicSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const MasonicSidebar: React.FC<MasonicSidebarProps> = ({
  currentView,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const { userProfile, isAdmin, isInstructor, logout } = useAuth();

  const handleNavClick = (view: string) => {
    onNavigate(view);
    onClose();
  };

  const brotherNavItems = [
    { id: 'dashboard', label: 'Início', icon: Home },
    { id: 'degrees', label: 'Meus Graus', icon: Layers },
    { id: 'lessons', label: 'Instruções', icon: BookOpen },
    { id: 'delivered-instructions', label: 'Instruções Ministradas', icon: GraduationCap },
    { id: 'support-library', label: 'Biblioteca de Apoio', icon: Library, highlight: true },
    { id: 'evaluations', label: 'Avaliações (10 Qs)', icon: CheckSquare },
    { id: 'submissions', label: 'Minhas Pranchas', icon: FileText },
    { id: 'salary-request', label: 'Aumento de Salário', icon: TrendingUp, highlight: true },
    { id: 'progress', label: 'Meu Progresso', icon: BarChart3 },
    { id: 'certificates', label: 'Certificados', icon: Award },
    { id: 'profile', label: 'Meu Perfil', icon: User },
  ];

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Painel Geral', icon: BarChart3 },
    { id: 'admin-delivered-instructions', label: 'Instruções Ministradas', icon: GraduationCap, highlight: true },
    { id: 'support-library', label: 'Biblioteca de Apoio', icon: Library, highlight: true },
    { id: 'admin-new-user', label: 'Cadastro de Novo Usuário', icon: UserPlus, highlight: true },
    { id: 'admin-users', label: 'Quadro & Gestão de Irmãos', icon: Users },
    { id: 'admin-degrees', label: 'Graus & Acessos', icon: Sliders },
    { id: 'admin-lessons', label: 'Gerenciar Instruções', icon: BookOpen },
    { id: 'admin-quizzes', label: 'Questionários (10 Qs)', icon: HelpCircle },
    { id: 'admin-submissions', label: 'Avaliar Pranchas', icon: FileCheck },
    { id: 'admin-discursive', label: 'Corrigir Discursivas', icon: PenTool },
    { id: 'admin-certificates', label: 'Emitir Certificados', icon: Award },
    { id: 'admin-notifications', label: 'Avisos & Notificações', icon: Bell },
    { id: 'admin-reports', label: 'Relatórios Docentes', icon: FileSpreadsheet },
    { id: 'admin-settings', label: 'Configurações', icon: Settings },
    { id: 'admin-audit', label: 'Logs de Auditoria', icon: Shield },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-[#0a0d14] border-r border-amber-500/20 text-slate-100">
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between pb-2 border-b border-amber-500/20 lg:hidden">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <span className="font-masonic font-bold text-xs text-amber-200 uppercase tracking-wider">
              Menu de Navegação
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Degree & Masonic Status Overview Card */}
        {userProfile && (
          <div className="p-3 rounded-xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-amber-500/25 shadow-inner">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-600 shadow-md shrink-0">
                <img
                  src={FACULDADE_SEAL_IMG}
                  alt="Brasão Oficial"
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-amber-400 font-masonic font-bold uppercase tracking-wider">
                  Faculdade Maçônica
                </div>
                <p className="text-xs text-slate-100 font-bold truncate">
                  {userProfile.fullName}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Grau Atual:</span>
              <span className="font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                {userProfile.degree === 1
                  ? 'Grau 01 (Aprendiz)'
                  : userProfile.degree === 2
                  ? 'Grau 02 (Companheiro)'
                  : userProfile.degree === 3
                  ? 'Grau 03 (Mestre)'
                  : `Grau ${userProfile.degree}`}
              </span>
            </div>
          </div>
        )}

        {/* Brother Navigation Menu */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-amber-500/70 font-masonic">
            Menu do Irmão
          </div>
          <nav className="space-y-1">
            {brotherNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || (item.id === 'dashboard' && currentView === 'home');
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/25 to-amber-600/10 text-amber-200 border border-amber-500/40 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-amber-400' : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin & Instructor Section */}
        {(isAdmin || isInstructor) && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="px-3 pb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-400/90 font-masonic">
                {isAdmin ? 'Administração Plena' : 'Corpo Docente'}
              </span>
              <span className="px-1.5 py-0.2 text-[9px] rounded bg-red-950/60 text-red-300 border border-red-500/30 font-semibold">
                DOCÊNCIA
              </span>
            </div>
            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-red-950/40 to-amber-950/20 text-red-200 border border-red-500/40 shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-red-400' : 'text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer Logout & Version */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <button
          onClick={() => {
            logout();
            onClose();
          }}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Encerrar Sessão</span>
        </button>
        <div className="mt-2 text-center text-[10px] text-slate-600 font-masonic">
          Faculdade Maçônica • Solene
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Non-Overlapping Sidebar Column */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-16 sm:top-20 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] z-20">
        {sidebarContent}
      </aside>

      {/* 2. Mobile/Tablet Overlay Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
