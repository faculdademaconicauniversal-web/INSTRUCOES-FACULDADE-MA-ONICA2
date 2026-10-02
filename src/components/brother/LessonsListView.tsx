import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Headphones,
  Video,
  FileText,
  HelpCircle,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { Lesson } from '../../types';

interface LessonsListViewProps {
  initialDegree?: number;
  selectedDegreeFilter?: number;
  onNavigate: (view: string, payload?: any) => void;
}

export const LessonsListView: React.FC<LessonsListViewProps> = ({
  initialDegree,
  selectedDegreeFilter,
  onNavigate,
}) => {
  const { userProfile, hasAccessToDegree, isAdmin, isInstructor } = useAuth();

  if (!userProfile) return null;

  const degrees = dataStore.getDegrees();
  const allLessons = dataStore.getLessons(userProfile.degree, isAdmin || isInstructor);
  const allModules = dataStore.getModules();
  const userAttempts = dataStore.getQuizAttemptsByUser(userProfile.id);
  const userSubmissions = dataStore.getSubmissionsByUser(userProfile.id);

  const effectiveInitialDegree = selectedDegreeFilter !== undefined ? selectedDegreeFilter : initialDegree;

  // States
  const [selectedDegree, setSelectedDegree] = useState<number | 'all'>(
    effectiveInitialDegree !== undefined ? effectiveInitialDegree : userProfile.degree
  );
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Update selectedDegree if prop changes
  useEffect(() => {
    if (selectedDegreeFilter !== undefined) {
      setSelectedDegree(selectedDegreeFilter);
      setSelectedModule('all');
    }
  }, [selectedDegreeFilter]);

  // Filter modules based on selected degree
  const visibleModules = selectedDegree === 'all'
    ? allModules
    : allModules.filter((m) => m.degreeNumber === selectedDegree);

  // Filter lessons
  const filteredLessons = allLessons.filter((lesson) => {
    // Degree filter
    if (selectedDegree !== 'all' && lesson.degreeNumber !== selectedDegree) {
      return false;
    }
    // Module filter
    if (selectedModule !== 'all' && lesson.moduleId !== selectedModule) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = lesson.title.toLowerCase().includes(q);
      const matchSummary = lesson.summary.toLowerCase().includes(q);
      const matchModule = lesson.moduleTitle.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary && !matchModule) return false;
    }
    // Status filter
    const passedQuiz = userAttempts.some((a) => a.lessonId === lesson.id && a.isPassed);
    const approvedSub = userSubmissions.some(
      (s) => s.lessonId === lesson.id && s.status === 'aprovada'
    );
    const isCompleted = passedQuiz && approvedSub;

    if (statusFilter === 'completed' && !isCompleted) return false;
    if (statusFilter === 'pending' && isCompleted) return false;

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#121622] via-[#0e121a] to-black border border-amber-500/20 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-masonic mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Biblioteca de Instruções</span>
          </div>
          <h1 className="text-2xl font-bold font-masonic text-slate-100">
            Instruções por Grau Maçônico
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Aprofunde seus conhecimentos através do estudo ordenado das peças de arquitetura, áudios, questionários e envio de pranchas.
          </p>
        </div>

        {/* Degree Quick Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
          <button
            onClick={() => {
              setSelectedDegree('all');
              setSelectedModule('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedDegree === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos Autorizados
          </button>
          {degrees.map((deg) => {
            const hasAccess = hasAccessToDegree(deg.degreeNumber);
            if (!hasAccess && !isAdmin && !isInstructor) return null;

            return (
              <button
                key={deg.id}
                onClick={() => {
                  setSelectedDegree(deg.degreeNumber);
                  setSelectedModule('all');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDegree === deg.degreeNumber
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Grau 0{deg.degreeNumber}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar instrução, termo filosófico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Module filter */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">
              {selectedDegree === 'all' ? 'Todos os Módulos' : `Módulos do Grau 0${selectedDegree}`}
            </option>
            {visibleModules.map((m) => (
              <option key={m.id} value={m.id}>
                Grau {m.degreeNumber} • {m.title}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">Todos os Status</option>
            <option value="completed">Concluídas</option>
            <option value="pending">Pendentes</option>
          </select>
        </div>
      </div>

      {/* Lessons List Grid */}
      {filteredLessons.length === 0 ? (
        <div className="bg-[#0e121a] border border-slate-800 rounded-2xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold font-masonic text-slate-300">
            Nenhuma instrução encontrada
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Verifique os filtros selecionados ou selecione outro grau autorizado no topo da página.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => {
            const passedQuiz = userAttempts.find(
              (a) => a.lessonId === lesson.id && a.isPassed
            );
            const userSub = userSubmissions.find((s) => s.lessonId === lesson.id);
            const isCompleted = !!passedQuiz && userSub?.status === 'aprovada';

            return (
              <div
                key={lesson.id}
                className="bg-[#0f131d] hover:bg-[#121724] border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        Grau 0{lesson.degreeNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Instrução 0{lesson.order}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {lesson.audioUrl && (
                        <span title="Áudio da Instrução" className="p-1 rounded bg-slate-800 text-amber-400">
                          <Headphones className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {lesson.videoUrl && (
                        <span title="Vídeo Aula" className="p-1 rounded bg-slate-800 text-rose-400">
                          <Video className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <h3 className="text-sm font-bold font-masonic text-slate-100 group-hover:text-amber-200 transition-colors line-clamp-2 mb-2">
                    {lesson.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">
                    {lesson.summary}
                  </p>

                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 mb-4">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lesson.estimatedMinutes} min de estudo</span>
                    <span>•</span>
                    <span className="truncate">{lesson.moduleTitle}</span>
                  </div>
                </div>

                {/* Status Footnote & Action Button */}
                <div className="pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-3 text-[11px]">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-500">Questionário:</span>
                      {passedQuiz ? (
                        <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{passedQuiz.score}/100</span>
                        </span>
                      ) : (
                        <span className="text-amber-400/80">Pendente</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-500">Prancha:</span>
                      {userSub ? (
                        <span
                          className={`font-semibold ${
                            userSub.status === 'aprovada'
                              ? 'text-emerald-400'
                              : userSub.status === 'necessita_correcao'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {userSub.status === 'aprovada'
                            ? 'Aprovada'
                            : userSub.status === 'necessita_correcao'
                            ? 'Corrigir'
                            : 'Em Análise'}
                        </span>
                      ) : (
                        <span className="text-slate-500">Não enviada</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('lesson-detail', { lessonId: lesson.id })}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center space-x-2"
                  >
                    <span>Estudar Instrução</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
