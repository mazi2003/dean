import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Sun,
  Moon,
  Sparkles,
  IdCard,
  Users,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { TEST_USERS } from '../services/mockData';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCard: () => void;
  onOpenAssistant: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  setActiveTab,
  onOpenCard,
  onOpenAssistant,
}) => {
  const { user, profile, logout, switchAccount, theme, toggleTheme, lang, toggleLang, unreadCount } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & University Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('today')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20 ring-1 ring-white/20">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                  DemoTech
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                  {lang === 'ru' ? 'Концепт' : 'Concept'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                {lang === 'ru' ? 'Цифровой деканат будущего' : 'Digital Dean\'s Office'}
              </p>
            </div>
          </div>

          {/* Quick Jury Account Switcher & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Jury Account Selector */}
            <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-medium text-slate-400 px-2 flex items-center">
                <Users className="w-3.5 h-3.5 mr-1 text-slate-500" />
                {lang === 'ru' ? 'Жюри:' : 'Demo:'}
              </span>
              {Object.entries(TEST_USERS).map(([email, item]) => {
                const isSelected = user?.email === email;
                const shortName = item.user.fullName.split(' ')[0];
                return (
                  <button
                    key={email}
                    onClick={() => switchAccount(email)}
                    title={`${item.user.fullName} (${item.user.role === 'staff' ? 'Деканат' : item.profile.group})`}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {item.user.role === 'staff' ? '🏛️ Деканат' : shortName}
                  </button>
                );
              })}
            </div>

            {/* AI Assistant Button */}
            <button
              onClick={onOpenAssistant}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium shadow-md shadow-indigo-500/20 hover:opacity-95 transition-all transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
              <span className="hidden sm:inline">{lang === 'ru' ? 'AI Ассистент' : 'AI Copilot'}</span>
            </button>

            {/* Digital Student Card Button (students only) */}
            {user?.role === 'student' && (
              <button
                onClick={onOpenCard}
                title={lang === 'ru' ? 'Цифровой студенческий билет' : 'Digital Student ID'}
                className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              >
                <IdCard className="w-5 h-5" />
              </button>
            )}

            {/* Notifications Bell */}
            <button
              onClick={() => setActiveTab('notifications')}
              title={lang === 'ru' ? 'Уведомления' : 'Notifications'}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Переключить тему"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="px-2 py-1 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 uppercase"
            >
              {lang}
            </button>

            {/* User Profile Pill & Logout */}
            <div className="flex items-center pl-1 sm:pl-2">
              <button
                onClick={() => setActiveTab('profile')}
                className="flex items-center space-x-2 p-1 rounded-full hover:ring-2 hover:ring-blue-400 transition-all"
                title={user?.fullName}
              >
                <img
                  src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={user?.fullName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/30"
                />
              </button>
              <button
                onClick={logout}
                title={lang === 'ru' ? 'Выйти' : 'Logout'}
                className="p-2 ml-1 text-slate-400 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile quick jury bar */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] overflow-x-auto gap-2">
          <span className="text-slate-400 font-medium whitespace-nowrap flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />
            {lang === 'ru' ? 'Тест-аккаунты:' : 'Test user:'}
          </span>
          <div className="flex items-center space-x-1.5 whitespace-nowrap">
            {Object.entries(TEST_USERS).map(([email, item]) => {
              const isSelected = user?.email === email;
              const shortName = item.user.fullName.split(' ')[0];
              return (
                <button
                  key={email}
                  onClick={() => switchAccount(email)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.user.role === 'staff' ? 'Деканат' : shortName}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
