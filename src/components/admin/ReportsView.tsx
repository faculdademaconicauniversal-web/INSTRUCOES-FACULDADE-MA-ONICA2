import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  Users,
  Award,
  FileText,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { dataStore } from '../../lib/dataStore';

export const ReportsView: React.FC = () => {
  const users = dataStore.getUsers();
  const degrees = dataStore.getDegrees();
  const lessons = dataStore.getLessons(99, true);
  const quizAttempts = dataStore.getAllQuizAttempts();
  const submissions = dataStore.getAllSubmissions();
  const certificates = dataStore.getAllCertificates();

  const [selectedDegree, setSelectedDegree] = useState<number | 'all'>('all');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b1418] via-[#141018] to-black border border-red-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-red-400 text-xs font-bold uppercase tracking-wider font-masonic mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Inteligência Pedagógica & Estatísticas</span>
          </div>
          <h1 className="text-2xl font-bold font-masonic text-slate-100">
            Relatórios de Desempenho dos Graus
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Acompanhe as métricas de aproveitamento, distribuição de irmãos por grau, taxas de aprovação em questionários de 10 questões e emissão de certificados.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs shadow-md flex items-center space-x-2 transition-colors shrink-0 no-print"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>Imprimir Relatório</span>
        </button>
      </div>

      {/* Degree Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {degrees.map((deg) => {
          const brothersInDegree = users.filter((u) => u.degree === deg.degreeNumber);
          const attemptsInDegree = quizAttempts.filter((a) => a.degreeNumber === deg.degreeNumber);
          const submissionsInDegree = submissions.filter((s) => s.degreeNumber === deg.degreeNumber);
          const avgScore =
            attemptsInDegree.length > 0
              ? Math.round(
                  attemptsInDegree.reduce((acc, curr) => acc + curr.score, 0) / attemptsInDegree.length
                )
              : 0;

          return (
            <div
              key={deg.id}
              className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-5 shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-masonic text-amber-300">
                  Grau 0{deg.degreeNumber}
                </span>
                <span className="text-xs text-slate-400">{deg.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Irmãos no Grau</span>
                  <span className="text-base font-bold text-slate-100">{brothersInDegree.length}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Média nas Notas</span>
                  <span className="text-base font-bold text-amber-400">{avgScore > 0 ? `${avgScore}/100` : '—'}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Avaliações Realizadas:</span>
                  <span className="font-semibold text-slate-200">{attemptsInDegree.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pranchas Submetidas:</span>
                  <span className="font-semibold text-slate-200">{submissionsInDegree.length}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Brothers Performance Table */}
      <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold font-masonic text-amber-200">
          Quadro Geral de Irmãos e Aproveitamento
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Irmão</th>
                <th className="py-3 px-4">Loja / CIM</th>
                <th className="py-3 px-4">Grau</th>
                <th className="py-3 px-4">Instruções Vistas</th>
                <th className="py-3 px-4">Avaliações (Média)</th>
                <th className="py-3 px-4">Pranchas Aprovadas</th>
                <th className="py-3 px-4">Certificados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => {
                const userAttempts = quizAttempts.filter((a) => a.userId === u.id);
                const userSubs = submissions.filter((s) => s.userId === u.id);
                const userCerts = certificates.filter((c) => c.userId === u.id);
                const prog = dataStore.getUserProgress(u.id, u.degree);
                const avgScore =
                  userAttempts.length > 0
                    ? Math.round(
                        userAttempts.reduce((acc, curr) => acc + curr.score, 0) / userAttempts.length
                      )
                    : 0;

                return (
                  <tr key={u.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-4 font-semibold text-slate-100">{u.fullName}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{u.lodge}</div>
                      <div className="text-[10px] font-mono text-slate-500">{u.cimNumber}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        Grau 0{u.degree}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      {prog.completedLessons} / {prog.totalLessons} ({prog.progressPercent}%)
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-300">
                      {avgScore > 0 ? `${avgScore}/100` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      {userSubs.filter((s) => s.status === 'aprovada').length} de {userSubs.length}
                    </td>
                    <td className="py-3.5 px-4 text-purple-300 font-semibold">
                      {userCerts.length > 0 ? `${userCerts.length} emitido(s)` : 'Nenhum'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
