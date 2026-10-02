import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Sparkles,
  FileCheck,
  ShieldCheck,
  Building,
  User,
  ArrowRight,
  BookOpen,
  CheckSquare,
  Lock,
  Info,
  Scroll,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { SalaryIncreaseRequest, Lesson, QuizAttempt } from '../../types';

interface SalaryRequestViewProps {
  onNavigate: (view: string, payload?: any) => void;
}

export const SalaryRequestView: React.FC<SalaryRequestViewProps> = ({ onNavigate }) => {
  const { userProfile, isAdmin } = useAuth();

  const [justification, setJustification] = useState('');
  const [agreedLandmarks, setAgreedLandmarks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!userProfile) return null;

  const currentDegree = userProfile.degree || 1;
  const targetDegree = currentDegree === 1 ? 2 : currentDegree === 2 ? 3 : 3;
  const isMaster = currentDegree >= 3;

  const currentDegreeName =
    currentDegree === 1 ? 'Aprendiz Maçom' : currentDegree === 2 ? 'Companheiro Maçom' : 'Mestre Maçom';
  const targetDegreeName = targetDegree === 2 ? 'Companheiro Maçom' : 'Mestre Maçom';

  const progressData = dataStore.checkDegreeQuizzesProgress(userProfile.id, currentDegree);
  const latestRequest = dataStore.getLatestSalaryRequestByUser(userProfile.id);
  const allUserRequests = dataStore.getSalaryRequestsByUser(userProfile.id);
  const userCertificates = dataStore.getCertificatesByUser(userProfile.id);

  const isEligible = progressData.isAllCompleted;

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMaster) {
      setFeedback({
        type: 'error',
        message: 'Você já alcançou o Grau 03 (Mestre Maçom), a plenitude dos Graus Simbólicos.',
      });
      return;
    }

    if (!isEligible) {
      setFeedback({
        type: 'error',
        message: `Você precisa concluir todos os questionários do Grau 0${currentDegree} antes de formalizar o pedido.`,
      });
      return;
    }

    if (!agreedLandmarks) {
      setFeedback({
        type: 'error',
        message: 'Por favor, confirme a declaração solene de compromisso e dedicação aos estudos maçônicos.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = dataStore.requestSalaryIncrease({
        userId: userProfile.id,
        justificationText: justification,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message,
        });
        setJustification('');
        setAgreedLandmarks(false);
        setRefreshKey((k) => k + 1);
      } else {
        setFeedback({
          type: 'error',
          message: res.message,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Ocorreu um erro ao registrar o pedido. Tente novamente.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to simulate completing all remaining quizzes for demo/testing
  const handleQuickCompleteDemoQuizzes = () => {
    progressData.lessonStatusList.forEach((item) => {
      if (!item.isPassed) {
        dataStore.submitQuizAttempt({
          userId: userProfile.id,
          userName: userProfile.fullName,
          userDegree: currentDegree,
          lessonId: item.lesson.id,
          lessonTitle: item.lesson.title,
          degreeNumber: currentDegree,
          answers: [],
          score: 100,
          correctCount: 10,
          errorCount: 0,
          isPassed: true,
          hasPendingManualGrading: false,
          status: 'approved',
          feedback: `Questionário da instrução do Grau ${currentDegree} concluído com nota máxima.`,
          gradedBy: 'Sistema Docente Automático',
          gradedAt: new Date().toISOString(),
        });
      }
    });

    setFeedback({
      type: 'success',
      message: `Todos os questionários do Grau 0${currentDegree} foram concluídos com nota 100 para fins de teste!`,
    });
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" key={refreshKey}>
      {/* Solene Header Banner */}
      <div className="bg-gradient-to-r from-[#171b26] via-[#10141d] to-[#0a0d14] border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider font-masonic">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Tradição Iniciática • Elevação de Salário</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-masonic text-slate-100 tracking-tight">
              {isMaster
                ? 'Plenitude Maçônica — Mestre Maçom'
                : currentDegree === 1
                ? 'Pedido de Aumento de Salário para o Grau 02'
                : 'Pedido de Aumento de Salário para o Grau 03'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {isMaster ? (
                <>
                  Venerável Irmão, você atingiu a <strong>Plenitude dos Graus Simbólicos (Grau 03 — Mestre Maçom)</strong>. Seu salário é pleno e seus direitos e deveres na Sublime Ordem são integrais.
                </>
              ) : currentDegree === 1 ? (
                <>
                  Na Maçonaria Simbólica, o <strong>Aumento de Salário</strong> é a solene requisição pelo qual o Irmão Aprendiz, havendo desbastado a Pedra Bruta e concluído todos os questionários da Coluna do Norte (Grau 1), solicita à Chancelaria e ao Venerável Mestre sua passagem à Coluna do Sul e elevação ao <strong>Grau 02 (Companheiro Maçom)</strong>.
                </>
              ) : (
                <>
                  Havendo percorrido as viagens simbólicas, contemplado as Sete Artes e Ciências Liberais e concluído todos os questionários do Grau 02, o Irmão Companheiro solicita à Chancelaria sua admissão à Câmara do Meio e Exaltação ao <strong>Grau 03 (Mestre Maçom)</strong>.
                </>
              )}
            </p>
          </div>

          <div className="flex sm:flex-col items-center justify-between sm:justify-center p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 text-center shrink-0 min-w-[210px] shadow-lg">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider font-masonic block">
              {isMaster ? 'Grau Atual' : 'Próxima Elevação'}
            </span>
            <span className="text-lg sm:text-xl font-bold font-masonic text-slate-100 mt-0.5">
              {isMaster ? 'Grau 03' : `Grau 0${targetDegree}`}
            </span>
            <span className="text-[11px] text-slate-300 font-medium mt-0.5">
              {isMaster ? 'Mestre Maçom (Pleno)' : targetDegreeName}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Grau Atual: <strong>Grau 0{currentDegree} ({currentDegreeName})</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm flex items-start space-x-3 animate-in fade-in duration-300 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* When the user is already Degree 3 (Master Mason) */}
      {isMaster ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0f131d] border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-masonic text-slate-100">
                  Consagração de Mestria Simbólica
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Integralização curricular dos 3 Graus da Maçonaria Simbólica
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Como <strong>Mestre Maçom (Grau 03)</strong>, você cumpriu todos os requisitos de formação tradicional da Faculdade Maçônica Universal. Na Maçonaria Simbólica, a Mestria é o cume da formação ritualística e doutrinária.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-blue-500/30 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-blue-400 block font-masonic">Grau 01</span>
                <span className="text-xs font-bold text-slate-200 block">Aprendiz Maçom</span>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 mt-1">
                  ✓ Integralizado
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block font-masonic">Grau 02</span>
                <span className="text-xs font-bold text-slate-200 block">Companheiro Maçom</span>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 mt-1">
                  ✓ Integralizado
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/40 text-center space-y-1 bg-gradient-to-b from-amber-500/10 to-transparent">
                <span className="text-[10px] uppercase font-bold text-amber-400 block font-masonic">Grau 03</span>
                <span className="text-xs font-bold text-amber-200 block">Mestre Maçom</span>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 mt-1">
                  ★ Grau Pleno
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => onNavigate('certificates')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold text-xs shadow-lg flex items-center space-x-2 transition-all"
              >
                <Award className="w-4 h-4" />
                <span>Ver Meus Certificados</span>
              </button>
              <button
                onClick={() => onNavigate('progress')}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center space-x-2 transition-all"
              >
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Histórico de Progresso</span>
              </button>
              <button
                onClick={() => onNavigate('lessons', { degreeNumber: 3 })}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center space-x-2 transition-all"
              >
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Revisar Instruções do Grau 03</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#121622] border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-masonic flex items-center space-x-2">
                <Scroll className="w-4 h-4" />
                <span>Certificados Registrados</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Você possui <strong>{userCertificates.length} certificado(s) emitido(s)</strong> no sistema de chancelaria.
              </p>
              <div className="space-y-2">
                {userCertificates.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                    <div className="font-bold text-slate-200">{c.degreeName}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Reg. {c.certificateNumber}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Status Matrix & Overview for Degree 1 -> 2 and Degree 2 -> 3 */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Progress Checklist of All Lessons for Current Degree */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0f131d] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <h2 className="text-base font-bold font-masonic text-slate-100 flex items-center space-x-2">
                    <CheckSquare className="w-4 h-4 text-amber-400" />
                    <span>
                      Questionários do Grau 0{currentDegree} ({progressData.completedLessons}/{progressData.totalLessons})
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentDegree === 1
                      ? 'Conclua todos os questionários do Grau 01 para habilitar o pedido de Aumento de Salário para o Grau 02.'
                      : 'Conclua todos os questionários do Grau 02 para habilitar o pedido de Aumento de Salário para o Grau 03 (Mestre).'}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      isEligible
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {isEligible
                      ? '✓ 100% Concluído'
                      : `${Math.round((progressData.completedLessons / (progressData.totalLessons || 1)) * 100)}% Concluído`}
                  </span>
                </div>
              </div>

              {/* Checklist of all published lessons in this degree */}
              <div className="space-y-3">
                {progressData.lessonStatusList.map((item, idx) => {
                  const { lesson, isPassed, bestScore } = item;
                  return (
                    <div
                      key={lesson.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isPassed
                          ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                          : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isPassed
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isPassed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <span className="text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-200">
                              {lesson.title}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {lesson.moduleTitle || 'Módulo Geral'} • 10 Questões Avaliativas
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                        {isPassed ? (
                          <div className="text-right">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40">
                              <Sparkles className="w-3 h-3 text-emerald-400" />
                              <span>Aprovado ({bestScore}/100)</span>
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => onNavigate('evaluations', { lessonId: lesson.id })}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold transition-all flex items-center space-x-1 shadow-md"
                          >
                            <span>Fazer Avaliação</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Demo Helper */}
              {!isEligible && (
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Faltam <strong>{progressData.totalLessons - progressData.completedLessons} questionários</strong> do Grau 0{currentDegree} para liberar o botão de Aumento de Salário.
                    </span>
                  </div>
                  <button
                    onClick={handleQuickCompleteDemoQuizzes}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold border border-amber-500/20 transition-colors whitespace-nowrap"
                    title="Apenas para demonstração e testes rápidos"
                  >
                    ⚡ Concluir Todos do Grau 0{currentDegree} (Modo Teste)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Submission Card / Status Tracking */}
          <div className="space-y-4">
            {/* Active Request Status (if already submitted) */}
            {latestRequest && latestRequest.currentDegree === currentDegree && (
              <div className="bg-[#121622] border border-amber-500/40 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-masonic flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Status do Protocolo</span>
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      latestRequest.status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : latestRequest.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                    }`}
                  >
                    {latestRequest.status === 'approved'
                      ? 'Aprovado'
                      : latestRequest.status === 'rejected'
                      ? 'Devolvido'
                      : 'Aguardando Análise'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Protocolo:</span>
                    <span className="font-mono text-slate-200">{latestRequest.id.slice(0, 16)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Data do Envio:</span>
                    <span className="text-slate-200">
                      {new Date(latestRequest.createdAt).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(latestRequest.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Média nos Questionários:</span>
                    <span className="font-bold text-amber-300">{latestRequest.averageQuizScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Elevação Solicitada:</span>
                    <span className="font-bold text-slate-100">
                      Grau 0{latestRequest.targetDegree} ({latestRequest.targetDegree === 2 ? 'Companheiro' : 'Mestre'})
                    </span>
                  </div>

                  {latestRequest.justificationText && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                        Justificativa do Obreiro:
                      </span>
                      <p className="text-slate-300 text-[11px] italic">"{latestRequest.justificationText}"</p>
                    </div>
                  )}

                  {latestRequest.adminNotes && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200">
                      <span className="text-[10px] uppercase font-bold block mb-1 text-amber-400">
                        Parecer da Chancelaria ({latestRequest.reviewedByName || 'Venerável Mestrado'}):
                      </span>
                      <p className="text-[11px]">{latestRequest.adminNotes}</p>
                    </div>
                  )}
                </div>

                {latestRequest.status === 'approved' && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs space-y-2">
                    <div className="font-bold flex items-center space-x-1.5 text-emerald-300">
                      <Sparkles className="w-4 h-4" />
                      <span>Elevação Autorizada!</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Seu Aumento de Salário foi homologado pela Chancelaria. Você agora tem acesso pleno às instruções e questionários do Grau 0{latestRequest.targetDegree} ({targetDegreeName}).
                    </p>
                    <button
                      onClick={() => onNavigate('lessons', { degreeNumber: latestRequest.targetDegree })}
                      className="w-full mt-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md transition-colors"
                    >
                      Acessar Instruções do Grau 0{latestRequest.targetDegree}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Petition Form / Action Card */}
            {(!latestRequest || latestRequest.currentDegree !== currentDegree || latestRequest.status === 'rejected') && (
              <div
                className={`rounded-2xl border p-6 shadow-xl space-y-5 ${
                  isEligible
                    ? 'bg-gradient-to-b from-[#141a29] to-[#0e121c] border-amber-500/50 shadow-amber-950/20'
                    : 'bg-[#0f131d] border-slate-800 opacity-90'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-amber-400 font-masonic text-xs font-bold uppercase tracking-wider">
                    <FileCheck className="w-4 h-4" />
                    <span>Protocolo de Solicitação</span>
                  </div>
                  <h3 className="text-base font-bold font-masonic text-slate-100">
                    {isEligible
                      ? `Solicitar Aumento de Salário (Grau 0${targetDegree})`
                      : 'Requisitos Não Concluídos'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isEligible
                      ? `Você cumpriu todos os questionários do Grau 0${currentDegree} e está apto a submeter seu pedido de elevação ao Grau 0${targetDegree} (${targetDegreeName}).`
                      : `Complete todos os questionários do Grau 0${currentDegree} para habilitar a solicitação formal de Aumento de Salário.`}
                  </p>
                </div>

                {isEligible ? (
                  <form onSubmit={handleSubmitRequest} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                        Considerações / Justificativa do Irmão (Opcional)
                      </label>
                      <textarea
                        rows={3}
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        placeholder={
                          currentDegree === 1
                            ? 'Ex: Havendo concluído com zelo todas as instruções e questionários do Grau de Aprendiz, solicito respeitosamente a passagem à Coluna do Sul e elevação ao Grau de Companheiro Maçom...'
                            : 'Ex: Tendo percorrido as viagens simbólicas e finalizado os questionários do Grau de Companheiro, solicito respeitosamente a Exaltação ao Grau de Mestre Maçom...'
                        }
                        className="w-full p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all resize-none"
                      />
                    </div>

                    <label className="flex items-start space-x-2.5 cursor-pointer select-none text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <input
                        type="checkbox"
                        checked={agreedLandmarks}
                        onChange={(e) => setAgreedLandmarks(e.target.checked)}
                        className="mt-0.5 rounded border-slate-700 text-amber-600 focus:ring-amber-500"
                      />
                      <span>
                        {currentDegree === 1
                          ? 'Declaro sob palavra de honra que estudei todas as instruções do Grau de Aprendiz Maçom e estou pronto para assumir os deveres e estudos do Grau de Companheiro Maçom (Grau 02).'
                          : 'Declaro sob palavra de honra que cumpri todas as viagens e questionários do Grau de Companheiro Maçom e estou pronto para ser Exaltado à Mestria Maçônica (Grau 03).'}
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={submitting || !agreedLandmarks}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black font-masonic text-xs tracking-wider uppercase shadow-xl hover:scale-[1.02] active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <Send className="w-4 h-4" />
                      <span>
                        {submitting
                          ? 'Protocolando Pedido...'
                          : `🏛️ Pedir Aumento de Salário para Grau 0${targetDegree} (${targetDegreeName})`}
                      </span>
                    </button>

                    <p className="text-[10px] text-center text-slate-500 font-masonic">
                      O envio notificará instantaneamente a Chancelaria e o corpo docente da Faculdade.
                    </p>
                  </form>
                ) : (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
                      <Lock className="w-6 h-6 text-slate-500 mx-auto" />
                      <div className="text-xs font-bold text-slate-300">
                        Botão de Aumento de Salário Bloqueado
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Conclua os {progressData.totalLessons - progressData.completedLessons} questionários pendentes do Grau 0{currentDegree} na lista ao lado para desbloquear o pedido de elevação para o Grau 0{targetDegree}.
                      </p>
                    </div>

                    <button
                      disabled
                      className="w-full py-3 rounded-xl bg-slate-800 text-slate-500 font-bold font-masonic text-xs tracking-wider uppercase flex items-center justify-center space-x-2 cursor-not-allowed border border-slate-700/50"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Aguardando Questionários do Grau 0{currentDegree}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
