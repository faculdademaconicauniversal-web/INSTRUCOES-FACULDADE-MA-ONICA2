import React, { useState } from 'react';
import {
  PenTool,
  CheckCircle2,
  AlertCircle,
  Search,
  User,
  BookOpen,
  Award,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { QuizAttempt } from '../../types';

export const DiscursiveGradingView: React.FC = () => {
  const { userProfile: currentAdmin } = useAuth();
  const [attempts, setAttempts] = useState<QuizAttempt[]>(() => dataStore.getAllQuizAttempts());
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);
  const [gradePoints, setGradePoints] = useState<number>(10);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const pendingDiscursiveAttempts = attempts.filter((a) => a.hasPendingManualGrading);

  const handleSaveGrading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttempt || !currentAdmin) return;

    dataStore.gradeDiscursiveQuestion(
      selectedAttempt.id,
      gradePoints,
      feedbackText,
      currentAdmin.fullName
    );

    setFeedback(`Correção da questão dissertativa registrada com sucesso!`);
    setTimeout(() => setFeedback(null), 3000);
    setSelectedAttempt(null);
    setAttempts(dataStore.getAllQuizAttempts());
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b1418] via-[#141018] to-black border border-red-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-red-400 text-xs font-bold uppercase tracking-wider font-masonic mb-1">
            <PenTool className="w-4 h-4" />
            <span>Avaliação de Respostas Abertas</span>
          </div>
          <h1 className="text-2xl font-bold font-masonic text-slate-100">
            Correção de Questões Dissertativas
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Examine as dissertações e reflexões livres escritas pelos irmãos durante os questionários de 10 questões, atribuindo pontuação de 0 a 10 pontos.
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center shrink-0">
          <span className="text-[10px] text-slate-400 uppercase block">Aguardando Parecer</span>
          <span className="text-xl font-bold font-masonic text-amber-400">
            {pendingDiscursiveAttempts.length}
          </span>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* List */}
      {pendingDiscursiveAttempts.length === 0 ? (
        <div className="bg-[#0e121a] border border-slate-800 rounded-2xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500/60 mx-auto mb-3" />
          <h3 className="text-base font-bold font-masonic text-slate-200">
            Todas as questões dissertativas estão corrigidas!
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Não há questionários pendentes de avaliação manual no momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pendingDiscursiveAttempts.map((att) => {
            return (
              <div
                key={att.id}
                className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      Grau 0{att.degreeNumber}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(att.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold font-masonic text-slate-100 mb-1">
                    {att.lessonTitle}
                  </h3>

                  <p className="text-xs text-slate-400">
                    Irmão: <strong className="text-slate-200">{att.userName}</strong>
                  </p>

                  <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-[10px] text-amber-400 font-bold uppercase block font-masonic">
                      Resposta Dissertativa do Irmão:
                    </span>
                    <p className="text-xs text-slate-200 italic leading-relaxed">
                      "{att.discursiveAnswer || 'Texto da dissertação reflexiva inserido pelo irmão...'}"
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Pontos objetivos: <strong className="text-emerald-400">{att.score} pts</strong>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedAttempt(att);
                      setGradePoints(10);
                      setFeedbackText('Excelente síntese reflexiva sobre a retidão moral e a simbologia do grau.');
                    }}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                  >
                    Avaliar Resposta
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grading Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#111520] border border-amber-500/35 rounded-2xl shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <PenTool className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold font-masonic text-amber-200">
                  Avaliar Dissertação: {selectedAttempt.userName}
                </h3>
              </div>
              <button onClick={() => setSelectedAttempt(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="text-slate-400">
                Instrução: <strong className="text-slate-200">{selectedAttempt.lessonTitle}</strong>
              </div>
              <div className="text-slate-200 italic p-2 rounded bg-black/30">
                "{selectedAttempt.discursiveAnswer || 'Resposta reflexiva do irmão...'}"
              </div>
            </div>

            <form onSubmit={handleSaveGrading} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nota da Questão Dissertativa (0 a 10 pontos) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  required
                  value={gradePoints}
                  onChange={(e) => setGradePoints(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-bold focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Comentário do Instrutor</label>
                <textarea
                  rows={3}
                  required
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Considerações sobre a resposta do irmão..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAttempt(null)}
                  className="px-4 py-2 font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  Confirmar Correção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
