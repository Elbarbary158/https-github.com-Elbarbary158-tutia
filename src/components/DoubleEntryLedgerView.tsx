import React, { useState } from 'react';
import {
  Layers,
  BookOpen,
  Plus,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Filter,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { GlAccount, AccountCategory, JournalEntry } from '../types/finance';

export const DoubleEntryLedgerView: React.FC = () => {
  const {
    glAccounts,
    journalEntries,
    formatMoney,
    currentCurrency,
    createManualJournalEntry,
    reverseJournalEntry,
    userRole,
  } = useFinance();

  const [activeSubTab, setActiveSubTab] = useState<'COA' | 'JOURNALS'>('JOURNALS');
  const [showNewJournalModal, setShowNewJournalModal] = useState(false);
  const [reversingEntryId, setReversingEntryId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Journal Entry state
  const [jeDate, setJeDate] = useState(new Date().toISOString().split('T')[0]);
  const [jeDesc, setJeDesc] = useState('');
  const [jeRef, setJeRef] = useState('');
  const [lines, setLines] = useState<
    { glAccountCode: string; debit: number; credit: number; memo: string }[]
  >([
    { glAccountCode: '6010', debit: 0, credit: 0, memo: '' },
    { glAccountCode: '1020', debit: 0, credit: 0, memo: '' },
  ]);

  const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0;

  const handleAddLine = () => {
    setLines([...lines, { glAccountCode: '6010', debit: 0, credit: 0, memo: '' }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== idx));
    }
  };

  const handleLineChange = (idx: number, field: string, val: any) => {
    setLines(
      lines.map((l, i) => {
        if (i !== idx) return l;
        return { ...l, [field]: val };
      })
    );
  };

  const handleCreateJournal = () => {
    if (!isBalanced) return;
    const res = createManualJournalEntry(jeDate, jeDesc, jeRef, lines);
    if (res.success) {
      setSuccessMsg(`Journal Entry ${res.journalEntry?.entryNumber} posted successfully!`);
      setShowNewJournalModal(false);
      setJeDesc('');
      setJeRef('');
      setLines([
        { glAccountCode: '6010', debit: 0, credit: 0, memo: '' },
        { glAccountCode: '1020', debit: 0, credit: 0, memo: '' },
      ]);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      alert(res.error);
    }
  };

  const handleReverseConfirm = () => {
    if (!reversingEntryId) return;
    const res = reverseJournalEntry(
      reversingEntryId,
      reversalReason || 'Manual adjustment reversal.'
    );
    if (res.success) {
      setSuccessMsg('Reversal entry successfully created and posted to general ledger.');
      setReversingEntryId(null);
      setReversalReason('');
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      alert(res.error);
    }
  };

  const categories: AccountCategory[] = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              Double-Entry Foundation
            </span>
            <span className="text-xs text-slate-400">Debit = Credit Mathematical Proof</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            General Ledger & Chart of Accounts
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Balanced double-entry bookkeeping, auditable journal postings, and reversing entries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewJournalModal(true)}
            disabled={userRole === 'Read-only Management' || userRole === 'Auditor'}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Manual Journal Entry</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Sub-tabs: Journal Entries vs Chart of Accounts */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveSubTab('JOURNALS')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            activeSubTab === 'JOURNALS'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          General Ledger Journal Entries ({journalEntries.length})
        </button>
        <button
          onClick={() => setActiveSubTab('COA')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            activeSubTab === 'COA'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Chart of Accounts ({glAccounts.length})
        </button>
      </div>

      {activeSubTab === 'JOURNALS' ? (
        /* Journal Entries List */
        <div className="space-y-4">
          {journalEntries.map((je) => {
            const isReversed = je.status === 'REVERSED';
            return (
              <div
                key={je.id}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-lg space-y-4 ${
                  isReversed
                    ? 'border-slate-800/60 opacity-75'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Journal Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-400 text-sm">
                        {je.entryNumber}
                      </span>
                      <span className="text-xs text-slate-400">• {je.date}</span>
                      {isReversed ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          REVERSED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          POSTED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 font-medium mt-1">{je.description}</p>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex gap-3">
                      <span>Ref: {je.reference || 'N/A'}</span>
                      <span>Posted by: {je.postedBy}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">
                        Balanced Total
                      </span>
                      <span className="font-mono font-bold text-white text-sm">
                        {formatMoney(je.totalDebit)}
                      </span>
                    </div>

                    {!isReversed && (
                      <button
                        onClick={() => setReversingEntryId(je.id)}
                        disabled={
                          userRole === 'Read-only Management' || userRole === 'Auditor'
                        }
                        title="Per Rule #8: Controlled accounting reversal"
                        className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-rose-950/40 hover:border-rose-700/60 text-slate-400 hover:text-rose-300 transition text-xs flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Reverse</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Journal Lines Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-medium border-b border-slate-800/60">
                        <th className="py-2 px-3">GL Account Code & Name</th>
                        <th className="py-2 px-3">Memo / Description</th>
                        <th className="py-2 px-3 text-right">Debit</th>
                        <th className="py-2 px-3 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono">
                      {je.lines.map((l) => (
                        <tr key={l.id}>
                          <td className="py-2 px-3 text-slate-200">
                            <span className="text-sky-300 font-semibold">{l.glAccountCode}</span>{' '}
                            - {l.glAccountName}
                          </td>
                          <td className="py-2 px-3 text-slate-400 font-sans">{l.memo || '-'}</td>
                          <td className="py-2 px-3 text-right font-semibold text-emerald-400">
                            {l.debit > 0 ? formatMoney(l.debit) : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-rose-400">
                            {l.credit > 0 ? formatMoney(l.credit) : '-'}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t border-slate-800 font-bold bg-slate-950/40">
                        <td colSpan={2} className="py-2 px-3 text-right text-slate-400 uppercase text-[11px]">
                          Total Debits & Credits:
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-400">
                          {formatMoney(je.totalDebit)}
                        </td>
                        <td className="py-2 px-3 text-right text-rose-400">
                          {formatMoney(je.totalCredit)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Chart of Accounts Tree */
        <div className="space-y-6">
          {categories.map((cat) => {
            const accounts = glAccounts.filter((a) => a.category === cat);
            const catTotal = accounts.reduce((sum, a) => sum + a.balance, 0);

            return (
              <div
                key={cat}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        cat === 'ASSET'
                          ? 'bg-sky-400'
                          : cat === 'LIABILITY'
                          ? 'bg-amber-400'
                          : cat === 'EQUITY'
                          ? 'bg-purple-400'
                          : cat === 'REVENUE'
                          ? 'bg-emerald-400'
                          : 'bg-rose-400'
                      }`}
                    />
                    <h3 className="text-sm font-bold text-white tracking-wide">{cat}S</h3>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-200">
                    Category Net: {formatMoney(catTotal)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800/60 text-[11px] uppercase">
                        <th className="py-2 px-3">Code</th>
                        <th className="py-2 px-3">Account Title</th>
                        <th className="py-2 px-3">Normal Balance</th>
                        <th className="py-2 px-3 text-right">Current Ledger Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {accounts.map((acc) => (
                        <tr key={acc.code} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 font-mono font-bold text-sky-300">
                            {acc.code}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-100">
                            {acc.name}
                            {acc.isBankOrCash && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                Cash/Bank
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                            {acc.normalBalance}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                            {formatMoney(acc.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Manual Journal Entry Modal */}
      {showNewJournalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-400" /> New Manual Balanced Journal Entry
              </h3>
              <button
                onClick={() => setShowNewJournalModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Entry Date:</label>
                <input
                  type="date"
                  value={jeDate}
                  onChange={(e) => setJeDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-slate-400 block mb-1">Description / Narration:</label>
                <input
                  type="text"
                  placeholder="e.g. Accrued monthly audit retainer fee"
                  value={jeDesc}
                  onChange={(e) => setJeDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            {/* Lines List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Journal Lines</span>
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="text-sky-400 hover:text-sky-300 flex items-center gap-1 text-[11px]"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Line
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800 text-xs items-center"
                  >
                    <div className="col-span-5">
                      <select
                        aria-label={`Select GL account for line ${idx + 1}`}
                        value={line.glAccountCode}
                        onChange={(e) => handleLineChange(idx, 'glAccountCode', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200"
                      >
                        {glAccounts.map((gl) => (
                          <option key={gl.code} value={gl.code}>
                            {gl.code} - {gl.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Debit"
                        value={line.debit || ''}
                        onChange={(e) =>
                          handleLineChange(idx, 'debit', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-emerald-400 text-right"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Credit"
                        value={line.credit || ''}
                        onChange={(e) =>
                          handleLineChange(idx, 'credit', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-rose-400 text-right"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      {lines.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Balance Checker Footer */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex gap-4 font-mono">
                <span>
                  Total Debit:{' '}
                  <strong className="text-emerald-400">{formatMoney(totalDebit)}</strong>
                </span>
                <span>
                  Total Credit:{' '}
                  <strong className="text-rose-400">{formatMoney(totalCredit)}</strong>
                </span>
              </div>
              <div>
                {isBalanced ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Balanced Entry
                  </span>
                ) : (
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Difference: $
                    {Math.abs(totalDebit - totalCredit).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewJournalModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isBalanced || !jeDesc.trim()}
                onClick={handleCreateJournal}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-bold shadow transition"
              >
                Post Balanced Journal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reversal Confirmation Modal */}
      {reversingEntryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-400" /> Reversing Journal Entry Procedure
            </h3>
            <p className="text-xs text-slate-300">
              Per <strong>Rule #8: Silent modifications are prohibited</strong>. This action will
              create a balanced counter-entry to cleanly reverse this journal while preserving the
              complete audit history.
            </p>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Reason for Reversal / Correction:
              </label>
              <input
                type="text"
                placeholder="e.g. Duplicate voucher or corrected supplier billing"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReversingEntryId(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReverseConfirm}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow"
              >
                Execute Controlled Reversal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
