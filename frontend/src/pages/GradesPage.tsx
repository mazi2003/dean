import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertOctagon, FileCheck2, Award, BookOpen, Layers } from 'lucide-react';
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
        <div className="h-36 bg-white/60 dark:bg-[#171c26]/60 rounded-3xl" />
        <div className="h-96 bg-white/60 dark:bg-[#171c26]/60 rounded-3xl" />
      </div>
    );
  }

  // Check if there is any debt/failed subject
  const failedSubject = grades.items.find((g) => g.creditStatus === 'failed');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. TRANSCRIPT HEADER (Innopolis Design System)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e2e4e8] dark:border-[#273142]">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-sans text-[#166534] dark:text-[#45d320] font-semibold mb-1">
            <span>{localizeText(profile?.faculty, lang)}</span>
            <span>•</span>
            <span>№ {profile?.studentNumber}</span>
            <span>•</span>
            <span>{tr(lang, 'ECTS Европейская система', 'ECTS Credit System')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-[#161821] dark:text-[#ffffff]">
            {lang === 'ru' ? 'Электронная зачетная книжка' : 'Academic Transcript & Records'}
          </h1>
          <p className="text-xs text-[#4b5563] dark:text-[#cbd5e1] font-sans mt-0.5">
            {tr(lang, 'Студент:', 'Student:')} <strong>{user?.fullName}</strong> •{' '}
            {tr(lang, 'Академическая группа', 'Academic Group')} <strong>{profile?.group}</strong>
          </p>
        </div>

        {/* Semester Selector (Capsule Pills) */}
        <div className="flex items-center space-x-1.5 bg-[#f6f6f9] dark:bg-[#121620] p-1.5 rounded-full border border-[#e2e4e8] dark:border-[#273142] text-xs font-heading font-medium">
          <button
            onClick={() => setSelectedSemester(3)}
            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
              selectedSemester === 3
                ? 'bg-[#161821] dark:bg-white text-white dark:text-[#161821] font-semibold shadow-xs'
                : 'text-[#4b5563] dark:text-[#cbd5e1] hover:text-[#161821] dark:hover:text-[#ffffff]'
            }`}
          >
            {tr(lang, '3 семестр (текущий)', 'Semester 3 (Current)')}
          </button>
          <button
            onClick={() => setSelectedSemester(2)}
            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
              selectedSemester === 2
                ? 'bg-[#161821] dark:bg-white text-white dark:text-[#161821] font-semibold shadow-xs'
                : 'text-[#4b5563] dark:text-[#cbd5e1] hover:text-[#161821] dark:hover:text-[#ffffff]'
            }`}
          >
            {tr(lang, '2 семестр', 'Semester 2')}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. ACADEMIC SUMMARY METRICS (Innopolis Cards)
          ───────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cumulative GPA */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#171c26] border border-[#e2e4e8] dark:border-[#273142] shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-heading uppercase tracking-wider text-[#475569] dark:text-[#94a3b8]">
              {lang === 'ru' ? 'Средний балл (GPA)' : 'Cumulative GPA'}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#ebfbee] dark:bg-[#1e2d24] flex items-center justify-center text-[#166534] dark:text-[#45d320]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-3xl font-bold text-[#166534] dark:text-[#45d320]">
              {(grades.items.length > 0 ? grades.gpa : 0).toFixed(2)}
            </span>
            <span className="font-mono text-xs text-[#475569] dark:text-[#94a3b8]">/ 5.00</span>
          </div>
          <p className="text-[11px] font-sans text-[#4b5563] dark:text-[#cbd5e1]">
            {grades.gpa >= 4.5
              ? tr(lang, 'Отличная академическая успеваемость', 'Honors academic standing')
              : tr(lang, 'Академический прогресс в норме', 'Good academic standing')}
          </p>
        </div>

        {/* 100-Point Score (БРС) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#171c26] border border-[#e2e4e8] dark:border-[#273142] shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-heading uppercase tracking-wider text-[#475569] dark:text-[#94a3b8]">
              {lang === 'ru' ? 'БРС Рейтинг (0–100)' : 'Rating Score (0-100)'}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#e8f4fd] dark:bg-[#1a2838] flex items-center justify-center text-[#0369a1] dark:text-[#38bdf8]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-3xl font-bold text-[#161821] dark:text-[#ffffff]">
              {(grades.items.length > 0 ? grades.averagePoints : 0).toFixed(1)}
            </span>
            <span className="font-mono text-xs text-[#475569] dark:text-[#94a3b8]">/ 100</span>
          </div>
          <p className="text-[11px] font-sans text-[#4b5563] dark:text-[#cbd5e1]">
            {tr(
              lang,
              'Балльно-рейтинговая система университета',
              'University continuous rating system'
            )}
          </p>
        </div>

        {/* Total ECTS Credits */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#171c26] border border-[#e2e4e8] dark:border-[#273142] shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-heading uppercase tracking-wider text-[#475569] dark:text-[#94a3b8]">
              {lang === 'ru' ? 'Освоено кредитов (ECTS)' : 'Completed Credits (ECTS)'}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#f4ebfc] dark:bg-[#281b36] flex items-center justify-center text-[#6d28d9] dark:text-[#a78bfa]">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-3xl font-bold text-[#161821] dark:text-[#ffffff]">
              {grades.items.length > 0 ? grades.creditsEarned : 0}
            </span>
            <span className="font-mono text-xs text-[#475569] dark:text-[#94a3b8]">
              / {grades.creditsRequired || 240} ECTS
            </span>
          </div>
          <p className="text-[11px] font-sans text-[#4b5563] dark:text-[#cbd5e1]">
            {tr(lang, 'Бакалавриат • 4 академических года', 'Bachelor Program • 4 Academic Years')}
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. ACADEMIC DEBT WARNING (If failed subject present)
          ───────────────────────────────────────────────────────────── */}
      {failedSubject && (
        <section className="p-6 rounded-3xl bg-[#fff2f5] dark:bg-[#2a131b] border border-[#ff4d8b]/30 space-y-3 shadow-xs">
          <div className="flex items-start space-x-3.5">
            <AlertOctagon className="w-5 h-5 text-[#be123c] dark:text-[#fecdd3] flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-heading font-semibold text-base text-[#be123c] dark:text-[#fecdd3]">
                  {tr(lang, 'Академическая задолженность:', 'Academic Debt:')}{' '}
                  {localizeText(failedSubject.subject, lang)}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#be123c] text-white">
                  {tr(lang, 'НЕЗАЧЕТ', 'FAILED')}
                </span>
              </div>
              <p className="text-xs text-[#4b5563] dark:text-[#cbd5e1] font-sans leading-relaxed">
                {tr(
                  lang,
                  'Назначена первая повторная промежуточная аттестация комиссии факультета. Для допуска необходимо погасить задолженность по лабораторным работам.',
                  'Faculty board retake assessment has been scheduled. All pending lab coursework must be submitted for admission.'
                )}
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[#be123c] dark:text-[#fecdd3] font-semibold">
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
          4. OFFICIAL ACADEMIC RECORD TABLE
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#171c26] rounded-3xl border border-[#e2e4e8] dark:border-[#273142] overflow-hidden shadow-xs">
        <div className="p-5 bg-[#f6f6f9] dark:bg-[#121620] border-b border-[#e2e4e8] dark:border-[#273142] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
            <h3 className="font-heading font-semibold text-xs sm:text-sm uppercase tracking-wider text-[#161821] dark:text-[#ffffff]">
              {tr(
                lang,
                `${selectedSemester} семестр • Дисциплины учебного плана`,
                `Semester ${selectedSemester} • Curriculum Courses`
              )}
            </h3>
          </div>
          <span className="text-xs font-mono text-[#475569] dark:text-[#94a3b8]">
            {tr(lang, `${grades.items.length} дисциплин`, `${grades.items.length} courses`)}
          </span>
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-label={tr(lang, 'Таблица успеваемости', 'Grades Table')}
          className="overflow-x-auto focus:outline-hidden focus:ring-1 focus:ring-[#33b712]"
        >
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#f6f6f9]/60 dark:bg-[#121620]/60 border-b border-[#e2e4e8] dark:border-[#273142] text-[10px] uppercase tracking-wider text-[#475569] dark:text-[#94a3b8] font-mono">
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
            <tbody className="divide-y divide-[#e2e4e8] dark:divide-[#273142]">
              {grades.items.map((item, idx) => {
                const isFail = item.creditStatus === 'failed';
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#f6f6f9] dark:hover:bg-[#1e2533] transition-colors ${
                      isFail ? 'bg-[#ff4d8b]/5 dark:bg-[#ff4d8b]/15' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono text-[#475569] dark:text-[#94a3b8]">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-heading font-semibold text-sm text-[#161821] dark:text-[#ffffff]">
                        {localizeText(item.subject, lang)}
                      </p>
                      <p className="text-[11px] text-[#475569] dark:text-[#94a3b8] mt-0.5">
                        {getAssessmentTypeLabel(item.assessmentType, lang)} •{' '}
                        {tr(
                          lang,
                          'Кафедра международных отношений',
                          'Dept. of International Relations'
                        )}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#161821] dark:text-[#ffffff]">
                      {item.credits} ECTS
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={`font-bold ${
                          isFail
                            ? 'text-[#be123c] dark:text-[#fecdd3]'
                            : 'text-[#166534] dark:text-[#45d320]'
                        }`}
                      >
                        {item.points ?? '—'}
                      </span>
                      <span className="text-[#475569] dark:text-[#94a3b8] text-[10px]"> / 100</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-heading font-semibold text-sm ${
                          isFail
                            ? 'text-[#be123c] dark:text-[#fecdd3]'
                            : 'text-[#161821] dark:text-[#ffffff]'
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
                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-heading font-semibold uppercase tracking-wider ${
                          isFail
                            ? 'bg-[#ff4d8b]/15 text-[#be123c] dark:text-[#fecdd3] border border-[#ff4d8b]/30'
                            : 'bg-[#ebfbee] dark:bg-[#1e2d24] text-[#166534] dark:text-[#45d320] border border-[#33b712]/30'
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
