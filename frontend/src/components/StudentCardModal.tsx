import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Wifi, CheckCircle2, QrCode } from 'lucide-react';
import { UNIVERSITY_INFO } from '../services/mockData';

interface StudentCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentCardModal: React.FC<StudentCardModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, lang } = useAuth();
  const [isNfcTapping, setIsNfcTapping] = useState(false);
  const [turnstilePassed, setTurnstilePassed] = useState(false);

  if (!isOpen || !user) return null;

  const handleNfcSimulate = () => {
    setIsNfcTapping(true);
    setTimeout(() => {
      setIsNfcTapping(false);
      setTurnstilePassed(true);
      setTimeout(() => setTurnstilePassed(false), 3000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Digital Card Surface with Holographic Gradient */}
        <div className="relative p-6 bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 text-white overflow-hidden shadow-inner">
          {/* Hologram / Guilloche shine */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.5),rgba(255,255,255,0))]" />
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between mb-5 relative z-10">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/30 flex items-center justify-center ring-1 ring-white/30">
                <svg className="w-4 h-4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-xs tracking-wider uppercase text-cyan-200">
                  {UNIVERSITY_INFO.name}
                </h3>
                <p className="text-[10px] text-slate-300">
                  {lang === 'ru' ? 'Электронный студенческий билет' : 'Digital Student Pass'}
                </p>
              </div>
            </div>
            <Wifi className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>

          {/* Student Info & Photo */}
          <div className="flex space-x-4 items-center mb-6 relative z-10">
            <div className="relative">
              <img
                src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                alt={user.fullName}
                className="w-20 h-24 rounded-xl object-cover border-2 border-white/40 shadow-md"
              />
              <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </span>
            </div>

            <div className="flex-1 space-y-1">
              <h2 className="font-bold text-base text-white leading-tight">
                {user.fullName}
              </h2>
              <p className="text-[11px] text-cyan-200 font-medium">
                {profile?.group} • {profile?.year} курс
              </p>
              <p className="text-[10px] text-slate-300 line-clamp-1">
                {profile?.program}
              </p>
              <div className="pt-1 flex items-center space-x-2 text-[10px]">
                <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-cyan-300">
                  № {profile?.studentNumber}
                </span>
                <span className="text-emerald-400 font-medium">
                  {profile?.studyForm || 'Бюджет'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Dynamic QR Code */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between border border-white/15 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center shadow">
                <QrCode className="w-10 h-10 text-slate-900" />
              </div>
              <div className="text-[10px] text-slate-300">
                <p className="font-semibold text-white">Динамический QR-пропуск</p>
                <p className="text-slate-400 font-mono">Обновляется каждые 30 сек</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping mr-1" />
              <span className="text-[10px] font-mono text-emerald-300">VALID</span>
            </div>
          </div>
        </div>

        {/* Turnstile / NFC Interaction Box */}
        <div className="p-5 text-center space-y-3 bg-slate-50 dark:bg-slate-800/50">
          {turnstilePassed ? (
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center space-x-2 animate-bounce">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold">Проход открыт! Добро пожаловать.</span>
            </div>
          ) : (
            <button
              onClick={handleNfcSimulate}
              disabled={isNfcTapping}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-xs text-white transition-all shadow-md flex items-center justify-center space-x-2 ${
                isNfcTapping
                  ? 'bg-indigo-400 cursor-wait'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 active:scale-95'
              }`}
            >
              <Wifi className={`w-4 h-4 ${isNfcTapping ? 'animate-spin' : ''}`} />
              <span>
                {isNfcTapping
                  ? (lang === 'ru' ? 'Чтение NFC метки...' : 'Reading NFC...')
                  : (lang === 'ru' ? 'Приложить к турникету (NFC симуляция)' : 'Tap Turnstile (NFC Simulation)')}
              </span>
            </button>
          )}

          <p className="text-[11px] text-slate-400">
            Действителен до 31 августа 2027 г. • Турникеты всех кампусов
          </p>
        </div>
      </div>
    </div>
  );
};
