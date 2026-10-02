import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  BookOpen,
  CheckSquare,
  FileText,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';

interface ProgressViewProps {
  onNavigate: (view: string, payload?: any) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ onNavigate }) => {
  const { userProfile, isAdmin, isInstructor } = useAuth();
  if (!userProfile) return null;

  const degrees = dataStore.getDegrees();
  const attempts = dataStore.getQuizAttemptsByUser(userProfile.id);
  const submissions = dataStore.getSubmissionsByUser(userProfile.id);
  const currentDegreeProg = dataStore.getUserProgress(userProfile.id, userProfile.degree);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#121622] via-[#0e121a] to-black border border-amber-500/20 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-masonic mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Acompanhamento Pedagógico</span>
          </div>
          <h1 className="text-2xl font-bold font-masonic text-slate-100">
            Meu Desempenho & Evolução nos Graus
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Visualize em detalhes suas taxas de conclusão, notas nas avaliações e cumprimento dos requisitos exigidos para cada grau.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Média Geral</span>
            <span className="text-xl font-bold font-masonic text-amber-300">
              {currentDegreeProg.averageGrade > 0 ? `${currentDegreeProg.averageGrade}/100` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Salary Increase (Aumento de Salário) Callout Banner for Grau 1 and Grau 2 */}
      {userProfile.degree < 3 && (
        <div className="bg-gradient-to-r from-[#161a27] via-[#10141d] to-[#0a0d14] border border-amber-500/40 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 border border-amber-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold font-masonic text-slate-100">
                  {userProfile.degree === 1
                    ? 'Aumento de Salário (Passagem para o Grau 02 • Companheiro)'
                    : 'Aumento de Salário (Exaltação ao Grau 03 • Mestre Maçom)'}
                </h3>
                {dataStore.checkDegreeQuizzesProgress(userProfile.id, userProfile.degree).isAllCompleted ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Apto para Solicitar
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Em Andamento
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {dataStore.checkDegreeQuizzesProgress(userProfile.id, userProfile.degree).isAllCompleted
                  ? `Você concluiu com sucesso todos os questionários do Grau 0${userProfile.degree}! Acesse a aba de Aumento de Salário para protocolar formalmente seu pedido com a Chancelaria.`
                  : `Assim que concluir todos os questionários avaliativos das instruções do Grau 0${userProfile.degree}, o botão de pedido de Aumento de Salário será liberado para notificar a Chancelaria.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('salary-request')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all shrink-0 flex items-center justify-center space-x-1.5"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Acessar Aumento de Salário (Grau 0{userProfile.degree + 1})</span>
          </button>
        </div>
      )}

      {/* Progress Cards per Degree */}
      <div className="space-y-4">
        <h2 className="text-base font-bold font-masonic text-amber-200">
          Progresso por Grau Maçônico
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {degrees.map((deg) => {
            const prog = dataStore.getUserProgress(userProfile.id, deg.degreeNumber);
            const isCurrent = userProfile.degree === deg.degreeNumber;

            return (
              <div
                key={deg.id}
                className={`rounded-2xl border p-5 ${
                  isCurrent
                    ? 'bg-[#131825] border-amber-500/40 shadow-lg'
                    : 'bg-[#0e121a] border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold font-masonic text-slate-100">
                      Grau 0{deg.degreeNumber} • {deg.name}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Grau Atual
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-amber-300">{prog.progressPercent}%</span>
                </div>

                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${prog.progressPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Instruções</span>
                    <span className="font-bold text-slate-200">{prog.completedLessons}/{prog.totalLessons}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Avaliações</span>
                    <span className="font-bold text-slate-200">{prog.quizzesTaken} feitas</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Pranchas</span>
                    <span className="font-bold text-slate-200">{prog.submissionsApproved} aprovadas</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History Recap Table */}
      <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold font-masonic text-amber-200">
          Últimas Atividades Registradas
        </h3>

        {attempts.length === 0 && submissions.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Nenhuma atividade registrada até o momento.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Instrução / Título</th>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Nota</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {attempts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-3 font-semibold text-amber-400">Questionário</td>
                    <td className="py-3 px-3 text-slate-200 font-medium">{a.lessonTitle}</td>
                    <td className="py-3 px-3 text-slate-400">{new Date(a.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3 px-3 font-bold text-amber-300">{a.score}/100</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.isPassed ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'}`}>
                        {a.isPassed ? 'Aprovado' : 'Não Aprovado'}
                      </span>
                    </td>
                  </tr>
                ))}
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-3 font-semibold text-amber-300">Prancha</td>
                    <td className="py-3 px-3 text-slate-200 font-medium">{s.title}</td>
                    <td className="py-3 px-3 text-slate-400">{new Date(s.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3 px-3 font-bold text-amber-300">{s.grade !== undefined ? `${s.grade}/100` : '—'}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40 capitalize">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
