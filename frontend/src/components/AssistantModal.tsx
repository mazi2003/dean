import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Sparkles, Send, User } from 'lucide-react';
import { api } from '../services/api';
import { UniversityEmblem } from './UniversityEmblem';
import { tr } from '../utils/i18n';

interface AssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

function getCurrentTimeStr(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const AssistantModal: React.FC<AssistantModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, lang } = useAuth();
  const defaultGreeting = tr(
    lang,
    `Здравствуйте, ${user?.fullName ? user.fullName.split(' ')[0] : 'студент'}! Я цифровой консультант деканата DemoTech University. Отвечаю на сервере с учетом только вашего профиля: расписания, задолженностей, сроков ПГАС и статуса заявлений. Чем могу помочь?`,
    `Hello, ${user?.fullName ? user.fullName.split(' ')[0] : 'Student'}! I am the Digital Dean's Office Assistant at DemoTech University. Answers are generated server-side using only your own profile: schedule, arrears, PGAS deadlines, and request statuses. How can I help you?`
  );
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      sender: 'assistant',
      text: defaultGreeting,
      time: getCurrentTimeStr(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [lastSource, setLastSource] = useState<'llm' | 'rules' | null>(null);

  if (!isOpen) return null;

  const quickPrompts =
    lang === 'ru'
      ? [
          'Когда у меня пересдача по статистике?',
          'Как заказать электронную справку?',
          'Критерии повышенной стипендии (ПГАС)?',
          'Часы приема и контакты деканата?',
        ]
      : [
          'When is my Statistics retake exam?',
          'How to request a certificate preview?',
          'Enhanced Merit Scholarship (PGAS) criteria?',
          "Dean's Office hours and contacts?",
        ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { answer, source } = await api.askAssistant(text, lang);
      setLastSource(source);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: tr(
            lang,
            'В данный момент информационная база деканата обновляется. Пожалуйста, обратитесь в деканат (каб. 312) или повторите запрос через несколько минут.',
            "The Dean's Office knowledge base is currently updating. Please visit Room 312 or try again in a few minutes."
          ),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tr(lang, 'Консультант деканата', "Dean's Office AI Advisor")}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative w-full max-w-lg h-[620px] max-h-[92vh] bg-white dark:bg-[#112238] rounded-xl shadow-2xl overflow-hidden border border-[#245A91]/40 flex flex-col">
        {/* Academic Header */}
        <div className="p-4 bg-[#142D4E] text-[#FFFFFF] flex items-center justify-between border-b border-[#245A91]/30 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#0E1F36] border border-[#245A91]/60 flex items-center justify-center p-1 shadow-inner">
              <UniversityEmblem size={28} />
            </div>
            <div>
              <h3 className="font-semibold text-sm flex items-center space-x-2 text-[#FFFFFF]">
                <span>{tr(lang, 'Консультант деканата', "Dean's Office AI Advisor")}</span>
                <span className="w-2 h-2 rounded-full bg-[#93C5FD] inline-block animate-pulse" />
              </h3>
              <p className="text-[10px] text-[#93C5FD] font-mono">
                {profile?.group
                  ? tr(
                      lang,
                      `Контекст: гр. ${profile.group} • Факультет МО`,
                      `Context: Group ${profile.group} • Faculty of IR`
                    )
                  : 'DemoTech University'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-[#FFFFFF]/75 hover:text-white hover:bg-[#0E1F36] transition-colors cursor-pointer"
            aria-label={tr(lang, 'Закрыть', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Question Chips */}
        <div className="p-3 bg-[#F8FAFC] dark:bg-[#0E1B2D] border-b border-[#DCE2EA] dark:border-[#193150] flex items-center space-x-1.5 overflow-x-auto text-[11px] font-sans">
          <span className="text-[#667085] dark:text-[#94A3B8] font-medium whitespace-nowrap pl-1">
            {tr(lang, 'Частые вопросы:', 'Quick questions:')}
          </span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-[#162A45] hover:bg-[#EDF2F7] text-[#142D4E] dark:text-[#93C5FD] border border-[#DCE2EA] dark:border-[#1E395B] whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs font-sans">
          {messages.map((m, idx) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={idx}
                className={`flex items-start space-x-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                {!isUser ? (
                  <div className="w-7 h-7 rounded-md bg-[#142D4E] text-[#245A91] flex items-center justify-center flex-shrink-0 border border-[#245A91]/40">
                    <UniversityEmblem size={18} />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-md bg-[#F8FAFC] dark:bg-[#162A45] border border-[#DCE2EA] dark:border-[#1E395B] flex items-center justify-center flex-shrink-0 text-[#0F1D30] dark:text-[#FFFFFF]">
                    <User className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] p-3.5 rounded-xl leading-relaxed ${
                    isUser
                      ? 'bg-[#142D4E] text-[#FFFFFF]'
                      : 'bg-[#F8FAFC] dark:bg-[#0E1B2D] text-[#0F1D30] dark:text-[#FFFFFF] border border-[#DCE2EA] dark:border-[#1E395B]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {idx === 0 && !isUser ? defaultGreeting : m.text}
                  </p>
                  <span
                    className={`block text-[10px] mt-1 font-mono text-right ${
                      isUser ? 'text-[#245A91] dark:text-[#93C5FD]' : 'text-[#667085] dark:text-[#94A3B8]'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-[#667085] dark:text-[#94A3B8] p-2">
              <Sparkles className="w-4 h-4 text-[#245A91] animate-spin" />
              <span>
                {tr(
                  lang,
                  'Консультант обращается к регламентам деканата...',
                  "Advisor is checking Dean's Office regulations..."
                )}
              </span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-[#112238] border-t border-[#DCE2EA] dark:border-[#193150] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-[#667085] dark:text-[#94A3B8] px-1">
            <span>
              {tr(
                lang,
                'Обработка на сервере (только данные вашей сессии)',
                'Processed server-side using only your session data'
              )}
            </span>
            {lastSource && (
              <span className="font-mono text-[#142D4E] dark:text-[#93C5FD]">
                {lastSource === 'llm' ? 'LLM' : tr(lang, 'Движок правил', 'Rules Engine')}
              </span>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={tr(
                lang,
                'Задайте вопрос по учебе, справкам или сессии...',
                'Ask a question about studies, certificates, or exams...'
              )}
              className="flex-1 bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg px-3.5 py-2.5 text-xs text-[#0F1D30] dark:text-[#FFFFFF] placeholder-[#667085]/60 focus:outline-none focus:ring-2 focus:ring-[#142D4E] dark:focus:ring-[#245A91]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label={tr(lang, 'Отправить сообщение', 'Send message')}
              className="min-w-[44px] min-h-[44px] px-4 py-2.5 rounded-lg bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] font-sans font-semibold text-xs border border-[#245A91]/40 flex items-center justify-center space-x-1.5 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-[#93C5FD]" />
              <span className="hidden sm:inline">{tr(lang, 'Отправить', 'Send')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
