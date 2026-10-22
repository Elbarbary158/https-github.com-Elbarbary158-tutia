import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Coins,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const BankReconciliationView: React.FC = () => {
  const {
    bankAccounts,
    bankStatementLines,
    transactions,
    reconcileBankLine,
    formatMoney,
    currentCurrency,
  } = useFinance();

  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || 'bank-jpm');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const selectedBank = bankAccounts.find((b) => b.id === selectedBankId);
  const statementLines = bankStatementLines.filter((l) => l.bankAccountId === selectedBankId);

  const reconciledCount = statementLines.filter((l) => l.reconciled).length;
  const unreconciledCount = statementLines.length - reconciledCount;

  const handleAutoReconcile = () => {
    let matchedCount = 0;
    statementLines.forEach((line) => {
      if (!line.reconciled) {
        // Find matching transaction by amount or reference
        const match = transactions.find(
          (t) =>
            t.referenceNo.toLowerCase() === line.reference.toLowerCase() ||
            Math.abs(t.amount - Math.abs(line.amount)) < 0.01
        );
        if (match) {
          reconcileBankLine(line.id, match.id);
          matchedCount++;
        }
      }
    });

    setSuccessNotice(`Auto-reconciliation complete: Matched ${matchedCount} bank lines to verified ledger entries.`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
              Audit Reconciliation
            </span>
            <span className="text-xs text-slate-400">Statement Feed vs General Ledger</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            Bank Account Reconciliation
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verify automated deposits, card debits, and wire transactions against approved journal entries
          </p>
        </div>

        <button
          onClick={handleAutoReconcile}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 transition active:scale-95"
        >
          <RotateCw className="w-4 h-4" />
          <span>Auto-Match Statement Lines</span>
        </button>
      </div>

      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Account Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {bankAccounts.map((acc) => {
          const isSelected = acc.id === selectedBankId;
          return (
            <div
              key={acc.id}
              onClick={() => setSelectedBankId(acc.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                isSelected
                  ? 'bg-slate-800 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">{acc.accountNumberMasked}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-700/80 text-white font-bold text-[10px]">
                  {acc.currency}
                </span>
              </div>
              <h3 className="font-semibold text-white text-xs mt-1 truncate">{acc.bankName}</h3>
              <div className="mt-2 text-base font-bold text-sky-400 font-mono">
                {formatMoney(acc.currentBalance, acc.currency)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary KPI Strip */}
      {selectedBank && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Current Ledger Balance:</span>
            <span className="font-mono font-bold text-white text-sm">
              {formatMoney(selectedBank.currentBalance, selectedBank.currency)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Statement Lines:</span>
            <span className="font-mono font-bold text-white text-sm">{statementLines.length}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Reconciled Lines:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{reconciledCount}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Unreconciled Variance:</span>
            <span className="font-mono font-bold text-amber-400 text-sm">
              {unreconciledCount > 0 ? `${unreconciledCount} items pending` : '$0.00 Variance'}
            </span>
          </div>
        </div>
      )}

      {/* Bank Statement Lines Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 font-bold text-white text-xs flex items-center justify-between">
          <span>Electronic Bank Statement Lines Feed</span>
          <span className="text-[11px] text-slate-400 font-normal">
            Direct banking API synchronization
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[11px]">
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Bank Narration / Description</th>
                <th className="py-2.5 px-4">Reference</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4">Reconciliation Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {statementLines.map((line) => {
                const isDeposit = line.amount > 0;
                return (
                  <tr key={line.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-slate-300">{line.date}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-200">
                      {line.description}
                    </td>
                    <td className="py-3 px-4 font-mono text-sky-300 font-semibold">
                      {line.reference}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={isDeposit ? 'text-emerald-400' : 'text-rose-400'}>
                        {isDeposit ? '+' : ''}
                        {formatMoney(line.amount, line.currency)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {line.reconciled ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Reconciled
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" /> Unmatched
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!line.reconciled && (
                        <button
                          onClick={() => handleAutoReconcile()}
                          className="px-2.5 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 text-[11px] font-medium transition"
                        >
                          Match Ledger
                        </button>
                      )}
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
