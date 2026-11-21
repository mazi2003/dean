import React, { useRef, useMemo } from 'react';
import { X, Printer, ShieldCheck, FileText } from 'lucide-react';
import { StudentDossier } from '../types';
import { UniversityEmblem } from './UniversityEmblem';
import { useAuth } from '../context/AuthContext';
import { tr, getAssessmentTypeLabel, getStudyFormLabel, localizeText } from '../utils/i18n';

interface OfficialTranscriptModalProps {
  dossier: StudentDossier | null;
  onClose: () => void;
}

function getTodayFormatted(lang: 'ru' | 'en'): string {
  return new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const OfficialTranscriptModal: React.FC<OfficialTranscriptModalProps> = ({
  dossier,
  onClose,
}) => {
  const { lang } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => getTodayFormatted(lang), [lang]);

  if (!dossier) return null;
  const { profile, gradesSummary } = dossier;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tr(lang, 'Выписка успеваемости', 'Academic Transcript')}
        className="bg-white dark:bg-[#112238] rounded-2xl max-w-3xl w-full border border-[#DCE2EA] dark:border-[#1E395B] shadow-2xl overflow-hidden my-auto"
      >
        {/* Modal Controls Header */}
        <div className="px-5 py-3.5 bg-[#F8FAFC] dark:bg-[#111714] border-b border-[#DCE2EA] dark:border-[#193150] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-sans text-[#142D4E] dark:text-[#93C5FD] font-semibold">
            <FileText className="w-4 h-4 text-[#245A91] dark:text-[#93C5FD]" />
            <span>
              {tr(
                lang,
                'Макет выписки из ведомости (иллюстрация)',
                'Academic Grade Sheet Preview (Illustrative)'
              )}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1 px-3 py-1.5 min-h-[44px] rounded-lg bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] text-xs font-medium cursor-pointer transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{tr(lang, 'Печать / PDF (макет)', 'Print / PDF (Preview)')}</span>
            </button>
            <button
              onClick={onClose}
              aria-label={tr(lang, 'Закрыть', 'Close')}
              className="p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#667085] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF] hover:bg-[#EDF2F7] dark:hover:bg-[#162A45] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-[11px] font-sans text-center font-medium">
          {tr(
            lang,
            'Иллюстрация прототипа: в прототипе нет настоящей ЭЦП, документ не имеет юридической силы.',
            'Illustrative prototype only: no real e-signature, not legally valid.'
          )}
        </div>

        {/* Printable Transcript Document Paper */}
        <div
          ref={printRef}
          className="p-6 sm:p-10 space-y-6 bg-[#FFFFFF] dark:bg-[#0E1B2D] text-[#0F1D30] dark:text-[#FFFFFF] print:p-0 print:bg-white print:text-black"
        >
          {/* Institutional Masthead */}
          <div className="border-b-2 border-[#142D4E] dark:border-[#93C5FD]/40 pb-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-lg bg-[#142D4E] text-[#93C5FD] flex items-center justify-center p-2 flex-shrink-0 shadow-md">
                <UniversityEmblem size={44} variant="full" />
              </div>
              <div>
                <div className="text-[9px] font-mono tracking-wider text-[#667085] dark:text-[#94A3B8] uppercase">
                  {lang === 'ru'
                    ? 'МИНОБРНАУКИ РОССИИ • ЛИЦЕНЗИЯ № 2841 • АККРЕДИТАЦИЯ № 3105'
                    : 'MINISTRY OF HIGHER EDUCATION • ACCREDITATION NO. 3105'}
                </div>
                <h2 className="font-bold text-base sm:text-lg tracking-tight text-[#142D4E] dark:text-[#93C5FD]">
                  {tr(lang, 'МНТУ «ДЕМОТЕХ УНИВЕРСИТЕТ»', 'DEMOTECH UNIVERSITY')}
                </h2>
                <p className="text-[11px] font-sans text-[#475467] dark:text-[#CBD5E1] uppercase tracking-wider">
                  {tr(
                    lang,
                    'Факультет международных отношений • Деканат',
                    "Faculty of International Relations • Dean's Office"
                  )}
                </p>
                <p className="text-[10px] text-[#667085] dark:text-[#94A3B8] font-mono">
                  {tr(
                    lang,
                    'г. Москва, Университетская наб., д. 1 • Тел.: +7 (495) 000-00-00',
                    '1 Universitetskaya Emb., Moscow • Tel: +7 (495) 000-00-00'
                  )}
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-[11px] text-[#667085] dark:text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#112238] p-2.5 rounded-lg border border-[#DCE2EA] dark:border-[#1E395B]">
              <div>
                {tr(lang, 'Исх. №', 'Ref. No.')}{' '}
                <span className="font-bold text-[#142D4E] dark:text-[#93C5FD]">
                  {tr(lang, 'ВЕД-2026', 'TRN-2026')}/{profile.studentNumber.slice(-4)}-СТ
                </span>
              </div>
              <div>
                {tr(lang, 'Дата выдачи:', 'Issue Date:')}{' '}
                <strong className="text-[#0F1D30] dark:text-[#FFFFFF]">{today} г.</strong>
              </div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center space-y-1">
            <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-[#142D4E] dark:text-[#FFFFFF]">
              {tr(
                lang,
                'Академическая справка — Выписка успеваемости',
                'Official Academic Transcript'
              )}
            </h1>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8] font-sans">
              {tr(
                lang,
                'Выдана для подтверждения освоения образовательной программы высшего образования',
                'Issued to certify completion and progress in a higher education degree program'
              )}
            </p>
          </div>

          {/* Student Info Grid */}
          <div className="bg-white dark:bg-[#162A45] p-4 rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
            <div>
              <span className="text-[#667085] dark:text-[#94A3B8] block text-[11px]">
                {tr(lang, 'ФИО обучающегося:', 'Student Full Name:')}
              </span>
              <span className="font-bold text-sm text-[#142D4E] dark:text-[#93C5FD]">
                {profile.fullName}
              </span>
            </div>
            <div>
              <span className="text-[#667085] dark:text-[#94A3B8] block text-[11px]">
                {tr(lang, 'Номер студенческого билета / Зачетки:', 'Student ID / Record Book No.:')}
              </span>
              <span className="font-mono font-semibold">
                {profile.studentNumber} / {profile.recordBookNumber}
              </span>
            </div>
            <div>
              <span className="text-[#667085] dark:text-[#94A3B8] block text-[11px]">
                {tr(lang, 'Направление подготовки:', 'Academic Program:')}
              </span>
              <span className="font-medium">{localizeText(profile.program, lang)}</span>
            </div>
            <div>
              <span className="text-[#667085] dark:text-[#94A3B8] block text-[11px]">
                {tr(lang, 'Группа / Курс:', 'Group / Year:')}
              </span>
              <span className="font-medium">
                {profile.group} • {tr(lang, `${profile.year} курс`, `Year ${profile.year}`)} (
                {getStudyFormLabel(profile.studyForm, lang)})
              </span>
            </div>
          </div>

          {/* Grades Table */}
          <div className="space-y-2">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-[#667085] dark:text-[#94A3B8]">
              {tr(
                lang,
                'Результаты промежуточной аттестации (Семестр 3):',
                'Midterm & Final Assessment Results (Semester 3):'
              )}
            </h3>
            <div
              tabIndex={0}
              role="region"
              aria-label={tr(lang, 'Таблица академической успеваемости', 'Academic Transcript Table')}
              className="overflow-x-auto rounded-lg border border-[#DCE2EA] dark:border-[#1E395B] focus:outline-hidden focus:ring-1 focus:ring-[#245A91]"
            >
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#F8FAFC] dark:bg-[#111714] text-[10px] uppercase font-semibold text-[#667085] dark:text-[#94A3B8] border-b border-[#DCE2EA] dark:border-[#1E395B]">
                  <tr>
                    <th className="py-2.5 px-3">№</th>
                    <th className="py-2.5 px-3">
                      {tr(lang, 'Наименование дисциплины', 'Course Title')}
                    </th>
                    <th className="py-2.5 px-2 text-center">{tr(lang, 'З.Е.', 'Cr.')}</th>
                    <th className="py-2.5 px-2 text-center">{tr(lang, 'Форма', 'Format')}</th>
                    <th className="py-2.5 px-2 text-center">{tr(lang, 'БРС', 'Score')}</th>
                    <th className="py-2.5 px-3 text-right">{tr(lang, 'Оценка', 'Grade')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE2EA] dark:divide-[#1E395B] bg-white dark:bg-[#112238]">
                  {gradesSummary.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#162A45]/50">
                      <td className="py-2 px-3 text-[#667085] dark:text-[#94A3B8] font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-[#0F1D30] dark:text-[#FFFFFF]">
                        {localizeText(item.subject, lang)}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-[#667085] dark:text-[#94A3B8]">
                        {item.credits}
                      </td>
                      <td className="py-2 px-2 text-center text-[11px] text-[#667085] dark:text-[#94A3B8]">
                        {getAssessmentTypeLabel(item.assessmentType, lang)}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-semibold">
                        {item.points ?? '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold">
                        {item.grade === 5 && (
                          <span className="text-emerald-700 dark:text-emerald-400">
                            {tr(lang, 'Отлично (5)', 'Excellent (5)')}
                          </span>
                        )}
                        {item.grade === 4 && (
                          <span className="text-blue-700 dark:text-blue-400">
                            {tr(lang, 'Хорошо (4)', 'Good (4)')}
                          </span>
                        )}
                        {item.grade === 3 && (
                          <span className="text-amber-800 dark:text-amber-400">
                            {tr(lang, 'Удовл. (3)', 'Satisfactory (3)')}
                          </span>
                        )}
                        {item.grade === 2 && (
                          <span className="text-rose-700 dark:text-rose-400">
                            {tr(lang, 'Неудовл. (2)', 'Unsatisfactory (2)')}
                          </span>
                        )}
                        {!item.grade &&
                          (item.creditStatus === 'earned' ? (
                            <span className="text-emerald-700 dark:text-emerald-400">
                              {tr(lang, 'Зачтено', 'Passed')}
                            </span>
                          ) : (
                            <span className="text-[#667085] dark:text-[#94A3B8]">
                              {tr(lang, 'В процессе', 'In progress')}
                            </span>
                          ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Metric Box */}
          <div className="flex flex-wrap items-center justify-between p-3.5 bg-[#F8FAFC] dark:bg-[#111714] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] text-xs font-sans">
            <div>
              <span className="text-[#667085] dark:text-[#94A3B8]">
                {tr(lang, 'Средний балл (GPA): ', 'Cumulative GPA: ')}
              </span>
              <span className="font-mono font-bold text-base text-[#142D4E] dark:text-[#93C5FD]">
                {profile.gpa.toFixed(2)}
              </span>
              <span className="text-[#667085] dark:text-[#94A3B8] ml-2">
                • {tr(lang, 'Средний рейтинг БРС: ', 'BRS Avg Score: ')}
              </span>
              <span className="font-mono font-bold text-[#142D4E] dark:text-[#93C5FD]">
                {profile.averageScore}%
              </span>
            </div>
            <div>
              <span className="text-[#667085] dark:text-[#94A3B8]">
                {tr(lang, 'Освоено кредитов: ', 'Credits Earned: ')}
              </span>
              <span className="font-mono font-bold">
                {tr(
                  lang,
                  `${gradesSummary.creditsEarned} из ${gradesSummary.creditsRequired} ECTS`,
                  `${gradesSummary.creditsEarned} of ${gradesSummary.creditsRequired} ECTS`
                )}
              </span>
            </div>
          </div>

          {/* Digital Signature & Dual-Seal Verification Block */}
          <div className="pt-5 border-t-2 border-[#142D4E]/20 dark:border-[#93C5FD]/30 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Left: Official Rectangular E-Signature Stamp (ГОСТ Р 7.0.97-2016) */}
            <div className="p-3.5 rounded-xl border-2 border-[#142D4E] dark:border-[#93C5FD] bg-[#F8FAFC] dark:bg-[#112238] shadow-sm">
              <div className="flex items-center space-x-2 border-b border-[#142D4E]/20 dark:border-[#93C5FD]/30 pb-2 mb-2">
                <div className="w-7 h-7 rounded-md bg-[#142D4E] text-[#93C5FD] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-[10px] font-bold text-[#142D4E] dark:text-[#93C5FD] uppercase tracking-wider leading-tight">
                  {tr(lang, 'ДОКУМЕНТ ПОДПИСАН ЭЛЕКТРОННОЙ ПОДПИСЬЮ', 'DOCUMENT DIGITALLY SIGNED')}
                </div>
              </div>
              <div className="space-y-0.5 text-[9px] font-mono text-[#475467] dark:text-[#CBD5E1]">
                <div>
                  <span className="font-semibold text-[#142D4E] dark:text-[#93C5FD]">
                    {tr(lang, 'Сертификат:', 'Certificate:')}
                  </span>{' '}
                  00E1-2026-DEMO-77AA-9402
                </div>
                <div className="truncate">
                  <span className="font-semibold text-[#142D4E] dark:text-[#93C5FD]">
                    {tr(lang, 'Владелец:', 'Signer:')}
                  </span>{' '}
                  {tr(lang, 'Волкова М.С., Зам. декана по УМР', 'M.S. Volkova, Vice Dean')}
                </div>
                <div>
                  <span className="font-semibold text-[#142D4E] dark:text-[#93C5FD]">
                    {tr(lang, 'Действителен:', 'Validity:')}
                  </span>{' '}
                  01.09.2025 – 31.08.2027
                </div>
                <div className="pt-1 text-[8px] text-[#667085] dark:text-[#94A3B8] italic font-sans">
                  {tr(
                    lang,
                    'Учебный концепт (вымышленные данные)',
                    'Fictional educational concept'
                  )}
                </div>
              </div>
            </div>

            {/* Right: Round Dean's Seal & Verification Anchor */}
            <div className="flex items-center justify-end space-x-3 text-right">
              <div className="text-[10px] text-[#475467] dark:text-[#CBD5E1] font-sans space-y-0.5">
                <p className="font-bold text-[#0F1D30] dark:text-[#FFFFFF] text-xs">
                  {tr(lang, 'Заместитель декана по УМР', 'Vice Dean for Academic Affairs')}
                </p>
                <p className="font-semibold text-[#142D4E] dark:text-[#93C5FD]">
                  {tr(lang, 'д.полит.н., проф. М.С. Волкова', 'Prof. Dr. M.S. Volkova')}
                </p>
                <p className="text-[9px] text-[#667085] dark:text-[#94A3B8]">
                  {tr(lang, 'М.П. (Гербовая печать деканата)', "Official Seal of Dean's Office")}
                </p>
                <p className="font-mono text-[9px] text-[#1D4ED8] dark:text-[#93C5FD] pt-1">
                  {tr(lang, 'Реестр:', 'Registry:')} demotech.edu/verify/77AA-9402
                </p>
              </div>
              <div className="w-16 h-16 rounded-full border-2 border-[#142D4E] dark:border-[#93C5FD] p-1 flex items-center justify-center flex-shrink-0 bg-white dark:bg-[#0E1F36] shadow-xs">
                <UniversityEmblem size={48} variant="seal" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
