import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Building,
  KeyRound,
  Sun,
  Moon,
  Globe,
  GraduationCap,
  Compass,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { UNIVERSITY_INFO } from '../services/mockData';
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
    } catch (err: any) {
      setError(
        err.message ||
          (lang === 'ru'
            ? 'Ошибка авторизации. Проверьте адрес почты и пароль.'
            : 'Authentication failed. Please verify your credentials.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F3EB] dark:bg-[#111614] text-[#252923] dark:text-[#F3EFE5] flex flex-col justify-between transition-colors select-none">
      {/* ─────────────────────────────────────────────────────────────
          GLOBAL UTILITY HEADER (Oxford & ETH Style)
          ───────────────────────────────────────────────────────────── */}
      <div className="w-full bg-[#102923] text-[#F3EFE5]/85 border-b border-[#C4A46B]/30 py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <UniversityEmblem size={24} variant="full" />
            <span
              className="font-bold text-xs sm:text-sm tracking-wider uppercase text-[#F3EFE5]"
              style={{ fontFamily: "'Cinzel', 'Crimson Pro', Georgia, serif" }}
            >
              DemoTech University
            </span>
            <span className="hidden sm:inline text-[#C4A46B]/40">•</span>
            <span className="hidden sm:inline text-[11px] font-serif italic text-[#C4A46B]">
              Veritas • Scientia • Innovatio
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleLang}
              className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded text-[#F3EFE5] hover:text-[#C4A46B] hover:bg-[#183D35] border border-[#C4A46B]/40 transition-colors uppercase"
            >
              {lang.toUpperCase()}
            </button>
            <button
              onClick={toggleTheme}
              className="p-1 rounded text-[#F3EFE5]/80 hover:text-white hover:bg-[#183D35] transition-colors"
              title="Переключить тему"
              aria-label="Toggle theme"
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
          MAIN AUTHENTICATION PORTAL (Two-Pane Institutional Layout)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-4xl bg-white dark:bg-[#18221D] rounded-2xl border border-[#E3DDD1] dark:border-[#2D3E35] shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Architectural Collegiate Heritage & Vision (Oxford / ETH) */}
          <div className="lg:col-span-5 bg-[#183D35] text-[#F3EFE5] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Watermark crest */}
            <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
              <UniversityEmblem size={240} variant="gold" />
            </div>

            <div className="relative z-10 space-y-6">
              {/* Heraldic Shield */}
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-xl bg-[#102923] border border-[#C4A46B]/70 flex items-center justify-center p-1.5 shadow-md">
                  <UniversityEmblem size={44} variant="full" />
                </div>
                <div>
                  <h2
                    className="font-bold text-lg tracking-wider uppercase text-[#F3EFE5] leading-none"
                    style={{ fontFamily: "'Cinzel', 'Crimson Pro', Georgia, serif" }}
                  >
                    DemoTech
                  </h2>
                  <p className="text-[11px] text-[#C4A46B] font-sans uppercase tracking-widest mt-1">
                    University
                  </p>
                  <p className="text-[9px] text-[#F3EFE5]/70 font-mono">
                    Anno Domini MMXXVI
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-[#C4A46B]/30 pt-4">
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#FAF8F3] leading-snug">
                  {lang === 'ru'
                    ? 'Академическое превосходство и передовые технологии'
                    : 'Academic Prestige & Modern Scientific Education'}
                </h3>
                <p className="text-xs text-[#F3EFE5]/80 font-sans leading-relaxed">
                  {lang === 'ru'
                    ? 'Единая защищенная платформа доступа к расписанию занятий, электронной зачетной книжке и сервисам деканата с усиленной ЭЦП.'
                    : 'Unified secure single sign-on access to academic schedules, digital transcripts, and registrar certificate services.'}
                </p>
              </div>

              {/* 3 Academic Pillars */}
              <div className="space-y-3 pt-2 text-xs font-sans">
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#102923] border border-[#C4A46B]/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen className="w-2.5 h-2.5 text-[#C4A46B]" />
                  </div>
                  <span className="text-[#F3EFE5]/90">
                    {lang === 'ru' ? 'Европейская кредитная система ECTS' : 'European Credit Transfer System (ECTS)'}
                  </span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#102923] border border-[#C4A46B]/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldCheck className="w-2.5 h-2.5 text-[#C4A46B]" />
                  </div>
                  <span className="text-[#F3EFE5]/90">
                    {lang === 'ru' ? 'Квалифицированная ЭЦП деканата (ГОСТ)' : 'Certified digital signatures & seal'}
                  </span>
                </div>
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#102923] border border-[#C4A46B]/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Compass className="w-2.5 h-2.5 text-[#C4A46B]" />
                  </div>
                  <span className="text-[#F3EFE5]/90">
                    {lang === 'ru' ? 'Академический ИИ-консультант деканата' : 'Dean\'s Office AI Academic Advisor'}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-6 mt-6 border-t border-[#C4A46B]/30 text-[10px] text-[#C4A46B] font-mono">
              VERITAS • SCIENTIA • INNOVATIO
            </div>
          </div>

          {/* Right Column: Formal Single Sign-On Authentication Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="border-b border-[#E3DDD1] dark:border-[#26362F] pb-4">
                <div className="inline-flex items-center space-x-1.5 text-xs font-mono font-semibold text-[#183D35] dark:text-[#C4A46B] mb-1">
                  <KeyRound className="w-3.5 h-3.5 text-[#C4A46B]" />
                  <span>ЕДИНАЯ ТОЧКА АУТЕНТИФИКАЦИИ (SSO)</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#252923] dark:text-[#F3EFE5]">
                  {lang === 'ru' ? 'Вход в личный кабинет' : 'Institutional Single Sign-On'}
                </h1>
                <p className="text-xs text-[#7E877B] dark:text-[#8E9B93] mt-1 font-sans">
                  {lang === 'ru'
                    ? 'Используйте вашу университетскую учетную запись (@demo.edu)'
                    : 'Enter your institutional university credentials (@demo.edu)'}
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-lg bg-[#A33D35]/10 border border-[#A33D35]/30 text-[#A33D35] dark:text-[#E2766E] text-xs font-sans leading-relaxed">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm font-sans select-text">
                <div>
                  <label className="block font-medium text-[#252923] dark:text-[#F3EFE5] mb-1.5 text-xs">
                    {lang === 'ru' ? 'Университетская почта' : 'Institutional Email'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7E877B] dark:text-[#8E9B93]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="student@demo.edu"
                      className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg pl-9 pr-3 py-2.5 text-[#252923] dark:text-[#F3EFE5] placeholder-[#7E877B]/50 focus:ring-2 focus:ring-[#183D35] dark:focus:ring-[#C4A46B] focus:border-transparent focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <label className="font-medium text-[#252923] dark:text-[#F3EFE5]">
                      {lang === 'ru' ? 'Пароль учетной записи' : 'Account Password'}
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7E877B] dark:text-[#8E9B93]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg pl-9 pr-10 py-2.5 text-[#252923] dark:text-[#F3EFE5] placeholder-[#7E877B]/50 focus:ring-2 focus:ring-[#183D35] dark:focus:ring-[#C4A46B] focus:border-transparent focus:outline-none transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7E877B] hover:text-[#252923] dark:hover:text-[#F3EFE5] transition-colors cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#183D35] hover:bg-[#102923] active:bg-[#0c201b] text-[#F3EFE5] font-sans font-semibold text-xs sm:text-sm border border-[#C4A46B]/40 hover:border-[#C4A46B] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <span>
                    {loading
                      ? (lang === 'ru' ? 'Проверка учетных данных...' : 'Authenticating...')
                      : (lang === 'ru' ? 'Войти в личный кабинет' : 'Authenticate & Sign In')}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#C4A46B]" />
                </button>
              </form>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                JURY CREDENTIALS REFERENCE (Strictly Plain Text Reference, NO Switchers)
                ───────────────────────────────────────────────────────────── */}
            <div className="pt-4 border-t border-[#E3DDD1] dark:border-[#26362F] text-[11px] font-sans text-[#7E877B] dark:text-[#8E9B93] space-y-1.5 select-text">
              <div className="flex items-center space-x-1.5 font-medium text-[#252923] dark:text-[#F3EFE5]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#183D35] dark:text-[#C4A46B]" />
                <span>
                  {lang === 'ru'
                    ? 'Справочные данные для экспертной комиссии жюри:'
                    : 'Reference accounts for competition evaluation committee:'}
                </span>
              </div>
              <p className="leading-relaxed font-sans">
                {lang === 'ru' ? (
                  <>
                    <strong>Студенты:</strong> <code className="font-mono text-[#183D35] dark:text-[#C4A46B]">aigul.nurova@demo.edu</code>, <code className="font-mono text-[#183D35] dark:text-[#C4A46B]">timur.belov@demo.edu</code>, <code className="font-mono text-[#183D35] dark:text-[#C4A46B]">lina.okafor@demo.edu</code> (пароль: <code className="font-mono text-[#252923] dark:text-[#F3EFE5]">DemoStudent123!</code>).<br />
                    <strong>Деканат:</strong> <code className="font-mono text-[#183D35] dark:text-[#C4A46B]">dean.office@demo.edu</code> (пароль: <code className="font-mono text-[#252923] dark:text-[#F3EFE5]">DemoStaff123!</code>).
                  </>
                ) : (
                  <>
                    <strong>Students:</strong> <code className="font-mono text-[#183D35] dark:text-[#C4A46B]">aigul.nurova@demo.edu</code>, <code className="font-mono text-[#183D35] dark:text-[#C4A46B]">timur.belov@demo.edu</code>, <code className="font-mono text-[#183D35] dark:text-[#C4A46B]">lina.okafor@demo.edu</code> (password: <code className="font-mono text-[#252923] dark:text-[#F3EFE5]">DemoStudent123!</code>).<br />
                    <strong>Faculty Staff:</strong> <code className="font-mono text-[#183D35] dark:text-[#C4A46B]">dean.office@demo.edu</code> (password: <code className="font-mono text-[#252923] dark:text-[#F3EFE5]">DemoStaff123!</code>).
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Disclaimer Footer */}
      <div className="py-4 text-center text-[11px] text-[#7E877B] dark:text-[#8E9B93] px-4 font-sans border-t border-[#E3DDD1] dark:border-[#26362F]">
        {UNIVERSITY_INFO.disclaimer}
      </div>
    </div>
  );
};
