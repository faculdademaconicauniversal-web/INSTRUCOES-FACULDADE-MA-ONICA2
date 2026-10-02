import React, { useState } from 'react';
import {
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Edit3,
  Sparkles,
  Eye,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { Submission, SubmissionStatus } from '../../types';

export const SubmissionReviewView: React.FC = () => {
  const { userProfile: currentAdmin } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>(() => dataStore.getAllSubmissions());
  const [statusFilter, setStatusFilter] = useState<'all' | SubmissionStatus>('all');
  const [degreeFilter, setDegreeFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Review Modal State
  const [reviewingSub, setReviewingSub] = useState<Submission | null>(null);
  const [grade, setGrade] = useState<number>(85);
  const [feedbackText, setFeedbackText] = useState('');
  const [orientationText, setOrientationText] = useState('');
  const [newStatus, setNewStatus] = useState<SubmissionStatus>('aprovada');

  const refreshSubmissions = () => {
    setSubmissions(dataStore.getAllSubmissions());
  };

  const openReviewModal = (sub: Submission) => {
    setReviewingSub(sub);
    setGrade(sub.grade !== undefined ? sub.grade : 85);
    setFeedbackText(sub.feedback || 'Excelente elaboração. A reflexão apresentada demonstra maturidade no estudo dos símbolos.');
    setOrientationText(sub.instructorOrientation || 'Recomenda-se a continuidade da leitura sobre a trilogia Liberdade, Igualdade e Fraternidade.');
    setNewStatus(sub.status === 'enviada' || sub.status === 'em_analise' ? 'aprovada' : sub.status);
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSub || !currentAdmin) return;

    dataStore.evaluatePrancha(
      reviewingSub.id,
      {
        status: newStatus,
        grade,
        feedback: feedbackText,
        instructorOrientation: orientationText,
      },
      currentAdmin.id,
      currentAdmin.fullName
    );

    setFeedback(`Avaliação da prancha do Ir. ${reviewingSub.userName} registrada com sucesso!`);
    setTimeout(() => setFeedback(null), 3000);
    setReviewingSub(null);
    refreshSubmissions();
  };

  const filtered = submissions.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (degreeFilter !== 'all' && s.degreeNumber !== degreeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !s.title.toLowerCase().includes(q) &&
        !s.userName.toLowerCase().includes(q) &&
        !s.lessonTitle.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b1418] via-[#141018] to-black border border-red-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-red-400 text-xs font-bold uppercase tracking-wider font-masonic mb-1">
            <FileCheck className="w-4 h-4" />
            <span>Tribunal Pedagógico & Docência</span>
          </div>
          <h1 className="text-2xl font-bold font-masonic text-slate-100">
            Correção de Pranchas de Trabalho
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Analise os trabalhos autorais submetidos pelos irmãos, atribua notas de 0 a 100 e forneça pareceres formativos e orientações de estudo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Aguardando Avaliação</span>
            <span className="text-xl font-bold font-masonic text-amber-400">
              {submissions.filter((s) => s.status === 'enviada' || s.status === 'em_analise').length}
            </span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-4 shadow-lg flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por irmão, título ou instrução..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-400"
          >
            <option value="all">Todos os Status</option>
            <option value="enviada">⏳ Aguardando Correção</option>
            <option value="em_analise">Em Análise</option>
            <option value="aprovada">✓ Aprovadas</option>
            <option value="necessita_correcao">⚠ Necessitam Correção</option>
          </select>

          <select
            value={degreeFilter}
            onChange={(e) => setDegreeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-400"
          >
            <option value="all">Todos os Graus</option>
            <option value={1}>Grau 01 (Aprendiz)</option>
            <option value={2}>Grau 02 (Companheiro)</option>
            <option value={3}>Grau 03 (Mestre)</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Irmão Autor</th>
                <th className="py-3 px-4">Trabalho / Instrução</th>
                <th className="py-3 px-4">Grau</th>
                <th className="py-3 px-4">Data Envio</th>
                <th className="py-3 px-4">Nota</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-100 text-xs">{sub.userName}</div>
                    <div className="text-[11px] text-slate-400">{sub.userLodge}</div>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-amber-200 text-xs line-clamp-1">{sub.title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{sub.lessonTitle}</div>
                    <div className="text-[10px] font-mono text-slate-500">{sub.fileName}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      Grau 0{sub.degreeNumber}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400">
                    {new Date(sub.createdAt).toLocaleDateString('pt-BR')}
                  </td>

                  <td className="py-3.5 px-4">
                    {sub.grade !== undefined ? (
                      <span className="font-bold text-amber-300">{sub.grade}/100</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
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
                        : 'Aguardando Avaliação'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openReviewModal(sub)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all"
                    >
                      Avaliar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {reviewingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#111520] border border-amber-500/35 rounded-2xl shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold font-masonic text-amber-200">
                  Avaliação da Peça de Arquitetura
                </h3>
              </div>
              <button onClick={() => setReviewingSub(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Submission Info Box */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Autor:</span>
                <span className="font-semibold text-slate-200">{reviewingSub.userName} ({reviewingSub.userLodge})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Título da Peça:</span>
                <span className="font-semibold text-amber-200">{reviewingSub.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Instrução:</span>
                <span className="text-slate-300">{reviewingSub.lessonTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Arquivo:</span>
                <span className="font-mono text-amber-400">{reviewingSub.fileName}</span>
              </div>
              {reviewingSub.comments && (
                <div className="pt-2 border-t border-slate-800 text-slate-300 italic">
                  "{reviewingSub.comments}"
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEvaluation} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status da Avaliação *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-bold focus:border-amber-400"
                  >
                    <option value="aprovada">✓ Aprovada (Prancha Aceita)</option>
                    <option value="necessita_correcao">⚠ Necessita Correção / Reenvio</option>
                    <option value="rejeitada">✕ Rejeitada</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nota Atribuída (0 a 100) *</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-bold focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Parecer Crítico do Instrutor *</label>
                <textarea
                  rows={3}
                  required
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Apresente as impressões sobre o rigor doutrinário, profundidade e linguagem..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Orientação Pedagógica / Bibliográfica Complementar</label>
                <textarea
                  rows={2}
                  value={orientationText}
                  onChange={(e) => setOrientationText(e.target.value)}
                  placeholder="Sugestões de leitura para o aprofundamento do irmão..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewingSub(null)}
                  className="px-4 py-2 font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  Registrar Avaliação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
