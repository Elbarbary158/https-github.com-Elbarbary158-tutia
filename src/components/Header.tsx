import React from 'react';
import {
  Building2,
  GitBranch,
  Coins,
  ShieldCheck,
  ScanLine,
  Bell,
  Sparkles,
  Globe,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { ORGANIZATIONS, CURRENCIES } from '../data/initialData';
import { CurrencyCode, UserRole } from '../types/finance';

interface HeaderProps {
  onOpenScanModal: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenScanModal, activeTab, setActiveTab }) => {
  const {
    currentOrg,
    setCurrentOrg,
    currentBranchId,
    setCurrentBranchId,
    currentCurrency,
    setCurrentCurrency,
    userRole,
    setUserRole,
    transactions,
    language,
    setLanguage,
    isRtl,
    t,
  } = useFinance();

  const needsReviewCount = transactions.filter(
    (t) => t.status === 'NEEDS_REVIEW' || t.status === 'FLAGGED_DUPLICATE'
  ).length;

  const roles: UserRole[] = [
    'Super Admin',
    'Company Admin',
    'Finance Manager',
    'Accountant',
    'AR/AP Officer',
    'Auditor',
    'Read-only Management',
  ];

  const roleLabelsAr: Record<UserRole, string> = {
    'Super Admin': 'مدير عام للنظام',
    'Company Admin': 'مدير الشركة',
    'Finance Manager': 'مدير مالي',
    'Accountant': 'محاسب مالي',
    'AR/AP Officer': 'مسؤول تحصيل ودائنين',
    'Auditor': 'مدقق ومراجع حسابات',
    'Read-only Management': 'إدارة (للقراءة فقط)',
  };

  const currencies: CurrencyCode[] = ['USD', 'SDG', 'EGP', 'EUR', 'GBP', 'AED'];

  const navTabs = [
    { id: 'dashboard', label: t('tabDashboard') },
    { id: 'queue', label: `${t('tabQueue')} (${needsReviewCount})` },
    { id: 'transactions', label: t('tabTransactions') },
    { id: 'ai-analyst', label: t('tabAiAnalyst'), highlight: true },
    { id: 'ledger', label: t('tabLedger') },
    { id: 'crm', label: t('tabCrm') },
    { id: 'invoices', label: t('tabInvoices') },
    { id: 'reconciliation', label: t('tabReconciliation') },
    { id: 'reports', label: t('tabReports') },
    { id: 'audit', label: t('tabAudit') },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name: Official TUTIA Logo Asset */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-slate-800/80 p-1 flex items-center justify-center border border-amber-900/40 shadow-md">
              <img
                src="/assets/aistudio/Tutia_Clear__75e25393.png"
                alt="Tutia Official Logo"
                className="h-9 w-9 object-contain drop-shadow"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-amber-200 via-rose-200 to-amber-100 bg-clip-text text-transparent">
                  {language === 'ar' ? 'توتيا TUTIA' : 'TUTIA'}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {t('portalSub')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {t('tagline')}
              </p>
            </div>
          </div>

          {/* Context Switchers: Language, Org, Branch, Currency, Role */}
          <div className="flex items-center gap-2 sm:gap-2.5 text-xs">
            {/* Language Switcher (EN / AR) */}
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              title={language === 'ar' ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 text-amber-200 border border-indigo-700/60 font-semibold transition active:scale-95"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* Organization Selector */}
            <div className="relative hidden sm:flex items-center bg-slate-800/80 rounded-lg px-2.5 py-1.5 border border-slate-700/60">
              <Building2 className="w-3.5 h-3.5 text-slate-400 mr-1.5 ml-1.5" />
              <select
                aria-label="Select Organization"
                value={currentOrg.id}
                onChange={(e) => {
                  const org = ORGANIZATIONS.find((o) => o.id === e.target.value);
                  if (org) {
                    setCurrentOrg(org);
                    setCurrentBranchId('all');
                  }
                }}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
              >
                {ORGANIZATIONS.map((org) => (
                  <option key={org.id} value={org.id} className="bg-slate-900 text-white">
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Selector */}
            <div className="relative hidden md:flex items-center bg-slate-800/80 rounded-lg px-2.5 py-1.5 border border-slate-700/60">
              <GitBranch className="w-3.5 h-3.5 text-slate-400 mr-1.5 ml-1.5" />
              <select
                aria-label="Select Operating Branch"
                value={currentBranchId}
                onChange={(e) => setCurrentBranchId(e.target.value)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">
                  {t('allBranches')}
                </option>
                {currentOrg.branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                    {b.name} ({b.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Selector */}
            <div className="relative flex items-center bg-slate-800/80 rounded-lg px-2 py-1.5 border border-slate-700/60">
              <Coins className="w-3.5 h-3.5 text-emerald-400 mr-1.5 ml-1.5" />
              <select
                aria-label="Select Display Currency"
                value={currentCurrency}
                onChange={(e) => setCurrentCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer font-mono"
              >
                {currencies.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c} ({CURRENCIES[c].symbol.trim()})
                  </option>
                ))}
              </select>
            </div>

            {/* Role Switcher (Simulating RBAC) */}
            <div className="relative hidden lg:flex items-center bg-indigo-950/50 rounded-lg px-2.5 py-1.5 border border-indigo-700/50">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 mr-1.5 ml-1.5" />
              <span className="text-slate-400 mr-1 ml-1 text-[11px]">{t('roleLabel')}:</span>
              <select
                aria-label="Select User Role for Permissions"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="bg-transparent text-indigo-200 font-semibold focus:outline-none cursor-pointer"
              >
                {roles.map((r) => (
                  <option key={r} value={r} className="bg-slate-900 text-white">
                    {language === 'ar' ? roleLabelsAr[r] || r : r}
                  </option>
                ))}
              </select>
            </div>

            {/* Verification Alert Badge */}
            <button
              onClick={() => setActiveTab('queue')}
              title={`${needsReviewCount} ${t('needsReview')}`}
              className="relative p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <Bell className="w-4 h-4" />
              {needsReviewCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 animate-pulse">
                  {needsReviewCount}
                </span>
              )}
            </button>

            {/* Quick Action: Scan Receipt Button */}
            <button
              onClick={onOpenScanModal}
              className="flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium px-3.5 py-1.5 rounded-lg shadow-md shadow-sky-500/20 active:scale-95 transition"
            >
              <ScanLine className="w-4 h-4" />
              <span className="font-semibold">{t('scanReceiptBtn')}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex space-x-1 rtl:space-x-reverse overflow-x-auto no-scrollbar py-2 border-t border-slate-800/80 text-xs">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                } ${tab.highlight ? 'text-indigo-400 font-semibold' : ''}`}
              >
                {tab.highlight && <Sparkles className="w-3 h-3 text-indigo-400" />}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
