import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Sun,
  Moon,
  Compass,
  BookOpen,
  Globe2,
} from 'lucide-react';
import { UNIVERSITY_INFO } from '../constants/university';
import { UniversityEmblem } from '../components/UniversityEmblem';

export const LoginPage: React.FC = () => {
  const { login, lang, toggleLang, theme, toggleTheme } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setError(
        message ||
          (lang === 'ru'
            ? 'Неверный адрес электронной почты или пароль'
            : 'Authentication failed. Please verify your credentials.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ebeef3] dark:bg-[#0f121a] text-[#161821] dark:text-[#ffffff] flex flex-col justify-between transition-colors select-none">
      {/* ─────────────────────────────────────────────────────────────
          GLOBAL UTILITY HEADER (Innopolis Minimalist Style)
          ───────────────────────────────────────────────────────────── */}
      <div className="w-full bg-white dark:bg-[#171c26] text-[#161821] dark:text-[#cbd5e1] border-b border-[#e2e4e8] dark:border-[#273142] py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <UniversityEmblem size={26} variant="full" />
            <span className="font-heading font-bold text-xs sm:text-sm tracking-tight text-[#161821] dark:text-[#ffffff]">
              DemoTech University
            </span>
            <span className="hidden sm:inline text-[#e2e4e8] dark:text-[#334155]">•</span>
            <span className="hidden sm:inline text-[11px] font-sans font-semibold text-[#166534] dark:text-[#45d320]">
              Veritas • Scientia • Innovatio
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleLang}
              className="px-3 py-1 min-w-[44px] min-h-[44px] text-[11px] font-heading font-semibold rounded-full text-[#161821] dark:text-[#ffffff] hover:bg-[#ebeef3] dark:hover:bg-[#1f293d] border border-[#e2e4e8] dark:border-[#273142] transition-colors uppercase tracking-wider flex items-center justify-center space-x-1 cursor-pointer"
              title={lang === 'ru' ? 'Switch to English' : 'Переключить на русский'}
              aria-label="Toggle language"
            >
              <Globe2 className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320]" />
              <span>{lang.toUpperCase()}</span>
            </button>
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
                <Moon className="w-4 h-4 text-[#161821]" />
              ) : (
                <Sun className="w-4 h-4 text-[#b45309] dark:text-[#fbbf24]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN AUTHENTICATION PORTAL (Two-Pane Innopolis Modern Layout)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-4xl bg-white dark:bg-[#171c26] rounded-3xl border border-[#e2e4e8] dark:border-[#273142] shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: High-Tech Brand Showcase */}
          <div className="lg:col-span-5 bg-[#161821] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Dynamic decorative green gradient glow */}
            <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#33b712]/20 blur-3xl pointer-events-none" />
            <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-15 pointer-events-none">
              <UniversityEmblem size={240} variant="gold" />
            </div>

            <div className="relative z-10 space-y-6">
              {/* Brand Emblem */}
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-2xl bg-[#11141c] border border-[#33b712]/60 flex items-center justify-center p-2 shadow-md">
                  <UniversityEmblem size={44} variant="full" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-lg tracking-tight uppercase text-white leading-none">
                    DemoTech
                  </h2>
                  <p className="text-[11px] text-[#45d320] font-heading font-semibold uppercase tracking-wider mt-1">
                    University
                  </p>
                  <p className="text-[10px] text-white/70 font-sans mt-0.5 font-medium">DemoTech Campus • 2026</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-white/10 pt-4">
                <h3 className="font-heading font-semibold text-base sm:text-lg text-white leading-snug">
                  {lang === 'ru'
                    ? 'Цифровой деканат будущего • Личный кабинет'
                    : 'Digital Dean of the Future • Student Hub'}
                </h3>
                <p className="text-xs text-white/75 font-sans leading-relaxed">
                  {lang === 'ru'
                    ? 'Единая защищенная платформа доступа к расписанию занятий, электронной зачетке и сервисам деканата.'
                    : 'Unified secure single sign-on access to academic schedules, digital transcripts, and registrar certificate services.'}
                </p>
              </div>

              {/* 3 Pillars */}
              <div className="space-y-3 pt-2 text-xs font-sans">
                <div className="flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#33b712]/20 border border-[#33b712]/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen className="w-3 h-3 text-[#45d320]" />
                  </div>
                  <span className="text-white/90">
                    {lang === 'ru'
                      ? 'Европейская кредитная система ECTS и БРС'
                      : 'European Credit Transfer System (ECTS)'}
                  </span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#33b712]/20 border border-[#33b712]/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck className="w-3 h-3 text-[#45d320]" />
                  </div>
                  <span className="text-white/90">
                    {lang === 'ru'
                      ? 'Электронные справки и заявления онлайн'
                      : 'Digital certificates and petitions online'}
                  </span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#33b712]/20 border border-[#33b712]/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Compass className="w-3 h-3 text-[#45d320]" />
                  </div>
                  <span className="text-white/90">
                    {lang === 'ru'
                      ? 'Академический ИИ-консультант деканата'
                      : "Dean's Office AI Academic Advisor"}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-5 mt-6 border-t border-white/10 text-[10px] text-[#45d320] font-sans tracking-widest font-semibold uppercase">
              VERITAS • SCIENTIA • INNOVATIO
            </div>
          </div>

          {/* Right Column: Authentication Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="border-b border-[#e2e4e8] dark:border-[#273142] pb-4">
                <div className="inline-flex items-center space-x-1.5 text-xs font-sans font-semibold tracking-wide text-[#166534] dark:text-[#45d320] mb-1">
                  <KeyRound className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320]" />
                  <span>
                    {lang === 'ru' ? 'ЕДИНАЯ ТОЧКА АУТЕНТИФИКАЦИИ (SSO)' : 'SINGLE SIGN-ON (SSO)'}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-heading font-bold text-[#161821] dark:text-[#ffffff]">
                  {lang === 'ru' ? 'Вход в личный кабинет' : 'Institutional Single Sign-On'}
                </h1>
                <p className="text-xs text-[#475569] dark:text-[#94a3b8] mt-1 font-sans">
                  {lang === 'ru'
                    ? 'Используйте вашу университетскую учетную запись (@demo.edu)'
                    : 'Enter your institutional university credentials (@demo.edu)'}
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-[#ff4d8b]/10 border border-[#ff4d8b]/30 text-[#be123c] dark:text-[#fecdd3] text-xs font-sans leading-relaxed">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-4 text-xs sm:text-sm font-sans select-text"
              >
                <div>
                  <label className="block font-medium text-[#161821] dark:text-[#ffffff] mb-1.5 text-xs font-heading">
                    {lang === 'ru' ? 'Университетская почта' : 'Institutional Email'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#475569] dark:text-[#94a3b8]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@demo.edu"
                      className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-full pl-10 pr-4 py-2.5 text-[#161821] dark:text-[#ffffff] placeholder-[#8a8b90]/60 focus:ring-2 focus:ring-[#33b712] focus:border-transparent focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <label className="font-medium text-[#161821] dark:text-[#ffffff] font-heading">
                      {lang === 'ru' ? 'Пароль учетной записи' : 'Account Password'}
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#475569] dark:text-[#94a3b8]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-full pl-10 pr-11 py-2.5 text-[#161821] dark:text-[#ffffff] placeholder-[#8a8b90]/60 focus:ring-2 focus:ring-[#33b712] focus:border-transparent focus:outline-none transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute inset-y-0 right-0 pr-3.5 pl-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#475569] dark:text-[#94a3b8] hover:text-[#161821] dark:hover:text-white transition-colors cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[44px] py-3 px-6 rounded-full btn-innopolis-primary text-xs sm:text-sm flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>
                    {loading
                      ? lang === 'ru'
                        ? 'Проверка учетных данных...'
                        : 'Authenticating...'
                      : lang === 'ru'
                        ? 'Войти в личный кабинет'
                        : 'Authenticate & Sign In'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                JURY CREDENTIALS REFERENCE (Strictly Plain Text Reference, NO Switchers)
                ───────────────────────────────────────────────────────────── */}
            <div className="pt-4 border-t border-[#e2e4e8] dark:border-[#273142] text-[11px] font-sans text-[#475569] dark:text-[#94a3b8] space-y-1.5 select-text">
              <div className="flex items-center space-x-1.5 font-medium text-[#161821] dark:text-[#ffffff]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320]" />
                <span>
                  {lang === 'ru'
                    ? 'Справочные данные для экспертной комиссии жюри:'
                    : 'Reference accounts for competition evaluation committee:'}
                </span>
              </div>
              <p className="leading-relaxed font-sans">
                {lang === 'ru' ? (
                  <>
                    <strong>Студенты:</strong>{' '}
                    <code className="font-mono text-[#166534] dark:text-[#45d320] font-semibold">
                      aigul.nurova@demo.edu
                    </code>
                    ,{' '}
                    <code className="font-mono text-[#166534] dark:text-[#45d320] font-semibold">
                      timur.belov@demo.edu
                    </code>
                    ,{' '}
                    <code className="font-mono text-[#166534] dark:text-[#45d320] font-semibold">
                      lina.okafor@demo.edu
                    </code>
                    {' '}(пароль: <code className="font-mono text-[#161821] dark:text-white font-bold">DemoStudent123!</code>)
                  </>
                ) : (
                  <>
                    <strong>Students:</strong>{' '}
                    <code className="font-mono text-[#166534] dark:text-[#45d320]">aigul.nurova@demo.edu</code>,{' '}
                    <code className="font-mono text-[#166534] dark:text-[#45d320]">timur.belov@demo.edu</code>,{' '}
                    <code className="font-mono text-[#166534] dark:text-[#45d320]">lina.okafor@demo.edu</code>
                    {' '}(pass: <code className="font-mono text-[#161821] dark:text-white">DemoStudent123!</code>)
                  </>
                )}
              </p>
              <p className="leading-relaxed font-sans">
                {lang === 'ru' ? (
                  <>
                    <strong>Сотрудник деканата:</strong>{' '}
                    <code className="font-mono text-[#166534] dark:text-[#45d320] font-semibold">
                      dean.office@demo.edu
                    </code>
                    {' '}(пароль: <code className="font-mono text-[#161821] dark:text-white font-bold">DemoStaff123!</code>)
                  </>
                ) : (
                  <>
                    <strong>Dean staff:</strong>{' '}
                    <code className="font-mono text-[#166534] dark:text-[#45d320]">dean.office@demo.edu</code>
                    {' '}(pass: <code className="font-mono text-[#161821] dark:text-white">DemoStaff123!</code>)
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MANDATORY LEGAL DISCLAIMER
          ───────────────────────────────────────────────────────────── */}
      <footer className="w-full bg-white dark:bg-[#171c26] border-t border-[#e2e4e8] dark:border-[#273142] py-3 px-4 text-center text-xs text-[#475569] dark:text-[#94a3b8] font-sans">
        <p>{lang === 'ru' ? UNIVERSITY_INFO.disclaimer : UNIVERSITY_INFO.disclaimerEn}</p>
      </footer>
    </div>
  );
};
