import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Sun,
  Moon,
  Sparkles,
  IdCard,
  LogOut,
  ShieldCheck,
  Building2,
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
  activeTab,
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
      <div className="bg-[#102923] text-[#F3EFE5]/85 border-b border-[#C4A46B]/25 py-1 px-3 sm:px-6 lg:px-8 text-[11px] font-sans">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Institutional Motto & Central Campus Quadrangle */}
          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-flex items-center space-x-1.5 text-[#C4A46B] font-serif tracking-wider italic text-[11px]">
              <Compass className="w-3 h-3 text-[#C4A46B]" />
              <span>Veritas • Scientia • Innovatio</span>
            </span>
            <span className="hidden sm:inline text-[#C4A46B]/40">•</span>
            <span className="text-[#F3EFE5]/75 truncate">
              {lang === 'ru'
                ? 'Международный научно-технологический университет'
                : 'International Institute of Science & Technology'}
            </span>
          </div>

          {/* Academic Term & Utility Toggles */}
          <div className="flex items-center space-x-3 text-[11px]">
            {/* Term indicator */}
            <div className="hidden md:flex items-center space-x-1.5 text-[#C4A46B] font-mono text-[10px]">
              <CalendarDays className="w-3 h-3 text-[#C4A46B]" />
              <span>
                {lang === 'ru' ? 'Весенний семестр 2026 • 8-я неделя' : 'Spring Term 2026 • Week 8'}
              </span>
            </div>

            <span className="hidden md:inline text-[#C4A46B]/40">•</span>

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded text-[#F3EFE5] hover:text-[#C4A46B] hover:bg-[#183D35] border border-[#C4A46B]/40 transition-colors uppercase tracking-wider flex items-center space-x-1"
              title={lang === 'ru' ? 'Switch to English' : 'Переключить на русский'}
            >
              <Globe2 className="w-2.5 h-2.5 text-[#C4A46B]" />
              <span>{lang.toUpperCase()}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1 rounded text-[#F3EFE5]/80 hover:text-white hover:bg-[#183D35] transition-colors"
              title={theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <Moon className="w-3.5 h-3.5 text-[#C4A46B]" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-[#C4A46B]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TIER 2: PRIMARY INSTITUTIONAL MASTHEAD & ACADEMIC PORTAL BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#183D35] text-[#F3EFE5] border-b border-[#C4A46B]/40">
        {/* Subtle decorative gold hairline ribbon */}
        <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-[#C4A46B] to-transparent opacity-80" />

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* University Heraldic Lockup (Seal + Typography) */}
            <div
              className="flex items-center space-x-3.5 cursor-pointer group"
              onClick={() => setActiveTab(isStaff ? 'staff_requests' : 'today')}
            >
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-[#102923] border border-[#C4A46B]/60 flex items-center justify-center p-1.5 shadow-md group-hover:border-[#C4A46B] group-hover:shadow-[#C4A46B]/20 transition-all">
                  <UniversityEmblem size={38} variant="full" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#C4A46B] ring-2 ring-[#183D35]" />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className="font-extrabold text-lg sm:text-2xl tracking-wider uppercase text-[#F3EFE5] group-hover:text-[#FAF8F3] transition-colors leading-none"
                    style={{ fontFamily: "'Cinzel', 'Crimson Pro', Georgia, serif" }}
                  >
                    DemoTech
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-sans font-semibold tracking-widest uppercase px-2 py-0.5 rounded border border-[#C4A46B]/50 text-[#C4A46B] bg-[#102923]/80">
                    {isStaff
                      ? (lang === 'ru' ? 'Деканат' : 'Faculty Registry')
                      : (lang === 'ru' ? 'Студент' : 'Student')}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-[#F3EFE5]/80 font-sans tracking-wide mt-1">
                  {lang === 'ru'
                    ? 'Управление академических программ и цифровой деканат'
                    : 'Office of Academic Affairs & Digital Dean\'s Portal'}
                </p>
              </div>
            </div>

            {/* Academic Controls & Actions (No Demo Switchers!) */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* AI Copilot / Dean's Advisory Assistant */}
              <button
                onClick={onOpenAssistant}
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#102923] hover:bg-[#15342D] border border-[#C4A46B]/40 hover:border-[#C4A46B] text-[#F3EFE5] text-xs font-sans font-medium transition-all shadow-xs active:scale-95 cursor-pointer"
                title={lang === 'ru' ? 'Консультант деканата' : 'Academic Advisory Copilot'}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C4A46B]" />
                <span className="hidden sm:inline">
                  {lang === 'ru' ? 'Консультант' : 'Copilot'}
                </span>
              </button>

              {/* Digital Student ID Card (students only) */}
              {!isStaff && (
                <button
                  onClick={onOpenCard}
                  title={lang === 'ru' ? 'Электронный студенческий билет' : 'Digital Student ID'}
                  className="p-2 rounded-lg text-[#F3EFE5]/90 hover:text-white hover:bg-[#102923] border border-transparent hover:border-[#C4A46B]/30 transition-colors relative cursor-pointer"
                >
                  <IdCard className="w-4 h-4 sm:w-5 sm:h-5 text-[#C4A46B]" />
                </button>
              )}

              {/* Notifications & Decrees Bell */}
              <button
                onClick={() => setActiveTab('notifications')}
                title={lang === 'ru' ? 'Вестник и приказы деканата' : 'Announcements & Decrees'}
                className="p-2 rounded-lg text-[#F3EFE5]/90 hover:text-white hover:bg-[#102923] border border-transparent hover:border-[#C4A46B]/30 transition-colors relative cursor-pointer"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#A33D35] text-white text-[10px] font-mono font-bold flex items-center justify-center border border-[#183D35] shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Architectural Hairline Divider */}
              <div className="h-6 w-px bg-[#C4A46B]/30 mx-0.5 sm:mx-1 hidden xs:block" />

              {/* User Identity & Direct Sign Out */}
              <div className="flex items-center pl-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center space-x-2.5 p-1 rounded-lg hover:bg-[#102923] transition-colors text-left cursor-pointer"
                  title={`${user?.fullName} • ${isStaff ? 'Деканат МО' : profile?.group}`}
                >
                  <img
                    src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={user?.fullName}
                    className="w-8 h-8 rounded-lg object-cover border border-[#C4A46B]/70 shadow-xs"
                  />
                  <div className="hidden lg:block text-left max-w-[130px]">
                    <p className="text-xs font-semibold text-[#F3EFE5] truncate font-serif leading-tight">
                      {user?.fullName?.split(' ')[0]} {user?.fullName?.split(' ')[1]?.[0]}.
                    </p>
                    <p className="text-[10px] text-[#C4A46B] font-mono leading-none truncate mt-0.5">
                      {isStaff ? 'Инспектор' : profile?.group}
                    </p>
                  </div>
                </button>

                <button
                  onClick={logout}
                  title={lang === 'ru' ? 'Выйти из личного кабинета' : 'Sign out'}
                  className="p-1.5 sm:p-2 ml-1 text-[#F3EFE5]/70 hover:text-[#C4A46B] hover:bg-[#102923] rounded-lg transition-colors cursor-pointer"
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
