import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Sparkles, Send, Bot, User, HelpCircle, Building } from 'lucide-react';
import { api } from '../services/api';
import { UniversityEmblem } from './UniversityEmblem';

interface AssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

export const AssistantModal: React.FC<AssistantModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, lang } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: `Здравствуйте, ${user?.fullName ? user.fullName.split(' ')[0] : 'студент'}! Я цифровой консультант деканата DemoTech University. Могу проконсультировать вас по вашему расписанию, задолженностям, срокам подачи документов на ПГАС и регламенту выдачи справок с ЭЦП. Чем могу помочь?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    'Когда у меня пересдача по статистике?',
    'Как заказать справку об обучении с ЭЦП?',
    'Критерии повышенной стипендии (ПГАС)?',
    'Часы приема и контакты деканата?',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const answer = await api.askAssistant(text);
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: 'В данный момент информационная база деканата обновляется. Пожалуйста, обратитесь в деканат (каб. 312) или повторите запрос через несколько минут.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg h-[620px] max-h-[92vh] bg-white dark:bg-[#18221D] rounded-xl shadow-2xl overflow-hidden border border-[#C4A46B]/40 flex flex-col">
        {/* Academic Header */}
        <div className="p-4 bg-[#183D35] text-[#F3EFE5] flex items-center justify-between border-b border-[#C4A46B]/30 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#102923] border border-[#C4A46B]/60 flex items-center justify-center p-1 shadow-inner">
              <UniversityEmblem size={28} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm flex items-center space-x-2 text-[#F3EFE5]">
                <span>{lang === 'ru' ? 'Консультант деканата' : 'Dean\'s Office AI Advisor'}</span>
                <span className="w-2 h-2 rounded-full bg-[#C4A46B] inline-block animate-pulse" />
              </h3>
              <p className="text-[10px] text-[#C4A46B] font-mono">
                {profile?.group ? `Контекст: гр. ${profile.group} • Факультет МО` : 'DemoTech University'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#F3EFE5]/75 hover:text-white hover:bg-[#102923] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Question Chips */}
        <div className="p-3 bg-[#FAF8F3] dark:bg-[#121714] border-b border-[#E3DDD1] dark:border-[#26362F] flex items-center space-x-1.5 overflow-x-auto text-[11px] font-sans">
          <span className="text-[#7E877B] font-medium whitespace-nowrap pl-1">Частые вопросы:</span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-[#1A2520] hover:bg-[#F2EEE4] text-[#183D35] dark:text-[#C4A46B] border border-[#E3DDD1] dark:border-[#2D3E35] whitespace-nowrap transition-colors flex-shrink-0"
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
                  <div className="w-7 h-7 rounded-md bg-[#183D35] text-[#C4A46B] flex items-center justify-center flex-shrink-0 border border-[#C4A46B]/40">
                    <UniversityEmblem size={18} />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-md bg-[#FAF8F3] dark:bg-[#1A2520] border border-[#E3DDD1] dark:border-[#2D3E35] flex items-center justify-center flex-shrink-0 text-[#252923] dark:text-[#F3EFE5]">
                    <User className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] p-3.5 rounded-xl leading-relaxed ${
                    isUser
                      ? 'bg-[#183D35] text-[#F3EFE5]'
                      : 'bg-[#FAF8F3] dark:bg-[#121714] text-[#252923] dark:text-[#F3EFE5] border border-[#E3DDD1] dark:border-[#2D3E35]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span
                    className={`block text-[10px] mt-1 font-mono text-right ${
                      isUser ? 'text-[#C4A46B]' : 'text-[#7E877B]'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-[#7E877B] p-2">
              <Sparkles className="w-4 h-4 text-[#C4A46B] animate-spin" />
              <span>Консультант обращается к регламентам деканата...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-[#18221D] border-t border-[#E3DDD1] dark:border-[#26362F]">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Задайте вопрос по учебе, справкам или сессии..."
              className="flex-1 bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg px-3.5 py-2.5 text-xs text-[#252923] dark:text-[#F3EFE5] placeholder-[#7E877B]/60 focus:outline-none focus:ring-2 focus:ring-[#183D35] dark:focus:ring-[#C4A46B]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-lg bg-[#183D35] hover:bg-[#102923] text-[#F3EFE5] font-sans font-semibold text-xs border border-[#C4A46B]/40 flex items-center space-x-1.5 disabled:opacity-50 transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5 text-[#C4A46B]" />
              <span className="hidden sm:inline">Отправить</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
