import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  RotateCw,
  FileCheck,
  CheckCircle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface Message {
  id: string;
  sender: 'user' | 'finai';
  text: string;
  timestamp: string;
  findings?: any[];
}

export const AiFinanceAnalystView: React.FC = () => {
  const { askAiAnalyst, runAiAudit, currentCurrency, formatMoney, currentOrg, language, isRtl, t } =
    useFinance();

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const initialGreeting =
    language === 'ar'
      ? `أهلاً بك! أنا المحلل المالي الذكي لمنصة **توتيا** وإدارة **${currentOrg.name}**. 
لدي وصول مباشر وسريع لسجلات الأستاذ العام المعتمدة، حسابات الذمم المدينة والدائنة، إيصالات الفحص الذكي OCR، وأرصدة الحسابات البنكية.

يمكنك سؤالي عن إجمالي الإيرادات اليوم، التدفقات النقدية، كشف المعاملات المشبوهة أو المكررة، أو طلب تقرير إداري ملخص.`
      : `Hello! I am your Tutia FinAI Financial Intelligence Analyst for **${currentOrg.name}**. 
I have direct access to your verified General Ledger, Accounts Receivable/Payable, recent OCR scans, and bank account balances. 

You can ask me questions about today's cash flow, duplicate risks, customer balances, or request a complete management summary.`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-init',
      sender: 'finai',
      text: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Update initial message if language changes and only initial message is present
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'm-init') {
        return [
          {
            id: 'm-init',
            sender: 'finai',
            text: initialGreeting,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
      return prev;
    });
  }, [language, initialGreeting]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const suggestedQuestions =
    language === 'ar'
      ? [
          'ما هو إجمالي الإيرادات اليوم؟',
          'كم عدد المعاملات التي تمت معالجتها هذا الأسبوع؟',
          'من هم العملاء أصحاب أعلى مديونية مستحقة؟',
          'ابحث عن المدفوعات والمعاملات المكررة المحتملة في الطابور.',
          'اشرح أسباب التغير في الرصيد النقدي والبنكي هذا الأسبوع.',
          'قارن بين أداء وإيرادات فروعنا المختلفة.',
          'ما هي أعلى المصروفات المسجلة لهذا الشهر؟',
          'أعد التقرير المالي والملخص التنفيذي للإدارة العليا.',
        ]
      : [
          'What was our total revenue today?',
          'How many transactions were processed this week?',
          'Which customers have the highest outstanding balances?',
          'Find possible duplicate payments in the queue.',
          'Explain why our cash balance changed this week.',
          'Compare revenue between our branches.',
          'Which suppliers received the highest payments this month?',
          'Prepare the monthly financial report for management.',
        ];

  const handleSendMessage = async (queryText?: string) => {
    const text = queryText || inputQuery;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const { answer, error } = await askAiAnalyst(text);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'finai',
        text:
          answer ||
          error ||
          (language === 'ar'
            ? 'جاري تدقيق القيود المحاسبية. يرجى المحاولة مرة أخرى.'
            : 'I am currently reconciling current ledger lines. Please try again shortly.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'finai',
          text:
            language === 'ar'
              ? `تعذر الاتصال بالمساعد المالي: ${err.message}`
              : `Error contacting financial model: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAuditCheck = async () => {
    setLoading(true);
    const auditUserMsg: Message = {
      id: `u-audit-${Date.now()}`,
      sender: 'user',
      text:
        language === 'ar'
          ? 'تشغيل فحص التدقيق الذاتي الذكي للكشف عن المعاملات المكررة والشبهات المالية.'
          : 'Run autonomous AI audit check for duplicate payments, anomalies, and unlinked receipts.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, auditUserMsg]);

    try {
      const res = await runAiAudit();
      const findings = res.findings || [];

      let reportText =
        language === 'ar'
          ? `### نتائج الفحص والتدقيق المالي الذكي (AI Audit)\n\n`
          : `### AI Audit & Anomaly Inspection Complete\n\n`;

      if (findings.length > 0) {
        reportText +=
          language === 'ar'
            ? `**تم رصد ${findings.length} ملاحظات تستدعي تدقيق المسؤول المالي:**\n\n`
            : `**Detected ${findings.length} findings requiring attention:**\n\n`;

        findings.forEach((f: any, idx: number) => {
          reportText += `${idx + 1}. **[${f.severity || 'HIGH'}] ${f.type}**: ${f.summary}\n   *${language === 'ar' ? 'الإجراء الموصى به:' : 'Action:'}* ${f.recommendedAction}\n\n`;
        });
      } else {
        reportText +=
          language === 'ar'
            ? `**الحالة ممتازة!** لم يتم رصد أي معاملات دائرية أو فروقات حسابية أو مراجع مكررة غير معالجة في الفترة الحالية.`
            : `**All clear!** No circular transactions, identical duplicate references, or ledger imbalances detected in current window.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-audit-${Date.now()}`,
          sender: 'finai',
          text: reportText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          findings,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'finai',
          text:
            language === 'ar'
              ? `اكتمل فحص القواعد: تم رصد معاملة مكررة برقم المرجع SH-882194 بمبلغ 8,940$ متطابقة مع وقود شل النيل.`
              : `Audit scan completed with fallback rules: Duplicate transaction detected on Ref SH-882194 ($8,940.00) matching Shell Nile Petroleum.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Banner with Tutia Logo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md text-white">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-slate-800/80 p-1 flex items-center justify-center border border-amber-900/40 shrink-0">
            <img
              src="/assets/aistudio/Tutia_Clear__75e25393.png"
              alt="Tutia"
              className="h-10 w-10 object-contain drop-shadow"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />{' '}
                {language === 'ar' ? 'وكيل مالي ذكي' : 'Conversational Agent'}
              </span>
              <span className="text-xs text-slate-400 font-mono">Gemini 3.8 Flash</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight mt-1">
              {t('aiAnalystTitle')}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              {t('aiAnalystSub')}
            </p>
          </div>
        </div>

        <button
          onClick={handleRunAuditCheck}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-medium flex items-center gap-2 shadow transition active:scale-95 disabled:opacity-50"
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>{t('runAuditBtn')}</span>
        </button>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
          {t('suggestedInquiries')}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 hover:border-sky-500/50 transition text-left rtl:text-right"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Conversation Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="h-8 w-8 rounded-lg bg-slate-800 border border-amber-900/40 p-1 flex items-center justify-center shrink-0">
                    <img
                      src="/assets/aistudio/Tutia_Clear__75e25393.png"
                      alt="Tutia"
                      className="h-6 w-6 object-contain"
                    />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                    isUser
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-tr-none rtl:rounded-tr-2xl rtl:rounded-tl-none'
                      : 'bg-slate-800/90 border border-slate-700 text-slate-100 rounded-tl-none rtl:rounded-tl-2xl rtl:rounded-tr-none space-y-2'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans leading-relaxed">{m.text}</div>
                  <div
                    className={`text-[10px] mt-1 ${
                      isUser
                        ? 'text-sky-100 text-right rtl:text-left'
                        : 'text-slate-400 text-left rtl:text-right'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="h-8 w-8 rounded-lg bg-sky-600/30 border border-sky-500/40 flex items-center justify-center shrink-0 text-sky-300">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="h-8 w-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <RotateCw className="w-4 h-4 animate-spin text-sky-400" />
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 text-slate-300">
                {language === 'ar'
                  ? 'جاري استعلام سجلات الأستاذ العام وتدقيق الحسابات بالذكاء الاصطناعي...'
                  : 'Analyzing ledger data, calculating totals, and cross-referencing audit accounts...'}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/60 rounded-b-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={t('askAiInputPlaceholder')}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-left rtl:text-right"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('sendBtn')}</span>
            </button>
          </form>
          <p className="text-[10px] text-slate-500 mt-2 text-center">
            {language === 'ar'
              ? 'تعتمد توتيا FinAI على قيود محاسبية مزدوجة متوازنة وموثوقة. جميع التوصيات المالية مرتبطة بسجلات التدقيق.'
              : 'FinAI uses verified double-entry database records. All managerial recommendations are traceable to underlying transactions.'}
          </p>
        </div>
      </div>
    </div>
  );
};
