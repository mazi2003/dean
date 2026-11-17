import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  AlertTriangle,
  Download,
  Filter,
  CheckCircle,
  Building,
  User,
  Edit3,
  Shield,
  X,
  BellRing,
  RotateCcw,
  Sparkles,
  FileBadge,
  GraduationCap,
  Award,
  Plus,
} from 'lucide-react';
import { ScheduleEntry, ScheduleStatus, ExamEntry } from '../types';
import { api } from '../services/api';
import { ExamEditModal } from '../components/ExamEditModal';

export const SchedulePage: React.FC = () => {
  const { user, profile, lang } = useAuth();
  const isStaff = user?.role === 'staff';

  const [selectedGroup, setSelectedGroup] = useState<string>(() => {
    if (isStaff) return 'ДУ-101';
    return profile?.group || 'ДУ-101';
  });

  const [activeSubTab, setActiveSubTab] = useState<'classes' | 'exams'>('classes');
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [exams, setExams] = useState<ExamEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1); // 1=Mon ... 6=Sat
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Staff Schedule Modification Modal State
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
  const [editStatus, setEditStatus] = useState<ScheduleStatus>('normal');
  const [editRoom, setEditRoom] = useState<string>('');
  const [editStart, setEditStart] = useState<string>('');
  const [editEnd, setEditEnd] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [notifyGroup, setNotifyGroup] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Staff Exam Modification Modal State
  const [editingExam, setEditingExam] = useState<ExamEntry | null>(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);

  const loadScheduleData = async (groupToLoad: string) => {
    try {
      setLoading(true);
      const [data, examData] = await Promise.all([
        api.getSchedule(undefined, groupToLoad),
        api.getExams(groupToLoad),
      ]);
      setSchedule(data);
      setExams(examData);
    } catch (err) {
      console.error('Error loading schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const activeGrp = isStaff ? selectedGroup : profile?.group || 'ДУ-101';
    loadScheduleData(activeGrp);
  }, [user, selectedGroup]);

  const daysRu = [
    { num: 1, short: 'ПН', label: 'Понедельник' },
    { num: 2, short: 'ВТ', label: 'Вторник' },
    { num: 3, short: 'СР', label: 'Среда' },
    { num: 4, short: 'ЧТ', label: 'Четверг' },
    { num: 5, short: 'ПТ', label: 'Пятница' },
    { num: 6, short: 'СБ', label: 'Суббота' },
  ];

  const daysEn = [
    { num: 1, short: 'MON', label: 'Monday' },
    { num: 2, short: 'TUE', label: 'Tuesday' },
    { num: 3, short: 'WED', label: 'Wednesday' },
    { num: 4, short: 'THU', label: 'Thursday' },
    { num: 5, short: 'FRI', label: 'Friday' },
    { num: 6, short: 'SAT', label: 'Saturday' },
  ];

  const daysList = lang === 'ru' ? daysRu : daysEn;

  const filteredSchedule = schedule.filter(item => {
    const dayMatch = viewMode === 'week' ? true : item.dayOfWeek === selectedDay;
    const typeMatch = filterType === 'all' ? true : item.type === filterType;
    return dayMatch && typeMatch;
  });

  const handleExportIcs = () => {
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//DemoTech University//Schedule//RU\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n${schedule
      .map(
        s =>
          `BEGIN:VEVENT\nSUMMARY:${s.subject}\nLOCATION:${s.room}\nDESCRIPTION:${s.teacher} (${s.type})\nSTATUS:CONFIRMED\nEND:VEVENT`
      )
      .join('\n')}\nEND:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `demotech-schedule-${selectedGroup}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenEdit = (entry: ScheduleEntry) => {
    setEditingEntry(entry);
    setEditStatus(entry.status || 'normal');
    setEditRoom(entry.room || '');
    setEditStart(entry.start || '08:30');
    setEditEnd(entry.end || '10:05');
    setEditNote(entry.changeNote || '');
    setNotifyGroup(true);
  };

  const handleSaveScheduleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    setSaving(true);
    try {
      await api.updateScheduleEntry(editingEntry.id, {
        status: editStatus,
        room: editRoom,
        start: editStart,
        end: editEnd,
        note: editNote,
        notifyGroup,
      });

      setFeedbackMsg(
        notifyGroup
          ? `Изменения по занятию «${editingEntry.subject}» сохранены. Студенты группы ${selectedGroup} оповещены!`
          : `Изменения по занятию «${editingEntry.subject}» успешно сохранены!`
      );

      setEditingEntry(null);
      await loadScheduleData(selectedGroup);
      setTimeout(() => setFeedbackMsg(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения изменений в расписании');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToNormal = async () => {
    if (!editingEntry) return;
    setSaving(true);
    try {
      await api.updateScheduleEntry(editingEntry.id, {
        status: 'normal',
        room: editingEntry.room,
        start: editingEntry.start,
        end: editingEntry.end,
        note: '',
        notifyGroup: false,
      });
      setFeedbackMsg(`Занятие «${editingEntry.subject}» возвращено в штатное расписание.`);
      setEditingEntry(null);
      await loadScheduleData(selectedGroup);
      setTimeout(() => setFeedbackMsg(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Staff Exam Management Handlers
  const handleOpenEditExam = (exam: ExamEntry) => {
    setEditingExam(exam);
    setIsExamModalOpen(true);
  };

  const handleAddNewExam = () => {
    const dummyNew: ExamEntry = {
      id: `ex-${Date.now()}`,
      code: `DISP-${Math.floor(100 + Math.random() * 900)}`,
      groupId: selectedGroup,
      subject: 'Новая дисциплина',
      format: 'Устный экзамен по билетам',
      examiner: 'Преподаватель кафедры',
      date: '28 декабря 2026',
      time: '10:00 – 14:00',
      room: 'Главный корпус, ауд. 312',
      consultation: '26 декабря в 15:00',
      credits: 4,
      status: 'scheduled',
    };
    setEditingExam(dummyNew);
    setIsExamModalOpen(true);
  };

  const handleSaveExamChange = async (
    examId: string,
    changes: Partial<ExamEntry> & { notifyGroup?: boolean }
  ) => {
    try {
      await api.updateExam(examId, changes);
      setFeedbackMsg(
        changes.notifyGroup !== false
          ? `График экзамена по дисциплине «${editingExam?.subject}» обновлен. Студенты группы ${selectedGroup} оповещены!`
          : `График экзамена по дисциплине «${editingExam?.subject}» успешно сохранен!`
      );
      await loadScheduleData(selectedGroup);
      setTimeout(() => setFeedbackMsg(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения экзамена');
    }
  };

  const handleResetExam = async (examId: string) => {
    try {
      await api.resetExam(examId);
      setFeedbackMsg('Экзамен возвращен в штатный график сессии.');
      await loadScheduleData(selectedGroup);
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Ошибка сброса экзамена');
    }
  };

  if (loading && schedule.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-28 bg-[#DCE2EA]/40 dark:bg-[#162A45] rounded-xl" />
        <div className="h-96 bg-[#DCE2EA]/40 dark:bg-[#162A45] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Feedback banner */}
      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-[#142D4E] text-[#FFFFFF] border border-[#245A91]/50 flex items-center justify-between shadow-md animate-fade-in text-xs font-sans">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-[#245A91] flex-shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-[#FFFFFF]/70 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Staff Dispatcher Mode Notice Banner */}
      {isStaff && (
        <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-[#142D4E]/15 via-[#142D4E]/10 to-[#F8FAFC] dark:to-[#112238] border border-[#142D4E]/30 dark:border-[#1E395B] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#142D4E] text-[#245A91] flex items-center justify-center flex-shrink-0 shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif font-bold text-sm text-[#142D4E] dark:text-[#245A91]">
                  Служебный режим диспетчера деканата: Управление расписанием
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#245A91]/20 text-[#142D4E] dark:text-[#245A91] border border-[#245A91]/40">
                  ПРАВА ДЕКАНАТА
                </span>
              </div>
              <p className="text-xs text-[#475467] dark:text-[#CBD5E1] font-sans mt-0.5 leading-relaxed">
                Вы можете переносить время занятий, заменять аудитории и отменять пары. При сохранении система автоматически отправит push-уведомление группе.
              </p>
            </div>
          </div>

          {/* Group Selector for Staff */}
          <div className="flex items-center space-x-2 bg-white dark:bg-[#0E1B2D] p-1.5 rounded-lg border border-[#DCE2EA] dark:border-[#1E395B] self-start sm:self-center">
            <span className="text-xs font-sans font-semibold text-[#667085] pl-1.5">
              Группа:
            </span>
            <select
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-[#142D4E] dark:text-[#245A91] focus:outline-none cursor-pointer pr-2"
            >
              <option value="ДУ-101">ДУ-101 (2 курс, МО)</option>
              <option value="ДУ-205">ДУ-205 (3 курс, Мировая эк.)</option>
            </select>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & DUAL MODE SELECTOR (Classes vs Exam Session)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#DCE2EA] dark:border-[#193150]">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#142D4E] dark:text-[#245A91] font-semibold mb-1">
            <span>Академическая группа: {selectedGroup}</span>
            <span>•</span>
            <span>Осенний семестр 2026/2027</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#0F1D30] dark:text-[#FFFFFF]">
            {activeSubTab === 'classes'
              ? (lang === 'ru' ? 'Академическое расписание' : 'Lecture Timetable')
              : (lang === 'ru' ? 'Программа экзаменационной сессии' : 'Examination Session')}
          </h1>
          <p className="text-xs text-[#475467] dark:text-[#CBD5E1] font-sans mt-0.5">
            Учебные занятия, поточные лекции, семинары и экзаменационные комиссии
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main SubTab Toggle (Classes vs Exams) */}
          <div className="flex items-center bg-[#F8FAFC] dark:bg-[#0E1B2D] rounded-lg p-1 border border-[#DCE2EA] dark:border-[#1E395B] text-xs font-sans font-medium">
            <button
              onClick={() => setActiveSubTab('classes')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeSubTab === 'classes'
                  ? 'bg-[#142D4E] text-[#FFFFFF] font-semibold shadow-xs'
                  : 'text-[#475467] dark:text-[#CBD5E1] hover:text-[#0F1D30]'
              }`}
            >
              {lang === 'ru' ? 'Занятия' : 'Lectures'}
            </button>
            <button
              onClick={() => setActiveSubTab('exams')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeSubTab === 'exams'
                  ? 'bg-[#142D4E] text-[#FFFFFF] font-semibold shadow-xs'
                  : 'text-[#475467] dark:text-[#CBD5E1] hover:text-[#0F1D30]'
              }`}
            >
              {lang === 'ru' ? 'Экзамены и сессия' : 'Exams & Session'}
            </button>
          </div>

          {activeSubTab === 'classes' && (
            <>
              {/* Day vs Week Mode Toggle */}
              <div className="flex items-center bg-[#F8FAFC] dark:bg-[#0E1B2D] rounded-lg p-1 border border-[#DCE2EA] dark:border-[#1E395B] text-xs font-sans font-medium">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === 'day'
                      ? 'bg-[#142D4E] text-[#FFFFFF] font-semibold shadow-xs'
                      : 'text-[#475467] dark:text-[#CBD5E1]'
                  }`}
                >
                  {lang === 'ru' ? 'День' : 'Day'}
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === 'week'
                      ? 'bg-[#142D4E] text-[#FFFFFF] font-semibold shadow-xs'
                      : 'text-[#475467] dark:text-[#CBD5E1]'
                  }`}
                >
                  {lang === 'ru' ? 'Вся неделя' : 'Week'}
                </button>
              </div>

              {/* ICS Export */}
              <button
                onClick={handleExportIcs}
                title="Экспорт в персональный календарь (.ics)"
                className="p-2 sm:px-3 sm:py-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] hover:bg-[#EDF2F7] dark:hover:bg-[#1E2923] text-[#0F1D30] dark:text-[#FFFFFF] border border-[#DCE2EA] dark:border-[#1E395B] transition-colors flex items-center space-x-1.5 text-xs font-sans font-medium cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#245A91]" />
                <span className="hidden sm:inline">Экспорт .ICS</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CLASSES VIEW
          ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'classes' && (
        <>
          {/* Day of the Week Selector Bar */}
          {viewMode === 'day' && (
            <div className="grid grid-cols-6 gap-2">
              {daysList.map(day => {
                const isSelected = selectedDay === day.num;
                return (
                  <button
                    key={day.num}
                    onClick={() => setSelectedDay(day.num)}
                    className={`py-3 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#142D4E] text-[#FFFFFF] border-[#142D4E] shadow-sm ring-1 ring-[#245A91]/40'
                        : 'bg-white dark:bg-[#112238] text-[#475467] dark:text-[#CBD5E1] hover:bg-[#F8FAFC] dark:hover:bg-[#162A45] border-[#DCE2EA] dark:border-[#1E395B]'
                    }`}
                  >
                    <span className="block text-[10px] font-mono tracking-wider opacity-80 uppercase">
                      {day.short}
                    </span>
                    <span className="hidden sm:block text-xs font-serif font-bold mt-0.5">
                      {day.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Class Type Filter Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs pb-1 font-sans">
            <Filter className="w-3.5 h-3.5 text-[#667085] mr-1 flex-shrink-0" />
            {[
              { id: 'all', label: 'Все форматы' },
              { id: 'лекция', label: 'Лекции' },
              { id: 'семинар', label: 'Семинары' },
              { id: 'лабораторная', label: 'Лабораторные' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1 rounded-lg border text-xs whitespace-nowrap transition-colors cursor-pointer ${
                  filterType === f.id
                    ? 'bg-[#142D4E] text-[#FFFFFF] border-[#142D4E] font-semibold'
                    : 'bg-white dark:bg-[#112238] text-[#475467] dark:text-[#CBD5E1] border-[#DCE2EA] dark:border-[#1E395B]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Timetable List (ETH Modernist Grid) */}
          <div className="space-y-3">
            {filteredSchedule.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] space-y-2">
                <CalendarIcon className="w-8 h-8 text-[#667085] mx-auto opacity-50" />
                <p className="text-sm font-serif font-bold text-[#0F1D30] dark:text-[#FFFFFF]">
                  В этот день занятий нет
                </p>
                <p className="text-xs text-[#667085]">
                  Свободный день для самостоятельной научно-исследовательской работы и библиотеки
                </p>
              </div>
            ) : (
              filteredSchedule.map((item, idx) => {
                const isCanceled = item.status === 'cancelled';
                const isMoved = item.status === 'moved';
                const isRoomChanged = item.status === 'room_changed';

                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                      isCanceled
                        ? 'bg-[#C63740]/5 dark:bg-[#C63740]/15 border-[#C63740]/30'
                        : isMoved || isRoomChanged
                        ? 'bg-[#245A91]/10 dark:bg-[#245A91]/15 border-[#245A91]/40'
                        : 'bg-white dark:bg-[#112238] border-[#DCE2EA] dark:border-[#1E395B] shadow-xs'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5">
                      {/* Period Badge */}
                      <div className="w-10 h-10 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] flex flex-col items-center justify-center flex-shrink-0 text-center">
                        <span className="font-mono text-xs font-bold text-[#142D4E] dark:text-[#245A91]">
                          {idx + 1}
                        </span>
                        <span className="text-[8px] font-sans uppercase text-[#667085]">пара</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#142D4E] dark:text-[#245A91]">
                            {item.start} – {item.end}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#F8FAFC] dark:bg-[#0E1B2D] text-[#667085] border border-[#DCE2EA] dark:border-[#1E395B]">
                            {item.type}
                          </span>
                          {isCanceled && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#C63740] text-white">
                              ОТМЕНЕНО ДЕКАНАТОМ
                            </span>
                          )}
                          {isMoved && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#245A91] text-[#142D4E]">
                              ПЕРЕНОС ВРЕМЕНИ
                            </span>
                          )}
                          {isRoomChanged && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#245A91] text-[#142D4E]">
                              ЗАМЕНА АУДИТОРИИ
                            </span>
                          )}
                        </div>

                        <h3 className={`font-serif font-bold text-base ${isCanceled ? 'line-through text-[#667085]' : 'text-[#0F1D30] dark:text-[#FFFFFF]'}`}>
                          {item.subject}
                        </h3>

                        <p className="text-xs text-[#475467] dark:text-[#CBD5E1] font-sans">
                          Преподаватель: <strong className="text-[#0F1D30] dark:text-[#FFFFFF]">{item.teacher}</strong>
                        </p>

                        {item.changeNote && (
                          <p className="text-xs font-mono text-[#C63740] dark:text-[#F06A73] font-medium pt-0.5">
                            Примечание деканата: {item.changeNote}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#DCE2EA] dark:border-[#193150]">
                      <div className="flex items-center space-x-1.5 font-mono text-xs font-bold text-[#142D4E] dark:text-[#245A91]">
                        <MapPin className="w-4 h-4 text-[#C63740]" />
                        <span>{item.room}</span>
                      </div>

                      {isStaff && (
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-2.5 py-1 rounded-md bg-[#142D4E] text-[#FFFFFF] text-xs font-sans font-medium hover:bg-[#0E1F36] flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#245A91]" />
                          <span>Изменить</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          EXAMINATION PROGRAM VIEW (Dynamic Dean's Dispatcher & Student Registry)
          ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'exams' && (
        <div className="space-y-4">
          {/* Dean's Session Control Bar */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-[#142D4E] dark:text-[#245A91]">
                  Зимняя промежуточная аттестация 2026/2027
                </span>
                <span>•</span>
                <span className="text-xs text-[#667085]">Группа {selectedGroup}</span>
              </div>
              <h3 className="font-serif font-bold text-base text-[#0F1D30] dark:text-[#FFFFFF]">
                {isStaff
                  ? 'Диспетчер экзаменационной сессии факультета'
                  : 'График экзаменов и консультаций'}
              </h3>
              <p className="text-xs text-[#475467] dark:text-[#CBD5E1] font-sans max-w-2xl">
                {isStaff
                  ? 'Управление датами экзаменов, комиссиями и аудиториями. Любые изменения автоматически направляются студентам группы.'
                  : 'Студенты допускаются к экзаменам при выполнении программы текущего контроля (от 50 баллов БРС). Обязательно наличие студенческого билета.'}
              </p>
            </div>

            {isStaff && (
              <button
                onClick={handleAddNewExam}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] text-xs font-sans font-semibold border border-[#245A91]/40 shadow-xs transition-colors cursor-pointer self-start sm:self-auto flex-shrink-0"
              >
                <Plus className="w-4 h-4 text-[#245A91]" />
                <span>Назначить экзамен / пересдачу</span>
              </button>
            )}
          </div>

          {/* Exam Cards List */}
          <div className="space-y-3">
            {exams.length === 0 ? (
              <div className="p-12 text-center text-xs font-sans text-[#667085] bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B]">
                Для группы {selectedGroup} экзамены пока не назначены.
              </div>
            ) : (
              exams.map((ex) => {
                const isDateChanged = ex.status === 'date_changed';
                const isRoomChanged = ex.status === 'room_changed';
                const isPostponed = ex.status === 'postponed';
                const isCancelled = ex.status === 'cancelled';
                const isChanged = isDateChanged || isRoomChanged || isPostponed || isCancelled;

                return (
                  <div
                    key={ex.id}
                    className={`p-5 rounded-xl border shadow-xs space-y-3.5 transition-all ${
                      isCancelled
                        ? 'bg-[#C63740]/5 dark:bg-[#C63740]/15 border-[#C63740]/40'
                        : isDateChanged || isPostponed
                        ? 'bg-[#245A91]/10 dark:bg-[#245A91]/15 border-[#245A91]/60'
                        : isRoomChanged
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                        : ex.isDebt
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                        : 'bg-white dark:bg-[#112238] border-[#DCE2EA] dark:border-[#1E395B]'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#DCE2EA] dark:border-[#193150] pb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#142D4E] text-[#FFFFFF]">
                          {ex.code}
                        </span>
                        <h4 className={`font-serif font-bold text-base ${isCancelled ? 'line-through text-[#667085]' : 'text-[#0F1D30] dark:text-[#FFFFFF]'}`}>
                          {ex.subject}
                        </h4>

                        {/* Status Badges */}
                        {isDateChanged && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#245A91] text-[#142D4E]">
                            ДАТА ПЕРЕНЕСЕНА ДЕКАНАТОМ
                          </span>
                        )}
                        {isRoomChanged && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                            ЗАМЕНА АУДИТОРИИ
                          </span>
                        )}
                        {isPostponed && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-700 text-white">
                            ПЕРЕНЕСЕНО НА РЕЗЕРВНЫЙ ДЕНЬ
                          </span>
                        )}
                        {isCancelled && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#C63740] text-white">
                            ЭКЗАМЕН ОТМЕНЕН
                          </span>
                        )}
                        {ex.isDebt && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#C63740] text-white">
                            КОМИССИОННАЯ ПЕРЕСДАЧА
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-auto">
                        <span className="text-xs font-mono font-bold text-[#142D4E] dark:text-[#245A91]">
                          {ex.credits} ECTS
                        </span>
                        {isStaff && (
                          <button
                            onClick={() => handleOpenEditExam(ex)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] text-xs font-sans font-semibold transition-colors cursor-pointer shadow-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#245A91]" />
                            <span>Изменить дату / комиссию</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-[#667085] block">
                          Формат аттестации
                        </span>
                        <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF]">
                          {ex.format}
                        </span>
                        <p className="text-[11px] text-[#667085] mt-0.5">
                          Экзаменатор: <strong className="text-[#0F1D30] dark:text-[#FFFFFF]">{ex.examiner}</strong>
                        </p>
                        {ex.commissionMembers && (
                          <p className="text-[10px] text-[#667085] mt-0.5">
                            Комиссия: {ex.commissionMembers}
                          </p>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-mono text-[#667085] block">
                          Дата и время экзамена
                        </span>
                        <span className={`font-bold text-sm block ${isDateChanged ? 'text-[#245A91]' : 'text-[#142D4E] dark:text-[#FFFFFF]'}`}>
                          {ex.date}
                        </span>
                        <p className="text-[11px] text-[#475467] dark:text-[#CBD5E1] font-mono mt-0.5">
                          Время: {ex.time}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-mono text-[#667085] block">
                          Место и консультация
                        </span>
                        <div className="flex items-center space-x-1 font-medium text-[#0F1D30] dark:text-[#FFFFFF]">
                          <MapPin className="w-3.5 h-3.5 text-[#C63740]" />
                          <span>{ex.room}</span>
                        </div>
                        <p className="text-[11px] text-[#667085] mt-0.5">
                          Консультация: {ex.consultation}
                        </p>
                      </div>
                    </div>

                    {/* Dean's Official Change Note if present */}
                    {ex.changeNote && (
                      <div className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] text-xs font-mono text-[#142D4E] dark:text-[#245A91] flex items-center space-x-2">
                        <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Основание деканата: {ex.changeNote}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          EXAM EDIT MODAL (Dean's Authority to reschedule exams)
          ───────────────────────────────────────────────────────────── */}
      <ExamEditModal
        exam={editingExam}
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        onSave={handleSaveExamChange}
        onReset={handleResetExam}
      />

      {/* ─────────────────────────────────────────────────────────────
          STAFF SCHEDULE EDIT MODAL (Full functionality preserved)
          ───────────────────────────────────────────────────────────── */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE2EA] dark:border-[#193150]">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-[#142D4E] dark:text-[#245A91]" />
                <h3 className="font-serif font-bold text-base text-[#0F1D30] dark:text-[#FFFFFF]">
                  Управление занятием: {editingEntry.subject}
                </h3>
              </div>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-[#667085] hover:text-[#0F1D30] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScheduleChange} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-medium text-[#0F1D30] dark:text-[#FFFFFF] mb-1">
                  Статус проведения занятия:
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as ScheduleStatus)}
                  className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg p-2.5 text-xs text-[#0F1D30] dark:text-[#FFFFFF]"
                >
                  <option value="normal">Штатное проведение (по расписанию)</option>
                  <option value="room_changed">Замена аудитории</option>
                  <option value="moved">Перенос времени проведения</option>
                  <option value="cancelled">Отмена занятия</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#0F1D30] dark:text-[#FFFFFF] mb-1">
                    Время начала:
                  </label>
                  <input
                    type="time"
                    value={editStart}
                    onChange={e => setEditStart(e.target.value)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg p-2 font-mono text-xs text-[#0F1D30] dark:text-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#0F1D30] dark:text-[#FFFFFF] mb-1">
                    Время окончания:
                  </label>
                  <input
                    type="time"
                    value={editEnd}
                    onChange={e => setEditEnd(e.target.value)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg p-2 font-mono text-xs text-[#0F1D30] dark:text-[#FFFFFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#0F1D30] dark:text-[#FFFFFF] mb-1">
                  Аудитория:
                </label>
                <input
                  type="text"
                  value={editRoom}
                  onChange={e => setEditRoom(e.target.value)}
                  placeholder="Например: Ауд. 312, Дистанционно (Zoom)"
                  className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg p-2 text-xs text-[#0F1D30] dark:text-[#FFFFFF]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#0F1D30] dark:text-[#FFFFFF] mb-1">
                  Официальное примечание деканата:
                </label>
                <textarea
                  rows={2}
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  placeholder="Причина замены, ссылка на онлайн-конференцию или указания старосте..."
                  className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg p-2 text-xs text-[#0F1D30] dark:text-[#FFFFFF]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="notifyCheck"
                  checked={notifyGroup}
                  onChange={e => setNotifyGroup(e.target.checked)}
                  className="rounded border-[#DCE2EA] text-[#142D4E] focus:ring-[#142D4E]"
                />
                <label htmlFor="notifyCheck" className="text-xs text-[#0F1D30] dark:text-[#FFFFFF] cursor-pointer">
                  Отправить push-уведомление студентам группы {selectedGroup}
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#DCE2EA] dark:border-[#193150]">
                <button
                  type="button"
                  onClick={handleResetToNormal}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg border border-[#DCE2EA] hover:bg-[#F8FAFC] text-xs font-sans text-[#667085] cursor-pointer"
                >
                  Сбросить в штатное
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingEntry(null)}
                    className="px-3 py-1.5 rounded-lg border border-[#DCE2EA] text-xs font-sans text-[#667085] cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 rounded-lg bg-[#142D4E] text-[#FFFFFF] text-xs font-sans font-semibold hover:bg-[#0E1F36] cursor-pointer"
                  >
                    {saving ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
