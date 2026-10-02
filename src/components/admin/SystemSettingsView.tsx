import React, { useState } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Building,
  Shield,
  Bell,
  Sliders,
  Award,
  CloudUpload,
  Database,
  RefreshCw,
  AlertCircle,
  BookOpen,
  HelpCircle,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';
import { FACULDADE_SEAL_IMG } from '../../assets/logo';
import { publishAllDataToFirestore, SyncResult } from '../../lib/firestoreSync';

export const SystemSettingsView: React.FC = () => {
  const { userProfile: currentAdmin } = useAuth();
  const [settings, setSettings] = useState(() => dataStore.getSystemSettings());
  const [feedback, setFeedback] = useState<string | null>(null);

  // Firestore Sync State
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ msg: string; current: number; total: number } | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [institutionName, setInstitutionName] = useState(settings.institutionName);
  const [grandMasterName, setGrandMasterName] = useState(settings.grandMasterName);
  const [grandLodgeAffiliation, setGrandLodgeAffiliation] = useState(settings.grandLodgeAffiliation);
  const [allowRegistration, setAllowRegistration] = useState(settings.allowRegistration);
  const [autoApproveUsers, setAutoApproveUsers] = useState(settings.autoApproveUsers);
  const [defaultPassingGrade, setDefaultPassingGrade] = useState(settings.defaultPassingGrade);
  const [enableEmailAlerts, setEnableEmailAlerts] = useState(settings.enableEmailAlerts);

  const handleSyncToFirestore = async () => {
    setSyncLoading(true);
    setSyncError(null);
    setSyncResult(null);

    try {
      const result = await publishAllDataToFirestore((msg, current, total) => {
        setSyncProgress({ msg, current, total });
      });
      setSyncResult(result);
    } catch (err: any) {
      setSyncError(err.message || 'Erro ao sincronizar com o banco de dados na nuvem.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    dataStore.updateSystemSettings(
      {
        institutionName,
        grandMasterName,
        grandLodgeAffiliation,
        allowRegistration,
        autoApproveUsers,
        defaultPassingGrade,
        enableEmailAlerts,
      },
      currentAdmin?.fullName || 'Administrador'
    );

    setFeedback('Parâmetros institucionais e operacionais atualizados com sucesso!');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b1418] via-[#141018] to-black border border-red-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-2 text-red-400 text-xs font-bold uppercase tracking-wider font-masonic mb-1">
          <Settings className="w-4 h-4" />
          <span>Configurações Globais da Chancelaria</span>
        </div>
        <h1 className="text-2xl font-bold font-masonic text-slate-100">
          Parâmetros do Sistema & Certificação
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Ajuste o nome oficial da instituição, chancelaria, critérios de aprovação de novos membros e assinaturas de certificados.
        </p>
      </div>

      {/* Cloud Database Publishing & Sync Section */}
      <div className="bg-gradient-to-br from-[#10141f] via-[#0c101a] to-[#07090e] border border-amber-500/35 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-amber-500/20 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold font-masonic text-amber-200">
                Publicação & Sincronização do Banco de Dados
              </h2>
              <p className="text-xs text-slate-400">
                Sincronize todo o acervo de instruções, avaliações e configurações com o Firebase Firestore
              </p>
            </div>
          </div>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Firestore Conectado</span>
          </span>
        </div>

        {/* Database Inventory Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-lg font-bold font-masonic text-amber-400">
              {dataStore.getDegrees().length}
            </div>
            <div className="text-[11px] text-slate-400">Graus Simbólicos</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-lg font-bold font-masonic text-blue-400">
              {dataStore.getModules().length}
            </div>
            <div className="text-[11px] text-slate-400">Módulos Temáticos</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-lg font-bold font-masonic text-emerald-400">
              {dataStore.getLessons(99, true).length}
            </div>
            <div className="text-[11px] text-slate-400">Instruções de Graus</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-lg font-bold font-masonic text-amber-300">
              {dataStore.getDeliveredInstructions().length}
            </div>
            <div className="text-[11px] text-slate-400">Instruções em Templo</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-lg font-bold font-masonic text-purple-400">
              {dataStore.getAllQuestions().length}
            </div>
            <div className="text-[11px] text-slate-400">Questões Avaliativas</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <div className="text-lg font-bold font-masonic text-slate-200">
              {dataStore.getSupportMaterials().length}
            </div>
            <div className="text-[11px] text-slate-400">Apostilas & Acervo</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center col-span-2 sm:col-span-1">
            <div className="text-lg font-bold font-masonic text-amber-500">
              {dataStore.getAuthorizations().length}
            </div>
            <div className="text-[11px] text-slate-400">Travas & Acessos</div>
          </div>
        </div>

        {syncProgress && (
          <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/40 space-y-2">
            <div className="flex items-center justify-between text-xs text-amber-300">
              <span className="flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>{syncProgress.msg}</span>
              </span>
              <span className="font-mono text-slate-400">
                {Math.round((syncProgress.current / syncProgress.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 h-full transition-all duration-300"
                style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {syncResult && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-emerald-300">Banco de Dados Publicado com Sucesso na Nuvem!</p>
              <p className="text-emerald-200/90">{syncResult.message}</p>
              <p className="text-[11px] text-slate-400">
                Agora o aplicativo publicado na Hostinger e em qualquer outro servidor tem acesso completo e sincronizado a todos os dados.
              </p>
            </div>
          </div>
        )}

        {syncError && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="font-bold text-red-300">Erro na Publicação:</p>
              <p className="text-red-200/90">{syncError}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <p className="text-xs text-slate-400 max-w-lg">
            Clique no botão ao lado para gravar todas as instruções, perguntas, notas e módulos diretamente nas coleções do Firebase Firestore.
          </p>
          <button
            type="button"
            onClick={handleSyncToFirestore}
            disabled={syncLoading}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold font-masonic text-xs shadow-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            {syncLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Publicando no Firestore...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4" />
                <span>Publicar Todo o Banco de Dados no Firestore</span>
              </>
            )}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Form */}
      <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-2 gap-2">
              <h3 className="text-sm font-bold font-masonic text-amber-200">
                Identificação Institucional & Certificados
              </h3>
              <div className="flex items-center space-x-2 text-[11px] text-amber-400 font-semibold">
                <Award className="w-4 h-4" />
                <span>Selo Oficial da Faculdade Maçônica Ativo</span>
              </div>
            </div>

            {/* Official Seal Preview Box */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-600 shadow-lg shrink-0">
                <img
                  src={FACULDADE_SEAL_IMG}
                  alt="Brasão Oficial"
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold font-masonic text-slate-100 uppercase">
                  Brasão e Chancelaria Oficial
                </div>
                <p className="text-[11px] text-slate-400">
                  Este selo oficial é renderizado automaticamente em todos os diplomas, certificados para impressão A4 e no cabeçalho institucional da plataforma.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nome da Instituição Maçônica
                </label>
                <input
                  type="text"
                  required
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Potência Maçônica / Obediência
                </label>
                <input
                  type="text"
                  required
                  value={grandLodgeAffiliation}
                  onChange={(e) => setGrandLodgeAffiliation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Nome do Grão-Mestre / Chanceler (Assinatura Oficial nos Certificados)
              </label>
              <input
                type="text"
                required
                value={grandMasterName}
                onChange={(e) => setGrandMasterName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold font-masonic text-amber-200 border-b border-slate-800 pb-2">
              Políticas de Cadastro & Avaliações
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nota Mínima Padrão nos Questionários de 10 Questões
                </label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={defaultPassingGrade}
                  onChange={(e) => setDefaultPassingGrade(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-bold focus:border-amber-400"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowRegistration}
                    onChange={(e) => setAllowRegistration(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-800 border-slate-700"
                  />
                  <span className="text-slate-200">
                    Permitir novos cadastros de irmãos pela tela inicial
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoApproveUsers}
                    onChange={(e) => setAutoApproveUsers(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-800 border-slate-700"
                  />
                  <span className="text-slate-200">
                    Auto-aprovar novos cadastros (sem validação prévia)
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableEmailAlerts}
                    onChange={(e) => setEnableEmailAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-800 border-slate-700"
                  />
                  <span className="text-slate-200">
                    Ativar notificações e alertas eletrônicos de correções
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold shadow-lg flex items-center space-x-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Parâmetros Globais</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
