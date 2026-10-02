import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  FileText,
} from 'lucide-react';
import { dataStore } from '../../lib/dataStore';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState(() => dataStore.getAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((log) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !log.action.toLowerCase().includes(q) &&
        !log.userName.toLowerCase().includes(q) &&
        !log.details.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1b1418] via-[#141018] to-black border border-red-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-2 text-red-400 text-xs font-bold uppercase tracking-wider font-masonic mb-1">
          <ShieldAlert className="w-4 h-4" />
          <span>Rastreabilidade & Conformidade</span>
        </div>
        <h1 className="text-2xl font-bold font-masonic text-slate-100">
          Trilha de Auditoria & Registros
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Histórico imutável de todas as ações administrativas, alterações de graus, aprovações de membros, emissões de certificados e publicações.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar nos registros de auditoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-amber-400"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {filteredLogs.length} eventos registrados
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0e121a] border border-amber-500/20 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Data & Hora</th>
                <th className="py-3 px-4">Responsável</th>
                <th className="py-3 px-4">Ação</th>
                <th className="py-3 px-4">Detalhes do Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40 font-mono text-[11px]">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-4 font-semibold text-amber-300">
                    {log.userName}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[10px] uppercase font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
