import React, { useState } from 'react';
import {
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Send,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const InvoicesAndBillsView: React.FC = () => {
  const { invoices, bills, formatMoney, currentCurrency } = useFinance();
  const [tab, setTab] = useState<'INVOICES' | 'BILLS'>('INVOICES');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              Billing & Payables
            </span>
            <span className="text-xs text-slate-400">Customer Invoices & Supplier Bills</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            Invoicing & Payment Allocation
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track customer receivables, supplier payment schedules, and aging status
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setTab('INVOICES')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            tab === 'INVOICES'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Customer Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setTab('BILLS')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            tab === 'BILLS'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Supplier Bills ({bills.length})
        </button>
      </div>

      {tab === 'INVOICES' ? (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sky-400 text-sm">
                    {inv.invoiceNumber}
                  </span>
                  {inv.status === 'PAID' && (
                    <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                      PAID IN FULL
                    </span>
                  )}
                  {inv.status === 'PENDING' && (
                    <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      PAYMENT PENDING
                    </span>
                  )}
                  {inv.status === 'OVERDUE' && (
                    <span className="text-[10px] font-semibold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                      OVERDUE
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-white mt-1">{inv.customerName}</h3>
                <div className="text-xs text-slate-400 mt-0.5 flex gap-4">
                  <span>Issued: {inv.issueDate}</span>
                  <span>Due: {inv.dueDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Total Due</span>
                  <span className="font-mono font-bold text-white text-base">
                    {formatMoney(inv.totalAmount, inv.currency)}
                  </span>
                  {inv.taxAmount > 0 && (
                    <span className="text-[10px] text-slate-400 block">
                      Incl. {formatMoney(inv.taxAmount, inv.currency)} VAT
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => (
            <div
              key={bill.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {bill.billNumber}
                  </span>
                  <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                    {bill.status}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mt-1">{bill.supplierName}</h3>
                <div className="text-xs text-slate-400 mt-0.5 flex gap-4">
                  <span>Bill Date: {bill.billDate}</span>
                  <span>Payment Due: {bill.dueDate}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Payable Amount</span>
                <span className="font-mono font-bold text-white text-base">
                  {formatMoney(bill.amount, bill.currency)}
                </span>
                <span className="text-[10px] text-slate-400 block">GL Code: {bill.glAccountCode}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
