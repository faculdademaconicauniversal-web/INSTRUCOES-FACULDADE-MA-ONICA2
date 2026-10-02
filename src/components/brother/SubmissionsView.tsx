import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Plus,
  ArrowRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { Submission } from '../../types';

interface SubmissionsViewProps {
  onNavigate: (view: string, payload?: any) => void;
}

export const SubmissionsView: React.FC<SubmissionsViewProps> = ({ onNavigate }) => {
  const { userProfile, isAdmin, isInstructor } = useAuth();
  if (!userProfile) return null;

  const submissions = dataStore.getSubmissionsByUser(userProfile.id);
  const lessons = dataStore.getLessons(userProfile.degree, isAdmin || isInstructor);

  const [statusFilter, setStatusFilter] = useState<'all' | 'aprovada' | 'em_analise' | 'necessita_correcao'>('all');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // New Submission Modal Form State
  const [selectedLessonId, setSelectedLessonId] = useState(lessons[0]?.id || '');
  const [title, setTitle] = useState('');
  const [comments, setComments] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const filtered = submissions.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  const handleSubmitNewPrancha = (e: React.FormEvent) => {
    e.preventDefault();
    const lesson = lessons.find((l) => l.id === selectedLessonId);
    if (!lesson || !title.trim()) return;

    dataStore.submitPrancha({
      userId: userProfile.id,
      userName: userProfile.fullName,
      userDegree: userProfile.degree,
      userLodge: userProfile.lodge,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      degreeNumber: lesson.degreeNumber,
      title,
      comments,
      fileName: file ? file.name : `Prancha_${lesson.order}_${userProfile.fullName.replace(/\s+/g, '_')}.pdf`,
      fileType: file ? file.type : 'application/pdf',
      fileSize: file ? file.size : 1024 * 768,
    });

    setShowSubmitModal(false);
    setTitle('');
    setComments('');
    setFile(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#121622] via-[#0e121a] to-black border border-amber-500/20 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-masonic mb-1">
            <FileText className="w-4 h-4" />
            <span>Peças de Arquitetura</span>
          </div>
          <h1 className="text-2xl font-bold font-masonic text-slate-100">
            Minhas Pranchas de Trabalho
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Submeta seus trabalhos autorais para avaliação pelo corpo docente e acompanhe os pareceres fraternais.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Enviar Nova Prancha</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            statusFilter === 'all'
              ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          Todas ({submissions.length})
        </button>
        <button
          onClick={() => setStatusFilter('aprovada')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            statusFilter === 'aprovada'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          Aprovadas ({submissions.filter((s) => s.status === 'aprovada').length})
        </button>
        <button
          onClick={() => setStatusFilter('em_analise')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            statusFilter === 'em_analise'
              ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          Em Análise ({submissions.filter((s) => s.status === 'em_analise' || s.status === 'enviada').length})
        </button>
        <button
          onClick={() => setStatusFilter('necessita_correcao')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            statusFilter === 'necessita_correcao'
              ? 'bg-rose-500 text-slate-950 shadow-md font-bold'
              : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          Necessitam Correção ({submissions.filter((s) => s.status === 'necessita_correcao').length})
        </button>
      </div>

      {/* Submissions List */}
      {filtered.length === 0 ? (
        <div className="bg-[#0e121a] border border-slate-800 rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold font-masonic text-slate-300">
            Nenhuma prancha de trabalho neste filtro
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Envie sua primeira peça de arquitetura referente às instruções estudadas.
          </p>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
          >
            Submeter Prancha
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((sub) => {
            return (
              <div
                key={sub.id}
                onClick={() => setSelectedSubmission(sub)}
                className="bg-[#0f131d] hover:bg-[#121724] border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      Grau 0{sub.degreeNumber}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        sub.status === 'aprovada'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                          : sub.status === 'necessita_correcao'
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {sub.status === 'aprovada'
                        ? 'Aprovada'
                        : sub.status === 'necessita_correcao'
                        ? 'Necessita Correção'
                        : 'Em Análise'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold font-masonic text-slate-100 group-hover:text-amber-200 transition-colors line-clamp-2 mb-2">
                    {sub.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {sub.lessonTitle}
                  </p>

                  {sub.comments && (
                    <p className="text-[11px] text-slate-500 italic line-clamp-2 mb-4">
                      "{sub.comments}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-mono text-[11px] text-slate-500 truncate max-w-[140px]">
                      {sub.fileName}
                    </span>
                    {sub.grade !== undefined && (
                      <span className="font-bold text-amber-300">
                        Nota: {sub.grade}/100
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{new Date(sub.createdAt).toLocaleDateString('pt-BR')}</span>
                    <span className="text-amber-400 group-hover:underline flex items-center space-x-1">
                      <span>Ver Parecer</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Selected Submission Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#111520] border border-amber-500/35 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold font-masonic text-amber-200">
                  Parecer da Prancha de Trabalho
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Título:</span>
                <span className="font-semibold text-slate-200">{selectedSubmission.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Instrução Vinculada:</span>
                <span className="font-medium text-slate-300">{selectedSubmission.lessonTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Arquivo:</span>
                <span className="font-mono text-amber-400">{selectedSubmission.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-amber-300 uppercase text-[11px]">
                  {selectedSubmission.status}
                </span>
              </div>
              {selectedSubmission.grade !== undefined && (
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Nota Final:</span>
                  <span className="text-amber-300">{selectedSubmission.grade}/100</span>
                </div>
              )}
            </div>

            {selectedSubmission.feedback && (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/25 space-y-2 text-xs">
                <div className="font-bold font-masonic text-amber-300">
                  Comentário do Instrutor ({selectedSubmission.evaluatedByName || 'Docência'}):
                </div>
                <p className="text-slate-200 italic leading-relaxed">
                  "{selectedSubmission.feedback}"
                </p>
                {selectedSubmission.instructorOrientation && (
                  <p className="text-[11px] text-amber-200/80 pt-2 border-t border-amber-500/20 leading-relaxed">
                    <strong>Orientação de estudo:</strong> {selectedSubmission.instructorOrientation}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => setSelectedSubmission(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      )}

      {/* Submit New Prancha Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#111520] border border-amber-500/35 rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold font-masonic text-amber-200">
                  Nova Prancha de Trabalho
                </h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNewPrancha} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Selecione a Instrução de Referência *
                </label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      Grau {l.degreeNumber} • Instrução 0{l.order}: {l.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título da Peça de Arquitetura *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: A Geometria Sagrada e os Três Pilares Morais"
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resumo / Comentários
                </label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Síntese das reflexões apresentadas..."
                  className="w-full p-3 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Anexo do Trabalho (PDF, DOCX)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-300"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md"
                >
                  Enviar Prancha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
