import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Bell,
  User as UserIcon,
  LogOut,
  LogIn,
  ShieldCheck,
  Award,
  Menu,
  X,
  CheckCircle,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_PROFILES } from '../lib/seedData';
import { dataStore } from '../lib/dataStore';
import { AppNotification } from '../types';
import { FACULDADE_SEAL_IMG } from '../assets/logo';

interface MasonicNavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuthModal: () => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export const MasonicNavbar: React.FC<MasonicNavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAuthModal,
  onToggleSidebar,
  sidebarOpen,
}) => {
  const {
    userProfile,
    isAdmin,
    isInstructor,
    isApproved,
    isPending,
    logout,
    switchDemoProfile,
    activeDemoProfileId,
  } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDemoSwitcher, setShowDemoSwitcher] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (userProfile) {
      const userNotifs = dataStore.getNotificationsByUser(userProfile.id);
      setNotifications(userNotifs);
    }
  }, [userProfile, currentView]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    if (userProfile) {
      dataStore.markAllNotificationsAsRead(userProfile.id);
      setNotifications(dataStore.getNotificationsByUser(userProfile.id));
    }
  };

  const getDegreeName = (deg: number) => {
    switch (deg) {
      case 1:
        return 'Grau 01 • Aprendiz';
      case 2:
        return 'Grau 02 • Companheiro';
      case 3:
        return 'Grau 03 • Mestre';
      default:
        return `Grau ${deg}`;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0e121a]/95 backdrop-blur-md border-b border-amber-500/20 text-slate-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              id="btn-sidebar-toggle"
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-amber-500/40 lg:hidden"
              aria-label="Alternar Menu"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <button
              id="btn-nav-brand-home"
              onClick={() => onNavigate('home')}
              className="flex items-center space-x-3 group text-left"
            >
              {/* Solene Official Masonic Seal Image */}
              <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-600 shadow-lg group-hover:scale-105 transition-transform">
                <img
                  src={FACULDADE_SEAL_IMG}
                  alt="Brasão Oficial Faculdade Maçônica"
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-masonic text-base sm:text-lg font-bold tracking-wider text-amber-200 group-hover:text-amber-100 transition-colors">
                    FACULDADE MAÇÔNICA
                  </span>
                  <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] uppercase font-semibold tracking-wider rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    Universal
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 font-medium tracking-wide hidden sm:block">
                  Sistema de Instruções por Graus
                </p>
              </div>
            </button>
          </div>

          {/* Center Search Bar (Desktop) */}
          <div className="hidden xl:flex items-center w-72">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar instruções, módulos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    onNavigate(`search?q=${encodeURIComponent(searchQuery)}`);
                  }
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900/80 border border-amber-500/20 rounded-full text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Right: User State, Profile, Notifications & Demo Selector */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Demo Switcher Quick Pill (Visible exclusively to Admins to inspect brother views) */}
            {isAdmin && (
              <div className="relative">
                <button
                  id="btn-demo-switcher"
                  onClick={() => {
                    setShowDemoSwitcher(!showDemoSwitcher);
                    setShowNotifications(false);
                    setShowProfileMenu(false);
                  }}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-amber-300 text-xs font-medium transition-all"
                  title="Simular visualização de graus e perfis (Exclusivo Administrador)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Simular Visão:</span>
                  <span className="font-semibold text-amber-200">
                    {userProfile?.role === 'admin'
                      ? 'Admin'
                      : isInstructor
                      ? 'Instrutor'
                      : userProfile?.degree === 2
                      ? 'Grau 2'
                      : userProfile?.status === 'pending'
                      ? 'Pendente'
                      : 'Grau 1'}
                  </span>
                </button>

                {showDemoSwitcher && (
                  <div className="absolute right-0 mt-2 w-72 bg-[#121622] border border-amber-500/30 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider font-masonic">
                        Simular Visão de Perfil (Admin)
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Inspecione a plataforma sob o prisma de outros graus e papéis
                      </p>
                    </div>
                    <div className="py-1 space-y-1">
                      {DEMO_PROFILES.map((p) => {
                        const isCurrent = userProfile?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              switchDemoProfile(p.id);
                              setShowDemoSwitcher(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                              isCurrent
                                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30 font-medium'
                                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-slate-200">{p.fullName}</div>
                              <div className="text-[10px] text-slate-400">
                                {p.role === 'admin'
                                  ? '👑 Administrador Pleno'
                                  : p.role === 'instructor'
                                  ? '📖 Instrutor Maçônico'
                                  : p.status === 'pending'
                                  ? '⏳ Irmão Aguardando Aprovação'
                                  : `🏛️ Irmão Grau ${p.degree} (${p.degree === 1 ? 'Aprendiz' : 'Companheiro'})`}
                              </div>
                            </div>
                            {isCurrent && <CheckCircle className="w-4 h-4 text-amber-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                id="btn-notifications-toggle"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                  setShowDemoSwitcher(false);
                }}
                className="relative p-2 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-800/60 transition-colors"
                aria-label="Notificações"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-black bg-amber-400 rounded-full animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#121622] border border-amber-500/30 rounded-xl shadow-2xl p-3 z-50">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-300 font-masonic">
                        Notificações
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-amber-400 hover:underline"
                      >
                        Marcar lidas
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">
                        Nenhuma notificação recebida no momento.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            dataStore.markNotificationAsRead(n.id);
                            if (n.link) onNavigate(n.link);
                            setShowNotifications(false);
                          }}
                          className={`p-2.5 rounded-lg text-xs transition-colors cursor-pointer border ${
                            n.isRead
                              ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                              : 'bg-amber-950/20 border-amber-500/30 text-slate-200'
                          } hover:border-amber-400/60`}
                        >
                          <div className="flex items-center justify-between font-semibold mb-1 text-amber-300">
                            <span>{n.title}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(n.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-300">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill / Avatar */}
            {userProfile ? (
              <div className="relative">
                <button
                  id="btn-user-profile-menu"
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                    setShowDemoSwitcher(false);
                  }}
                  className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-amber-500/20 hover:border-amber-400/40 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold text-xs shadow-md">
                    {userProfile.photoURL ? (
                      <img
                        src={userProfile.photoURL}
                        alt={userProfile.fullName}
                        className="w-full h-full rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      userProfile.fullName.charAt(0)
                    )}
                  </div>

                  <div className="hidden md:block">
                    <div className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                      <span className="truncate max-w-[130px]">{userProfile.fullName}</span>
                      {isAdmin ? (
                        <span className="px-1.5 py-0.2 text-[9px] bg-red-900/50 text-red-300 rounded border border-red-500/30">
                          ADM
                        </span>
                      ) : isInstructor ? (
                        <span className="px-1.5 py-0.2 text-[9px] bg-blue-900/50 text-blue-300 rounded border border-blue-500/30">
                          INST
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[10px] text-amber-400 font-medium">
                      {getDegreeName(userProfile.degree)}
                    </div>
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#121622] border border-amber-500/30 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3 border-b border-slate-800">
                      <p className="text-xs font-bold text-slate-200">{userProfile.fullName}</p>
                      {userProfile.masonicName && (
                        <p className="text-[11px] text-amber-400 italic">
                          "{userProfile.masonicName}"
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">{userProfile.lodge}</p>
                      <p className="text-[10px] text-slate-500">{userProfile.grandLodge}</p>
                      <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        {userProfile.cimNumber}
                      </div>
                    </div>

                    <div className="py-1 space-y-0.5">
                      <button
                        onClick={() => {
                          onNavigate('profile');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-amber-400" />
                        <span>Meu Perfil Maçônico</span>
                      </button>

                      <button
                        onClick={() => {
                          onNavigate('progress');
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                      >
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>Meu Progresso & Notas</span>
                      </button>

                      <button
                        onClick={() => {
                          onOpenAuthModal();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Entrar com outra Conta</span>
                      </button>

                      <div className="border-t border-slate-800 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Desconectar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Acessar Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
