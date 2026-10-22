export type CurrencyCode = 'USD' | 'SDG' | 'EGP' | 'EUR' | 'GBP' | 'AED';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateToBaseUSD: number; // e.g. 1 USD = 2400 SDG, 1 USD = 48 EGP, 1 USD = 0.92 EUR
}

export type UserRole =
  | 'Super Admin'
  | 'Company Admin'
  | 'Finance Manager'
  | 'Accountant'
  | 'AR/AP Officer'
  | 'Auditor'
  | 'Read-only Management';

export interface Organization {
  id: string;
  name: string;
  legalEntityName: string;
  taxRegistrationNumber: string;
  baseCurrency: CurrencyCode;
  fiscalYearStart: string; // e.g. 'January 1'
  branches: Branch[];
}

export interface Branch {
  id: string;
  orgId: string;
  code: string;
  name: string;
  city: string;
  country: string;
  currency: CurrencyCode;
}

export type AccountCategory = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface GlAccount {
  code: string; // e.g. '1010', '1020', '4000', '6010'
  name: string;
  category: AccountCategory;
  normalBalance: 'DEBIT' | 'CREDIT';
  balance: number;
  description?: string;
  isBankOrCash?: boolean;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumberMasked: string; // e.g. '•••• 4892'
  fullAccountNumber?: string;
  currency: CurrencyCode;
  glAccountCode: string;
  currentBalance: number;
  branchId: string;
}

export interface Customer {
  id: string;
  code: string; // e.g. 'CUST-001'
  name: string;
  email: string;
  phone: string;
  taxNumber?: string;
  accountNumber: string; // e.g. 'AR-88301'
  aliases: string[]; // for OCR matching
  paymentTerms: string; // 'Net 30'
  creditLimit: number;
  outstandingReceivable: number;
}

export interface Supplier {
  id: string;
  code: string; // e.g. 'SUPP-001'
  name: string;
  category: string;
  email: string;
  phone: string;
  taxNumber?: string;
  bankName: string;
  bankAccountNumber: string;
  aliases: string[]; // for OCR matching e.g. ['Shell', 'Shell Oil', 'Shell Nile Ltd']
  defaultGlAccountCode: string;
  outstandingPayable: number;
}

export type TransactionType = 'REVENUE' | 'EXPENSE' | 'TRANSFER' | 'REFUND';

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'MOBILE_MONEY'
  | 'POS'
  | 'CHECK'
  | 'UNKNOWN';

export type TransactionStatus =
  | 'NEEDS_REVIEW'
  | 'VERIFIED'
  | 'POSTED'
  | 'REJECTED'
  | 'FLAGGED_DUPLICATE';

export interface OcrLineItem {
  itemDescription: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
}

export interface OcrExtractionData {
  merchantOrPartyName: string;
  transactionType: TransactionType;
  transactionDate: string;
  transactionTime?: string;
  amount: number;
  currency: CurrencyCode;
  taxAmount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  accountNumber?: string;
  accountName?: string;
  description: string;
  lineItems?: OcrLineItem[];
  suggestedGlAccountCode?: string;
  suggestedGlAccountName?: string;
  confidenceScore: number;
  crmMatchSuggestion?: {
    matchedType: 'CUSTOMER' | 'SUPPLIER' | 'NONE';
    suggestedId?: string;
    suggestedName?: string;
    matchConfidence: number;
    matchReason: string;
  };
  warnings: string[];
}

export interface FinancialTransaction {
  id: string;
  referenceNo: string;
  date: string; // ISO string '2026-10-20'
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  exchangeRate: number; // to org base currency
  baseAmount: number; // amount in org base currency
  taxAmount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  confidenceScore: number;
  description: string;
  merchantName: string;
  accountNumber?: string;
  accountName?: string;

  // CRM link
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;

  // Ledger link
  glAccountCode: string;
  glAccountName: string;
  bankAccountId?: string;
  branchId: string;
  orgId: string;

  // Document & Evidence
  documentImage?: string; // base64 or URL
  documentName?: string;
  ocrRawData?: OcrExtractionData;

  // Audit & Validation
  duplicateFlag?: {
    isDuplicate: boolean;
    matchedTransactionId?: string;
    reason?: string;
  };
  warnings?: string[];
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  postedJournalEntryId?: string;
  createdAt: string;
}

export interface JournalLine {
  id: string;
  glAccountCode: string;
  glAccountName: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string; // e.g. 'JE-2026-0042'
  date: string;
  description: string;
  reference: string;
  transactionId?: string;
  branchId: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
  postedAt: string;
  postedBy: string;
  reversedBy?: string;
  reversalReason?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: CurrencyCode;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE';
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  branchId: string;
}

export interface SupplierBill {
  id: string;
  billNumber: string;
  supplierId: string;
  supplierName: string;
  billDate: string;
  dueDate: string;
  amount: number;
  taxAmount: number;
  paidAmount: number;
  currency: CurrencyCode;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  glAccountCode: string;
  branchId: string;
}

export interface BankStatementLine {
  id: string;
  bankAccountId: string;
  date: string;
  description: string;
  reference: string;
  amount: number; // positive = credit/deposit, negative = debit/withdrawal
  currency: CurrencyCode;
  reconciled: boolean;
  matchedTransactionId?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'TRANSACTION' | 'DOCUMENT_SCAN' | 'JOURNAL_ENTRY' | 'CRM_MATCH' | 'REVERSAL' | 'RECONCILIATION';
  entityId: string;
  details: string;
  changes?: Record<string, { before: any; after: any }>;
}
