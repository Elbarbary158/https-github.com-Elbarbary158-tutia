import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { VerificationQueueView } from './components/VerificationQueueView';
import { TransactionsLedgerView } from './components/TransactionsLedgerView';
import { AiFinanceAnalystView } from './components/AiFinanceAnalystView';
import { DoubleEntryLedgerView } from './components/DoubleEntryLedgerView';
import { CrmAccountsView } from './components/CrmAccountsView';
import { InvoicesAndBillsView } from './components/InvoicesAndBillsView';
import { BankReconciliationView } from './components/BankReconciliationView';
import { FinancialReportsView } from './components/FinancialReportsView';
import { AuditTrailView } from './components/AuditTrailView';
import { ScanReceiptModal } from './components/ScanReceiptModal';
import { FinancialTransaction } from './types/finance';

function MainApp() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);

  const handleScanSuccess = (tx: FinancialTransaction) => {
    setActiveTab('queue');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top App Bar & Context Switchers */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScanModal={() => setIsScanModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onScanClick={() => setIsScanModalOpen(true)}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'queue' && <VerificationQueueView />}
        {activeTab === 'transactions' && <TransactionsLedgerView />}
        {activeTab === 'ai-analyst' && <AiFinanceAnalystView />}
        {activeTab === 'ledger' && <DoubleEntryLedgerView />}
        {activeTab === 'crm' && <CrmAccountsView />}
        {activeTab === 'invoices' && <InvoicesAndBillsView />}
        {activeTab === 'reconciliation' && <BankReconciliationView />}
        {activeTab === 'reports' && <FinancialReportsView />}
        {activeTab === 'audit' && <AuditTrailView />}
      </main>

      {/* Global Receipt Scanner & OCR Modal */}
      <ScanReceiptModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onSuccess={handleScanSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <MainApp />
    </FinanceProvider>
  );
}
