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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg h-[620px] max-h-[92vh] bg-white dark:bg-[#171c26] rounded-3xl shadow-2xl overflow-hidden border border-[#e2e4e8] dark:border-[#273142] flex flex-col">
        {/* Academic Header (Innopolis Style) */}
        <div className="p-4 bg-[#161821] text-white flex items-center justify-between border-b border-white/10 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#11141c] border border-[#33b712]/50 flex items-center justify-center p-1.5 shadow-inner">
              <UniversityEmblem size={26} />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-sm flex items-center space-x-2 text-white">
                <span>{tr(lang, 'Консультант деканата', "Dean's Office AI Advisor")}</span>
                <span className="w-2 h-2 rounded-full bg-[#33b712] inline-block animate-pulse" />
              </h3>
              <p className="text-[10px] text-[#45d320] font-sans font-medium">
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
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label={tr(lang, 'Закрыть', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Question Chips (Innopolis Pill Badges) */}
        <div className="p-3 bg-[#f6f6f9] dark:bg-[#121620] border-b border-[#e2e4e8] dark:border-[#273142] flex items-center space-x-2 overflow-x-auto text-[11px] font-sans">
          <span className="text-[#475569] dark:text-[#94a3b8] font-heading font-medium whitespace-nowrap pl-1">
            {tr(lang, 'Частые вопросы:', 'Quick questions:')}
          </span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#171c26] hover:bg-[#ebfbee] dark:hover:bg-[#1e2d24] text-[#161821] dark:text-[#ffffff] hover:text-[#166534] dark:text-[#45d320] border border-[#e2e4e8] dark:border-[#273142] whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer font-heading shadow-2xs"
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
                  <div className="w-8 h-8 rounded-full bg-[#161821] text-[#45d320] flex items-center justify-center flex-shrink-0 border border-[#33b712]/40 shadow-xs">
                    <UniversityEmblem size={20} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] flex items-center justify-center flex-shrink-0 text-[#161821] dark:text-[#ffffff] shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] p-3.5 rounded-2xl leading-relaxed ${
                    isUser
                      ? 'bg-[#161821] text-white shadow-xs'
                      : 'bg-[#f6f6f9] dark:bg-[#121620] text-[#161821] dark:text-[#ffffff] border border-[#e2e4e8] dark:border-[#273142]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {idx === 0 && !isUser ? defaultGreeting : m.text}
                  </p>
                  <span
                    className={`block text-[10px] mt-1 font-mono text-right ${
                      isUser ? 'text-[#45d320]' : 'text-[#475569] dark:text-[#94a3b8]'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-[#475569] dark:text-[#94a3b8] p-2">
              <Sparkles className="w-4 h-4 text-[#166534] dark:text-[#45d320] animate-spin" />
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
        <div className="p-3.5 bg-white dark:bg-[#171c26] border-t border-[#e2e4e8] dark:border-[#273142] space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-[#475569] dark:text-[#94a3b8] px-2 font-sans">
            <span>
              {tr(
                lang,
                'Обработка на сервере (только данные вашей сессии)',
                'Processed server-side using only your session data'
              )}
            </span>
            {lastSource && (
              <span className="font-sans text-[#166534] dark:text-[#45d320] font-semibold">
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
              className="flex-1 bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-full px-4 py-2.5 text-xs text-[#161821] dark:text-[#ffffff] placeholder-[#8a8b90]/60 focus:outline-none focus:ring-2 focus:ring-[#33b712]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label={tr(lang, 'Отправить сообщение', 'Send message')}
              className="min-w-[44px] min-h-[44px] px-5 py-2.5 rounded-full btn-innopolis-primary text-white font-heading font-semibold text-xs flex items-center justify-center space-x-1.5 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">{tr(lang, 'Отправить', 'Send')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
