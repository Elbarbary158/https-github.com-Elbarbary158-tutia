import React, { useState } from 'react';
import {
  Users,
  Building,
  Mail,
  Phone,
  CreditCard,
  Search,
  Plus,
  Tag,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const CrmAccountsView: React.FC = () => {
  const { customers, suppliers, formatMoney, currentCurrency } = useFinance();
  const [tab, setTab] = useState<'CUSTOMERS' | 'SUPPLIERS'>('CUSTOMERS');
  const [search, setSearch] = useState('');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.accountNumber.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
              CRM Intelligence
            </span>
            <span className="text-xs text-slate-400">Automated OCR Account Matching Engine</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            CRM Directory & Account Matching
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified customers, suppliers, masked bank identifiers, and OCR alias detection rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <span>Total Receivables: </span>
            <strong className="text-emerald-400 font-mono">
              {formatMoney(customers.reduce((s, c) => s + c.outstandingReceivable, 0))}
            </strong>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <span>Total Payables: </span>
            <strong className="text-rose-400 font-mono">
              {formatMoney(suppliers.reduce((s, sup) => s + sup.outstandingPayable, 0))}
            </strong>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
        <div className="flex space-x-2 text-xs">
          <button
            onClick={() => setTab('CUSTOMERS')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              tab === 'CUSTOMERS'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Customers / Clients ({customers.length})
          </button>
          <button
            onClick={() => setTab('SUPPLIERS')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              tab === 'SUPPLIERS'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Suppliers / Vendors ({suppliers.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search CRM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {tab === 'CUSTOMERS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCustomers.map((c) => (
            <div
              key={c.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-sky-400 font-bold">{c.code}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{c.accountNumber}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-0.5">{c.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">
                    Outstanding Due
                  </span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {formatMoney(c.outstandingReceivable)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{c.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{c.phone}</span>
                </div>
              </div>

              {/* OCR Aliases */}
              <div className="pt-3 border-t border-slate-800/80">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">
                  OCR Matching Aliases:
                </span>
                <div className="flex flex-wrap gap-1">
                  {c.aliases.map((alias, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-mono"
                    >
                      {alias}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                <span>Terms: {c.paymentTerms}</span>
                <span>Credit Limit: {formatMoney(c.creditLimit)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSuppliers.map((s) => (
            <div
              key={s.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-sky-400 font-bold">{s.code}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {s.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-0.5">{s.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">
                    Outstanding Payable
                  </span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {formatMoney(s.outstandingPayable)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-slate-400">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    Bank: {s.bankName} ({s.bankAccountNumber})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  <span>Default GL Expense Code: {s.defaultGlAccountCode}</span>
                </div>
              </div>

              {/* OCR Aliases */}
              <div className="pt-3 border-t border-slate-800/80">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">
                  OCR Matching Aliases:
                </span>
                <div className="flex flex-wrap gap-1">
                  {s.aliases.map((alias, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 font-mono"
                    >
                      {alias}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
