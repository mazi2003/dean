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
        <div className="bg-white dark:bg-[#161F1A] rounded-2xl max-w-4xl w-full border border-[#E3DDD1] dark:border-[#2D3E35] shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-5 sm:p-6 bg-[#FAF8F3] dark:bg-[#111714] border-b border-[#E3DDD1] dark:border-[#26362F] relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg text-[#7E877B] hover:text-[#252923] dark:hover:text-[#F3EFE5] hover:bg-[#EAE4D7] dark:hover:bg-[#1A2520] transition-colors cursor-pointer"
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
                  className="w-20 h-20 rounded-xl object-cover border-2 border-[#C4A46B] shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#183D35] border-2 border-white dark:border-[#161F1A] flex items-center justify-center text-[10px] text-[#C4A46B]">
                  ✓
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#183D35] text-[#C4A46B]">
                    ГРУППА {profile.group}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-medium bg-[#EAE4D7] dark:bg-[#1E2923] text-[#252923] dark:text-[#F3EFE5]">
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
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-sans font-bold bg-[#C4A46B]/20 text-[#8C6D37] dark:text-[#C4A46B] border border-[#C4A46B]/40">
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

                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#183D35] dark:text-[#F3EFE5]">
                  {profile.fullName}
                </h2>
                <p className="text-xs text-[#7E877B] font-sans">
                  {profile.program} • Студ. билет: <span className="font-mono font-semibold">{profile.studentNumber}</span>
                </p>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-[#E3DDD1] dark:border-[#26362F] text-xs font-sans">
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1A2520] border border-[#E3DDD1] dark:border-[#2D3E35]">
                <span className="text-[10px] text-[#7E877B] block uppercase tracking-wider">
                  Средний балл (GPA)
                </span>
                <span className="font-mono text-lg font-bold text-[#183D35] dark:text-[#C4A46B]">
                  {profile.gpa.toFixed(2)}
                </span>
                <span className="text-[10px] text-[#7E877B] block">из 5.0</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1A2520] border border-[#E3DDD1] dark:border-[#2D3E35]">
                <span className="text-[10px] text-[#7E877B] block uppercase tracking-wider">
                  Рейтинг БРС
                </span>
                <span className="font-mono text-lg font-bold text-[#183D35] dark:text-[#C4A46B]">
                  {profile.averageScore}%
                </span>
                <span className="text-[10px] text-[#7E877B] block">текущая успеваемость</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1A2520] border border-[#E3DDD1] dark:border-[#2D3E35]">
                <span className="text-[10px] text-[#7E877B] block uppercase tracking-wider">
                  Кредиты ECTS
                </span>
                <span className="font-mono text-lg font-bold text-[#252923] dark:text-[#F3EFE5]">
                  {gradesSummary.creditsEarned}
                </span>
                <span className="text-[10px] text-[#7E877B] block">из {gradesSummary.creditsRequired} за семестр</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1A2520] border border-[#E3DDD1] dark:border-[#2D3E35]">
                <span className="text-[10px] text-[#7E877B] block uppercase tracking-wider">
                  Заявления в деканат
                </span>
                <span className="font-mono text-lg font-bold text-[#252923] dark:text-[#F3EFE5]">
                  {requests.length}
                </span>
                <span className="text-[10px] text-[#7E877B] block">обращений подано</span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-2 mt-4 pt-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-[#183D35] text-[#F3EFE5]'
                    : 'text-[#7E877B] hover:text-[#252923] dark:hover:text-[#F3EFE5] hover:bg-[#EAE4D7] dark:hover:bg-[#1A2520]'
                }`}
              >
                Общие сведения и контакты
              </button>
              <button
                onClick={() => setActiveTab('grades')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'grades'
                    ? 'bg-[#183D35] text-[#F3EFE5]'
                    : 'text-[#7E877B] hover:text-[#252923] dark:hover:text-[#F3EFE5] hover:bg-[#EAE4D7] dark:hover:bg-[#1A2520]'
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
                    ? 'bg-[#183D35] text-[#F3EFE5]'
                    : 'text-[#7E877B] hover:text-[#252923] dark:hover:text-[#F3EFE5] hover:bg-[#EAE4D7] dark:hover:bg-[#1A2520]'
                }`}
              >
                <span>Заявления и справки</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#E3DDD1] dark:bg-[#2D3E35] font-mono">
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
                  <div className="p-4 rounded-xl bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] space-y-3">
                    <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#183D35] dark:text-[#C4A46B] flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>Учебные реквизиты</span>
                    </h3>
                    <div className="space-y-2 text-xs font-sans">
                      <div>
                        <span className="text-[#7E877B] block text-[11px]">Факультет:</span>
                        <span className="font-medium text-[#252923] dark:text-[#F3EFE5]">
                          {profile.faculty}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#7E877B] block text-[11px]">Направление подготовки:</span>
                        <span className="font-medium text-[#252923] dark:text-[#F3EFE5]">
                          {profile.program}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[#7E877B] block text-[11px]">Номер студбилета:</span>
                          <span className="font-mono font-semibold">{profile.studentNumber}</span>
                        </div>
                        <div>
                          <span className="text-[#7E877B] block text-[11px]">Номер зачетки:</span>
                          <span className="font-mono font-semibold">{profile.recordBookNumber}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[#7E877B] block text-[11px]">Год зачисления:</span>
                          <span className="font-medium">{profile.admissionYear} г.</span>
                        </div>
                        <div>
                          <span className="text-[#7E877B] block text-[11px]">Форма финансирования:</span>
                          <span className="font-medium">{profile.studyForm}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact and Identity Information */}
                  <div className="p-4 rounded-xl bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] space-y-3">
                    <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#183D35] dark:text-[#C4A46B] flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Контакты и место жительства</span>
                    </h3>
                    <div className="space-y-2.5 text-xs font-sans">
                      <div className="flex items-center space-x-2.5">
                        <Mail className="w-3.5 h-3.5 text-[#7E877B]" />
                        <div>
                          <span className="text-[#7E877B] block text-[10px]">Корпоративный email:</span>
                          <a
                            href={`mailto:${profile.email}`}
                            className="font-medium text-[#183D35] dark:text-[#C4A46B] hover:underline"
                          >
                            {profile.email}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <Phone className="w-3.5 h-3.5 text-[#7E877B]" />
                        <div>
                          <span className="text-[#7E877B] block text-[10px]">Телефон для связи:</span>
                          <span className="font-mono font-medium">{profile.phone || '+7 (999) 000-00-00'}</span>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2.5">
                        <MapPin className="w-3.5 h-3.5 text-[#7E877B] mt-0.5" />
                        <div>
                          <span className="text-[#7E877B] block text-[10px]">Место проживания:</span>
                          <span className="font-medium">{profile.dormitoryInfo || 'г. Москва'}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#7E877B]" />
                        <div>
                          <span className="text-[#7E877B] block text-[10px]">СНИЛС:</span>
                          <span className="font-mono">{profile.snils || '184-293-841 02'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admission decree record */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#1A2520] border border-[#E3DDD1] dark:border-[#2D3E35] flex items-center justify-between text-xs font-sans">
                  <div>
                    <span className="font-semibold text-[#183D35] dark:text-[#C4A46B] block">
                      Приказ о зачислении № 412-СТ
                    </span>
                    <span className="text-[#7E877B] text-[11px]">
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
                <div className="rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] overflow-hidden">
                  <div className="bg-[#FAF8F3] dark:bg-[#111714] px-4 py-2.5 border-b border-[#E3DDD1] dark:border-[#2D3E35] flex items-center justify-between">
                    <span className="text-xs font-serif font-bold uppercase tracking-wider text-[#183D35] dark:text-[#C4A46B]">
                      Экзаменационная ведомость — 3 семестр
                    </span>
                    <span className="text-[11px] font-mono text-[#7E877B]">
                      {gradesSummary.items.length} дисциплин
                    </span>
                  </div>

                  <div className="divide-y divide-[#E3DDD1] dark:divide-[#2D3E35] bg-white dark:bg-[#18221D]">
                    {gradesSummary.items.map(item => (
                      <div
                        key={item.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FAF8F3] dark:hover:bg-[#1A2520]/40 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-semibold text-[#252923] dark:text-[#F3EFE5]">
                            {item.subject}
                          </h4>
                          <p className="text-[11px] text-[#7E877B] font-sans">
                            {item.teacher || 'Кафедра международных отношений'} • {item.credits} З.Е. (ECTS) •{' '}
                            {item.assessmentType === 'exam' ? 'Экзамен' : item.assessmentType === 'credit' ? 'Зачет' : 'Курсовая'}
                          </p>
                        </div>

                        <div className="flex items-center space-x-3 self-end sm:self-auto">
                          {item.points !== null && (
                            <span className="text-xs font-mono font-bold text-[#183D35] dark:text-[#C4A46B]">
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
                  <div className="p-8 text-center text-[#7E877B] text-xs font-sans">
                    Студент еще не подавал заявлений в деканат.
                  </div>
                ) : (
                  requests.map(req => (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] space-y-2 text-xs font-sans"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-[#183D35] dark:text-[#C4A46B]">
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

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#7E877B] font-mono">
                        <span>№ {req.id}</span>
                        <span>•</span>
                        <span>Подано: {new Date(req.createdAt).toLocaleDateString('ru-RU')}</span>
                        <span>•</span>
                        <span>Срок: до {req.expectedDate}</span>
                      </div>

                      {req.data && Object.keys(req.data).length > 0 && (
                        <div className="p-2.5 rounded-lg bg-white dark:bg-[#18221D] border border-[#E3DDD1] dark:border-[#2D3E35] grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                          {Object.entries(req.data).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-[#7E877B] capitalize">{k}: </span>
                              <span className="font-medium text-[#252923] dark:text-[#F3EFE5]">{String(v)}</span>
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
          <div className="p-4 sm:p-5 bg-[#FAF8F3] dark:bg-[#111714] border-t border-[#E3DDD1] dark:border-[#26362F] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowTranscript(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#1A2520] hover:bg-[#EAE4D7] dark:hover:bg-[#233029] text-[#183D35] dark:text-[#C4A46B] text-xs font-semibold border border-[#E3DDD1] dark:border-[#2D3E35] transition-colors cursor-pointer shadow-xs"
              >
                <FileCheck className="w-4 h-4 text-[#C4A46B]" />
                <span>Сформировать выписку успеваемости</span>
              </button>

              <button
                onClick={() => {
                  if (onSendMessage) {
                    onSendMessage(profile.fullName, profile.id, profile.group);
                  }
                  onClose();
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#183D35] hover:bg-[#102923] text-[#F3EFE5] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4 text-[#C4A46B]" />
                <span>Отправить персональное уведомление</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-sans text-[#7E877B] hover:text-[#252923] dark:hover:text-[#F3EFE5] hover:bg-[#EAE4D7] dark:hover:bg-[#1A2520] transition-colors cursor-pointer"
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
