import React, { useState } from 'react';
import {
  Download,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { FinancialTransaction, TransactionStatus, TransactionType } from '../types/finance';

export const TransactionsLedgerView: React.FC = () => {
  const {
    transactions,
    journalEntries,
    formatMoney,
    convertAmount,
    currentCurrency,
    currentBranchId,
    currentOrg,
  } = useFinance();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  // Filter transactions
  const filtered = transactions.filter((t) => {
    if (currentBranchId !== 'all' && t.branchId !== currentBranchId) return false;
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.referenceNo.toLowerCase().includes(q) ||
        t.merchantName.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.glAccountCode.includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Export to CSV Function
  const handleExportCsv = () => {
    const headers = [
      'Transaction ID',
      'Reference No',
      'Date',
      'Type',
      'Merchant / Party',
      'Original Amount',
      'Currency',
      'Reporting Amount (USD)',
      'Tax Amount',
      'Payment Method',
      'GL Code',
      'GL Account Name',
      'Status',
      'Journal Entry ID',
    ];

    const rows = filtered.map((t) => [
      t.id,
      t.referenceNo,
      t.date,
      t.type,
      `"${t.merchantName.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      t.currency,
      t.baseAmount.toFixed(2),
      (t.taxAmount || 0).toFixed(2),
      t.paymentMethod,
      t.glAccountCode,
      `"${t.glAccountName.replace(/"/g, '""')}"`,
      t.status,
      t.postedJournalEntryId || 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `FinAI_Ledger_Export_${currentOrg.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Comprehensive Transaction Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full audit log of recorded receipts, payments, supplier bills, and journal vouchers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Print Ledger</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search ref, vendor, GL account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs w-full md:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
            <span className="text-slate-500 text-[11px]">Status:</span>
            <select
              aria-label="Filter transactions by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="POSTED">Posted (Approved)</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="FLAGGED_DUPLICATE">Flagged Duplicate</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
            <span className="text-slate-500 text-[11px]">Type:</span>
            <select
              aria-label="Filter transactions by type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="REVENUE">Revenue</option>
              <option value="EXPENSE">Expense</option>
              <option value="TRANSFER">Transfer</option>
              <option value="REFUND">Refund</option>
            </select>
          </div>

          <span className="text-[11px] text-slate-400 ml-auto">
            Showing <strong className="text-white">{filtered.length}</strong> records
          </span>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">TX ID & Ref</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Merchant / Counterparty</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">GL Account</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Journal Link</th>
                <th className="py-3 px-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((tx) => {
                const isExpanded = expandedTxId === tx.id;
                const linkedJe = tx.postedJournalEntryId
                  ? journalEntries.find((j) => j.id === tx.postedJournalEntryId)
                  : null;

                return (
                  <React.Fragment key={tx.id}>
                    <tr
                      onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition ${
                        isExpanded ? 'bg-slate-800/60' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-medium">
                        <div className="text-white font-bold">{tx.referenceNo}</div>
                        <div className="text-[10px] text-slate-400">{tx.id}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{tx.date}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{tx.merchantName}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {tx.description}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.type === 'REVENUE' ? (
                          <span className="flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded w-fit">
                            <ArrowUpRight className="w-3 h-3" /> Revenue
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded w-fit">
                            <ArrowDownRight className="w-3 h-3" /> Expense
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className="text-sky-300 font-semibold">{tx.glAccountCode}</span>
                        <div className="text-slate-400 truncate max-w-[150px]">
                          {tx.glAccountName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">
                        {formatMoney(tx.amount, tx.currency)}
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.status === 'POSTED' && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Posted
                          </span>
                        )}
                        {tx.status === 'NEEDS_REVIEW' && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 w-fit">
                            <Clock className="w-3 h-3" /> Review
                          </span>
                        )}
                        {tx.status === 'FLAGGED_DUPLICATE' && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Duplicate
                          </span>
                        )}
                        {tx.status === 'REJECTED' && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded w-fit">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {linkedJe ? (
                          <span className="font-mono text-sky-400 text-[11px] bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                            {linkedJe.entryNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Unposted</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 inline" />
                        ) : (
                          <ChevronDown className="w-4 h-4 inline" />
                        )}
                      </td>
                    </tr>

                    {/* Expanded Detail Panel: Journal Lines & Proof */}
                    {isExpanded && (
                      <tr className="bg-slate-950/80">
                        <td colSpan={9} className="p-4 border-b border-slate-800">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            {/* Left: Metadata & Verification Notes */}
                            <div className="space-y-2 bg-slate-900 border border-slate-800 rounded-xl p-3">
                              <h4 className="font-bold text-white flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-sky-400" /> Audit Evidence &
                                Traceability
                              </h4>
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div>
                                  <span className="text-slate-400">Payment Method:</span>{' '}
                                  <strong className="text-slate-200">{tx.paymentMethod}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-400">Tax / VAT:</span>{' '}
                                  <strong className="text-slate-200">
                                    {formatMoney(tx.taxAmount || 0, tx.currency)}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-slate-400">Verified By:</span>{' '}
                                  <strong className="text-slate-200">
                                    {tx.verifiedBy || 'Pending'}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-slate-400">Branch:</span>{' '}
                                  <strong className="text-slate-200">{tx.branchId}</strong>
                                </div>
                              </div>
                              {tx.verificationNotes && (
                                <p className="text-[11px] text-amber-200/90 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                                  <strong>Note:</strong> {tx.verificationNotes}
                                </p>
                              )}
                            </div>

                            {/* Right: Balanced Double-Entry Lines */}
                            <div className="space-y-2 bg-slate-900 border border-slate-800 rounded-xl p-3">
                              <h4 className="font-bold text-white flex items-center justify-between">
                                <span>Balanced Journal Lines</span>
                                <span className="text-[10px] text-emerald-400 font-mono">
                                  Debits = Credits
                                </span>
                              </h4>
                              {linkedJe ? (
                                <div className="divide-y divide-slate-800 text-[11px]">
                                  {linkedJe.lines.map((line) => (
                                    <div
                                      key={line.id}
                                      className="py-1 flex items-center justify-between font-mono"
                                    >
                                      <span className="text-slate-300">
                                        {line.glAccountCode} - {line.glAccountName}
                                      </span>
                                      <div className="flex gap-4">
                                        <span className="text-emerald-400 w-16 text-right">
                                          {line.debit > 0 ? formatMoney(line.debit) : '-'}
                                        </span>
                                        <span className="text-rose-400 w-16 text-right">
                                          {line.credit > 0 ? formatMoney(line.credit) : '-'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-slate-500 text-[11px]">
                                  Draft transaction. Balanced journal entries will be generated when
                                  approved.
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
