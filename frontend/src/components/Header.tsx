import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Sun,
  Moon,
  Sparkles,
  IdCard,
  LogOut,
  CalendarDays,
  Globe2,
  Compass,
} from 'lucide-react';
import { UniversityEmblem } from './UniversityEmblem';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCard: () => void;
  onOpenAssistant: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab: _activeTab,
  setActiveTab,
  onOpenCard,
  onOpenAssistant,
}) => {
  const { user, profile, logout, theme, toggleTheme, lang, toggleLang, unreadCount } = useAuth();
  const isStaff = user?.role === 'staff';

  return (
    <header className="sticky top-0 z-40 shadow-lg transition-colors select-none">
      {/* ─────────────────────────────────────────────────────────────
          TIER 1: GLOBAL INSTITUTIONAL MARQUEE / UTILITY BAR (Oxford & ETH Style)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#0E1F36] text-[#FFFFFF]/85 border-b border-[#60A5FA]/25 py-1 px-3 sm:px-6 lg:px-8 text-[11px] font-sans">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Institutional Motto & Central Campus Quadrangle */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <span className="hidden sm:inline-flex items-center space-x-1.5 text-[#93C5FD] font-sans tracking-wide italic text-[11px] flex-shrink-0">
              <Compass className="w-3 h-3 text-[#93C5FD]" />
              <span>Veritas • Scientia • Innovatio</span>
            </span>
            <span className="hidden sm:inline text-[#60A5FA]/40">•</span>
            <span className="text-[#FFFFFF]/80 truncate">
              {lang === 'ru'
                ? 'Международный научно-технологический университет'
                : 'International Institute of Science & Technology'}
            </span>
          </div>

          {/* Academic Term & Utility Toggles */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-[11px] flex-shrink-0">
            {/* Term indicator */}
            <div className="hidden md:flex items-center space-x-1.5 text-[#93C5FD] font-mono text-[10px]">
              <CalendarDays className="w-3 h-3 text-[#93C5FD]" />
              <span>
                {lang === 'ru' ? 'Весенний семестр 2026 • 8-я неделя' : 'Spring Term 2026 • Week 8'}
              </span>
            </div>

            <span className="hidden md:inline text-[#60A5FA]/40">•</span>

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded text-[#FFFFFF] hover:text-[#93C5FD] hover:bg-[#142D4E] border border-[#60A5FA]/40 transition-colors uppercase tracking-wider flex items-center space-x-1 cursor-pointer"
              title={lang === 'ru' ? 'Switch to English' : 'Переключить на русский'}
            >
              <Globe2 className="w-2.5 h-2.5 text-[#93C5FD]" />
              <span>{lang.toUpperCase()}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1 rounded text-[#FFFFFF]/80 hover:text-white hover:bg-[#142D4E] transition-colors cursor-pointer"
              title={
                lang === 'ru'
                  ? theme === 'light'
                    ? 'Включить тёмную тему'
                    : 'Включить светлую тему'
                  : theme === 'light'
                  ? 'Enable dark mode'
                  : 'Enable light mode'
              }
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <Moon className="w-3.5 h-3.5 text-[#93C5FD]" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-[#93C5FD]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TIER 2: PRIMARY INSTITUTIONAL MASTHEAD & ACADEMIC PORTAL BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#142D4E] text-[#FFFFFF] border-b border-[#60A5FA]/35">
        <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-[#60A5FA] to-transparent opacity-70" />

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
            {/* University Heraldic Lockup */}
            <div
              className="flex items-center space-x-2 sm:space-x-3.5 cursor-pointer group min-w-0 flex-1"
              onClick={() => setActiveTab(isStaff ? 'staff_requests' : 'today')}
            >
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 sm:w-13 sm:h-13 rounded-xl bg-[#0E1F36] border border-[#60A5FA]/50 flex items-center justify-center p-1 sm:p-1.5 shadow-md group-hover:border-[#93C5FD] transition-all">
                  <UniversityEmblem size={38} variant="full" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#60A5FA] ring-2 ring-[#142D4E]" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="font-bold text-sm sm:text-2xl tracking-tight uppercase text-[#FFFFFF] group-hover:text-[#F8FAFC] transition-colors leading-none whitespace-nowrap">
                    DemoTech
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-sans font-semibold tracking-widest uppercase px-2 py-0.5 rounded border border-[#60A5FA]/50 text-[#93C5FD] bg-[#0E1F36]/80 flex-shrink-0">
                    {isStaff
                      ? (lang === 'ru' ? 'Деканат' : 'Faculty Registry')
                      : (lang === 'ru' ? 'Студент' : 'Student')}
                  </span>
                </div>
                <p className="hidden sm:block text-xs text-[#E2E8F0] font-sans tracking-wide mt-1 truncate">
                  {lang === 'ru'
                    ? 'Управление академических программ и цифровой деканат'
                    : "Office of Academic Affairs & Digital Dean's Portal"}
                </p>
              </div>
            </div>

            {/* Academic Controls & Actions (No Demo Switchers!) */}
            <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
              {/* AI Copilot / Dean's Advisory Assistant */}
              <button
                onClick={onOpenAssistant}
                className="flex items-center space-x-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-[#0E1F36] hover:bg-[#1C3B65] border border-[#60A5FA]/40 hover:border-[#93C5FD] text-[#FFFFFF] text-xs font-sans font-medium transition-all shadow-xs active:scale-95 cursor-pointer"
                title={lang === 'ru' ? 'Консультант деканата' : 'Academic Advisory Copilot'}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#93C5FD]" />
                <span className="hidden sm:inline">
                  {lang === 'ru' ? 'Консультант' : 'Copilot'}
                </span>
              </button>

              {/* Digital Student ID Card (students only) */}
              {!isStaff && (
                <button
                  onClick={onOpenCard}
                  title={lang === 'ru' ? 'Электронный студенческий билет' : 'Digital Student ID'}
                  aria-label={lang === 'ru' ? 'Электронный студенческий билет' : 'Digital Student ID'}
                  className="p-1.5 sm:p-2 rounded-lg text-[#FFFFFF]/90 hover:text-white hover:bg-[#0E1F36] border border-transparent hover:border-[#60A5FA]/35 transition-colors relative cursor-pointer"
                >
                  <IdCard className="w-4 h-4 sm:w-5 sm:h-5 text-[#93C5FD]" />
                </button>
              )}

              {/* Notifications & Decrees Bell */}
              <button
                onClick={() => setActiveTab('notifications')}
                title={lang === 'ru' ? 'Вестник и приказы деканата' : 'Announcements & Decrees'}
                aria-label={lang === 'ru' ? 'Уведомления и приказы' : 'Notifications'}
                className="p-1.5 sm:p-2 rounded-lg text-[#FFFFFF]/90 hover:text-white hover:bg-[#0E1F36] border border-transparent hover:border-[#60A5FA]/35 transition-colors relative cursor-pointer"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-4 h-4 rounded-full bg-[#C63740] text-white text-[10px] font-mono font-bold flex items-center justify-center border border-[#142D4E] shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Hairline Divider */}
              <div className="h-6 w-px bg-[#60A5FA]/30 mx-0.5 sm:mx-1 hidden sm:block" />

              {/* User Identity & Direct Sign Out */}
              <div className="flex items-center pl-0.5 sm:pl-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center space-x-2.5 p-1 rounded-lg hover:bg-[#0E1F36] transition-colors text-left cursor-pointer"
                  title={`${user?.fullName} • ${isStaff ? (lang === 'ru' ? 'Деканат МО' : "Dean's Office") : profile?.group}`}
                >
                  <img
                    src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={user?.fullName}
                    className="w-8 h-8 rounded-lg object-cover border border-[#60A5FA]/60 shadow-xs"
                  />
                  <div className="hidden lg:block text-left max-w-[130px]">
                    <p className="text-xs font-semibold text-[#FFFFFF] truncate leading-tight">
                      {user?.fullName?.split(' ')[0]} {user?.fullName?.split(' ')[1]?.[0]}.
                    </p>
                    <p className="text-[10px] text-[#93C5FD] font-mono leading-none truncate mt-0.5">
                      {isStaff ? (lang === 'ru' ? 'Инспектор' : 'Inspector') : profile?.group}
                    </p>
                  </div>
                </button>

                <button
                  onClick={logout}
                  title={lang === 'ru' ? 'Выйти из личного кабинета' : 'Sign out'}
                  className="p-1.5 sm:p-2 ml-1 text-[#CBD5E1] hover:text-[#FFFFFF] hover:bg-[#0E1F36] rounded-lg transition-colors cursor-pointer"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
