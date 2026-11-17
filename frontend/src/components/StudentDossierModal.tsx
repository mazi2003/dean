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
  const [activeTab, setActiveTab] = useState<'profile' | 'grades' | 'requests'>('profile');
  const [showTranscript, setShowTranscript] = useState(false);

  if (!isOpen || !dossier) return null;

  const { profile, gradesSummary, requests } = dossier;
  const hasDebts = profile.debtCount > 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white dark:bg-[#112238] rounded-2xl max-w-4xl w-full border border-[#DCE2EA] dark:border-[#1E395B] shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-5 sm:p-6 bg-[#F8FAFC] dark:bg-[#111714] border-b border-[#DCE2EA] dark:border-[#193150] relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg text-[#667085] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF] hover:bg-[#EDF2F7] dark:hover:bg-[#162A45] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-5 pr-10">
              <div className="relative">
                <img
                  src={
                    profile.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                  }
                  alt={profile.fullName}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-[#245A91] shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#142D4E] border-2 border-white dark:border-[#112238] flex items-center justify-center text-[10px] text-[#245A91]">
                  ✓
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#142D4E] text-[#245A91]">
                    ГРУППА {profile.group}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-medium bg-[#EDF2F7] dark:bg-[#1E2923] text-[#0F1D30] dark:text-[#FFFFFF]">
                    {profile.year} курс
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-sans font-medium ${
                      profile.studyForm === 'Бюджет'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    {profile.studyForm}
                  </span>
                  {profile.isStarosta && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-bold bg-[#245A91]/20 text-[#1D4876] dark:text-[#245A91] border border-[#245A91]/40">
                      ★ Староста группы
                    </span>
                  )}
                  {hasDebts ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      Задолженность ({profile.debtCount})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      Успевает
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-semibold text-[#142D4E] dark:text-[#FFFFFF]">
                  {profile.fullName}
                </h2>
                <p className="text-xs text-[#667085] font-sans">
                  {profile.program} • Студ. билет: <span className="font-mono font-semibold">{profile.studentNumber}</span>
                </p>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-[#DCE2EA] dark:border-[#193150] text-xs font-sans">
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#162A45] border border-[#DCE2EA] dark:border-[#1E395B]">
                <span className="text-[10px] text-[#667085] block uppercase tracking-wider">
                  Средний балл (GPA)
                </span>
                <span className="font-mono text-lg font-bold text-[#142D4E] dark:text-[#245A91]">
                  {profile.gpa.toFixed(2)}
                </span>
                <span className="text-[10px] text-[#667085] block">из 5.0</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-[#162A45] border border-[#DCE2EA] dark:border-[#1E395B]">
                <span className="text-[10px] text-[#667085] block uppercase tracking-wider">
                  Рейтинг БРС
                </span>
                <span className="font-mono text-lg font-bold text-[#142D4E] dark:text-[#245A91]">
                  {profile.averageScore}%
                </span>
                <span className="text-[10px] text-[#667085] block">текущая успеваемость</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-[#162A45] border border-[#DCE2EA] dark:border-[#1E395B]">
                <span className="text-[10px] text-[#667085] block uppercase tracking-wider">
                  Кредиты ECTS
                </span>
                <span className="font-mono text-lg font-bold text-[#0F1D30] dark:text-[#FFFFFF]">
                  {gradesSummary.creditsEarned}
                </span>
                <span className="text-[10px] text-[#667085] block">из {gradesSummary.creditsRequired} за семестр</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-[#162A45] border border-[#DCE2EA] dark:border-[#1E395B]">
                <span className="text-[10px] text-[#667085] block uppercase tracking-wider">
                  Заявления в деканат
                </span>
                <span className="font-mono text-lg font-bold text-[#0F1D30] dark:text-[#FFFFFF]">
                  {requests.length}
                </span>
                <span className="text-[10px] text-[#667085] block">обращений подано</span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-2 mt-4 pt-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-[#142D4E] text-[#FFFFFF]'
                    : 'text-[#667085] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF] hover:bg-[#EDF2F7] dark:hover:bg-[#162A45]'
                }`}
              >
                Общие сведения и контакты
              </button>
              <button
                onClick={() => setActiveTab('grades')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'grades'
                    ? 'bg-[#142D4E] text-[#FFFFFF]'
                    : 'text-[#667085] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF] hover:bg-[#EDF2F7] dark:hover:bg-[#162A45]'
                }`}
              >
                <span>Успеваемость и зачетка</span>
                {hasDebts && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'requests'
                    ? 'bg-[#142D4E] text-[#FFFFFF]'
                    : 'text-[#667085] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF] hover:bg-[#EDF2F7] dark:hover:bg-[#162A45]'
                }`}
              >
                <span>Заявления и справки</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#DCE2EA] dark:bg-[#1E395B] font-mono">
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
                  <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] space-y-3">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-[#142D4E] dark:text-[#245A91] flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>Учебные реквизиты</span>
                    </h3>
                    <div className="space-y-2 text-xs font-sans">
                      <div>
                        <span className="text-[#667085] block text-[11px]">Факультет:</span>
                        <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF]">
                          {profile.faculty}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#667085] block text-[11px]">Направление подготовки:</span>
                        <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF]">
                          {profile.program}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[#667085] block text-[11px]">Номер студбилета:</span>
                          <span className="font-mono font-semibold">{profile.studentNumber}</span>
                        </div>
                        <div>
                          <span className="text-[#667085] block text-[11px]">Номер зачетки:</span>
                          <span className="font-mono font-semibold">{profile.recordBookNumber}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[#667085] block text-[11px]">Год зачисления:</span>
                          <span className="font-medium">{profile.admissionYear} г.</span>
                        </div>
                        <div>
                          <span className="text-[#667085] block text-[11px]">Форма финансирования:</span>
                          <span className="font-medium">{profile.studyForm}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact and Identity Information */}
                  <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] space-y-3">
                    <h3 className="font-semibold text-xs uppercase tracking-wider text-[#142D4E] dark:text-[#245A91] flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Контакты и место жительства</span>
                    </h3>
                    <div className="space-y-2.5 text-xs font-sans">
                      <div className="flex items-center space-x-2.5">
                        <Mail className="w-3.5 h-3.5 text-[#667085]" />
                        <div>
                          <span className="text-[#667085] block text-[10px]">Корпоративный email:</span>
                          <a
                            href={`mailto:${profile.email}`}
                            className="font-medium text-[#142D4E] dark:text-[#245A91] hover:underline"
                          >
                            {profile.email}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <Phone className="w-3.5 h-3.5 text-[#667085]" />
                        <div>
                          <span className="text-[#667085] block text-[10px]">Телефон для связи:</span>
                          <span className="font-mono font-medium">{profile.phone || '+7 (999) 000-00-00'}</span>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2.5">
                        <MapPin className="w-3.5 h-3.5 text-[#667085] mt-0.5" />
                        <div>
                          <span className="text-[#667085] block text-[10px]">Место проживания:</span>
                          <span className="font-medium">{profile.dormitoryInfo || 'г. Москва'}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#667085]" />
                        <div>
                          <span className="text-[#667085] block text-[10px]">СНИЛС:</span>
                          <span className="font-mono">{profile.snils || '184-293-841 02'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admission decree record */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#162A45] border border-[#DCE2EA] dark:border-[#1E395B] flex items-center justify-between text-xs font-sans">
                  <div>
                    <span className="font-semibold text-[#142D4E] dark:text-[#245A91] block">
                      Приказ о зачислении № 412-СТ
                    </span>
                    <span className="text-[#667085] text-[11px]">
                      Утвержден ректоратом 25.08.{profile.admissionYear}. Основание: результаты ЕГЭ / общий конкурс
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium text-[11px]">
                    Приказ исполнен
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
                        Академическая задолженность ({profile.debtCount})
                      </h4>
                      <p className="text-rose-800 dark:text-rose-300">
                        У студента не сданы дисциплины: {profile.debtSubjects?.join(', ') || 'Статистика'}.
                        Срок ликвидации задолженности по графику комиссионных пересдач — до 28 ноября 2026 г.
                      </p>
                    </div>
                  </div>
                )}

                {/* Exams List */}
                <div className="rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] overflow-hidden">
                  <div className="bg-[#F8FAFC] dark:bg-[#111714] px-4 py-2.5 border-b border-[#DCE2EA] dark:border-[#1E395B] flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#142D4E] dark:text-[#245A91]">
                      Экзаменационная ведомость — 3 семестр
                    </span>
                    <span className="text-[11px] font-mono text-[#667085]">
                      {gradesSummary.items.length} дисциплин
                    </span>
                  </div>

                  <div className="divide-y divide-[#DCE2EA] dark:divide-[#1E395B] bg-white dark:bg-[#112238]">
                    {gradesSummary.items.map(item => (
                      <div
                        key={item.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F8FAFC] dark:hover:bg-[#162A45]/40 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-semibold text-[#0F1D30] dark:text-[#FFFFFF]">
                            {item.subject}
                          </h4>
                          <p className="text-[11px] text-[#667085] font-sans">
                            {item.teacher || 'Кафедра международных отношений'} • {item.credits} З.Е. (ECTS) •{' '}
                            {item.assessmentType === 'exam' ? 'Экзамен' : item.assessmentType === 'credit' ? 'Зачет' : 'Курсовая'}
                          </p>
                        </div>

                        <div className="flex items-center space-x-3 self-end sm:self-auto">
                          {item.points !== null && (
                            <span className="text-xs font-mono font-bold text-[#142D4E] dark:text-[#245A91]">
                              {item.points} б.
                            </span>
                          )}

                          {item.grade === 5 && (
                            <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                              Отлично (5)
                            </span>
                          )}
                          {item.grade === 4 && (
                            <span className="px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-semibold text-xs">
                              Хорошо (4)
                            </span>
                          )}
                          {item.grade === 3 && (
                            <span className="px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold text-xs">
                              Удовл. (3)
                            </span>
                          )}
                          {item.grade === 2 && (
                            <span className="px-2.5 py-1 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold text-xs">
                              Неудовл. (2)
                            </span>
                          )}
                          {!item.grade && item.creditStatus === 'earned' && (
                            <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                              Зачтено
                            </span>
                          )}
                          {!item.grade && item.creditStatus === 'in_progress' && (
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs">
                              В процессе
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
                  <div className="p-8 text-center text-[#667085] text-xs font-sans">
                    Студент еще не подавал заявлений в деканат.
                  </div>
                ) : (
                  requests.map(req => (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] space-y-2 text-xs font-sans"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-[#142D4E] dark:text-[#245A91]">
                          {req.typeTitle}
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
                          {req.status === 'ready'
                            ? 'Готово к выдаче'
                            : req.status === 'in_review'
                            ? 'На рассмотрении'
                            : req.status === 'needs_info'
                            ? 'Требует уточнения'
                            : req.status === 'submitted'
                            ? 'Подано'
                            : req.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#667085] font-mono">
                        <span>№ {req.id}</span>
                        <span>•</span>
                        <span>Подано: {new Date(req.createdAt).toLocaleDateString('ru-RU')}</span>
                        <span>•</span>
                        <span>Срок: до {req.expectedDate}</span>
                      </div>

                      {req.data && Object.keys(req.data).length > 0 && (
                        <div className="p-2.5 rounded-lg bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                          {Object.entries(req.data).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-[#667085] capitalize">{k}: </span>
                              <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF]">{String(v)}</span>
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
          <div className="p-4 sm:p-5 bg-[#F8FAFC] dark:bg-[#111714] border-t border-[#DCE2EA] dark:border-[#193150] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowTranscript(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#162A45] hover:bg-[#EDF2F7] dark:hover:bg-[#233029] text-[#142D4E] dark:text-[#245A91] text-xs font-semibold border border-[#DCE2EA] dark:border-[#1E395B] transition-colors cursor-pointer shadow-xs"
              >
                <FileCheck className="w-4 h-4 text-[#245A91]" />
                <span>Сформировать выписку успеваемости</span>
              </button>

              <button
                onClick={() => {
                  if (onSendMessage) {
                    onSendMessage(profile.fullName, profile.id, profile.group);
                  }
                  onClose();
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4 text-[#245A91]" />
                <span>Отправить персональное уведомление</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-sans text-[#667085] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF] hover:bg-[#EDF2F7] dark:hover:bg-[#162A45] transition-colors cursor-pointer"
            >
              Закрыть
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
