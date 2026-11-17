import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Award,
  AlertOctagon,
  Calendar,
  CheckCircle,
  Clock,
  BookOpen,
  FileCheck2,
  ShieldCheck,
  FileText,
  Printer,
  Download,
} from 'lucide-react';
import { GradesSummary, Grade } from '../types';
import { api } from '../services/api';
import { UniversityEmblem } from '../components/UniversityEmblem';

export const GradesPage: React.FC = () => {
  const { user, profile, lang } = useAuth();
  const [grades, setGrades] = useState<GradesSummary | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number>(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getGrades();
        setGrades(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading || !grades) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-36 bg-[#E3DDD1]/40 dark:bg-[#1A2520] rounded-xl" />
        <div className="h-96 bg-[#E3DDD1]/40 dark:bg-[#1A2520] rounded-xl" />
      </div>
    );
  }

  // Check if there is any debt/failed subject
  const failedSubject = grades.items.find(g => g.creditStatus === 'failed');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. TRANSCRIPT HEADER & INSTITUTIONAL CHARTER
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E3DDD1] dark:border-[#26362F]">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#183D35] dark:text-[#C4A46B] font-semibold mb-1">
            <span>{profile?.faculty}</span>
            <span>•</span>
            <span>№ {profile?.studentNumber}</span>
            <span>•</span>
            <span>ECTS Европейская система</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#252923] dark:text-[#F3EFE5]">
            {lang === 'ru' ? 'Электронная зачетная книжка' : 'Academic Transcript & Records'}
          </h1>
          <p className="text-xs text-[#575F53] dark:text-[#C8D1CA] font-sans mt-0.5">
            Студент: <strong>{user?.fullName}</strong> • Академическая группа <strong>{profile?.group}</strong>
          </p>
        </div>

        {/* Semester Selector */}
        <div className="flex items-center space-x-1.5 bg-[#FAF8F3] dark:bg-[#121714] p-1 rounded-lg border border-[#E3DDD1] dark:border-[#2D3E35] text-xs font-sans font-medium">
          <button
            onClick={() => setSelectedSemester(3)}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              selectedSemester === 3
                ? 'bg-[#183D35] text-[#F3EFE5] font-semibold shadow-xs'
                : 'text-[#575F53] dark:text-[#C8D1CA] hover:text-[#252923] dark:hover:text-[#F3EFE5]'
            }`}
          >
            3 семестр (текущий)
          </button>
          <button
            onClick={() => setSelectedSemester(2)}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              selectedSemester === 2
                ? 'bg-[#183D35] text-[#F3EFE5] font-semibold shadow-xs'
                : 'text-[#575F53] dark:text-[#C8D1CA] hover:text-[#252923] dark:hover:text-[#F3EFE5]'
            }`}
          >
            2 семестр
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. ACADEMIC SUMMARY METRICS (Oxford Transcript Style)
          ───────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cumulative GPA */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#18221D] border border-[#E3DDD1] dark:border-[#2D3E35] shadow-xs space-y-1">
          <span className="text-[11px] font-sans uppercase tracking-wider text-[#7E877B] dark:text-[#8E9B93]">
            {lang === 'ru' ? 'Средний балл (GPA)' : 'Cumulative GPA'}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-3xl font-bold text-[#183D35] dark:text-[#C4A46B]">
              {grades.gpa.toFixed(2)}
            </span>
            <span className="font-mono text-xs text-[#7E877B]">/ 5.00</span>
          </div>
          <p className="text-[11px] font-sans text-[#575F53] dark:text-[#C8D1CA]">
            {grades.gpa >= 4.5 ? 'Отличная академическая успеваемость' : 'Академический прогресс в норме'}
          </p>
        </div>

        {/* 100-Point Score (БРС) */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#18221D] border border-[#E3DDD1] dark:border-[#2D3E35] shadow-xs space-y-1">
          <span className="text-[11px] font-sans uppercase tracking-wider text-[#7E877B] dark:text-[#8E9B93]">
            {lang === 'ru' ? 'БРС Рейтинг (100-балльная шкала)' : 'Rating Score (0-100)'}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-3xl font-bold text-[#252923] dark:text-[#F3EFE5]">
              {(grades.averagePoints || profile?.averageScore || 88.5).toFixed(1)}
            </span>
            <span className="font-mono text-xs text-[#7E877B]">/ 100</span>
          </div>
          <p className="text-[11px] font-sans text-[#575F53] dark:text-[#C8D1CA]">
            Балльно-рейтинговая система университета
          </p>
        </div>

        {/* Total ECTS Credits */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#18221D] border border-[#E3DDD1] dark:border-[#2D3E35] shadow-xs space-y-1">
          <span className="text-[11px] font-sans uppercase tracking-wider text-[#7E877B] dark:text-[#8E9B93]">
            {lang === 'ru' ? 'Освоено кредитов (ECTS)' : 'Completed Credits (ECTS)'}
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="font-mono text-3xl font-bold text-[#183D35] dark:text-[#C4A46B]">
              {grades.creditsEarned || 48}
            </span>
            <span className="font-mono text-xs text-[#7E877B]">/ {grades.creditsRequired || 240} ECTS</span>
          </div>
          <p className="text-[11px] font-sans text-[#575F53] dark:text-[#C8D1CA]">
            Бакалавриат • 4 академических года
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. OFFICIAL ACADEMIC DEBT WARNING (e.g. Timur Belov)
          ───────────────────────────────────────────────────────────── */}
      {failedSubject && (
        <section className="p-5 rounded-xl bg-[#A33D35]/10 dark:bg-[#A33D35]/20 border-l-4 border-[#A33D35] space-y-3">
          <div className="flex items-start space-x-3">
            <AlertOctagon className="w-5 h-5 text-[#A33D35] flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-serif font-bold text-base text-[#A33D35] dark:text-[#E2766E]">
                  Академическая задолженность: {failedSubject.subject}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#A33D35] text-white">
                  НЕЗАЧЕТ
                </span>
              </div>
              <p className="text-xs text-[#575F53] dark:text-[#C8D1CA] font-sans leading-relaxed">
                Назначена первая повторная промежуточная аттестация комиссии факультета. Для допуска необходимо погасить задолженность по лабораторным работам.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[#A33D35] dark:text-[#E2766E] font-semibold">
                <span>Дата пересдачи: 28 ноября 2026 г.</span>
                <span>•</span>
                <span>Время: 14:00</span>
                <span>•</span>
                <span>Аудитория: А-314</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. OFFICIAL ACADEMIC RECORD TABLE (ETH Modernist Table)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 bg-[#FAF8F3] dark:bg-[#121714] border-b border-[#E3DDD1] dark:border-[#26362F] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-4 h-4 text-[#183D35] dark:text-[#C4A46B]" />
            <h3 className="font-sans font-semibold text-xs sm:text-sm uppercase tracking-wider text-[#252923] dark:text-[#F3EFE5]">
              {selectedSemester} семестр • Дисциплины учебного плана
            </h3>
          </div>
          <span className="text-xs font-mono text-[#7E877B]">
            {grades.items.length} дисциплин
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#FAF8F3]/50 dark:bg-[#121714]/50 border-b border-[#E3DDD1] dark:border-[#26362F] text-[10px] uppercase tracking-wider text-[#7E877B] font-mono">
              <tr>
                <th className="py-3 px-4 w-12">№</th>
                <th className="py-3 px-4">Дисциплина и кафедра</th>
                <th className="py-3 px-4 w-24">ECTS</th>
                <th className="py-3 px-4 w-28">Баллы (БРС)</th>
                <th className="py-3 px-4 w-32">Оценка</th>
                <th className="py-3 px-4 w-28">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DDD1] dark:divide-[#26362F]">
              {grades.items.map((item, idx) => {
                const isFail = item.creditStatus === 'failed';
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#FAF8F3] dark:hover:bg-[#1A2520] transition-colors ${
                      isFail ? 'bg-[#A33D35]/5 dark:bg-[#A33D35]/15' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono text-[#7E877B]">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-serif font-bold text-sm text-[#252923] dark:text-[#F3EFE5]">
                        {item.subject}
                      </p>
                      <p className="text-[11px] text-[#7E877B] dark:text-[#8E9B93] mt-0.5">
                        {item.assessmentType === 'exam'
                          ? 'Экзамен'
                          : item.assessmentType === 'coursework'
                          ? 'Курсовая работа'
                          : 'Зачет'}{' '}
                        • Кафедра международных отношений
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#252923] dark:text-[#F3EFE5]">
                      {item.credits} ECTS
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span
                        className={`font-bold ${
                          isFail ? 'text-[#A33D35] dark:text-[#E2766E]' : 'text-[#183D35] dark:text-[#C4A46B]'
                        }`}
                      >
                        {item.points ?? '—'}
                      </span>
                      <span className="text-[#7E877B] text-[10px]"> / 100</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-serif font-bold text-sm ${
                          isFail
                            ? 'text-[#A33D35] dark:text-[#E2766E]'
                            : 'text-[#183D35] dark:text-[#C4A46B]'
                        }`}
                      >
                        {item.grade
                          ? `${item.grade} (${
                              item.grade === 5 ? 'Отлично' : item.grade === 4 ? 'Хорошо' : 'Удовл.'
                            })`
                          : isFail
                          ? 'Незачет'
                          : 'Зачтено'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-sans font-semibold uppercase tracking-wider ${
                          isFail
                            ? 'bg-[#A33D35]/15 text-[#A33D35] dark:text-[#E2766E] border border-[#A33D35]/30'
                            : 'bg-[#183D35]/10 text-[#183D35] dark:text-[#C4A46B] border border-[#183D35]/25'
                        }`}
                      >
                        {isFail ? 'Долг' : 'Зачтено'}
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
