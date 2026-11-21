import React, { useState, useEffect } from 'react';
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
  Eye,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { UniversityEmblem } from './UniversityEmblem';
import { resolveAvatarSrc } from '../utils/avatar';
import { tr } from '../utils/i18n';

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
  const {
    user,
    profile,
    logout,
    theme,
    toggleTheme,
    accessibilityMode,
    toggleAccessibilityMode,
    lang,
    toggleLang,
    unreadCount,
  } = useAuth();
  const isStaff = user?.role === 'staff';

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [simulateOffline, setSimulateOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isActuallyOffline = !isOnline || simulateOffline;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#171c26]/95 backdrop-blur-md border-b border-[#e2e4e8] dark:border-[#273142] shadow-xs transition-colors select-none">
      {/* ─────────────────────────────────────────────────────────────
          TIER 1: INNOPOLIS-STYLE MINIMALIST UTILITY BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#f6f6f9] dark:bg-[#121620] text-[#161821] dark:text-[#cbd5e1] border-b border-[#e2e4e8] dark:border-[#273142] py-1 px-3 sm:px-6 lg:px-8 text-[11px] font-sans">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Institutional Motto & Academic Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <span className="hidden sm:inline-flex items-center space-x-1.5 text-[#166534] dark:text-[#45d320] font-heading font-semibold text-[11px] flex-shrink-0">
              <Compass className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320]" />
              <span>Veritas • Scientia • Innovatio</span>
            </span>
            <span className="hidden sm:inline text-[#e2e4e8] dark:text-[#334155]">•</span>
            <span className="text-[#475569] dark:text-[#94a3b8] truncate text-xs">
              {lang === 'ru'
                ? 'Международный научно-технологический университет «ДемоТех»'
                : 'DemoTech University • Institute of Science & Technology'}
            </span>
          </div>

          {/* Academic Term & Utility Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-[11px] flex-shrink-0">
            {/* Term indicator */}
            <div className="hidden md:flex items-center space-x-1.5 text-[#166534] dark:text-[#45d320] font-sans text-[11px] font-medium bg-[#ebfbee] dark:bg-[#1e2d24] px-2.5 py-0.5 rounded-full">
              <CalendarDays className="w-3 h-3 text-[#166534] dark:text-[#45d320]" />
              <span>
                {lang === 'ru' ? 'Весенний семестр 2026 • 8-я неделя' : 'Spring Term 2026 • Week 8'}
              </span>
            </div>

            <span className="hidden md:inline text-[#e2e4e8] dark:text-[#334155]">•</span>

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="px-2.5 py-1 min-w-[44px] min-h-[44px] text-[11px] font-heading font-semibold rounded-full text-[#161821] dark:text-[#ffffff] hover:bg-[#ebeef3] dark:hover:bg-[#1f293d] border border-[#e2e4e8] dark:border-[#273142] transition-colors uppercase tracking-wider flex items-center justify-center space-x-1 cursor-pointer"
              title={lang === 'ru' ? 'Switch to English' : 'Переключить на русский'}
              aria-label="Toggle language"
            >
              <Globe2 className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320]" />
              <span>{lang.toUpperCase()}</span>
            </button>

            {/* Accessibility Mode Toggle (ГОСТ Р 52872-2019 / WCAG AAA) */}
            <button
              onClick={toggleAccessibilityMode}
              className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors cursor-pointer border ${
                accessibilityMode
                  ? 'bg-[#33b712] border-[#33b712] text-white'
                  : 'bg-[#f6f6f9] dark:bg-[#1e2533] text-[#161821] dark:text-[#cbd5e1] hover:bg-[#ebeef3] border-[#e2e4e8] dark:border-[#273142]'
              }`}
              title={
                lang === 'ru'
                  ? 'Версия для слабовидящих (ГОСТ Р 52872-2019)'
                  : 'High Contrast Accessibility Mode'
              }
              aria-label={
                lang === 'ru'
                  ? 'Включить версию для слабовидящих'
                  : 'Toggle accessibility high contrast mode'
              }
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[#161821] dark:text-[#cbd5e1] bg-[#f6f6f9] dark:bg-[#1e2533] hover:bg-[#ebeef3] dark:hover:bg-[#273142] border border-[#e2e4e8] dark:border-[#273142] transition-colors cursor-pointer"
              title={
                lang === 'ru'
                  ? theme === 'light'
                    ? 'Включить тёмную тему'
                    : 'Включить светлую тему'
                  : theme === 'light'
                    ? 'Enable dark mode'
                    : 'Enable light mode'
              }
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-3.5 h-3.5 text-[#161821]" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-[#b45309] dark:text-[#fbbf24]" />
              )}
            </button>

            {/* PWA Offline-First Mode Status & Simulator Button */}
            <button
              onClick={() => setSimulateOffline(!simulateOffline)}
              className={`hidden lg:flex items-center space-x-1.5 text-[11px] font-mono px-2.5 py-1 min-h-[36px] rounded-full transition-all cursor-pointer border ${
                isActuallyOffline
                  ? 'bg-[#fef3c7] dark:bg-[#451a03] text-[#92400e] dark:text-[#fde68a] border-[#f59e0b]'
                  : 'bg-[#ebfbee] dark:bg-[#1e2d24] text-[#166534] dark:text-[#45d320] border-[#33b712]/30 hover:border-[#33b712]'
              }`}
              title={
                lang === 'ru'
                  ? 'Статус PWA: Нажмите для симуляции офлайн-режима'
                  : 'PWA Cache: Click to toggle offline simulation'
              }
            >
              {isActuallyOffline ? (
                <>
                  <WifiOff className="w-3 h-3 text-[#d97706] animate-pulse" />
                  <span>{lang === 'ru' ? 'Офлайн (PWA кэш)' : 'Offline (PWA)'}</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3 text-[#33b712]" />
                  <span>{lang === 'ru' ? 'Офлайн-кэш готов' : 'Offline Ready'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Offline Alert Banner if offline or simulated */}
      {isActuallyOffline && (
        <div className="bg-[#b45309] text-white px-3 sm:px-6 py-2 text-xs font-sans flex items-center justify-between border-b border-[#92400e] animate-fade-in">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 min-w-0">
              <WifiOff className="w-4 h-4 text-white flex-shrink-0 animate-pulse" />
              <span className="truncate">
                {tr(
                  lang,
                  '📴 Автономный режим • Расписание, оценки и электронный студенческий билет закэшированы в PWA и доступны без интернета.',
                  '📴 Offline Mode • Timetable, grades, and digital student pass are cached in PWA and fully available offline.'
                )}
              </span>
            </div>
            <button
              onClick={() => setSimulateOffline(false)}
              className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer flex-shrink-0"
            >
              {simulateOffline
                ? tr(lang, 'Выключить тест', 'Exit Demo')
                : tr(lang, 'Проверить связь', 'Check Network')}
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TIER 2: INNOPOLIS-STYLE CLEAN PRIMARY NAVIGATION BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* University Brand Lockup */}
          <div
            className="flex items-center space-x-2.5 sm:space-x-3.5 cursor-pointer group min-w-0 flex-1"
            onClick={() => setActiveTab(isStaff ? 'staff_requests' : 'today')}
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#161821] dark:bg-[#11141c] border border-[#33b712]/40 flex items-center justify-center p-1 sm:p-1.5 shadow-xs group-hover:border-[#33b712] transition-all">
                <UniversityEmblem size={36} variant="full" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#33b712] ring-2 ring-white dark:ring-[#171c26]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-heading font-bold text-base sm:text-2xl tracking-tight text-[#161821] dark:text-[#ffffff] group-hover:text-[#166534] dark:text-[#45d320] transition-colors leading-none whitespace-nowrap">
                  DemoTech
                </span>
                <span className="inline-block text-[10px] font-heading font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-[#33b712]/30 text-[#166534] dark:text-[#45d320] bg-[#ebfbee] dark:bg-[#1e2d24] flex-shrink-0">
                  {isStaff
                    ? lang === 'ru'
                      ? 'Деканат'
                      : 'Faculty Staff'
                    : lang === 'ru'
                      ? 'Студент'
                      : 'Student'}
                </span>
              </div>
              <p className="hidden sm:block text-xs text-[#475569] dark:text-[#94a3b8] font-sans mt-1 truncate">
                {lang === 'ru'
                  ? 'Цифровой деканат будущего • Личный кабинет'
                  : "Digital Dean's Office • Student Portal"}
              </p>
            </div>
          </div>

          {/* Academic Actions & Identity Pill Bar */}
          <div className="flex items-center space-x-1 sm:space-x-2.5 flex-shrink-0">
            {/* AI Copilot / Dean's Advisory Assistant (Innopolis Primary Gradient Button) */}
            <button
              onClick={onOpenAssistant}
              className="flex items-center justify-center space-x-1.5 px-3 sm:px-4 py-2 min-w-[44px] min-h-[44px] rounded-full btn-innopolis-primary text-xs font-heading font-semibold transition-all cursor-pointer"
              title={lang === 'ru' ? 'Консультант деканата' : 'Academic Advisory Copilot'}
              aria-label={lang === 'ru' ? 'Консультант деканата' : 'Academic Advisory Copilot'}
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
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
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[#161821] dark:text-[#cbd5e1] bg-[#f6f6f9] dark:bg-[#1e2533] hover:bg-[#ebeef3] dark:hover:bg-[#273142] border border-[#e2e4e8] dark:border-[#273142] transition-colors relative cursor-pointer"
              >
                <IdCard className="w-5 h-5 text-[#166534] dark:text-[#45d320]" />
              </button>
            )}

            {/* Notifications & Decrees Bell */}
            <button
              onClick={() => setActiveTab('notifications')}
              title={lang === 'ru' ? 'Вестник и приказы деканата' : 'Announcements & Decrees'}
              aria-label={lang === 'ru' ? 'Уведомления и приказы' : 'Notifications'}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[#161821] dark:text-[#cbd5e1] bg-[#f6f6f9] dark:bg-[#1e2533] hover:bg-[#ebeef3] dark:hover:bg-[#273142] border border-[#e2e4e8] dark:border-[#273142] transition-colors relative cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#be123c] text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Subtle Divider */}
            <div className="h-6 w-px bg-[#e2e4e8] dark:bg-[#273142] mx-0.5 sm:mx-1 hidden sm:block" />

            {/* User Identity Capsule & Direct Sign Out */}
            <div className="flex items-center pl-0.5 sm:pl-1">
              <button
                onClick={() => setActiveTab('profile')}
                className="flex items-center space-x-2.5 p-1 pr-3 min-w-[44px] min-h-[44px] rounded-full bg-[#f6f6f9] dark:bg-[#1e2533] hover:bg-[#ebeef3] dark:hover:bg-[#273142] border border-[#e2e4e8] dark:border-[#273142] transition-all text-left cursor-pointer"
                title={`${user?.fullName} • ${isStaff ? (lang === 'ru' ? 'Деканат МО' : "Dean's Office") : profile?.group}`}
                aria-label={user?.fullName}
              >
                <img
                  src={resolveAvatarSrc(profile?.avatarUrl, user?.fullName)}
                  alt={user?.fullName}
                  className="w-8 h-8 rounded-full object-cover border-2 border-[#33b712] shadow-xs"
                />
                <div className="hidden lg:block text-left max-w-[130px]">
                  <p className="text-xs font-heading font-semibold text-[#161821] dark:text-[#ffffff] truncate leading-tight">
                    {user?.fullName?.split(' ')[0]} {user?.fullName?.split(' ')[1]?.[0]}.
                  </p>
                  <p className="text-[10px] text-[#166534] dark:text-[#45d320] font-sans leading-none truncate mt-0.5 font-semibold">
                    {isStaff ? (lang === 'ru' ? 'Инспектор' : 'Inspector') : profile?.group}
                  </p>
                </div>
              </button>

              <button
                onClick={logout}
                title={lang === 'ru' ? 'Выйти из личного кабинета' : 'Sign out'}
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center ml-1 text-[#475569] hover:text-[#be123c] dark:text-[#fecdd3] rounded-full hover:bg-[#f6f6f9] dark:hover:bg-[#1e2533] transition-colors cursor-pointer"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
