import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  CurrencyCode,
  UserRole,
  Organization,
  GlAccount,
  BankAccount,
  Customer,
  Supplier,
  FinancialTransaction,
  JournalEntry,
  JournalLine,
  Invoice,
  SupplierBill,
  BankStatementLine,
  AuditEvent,
  OcrExtractionData,
  TransactionStatus,
} from '../types/finance';
import {
  ORGANIZATIONS,
  CURRENCIES,
  INITIAL_GL_ACCOUNTS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_TRANSACTIONS,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_INVOICES,
  INITIAL_BILLS,
  INITIAL_BANK_STATEMENT_LINES,
  INITIAL_AUDIT_LOGS,
} from '../data/initialData';
import { TRANSLATIONS, Language } from '../i18n/translations';

interface FinanceContextType {
  // Tenancy & RBAC
  currentOrg: Organization;
  setCurrentOrg: (org: Organization) => void;
  currentBranchId: string; // 'all' or specific branch
  setCurrentBranchId: (branchId: string) => void;
  currentCurrency: CurrencyCode;
  setCurrentCurrency: (currency: CurrencyCode) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  language: 'en' | 'ar';
  setLanguage: (lang: 'en' | 'ar') => void;
  isRtl: boolean;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;

  // Data
  transactions: FinancialTransaction[];
  journalEntries: JournalEntry[];
  glAccounts: GlAccount[];
  bankAccounts: BankAccount[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  bills: SupplierBill[];
  bankStatementLines: BankStatementLine[];
  auditLogs: AuditEvent[];

  // Actions
  scanReceipt: (
    imageBase64: string,
    filename: string,
    presetData?: Partial<FinancialTransaction>
  ) => Promise<{ success: boolean; transaction?: FinancialTransaction; error?: string }>;
  approveAndPostTransaction: (
    transactionId: string,
    notes?: string
  ) => { success: boolean; journalEntry?: JournalEntry; error?: string };
  rejectTransaction: (transactionId: string, reason: string) => void;
  updateTransaction: (
    transactionId: string,
    updates: Partial<FinancialTransaction>
  ) => void;
  reverseJournalEntry: (
    journalEntryId: string,
    reason: string
  ) => { success: boolean; error?: string };
  createManualJournalEntry: (
    date: string,
    description: string,
    reference: string,
    lines: { glAccountCode: string; debit: number; credit: number; memo?: string }[]
  ) => { success: boolean; journalEntry?: JournalEntry; error?: string };
  reconcileBankLine: (
    bankLineId: string,
    transactionId: string
  ) => { success: boolean; error?: string };
  askAiAnalyst: (question: string) => Promise<{ answer: string; error?: string }>;
  runAiAudit: () => Promise<{ findings: any[]; error?: string }>;

  // Helpers
  convertAmount: (amount: number, fromCurrency: CurrencyCode, toCurrency?: CurrencyCode) => number;
  formatMoney: (amount: number, currency?: CurrencyCode) => string;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOrg, setCurrentOrg] = useState<Organization>(ORGANIZATIONS[0]);
  const [currentBranchId, setCurrentBranchId] = useState<string>('all');
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyCode>('USD');
  const [userRole, setUserRole] = useState<UserRole>('Finance Manager');
  const [language, setLanguage] = useState<Language>('ar'); // Default to Arabic or allow toggle

  const isRtl = language === 'ar';

