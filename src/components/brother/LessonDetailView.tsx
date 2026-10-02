import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  HelpCircle,
  FileText,
  Clock,
  Headphones,
  Video,
  Download,
  Share2,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { QuizEngine } from './QuizEngine';

interface LessonDetailViewProps {
  lessonId: string;
  onBack: () => void;
  onNavigate: (view: string, payload?: any) => void;
}

export const LessonDetailView: React.FC<LessonDetailViewProps> = ({
  lessonId,
  onBack,
  onNavigate,
}) => {
  const { userProfile } = useAuth();
  const lesson = dataStore.getLessonById(lessonId);

  const [activeTab, setActiveTab] = useState<'content' | 'quiz' | 'submission'>('content');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Submission Form State
  const [pranchaTitle, setPranchaTitle] = useState('');
  const [pranchaComments, setPranchaComments] = useState('');
  const [pranchaFile, setPranchaFile] = useState<File | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  if (!lesson || !userProfile) {
    return (
      <div className="bg-[#0e121a] border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto">
        <AlertCircle className="w-12 h-12 text-amber-500/60 mx-auto mb-3" />
        <h2 className="text-lg font-bold font-masonic text-slate-200">
          Instrução Não Localizada
        </h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          Esta peça de arquitetura não está disponível ou você não possui autorização para este grau.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold"
        >
          Voltar às Instruções
        </button>
      </div>
    );
  }

  const userAttempts = dataStore.getQuizAttemptsByUser(userProfile.id);
  const latestQuizAttempt = userAttempts.find((a) => a.lessonId === lesson.id);
  const userSubmissions = dataStore.getSubmissionsByUser(userProfile.id);
  const currentSubmission = userSubmissions.find((s) => s.lessonId === lesson.id);

  const handlePranchaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pranchaTitle.trim()) return;

    dataStore.submitPrancha({
      userId: userProfile.id,
      userName: userProfile.fullName,
      userDegree: userProfile.degree,
      userLodge: userProfile.lodge,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      degreeNumber: lesson.degreeNumber,
      title: pranchaTitle,
      comments: pranchaComments,
      fileName: pranchaFile ? pranchaFile.name : `Prancha_Inst_${lesson.order}_${userProfile.fullName.replace(/\s+/g, '_')}.pdf`,
      fileType: pranchaFile ? pranchaFile.type : 'application/pdf',
      fileSize: pranchaFile ? pranchaFile.size : 1024 * 512,
    });

    setSubmissionSuccess(true);
    setPranchaTitle('');
    setPranchaComments('');
    setPranchaFile(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Instruções</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            Grau 0{lesson.degreeNumber}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-900 border border-slate-800 text-slate-300">
            Instrução 0{lesson.order}
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#121622] via-[#0e121a] to-black border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400 font-masonic mb-2">
          <Layers className="w-4 h-4" />
          <span>{lesson.moduleTitle}</span>
        </div>

        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-masonic text-slate-100 mb-3 leading-tight">
          {lesson.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl mb-4">
          {lesson.summary}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-4 border-t border-slate-800">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{lesson.estimatedMinutes} min de leitura estimada</span>
          </div>

          {latestQuizAttempt && (
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Avaliação: {latestQuizAttempt.score}/100</span>
            </div>
          )}

          {currentSubmission && (
            <div className="flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Prancha: {currentSubmission.status}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'content'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Conteúdo da Instrução</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'quiz'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Questionário (10 Questões)</span>
          {latestQuizAttempt && (
            <span className="ml-1 px-1.5 py-0.2 rounded bg-black/30 text-[10px]">
              {latestQuizAttempt.score} pts
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('submission')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'submission'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Prancha de Trabalho</span>
          {currentSubmission && (
            <span className="ml-1 px-1.5 py-0.2 rounded bg-black/30 text-[10px]">
              {currentSubmission.status === 'aprovada' ? '✓' : '...'}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: CONTENT */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Audio Lecture Simulated Player */}
          {lesson.audioUrl && (
            <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-black border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 shadow-md hover:scale-105 transition-transform"
                >
                  {isPlayingAudio ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>
                <div>
                  <div className="text-xs font-bold text-slate-200 font-masonic">
                    Áudio da Instrução • Narração Solene
                  </div>
                  <p className="text-[11px] text-amber-300/80">
                    {isPlayingAudio ? 'Reproduzindo palestra filosófica...' : 'Clique para ouvir a instrução comentada'}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center space-x-3 text-xs text-slate-400">
                <Headphones className="w-4 h-4 text-amber-400" />
                <span>{lesson.estimatedMinutes} minutos</span>
              </div>
            </div>
          )}

          {/* Main Philosophical Text Body */}
          <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-6 sm:p-10 shadow-xl space-y-6">
            <div className="prose prose-invert max-w-none">
              {lesson.content.split('\n\n').map((paragraph, idx) => {
                if (paragraph.startsWith('###')) {
                  return (
                    <h3
                      key={idx}
                      className="text-base sm:text-lg font-bold font-masonic text-amber-300 mt-6 mb-3 border-l-2 border-amber-500 pl-3"
                    >
                      {paragraph.replace('###', '').trim()}
                    </h3>
                  );
                }
                if (paragraph.startsWith('>')) {
                  return (
                    <div
                      key={idx}
                      className="my-6 p-4 rounded-xl bg-amber-950/20 border-l-4 border-amber-500 text-amber-200/95 italic text-xs sm:text-sm font-serif leading-relaxed"
                    >
                      {paragraph.replace('>', '').trim()}
                    </div>
                  );
                }
                return (
                  <p
                    key={idx}
                    className="text-xs sm:text-sm text-slate-300 leading-relaxed text-justify mb-4"
                  >
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Bottom Actions to encourage next step */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                Após a leitura meditativa, realize a avaliação de 10 questões para fixar o aprendizado.
              </div>

              <button
                onClick={() => setActiveTab('quiz')}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-lg transition-all flex items-center space-x-2"
              >
                <span>Ir para o Questionário</span>
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 10-QUESTIONS QUIZ */}
      {activeTab === 'quiz' && (
        <QuizEngine lesson={lesson} onFinishQuiz={() => setActiveTab('submission')} />
      )}

      {/* TAB 3: PRANCHA DE TRABALHO SUBMISSION */}
      {activeTab === 'submission' && (
        <div className="space-y-6">
          {/* Current Submission status if already submitted */}
          {currentSubmission ? (
            <div className="bg-[#0e121a] border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold font-masonic text-amber-200">
                    Prancha de Trabalho Registrada
                  </h3>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                    currentSubmission.status === 'aprovada'
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                      : currentSubmission.status === 'necessita_correcao'
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {currentSubmission.status === 'aprovada'
                    ? 'Aprovada'
                    : currentSubmission.status === 'necessita_correcao'
                    ? 'Necessita Correção'
                    : 'Em Análise'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Título do Trabalho:</span>
                  <span className="font-semibold text-slate-200">{currentSubmission.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Arquivo:</span>
                  <span className="font-mono text-amber-400">{currentSubmission.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Data do Envio:</span>
                  <span className="text-slate-300">
                    {new Date(currentSubmission.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {currentSubmission.grade !== undefined && (
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-400">Nota Atribuída:</span>
                    <span className="text-amber-300 text-sm">{currentSubmission.grade}/100</span>
                  </div>
                )}
              </div>

              {/* Instructor Feedback if evaluated */}
              {currentSubmission.feedback && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                  <div className="text-xs font-bold text-amber-300 font-masonic">
                    Parecer do Instrutor ({currentSubmission.evaluatedByName || 'Corpo Docente'}):
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed italic">
                    "{currentSubmission.feedback}"
                  </p>
                  {currentSubmission.instructorOrientation && (
                    <p className="text-[11px] text-amber-200/80 leading-relaxed pt-2 border-t border-amber-500/20">
                      <strong>Orientação para os estudos:</strong> {currentSubmission.instructorOrientation}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {/* Submission Form */}
          <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center space-x-2 text-amber-300 font-masonic text-sm font-bold mb-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>
                {currentSubmission ? 'Reenviar Nova Prancha de Trabalho' : 'Submeter Peça de Arquitetura'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Elabore seu trabalho autoral referente a esta instrução em formato PDF, DOCX ou digite os comentários síntese abaixo.
            </p>

            {submissionSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Prancha de Trabalho enviada com sucesso! Ela será avaliada pelo corpo de instrutores.</span>
              </div>
            )}

            <form onSubmit={handlePranchaSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título da Prancha de Arquitetura *
                </label>
                <input
                  type="text"
                  required
                  value={pranchaTitle}
                  onChange={(e) => setPranchaTitle(e.target.value)}
                  placeholder="Ex: Reflexões sobre o Desbaste da Pedra Bruta na Vida Moderna"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resumo / Justificativa da Prancha
                </label>
                <textarea
                  rows={4}
                  value={pranchaComments}
                  onChange={(e) => setPranchaComments(e.target.value)}
                  placeholder="Apresente brevemente os pontos centrais explorados em seu trabalho..."
                  className="w-full p-3 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Arquivo do Trabalho (PDF, DOCX, TXT)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setPranchaFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500/30 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Tamanho máximo permitido: 10 MB.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
              >
                Enviar Prancha de Trabalho para Correção
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
