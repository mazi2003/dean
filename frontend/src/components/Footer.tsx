import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Info } from 'lucide-react';
import { UNIVERSITY_INFO } from '../services/mockData';

export const Footer: React.FC = () => {
  const { lang } = useAuth();

  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-medium">
          <Info className="w-3.5 h-3.5" />
          <span>
            {lang === 'ru'
              ? 'Конкурсный концепт. Не является официальным сервисом университета. Все данные вымышлены.'
              : 'Competition concept. Not an official university service. Fictional data only.'}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-slate-400 text-[11px]">
          <span>© 2026 {UNIVERSITY_INFO.name}</span>
          <span>•</span>
          <span className="flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            {lang === 'ru' ? 'Защита персональных данных: изоляция сессий' : 'Data protection: strict session isolation'}
          </span>
          <span>•</span>
          <span>v1.0.0-prototype</span>
        </div>
      </div>
    </footer>
  );
};