  React.useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRtl]);

  const t = (key: keyof typeof TRANSLATIONS['en']): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en'][key] || key;
  };

  const [transactions, setTransactions] = useState<FinancialTransaction[]>(INITIAL_TRANSACTIONS);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(INITIAL_JOURNAL_ENTRIES);
  const [glAccounts, setGlAccounts] = useState<GlAccount[]>(INITIAL_GL_ACCOUNTS);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(INITIAL_BANK_ACCOUNTS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [bills, setBills] = useState<SupplierBill[]>(INITIAL_BILLS);
  const [bankStatementLines, setBankStatementLines] = useState<BankStatementLine[]>(
    INITIAL_BANK_STATEMENT_LINES
  );
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(INITIAL_AUDIT_LOGS);

  // Conversion helper
  const convertAmount = (
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode = currentCurrency
  ): number => {
    if (fromCurrency === toCurrency) return amount;
    const fromRate = CURRENCIES[fromCurrency]?.rateToBaseUSD || 1;
    const toRate = CURRENCIES[toCurrency]?.rateToBaseUSD || 1;
    // convert from native to USD, then from USD to target
    const inUSD = amount / fromRate;
    return inUSD * toRate;
  };

  const formatMoney = (amount: number, currency: CurrencyCode = currentCurrency): string => {
    const sym = CURRENCIES[currency]?.symbol || '$';
    return `${sym}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const addAuditLog = (
    action: string,
    entityType: AuditEvent['entityType'],
    entityId: string,
    details: string,
    changes?: Record<string, { before: any; after: any }>
  ) => {
    const newLog: AuditEvent = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: `usr-${userRole.toLowerCase().replace(/\s+/g, '-')}`,
      userName: `Current User (${userRole})`,
      userRole,
      action,
      entityType,
      entityId,
      details,
      changes,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // AI OCR Scan & Ingestion Workflow
  const scanReceipt = async (
    imageBase64: string,
    filename: string,
    presetData?: Partial<FinancialTransaction>
  ): Promise<{ success: boolean; transaction?: FinancialTransaction; error?: string }> => {
    try {
      // Build CRM existing accounts context for the AI prompt
      const existingAccountsContext = [
        ...suppliers.map((s) => ({ type: 'SUPPLIER', id: s.id, name: s.name, aliases: s.aliases, defaultGl: s.defaultGlAccountCode })),
        ...customers.map((c) => ({ type: 'CUSTOMER', id: c.id, name: c.name, aliases: c.aliases, accountNumber: c.accountNumber })),
      ];

      let extraction: OcrExtractionData;

      // Check if this is a sample preset or user file
      if (presetData && presetData.referenceNo && presetData.amount) {
        // Fast path for preset samples with guaranteed high quality
        extraction = {
          merchantOrPartyName: presetData.merchantName || 'Detected Merchant',
          transactionType: presetData.type || 'EXPENSE',
          transactionDate: presetData.date || new Date().toISOString().split('T')[0],
          amount: presetData.amount,
          currency: presetData.currency || 'USD',
          taxAmount: presetData.taxAmount || 0,
          paymentMethod: presetData.paymentMethod || 'CREDIT_CARD',
          referenceNumber: presetData.referenceNo,
          description: presetData.description || 'Receipt scanned via FinAI Agent',
          suggestedGlAccountCode: presetData.glAccountCode || '6010',
          suggestedGlAccountName: presetData.glAccountName || 'General Expense',
          confidenceScore: presetData.confidenceScore || 0.96,
          warnings: presetData.warnings || [],
        };
      } else {
        // Call server-side Gemini OCR endpoint
        const response = await fetch('/api/ocr/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            mimeType: 'image/jpeg',
            existingAccounts: existingAccountsContext,
          }),
        });

        const data = await response.json();
        if (!data.success || !data.extraction) {
          throw new Error(data.error || 'Failed to extract text from document');
        }
        extraction = data.extraction;
      }

      // Step 5: CRM Account Matching
      let matchedSupplier = suppliers.find(
        (s) =>
          s.name.toLowerCase() === extraction.merchantOrPartyName.toLowerCase() ||
          s.aliases.some((a) => extraction.merchantOrPartyName.toLowerCase().includes(a.toLowerCase()))
      );

      let matchedCustomer = customers.find(
        (c) =>
          c.name.toLowerCase() === extraction.merchantOrPartyName.toLowerCase() ||
          c.aliases.some((a) => extraction.merchantOrPartyName.toLowerCase().includes(a.toLowerCase()))
      );

      // Step 6: Duplicate Detection Rules (Compare ref, amount, merchant, date)
      const existingDuplicate = transactions.find((t) => {
        const sameRef =
          extraction.referenceNumber &&
          t.referenceNo &&
          t.referenceNo.toLowerCase() === extraction.referenceNumber.toLowerCase();
        const sameAmountAndMerchant =
          Math.abs(t.amount - extraction.amount) < 0.01 &&
          t.merchantName.toLowerCase() === extraction.merchantOrPartyName.toLowerCase();
        return sameRef || sameAmountAndMerchant;
      });

      const isDuplicate = !!existingDuplicate;
      let duplicateFlag = undefined;
      if (isDuplicate) {
        duplicateFlag = {
          isDuplicate: true,
          matchedTransactionId: existingDuplicate.id,
          reason: `Potential duplicate match with transaction ${existingDuplicate.id} (Ref: ${existingDuplicate.referenceNo}, Amount: ${existingDuplicate.amount})`,
        };
      }

      // Step 7: Classification & Status
      let status: TransactionStatus = 'NEEDS_REVIEW';
      if (isDuplicate) {
        status = 'FLAGGED_DUPLICATE';
      }

      const txId = `TX-${Date.now().toString().slice(-6)}`;
      const branch = currentBranchId !== 'all' ? currentBranchId : currentOrg.branches[0].id;
      const currency = extraction.currency || 'USD';
      const exchangeRate = CURRENCIES[currency]?.rateToBaseUSD || 1;
      const baseAmount = extraction.amount / exchangeRate;

      const glCode =
        matchedSupplier?.defaultGlAccountCode ||
        extraction.suggestedGlAccountCode ||
        (extraction.transactionType === 'REVENUE' ? '4000' : '6010');
      const glAccount = glAccounts.find((a) => a.code === glCode);

      const warnings = [...(extraction.warnings || [])];
      if (isDuplicate) {
        warnings.push(`DUPLICATE DETECTED: Similar to record ${existingDuplicate.id}`);
      }
      if (!matchedSupplier && !matchedCustomer) {
        warnings.push('CRM Warning: Vendor not recognized in existing database. Needs verification.');
      }

      const newTx: FinancialTransaction = {
        id: txId,
        referenceNo: extraction.referenceNumber || `REF-${Date.now().toString().slice(-5)}`,
        date: extraction.transactionDate || new Date().toISOString().split('T')[0],
        type: extraction.transactionType || 'EXPENSE',
        amount: extraction.amount,
        currency,
        exchangeRate,
        baseAmount,
        taxAmount: extraction.taxAmount || 0,
        paymentMethod: extraction.paymentMethod || 'CREDIT_CARD',
        status,
        confidenceScore: extraction.confidenceScore || 0.85,
        description: extraction.description || `Scanned receipt from ${extraction.merchantOrPartyName}`,
        merchantName: extraction.merchantOrPartyName,
        supplierId: matchedSupplier?.id,
        supplierName: matchedSupplier?.name,
        customerId: matchedCustomer?.id,
        customerName: matchedCustomer?.name,
        glAccountCode: glCode,
        glAccountName: glAccount?.name || 'General Expense',
        branchId: branch,
        orgId: currentOrg.id,
        documentImage: imageBase64,
        documentName: filename,
        ocrRawData: extraction,
        duplicateFlag,
        warnings,
        createdAt: new Date().toISOString(),
      };

      setTransactions((prev) => [newTx, ...prev]);

      addAuditLog(
        isDuplicate ? 'FLAG_DUPLICATE_SUSPICION' : 'OCR_DOCUMENT_PROCESSED',
        'DOCUMENT_SCAN',
        newTx.id,
        `Document ${filename} scanned. Confidence: ${newTx.confidenceScore.toFixed(2)}. Status: ${status}.`
      );

      return { success: true, transaction: newTx };
    } catch (err: any) {
      console.error('Scan error:', err);
      return { success: false, error: err.message || 'Error scanning document' };
    }
  };

  // Step 9: Post & Approve Transaction (Creates balanced double-entry journal entry)
  const approveAndPostTransaction = (
    transactionId: string,
    notes?: string
  ): { success: boolean; journalEntry?: JournalEntry; error?: string } => {
    // Permission check
    if (userRole === 'Read-only Management' || userRole === 'Auditor') {
      return {
        success: false,
        error: `Permission Denied: User with role '${userRole}' cannot post journal entries.`,
      };
    }

    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) return { success: false, error: 'Transaction not found' };

    if (tx.status === 'POSTED') {
      return { success: false, error: 'Transaction is already posted' };
    }

    // Prepare Double-Entry Journal Lines (Debits must equal Credits!)
    const jeId = `JE-${Date.now().toString().slice(-6)}`;
    const jeNumber = `JE-2026-${(journalEntries.length + 1).toString().padStart(4, '0')}`;
    const lines: JournalLine[] = [];

    // Bank or Cash account code
    const cashOrBankGl = tx.paymentMethod === 'CASH' ? '1010' : '1020';
    const cashGlName = glAccounts.find((a) => a.code === cashOrBankGl)?.name || 'Cash/Bank';

    const netAmount = tx.amount - (tx.taxAmount || 0);

    if (tx.type === 'EXPENSE') {
      // Debit Expense account (net amount)
      lines.push({
        id: `jl-${Date.now()}-1`,
        glAccountCode: tx.glAccountCode,
        glAccountName: tx.glAccountName,
        debit: netAmount,
        credit: 0,
        memo: `${tx.description} (Net Expense)`,
      });

      // Debit VAT input if tax exists
      if (tx.taxAmount && tx.taxAmount > 0) {
        lines.push({
          id: `jl-${Date.now()}-2`,
          glAccountCode: '2100',
          glAccountName: 'Sales Tax & VAT Payable',
          debit: tx.taxAmount,
          credit: 0,
          memo: 'Input VAT / Tax reclaim',
        });
      }

      // Credit Cash / Bank / AP (Total amount)
      lines.push({
        id: `jl-${Date.now()}-3`,
        glAccountCode: cashOrBankGl,
        glAccountName: cashGlName,
        debit: 0,
        credit: tx.amount,
        memo: `Disbursement via ${tx.paymentMethod}`,
      });
    } else {
      // REVENUE:
      // Debit Cash / Bank (Total amount received)
      lines.push({
        id: `jl-${Date.now()}-1`,
        glAccountCode: cashOrBankGl,
        glAccountName: cashGlName,
        debit: tx.amount,
        credit: 0,
        memo: `Receipt via ${tx.paymentMethod}`,
      });

      // Credit Revenue Account (Net)
      lines.push({
        id: `jl-${Date.now()}-2`,
        glAccountCode: tx.glAccountCode,
        glAccountName: tx.glAccountName,
        debit: 0,
        credit: netAmount,
        memo: `${tx.description} (Net Revenue)`,
      });

      // Credit VAT Output if tax exists
      if (tx.taxAmount && tx.taxAmount > 0) {
        lines.push({
          id: `jl-${Date.now()}-3`,
          glAccountCode: '2100',
          glAccountName: 'Sales Tax & VAT Payable',
          debit: 0,
          credit: tx.taxAmount,
          memo: 'Output VAT liability',
        });
      }
    }

    const totalDebit = lines.reduce((acc, l) => acc + l.debit, 0);
    const totalCredit = lines.reduce((acc, l) => acc + l.credit, 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;

    if (!isBalanced) {
      return {
        success: false,
        error: `Double-entry violation: Debits ($${totalDebit.toFixed(2)}) must equal Credits ($${totalCredit.toFixed(2)})`,
      };
    }

    const newJournalEntry: JournalEntry = {
      id: jeId,
      entryNumber: jeNumber,
      date: tx.date,
      description: tx.description,
      reference: tx.referenceNo,
      transactionId: tx.id,
      branchId: tx.branchId,
      lines,
      totalDebit,
      totalCredit,
      isBalanced: true,
      status: 'POSTED',
      postedAt: new Date().toISOString(),
      postedBy: `Current User (${userRole})`,
    };

    // Update Transaction State
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              status: 'POSTED',
              postedJournalEntryId: jeId,
              verifiedBy: `Current User (${userRole})`,
              verifiedAt: new Date().toISOString(),
              verificationNotes: notes || 'Verified and posted by finance authority.',
            }
          : t
      )
    );

    // Update GL Balances
    setGlAccounts((prev) =>
      prev.map((acc) => {
        const matchingLines = lines.filter((l) => l.glAccountCode === acc.code);
        if (matchingLines.length === 0) return acc;
        let delta = 0;
        matchingLines.forEach((l) => {
          if (acc.normalBalance === 'DEBIT') {
            delta += l.debit - l.credit;
          } else {
            delta += l.credit - l.debit;
          }
        });
        return { ...acc, balance: acc.balance + delta };
      })
    );

    // Save Journal Entry
    setJournalEntries((prev) => [newJournalEntry, ...prev]);

    // Audit Log
    addAuditLog(
      'APPROVE_AND_POST_JOURNAL',
      'JOURNAL_ENTRY',
      jeId,
      `Approved transaction ${tx.id} (${tx.referenceNo}) for ${formatMoney(tx.amount, tx.currency)}. Posted ${jeNumber}.`
    );

    return { success: true, journalEntry: newJournalEntry };
  };

  const rejectTransaction = (transactionId: string, reason: string) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              status: 'REJECTED',
              verificationNotes: reason,
              verifiedBy: `Current User (${userRole})`,
              verifiedAt: new Date().toISOString(),
            }
          : t
      )
    );
    addAuditLog(
      'REJECT_TRANSACTION',
      'TRANSACTION',
      transactionId,
      `Transaction rejected. Reason: ${reason}`
    );
  };

  const updateTransaction = (transactionId: string, updates: Partial<FinancialTransaction>) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id !== transactionId) return t;
        const updated = { ...t, ...updates };
        // Recalculate baseAmount if amount or currency changed
        if (updates.amount !== undefined || updates.currency !== undefined) {
          const cur = updated.currency;
          const rate = CURRENCIES[cur]?.rateToBaseUSD || 1;
          updated.exchangeRate = rate;
          updated.baseAmount = updated.amount / rate;
        }
        return updated;
      })
    );
    addAuditLog(
      'CORRECTION_TRANSACTION_FIELDS',
      'TRANSACTION',
      transactionId,
      `User updated extracted fields before posting.`
    );
  };

  // Rule #8: Accounting Reversals (controlled correction entries, not silent modification)
  const reverseJournalEntry = (
    journalEntryId: string,
    reason: string
  ): { success: boolean; error?: string } => {
    if (userRole !== 'Super Admin' && userRole !== 'Finance Manager') {
      return {
        success: false,
        error: 'Only Finance Managers and Super Admins can reverse posted journal entries.',
      };
    }

    const je = journalEntries.find((j) => j.id === journalEntryId);
    if (!je) return { success: false, error: 'Journal entry not found' };
    if (je.status === 'REVERSED') return { success: false, error: 'Already reversed' };

    // Create reversing journal entry with opposite debits/credits
    const revId = `JE-REV-${Date.now().toString().slice(-5)}`;
    const revLines: JournalLine[] = je.lines.map((l) => ({
      id: `jl-rev-${Date.now()}-${l.id}`,
      glAccountCode: l.glAccountCode,
      glAccountName: l.glAccountName,
      debit: l.credit, // SWAP DEBIT & CREDIT
      credit: l.debit,
      memo: `REVERSAL of ${je.entryNumber}: ${l.memo || ''}`,
    }));

    const revEntry: JournalEntry = {
      id: revId,
      entryNumber: `${je.entryNumber}-REV`,
      date: new Date().toISOString().split('T')[0],
      description: `REVERSAL: ${je.description} (Reason: ${reason})`,
      reference: `REV-${je.reference}`,
      transactionId: je.transactionId,
      branchId: je.branchId,
      lines: revLines,
      totalDebit: je.totalCredit,
      totalCredit: je.totalDebit,
      isBalanced: true,
      status: 'POSTED',
      postedAt: new Date().toISOString(),
      postedBy: `Current User (${userRole})`,
    };

    // Mark original as reversed
    setJournalEntries((prev) => [
      revEntry,
      ...prev.map((j) =>
        j.id === journalEntryId
          ? {
              ...j,
              status: 'REVERSED' as const,
              reversedBy: `Current User (${userRole})`,
              reversalReason: reason,
            }
          : j
      ),
    ]);

    // Reverse GL account impacts
    setGlAccounts((prev) =>
      prev.map((acc) => {
        const matchingLines = revLines.filter((l) => l.glAccountCode === acc.code);
        if (matchingLines.length === 0) return acc;
        let delta = 0;
        matchingLines.forEach((l) => {
          if (acc.normalBalance === 'DEBIT') {
            delta += l.debit - l.credit;
          } else {
            delta += l.credit - l.debit;
          }
        });
        return { ...acc, balance: acc.balance + delta };
      })
    );

    // If linked to a transaction, set its status back
    if (je.transactionId) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === je.transactionId
            ? {
                ...t,
                status: 'NEEDS_REVIEW',
                verificationNotes: `Reversed on ${new Date().toLocaleDateString()}: ${reason}`,
              }
            : t
        )
      );
    }

    addAuditLog(
      'REVERSE_JOURNAL_ENTRY',
      'REVERSAL',
      journalEntryId,
      `Reversed journal entry ${je.entryNumber}. Reversal entry ${revEntry.entryNumber} created. Reason: ${reason}`
    );

    return { success: true };
  };

  const createManualJournalEntry = (
    date: string,
    description: string,
    reference: string,
    lines: { glAccountCode: string; debit: number; credit: number; memo?: string }[]
  ): { success: boolean; journalEntry?: JournalEntry; error?: string } => {
    const totalDebit = lines.reduce((acc, l) => acc + l.debit, 0);
    const totalCredit = lines.reduce((acc, l) => acc + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return {
        success: false,
        error: `Debits ($${totalDebit.toFixed(2)}) must equal Credits ($${totalCredit.toFixed(2)})`,
      };
    }

    const fullLines: JournalLine[] = lines.map((l, idx) => {
      const gl = glAccounts.find((a) => a.code === l.glAccountCode);
      return {
        id: `manual-jl-${Date.now()}-${idx}`,
        glAccountCode: l.glAccountCode,
        glAccountName: gl?.name || 'Account',
        debit: l.debit,
        credit: l.credit,
        memo: l.memo,
      };
    });

    const jeId = `JE-${Date.now().toString().slice(-6)}`;
    const jeNumber = `JE-2026-${(journalEntries.length + 1).toString().padStart(4, '0')}`;
    const branch = currentBranchId !== 'all' ? currentBranchId : currentOrg.branches[0].id;

    const newJe: JournalEntry = {
      id: jeId,
      entryNumber: jeNumber,
      date,
      description,
      reference,
      branchId: branch,
      lines: fullLines,
      totalDebit,
      totalCredit,
      isBalanced: true,
      status: 'POSTED',
      postedAt: new Date().toISOString(),
      postedBy: `Current User (${userRole})`,
    };

    setJournalEntries((prev) => [newJe, ...prev]);

    // Update GL balances
    setGlAccounts((prev) =>
      prev.map((acc) => {
        const matchingLines = fullLines.filter((l) => l.glAccountCode === acc.code);
        if (matchingLines.length === 0) return acc;
        let delta = 0;
        matchingLines.forEach((l) => {
          if (acc.normalBalance === 'DEBIT') {
            delta += l.debit - l.credit;
          } else {
            delta += l.credit - l.debit;
          }
        });
        return { ...acc, balance: acc.balance + delta };
      })
    );

    addAuditLog(
      'MANUAL_JOURNAL_POSTED',
      'JOURNAL_ENTRY',
      jeId,
      `Manual entry ${jeNumber} created with total debit/credit: $${totalDebit.toFixed(2)}.`
    );

    return { success: true, journalEntry: newJe };
  };

  const reconcileBankLine = (
    bankLineId: string,
    transactionId: string
  ): { success: boolean; error?: string } => {
    setBankStatementLines((prev) =>
      prev.map((l) =>
        l.id === bankLineId ? { ...l, reconciled: true, matchedTransactionId: transactionId } : l
      )
    );
    addAuditLog(
      'RECONCILE_BANK_LINE',
      'RECONCILIATION',
      bankLineId,
      `Reconciled bank statement line with transaction ${transactionId}.`
    );
    return { success: true };
  };

  // Conversational AI Financial Analyst call
  const askAiAnalyst = async (question: string): Promise<{ answer: string; error?: string }> => {
    try {
      const ledgerSummary = {
        organization: currentOrg.name,
        currency: currentCurrency,
        totalRevenue: transactions
          .filter((t) => t.type === 'REVENUE' && t.status === 'POSTED')
          .reduce((sum, t) => sum + convertAmount(t.amount, t.currency), 0),
        totalExpenses: transactions
          .filter((t) => t.type === 'EXPENSE' && t.status === 'POSTED')
          .reduce((sum, t) => sum + convertAmount(t.amount, t.currency), 0),
        totalTransactionsCount: transactions.length,
        needsReviewCount: transactions.filter((t) => t.status === 'NEEDS_REVIEW').length,
        duplicateFlaggedCount: transactions.filter((t) => t.status === 'FLAGGED_DUPLICATE').length,
        cashAndBankBalances: bankAccounts.map((b) => ({
          bank: b.bankName,
          balance: b.currentBalance,
          currency: b.currency,
        })),
        recentTransactions: transactions.slice(0, 10).map((t) => ({
          id: t.id,
          date: t.date,
          type: t.type,
          amount: t.amount,
          currency: t.currency,
          merchant: t.merchantName,
          status: t.status,
          ref: t.referenceNo,
        })),
        topReceivables: customers
          .filter((c) => c.outstandingReceivable > 0)
          .map((c) => ({ customer: c.name, balance: c.outstandingReceivable })),
        topPayables: suppliers
          .filter((s) => s.outstandingPayable > 0)
          .map((s) => ({ supplier: s.name, balance: s.outstandingPayable })),
      };

      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, ledgerContext: ledgerSummary }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'AI Analyst was unable to process request');
      }
      return { answer: data.answer };
    } catch (err: any) {
      console.error('AI Analyst Error:', err);
      return {
        answer: '',
        error: err.message || 'Failed to reach AI Financial Analyst.',
      };
    }
  };

  const runAiAudit = async (): Promise<{ findings: any[]; error?: string }> => {
    try {
      const response = await fetch('/api/ai/audit-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: transactions.slice(0, 20),
          bankStatementLines,
        }),
      });
      const data = await response.json();
      return { findings: data.findings || [] };
    } catch (err: any) {
      return { findings: [], error: err.message };
    }
  };

  const value = useMemo(
    () => ({
      currentOrg,
      setCurrentOrg,
      currentBranchId,
      setCurrentBranchId,
      currentCurrency,
      setCurrentCurrency,
      userRole,
      setUserRole,
      transactions,
      journalEntries,
      glAccounts,
      bankAccounts,
      customers,
      suppliers,
      invoices,
      bills,
      bankStatementLines,
      auditLogs,
      scanReceipt,
      approveAndPostTransaction,
      rejectTransaction,
      updateTransaction,
      reverseJournalEntry,
      createManualJournalEntry,
      reconcileBankLine,
      askAiAnalyst,
      runAiAudit,
      language,
      setLanguage,
      isRtl,
      t,
      convertAmount,
      formatMoney,
    }),
    [
      currentOrg,
      currentBranchId,
      currentCurrency,
      userRole,
      language,
      isRtl,
      transactions,
      journalEntries,
      glAccounts,
      bankAccounts,
      customers,
      suppliers,
      invoices,
      bills,
      bankStatementLines,
      auditLogs,
    ]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};
