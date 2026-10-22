import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Increase payload limit for base64 image receipt uploads
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Server-side initialization of Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FinAI Business Manager Server',
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// AI OCR Receipt & Document Extraction Endpoint
app.post('/api/ocr/scan', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', documentType = 'receipt', existingAccounts } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 data is required' });
    }

    // Clean base64 string if data URI header is present
    const base64Data = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;

    const systemPrompt = `You are an expert AI Document OCR & Accounting Auditor for enterprise financial management.
Your task is to analyze the provided financial document (receipt, invoice, bank deposit slip, or transfer confirmation) with highest fidelity.
Extract visible facts accurately without inventing missing details. If a field is not present, return null or empty string.
Check for arithmetic consistency: Line items sum + tax = total.
Recommend transaction category and Chart of Accounts code (e.g. 4000 for Sales Revenue, 6010 Office Supplies, 6020 Travel & Transport, 6030 Utilities, 6040 Software & SaaS, 1010 Cash, 1020 Bank, 1100 Accounts Receivable, 2000 Accounts Payable).
Assess OCR confidence score between 0.1 and 0.99.
Provide potential warnings or discrepancies (e.g. missing VAT registration, ambiguous date, arithmetic mismatch, illegible text).`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    const textPart = {
      text: `Analyze this financial document. Available CRM Accounts context: ${JSON.stringify(existingAccounts || [])}.
Extract all transaction details strictly according to the specified JSON schema.`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchantOrPartyName: { type: Type.STRING, description: 'Vendor, supplier, merchant, or customer name' },
            transactionType: {
              type: Type.STRING,
              description: 'One of: EXPENSE, REVENUE, TRANSFER, REFUND',
            },
            transactionDate: { type: Type.STRING, description: 'ISO date YYYY-MM-DD or visible date' },
            transactionTime: { type: Type.STRING, description: 'Visible time or empty' },
            amount: { type: Type.NUMBER, description: 'Total transaction amount as decimal' },
            currency: { type: Type.STRING, description: 'Currency code e.g. USD, SDG, EGP, EUR, GBP, AED' },
            taxAmount: { type: Type.NUMBER, description: 'Tax or VAT amount, or 0 if none' },
            paymentMethod: {
              type: Type.STRING,
              description: 'One of: CASH, BANK_TRANSFER, CREDIT_CARD, MOBILE_MONEY, POS, CHECK, UNKNOWN',
            },
            referenceNumber: { type: Type.STRING, description: 'Receipt number, invoice number, or bank transfer reference' },
            accountNumber: { type: Type.STRING, description: 'Account number, card last 4 digits, or IBAN if visible' },
            accountName: { type: Type.STRING, description: 'Account holder or bank name' },
            description: { type: Type.STRING, description: 'Brief summary of purchased items or transaction purpose' },
            lineItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemDescription: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  totalPrice: { type: Type.NUMBER },
                },
                required: ['itemDescription', 'totalPrice'],
              },
            },
            suggestedGlAccountCode: { type: Type.STRING, description: 'Suggested General Ledger Account Code e.g. 6010, 6020, 4000' },
            suggestedGlAccountName: { type: Type.STRING, description: 'Suggested GL account name' },
            confidenceScore: { type: Type.NUMBER, description: 'Confidence between 0.0 and 1.0' },
            crmMatchSuggestion: {
              type: Type.OBJECT,
              properties: {
                matchedType: { type: Type.STRING, description: 'CUSTOMER or SUPPLIER or NONE' },
                suggestedName: { type: Type.STRING },
                matchConfidence: { type: Type.NUMBER },
                matchReason: { type: Type.STRING },
              },
            },
            warnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Any data quality warnings, arithmetic discrepancies, or missing required fields',
            },
          },
          required: [
            'merchantOrPartyName',
            'transactionType',
            'amount',
            'currency',
            'confidenceScore',
            'warnings',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, extraction: parsed });
  } catch (error: any) {
    console.error('OCR Extraction Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process document with AI OCR',
    });
  }
});

// Conversational AI Financial Analyst Endpoint
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { question, ledgerContext } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const systemPrompt = `You are FinAI, the Chief Financial Intelligence Analyst for the organization.
You have direct access to the enterprise's current verified accounting records, transactions, CRM balances, and chart of accounts.
Always answer using the authorized records provided in context.
Rules:
1. Always state the calculation basis, period, currency, and underlying transaction references.
2. If data is incomplete or has unverified transactions awaiting review, explicitly disclose the limitation.
3. Distinguish clearly between verified accounting ledger figures vs OCR pending items.
4. Format numbers cleanly with currency symbols and commas.
5. Provide actionable managerial insight (e.g. cash runway, top expense trends, overdue receivables, duplicate risk).
6. Do NOT invent transactions not found in the provided context.`;

    const promptText = `User Question: "${question}"

Current Financial & Accounting Ledger Context:
${JSON.stringify(ledgerContext || {}, null, 2)}

Provide a structured, authoritative, and helpful answer.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    return res.json({
      success: true,
      answer: response.text || 'Unable to analyze financial context at this time.',
    });
  } catch (error: any) {
    console.error('AI Financial Analyst Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze financial query',
    });
  }
});

// AI Financial Anomaly & Duplicate Detection Endpoint
app.post('/api/ai/audit-check', async (req, res) => {
  try {
    const { transactions, bankStatementLines } = req.body;

    const prompt = `Analyze these business transactions for accounting anomalies, potential duplicate entries, round-trip transfers, and tax discrepancies:
Transactions: ${JSON.stringify(transactions || [])}
Bank Lines: ${JSON.stringify(bankStatementLines || [])}

Return a JSON array of findings:
[{
  "severity": "HIGH" | "MEDIUM" | "LOW",
  "type": "DUPLICATE_SUSPICION" | "UNMATCHED_PAYMENT" | "UNUSUAL_EXPENSE" | "TAX_VARIANCE",
  "transactionIds": ["TX-xxx"],
  "summary": "Short explanation",
  "recommendedAction": "Actionable step for auditor"
}]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const findings = JSON.parse(response.text || '[]');
    return res.json({ success: true, findings });
  } catch (error: any) {
    console.error('Audit Check Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Audit check failed',
    });
  }
});

// Vite middleware integration for development / production serving
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FinAI] Server listening on port ${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error('Failed to start server:', err);
});
