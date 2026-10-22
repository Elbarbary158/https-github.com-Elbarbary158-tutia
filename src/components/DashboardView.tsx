import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertTriangle,
  Receipt,
  FileCheck,
  Building,
  CreditCard,
  PieChart,
  Layers,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Download,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface DashboardViewProps {
  onScanClick: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onScanClick, onNavigateToTab }) => {
  const {
    transactions,
    bankAccounts,
    customers,
    suppliers,
    currentCurrency,
    formatMoney,
    convertAmount,
    currentOrg,
    language,
    isRtl,
    t,
  } = useFinance();

  // Financial KPI calculations
  const postedRevenue = transactions
    .filter((t) => t.type === 'REVENUE' && t.status === 'POSTED')
    .reduce((sum, t) => sum + convertAmount(t.amount, t.currency), 0);

  const postedExpenses = transactions
    .filter((t) => t.type === 'EXPENSE' && t.status === 'POSTED')
    .reduce((sum, t) => sum + convertAmount(t.amount, t.currency), 0);

  const netProfit = postedRevenue - postedExpenses;
  const profitMargin = postedRevenue > 0 ? (netProfit / postedRevenue) * 100 : 0;

  const totalTransactionsCount = transactions.length;
  const avgTransactionValue =
    totalTransactionsCount > 0
      ? (postedRevenue + postedExpenses) / totalTransactionsCount
      : 0;

  const needsReviewItems = transactions.filter(
    (t) => t.status === 'NEEDS_REVIEW' || t.status === 'FLAGGED_DUPLICATE'
  );
  const duplicateItems = transactions.filter((t) => t.status === 'FLAGGED_DUPLICATE');

  const totalBankBalance = bankAccounts.reduce(
    (sum, b) => sum + convertAmount(b.currentBalance, b.currency),
    0
  );

  const totalAR = customers.reduce((sum, c) => sum + c.outstandingReceivable, 0);
  const totalAP = suppliers.reduce((sum, s) => sum + s.outstandingPayable, 0);

  // Category breakdown for chart
  const expenseCategories = [
    {
      name: language === 'ar' ? 'تكلفة البضاعة المباعة (COGS)' : 'Cost of Goods Sold (COGS)',
      amount: 38200,
      color: 'bg-indigo-500',
      pct: 49.7,
    },
    {
      name: language === 'ar' ? 'الإيجار وصيانة المرافق' : 'Rent & Facilities',
      amount: 15400,
      color: 'bg-sky-500',
      pct: 20.0,
    },
    {
      name: language === 'ar' ? 'الأسطول والوقود والنقل' : 'Fleet, Fuel & Transport',
      amount: 8940,
      color: 'bg-emerald-500',
      pct: 11.6,
    },
    {
      name: language === 'ar' ? 'البرمجيات والحوسبة السحابية' : 'Software & Cloud SaaS',
      amount: 6850,
      color: 'bg-amber-500',
      pct: 8.9,
    },
    {
      name: language === 'ar' ? 'الأدوات المكتبية والنثريات' : 'Office Supplies & Misc',
      amount: 4320,
      color: 'bg-purple-500',
      pct: 5.6,
    },
    {
      name: language === 'ar' ? 'الكهرباء والمرافق العامة' : 'Utilities & Power',
      amount: 3110,
      color: 'bg-rose-500',
      pct: 4.2,
    },
  ];

  // Monthly revenue & expense chart data
  const monthlyData = [
    { month: language === 'ar' ? 'يونيو' : 'Jun', rev: 92000, exp: 68000 },
    { month: language === 'ar' ? 'يوليو' : 'Jul', rev: 104000, exp: 71000 },
    { month: language === 'ar' ? 'أغسطس' : 'Aug', rev: 112000, exp: 74500 },
    { month: language === 'ar' ? 'سبتمبر' : 'Sep', rev: 118000, exp: 73200 },
    {
      month: language === 'ar' ? 'أكتوبر (الحالي)' : 'Oct (Current)',
      rev: postedRevenue || 125450,
      exp: postedExpenses || 76820,
    },
  ];

  const maxVal = Math.max(...monthlyData.map((d) => Math.max(d.rev, d.exp)));

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Context Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider">
              {t('liveAgent')}
            </span>
            <span className="text-xs text-slate-400">
              {t('entityLabel')}: <strong className="text-white">{currentOrg.name}</strong>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            {t('execDashboardTitle')}
          </h1>
          <p className="text-sm text-slate-300 mt-0.5">
            {t('execDashboardSub')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateToTab('ai-analyst')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-medium transition"
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>{t('askAnalystBtn')}</span>
          </button>
          <button
            onClick={onScanClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/25 transition active:scale-95"
          >
            <Receipt className="w-4 h-4" />
            <span>{t('scanReceiptBtn')}</span>
          </button>
        </div>
      </div>

      {/* Recommended Prompt Highlight KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {t('totalRevenue')}
            </span>
            <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3 mr-1 ml-1" /> +18.4%
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
            {formatMoney(postedRevenue || 125450)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
            <span>
              {language === 'ar' ? 'مقارنة بالشهر السابق: +19,450$' : 'Vs last month: +$19,450'}
            </span>
            <span className="text-[10px] text-slate-400">
              {language === 'ar' ? 'معتمد في الدفتر' : 'Approved ledger'}
            </span>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {t('transactions')}
            </span>
            <span className="flex items-center text-xs font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3 mr-0.5 ml-0.5" /> +12.1%
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
            {(1284).toLocaleString()}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
            <span>
              {language === 'ar' ? 'متوسط المعاملة: ' : 'Avg ticket: '}
              {formatMoney(avgTransactionValue || 157.5)}
            </span>
            <span className="text-[10px] text-slate-400">
              {language === 'ar' ? 'جميع القنوات' : 'All channels'}
            </span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {t('totalExpenses')}
            </span>
            <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <ArrowDownRight className="w-3 h-3 mr-0.5 ml-0.5" /> -4.2%
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
            {formatMoney(postedExpenses || 76820)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
            <span>
              {language === 'ar' ? 'نسبة استهلاك الموازنة: 86.2%' : 'Budget utilization: 86.2%'}
            </span>
            <span className="text-[10px] text-slate-400">
              {language === 'ar' ? 'ضمن الخطة' : 'Within plan'}
            </span>
          </div>
        </div>

        {/* Needs Review */}
        <div
          onClick={() => onNavigateToTab('queue')}
          className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-5 shadow-sm hover:border-amber-400 transition cursor-pointer group bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> {t('needsReview')}
            </span>
            <span className="text-xs font-semibold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              {t('actionRequired')}{' '}
              <ChevronIcon className="w-3 h-3 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-400 font-mono flex items-baseline gap-2">
            {needsReviewItems.length || 17}
            {duplicateItems.length > 0 && (
              <span className="text-xs font-normal text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                {duplicateItems.length}{' '}
                {language === 'ar' ? 'تنبيه تكرار' : 'duplicate flag'}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-amber-200/70 border-t border-amber-500/20 pt-2">
            <span>
              {language === 'ar' ? 'طابور التدقيق والمطابقة' : 'OCR & CRM verification queue'}
            </span>
            <span className="text-[10px] font-medium text-amber-400 underline">
              {t('openQueue')}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Financial Balance Indicators: Net Profit, Cash & Bank, AR, AP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-slate-200">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">{t('netProfit')}</div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            {formatMoney(netProfit || 48630)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {t('profitMargin')}:{' '}
            <strong className="text-emerald-300">{profitMargin.toFixed(1)}%</strong>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">{t('cashBankBalances')}</div>
          <div className="text-xl font-bold text-sky-400 font-mono mt-1">
            {formatMoney(totalBankBalance || 125350)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {language === 'ar' ? 'عبر 4 حسابات تشغيلية' : 'Across 4 operating accounts'}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">{t('accountsReceivable')}</div>
          <div className="text-xl font-bold text-indigo-400 font-mono mt-1">
            {formatMoney(totalAR)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {customers.length} {language === 'ar' ? 'عميل تجاري نشط' : 'commercial customers'}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">{t('accountsPayable')}</div>
          <div className="text-xl font-bold text-amber-400 font-mono mt-1">
            {formatMoney(totalAP)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {suppliers.length} {language === 'ar' ? 'مورد معتمد' : 'active suppliers'}
          </div>
        </div>
      </div>

      {/* 4-Step Transaction Processing Pipeline (Master Prompt Exact Diagram) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              {t('pipelineTitle')}
            </h2>
            <p className="text-xs text-slate-400">
              {t('pipelineSub')}
            </p>
          </div>
          <span className="text-xs text-sky-400 font-mono bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20">
            {t('pipelineRule')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="bg-slate-850/80 border border-slate-800 rounded-xl p-4 relative group hover:border-sky-500/50 transition">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 font-bold text-xs border border-sky-500/30">
                1
              </span>
              <span className="font-semibold text-sm text-slate-100">{t('step1Title')}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {t('step1Desc')}
            </p>
            <div className="mt-3 text-[11px] text-sky-400 font-medium flex items-center gap-1">
              <span>JPG, PNG, PDF, Camera</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-850/80 border border-slate-800 rounded-xl p-4 relative group hover:border-indigo-500/50 transition">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs border border-indigo-500/30">
                2
              </span>
              <span className="font-semibold text-sm text-slate-100">{t('step2Title')}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {t('step2Desc')}
            </p>
            <div className="mt-3 text-[11px] text-indigo-400 font-medium flex items-center gap-1">
              <span>{language === 'ar' ? 'فحص الدقة والعمليات الحسابية' : 'Confidence scoring & math check'}</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-850/80 border border-slate-800 rounded-xl p-4 relative group hover:border-emerald-500/50 transition">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                3
              </span>
              <span className="font-semibold text-sm text-slate-100">{t('step3Title')}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {t('step3Desc')}
            </p>
            <div className="mt-3 text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span>{language === 'ar' ? 'كشف التكرار وقواعد الأسماء المستعارة' : 'Duplicate detection & alias rules'}</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-850/80 border border-slate-800 rounded-xl p-4 relative group hover:border-purple-500/50 transition">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 font-bold text-xs border border-purple-500/30">
                4
              </span>
              <span className="font-semibold text-sm text-slate-100">{t('step4Title')}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {t('step4Desc')}
            </p>
            <div className="mt-3 text-[11px] text-purple-400 font-medium flex items-center gap-1">
              <span>{language === 'ar' ? 'قائمة الدخل، الميزانية، والتدفق النقدي' : 'P&L, Balance Sheet, Cash Flow'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section: Monthly Revenue/Expense Timeline & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Expenses Monthly Trend */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-sm">{t('monthlyTrendTitle')}</h3>
              <p className="text-xs text-slate-400">{t('monthlyTrendSub')} {currentCurrency}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-sky-500" />
                <span className="text-slate-300">{language === 'ar' ? 'الإيرادات' : 'Revenue'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500" />
                <span className="text-slate-300">{language === 'ar' ? 'المصروفات' : 'Expenses'}</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Representation */}
          <div className="h-48 flex items-end justify-between gap-4 pt-6 px-2 border-b border-slate-800">
            {monthlyData.map((d, idx) => {
              const revHeight = Math.round((d.rev / maxVal) * 140);
              const expHeight = Math.round((d.exp / maxVal) * 140);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center gap-1.5 h-36">
                    {/* Revenue Bar */}
                    <div
                      style={{ height: `${revHeight}px` }}
                      className="w-5 sm:w-8 bg-sky-500 rounded-t transition-all hover:bg-sky-400 relative group"
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow border border-slate-700 pointer-events-none">
                        {language === 'ar' ? 'إيراد: ' : 'Rev: '}{formatMoney(d.rev)}
                      </div>
                    </div>
                    {/* Expense Bar */}
                    <div
                      style={{ height: `${expHeight}px` }}
                      className="w-5 sm:w-8 bg-rose-500 rounded-t transition-all hover:bg-rose-400 relative group"
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow border border-slate-700 pointer-events-none">
                        {language === 'ar' ? 'مصروف: ' : 'Exp: '}{formatMoney(d.exp)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium truncate max-w-full">
                    {d.month}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400 mt-3 pt-1">
            <span>{language === 'ar' ? 'هامش التشغيل: 38.8%' : 'Operating Margin: 38.8%'}</span>
            <span>
              {language === 'ar' ? 'صافي التدفق التشغيلي: +' : 'Net Operating Inflow: +'}
              {formatMoney(netProfit || 48630)}
            </span>
          </div>
        </div>

        {/* Expense Categories Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center justify-between">
              <span>{t('expenseDistTitle')}</span>
              <PieChart className="w-4 h-4 text-slate-400" />
            </h3>
            <p className="text-xs text-slate-400 mb-4">{t('expenseDistSub')}</p>

            <div className="space-y-3">
              {expenseCategories.map((cat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 truncate max-w-[170px]">{cat.name}</span>
                    <span className="font-mono text-slate-200">
                      {formatMoney(cat.amount)} ({cat.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.color}`}
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>
              {language === 'ar' ? 'إجمالي المصنف: ' : 'Total Classified: '}
              {formatMoney(postedExpenses || 76820)}
            </span>
            <button
              onClick={() => onNavigateToTab('reports')}
              className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
            >
              {language === 'ar' ? 'قائمة الدخل كاملة' : 'Full P&L'} <ArrowIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Scanned Queue Sneak-peek */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              {t('pendingQueueTitle')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('pendingQueueSub')}
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('queue')}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
          >
            {language === 'ar'
              ? `عرض جميع العناصر (${needsReviewItems.length})`
              : `Open All ${needsReviewItems.length} Items`}{' '}
            <ChevronIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">{t('docRef')}</th>
                <th className="py-2.5 px-3">{t('date')}</th>
                <th className="py-2.5 px-3">{t('merchant')}</th>
                <th className="py-2.5 px-3">{t('amount')}</th>
                <th className="py-2.5 px-3">{t('ocrConfidence')}</th>
                <th className="py-2.5 px-3">{t('statusFlags')}</th>
                <th className="py-2.5 px-3 text-right rtl:text-left">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {needsReviewItems.slice(0, 4).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-mono font-medium text-slate-200">
                    {tx.referenceNo}
                  </td>
                  <td className="py-3 px-3">{tx.date}</td>
                  <td className="py-3 px-3 font-medium text-white">{tx.merchantName}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-100">
                    {formatMoney(tx.amount, tx.currency)}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        tx.confidenceScore > 0.9
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : tx.confidenceScore > 0.75
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {(tx.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {tx.status === 'FLAGGED_DUPLICATE' ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 w-fit">
                        <AlertTriangle className="w-3 h-3" /> {t('duplicateDetected')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 w-fit">
                        <Clock className="w-3 h-3" /> {t('needsReview')}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right rtl:text-left">
                    <button
                      onClick={() => onNavigateToTab('queue')}
                      className="px-2.5 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 font-medium text-[11px] transition"
                    >
                      {t('inspectAndPost')}
                    </button>
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
