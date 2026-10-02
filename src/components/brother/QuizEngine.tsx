import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Award,
  AlertCircle,
  FileText,
  Sparkles,
  Send,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { Lesson, Question, QuizAttempt, UserAnswer } from '../../types';

interface QuizEngineProps {
  lesson: Lesson;
  onFinishQuiz: () => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({ lesson, onFinishQuiz }) => {
  const { userProfile } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selectedOption?: number; booleanAnswer?: boolean; textAnswer?: string }>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    const qs = dataStore.getQuestionsByLessonId(lesson.id);
    setQuestions(qs);
  }, [lesson.id]);

  if (!userProfile) return null;

  if (questions.length === 0) {
    return (
      <div className="bg-[#0e121a] border border-slate-800 rounded-2xl p-8 text-center">
        <HelpCircle className="w-12 h-12 text-amber-500/50 mx-auto mb-3" />
        <h3 className="text-base font-bold font-masonic text-slate-200">
          Questionário em Elaboração
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          O banco de 10 questões avaliativas para esta instrução está sendo atualizado pelo Corpo Docente.
        </p>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  const handleSelectOption = (optIdx: number) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        selectedOption: optIdx,
      },
    }));
  };

  const handleSelectBoolean = (val: boolean) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        booleanAnswer: val,
      },
    }));
  };

  const handleTextAnswerChange = (val: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        textAnswer: val,
      },
    }));
  };

  const handleSubmitQuiz = () => {
    // Grade the attempt
    const userAnswersList: UserAnswer[] = [];
    let autoScore = 0;
    let correctCount = 0;
    let hasPendingManual = false;

    questions.forEach((q) => {
      const uAns = answers[q.id];
      let isCorrect = false;
      let awardedPoints = 0;

      if (q.type === 'multiple_choice') {
        isCorrect = String(uAns?.selectedOption) === String(q.correctAnswer);
        if (isCorrect) {
          awardedPoints = q.points;
          autoScore += q.points;
          correctCount++;
        }
      } else if (q.type === 'true_false') {
        const isTrueCorrect = q.correctAnswer === '0' || q.correctAnswer === 'true' || q.correctAnswer === 'Verdadeiro';
        isCorrect = uAns?.booleanAnswer === isTrueCorrect;
        if (isCorrect) {
          awardedPoints = q.points;
          autoScore += q.points;
          correctCount++;
        }
      } else if (q.type === 'written') {
        hasPendingManual = true;
        // Temporary award baseline points if answered richly
        if (uAns?.textAnswer && uAns.textAnswer.length > 20) {
          awardedPoints = q.points; // will be reviewed by instructor
          autoScore += q.points;
          isCorrect = true;
          correctCount++;
        }
      }

      userAnswersList.push({
        questionId: q.id,
        questionType: q.type,
        selectedOption: uAns?.selectedOption,
        booleanAnswer: uAns?.booleanAnswer,
        writtenAnswer: uAns?.textAnswer,
        isCorrect,
        awardedPoints,
      });
    });

    const isPassed = autoScore >= 70;

    const attempt = dataStore.submitQuizAttempt({
      userId: userProfile.id,
      userName: userProfile.fullName,
      userDegree: userProfile.degree,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      degreeNumber: lesson.degreeNumber,
      answers: userAnswersList,
      score: autoScore,
      correctCount,
      errorCount: totalQuestions - correctCount,
      isPassed,
      hasPendingManualGrading: hasPendingManual,
      status: hasPendingManual ? 'pending_review' : isPassed ? 'approved' : 'rejected',
      feedback: isPassed
        ? 'Excelente rendimento! Você demonstrou sólida compreensão dos princípios da instrução.'
        : 'Recomendamos a releitura atenta dos pontos fundamentais desta peça de arquitetura.',
    });

    setLatestAttempt(attempt);
    setIsSubmitted(true);

    if (isPassed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d4af37', '#f59e0b', '#ef4444', '#ffffff'],
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setIsSubmitted(false);
    setLatestAttempt(null);
    setCurrentIdx(0);
  };

  // --- RESULT VIEW ---
  if (isSubmitted && latestAttempt) {
    return (
      <div className="space-y-6">
        {/* Banner */}
        <div
          className={`rounded-2xl border p-6 text-center ${
            latestAttempt.isPassed
              ? 'bg-gradient-to-b from-emerald-950/40 via-[#10141e] to-black border-emerald-500/40'
              : 'bg-gradient-to-b from-amber-950/40 via-[#10141e] to-black border-amber-500/40'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-3 ${
              latestAttempt.isPassed
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
            }`}
          >
            {latestAttempt.isPassed ? <Award className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-masonic text-slate-100">
            {latestAttempt.isPassed ? 'Aprovado com Louvor!' : 'Avaliação Concluída'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-1">
            {latestAttempt.feedback}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-5 py-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Nota Obtida</span>
              <div className="text-2xl font-bold font-masonic text-amber-300">
                {latestAttempt.score}/100
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-5 py-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Acertos</span>
              <div className="text-2xl font-bold font-masonic text-emerald-400">
                {latestAttempt.correctCount} / {totalQuestions}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-5 py-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Nota Mínima</span>
              <div className="text-2xl font-bold font-masonic text-slate-300">70 pts</div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={handleRetake}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Refazer Avaliação</span>
            </button>
            <button
              onClick={onFinishQuiz}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg transition-all"
            >
              Continuar Estudos
            </button>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center space-x-2 text-amber-300 font-masonic text-sm font-bold border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Gabarito e Justificativas Filosóficas</span>
          </div>

          <div className="space-y-6">
            {questions.map((q, idx) => {
              const uAns = latestAttempt.answers.find((a) => a.questionId === q.id);
              const isCorrect = uAns?.isCorrect;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border ${
                    isCorrect
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-rose-950/20 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        Questão {idx + 1} de {totalQuestions}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">
                        ({q.type === 'multiple_choice' ? 'Múltipla Escolha' : q.type === 'true_false' ? 'Verdadeiro/Falso' : 'Discursiva'})
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 text-xs font-semibold">
                      {isCorrect ? (
                        <span className="text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Correta (+{q.points} pts)</span>
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center space-x-1">
                          <XCircle className="w-4 h-4" />
                          <span>Incorreta (0 pts)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm font-medium text-slate-200 mb-3">
                    {q.prompt || q.question || (q as any).statement}
                  </p>

                  {/* Options recap if multiple choice */}
                  {q.type === 'multiple_choice' && q.options && (
                    <div className="space-y-1.5 mb-3">
                      {q.options.map((opt, optIdx) => {
                        const isChosen = uAns?.selectedOption === optIdx;
                        const isTheCorrectOne = String(q.correctAnswer) === String(optIdx);

                        return (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-lg text-xs flex items-center justify-between ${
                              isTheCorrectOne
                                ? 'bg-emerald-900/40 text-emerald-200 border border-emerald-500/40 font-semibold'
                                : isChosen && !isTheCorrectOne
                                ? 'bg-rose-900/40 text-rose-200 border border-rose-500/40 line-through'
                                : 'bg-slate-900/40 text-slate-400'
                            }`}
                          >
                            <span>
                              {String.fromCharCode(65 + optIdx)}) {opt}
                            </span>
                            {isTheCorrectOne && (
                              <span className="text-[10px] text-emerald-300 font-bold">
                                Resposta Correta
                              </span>
                            )}
                            {isChosen && !isTheCorrectOne && (
                              <span className="text-[10px] text-rose-300">Sua Escolha</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Written Answer recap */}
                  {q.type === 'written' && (
                    <div className="mb-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                      <span className="text-slate-400 block mb-1">Sua Resposta:</span>
                      <p className="text-slate-200 italic">"{uAns?.writtenAnswer || 'Não respondida'}"</p>
                    </div>
                  )}

                  {/* Philosophical Explanation */}
                  {q.explanation && (
                    <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                      <span className="font-bold text-amber-300 font-masonic block mb-0.5">
                        Fundamento Simbólico:
                      </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- INTERACTIVE QUESTION RUNNER ---
  return (
    <div className="space-y-6">
      {/* Top Progress bar */}
      <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold font-masonic text-xs">
            {currentIdx + 1}
          </div>
          <div>
            <div className="text-xs font-bold font-masonic text-slate-100">
              Questão {currentIdx + 1} de {totalQuestions}
            </div>
            <div className="text-[11px] text-slate-400">
              {answeredCount} de {totalQuestions} respondidas
            </div>
          </div>
        </div>

        {/* Question Selector Quick Dots */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {questions.map((q, idx) => {
            const hasAns = answers[q.id] !== undefined;
            const isCurr = idx === currentIdx;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                  isCurr
                    ? 'bg-amber-500 text-slate-950 font-bold ring-2 ring-amber-400/50'
                    : hasAns
                    ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
                    : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Question Box */}
      <div className="bg-[#0e121a] border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30">
            {currentQ.type === 'multiple_choice'
              ? 'Múltipla Escolha'
              : currentQ.type === 'true_false'
              ? 'Verdadeiro ou Falso'
              : 'Questão Dissertativa'}
          </span>
          <span className="text-xs font-mono text-amber-400/80">
            Valor: {currentQ.points} pontos
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed mb-6">
          {currentQ.prompt || currentQ.question || (currentQ as any).statement}
        </h3>

        {/* Multiple choice options */}
        {currentQ.type === 'multiple_choice' && currentQ.options && (
          <div className="space-y-3">
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = answers[currentQ.id]?.selectedOption === optIdx;

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center space-x-3 ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-amber-500/60 text-amber-100 shadow-md font-medium'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </div>
                  <span className="text-xs sm:text-sm leading-relaxed">{opt}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* True / False options */}
        {currentQ.type === 'true_false' && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSelectBoolean(true)}
              className={`p-4 rounded-xl border text-center transition-all ${
                answers[currentQ.id]?.booleanAnswer === true
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-bold shadow-md'
                  : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
              <span className="text-sm font-semibold">Verdadeiro</span>
            </button>

            <button
              onClick={() => handleSelectBoolean(false)}
              className={`p-4 rounded-xl border text-center transition-all ${
                answers[currentQ.id]?.booleanAnswer === false
                  ? 'bg-rose-950/40 border-rose-500/60 text-rose-200 font-bold shadow-md'
                  : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <XCircle className="w-6 h-6 mx-auto mb-1 text-rose-400" />
              <span className="text-sm font-semibold">Falso</span>
            </button>
          </div>
        )}

        {/* Written question textarea */}
        {currentQ.type === 'written' && (
          <div>
            <textarea
              rows={5}
              placeholder="Digite aqui sua reflexão dissertativa fundamentada nos ensinamentos do Grau..."
              value={answers[currentQ.id]?.textAnswer || ''}
              onChange={(e) => handleTextAnswerChange(e.target.value)}
              className="w-full p-3.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 leading-relaxed"
            />
            <p className="text-[11px] text-slate-500 mt-1.5 italic">
              Esta questão será avaliada e comentada pelo Instrutor da sua Coluna.
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-xs font-semibold flex items-center space-x-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          {currentIdx < totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center space-x-2 transition-colors"
            >
              <span>Próxima</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmitQuiz}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-lg flex items-center space-x-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Finalizar e Enviar Avaliação</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
