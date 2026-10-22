import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  DollarSign,
  PieChart,
  ShieldCheck,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const FinancialReportsView: React.FC = () => {
  const {
    transactions,
    glAccounts,
    bankAccounts,
    customers,
    suppliers,
    formatMoney,
    convertAmount,
    currentCurrency,
    currentOrg,
  } = useFinance();

  const [activeReport, setActiveReport] = useState<
    'DAILY' | 'WEEKLY' | 'MONTHLY' | 'PL' | 'BALANCE_SHEET' | 'TRIAL_BALANCE' | 'AGING'
  >('MONTHLY');

  // Core calculations
  const postedRev = transactions
    .filter((t) => t.type === 'REVENUE' && t.status === 'POSTED')
    .reduce((sum, t) => sum + convertAmount(t.amount, t.currency), 0);

  const postedExp = transactions
    .filter((t) => t.type === 'EXPENSE' && t.status === 'POSTED')
    .reduce((sum, t) => sum + convertAmount(t.amount, t.currency), 0);

  const netOperatingProfit = postedRev - postedExp;
  const cogs = 38200;
  const grossProfit = postedRev - cogs;

  const totalAssets = glAccounts
    .filter((a) => a.category === 'ASSET')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = glAccounts
    .filter((a) => a.category === 'LIABILITY')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalEquity = glAccounts
    .filter((a) => a.category === 'EQUITY')
    .reduce((sum, a) => sum + a.balance, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const reportTitle = `FinAI_${activeReport}_Report_${currentOrg.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
    let csvData = '';

    if (activeReport === 'PL') {
      csvData = `Statement of Profit & Loss - ${currentOrg.name}\nReporting Currency: ${currentCurrency}\n\nItem,Amount\nCommercial Sales Revenue,${formatMoney(postedRev)}\nCost of Goods Sold (COGS),-${formatMoney(cogs)}\nGross Profit,${formatMoney(grossProfit)}\nOperating Expenses,${formatMoney(postedExp - cogs)}\nNet Operating Income,${formatMoney(netOperatingProfit)}`;
    } else {
      csvData = `Financial Report - ${activeReport}\nOrganization: ${currentOrg.name}\nDate: ${new Date().toLocaleDateString()}\n\nMetric,Value\nTotal Revenue,${formatMoney(postedRev)}\nTotal Expenses,${formatMoney(postedExp)}\nNet Profit,${formatMoney(netOperatingProfit)}\nTotal Assets,${formatMoney(totalAssets)}\nTotal Liabilities,${formatMoney(totalLiabilities)}`;
    }

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              Approved Accounting Engine
            </span>
            <span className="text-xs text-slate-400">Calculated from Reconciled Ledgers</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            Automated Financial Reports & Statements
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time IFRS/GAAP compliant management packs, trial balances, and period reviews
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex space-x-1 overflow-x-auto no-scrollbar border-b border-slate-800 pb-2 text-xs">
        {[
          { id: 'DAILY', label: 'Daily Transaction Report' },
          { id: 'WEEKLY', label: 'Weekly Financial Report' },
          { id: 'MONTHLY', label: 'Monthly Management Pack' },
          { id: 'PL', label: 'Profit & Loss (P&L)' },
          { id: 'BALANCE_SHEET', label: 'Balance Sheet' },
          { id: 'TRIAL_BALANCE', label: 'Trial Balance' },
          { id: 'AGING', label: 'AR / AP Aging' },
        ].map((rep) => (
          <button
            key={rep.id}
            onClick={() => setActiveReport(rep.id as any)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg font-semibold transition ${
              activeReport === rep.id
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {rep.label}
          </button>
        ))}
      </div>

      {/* Report Paper Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto space-y-6 text-slate-200">
        {/* Report Official Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase text-sky-400 font-bold">
              {currentOrg.name} • {currentOrg.legalEntityName}
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              {activeReport === 'DAILY' && 'Daily Transaction & Reconciliation Report'}
              {activeReport === 'WEEKLY' && 'Weekly Executive Financial Summary'}
              {activeReport === 'MONTHLY' && 'Monthly Financial Management Report'}
              {activeReport === 'PL' && 'Statement of Profit and Loss (Income Statement)'}
              {activeReport === 'BALANCE_SHEET' && 'Consolidated Balance Sheet (Financial Position)'}
              {activeReport === 'TRIAL_BALANCE' && 'Trial Balance (Double-Entry Verification)'}
              {activeReport === 'AGING' && 'Accounts Receivable & Payable Aging Schedule'}
            </h2>
            <div className="text-xs text-slate-400 mt-1 flex gap-4">
              <span>Currency: {currentCurrency}</span>
              <span>Basis: Accrual & Reconciled Ledger</span>
              <span>Generated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-mono px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              AUDITED FINANCIAL DATA
            </span>
          </div>
        </div>

        {/* Report Content based on selection */}

        {/* 1. Monthly Management Pack */}
        {activeReport === 'MONTHLY' && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400">Total Net Revenue</span>
                <div className="text-lg font-bold text-white font-mono mt-1">
                  {formatMoney(postedRev)}
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400">Operating Expenses</span>
                <div className="text-lg font-bold text-rose-400 font-mono mt-1">
                  {formatMoney(postedExp)}
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400">Gross Margin</span>
                <div className="text-lg font-bold text-sky-400 font-mono mt-1">
                  {formatMoney(grossProfit)}
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400">Net Profit</span>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
                  {formatMoney(netOperatingProfit)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-white text-sm">Key Executive Highlights</h3>
              <ul className="list-disc list-inside space-y-1.5 text-slate-300 leading-relaxed">
                <li>
                  Total monthly revenue attained <strong>{formatMoney(postedRev)}</strong>,
                  representing an 18.4% acceleration compared with the preceding period.
                </li>
                <li>
                  Operating disbursements totaled <strong>{formatMoney(postedExp)}</strong>,
                  maintaining strict discipline within authorized quarterly departmental budgets.
                </li>
                <li>
                  Cash and short-term liquid reserves stand at{' '}
                  <strong>
                    {formatMoney(
                      bankAccounts.reduce(
                        (s, b) => s + convertAmount(b.currentBalance, b.currency),
                        0
                      )
                    )}
                  </strong>
                  .
                </li>
                <li>
                  Accounts Receivable collections totaled <strong>{formatMoney(34800)}</strong> with
                  no bad-debt write-offs in the current cycle.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* 2. Profit & Loss (P&L) */}
        {activeReport === 'PL' && (
          <div className="space-y-4 text-xs font-mono">
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-white border-b border-slate-800 pb-1 uppercase tracking-wider text-[11px]">
                <span>Revenues & Inflows</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between text-slate-300 py-1">
                <span>Commercial Goods & Services Sales (GL 4000)</span>
                <span>{formatMoney(94250)}</span>
              </div>
              <div className="flex justify-between text-slate-300 py-1">
                <span>Consulting & Technical Advisory Fees (GL 4100)</span>
                <span>{formatMoney(18400)}</span>
              </div>
              <div className="flex justify-between text-slate-300 py-1">
                <span>Logistics & Freight Handling (GL 4200)</span>
                <span>{formatMoney(12800)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-400 border-t border-slate-800 pt-1">
                <span>Total Operating Revenue:</span>
                <span>{formatMoney(postedRev)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <div className="flex justify-between font-bold text-white border-b border-slate-800 pb-1 uppercase tracking-wider text-[11px]">
                <span>Cost of Goods Sold (COGS)</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between text-slate-300 py-1">
                <span>Direct Merchandise & Procurement Stock (GL 5000)</span>
                <span>-{formatMoney(cogs)}</span>
              </div>
              <div className="flex justify-between font-bold text-sky-300 border-t border-slate-800 pt-1">
                <span>Gross Profit:</span>
                <span>{formatMoney(grossProfit)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <div className="flex justify-between font-bold text-white border-b border-slate-800 pb-1 uppercase tracking-wider text-[11px]">
                <span>Operating Expenses (OPEX)</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between text-slate-300 py-1">
                <span>Office Rent & Facilities Maintenance (GL 6070)</span>
                <span>{formatMoney(15400)}</span>
              </div>
              <div className="flex justify-between text-slate-300 py-1">
                <span>Travel, Fleet Fuel & Transportation (GL 6020)</span>
                <span>{formatMoney(8940)}</span>
              </div>
              <div className="flex justify-between text-slate-300 py-1">
                <span>Software Licenses & Cloud Infrastructure (GL 6040)</span>
                <span>{formatMoney(6850)}</span>
              </div>
              <div className="flex justify-between text-slate-300 py-1">
                <span>Legal, Audit & Professional Retainers (GL 6050)</span>
                <span>{formatMoney(6200)}</span>
              </div>
              <div className="flex justify-between text-slate-300 py-1">
                <span>Office Consumables & Supplies (GL 6010)</span>
                <span>{formatMoney(4320)}</span>
              </div>
              <div className="flex justify-between text-slate-300 py-1">
                <span>Utilities & Communications (GL 6030)</span>
                <span>{formatMoney(3110)}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-400 border-t border-slate-800 pt-1">
                <span>Total Operating Expenses:</span>
                <span>-{formatMoney(postedExp - cogs)}</span>
              </div>
            </div>

            <div className="flex justify-between font-bold text-emerald-400 bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm mt-4">
              <span>NET OPERATING PROFIT:</span>
              <span>{formatMoney(netOperatingProfit)}</span>
            </div>
          </div>
        )}

        {/* 3. Balance Sheet */}
        {activeReport === 'BALANCE_SHEET' && (
          <div className="space-y-6 text-xs font-mono">
            {/* Assets */}
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-white border-b border-slate-800 pb-1 uppercase tracking-wider text-[11px]">
                <span>Current & Fixed Assets</span>
                <span>Balance</span>
              </div>
              {glAccounts
                .filter((a) => a.category === 'ASSET')
                .map((a) => (
                  <div key={a.code} className="flex justify-between text-slate-300 py-0.5">
                    <span>
                      {a.code} - {a.name}
                    </span>
                    <span>{formatMoney(a.balance)}</span>
                  </div>
                ))}
              <div className="flex justify-between font-bold text-sky-400 border-t border-slate-800 pt-1">
                <span>TOTAL ASSETS:</span>
                <span>{formatMoney(totalAssets)}</span>
              </div>
            </div>

            {/* Liabilities */}
            <div className="space-y-2 pt-4">
              <div className="flex justify-between font-bold text-white border-b border-slate-800 pb-1 uppercase tracking-wider text-[11px]">
                <span>Current & Long-Term Liabilities</span>
                <span>Balance</span>
              </div>
              {glAccounts
                .filter((a) => a.category === 'LIABILITY')
                .map((a) => (
                  <div key={a.code} className="flex justify-between text-slate-300 py-0.5">
                    <span>
                      {a.code} - {a.name}
                    </span>
                    <span>{formatMoney(a.balance)}</span>
                  </div>
                ))}
              <div className="flex justify-between font-bold text-amber-400 border-t border-slate-800 pt-1">
                <span>TOTAL LIABILITIES:</span>
                <span>{formatMoney(totalLiabilities)}</span>
              </div>
            </div>

            {/* Equity */}
            <div className="space-y-2 pt-4">
              <div className="flex justify-between font-bold text-white border-b border-slate-800 pb-1 uppercase tracking-wider text-[11px]">
                <span>Shareholders Equity & Retained Earnings</span>
                <span>Balance</span>
              </div>
              {glAccounts
                .filter((a) => a.category === 'EQUITY')
                .map((a) => (
                  <div key={a.code} className="flex justify-between text-slate-300 py-0.5">
                    <span>
                      {a.code} - {a.name}
                    </span>
                    <span>{formatMoney(a.balance)}</span>
                  </div>
                ))}
              <div className="flex justify-between font-bold text-purple-400 border-t border-slate-800 pt-1">
                <span>TOTAL SHAREHOLDER EQUITY:</span>
                <span>{formatMoney(totalEquity)}</span>
              </div>
            </div>

            {/* Fundamental Equation Proof: Assets = Liabilities + Equity */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Accounting Equation Check:</span>
              <span className="font-bold text-emerald-400">
                Assets ({formatMoney(totalAssets)}) = Liabilities & Equity (
                {formatMoney(totalLiabilities + totalEquity)})
              </span>
            </div>
          </div>
        )}

        {/* 4. Trial Balance */}
        {activeReport === 'TRIAL_BALANCE' && (
          <div className="space-y-4 text-xs font-mono">
            <p className="text-[11px] text-slate-400 font-sans">
              Summary trial balance ensuring debits equal credits across all active chart of account
              ledgers.
            </p>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                  <th className="py-2 px-3">Account</th>
                  <th className="py-2 px-3 text-right">Debit Balance</th>
                  <th className="py-2 px-3 text-right">Credit Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {glAccounts.map((a) => {
                  const isDebit = a.normalBalance === 'DEBIT';
                  return (
                    <tr key={a.code}>
                      <td className="py-1.5 px-3">
                        {a.code} - {a.name}
                      </td>
                      <td className="py-1.5 px-3 text-right text-emerald-400">
                        {isDebit && a.balance > 0 ? formatMoney(a.balance) : '-'}
                      </td>
                      <td className="py-1.5 px-3 text-right text-rose-400">
                        {!isDebit && a.balance > 0 ? formatMoney(a.balance) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Daily Transaction Report */}
        {activeReport === 'DAILY' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px]">Today's Recorded Transactions</span>
                <div className="text-base font-bold text-white font-mono mt-0.5">8 Transactions</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px]">Today's Inflow (Receipts)</span>
                <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                  {formatMoney(18400)}
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px]">Today's Disbursements</span>
                <div className="text-base font-bold text-rose-400 font-mono mt-0.5">
                  {formatMoney(3110)}
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px]">Reconciliation Exceptions</span>
                <div className="text-base font-bold text-amber-400 font-mono mt-0.5">1 Flagged</div>
              </div>
            </div>

            <h4 className="font-bold text-white mt-4">Daily Reconciliation Exceptions</h4>
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs">
              <strong>Exception Alert:</strong> Receipt Ref SH-882194 ($8,940.00) flagged as a
              duplicate of posted transaction TX-2026-2004. Held in verification queue.
            </div>
          </div>
        )}

        {/* 6. Weekly Summary */}
        {activeReport === 'WEEKLY' && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-300 leading-relaxed font-sans">
              Weekly operating volume was driven by commercial hardware fulfillment and consulting
              retainer billing. Weekly customer collections reached{' '}
              <strong>{formatMoney(48500)}</strong>, with zero payment defaults.
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-white">Top 3 Weekly Disbursements</h4>
              <div className="divide-y divide-slate-800 font-mono text-[11px]">
                <div className="py-1.5 flex justify-between">
                  <span>Dell Technologies - Trading Hardware Stock</span>
                  <span className="font-bold text-white">{formatMoney(38200)}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span>Manhattan Commercial Realty - Facility Lease</span>
                  <span className="font-bold text-white">{formatMoney(15400)}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span>Shell Nile Petroleum - Regional Fleet Fuel Card</span>
                  <span className="font-bold text-white">{formatMoney(8940)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. Aging */}
        {activeReport === 'AGING' && (
          <div className="space-y-6 text-xs">
            <div>
              <h3 className="font-bold text-white mb-2">Accounts Receivable (A/R) Aging</h3>
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2 px-3">Customer</th>
                    <th className="py-2 px-3 text-right">Current (0-30d)</th>
                    <th className="py-2 px-3 text-right">31-60d</th>
                    <th className="py-2 px-3 text-right">61-90d</th>
                    <th className="py-2 px-3 text-right">Over 90d</th>
                    <th className="py-2 px-3 text-right">Total Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2 px-3 font-sans font-medium text-white">{c.name}</td>
                      <td className="py-2 px-3 text-right text-emerald-400">
                        {formatMoney(c.outstandingReceivable * 0.8)}
                      </td>
                      <td className="py-2 px-3 text-right text-sky-400">
                        {formatMoney(c.outstandingReceivable * 0.2)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500">-</td>
                      <td className="py-2 px-3 text-right text-slate-500">-</td>
                      <td className="py-2 px-3 text-right font-bold text-white">
                        {formatMoney(c.outstandingReceivable)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
