import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, LogOut, ShieldCheck, GraduationCap } from 'lucide-react';
import { UNIVERSITY_INFO } from '../constants/university';
import { UniversityEmblem } from '../components/UniversityEmblem';
import { tr, getStudyFormLabel, localizeText } from '../utils/i18n';
import { resolveAvatarSrc } from '../utils/avatar';

export const ProfilePage: React.FC = () => {
  const { user, profile, logout, lang } = useAuth();
  const isStaff = user?.role === 'staff';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. ACADEMIC DOSSIER HEADER (Innopolis Design System)
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-white dark:bg-[#171c26] border border-[#e2e4e8] dark:border-[#273142] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-5 pointer-events-none">
          <UniversityEmblem size={180} variant="full" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
          <div className="relative">
            <img
              src={resolveAvatarSrc(profile?.avatarUrl, user?.fullName)}
              alt={user?.fullName}
              className="w-24 h-24 rounded-full object-cover border-2 border-[#33b712] shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#161821] border border-[#33b712] flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320]" />
            </span>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-heading font-semibold bg-[#ebfbee] dark:bg-[#1e2d24] text-[#166534] dark:text-[#45d320] border border-[#33b712]/30">
                {isStaff
                  ? tr(lang, '🏛️ Сотрудник деканата', "🏛️ Dean's Office Staff")
                  : tr(lang, `Группа ${profile?.group}`, `Group ${profile?.group}`)}
              </span>
              {isStaff ? (
                <span className="px-3 py-1 rounded-full text-xs font-heading font-semibold bg-[#e8f4fd] dark:bg-[#1a2838] text-[#0369a1] dark:text-[#38bdf8] border border-[#3598fe]/30">
                  {tr(
                    lang,
                    'Статус: Аккредитованный администратор',
                    'Status: Accredited Administrator'
                  )}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-heading font-semibold bg-[#f6f6f9] dark:bg-[#121620] text-[#161821] dark:text-[#ffffff] border border-[#e2e4e8] dark:border-[#273142]">
                  {tr(lang, `${profile?.year} курс`, `Year ${profile?.year}`)} •{' '}
                  {getStudyFormLabel(profile?.studyForm, lang)}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-[#161821] dark:text-[#ffffff]">
              {user?.fullName}
            </h1>

            <p className="text-xs sm:text-sm text-[#4b5563] dark:text-[#cbd5e1] font-sans">
              {localizeText(profile?.program, lang)} • {localizeText(profile?.faculty, lang)}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs font-mono text-[#475569] dark:text-[#94a3b8]">
              <span>ID: {user?.id}</span>
              <span>•</span>
              <span>Email: {user?.email}</span>
              {!isStaff && (
                <>
                  <span>•</span>
                  <span>
                    {tr(lang, 'Студбилет:', 'Student ID:')} {profile?.studentNumber}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-full bg-[#f6f6f9] dark:bg-[#121620] hover:bg-[#fff2f5] hover:text-[#be123c] dark:text-[#fecdd3] border border-[#e2e4e8] dark:border-[#273142] text-xs font-heading font-semibold transition-colors flex items-center space-x-1.5 self-center sm:self-start cursor-pointer shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{tr(lang, 'Выйти из кабинета', 'Sign Out')}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. DOSSIER DETAILS GRID
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Enrollment Info */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#171c26] border border-[#e2e4e8] dark:border-[#273142] shadow-xs space-y-4">
          <h3 className="font-heading font-semibold text-sm text-[#161821] dark:text-[#ffffff] pb-2 border-b border-[#e2e4e8] dark:border-[#273142] flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
            <span>
              {isStaff
                ? tr(lang, 'Служебные реквизиты сотрудника', 'Staff Credentials')
                : tr(lang, 'Учебные реквизиты студента', 'Student Enrollment Record')}
            </span>
          </h3>

          <div className="space-y-2.5 text-xs font-sans">
            <div className="flex justify-between py-1 border-b border-[#e2e4e8]/60 dark:border-[#273142]">
              <span className="text-[#475569] dark:text-[#94a3b8]">
                {tr(lang, 'Учебное заведение:', 'Institution:')}
              </span>
              <span className="font-heading font-semibold text-[#161821] dark:text-[#ffffff]">
                {lang === 'ru' ? UNIVERSITY_INFO.name : UNIVERSITY_INFO.nameEn}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#e2e4e8]/60 dark:border-[#273142]">
              <span className="text-[#475569] dark:text-[#94a3b8]">{tr(lang, 'Факультет:', 'Faculty:')}</span>
              <span className="font-heading font-semibold text-[#161821] dark:text-[#ffffff]">
                {localizeText(profile?.faculty, lang)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#e2e4e8]/60 dark:border-[#273142]">
              <span className="text-[#475569] dark:text-[#94a3b8]">{tr(lang, 'Направление:', 'Program:')}</span>
              <span className="font-heading font-semibold text-[#161821] dark:text-[#ffffff]">
                {localizeText(profile?.program, lang)}
              </span>
            </div>
            {!isStaff ? (
              <>
                <div className="flex justify-between py-1 border-b border-[#e2e4e8]/60 dark:border-[#273142]">
                  <span className="text-[#475569] dark:text-[#94a3b8]">
                    {tr(lang, 'Академическая группа:', 'Academic Group:')}
                  </span>
                  <span className="font-mono font-bold text-[#166534] dark:text-[#45d320]">
                    {profile?.group}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#e2e4e8]/60 dark:border-[#273142]">
                  <span className="text-[#475569] dark:text-[#94a3b8]">
                    {tr(lang, 'Форма обучения:', 'Study Mode:')}
                  </span>
                  <span className="font-heading font-semibold text-[#161821] dark:text-[#ffffff]">
                    {profile?.studyForm
                      ? getStudyFormLabel(profile.studyForm, lang)
                      : tr(lang, 'Очная', 'Full-time')}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#475569] dark:text-[#94a3b8]">
                    {tr(lang, 'Номер студенческого билета:', 'Student ID Number:')}
                  </span>
                  <span className="font-mono font-bold text-[#166534] dark:text-[#45d320]">
                    {profile?.studentNumber}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between py-1 border-b border-[#e2e4e8]/60 dark:border-[#273142]">
                  <span className="text-[#475569] dark:text-[#94a3b8]">
                    {tr(lang, 'Табельный номер:', 'Staff ID:')}
                  </span>
                  <span className="font-mono font-bold text-[#166534] dark:text-[#45d320]">
                    ТАБ-0441
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#e2e4e8]/60 dark:border-[#273142]">
                  <span className="text-[#475569] dark:text-[#94a3b8]">{tr(lang, 'Должность:', 'Position:')}</span>
                  <span className="font-heading font-semibold text-[#161821] dark:text-[#ffffff]">
                    {tr(lang, 'Зам. декана по УМР', 'Vice Dean for Academic Affairs')}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#475569] dark:text-[#94a3b8]">
                    {tr(lang, 'Кабинет и часы приема:', 'Office & Hours:')}
                  </span>
                  <span className="font-heading font-semibold text-[#161821] dark:text-[#ffffff]">
                    {tr(lang, 'Каб. 312 • Пн-Пт 9-18', 'Rm 312 • Mon–Fri 9–18')}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Digital Identity & Security Certificate */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#171c26] border border-[#e2e4e8] dark:border-[#273142] shadow-xs space-y-4">
          <h3 className="font-heading font-semibold text-sm text-[#161821] dark:text-[#ffffff] pb-2 border-b border-[#e2e4e8] dark:border-[#273142] flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
            <span>
              {tr(lang, 'Цифровой сертификат и безопасность', 'Digital Certificate & Security')}
            </span>
          </h3>

          <div className="space-y-3 text-xs font-sans">
            <div className="p-3.5 rounded-2xl bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#475569] dark:text-[#94a3b8] block">
                {tr(
                  lang,
                  'Статус электронного документооборота',
                  'Digital Document Flow (Illustrative)'
                )}
              </span>
              <span className="font-mono font-semibold text-[#166534] dark:text-[#45d320]">
                {tr(
                  lang,
                  'Демонстрационный макет (без реальной ЭЦП)',
                  'Prototype Mockup (No Real E-Signature)'
                )}
              </span>
              <p className="text-[11px] text-[#4b5563] dark:text-[#cbd5e1] leading-relaxed">
                {tr(
                  lang,
                  'Иллюстративное представление будущей интеграции с ЭЦП деканата; документы в прототипе не имеют юридической силы.',
                  "Illustrative preview of future Dean's Office digital signing; prototype documents are not legally binding."
                )}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#475569] dark:text-[#94a3b8] block">
                {tr(
                  lang,
                  'Аутентификация и шифрование паролей',
                  'Authentication & Password Hashing'
                )}
              </span>
              <span className="font-heading font-semibold text-[#161821] dark:text-[#ffffff]">
                {tr(lang, 'Argon2id + httpOnly JWT Cookie', 'Argon2id + httpOnly JWT Cookie')}
              </span>
              <p className="text-[11px] text-[#475569] dark:text-[#94a3b8] font-mono">
                {tr(lang, 'Ролевой контроль (RBAC):', 'RBAC Scope:')}{' '}
                {(user?.role ?? 'student').toUpperCase()}
              </p>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-[#166534] dark:text-[#45d320] font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>
                {tr(
                  lang,
                  'Сессионная изоляция персональных данных активна',
                  'Session-level personal data isolation active'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. REGULATORY COMPLIANCE MEMORANDUM
          ───────────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] text-xs font-sans text-[#475569] dark:text-[#cbd5e1] space-y-2">
        <h4 className="font-heading font-semibold text-sm text-[#161821] dark:text-[#ffffff]">
          {tr(
            lang,
            'Регламент обработки персональных данных и статус концепта',
            'Data Privacy Policy & Concept Notice'
          )}
        </h4>
        <p className="leading-relaxed">
          {tr(
            lang,
            'Настоящий веб-сервис «Цифровой деканат DemoTech University» является конкурсным концептом студенческого портала. Все представленные персональные данные, номера приказов, зачетные книжки и оценки являются учебными и вымышленными. Система не хранит конфиденциальные данные реальных физических лиц.',
            'This "DemoTech University Digital Dean\'s Office" web application is a competition concept prototype. All displayed personal data, decree numbers, academic records, and grades are fictional. No real personal data is stored.'
          )}
        </p>
      </div>
    </div>
  );
};
