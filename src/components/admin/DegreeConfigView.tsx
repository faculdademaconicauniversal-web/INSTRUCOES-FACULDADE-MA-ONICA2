import React, { useState } from 'react';
import {
  Sliders,
  Layers,
  CheckCircle2,
  Lock,
  Unlock,
  Edit2,
  Plus,
  Shield,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { Degree } from '../../types';

export const DegreeConfigView: React.FC = () => {
  const { userProfile: currentAdmin } = useAuth();
  const [degrees, setDegrees] = useState<Degree[]>(() => dataStore.getDegrees());
  const [editingDeg, setEditingDeg] = useState<Degree | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Edit fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allowPrevious, setAllowPrevious] = useState(true);
  const [passingGrade, setPassingGrade] = useState(70);
  const [requireSubmission, setRequireSubmission] = useState(true);

  const openEdit = (deg: Degree) => {
    setEditingDeg(deg);
    setName(deg.name);
    setDescription(deg.description);
    setAllowPrevious(deg.allowPreviousDegrees);
    setPassingGrade(deg.passingGrade || 70);
    setRequireSubmission(deg.requireSubmissionApproval ?? true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeg) return;

    dataStore.updateDegree(
      editingDeg.id,
      {
        name,
        description,
        allowPreviousDegrees: allowPrevious,
        passingGrade,
        requireSubmissionApproval: requireSubmission,
      },
      currentAdmin?.fullName || 'Administrador'
    );

    setFeedback(`Configurações do Grau 0${editingDeg.degreeNumber} atualizadas com sucesso.`);
    setTimeout(() => setFeedback(null), 3000);
    setEditingDeg(null);
    setDegrees(dataStore.getDegrees());
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b1418] via-[#141018] to-black border border-red-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-red-400 text-xs font-bold uppercase tracking-wider font-masonic mb-1">
            <Sliders className="w-4 h-4" />
            <span>Estrutura de Acesso & Parâmetros</span>
          </div>
          <h1 className="text-2xl font-bold font-masonic text-slate-100">
            Graus & Regras de Acesso
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Configure as regras de visualização cumulativa de graus anteriores, nota mínima de aprovação e exigência de pranchas.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Degrees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {degrees.map((deg) => (
          <div
            key={deg.id}
            className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-6 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-slate-900 border border-amber-500/30 flex items-center justify-center font-masonic font-black text-xl text-amber-300">
                    0{deg.degreeNumber}
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-masonic text-slate-100">
                      {deg.name}
                    </h2>
                    <p className="text-xs text-slate-400">{deg.totalLessons} instruções cadastradas</p>
                  </div>
                </div>

                <button
                  onClick={() => openEdit(deg)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-amber-500/20 text-amber-400 border border-slate-800 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">{deg.description}</p>

              {/* Rules List */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Acesso a graus anteriores:</span>
                  <span
                    className={`font-semibold ${
                      deg.allowPreviousDegrees ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {deg.allowPreviousDegrees ? 'Permitido (Cumulativo)' : 'Apenas este grau'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Nota mínima no questionário:</span>
                  <span className="font-bold text-amber-300">{deg.passingGrade || 70} pontos</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Exige Prancha Aprovada p/ Certificado:</span>
                  <span className="font-semibold text-emerald-400">
                    {deg.requireSubmissionApproval ? 'Sim (Obrigatório)' : 'Opcional'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800/80 flex justify-between items-center text-[11px] text-slate-500">
              <span>Grau Maçônico Regular</span>
              <button
                onClick={() => openEdit(deg)}
                className="text-amber-400 font-semibold hover:underline"
              >
                Editar Parâmetros
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Degree Modal */}
      {editingDeg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#111520] border border-amber-500/35 rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold font-masonic text-amber-200">
                  Configurar Grau 0{editingDeg.degreeNumber}
                </h3>
              </div>
              <button onClick={() => setEditingDeg(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nome do Grau</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nota Mínima para Aprovação (0 a 100)
                </label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={passingGrade}
                  onChange={(e) => setPassingGrade(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-bold focus:border-amber-400"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowPrevious}
                    onChange={(e) => setAllowPrevious(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-800 border-slate-700"
                  />
                  <span className="text-slate-200">
                    Permitir que o irmão acesse instruções de graus anteriores
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireSubmission}
                    onChange={(e) => setRequireSubmission(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-800 border-slate-700"
                  />
                  <span className="text-slate-200">
                    Exigir Prancha de Trabalho aprovada para emissão de Certificado
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDeg(null)}
                  className="px-4 py-2 font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                >
                  Salvar Parâmetros
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
