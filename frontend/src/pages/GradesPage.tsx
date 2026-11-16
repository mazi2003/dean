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
} from 'lucide-react';
import { GradesSummary, Grade } from '../types';
import { api } from '../services/api';

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
      <div className="p-6 space-y-4 max-w-5xl mx-auto animate-pulse">
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  // Check if there is any debt/failed subject
  const failedSubject = grades.items.find(g => g.creditStatus === 'failed');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <span>{lang === 'ru' ? 'Успеваемость и зачетная книжка' : 'Academic Grades'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Студент: <strong>{user?.fullName}</strong> • {profile?.group}
          </p>
        </div>

        {/* Semester Selector */}
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            onClick={() => setSelectedSemester(3)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedSemester === 3
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            3 семестр (текущий)
          </button>
          <button
            onClick={() => setSelectedSemester(2)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedSemester === 2
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            2 семестр
          </button>
        </div>
      </div>

      {/* Academic Debt Warning (e.g. for Timur Belov) */}
      {failedSubject && (
        <div className="p-5 rounded-3xl bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 shadow-sm space-y-3">
          <div className="flex items-start space-x-3">
            <AlertOctagon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base">
                  Академическая задолженность: {failedSubject.subject}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200">
                  НЕЗАЧЕТ
                </span>
              </div>
              <p className="text-xs text-red-800 dark:text-red-300 mt-1">
                Балл за семестр: <strong>{failedSubject.points} из 100</strong>. Требуется ликвидация задолженности во время дополнительной экзаменационной сессии.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-red-200 dark:border-red-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
              <Calendar className="w-4 h-4 text-red-600" />
              <span>
                Дата пересдачи: <strong>{failedSubject.retakeDate || '28 ноября 2026, 14:00'}</strong>
              </span>
            </div>
            <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
              <BookOpen className="w-4 h-4 text-red-600" />
              <span>Преподаватель: <strong>{failedSubject.teacher}</strong> (Ауд. А-314)</span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards: GPA, Average Score, Credits Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* GPA */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
              {lang === 'ru' ? 'Средний балл GPA' : 'GPA'}
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block">
              {grades.gpa}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold">
              {grades.gpa >= 4.5 ? '★ Отличная успеваемость' : 'Нормальный уровень'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* 100-Point Average */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
              {lang === 'ru' ? 'Рейтинговый балл' : 'Avg Score'}
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block">
              {grades.averagePoints} <span className="text-sm font-normal text-slate-400">/ 100</span>
            </span>
            <span className="text-[11px] text-slate-500">
              По 100-балльной шкале БРС
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        {/* Credits Earned Ring */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
              {lang === 'ru' ? 'Кредиты (ECTS)' : 'Credits Earned'}
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block">
              {grades.creditsEarned} <span className="text-sm font-normal text-slate-400">/ {grades.creditsRequired}</span>
            </span>
            <span className="text-[11px] text-blue-600 font-semibold">
              {Math.round((grades.creditsEarned / grades.creditsRequired) * 100)}% плана выполнено
            </span>
          </div>
          {/* Circular Progress Ring */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-slate-100 dark:text-slate-800"
              />
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="113"
                strokeDashoffset={113 - (113 * grades.creditsEarned) / grades.creditsRequired}
                className="text-blue-600 transition-all duration-1000"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-slate-700 dark:text-slate-300">
              {grades.creditsEarned}
            </span>
          </div>
        </div>
      </div>

      {/* Upcoming Exams & Credits */}
      {grades.upcomingExams.length > 0 && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>{lang === 'ru' ? 'Предстоящие экзамены и зачеты' : 'Upcoming Exams'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {grades.upcomingExams.map(ex => (
              <div
                key={ex.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {ex.assessmentType === 'exam' ? 'Экзамен' : 'Зачет'} • {ex.credits} ECTS
                    </span>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      {ex.examDate}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {ex.subject}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {ex.teacher}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Статус:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    Подготовка к сессии
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Subject Grades Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>{lang === 'ru' ? 'Изучаемые дисциплины и оценки' : 'Disciplines & Marks'}</span>
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {grades.items.map(item => (
            <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.subject}
                  </h4>
                  <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                    {item.credits} ECTS
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {item.teacher} • {item.assessmentType === 'exam' ? 'Экзамен' : item.assessmentType === 'credit' ? 'Зачет' : 'Курсовая работа'}
                </p>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center">
                {/* Score bar */}
                {item.points !== null && (
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">
                      {item.points}/100
                    </span>
                    <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5">
                      <div
                        className={`h-full rounded-full ${
                          item.points >= 85
                            ? 'bg-emerald-500'
                            : item.points >= 70
                            ? 'bg-blue-500'
                            : item.points >= 50
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${item.points}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Mark / Grade Badge */}
                {item.grade ? (
                  <span
                    className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-sm shadow-sm ${
                      item.grade === 5
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : item.grade === 4
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : item.grade === 3
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {item.grade}
                  </span>
                ) : item.creditStatus === 'earned' ? (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Зачет</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-medium">
                    В процессе
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
