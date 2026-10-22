import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, History, Clock, User, FileText } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const AuditTrailView: React.FC = () => {
  const { auditLogs } = useFinance();
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const filtered = auditLogs.filter((log) => {
    if (entityFilter !== 'ALL' && log.entityType !== entityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.details.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.entityId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
              Regulatory Compliance
            </span>
            <span className="text-xs text-slate-400">SOX & IFRS Auditable Records</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            Immutable Audit Trail & Governance Log
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tamper-evident chronological log of all OCR document ingestions, user corrections,
            approvals, journal postings, and reversals
          </p>
        </div>

        <div className="bg-slate-800 border border-slate-700/80 rounded-xl px-4 py-2 text-right">
          <span className="text-[11px] text-slate-400 block">Logged Events</span>
          <span className="text-base font-bold text-white font-mono">{auditLogs.length}</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by action, user, or entity ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
          <span className="text-slate-400 text-[11px]">Entity:</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Entities</option>
            <option value="TRANSACTION">Transaction</option>
            <option value="DOCUMENT_SCAN">Document Scan</option>
            <option value="JOURNAL_ENTRY">Journal Entry</option>
            <option value="REVERSAL">Reversal</option>
            <option value="RECONCILIATION">Reconciliation</option>
          </select>
        </div>
      </div>

      {/* Timeline Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[11px]">
                <th className="py-2.5 px-4">Timestamp (UTC)</th>
                <th className="py-2.5 px-4">User & Role</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Target Entity</th>
                <th className="py-2.5 px-4">Audit Details & Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{log.userName}</div>
                    <div className="text-[10px] text-indigo-400">{log.userRole}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-sky-400 text-[11px]">
                    {log.action}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                      {log.entityId}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 leading-relaxed font-sans">
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
