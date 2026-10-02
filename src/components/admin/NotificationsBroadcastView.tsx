import React, { useState } from 'react';
import {
  Bell,
  Send,
  CheckCircle2,
  Users,
  AlertTriangle,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataStore } from '../../lib/dataStore';

export const NotificationsBroadcastView: React.FC = () => {
  const { userProfile: currentAdmin } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'reminder' | 'approval' | 'warning'>('info');
  const [targetDegree, setTargetDegree] = useState<number | 'all'>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    dataStore.broadcastNotification({
      title,
      message,
      type,
      targetDegree: targetDegree === 'all' ? undefined : targetDegree,
    });

    setFeedback(`Comunicado "${title}" transmitido com sucesso a todos os irmãos!`);
    setTimeout(() => setFeedback(null), 3000);
    setTitle('');
    setMessage('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b1418] via-[#141018] to-black border border-red-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-2 text-red-400 text-xs font-bold uppercase tracking-wider font-masonic mb-1">
          <Bell className="w-4 h-4" />
          <span>Comunicações Oficiais & Circulares</span>
        </div>
        <h1 className="text-2xl font-bold font-masonic text-slate-100">
          Transmissão de Avisos e Notificações
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Envie circulares solenes, convocações de estudos, avisos de novos conteúdos ou lembretes de prazos de pranchas diretamente aos irmãos.
        </p>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Broadcast Form */}
      <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Público Alvo (Grau Destinatário) *
              </label>
              <select
                value={targetDegree}
                onChange={(e) => setTargetDegree(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-semibold focus:border-amber-400"
              >
                <option value="all">🌐 Todos os Irmãos Cadastrados</option>
                <option value={1}>Grau 01 • Aprendizes</option>
                <option value={2}>Grau 02 • Companheiros</option>
                <option value={3}>Grau 03 • Mestres Maçons</option>
                <option value={4}>Grau 04 • Mestres Secretos</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Tipo do Comunicado *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
              >
                <option value="info">Informação Geral / Circular</option>
                <option value="reminder">Lembrete de Estudo ou Prazo</option>
                <option value="approval">Aviso de Homologação</option>
                <option value="warning">Aviso Importante / Solene</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Título do Comunicado *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Convocação para Sessão de Instrução Filosófica"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Mensagem Integral *</label>
            <textarea
              rows={5}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite o teor do comunicado aos irmãos..."
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold shadow-lg flex items-center space-x-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Transmitir Notificação aos Irmãos</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
