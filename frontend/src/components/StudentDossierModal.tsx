import React, { useState } from 'react';
import {
  X,
  User,
  GraduationCap,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Send,
  FileCheck,
} from 'lucide-react';
import { StudentDossier } from '../types';
import { OfficialTranscriptModal } from './OfficialTranscriptModal';
import { useAuth } from '../context/AuthContext';
import {
  tr,
  getStudyFormLabel,
  getAssessmentTypeLabel,
  getRequestStatusLabel,
  localizeText,
} from '../utils/i18n';
import { resolveAvatarSrc } from '../utils/avatar';

interface StudentDossierModalProps {
  dossier: StudentDossier | null;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage?: (studentName: string, studentId: string, group: string) => void;
}

export const StudentDossierModal: React.FC<StudentDossierModalProps> = ({
  dossier,
  isOpen,
  onClose,
  onSendMessage,
}) => {
  const { lang } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'grades' | 'requests'>('profile');
  const [showTranscript, setShowTranscript] = useState(false);

  if (!isOpen || !dossier) return null;

  const { profile, gradesSummary, requests } = dossier;
  const hasDebts = profile.debtCount > 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={tr(lang, 'Досье студента', 'Student Dossier')}
          className="bg-white dark:bg-[#171c26] rounded-2xl max-w-4xl w-full border border-[#e2e4e8] dark:border-[#273142] shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-[#f6f6f9] dark:bg-[#11141c] border-b border-[#e2e4e8] dark:border-[#273142] relative">
            <button
              onClick={onClose}
              aria-label={tr(lang, 'Закрыть', 'Close')}
              className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#475569] dark:text-[#94a3b8] hover:text-[#161821] dark:hover:text-[#FFFFFF] hover:bg-[#ebeef3] dark:hover:bg-[#1e2533] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-5 pr-10">
              <div className="relative">
                <img
                  src={resolveAvatarSrc(profile.avatarUrl, profile.fullName)}
                  alt={profile.fullName}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-[#33b712] shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#161821] border-2 border-white dark:border-[#171c26] flex items-center justify-center text-[10px] text-[#166534] dark:text-[#45d320]">
                  ✓
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-bold bg-[#161821] text-[#45d320]">
                    {tr(lang, 'ГРУППА', 'GROUP')} {profile.group}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-medium bg-[#ebeef3] dark:bg-[#1E2923] text-[#161821] dark:text-[#FFFFFF]">
                    {tr(lang, `${profile.year} курс`, `Year ${profile.year}`)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-sans font-medium ${
                      profile.studyForm === 'Бюджет'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    {getStudyFormLabel(profile.studyForm, lang)}
                  </span>
                  {profile.isStarosta && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-bold bg-[#33b712]/20 text-[#1D4876] dark:text-[#45d320] border border-[#33b712]/40">
                      {tr(lang, '★ Староста группы', '★ Group Rep')}
                    </span>
                  )}
                  {hasDebts ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      {tr(lang, 'Задолженность', 'Arrears')} ({profile.debtCount})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      {tr(lang, 'Успевает', 'Good Standing')}
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-semibold text-[#161821] dark:text-[#FFFFFF]">
                  {profile.fullName}
                </h2>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8] font-sans">
                  {localizeText(profile.program, lang)} • {tr(lang, 'Студ. билет:', 'Student ID:')}{' '}
                  <span className="font-sans font-semibold">{profile.studentNumber}</span>
                </p>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-[#e2e4e8] dark:border-[#273142] text-xs font-sans">
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1e2533] border border-[#e2e4e8] dark:border-[#273142]">
                <span className="text-[10px] text-[#475569] dark:text-[#94A3B8] block uppercase tracking-wider">
                  {tr(lang, 'Средний балл (GPA)', 'Cumulative GPA')}
                </span>
                <span className="font-sans text-lg font-bold text-[#161821] dark:text-[#45d320]">
                  {profile.gpa.toFixed(2)}
                </span>
                <span className="text-[10px] text-[#475569] dark:text-[#94A3B8] block">
                  {tr(lang, 'из 5.0', 'out of 5.0')}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1e2533] border border-[#e2e4e8] dark:border-[#273142]">
                <span className="text-[10px] text-[#475569] dark:text-[#94A3B8] block uppercase tracking-wider">
                  {tr(lang, 'Рейтинг БРС', 'BRS Rating')}
                </span>
                <span className="font-sans text-lg font-bold text-[#161821] dark:text-[#45d320]">
                  {profile.averageScore}%
                </span>
                <span className="text-[10px] text-[#475569] dark:text-[#94A3B8] block">
                  {tr(lang, 'текущая успеваемость', 'current standing')}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1e2533] border border-[#e2e4e8] dark:border-[#273142]">
                <span className="text-[10px] text-[#475569] dark:text-[#94A3B8] block uppercase tracking-wider">
                  {tr(lang, 'Кредиты ECTS', 'ECTS Credits')}
                </span>
                <span className="font-sans text-lg font-bold text-[#161821] dark:text-[#FFFFFF]">
                  {gradesSummary.creditsEarned}
                </span>
                <span className="text-[10px] text-[#475569] dark:text-[#94A3B8] block">
                  {tr(
                    lang,
                    `из ${gradesSummary.creditsRequired} за семестр`,
                    `of ${gradesSummary.creditsRequired} this semester`
                  )}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1e2533] border border-[#e2e4e8] dark:border-[#273142]">
                <span className="text-[10px] text-[#475569] dark:text-[#94A3B8] block uppercase tracking-wider">
                  {tr(lang, 'Заявления в деканат', 'Submitted Requests')}
                </span>
                <span className="font-sans text-lg font-bold text-[#161821] dark:text-[#FFFFFF]">
                  {requests.length}
                </span>
                <span className="text-[10px] text-[#475569] dark:text-[#94A3B8] block">
                  {tr(lang, 'обращений подано', 'requests filed')}
                </span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-2 mt-4 pt-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-[#161821] text-[#FFFFFF]'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#161821] dark:hover:text-[#FFFFFF] hover:bg-[#ebeef3] dark:hover:bg-[#1e2533]'
                }`}
              >
                {tr(lang, 'Общие сведения и контакты', 'Overview & Contacts')}
              </button>
              <button
                onClick={() => setActiveTab('grades')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'grades'
                    ? 'bg-[#161821] text-[#FFFFFF]'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#161821] dark:hover:text-[#FFFFFF] hover:bg-[#ebeef3] dark:hover:bg-[#1e2533]'
                }`}
              >
                <span>{tr(lang, 'Успеваемость и зачетка', 'Grades & Record Book')}</span>
                {hasDebts && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'requests'
                    ? 'bg-[#161821] text-[#FFFFFF]'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#161821] dark:hover:text-[#FFFFFF] hover:bg-[#ebeef3] dark:hover:bg-[#1e2533]'
                }`}
              >
                <span>{tr(lang, 'Заявления и справки', 'Requests & Certificates')}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#e2e4e8] dark:bg-[#273142] font-sans">
                  {requests.length}
                </span>
              </button>
            </div>
          </div>

          {/* Tab Content Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* TAB 1: PROFILE & CONTACTS */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Academic Standing */}
                  <div className="p-4 rounded-xl bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] space-y-3">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-[#161821] dark:text-[#45d320] flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>{tr(lang, 'Учебные реквизиты', 'Academic Record')}</span>
                    </h3>
                    <div className="space-y-2 text-xs font-sans">
                      <div>
                        <span className="text-[#475569] dark:text-[#94A3B8] block text-[11px]">
                          {tr(lang, 'Факультет:', 'Faculty:')}
                        </span>
                        <span className="font-medium text-[#161821] dark:text-[#FFFFFF]">
                          {localizeText(profile.faculty, lang)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#475569] dark:text-[#94A3B8] block text-[11px]">
                          {tr(lang, 'Направление подготовки:', 'Academic Program:')}
                        </span>
                        <span className="font-medium text-[#161821] dark:text-[#FFFFFF]">
                          {localizeText(profile.program, lang)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[#475569] dark:text-[#94A3B8] block text-[11px]">
                            {tr(lang, 'Номер студбилета:', 'Student ID:')}
                          </span>
                          <span className="font-sans font-semibold">{profile.studentNumber}</span>
                        </div>
                        <div>
                          <span className="text-[#475569] dark:text-[#94A3B8] block text-[11px]">
                            {tr(lang, 'Номер зачетки:', 'Record Book No.:')}
                          </span>
                          <span className="font-sans font-semibold">
                            {profile.recordBookNumber}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[#475569] dark:text-[#94A3B8] block text-[11px]">
                            {tr(lang, 'Год зачисления:', 'Admission Year:')}
                          </span>
                          <span className="font-medium">
                            {tr(lang, `${profile.admissionYear} г.`, String(profile.admissionYear))}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#475569] dark:text-[#94A3B8] block text-[11px]">
                            {tr(lang, 'Форма финансирования:', 'Funding Type:')}
                          </span>
                          <span className="font-medium">
                            {getStudyFormLabel(profile.studyForm, lang)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact and Identity Information */}
                  <div className="p-4 rounded-xl bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] space-y-3">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-[#161821] dark:text-[#45d320] flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{tr(lang, 'Контакты и место жительства', 'Contacts & Residence')}</span>
                    </h3>
                    <div className="space-y-2.5 text-xs font-sans">
                      <div className="flex items-center space-x-2.5">
                        <Mail className="w-3.5 h-3.5 text-[#475569] dark:text-[#94A3B8]" />
                        <div>
                          <span className="text-[#475569] dark:text-[#94A3B8] block text-[10px]">
                            {tr(lang, 'Корпоративный email:', 'University Email:')}
                          </span>
                          <a
                            href={`mailto:${profile.email}`}
                            className="font-medium text-[#161821] dark:text-[#45d320] hover:underline"
                          >
                            {profile.email}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <Phone className="w-3.5 h-3.5 text-[#475569] dark:text-[#94A3B8]" />
                        <div>
                          <span className="text-[#475569] dark:text-[#94A3B8] block text-[10px]">
                            {tr(lang, 'Телефон для связи:', 'Contact Phone:')}
                          </span>
                          <span className="font-sans font-medium">
                            {profile.phone || '+7 (999) 000-00-00'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2.5">
                        <MapPin className="w-3.5 h-3.5 text-[#475569] dark:text-[#94A3B8] mt-0.5" />
                        <div>
                          <span className="text-[#475569] dark:text-[#94A3B8] block text-[10px]">
                            {tr(lang, 'Место проживания:', 'Residence / Dormitory:')}
                          </span>
                          <span className="font-medium">
                            {profile.dormitoryInfo || tr(lang, 'г. Москва', 'Moscow')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#475569] dark:text-[#94A3B8]" />
                        <div>
                          <span className="text-[#475569] dark:text-[#94A3B8] block text-[10px]">
                            {tr(lang, 'СНИЛС:', 'Insurance ID (SNILS):')}
                          </span>
                          <span className="font-sans">{profile.snils || '184-293-841 02'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admission decree record */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#1e2533] border border-[#e2e4e8] dark:border-[#273142] flex items-center justify-between text-xs font-sans">
                  <div>
                    <span className="font-semibold text-[#161821] dark:text-[#45d320] block">
                      {tr(lang, 'Приказ о зачислении № 412-СТ', 'Enrollment Decree No. 412-ST')}
                    </span>
                    <span className="text-[#475569] dark:text-[#94A3B8] text-[11px]">
                      {tr(
                        lang,
                        `Утвержден ректоратом 25.08.${profile.admissionYear}. Основание: результаты ЕГЭ / общий конкурс`,
                        `Approved by Rectorate on Aug 25, ${profile.admissionYear}. Basis: entrance examinations`
                      )}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium text-[11px]">
                    {tr(lang, 'Приказ исполнен', 'Executed')}
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: GRADES & TRANSCRIPT */}
            {activeTab === 'grades' && (
              <div className="space-y-4">
                {/* Academic Debt Alert Box if any */}
                {hasDebts && (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start space-x-3 text-xs font-sans">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-rose-900 dark:text-rose-200">
                        {tr(lang, 'Академическая задолженность', 'Academic Arrears')} (
                        {profile.debtCount})
                      </h4>
                      <p className="text-rose-800 dark:text-rose-300">
                        {tr(
                          lang,
                          `У студента не сданы дисциплины: ${profile.debtSubjects?.join(', ') || 'Статистика'}. Срок ликвидации задолженности по графику комиссионных пересдач — до 28 ноября 2026 г.`,
                          `Pending courses: ${profile.debtSubjects?.map((s) => localizeText(s, 'en')).join(', ') || 'Statistics'}. Commission retake clearance deadline is November 28, 2026.`
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Exams List */}
                <div className="rounded-xl border border-[#e2e4e8] dark:border-[#273142] overflow-hidden">
                  <div className="bg-[#f6f6f9] dark:bg-[#111714] px-4 py-2.5 border-b border-[#e2e4e8] dark:border-[#273142] flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#161821] dark:text-[#45d320]">
                      {tr(
                        lang,
                        'Экзаменационная ведомость — 3 семестр',
                        'Examination Grade Sheet — Semester 3'
                      )}
                    </span>
                    <span className="text-[11px] font-sans text-[#475569] dark:text-[#94A3B8]">
                      {gradesSummary.items.length} {tr(lang, 'дисциплин', 'courses')}
                    </span>
                  </div>

                  <div className="divide-y divide-[#e2e4e8] dark:divide-[#273142] bg-white dark:bg-[#171c26]">
                    {gradesSummary.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#f6f6f9] dark:hover:bg-[#1e2533]/40 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-semibold text-[#161821] dark:text-[#FFFFFF]">
                            {localizeText(item.subject, lang)}
                          </h4>
                          <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] font-sans">
                            {item.teacher ||
                              tr(
                                lang,
                                'Кафедра международных отношений',
                                'Department of International Relations'
                              )}{' '}
                            • {item.credits} {tr(lang, 'З.Е.', 'Cr.')} (ECTS) •{' '}
                            {getAssessmentTypeLabel(item.assessmentType, lang)}
                          </p>
                        </div>

                        <div className="flex items-center space-x-3 self-end sm:self-auto">
                          {item.points !== null && (
                            <span className="text-xs font-sans font-bold text-[#161821] dark:text-[#45d320]">
                              {item.points} {tr(lang, 'б.', 'pts')}
                            </span>
                          )}

                          {item.grade === 5 && (
                            <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                              {tr(lang, 'Отлично (5)', 'Excellent (5)')}
                            </span>
                          )}
                          {item.grade === 4 && (
                            <span className="px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-semibold text-xs">
                              {tr(lang, 'Хорошо (4)', 'Good (4)')}
                            </span>
                          )}
                          {item.grade === 3 && (
                            <span className="px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold text-xs">
                              {tr(lang, 'Удовл. (3)', 'Satisfactory (3)')}
                            </span>
                          )}
                          {item.grade === 2 && (
                            <span className="px-2.5 py-1 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold text-xs">
                              {tr(lang, 'Неудовл. (2)', 'Unsatisfactory (2)')}
                            </span>
                          )}
                          {!item.grade && item.creditStatus === 'earned' && (
                            <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                              {tr(lang, 'Зачтено', 'Passed')}
                            </span>
                          )}
                          {!item.grade && item.creditStatus === 'in_progress' && (
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs">
                              {tr(lang, 'В процессе', 'In Progress')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: REQUESTS & PETITIONS */}
            {activeTab === 'requests' && (
              <div className="space-y-3">
                {requests.length === 0 ? (
                  <div className="p-8 text-center text-[#475569] dark:text-[#94A3B8] text-xs font-sans">
                    {tr(
                      lang,
                      'Студент еще не подавал заявлений в деканат.',
                      'This student has not filed any requests yet.'
                    )}
                  </div>
                ) : (
                  requests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] space-y-2 text-xs font-sans"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-[#161821] dark:text-[#45d320]">
                          {localizeText(req.typeTitle, lang)}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                            req.status === 'ready'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : req.status === 'in_review'
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                                : req.status === 'needs_info'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {getRequestStatusLabel(req.status, lang, 'student')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#475569] dark:text-[#94A3B8] font-sans">
                        <span>№ {req.id}</span>
                        <span>•</span>
                        <span>
                          {tr(lang, 'Подано:', 'Submitted:')}{' '}
                          {new Date(req.createdAt).toLocaleDateString(
                            lang === 'ru' ? 'ru-RU' : 'en-US'
                          )}
                        </span>
                        <span>•</span>
                        <span>
                          {tr(lang, 'Срок: до', 'Due:')} {req.expectedDate}
                        </span>
                      </div>

                      {req.data && Object.keys(req.data).length > 0 && (
                        <div className="p-2.5 rounded-lg bg-white dark:bg-[#171c26] border border-[#e2e4e8] dark:border-[#273142] grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                          {Object.entries(req.data).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-[#475569] dark:text-[#94A3B8] capitalize">{k}: </span>
                              <span className="font-medium text-[#161821] dark:text-[#FFFFFF]">
                                {String(v)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Action Footer for Staff */}
          <div className="p-4 sm:p-5 bg-[#f6f6f9] dark:bg-[#111714] border-t border-[#e2e4e8] dark:border-[#273142] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowTranscript(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 min-h-[44px] rounded-lg bg-white dark:bg-[#1e2533] hover:bg-[#ebeef3] dark:hover:bg-[#233029] text-[#161821] dark:text-[#45d320] text-xs font-semibold border border-[#e2e4e8] dark:border-[#273142] transition-colors cursor-pointer shadow-xs"
              >
                <FileCheck className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                <span>
                  {tr(lang, 'Сформировать выписку успеваемости', 'Generate Academic Transcript')}
                </span>
              </button>

              <button
                onClick={() => {
                  if (onSendMessage) {
                    onSendMessage(profile.fullName, profile.id, profile.group);
                  }
                  onClose();
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 min-h-[44px] rounded-lg bg-[#161821] hover:bg-[#11141c] text-[#FFFFFF] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                <span>
                  {tr(lang, 'Отправить персональное уведомление', 'Send Direct Notification')}
                </span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-xs font-sans text-[#475569] dark:text-[#94A3B8] hover:text-[#161821] dark:hover:text-[#FFFFFF] hover:bg-[#ebeef3] dark:hover:bg-[#1e2533] transition-colors cursor-pointer"
            >
              {tr(lang, 'Закрыть', 'Close')}
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Official Transcript Modal */}
      {showTranscript && (
        <OfficialTranscriptModal dossier={dossier} onClose={() => setShowTranscript(false)} />
      )}
    </>
  );
};
