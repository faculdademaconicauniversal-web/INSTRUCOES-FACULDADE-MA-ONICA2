import React from 'react';
import {
  Layers,
  BookOpen,
  CheckSquare,
  FileText,
  Award,
  Clock,
  ArrowRight,
  Sparkles,
  Lock,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Shield,
  FileCheck,
  Library,
  Video,
  Headphones,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { Degree } from '../../types';
import { FACULDADE_SEAL_IMG } from '../../assets/logo';

interface HomeDashboardProps {
  onNavigate: (view: string, payload?: any) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ onNavigate }) => {
  const { userProfile, hasAccessToDegree, isAdmin, isInstructor } = useAuth();

  if (!userProfile) return null;

  const degrees = dataStore.getDegrees();
  const currentDegreeProgress = dataStore.getUserProgress(userProfile.id, userProfile.degree);
  const lessons = dataStore.getLessons(userProfile.degree, isAdmin || isInstructor);
  const userAttempts = dataStore.getQuizAttemptsByUser(userProfile.id);
  const userSubmissions = dataStore.getSubmissionsByUser(userProfile.id);
  const userCertificates = dataStore.getCertificatesByUser(userProfile.id);

  // Find next pending lesson
  const completedLessonIds = new Set(
    userAttempts.filter((a) => a.isPassed).map((a) => a.lessonId)
  );
  const nextLesson = lessons.find((l) => !completedLessonIds.has(l.id)) || lessons[0];

  const getDegreeLabel = (deg: number) => {
    switch (deg) {
      case 1:
        return 'Aprendiz Maçom';
      case 2:
        return 'Companheiro Maçom';
      case 3:
        return 'Mestre Maçom';
      default:
        return `Grau ${deg}`;
    }
  };

  const degreeQuizzesProgress = dataStore.checkDegreeQuizzesProgress(userProfile.id, userProfile.degree || 1);
  const targetDegree = (userProfile.degree || 1) + 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Solene Header / Fraternal Greeting Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#141926] via-[#10141e] to-[#0a0d14] border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none hidden sm:block">
          <svg className="w-36 h-36 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M4 4v16h16" strokeWidth="1" />
            <path d="M12 4l7 14" strokeWidth="1" />
            <path d="M12 4l-7 14" strokeWidth="1" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-widest font-masonic mb-2">
              <span>À Glória do Grande Arquiteto do Universo</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-masonic text-slate-100 mb-2">
              Saudações Fraternais, <span className="gold-gradient-text">{userProfile.fullName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Bem-vindo ao seu portal de estudos e aperfeiçoamento moral e intelectual. Explore as instruções do seu grau, responda aos questionários de fixação e envie suas Pranchas de Arquitetura.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold">
                {userProfile.lodge}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
                {userProfile.grandLodge}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 font-mono text-amber-400">
                {userProfile.cimNumber}
              </span>
            </div>
          </div>

          {/* Current Degree Badge Card */}
          <div className="shrink-0 bg-slate-900/90 border border-amber-500/40 rounded-xl p-4 sm:p-5 text-center min-w-[220px] shadow-lg flex flex-col items-center">
            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-600 shadow-md mb-2">
              <img
                src={FACULDADE_SEAL_IMG}
                alt="Brasão Oficial Faculdade Maçônica"
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-[10px] uppercase font-bold text-amber-400 font-masonic tracking-wider">
              Seu Grau Atual
            </div>
            <div className="text-2xl sm:text-3xl font-black font-masonic text-amber-200 mt-0.5">
              GRAU 0{userProfile.degree}
            </div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">
              {getDegreeLabel(userProfile.degree)}
            </div>

            {/* Progress Mini Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Conclusão do Grau</span>
                <span className="font-bold text-amber-300">{currentDegreeProgress.progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${currentDegreeProgress.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Metrics 4-Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => onNavigate('lessons')}
          className="masonic-card hover:masonic-card-highlight rounded-xl p-4 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Instruções Disponíveis</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-masonic text-slate-100">
              {lessons.length}
            </span>
            <span className="text-[11px] text-slate-400">no seu grau</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('evaluations')}
          className="masonic-card hover:masonic-card-highlight rounded-xl p-4 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Média em Avaliações</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-masonic text-amber-300">
              {currentDegreeProgress.averageGrade > 0 ? `${currentDegreeProgress.averageGrade}/100` : '—'}
            </span>
            <span className="text-[11px] text-slate-400">
              {userAttempts.length} realizadas
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('submissions')}
          className="masonic-card hover:masonic-card-highlight rounded-xl p-4 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Pranchas Aprovadas</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-masonic text-slate-100">
              {currentDegreeProgress.submissionsApproved}
            </span>
            <span className="text-[11px] text-slate-400">
              de {currentDegreeProgress.submissionsTotal} enviadas
            </span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('certificates')}
          className="masonic-card hover:masonic-card-highlight rounded-xl p-4 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Certificados Obtidos</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-masonic text-slate-100">
              {userCertificates.length}
            </span>
            <span className="text-[11px] text-slate-400">oficiais</span>
          </div>
        </div>
      </div>

      {/* Degree Promotion Callout Banner (when all quizzes of current degree 1 or 2 are completed) */}
      {(userProfile.degree || 1) < 3 && degreeQuizzesProgress.isAllCompleted && (
        <div className="bg-gradient-to-r from-[#1b170e] via-[#241c0e] to-[#121622] border border-amber-500/50 rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0 mt-0.5">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-masonic">
                  Requisitos de Questionários Cumpridos (100%)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                  APTO PARA ELEVAÇÃO
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold font-masonic text-slate-100 mt-0.5">
                Você concluiu todos os questionários do Grau 0{userProfile.degree || 1} ({getDegreeLabel(userProfile.degree || 1)})!
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Seu aproveitamento doutrinário está aprovado. Você pode formalizar agora seu <strong>Pedido de Aumento de Salário</strong> para passagem ao <strong>Grau 0{targetDegree} ({getDegreeLabel(targetDegree)})</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('salary-request')}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black font-masonic text-xs tracking-wider uppercase shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 shrink-0"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Pedir Aumento de Salário (Grau 0{targetDegree})</span>
          </button>
        </div>
      )}

      {/* Card Destaque: Biblioteca de Apoio (Vídeos, PDFs e Áudios) */}
      <div className="bg-gradient-to-r from-[#0d121c] via-[#101726] to-[#0a0e17] border border-amber-500/30 hover:border-amber-400/60 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shrink-0 shadow-lg flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-amber-400">
              <Library className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black font-masonic uppercase tracking-widest text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                Novo Acervo Digital
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                Vídeos • PDFs • Áudios & Harmonia
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold font-masonic text-slate-100">
              Biblioteca de Apoio aos Graus Simbólicos
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Acesse pranchas de arquitetura, rituais em PDF, aulas doutrinárias em vídeo e faixas solenes de harmonia para sessões litúrgicas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('support-library')}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black font-masonic text-xs tracking-wider uppercase shadow-lg flex items-center justify-center space-x-2 transition-all hover:scale-105"
          >
            <Library className="w-4 h-4" />
            <span>Abrir Biblioteca</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Action Row: Next Lesson to Study & Degree Progression Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Next Lesson Card or Full Completion Banner & Instructions */}
        <div className="lg:col-span-2 space-y-6">
          {lessons.length > 0 && lessons.every((l) => completedLessonIds.has(l.id)) ? (
            <div className="bg-gradient-to-br from-[#121c18] via-[#0e1614] to-black border border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-masonic">
                    Integralização Curricular Concluída
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  100% Aprovado
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold font-masonic text-slate-100 mb-2">
                Todas as Instruções e Questionários Concluídos com Sucesso
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                Parabéns, Irmão! Você cumpriu todas as avaliações teóricas e envio de Pranchas de Arquitetura com nota máxima e aprovação do corpo docente da Faculdade Maçônica Universal.
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-semibold">
                    {userCertificates.length} Certificado{userCertificates.length > 1 ? 's' : ''} Emitido{userCertificates.length > 1 ? 's' : ''}
                  </span>
                  <span className="text-slate-400">Currículo Pleno Homologado</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('certificates')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 transition-all"
                  >
                    <Award className="w-4 h-4" />
                    <span>Ver Certificados</span>
                  </button>
                  <button
                    onClick={() => onNavigate('progress')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center space-x-1.5 transition-all"
                  >
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span>Ver Progresso</span>
                  </button>
                </div>
              </div>
            </div>
          ) : nextLesson ? (
            <div className="bg-gradient-to-br from-[#121622] via-[#0e121a] to-black border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-masonic">
                    Instrução Recomendada
                  </span>
                </div>
                <span className="text-xs text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{nextLesson.estimatedMinutes} min de leitura</span>
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold font-masonic text-slate-100 mb-2">
                {nextLesson.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4 line-clamp-2">
                {nextLesson.summary}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-semibold">
                    Grau 0{nextLesson.degreeNumber}
                  </span>
                  <span className="text-slate-400">{nextLesson.moduleTitle}</span>
                </div>

                <button
                  id="btn-continue-lesson"
                  onClick={() => onNavigate('lesson-detail', { lessonId: nextLesson.id })}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center space-x-2 transition-all"
                >
                  <span>Estudar Instrução</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : null}

          {/* Quick List of Degree Instructions */}
          <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold font-masonic text-amber-200">
                  Instruções do Grau 0{userProfile.degree}
                </h3>
              </div>
              <button
                onClick={() => onNavigate('lessons')}
                className="text-xs text-amber-400 hover:underline flex items-center space-x-1"
              >
                <span>Ver todas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {lessons.slice(0, 3).map((lesson) => {
                const isPassed = userAttempts.some(
                  (a) => a.lessonId === lesson.id && a.isPassed
                );
                return (
                  <div
                    key={lesson.id}
                    onClick={() => onNavigate('lesson-detail', { lessonId: lesson.id })}
                    className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isPassed
                            ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-800 text-amber-400 border border-slate-700'
                        }`}
                      >
                        {isPassed ? <CheckCircle2 className="w-4 h-4" /> : `0${lesson.order}`}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">
                          {lesson.title}
                        </h4>
                        <p className="text-[10px] text-slate-400">{lesson.moduleTitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        {lesson.estimatedMinutes} min
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Degrees Roadmap & Access Status */}
        <div className="space-y-6">
          <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold font-masonic text-amber-200">
                  Escalada por Graus
                </h3>
              </div>
              <button
                onClick={() => onNavigate('degrees')}
                className="text-xs text-amber-400 hover:underline"
              >
                Detalhes
              </button>
            </div>

            <div className="space-y-3">
              {degrees.map((deg) => {
                const hasAccess = hasAccessToDegree(deg.degreeNumber);
                const isCurrent = userProfile.degree === deg.degreeNumber;
                const isPassed = userProfile.degree > deg.degreeNumber;

                return (
                  <div
                    key={deg.id}
                    onClick={() => {
                      if (hasAccess) {
                        onNavigate('lessons', { degreeNumber: deg.degreeNumber });
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                        : hasAccess
                        ? 'bg-slate-900/40 border-slate-800 hover:border-amber-500/30 cursor-pointer'
                        : 'bg-slate-950/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs font-bold font-masonic ${
                            hasAccess ? 'text-amber-300' : 'text-slate-500'
                          }`}
                        >
                          Grau 0{deg.degreeNumber} • {deg.name}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-amber-500/20 text-amber-300 rounded font-semibold border border-amber-500/30">
                            Atual
                          </span>
                        )}
                      </div>

                      {hasAccess ? (
                        isPassed ? (
                          <span className="text-[10px] text-emerald-400 flex items-center space-x-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Concluído</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-semibold">Liberado</span>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <Lock className="w-3 h-3" />
                          <span>Bloqueado</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{deg.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <span className="text-amber-400 font-semibold">Regra de Sigilo Maçônico:</span> O acesso aos graus subsequentes é concedido exclusivamente após elevação/exaltação formal na Loja e atualização pela administração.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
