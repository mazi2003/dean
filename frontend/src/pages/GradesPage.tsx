import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertOctagon, FileCheck2 } from 'lucide-react';
import { GradesSummary } from '../types';
import { api } from '../services/api';
import { tr, getAssessmentTypeLabel, getGradeDescription, localizeText } from '../utils/i18n';

export const GradesPage: React.FC = () => {
  const { user, profile, lang } = useAuth();
  const [grades, setGrades] = useState<GradesSummary | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number>(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await api.getGrades(selectedSemester);
        if (!cancelled) setGrades(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user, selectedSemester]);

  if (loading || !grades) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-36 bg-[#DCE2EA]/40 dark:bg-[#162A45] rounded-xl" />
        <div className="h-96 bg-[#DCE2EA]/40 dark:bg-[#162A45] rounded-xl" />
      </div>
    );
  }

  // Check if there is any debt/failed subject
  const failedSubject = grades.items.find((g) => g.creditStatus === 'failed');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. TRANSCRIPT HEADER & INSTITUTIONAL CHARTER
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#DCE2EA] dark:border-[#193150]">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#142D4E] dark:text-[#93C5FD] font-semibold mb-1">
            <span>{localizeText(profile?.faculty, lang)}</span>
            <span>•</span>
            <span>№ {profile?.studentNumber}</span>
            <span>•</span>
            <span>{tr(lang, 'ECTS Европейская система', 'ECTS Credit System')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F1D30] dark:text-[#FFFFFF]">
            {lang === 'ru' ? 'Электронная зачетная книжка' : 'Academic Transcript & Records'}
          </h1>
          <p className="text-xs text-[#475467] dark:text-[#CBD5E1] font-sans mt-0.5">
            {tr(lang, 'Студент:', 'Student:')} <strong>{user?.fullName}</strong> •{' '}
            {tr(lang, 'Академическая группа', 'Academic Group')} <strong>{profile?.group}</strong>
          </p>
        </div>

        {/* Semester Selector */}
        <div className="flex items-center space-x-1.5 bg-[#F8FAFC] dark:bg-[#0E1B2D] p-1 rounded-lg border border-[#DCE2EA] dark:border-[#1E395B] text-xs font-sans font-medium">
          <button
            onClick={() => setSelectedSemester(3)}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              selectedSemester === 3
                ? 'bg-[#142D4E] text-[#FFFFFF] font-semibold shadow-xs'
                : 'text-[#475467] dark:text-[#CBD5E1] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF]'
            }`}
          >
            {tr(lang, '3 семестр (текущий)', 'Semester 3 (Current)')}
          </button>
          <button
            onClick={() => setSelectedSemester(2)}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              selectedSemester === 2
                ? 'bg-[#142D4E] text-[#FFFFFF] font-semibold shadow-xs'
                : 'text-[#475467] dark:text-[#CBD5E1] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF]'
            }`}
          >
            {tr(lang, '2 семестр', 'Semester 2')}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. ACADEMIC SUMMARY METRICS (Oxford Transcript Style)
          ───────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cumulative GPA */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] shadow-xs space-y-1">
          <span className="text-[11px] font-sans uppercase tracking-wider text-[#667085] dark:text-[#94A3B8]">
            {lang === 'ru' ? 'Средний балл (GPA)' : 'Cumulative GPA'}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-3xl font-bold text-[#142D4E] dark:text-[#93C5FD]">
              {(grades.items.length > 0 ? grades.gpa : 0).toFixed(2)}
            </span>
            <span className="font-mono text-xs text-[#667085] dark:text-[#94A3B8]">/ 5.00</span>
          </div>
          <p className="text-[11px] font-sans text-[#475467] dark:text-[#CBD5E1]">
            {grades.gpa >= 4.5
              ? tr(lang, 'Отличная академическая успеваемость', 'Honors academic standing')
              : tr(lang, 'Академический прогресс в норме', 'Good academic standing')}
          </p>
        </div>

        {/* 100-Point Score (БРС) */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] shadow-xs space-y-1">
          <span className="text-[11px] font-sans uppercase tracking-wider text-[#667085] dark:text-[#94A3B8]">
            {lang === 'ru' ? 'БРС Рейтинг (100-балльная шкала)' : 'Rating Score (0-100)'}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-3xl font-bold text-[#0F1D30] dark:text-[#FFFFFF]">
              {(grades.items.length > 0 ? grades.averagePoints : 0).toFixed(1)}
            </span>
            <span className="font-mono text-xs text-[#667085] dark:text-[#94A3B8]">/ 100</span>
          </div>
          <p className="text-[11px] font-sans text-[#475467] dark:text-[#CBD5E1]">
            {tr(
              lang,
              'Балльно-рейтинговая система университета',
              'University continuous rating system'
            )}
          </p>
        </div>

        {/* Total ECTS Credits */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] shadow-xs space-y-1">
          <span className="text-[11px] font-sans uppercase tracking-wider text-[#667085] dark:text-[#94A3B8]">
            {lang === 'ru' ? 'Освоено кредитов (ECTS)' : 'Completed Credits (ECTS)'}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-3xl font-bold text-[#142D4E] dark:text-[#93C5FD]">
              {grades.items.length > 0 ? grades.creditsEarned : 0}
            </span>
            <span className="font-mono text-xs text-[#667085] dark:text-[#94A3B8]">
              / {grades.creditsRequired || 240} ECTS
            </span>
          </div>
          <p className="text-[11px] font-sans text-[#475467] dark:text-[#CBD5E1]">
            {tr(lang, 'Бакалавриат • 4 академических года', 'Bachelor Program • 4 Academic Years')}
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. OFFICIAL ACADEMIC DEBT WARNING (e.g. Timur Belov)
          ───────────────────────────────────────────────────────────── */}
      {failedSubject && (
        <section className="p-5 rounded-xl bg-[#C63740]/10 dark:bg-[#C63740]/20 border-l-4 border-[#C63740] space-y-3">
          <div className="flex items-start space-x-3">
            <AlertOctagon className="w-5 h-5 text-[#C63740] flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-base text-[#991B1B] dark:text-[#F06A73]">
                  {tr(lang, 'Академическая задолженность:', 'Academic Debt:')}{' '}
                  {localizeText(failedSubject.subject, lang)}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#C63740] text-white">
                  {tr(lang, 'НЕЗАЧЕТ', 'FAILED')}
                </span>
              </div>
              <p className="text-xs text-[#475467] dark:text-[#CBD5E1] font-sans leading-relaxed">
                {tr(
                  lang,
                  'Назначена первая повторная промежуточная аттестация комиссии факультета. Для допуска необходимо погасить задолженность по лабораторным работам.',
                  'Faculty board retake assessment has been scheduled. All pending lab coursework must be submitted for admission.'
                )}
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[#991B1B] dark:text-[#F06A73] font-semibold">
                <span>
                  {tr(lang, 'Дата пересдачи: 28 ноября 2026 г.', 'Retake Date: Nov 28, 2026')}
                </span>
                <span>•</span>
                <span>{tr(lang, 'Время: 14:00', 'Time: 14:00')}</span>
                <span>•</span>
                <span>{tr(lang, 'Аудитория: А-314', 'Room: А-314')}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. OFFICIAL ACADEMIC RECORD TABLE (ETH Modernist Table)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 bg-[#F8FAFC] dark:bg-[#0E1B2D] border-b border-[#DCE2EA] dark:border-[#193150] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-4 h-4 text-[#142D4E] dark:text-[#93C5FD]" />
            <h3 className="font-sans font-semibold text-xs sm:text-sm uppercase tracking-wider text-[#0F1D30] dark:text-[#FFFFFF]">
              {tr(
                lang,
                `${selectedSemester} семестр • Дисциплины учебного плана`,
                `Semester ${selectedSemester} • Curriculum Courses`
              )}
            </h3>
          </div>
          <span className="text-xs font-mono text-[#667085] dark:text-[#94A3B8]">
            {tr(lang, `${grades.items.length} дисциплин`, `${grades.items.length} courses`)}
          </span>
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-label={tr(lang, 'Таблица успеваемости', 'Grades Table')}
          className="overflow-x-auto focus:outline-hidden focus:ring-1 focus:ring-[#245A91]"
        >
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#F8FAFC]/50 dark:bg-[#0E1B2D]/50 border-b border-[#DCE2EA] dark:border-[#193150] text-[10px] uppercase tracking-wider text-[#667085] dark:text-[#94A3B8] font-mono">
              <tr>
                <th className="py-3 px-4 w-12">№</th>
                <th className="py-3 px-4">
                  {tr(lang, 'Дисциплина и кафедра', 'Course & Department')}
                </th>
                <th className="py-3 px-4 w-24">ECTS</th>
                <th className="py-3 px-4 w-28">{tr(lang, 'Баллы (БРС)', 'Score')}</th>
                <th className="py-3 px-4 w-32">{tr(lang, 'Оценка', 'Grade')}</th>
                <th className="py-3 px-4 w-28">{tr(lang, 'Статус', 'Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE2EA] dark:divide-[#193150]">
              {grades.items.map((item, idx) => {
                const isFail = item.creditStatus === 'failed';
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#F8FAFC] dark:hover:bg-[#162A45] transition-colors ${
                      isFail ? 'bg-[#C63740]/5 dark:bg-[#C63740]/15' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono text-[#667085] dark:text-[#94A3B8]">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-sm text-[#0F1D30] dark:text-[#FFFFFF]">
                        {localizeText(item.subject, lang)}
                      </p>
                      <p className="text-[11px] text-[#667085] dark:text-[#94A3B8] mt-0.5">
                        {getAssessmentTypeLabel(item.assessmentType, lang)} •{' '}
                        {tr(
                          lang,
                          'Кафедра международных отношений',
                          'Dept. of International Relations'
                        )}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#0F1D30] dark:text-[#FFFFFF]">
                      {item.credits} ECTS
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={`font-bold ${
                          isFail
                            ? 'text-[#991B1B] dark:text-[#F06A73]'
                            : 'text-[#142D4E] dark:text-[#93C5FD]'
                        }`}
                      >
                        {item.points ?? '—'}
                      </span>
                      <span className="text-[#667085] dark:text-[#94A3B8] text-[10px]"> / 100</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-semibold text-sm ${
                          isFail
                            ? 'text-[#991B1B] dark:text-[#F06A73]'
                            : 'text-[#142D4E] dark:text-[#93C5FD]'
                        }`}
                      >
                        {item.grade
                          ? `${item.grade} (${getGradeDescription(item.grade, lang)})`
                          : isFail
                            ? tr(lang, 'Незачет', 'Failed')
                            : tr(lang, 'Зачтено', 'Passed')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-sans font-semibold uppercase tracking-wider ${
                          isFail
                            ? 'bg-[#C63740]/15 dark:bg-[#C63740]/25 text-[#991B1B] dark:text-[#FCA5A5] border border-[#C63740]/30'
                            : 'bg-[#142D4E]/10 text-[#142D4E] dark:text-[#93C5FD] border border-[#142D4E]/25'
                        }`}
                      >
                        {isFail ? tr(lang, 'Долг', 'Debt') : tr(lang, 'Зачтено', 'Passed')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
