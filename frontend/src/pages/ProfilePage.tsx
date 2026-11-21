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
          1. ACADEMIC DOSSIER HEADER
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative watermark */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-5 dark:opacity-10 pointer-events-none">
          <UniversityEmblem size={180} variant="full" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
          <div className="relative">
            <img
              src={resolveAvatarSrc(profile?.avatarUrl, user?.fullName)}
              alt={user?.fullName}
              className="w-24 h-24 rounded-xl object-cover border-2 border-[#245A91]/70 shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#142D4E] border border-[#245A91] flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-[#93C5FD]" />
            </span>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-sans font-semibold bg-[#142D4E]/15 text-[#142D4E] dark:text-[#93C5FD] border border-[#142D4E]/30">
                {isStaff
                  ? tr(lang, '🏛️ Сотрудник деканата', "🏛️ Dean's Office Staff")
                  : tr(lang, `Группа ${profile?.group}`, `Group ${profile?.group}`)}
              </span>
              {isStaff ? (
                <span className="px-2.5 py-0.5 rounded text-xs font-sans font-semibold bg-[#245A91]/20 text-[#142D4E] dark:text-[#93C5FD] border border-[#245A91]/40">
                  {tr(
                    lang,
                    'Статус: Аккредитованный администратор',
                    'Status: Accredited Administrator'
                  )}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded text-xs font-sans font-semibold bg-[#245A91]/20 text-[#142D4E] dark:text-[#93C5FD] border border-[#245A91]/40">
                  {tr(lang, `${profile?.year} курс`, `Year ${profile?.year}`)} •{' '}
                  {getStudyFormLabel(profile?.studyForm, lang)}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F1D30] dark:text-[#FFFFFF]">
              {user?.fullName}
            </h1>

            <p className="text-xs sm:text-sm text-[#475467] dark:text-[#CBD5E1] font-sans">
              {localizeText(profile?.program, lang)} • {localizeText(profile?.faculty, lang)}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs font-mono text-[#667085] dark:text-[#94A3B8]">
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
            className="px-4 py-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] hover:bg-[#C63740]/10 hover:text-[#C63740] border border-[#DCE2EA] dark:border-[#1E395B] text-xs font-sans font-medium transition-colors flex items-center space-x-1.5 self-center sm:self-start cursor-pointer"
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
        <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] shadow-xs space-y-4">
          <h3 className="font-semibold text-sm text-[#0F1D30] dark:text-[#FFFFFF] pb-2 border-b border-[#DCE2EA] dark:border-[#193150] flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-[#142D4E] dark:text-[#93C5FD]" />
            <span>
              {isStaff
                ? tr(lang, 'Служебные реквизиты сотрудника', 'Staff Credentials')
                : tr(lang, 'Учебные реквизиты студента', 'Student Enrollment Record')}
            </span>
          </h3>

          <div className="space-y-2.5 text-xs font-sans">
            <div className="flex justify-between py-1 border-b border-[#DCE2EA]/50 dark:border-[#193150]">
              <span className="text-[#667085] dark:text-[#94A3B8]">
                {tr(lang, 'Учебное заведение:', 'Institution:')}
              </span>
              <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF]">
                {lang === 'ru' ? UNIVERSITY_INFO.name : UNIVERSITY_INFO.nameEn}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#DCE2EA]/50 dark:border-[#193150]">
              <span className="text-[#667085] dark:text-[#94A3B8]">{tr(lang, 'Факультет:', 'Faculty:')}</span>
              <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF]">
                {localizeText(profile?.faculty, lang)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#DCE2EA]/50 dark:border-[#193150]">
              <span className="text-[#667085] dark:text-[#94A3B8]">{tr(lang, 'Направление:', 'Program:')}</span>
              <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF]">
                {localizeText(profile?.program, lang)}
              </span>
            </div>
            {!isStaff ? (
              <>
                <div className="flex justify-between py-1 border-b border-[#DCE2EA]/50 dark:border-[#193150]">
                  <span className="text-[#667085] dark:text-[#94A3B8]">
                    {tr(lang, 'Академическая группа:', 'Academic Group:')}
                  </span>
                  <span className="font-mono font-bold text-[#142D4E] dark:text-[#93C5FD]">
                    {profile?.group}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCE2EA]/50 dark:border-[#193150]">
                  <span className="text-[#667085] dark:text-[#94A3B8]">
                    {tr(lang, 'Форма обучения:', 'Study Mode:')}
                  </span>
                  <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF]">
                    {profile?.studyForm
                      ? getStudyFormLabel(profile.studyForm, lang)
                      : tr(lang, 'Очная', 'Full-time')}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#667085] dark:text-[#94A3B8]">
                    {tr(lang, 'Номер студенческого билета:', 'Student ID Number:')}
                  </span>
                  <span className="font-mono font-bold text-[#142D4E] dark:text-[#93C5FD]">
                    {profile?.studentNumber}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between py-1 border-b border-[#DCE2EA]/50 dark:border-[#193150]">
                  <span className="text-[#667085] dark:text-[#94A3B8]">
                    {tr(lang, 'Табельный номер:', 'Staff ID:')}
                  </span>
                  <span className="font-mono font-bold text-[#142D4E] dark:text-[#93C5FD]">
                    ТАБ-0441
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCE2EA]/50 dark:border-[#193150]">
                  <span className="text-[#667085] dark:text-[#94A3B8]">{tr(lang, 'Должность:', 'Position:')}</span>
                  <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF]">
                    {tr(lang, 'Зам. декана по УМР', 'Vice Dean for Academic Affairs')}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#667085] dark:text-[#94A3B8]">
                    {tr(lang, 'Кабинет и часы приема:', 'Office & Hours:')}
                  </span>
                  <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF]">
                    {tr(lang, 'Каб. 312 • Пн-Пт 9-18', 'Rm 312 • Mon–Fri 9–18')}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Digital Identity & Security Certificate (GOST R 34.10) */}
        <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] shadow-xs space-y-4">
          <h3 className="font-semibold text-sm text-[#0F1D30] dark:text-[#FFFFFF] pb-2 border-b border-[#DCE2EA] dark:border-[#193150] flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#142D4E] dark:text-[#93C5FD]" />
            <span>
              {tr(lang, 'Цифровой сертификат и безопасность', 'Digital Certificate & Security')}
            </span>
          </h3>

          <div className="space-y-3 text-xs font-sans">
            <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#667085] dark:text-[#94A3B8] block">
                {tr(
                  lang,
                  'Статус электронного документооборота',
                  'Digital Document Flow (Illustrative)'
                )}
              </span>
              <span className="font-mono font-semibold text-[#142D4E] dark:text-[#93C5FD]">
                {tr(
                  lang,
                  'Демонстрационный макет (без реальной ЭЦП)',
                  'Prototype Mockup (No Real E-Signature)'
                )}
              </span>
              <p className="text-[11px] text-[#475467] dark:text-[#CBD5E1]">
                {tr(
                  lang,
                  'Иллюстративное представление будущей интеграции с ЭЦП деканата; документы в прототипе не имеют юридической силы.',
                  "Illustrative preview of future Dean's Office digital signing; prototype documents are not legally binding."
                )}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#667085] dark:text-[#94A3B8] block">
                {tr(
                  lang,
                  'Аутентификация и шифрование паролей',
                  'Authentication & Password Hashing'
                )}
              </span>
              <span className="font-semibold text-[#0F1D30] dark:text-[#FFFFFF]">
                {tr(lang, 'Argon2id + httpOnly JWT Cookie', 'Argon2id + httpOnly JWT Cookie')}
              </span>
              <p className="text-[11px] text-[#667085] dark:text-[#94A3B8] font-mono">
                {tr(lang, 'Ролевой контроль (RBAC):', 'RBAC Scope:')}{' '}
                {(user?.role ?? 'student').toUpperCase()}
              </p>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-[#142D4E] dark:text-[#93C5FD]">
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
      <div className="p-5 rounded-xl bg-[#F8FAFC] dark:bg-[#162A45] border border-[#DCE2EA] dark:border-[#1E395B] text-xs font-sans text-[#667085] dark:text-[#94A3B8] space-y-2">
        <h4 className="font-semibold text-sm text-[#0F1D30] dark:text-[#FFFFFF]">
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
