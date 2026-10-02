import React from 'react';
import {
  Layers,
  Lock,
  Unlock,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { Degree } from '../../types';

interface DegreesViewProps {
  onNavigate: (view: string, payload?: any) => void;
}

export const DegreesView: React.FC<DegreesViewProps> = ({ onNavigate }) => {
  const { userProfile, hasAccessToDegree, isAdmin, isInstructor } = useAuth();
  const degrees = dataStore.getDegrees();
  const modules = dataStore.getModules();

  if (!userProfile) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#121622] via-[#0e121a] to-black border border-amber-500/20 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-masonic mb-1">
            <Layers className="w-4 h-4" />
            <span>Escala Hierárquica de Estudos</span>
          </div>
          <h1 className="text-2xl font-bold font-masonic text-slate-100">
            Meus Graus & Currículo Iniciático
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            As instruções são rigidamente segmentadas por grau maçônico. Seu perfil atual possui acesso aos materiais autorizados para o seu grau na Ordem.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 text-right shrink-0">
          <span className="text-[10px] text-slate-400 block uppercase font-medium">Seu Grau Autorizado:</span>
          <span className="text-base font-bold font-masonic text-amber-300">
            Grau 0{userProfile.degree} • {userProfile.degree === 1 ? 'Aprendiz Maçom' : userProfile.degree === 2 ? 'Companheiro Maçom' : 'Mestre Maçom'}
          </span>
        </div>
      </div>

      {/* Degrees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {degrees.map((deg) => {
          const hasAccess = hasAccessToDegree(deg.degreeNumber);
          const isCurrent = userProfile.degree === deg.degreeNumber;
          const isCompleted = userProfile.degree > deg.degreeNumber;
          const degModules = modules.filter((m) => m.degreeNumber === deg.degreeNumber);
          const progress = dataStore.getUserProgress(userProfile.id, deg.degreeNumber);

          return (
            <div
              key={deg.id}
              className={`rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                isCurrent
                  ? 'bg-gradient-to-b from-[#161c2b] to-[#0f131d] border-amber-500/50 shadow-xl'
                  : hasAccess
                  ? 'bg-[#0f131d] border-slate-800 hover:border-amber-500/30'
                  : 'bg-[#0a0d14]/70 border-slate-900 opacity-70'
              }`}
            >
              {/* Card Top Banner with Status Badge */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-masonic font-black text-xl border ${
                        hasAccess
                          ? 'bg-gradient-to-br from-amber-500/20 to-slate-900 border-amber-500/40 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-600'
                      }`}
                    >
                      0{deg.degreeNumber}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-bold font-masonic text-slate-100">
                          {deg.name}
                        </h2>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Grau Atual
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {deg.totalLessons} instruções cadastradas • {degModules.length} módulos
                      </p>
                    </div>
                  </div>

                  <div>
                    {hasAccess ? (
                      isCompleted ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Concluído</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Liberado</span>
                        </span>
                      )
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-slate-500 border border-slate-800 flex items-center space-x-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Bloqueado</span>
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-5">
                  {deg.description}
                </p>

                {/* Progress bar if user has access */}
                {hasAccess && (
                  <div className="mb-5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Progresso no Grau:</span>
                      <span className="font-bold text-amber-300">
                        {progress.completedLessons} de {progress.totalLessons} instruções ({progress.progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all"
                        style={{ width: `${progress.progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Modules breakdown */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Módulos Temáticos:
                  </div>
                  {degModules.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Nenhum módulo configurado.</p>
                  ) : (
                    degModules.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/80 text-xs flex items-center justify-between"
                      >
                        <span className="text-slate-300 font-medium">{m.title}</span>
                        <span className="text-[11px] text-slate-500">Módulo 0{m.order}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Action */}
              <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                {hasAccess ? (
                  <>
                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                      <span>Instruções, Questionários & Pranchas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCurrent && deg.degreeNumber < 3 && dataStore.checkDegreeQuizzesProgress(userProfile.id, deg.degreeNumber).isAllCompleted && (
                        <button
                          onClick={() => onNavigate('salary-request')}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-black font-masonic transition-all flex items-center space-x-1 shadow-md"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Pedir Aumento de Salário (Grau 0{deg.degreeNumber + 1})</span>
                        </button>
                      )}
                      <button
                        onClick={() => onNavigate('lessons', { degreeNumber: deg.degreeNumber })}
                        className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center space-x-1.5"
                      >
                        <span>Acessar Instruções</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-2 text-xs text-slate-500 w-full justify-between">
                    <span className="flex items-center space-x-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-500/60" />
                      <span>Requer elevação/exaltação formal na Loja</span>
                    </span>
                    <span className="text-[11px] text-slate-600 font-mono">Restrito</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
