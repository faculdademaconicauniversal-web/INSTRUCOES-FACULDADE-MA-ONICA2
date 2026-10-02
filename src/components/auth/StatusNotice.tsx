import React, { useState } from 'react';
import { Clock, ShieldAlert, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const StatusNotice: React.FC = () => {
  const { userProfile, isPending, isBlocked, logout, validateAuthorizationCode } = useAuth();
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [codeResult, setCodeResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isPending && !isBlocked) return null;

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setValidating(true);
    setCodeResult(null);
    try {
      const res = await validateAuthorizationCode(code.trim());
      setCodeResult(res);
    } catch (err: any) {
      setCodeResult({ success: false, message: err.message || 'Erro ao validar código.' });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      {isPending && (
        <div className="bg-gradient-to-br from-[#1c1811] via-[#151722] to-[#0d1017] border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 mb-4 animate-pulse">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-masonic text-amber-200 mb-2">
            Cadastro em Análise Fraternal
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto mb-6 leading-relaxed">
            Sua solicitação de acesso foi recebida com sucesso e está aguardando homologação da administração e validação de seus dados maçônicos.
          </p>

          <div className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-slate-400">Nome:</span>
              <span className="font-semibold text-slate-200">{userProfile?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">E-mail:</span>
              <span className="font-semibold text-slate-200">{userProfile?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Loja Maçônica:</span>
              <span className="font-semibold text-slate-200">{userProfile?.lodge}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Potência:</span>
              <span className="font-semibold text-slate-200">{userProfile?.grandLodge}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Grau Solicitado:</span>
              <span className="font-bold text-amber-400">Grau 0{userProfile?.degree}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Registro (CIM):</span>
              <span className="font-mono text-amber-300">{userProfile?.cimNumber}</span>
            </div>
          </div>

          {/* Quick Authorization Code Validation */}
          <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-slate-950/70 border border-amber-500/30 text-left">
            <label className="block text-xs font-bold text-amber-300 font-masonic mb-1 flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Recebeu um Código de Autorização da Chancelaria?</span>
            </label>
            <p className="text-[11px] text-slate-400 mb-3">
              Se a administração já emitiu um código prévio para o seu grau, insira-o abaixo para liberação imediata:
            </p>
            <form onSubmit={handleValidateCode} className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: AUTH-G1-123456"
                className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-amber-200 font-mono focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={validating || !code.trim()}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-all disabled:opacity-50"
              >
                {validating ? 'Validando...' : 'Liberar'}
              </button>
            </form>
            {codeResult && (
              <div
                className={`mt-3 p-2.5 rounded-lg text-xs flex items-center space-x-2 ${
                  codeResult.success
                    ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
                    : 'bg-red-950/80 border border-red-500/50 text-red-200'
                }`}
              >
                {codeResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{codeResult.message}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => logout()}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Desconectar / Entrar com Outra Conta
            </button>
          </div>
          <div className="text-[11px] text-slate-400 italic mt-3">
            Assim que seu cadastro for homologado pela Chancelaria, o acesso ao Templo de Estudos será liberado automaticamente.
          </div>
        </div>
      )}

      {isBlocked && (
        <div className="bg-gradient-to-br from-[#241113] via-[#1a1215] to-[#0d1017] border border-red-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-masonic text-red-200 mb-2">
            Acesso Temporariamente Suspenso
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto mb-6 leading-relaxed">
            Seu acesso ao sistema foi suspenso pela administração da Faculdade Maçônica. Entre em contato com a diretoria de instrução para regularização.
          </p>
          <button
            onClick={() => logout()}
            className="px-6 py-2 rounded-xl bg-red-900/50 hover:bg-red-800 border border-red-500/40 text-red-100 text-xs font-semibold transition-colors"
          >
            Desconectar
          </button>
        </div>
      )}
    </div>
  );
};
