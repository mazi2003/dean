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
      <div className="relative w-full max-w-lg h-[620px] max-h-[92vh] bg-white dark:bg-[#112238] rounded-xl shadow-2xl overflow-hidden border border-[#245A91]/40 flex flex-col">
        {/* Academic Header */}
        <div className="p-4 bg-[#142D4E] text-[#FFFFFF] flex items-center justify-between border-b border-[#245A91]/30 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#0E1F36] border border-[#245A91]/60 flex items-center justify-center p-1 shadow-inner">
              <UniversityEmblem size={28} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm flex items-center space-x-2 text-[#FFFFFF]">
                <span>{lang === 'ru' ? 'Консультант деканата' : 'Dean\'s Office AI Advisor'}</span>
                <span className="w-2 h-2 rounded-full bg-[#245A91] inline-block animate-pulse" />
              </h3>
              <p className="text-[10px] text-[#245A91] font-mono">
                {profile?.group ? `Контекст: гр. ${profile.group} • Факультет МО` : 'DemoTech University'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#FFFFFF]/75 hover:text-white hover:bg-[#0E1F36] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Question Chips */}
        <div className="p-3 bg-[#F8FAFC] dark:bg-[#0E1B2D] border-b border-[#DCE2EA] dark:border-[#193150] flex items-center space-x-1.5 overflow-x-auto text-[11px] font-sans">
          <span className="text-[#667085] font-medium whitespace-nowrap pl-1">Частые вопросы:</span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-[#162A45] hover:bg-[#F2EEE4] text-[#142D4E] dark:text-[#245A91] border border-[#DCE2EA] dark:border-[#1E395B] whitespace-nowrap transition-colors flex-shrink-0"
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
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span
                    className={`block text-[10px] mt-1 font-mono text-right ${
                      isUser ? 'text-[#245A91]' : 'text-[#667085]'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-[#667085] p-2">
              <Sparkles className="w-4 h-4 text-[#245A91] animate-spin" />
              <span>Консультант обращается к регламентам деканата...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-[#112238] border-t border-[#DCE2EA] dark:border-[#193150]">
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
              className="flex-1 bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg px-3.5 py-2.5 text-xs text-[#0F1D30] dark:text-[#FFFFFF] placeholder-[#667085]/60 focus:outline-none focus:ring-2 focus:ring-[#142D4E] dark:focus:ring-[#245A91]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-lg bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] font-sans font-semibold text-xs border border-[#245A91]/40 flex items-center space-x-1.5 disabled:opacity-50 transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5 text-[#245A91]" />
              <span className="hidden sm:inline">Отправить</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
