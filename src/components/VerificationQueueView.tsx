import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Edit2,
  ShieldCheck,
  Building,
  UserCheck,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { FinancialTransaction, PaymentMethod, TransactionType } from '../types/finance';

export const VerificationQueueView: React.FC = () => {
  const {
    transactions,
    suppliers,
    customers,
    glAccounts,
    formatMoney,
    convertAmount,
    currentCurrency,
    approveAndPostTransaction,
    rejectTransaction,
    updateTransaction,
    userRole,
  } = useFinance();

  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Filter transactions in review or duplicate status
  const queueTransactions = transactions.filter((t) => {
    const isQueueStatus = t.status === 'NEEDS_REVIEW' || t.status === 'FLAGGED_DUPLICATE';
    if (!isQueueStatus) return false;
    if (filterType === 'DUPLICATES') return t.status === 'FLAGGED_DUPLICATE';
    if (filterType === 'LOW_CONFIDENCE') return t.confidenceScore < 0.8;
    if (filterType === 'UNMATCHED') return !t.supplierId && !t.customerId;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.referenceNo.toLowerCase().includes(q) ||
        t.merchantName.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedTx = transactions.find((t) => t.id === selectedTxId) || queueTransactions[0];

  // Editable local state for selected transaction
  const [editMerchant, setEditMerchant] = useState('');
  const [editRef, setEditRef] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editTax, setEditTax] = useState<number>(0);
  const [editGlCode, setEditGlCode] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('CREDIT_CARD');
  const [editSupplierId, setEditSupplierId] = useState<string>('');
  const [editCustomerId, setEditCustomerId] = useState<string>('');

  // Sync edit state whenever selected transaction changes
  React.useEffect(() => {
    if (selectedTx) {
      setEditMerchant(selectedTx.merchantName || '');
      setEditRef(selectedTx.referenceNo || '');
      setEditDate(selectedTx.date || '');
      setEditAmount(selectedTx.amount || 0);
      setEditTax(selectedTx.taxAmount || 0);
      setEditGlCode(selectedTx.glAccountCode || '6010');
      setEditPaymentMethod(selectedTx.paymentMethod || 'CREDIT_CARD');
      setEditSupplierId(selectedTx.supplierId || '');
      setEditCustomerId(selectedTx.customerId || '');
    }
  }, [selectedTx?.id]);

  const handleSaveCorrections = () => {
    if (!selectedTx) return;
    const matchedGl = glAccounts.find((g) => g.code === editGlCode);
    const matchedSupp = suppliers.find((s) => s.id === editSupplierId);
    const matchedCust = customers.find((c) => c.id === editCustomerId);

    updateTransaction(selectedTx.id, {
      merchantName: editMerchant,
      referenceNo: editRef,
      date: editDate,
      amount: editAmount,
      taxAmount: editTax,
      glAccountCode: editGlCode,
      glAccountName: matchedGl?.name || selectedTx.glAccountName,
      paymentMethod: editPaymentMethod,
      supplierId: editSupplierId || undefined,
      supplierName: matchedSupp?.name || undefined,
      customerId: editCustomerId || undefined,
      customerName: matchedCust?.name || undefined,
    });

    setActionSuccessMsg('Corrections saved to audit history.');
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleApprove = () => {
    if (!selectedTx) return;
    const res = approveAndPostTransaction(
      selectedTx.id,
      'Approved after human verification & arithmetic check.'
    );
    if (res.success) {
      setActionSuccessMsg(`Posted ${res.journalEntry?.entryNumber}! Balanced double-entry active.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } else {
      alert(res.error);
    }
  };

  const handleRejectConfirm = () => {
    if (!selectedTx) return;
    rejectTransaction(selectedTx.id, rejectReason || 'Insufficient documentary evidence.');
    setShowRejectModal(false);
    setRejectReason('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Human-in-the-Loop Auditor Queue
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            AI Extraction & Verification Queue
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Validate OCR extractions, resolve duplicate alarms, confirm CRM accounts, and approve
            double-entry journal postings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800 border border-slate-700/80 rounded-xl px-3.5 py-2 text-right">
            <span className="text-[11px] text-slate-400 block">Pending Review</span>
            <span className="text-lg font-bold text-amber-400 font-mono">
              {queueTransactions.length}
            </span>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Queue List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Filters & Search */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search reference, merchant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-wrap gap-1 text-[11px]">
              {[
                { id: 'ALL', label: 'All Items' },
                { id: 'DUPLICATES', label: 'Duplicates' },
                { id: 'LOW_CONFIDENCE', label: 'Low Confidence' },
                { id: 'UNMATCHED', label: 'Unmatched CRM' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    filterType === f.id
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of items */}
          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {queueTransactions.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-xl text-slate-500 text-xs">
                No items matching the selected filters.
              </div>
            ) : (
              queueTransactions.map((tx) => {
                const isSelected = selectedTx?.id === tx.id;
                const isDuplicate = tx.status === 'FLAGGED_DUPLICATE';
                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTxId(tx.id)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition relative ${
                      isSelected
                        ? 'bg-slate-800/90 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                        : isDuplicate
                        ? 'bg-rose-950/20 border-rose-900/50 hover:border-rose-700'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-slate-200">
                        {tx.referenceNo}
                      </span>
                      <span className="font-mono font-bold text-white">
                        {formatMoney(tx.amount, tx.currency)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-slate-400">
                      <span className="font-medium text-slate-300 truncate max-w-[180px]">
                        {tx.merchantName}
                      </span>
                      <span>{tx.date}</span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          tx.confidenceScore > 0.9
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : tx.confidenceScore > 0.75
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        OCR: {(tx.confidenceScore * 100).toFixed(0)}%
                      </span>

                      {isDuplicate && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold text-[10px] flex items-center gap-1 border border-rose-500/30">
                          <AlertTriangle className="w-3 h-3" /> Duplicate Match
                        </span>
                      )}

                      {!tx.supplierId && !tx.customerId && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                          Unlinked CRM
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Document & Fields Verification Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTx ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              {/* Top Inspector Status */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-mono font-bold text-sky-400">
                      ID: {selectedTx.id}
                    </span>
                    {selectedTx.status === 'FLAGGED_DUPLICATE' ? (
                      <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Flagged Duplicate
                      </span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Awaiting Approval
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-white mt-1">
                    Document Inspector & Double-Entry Review
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-3 py-1.5 rounded-lg border border-rose-700/60 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={handleApprove}
                    disabled={
                      userRole === 'Read-only Management' || userRole === 'Auditor'
                    }
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Approve & Post Journal</span>
                  </button>
                </div>
              </div>

              {/* Duplicate Banner warning if flagged */}
              {selectedTx.duplicateFlag?.isDuplicate && (
                <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>DUPLICATE SUSPICION WARNING</span>
                  </div>
                  <p>{selectedTx.duplicateFlag.reason}</p>
                  <p className="text-[11px] text-rose-300/80">
                    Matched against posted transaction{' '}
                    <strong className="text-white underline">
                      {selectedTx.duplicateFlag.matchedTransactionId}
                    </strong>
                    . Please verify whether this is an amended invoice or redundant payment request.
                  </p>
                </div>
              )}

              {/* Side-by-side: Original Receipt and Extracted Edit Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original Document Preview */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Original Document Preview</span>
                    <span className="text-[10px] text-sky-400 font-mono">100% Audit Copy</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex items-center justify-center min-h-[280px]">
                    {selectedTx.documentImage ? (
                      <img
                        src={selectedTx.documentImage}
                        alt="Receipt"
                        className="max-h-[300px] max-w-full object-contain rounded shadow"
                      />
                    ) : (
                      <div className="text-center text-slate-500 text-xs">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <span>Electronic transaction slip</span>
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Doc Name: {selectedTx.documentName || 'Scanned Document'}</span>
                    <span>Created: {new Date(selectedTx.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Editable Extracted Fields */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Extracted Fields (Editable)</span>
                    <button
                      onClick={handleSaveCorrections}
                      className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
                    >
                      <Edit2 className="w-3 h-3" /> Save Changes
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">
                        Merchant / Counterparty:
                      </label>
                      <input
                        type="text"
                        value={editMerchant}
                        onChange={(e) => setEditMerchant(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-0.5">
                          Reference No:
                        </label>
                        <input
                          type="text"
                          value={editRef}
                          onChange={(e) => setEditRef(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-0.5">Date:</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-0.5">
                          Amount ({selectedTx.currency}):
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editAmount}
                          onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono font-bold text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-0.5">
                          Tax / VAT:
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editTax}
                          onChange={(e) => setEditTax(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">
                        Chart of Accounts (GL):
                      </label>
                      <select
                        value={editGlCode}
                        onChange={(e) => setEditGlCode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                      >
                        {glAccounts.map((gl) => (
                          <option key={gl.code} value={gl.code}>
                            {gl.code} - {gl.name} ({gl.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* CRM Linkage */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">
                        Link CRM Supplier or Customer:
                      </label>
                      <select
                        value={editSupplierId || editCustomerId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const isSup = suppliers.some((s) => s.id === val);
                          if (isSup) {
                            setEditSupplierId(val);
                            setEditCustomerId('');
                          } else {
                            setEditCustomerId(val);
                            setEditSupplierId('');
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                      >
                        <option value="">-- No CRM Link (Ad-hoc) --</option>
                        <optgroup label="Suppliers (Vendors)">
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.code})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Customers (Clients)">
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Proposed Double-Entry Balancing Preview */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-sky-400" />
                    Double-Entry Journal Preview (Rule #9: Balanced Entries)
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    Debit = Credit Guaranteed
                  </span>
                </div>

                <div className="text-xs divide-y divide-slate-800">
                  <div className="grid grid-cols-12 py-1.5 text-slate-400 font-medium text-[11px]">
                    <div className="col-span-6">GL Account</div>
                    <div className="col-span-3 text-right">Debit</div>
                    <div className="col-span-3 text-right">Credit</div>
                  </div>

                  {selectedTx.type === 'EXPENSE' ? (
                    <>
                      <div className="grid grid-cols-12 py-1.5 text-slate-200">
                        <div className="col-span-6 font-mono">
                          {editGlCode} - {glAccounts.find((g) => g.code === editGlCode)?.name}
                        </div>
                        <div className="col-span-3 text-right font-mono text-emerald-400">
                          {formatMoney(editAmount - editTax, selectedTx.currency)}
                        </div>
                        <div className="col-span-3 text-right font-mono text-slate-500">-</div>
                      </div>
                      {editTax > 0 && (
                        <div className="grid grid-cols-12 py-1.5 text-slate-200">
                          <div className="col-span-6 font-mono">2100 - VAT Input Reclaim</div>
                          <div className="col-span-3 text-right font-mono text-emerald-400">
                            {formatMoney(editTax, selectedTx.currency)}
                          </div>
                          <div className="col-span-3 text-right font-mono text-slate-500">-</div>
                        </div>
                      )}
                      <div className="grid grid-cols-12 py-1.5 text-slate-200">
                        <div className="col-span-6 font-mono">
                          1020 - Operating Bank / Cash Outflow
                        </div>
                        <div className="col-span-3 text-right font-mono text-slate-500">-</div>
                        <div className="col-span-3 text-right font-mono text-rose-400">
                          {formatMoney(editAmount, selectedTx.currency)}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-12 py-1.5 text-slate-200">
                        <div className="col-span-6 font-mono">
                          1020 - Operating Bank / Cash Inflow
                        </div>
                        <div className="col-span-3 text-right font-mono text-emerald-400">
                          {formatMoney(editAmount, selectedTx.currency)}
                        </div>
                        <div className="col-span-3 text-right font-mono text-slate-500">-</div>
                      </div>
                      <div className="grid grid-cols-12 py-1.5 text-slate-200">
                        <div className="col-span-6 font-mono">
                          {editGlCode} - {glAccounts.find((g) => g.code === editGlCode)?.name}
                        </div>
                        <div className="col-span-3 text-right font-mono text-slate-500">-</div>
                        <div className="col-span-3 text-right font-mono text-rose-400">
                          {formatMoney(editAmount - editTax, selectedTx.currency)}
                        </div>
                      </div>
                      {editTax > 0 && (
                        <div className="grid grid-cols-12 py-1.5 text-slate-200">
                          <div className="col-span-6 font-mono">2100 - VAT Output Liability</div>
                          <div className="col-span-3 text-right font-mono text-slate-500">-</div>
                          <div className="col-span-3 text-right font-mono text-rose-400">
                            {formatMoney(editTax, selectedTx.currency)}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
              Select a transaction on the left to inspect and verify.
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" /> Reject Transaction
            </h3>
            <p className="text-xs text-slate-300">
              Please specify the audit reason for rejecting this document (e.g. illegible text,
              unauthorized expense, duplicate entry):
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Handwritten slip missing manager approval signature."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
