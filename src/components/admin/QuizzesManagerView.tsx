import React, { useState } from 'react';
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  BookOpen,
  Sparkles,
  Layers,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { Lesson, QuizQuestion } from '../../types';

export const QuizzesManagerView: React.FC = () => {
  const { userProfile: currentAdmin } = useAuth();
  const lessons = dataStore.getLessons(99, true);

  const [selectedLessonId, setSelectedLessonId] = useState<string>(lessons[0]?.id || '');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<{ id: string; prompt: string } | null>(null);

  const selectedLesson = lessons.find((l) => l.id === selectedLessonId);
  const questions = selectedLesson ? dataStore.getQuestionsByLesson(selectedLesson.id) : [];

  // Edit / Add Question Modal State
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<'multiple_choice' | 'true_false' | 'written'>('multiple_choice');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectAnswer, setQCorrectAnswer] = useState('0');
  const [qExplanation, setQExplanation] = useState('');
  const [qPoints, setQPoints] = useState(10);

  const openNewQuestion = () => {
    setEditingQuestionId(null);
    setQText('');
    setQType('multiple_choice');
    setQOptions(['Opção A', 'Opção B', 'Opção C', 'Opção D']);
    setQCorrectAnswer('0');
    setQExplanation('Justificativa fundamentada na doutrina maçônica...');
    setQPoints(10);
    setIsEditingQuestion(true);
  };

  const openEditQuestion = (q: QuizQuestion) => {
    setEditingQuestionId(q.id);
    setQText(q.prompt || q.question || '');
    setQType(q.type);
    setQOptions(q.options || ['', '', '', '']);
    setQCorrectAnswer(q.correctAnswer || '0');
    setQExplanation(q.explanation || '');
    setQPoints(q.points);
    setIsEditingQuestion(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson) return;

    const newQuestion: QuizQuestion = {
      id: editingQuestionId || `q_${selectedLesson.id}_${Date.now()}`,
      lessonId: selectedLesson.id,
      order: editingQuestionId ? (questions.find((q) => q.id === editingQuestionId)?.order || 1) : questions.length + 1,
      type: qType,
      question: qText,
      prompt: qText,
      options: qType === 'multiple_choice' ? qOptions : qType === 'true_false' ? ['Verdadeiro', 'Falso'] : undefined,
      correctAnswer: qType === 'written' ? undefined : qCorrectAnswer,
      explanation: qExplanation,
      points: qPoints,
    };

    dataStore.saveQuestion(newQuestion, currentAdmin?.fullName || 'Administrador');
    setFeedback(`Questão salva com sucesso!`);
    setTimeout(() => setFeedback(null), 3000);
    setIsEditingQuestion(false);
  };

  const handleDeleteQuestion = (qId: string, promptText: string) => {
    setDeletingQuestion({ id: qId, prompt: promptText });
  };

  const confirmDeleteQuestion = () => {
    if (!deletingQuestion) return;
    const success = dataStore.deleteQuestion(deletingQuestion.id, currentAdmin?.fullName || 'Administrador');
    if (success) {
      setFeedback('Questão removida com sucesso.');
    } else {
      setFeedback('Não foi possível remover a questão.');
    }
    setTimeout(() => setFeedback(null), 3000);
    setDeletingQuestion(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b1418] via-[#141018] to-black border border-red-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-red-400 text-xs font-bold uppercase tracking-wider font-masonic mb-1">
            <HelpCircle className="w-4 h-4" />
            <span>Banco de Questões Avaliativas</span>
          </div>
          <h1 className="text-2xl font-bold font-masonic text-slate-100">
            Gestão de Questionários (10 Questões por Instrução)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Configure as 10 perguntas obrigatórias de cada instrução, abrangendo múltipla escolha, verdadeiro/falso e dissertações reflexivas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openNewQuestion}
            disabled={!selectedLesson}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Questão</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Select Lesson Selector */}
      <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-auto flex-1">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Selecione a Instrução para Configurar o Questionário:
          </label>
          <select
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-semibold focus:border-amber-400"
          >
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                Grau 0{l.degreeNumber} • Instrução 0{l.order}: {l.title}
              </option>
            ))}
          </select>
        </div>

        {/* 10-Question Target Indicator */}
        <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-center shrink-0">
          <span className="text-[10px] text-slate-400 uppercase block">Meta de Questões</span>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span
              className={`text-lg font-bold font-masonic ${
                questions.length === 10
                  ? 'text-emerald-400'
                  : questions.length < 10
                  ? 'text-amber-400'
                  : 'text-blue-400'
              }`}
            >
              {questions.length} / 10
            </span>
            {questions.length === 10 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            )}
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="bg-[#0e121a] border border-slate-800 rounded-2xl p-12 text-center">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold font-masonic text-slate-300">
              Nenhuma questão cadastrada para esta instrução
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Cada instrução requer exatamente 10 questões para compor o exame avaliativo de 100 pontos.
            </p>
            <button
              onClick={openNewQuestion}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
            >
              Criar 1ª Questão
            </button>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-5 shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold uppercase text-slate-400">
                    {q.type === 'multiple_choice'
                      ? 'Múltipla Escolha'
                      : q.type === 'true_false'
                      ? 'Verdadeiro / Falso'
                      : 'Dissertativa Reflexiva'}
                  </span>
                  <span className="text-xs font-bold text-amber-400">({q.points} pts)</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => openEditQuestion(q)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-amber-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q.id, q.prompt || q.question || 'Questão')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 transition-colors"
                    title="Excluir Questão"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-slate-100">
                {q.prompt || q.question}
              </p>

              {q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = String(oIdx) === String(q.correctAnswer);
                    return (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          isCorrect
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 font-semibold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span>{opt}</span>
                        {isCorrect && (
                          <span className="text-[10px] text-emerald-400 font-bold uppercase ml-2">
                            Correta ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.explanation && (
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-200/90 italic">
                  <strong>Fundamentação:</strong> {q.explanation}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Edit / Add Question Modal */}
      {isEditingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#111520] border border-amber-500/35 rounded-2xl shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold font-masonic text-amber-200">
                  {editingQuestionId ? 'Editar Questão' : 'Nova Questão'}
                </h3>
              </div>
              <button onClick={() => setIsEditingQuestion(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">Tipo de Questão *</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
                  >
                    <option value="multiple_choice">Múltipla Escolha (4 Alternativas)</option>
                    <option value="true_false">Verdadeiro ou Falso</option>
                    <option value="written">Dissertativa / Reflexão Escrita</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Pontos *</label>
                  <input
                    type="number"
                    value={qPoints}
                    onChange={(e) => setQPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Enunciado da Pergunta *</label>
                <textarea
                  rows={3}
                  required
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Formule a indagação filosófica ou doutrinária..."
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
                />
              </div>

              {qType === 'multiple_choice' && (
                <div className="space-y-2.5">
                  <label className="block font-semibold text-slate-300">
                    Alternativas (Selecione a correta no rádio)
                  </label>
                  {qOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={qCorrectAnswer === String(idx)}
                        onChange={() => setQCorrectAnswer(String(idx))}
                        className="w-4 h-4 text-amber-500 focus:ring-amber-400"
                      />
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...qOptions];
                          newOpts[idx] = e.target.value;
                          setQOptions(newOpts);
                        }}
                        placeholder={`Alternativa ${idx + 1}`}
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
                      />
                    </div>
                  ))}
                </div>
              )}

              {qType === 'true_false' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Resposta Correta</label>
                  <select
                    value={qCorrectAnswer}
                    onChange={(e) => setQCorrectAnswer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
                  >
                    <option value="0">Verdadeiro</option>
                    <option value="1">Falso</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Justificativa / Fundamentação Doutrinária (Exibida após a resposta)
                </label>
                <textarea
                  rows={2}
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  placeholder="Explicação dos ensinamentos que justificam o gabarito..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingQuestion(false)}
                  className="px-4 py-2 font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  Salvar Questão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Question */}
      {deletingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#121016] border border-rose-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-900/40 pb-3">
              <div className="flex items-center space-x-2.5 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold font-masonic text-rose-200">
                  Excluir Questão Avaliativa
                </h3>
              </div>
              <button
                onClick={() => setDeletingQuestion(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Tem certeza de que deseja remover esta questão do questionário?
              </p>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-medium text-amber-200 text-xs">
                "{deletingQuestion.prompt}"
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingQuestion(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteQuestion}
                className="px-5 py-2 text-xs rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-950/50 flex items-center space-x-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Questão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
