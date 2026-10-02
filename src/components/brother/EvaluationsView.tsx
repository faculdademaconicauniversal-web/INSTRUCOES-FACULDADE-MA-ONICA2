import React, { useState } from 'react';
import {
  CheckSquare,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';

interface EvaluationsViewProps {
  onNavigate: (view: string, payload?: any) => void;
}

export const EvaluationsView: React.FC<EvaluationsViewProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  if (!userProfile) return null;

  const attempts = dataStore.getQuizAttemptsByUser(userProfile.id);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  const selectedAttempt = attempts.find((a) => a.id === selectedAttemptId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#121622] via-[#0e121a] to-black border border-amber-500/20 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-masonic mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Registro de Desempenho</span>
          </div>
          <h1 className="text-2xl font-bold font-masonic text-slate-100">
            Minhas Avaliações & Questionários
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Acompanhe o histórico de todas as suas avaliações de 10 questões, notas obtidas e pareceres das questões dissertativas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Total Realizadas</span>
            <span className="text-lg font-bold font-masonic text-amber-300">
              {attempts.length}
            </span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Aprovadas</span>
            <span className="text-lg font-bold font-masonic text-emerald-400">
              {attempts.filter((a) => a.isPassed).length}
            </span>
          </div>
        </div>
      </div>

      {/* Attempts List */}
      {attempts.length === 0 ? (
        <div className="bg-[#0e121a] border border-slate-800 rounded-2xl p-12 text-center">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold font-masonic text-slate-300">
            Nenhuma avaliação realizada até o momento
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4 max-w-sm mx-auto">
            Acesse as instruções do seu grau e responda aos questionários avaliativos.
          </p>
          <button
            onClick={() => onNavigate('lessons')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
          >
            Ver Instruções
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: List of attempts */}
          <div className="lg:col-span-2 space-y-3">
            {attempts.map((att) => {
              const isSelected = att.id === selectedAttemptId;

              return (
                <div
                  key={att.id}
                  onClick={() => setSelectedAttemptId(att.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950/20 border-amber-500/50 shadow-md'
                      : 'bg-[#0e121a] border-slate-800 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        Grau 0{att.degreeNumber}
                      </span>
                      <span className="text-xs text-slate-400">
                        Tentativa #{att.attemptNumber}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          att.isPassed
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {att.isPassed ? 'Aprovado' : 'Não Aprovado'}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold font-masonic text-slate-100 mb-2">
                    {att.lessonTitle}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center space-x-3">
                      <span>Nota: <strong className="text-amber-300">{att.score}/100</strong></span>
                      <span>Acertos: <strong className="text-emerald-400">{att.correctCount}/10</strong></span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {new Date(att.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right 1 Col: Selected Attempt Details */}
          <div>
            {selectedAttempt ? (
              <div className="bg-[#0e121a] border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-4 sticky top-24">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold font-masonic text-amber-200">
                      Detalhes da Avaliação
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-amber-400">
                    Nota {selectedAttempt.score}/100
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Instrução:</span>
                    <span className="text-slate-200 font-semibold">{selectedAttempt.lessonTitle}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Acertos:</span>
                      <span className="text-emerald-400 font-bold text-base">{selectedAttempt.correctCount} / 10</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Erros:</span>
                      <span className="text-rose-400 font-bold text-base">{selectedAttempt.errorCount}</span>
                    </div>
                  </div>

                  {selectedAttempt.feedback && (
                    <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-slate-300 italic text-[11px] leading-relaxed">
                      "{selectedAttempt.feedback}"
                    </div>
                  )}

                  {selectedAttempt.gradedBy && (
                    <div className="text-[11px] text-slate-400">
                      Corrigido por: <span className="text-amber-300 font-semibold">{selectedAttempt.gradedBy}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onNavigate('lesson-detail', { lessonId: selectedAttempt.lessonId })}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                >
                  <span>Reabrir Instrução</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="bg-[#0e121a] border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
                Selecione uma avaliação à esquerda para visualizar os detalhes completos.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
