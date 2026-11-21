import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  MapPin,
  Download,
  Filter,
  CheckCircle,
  Edit3,
  Shield,
  X,
  Plus,
} from 'lucide-react';
import { ScheduleEntry, ScheduleStatus, ExamEntry } from '../types';
import { api } from '../services/api';
import { ExamEditModal } from '../components/ExamEditModal';
import {
  tr,
  getScheduleTypeLabel,
  getScheduleStatusLabel,
  getExamStatusLabel,
  normalizeScheduleType,
  localizeText,
} from '../utils/i18n';

function getEntryDayOfWeek(item: ScheduleEntry): number {
  if (typeof item.dayOfWeek === 'number') return item.dayOfWeek;
  if (!item.date) return 1;
  const [y, m, d] = item.date.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const dow = dt.getDay();
  return dow === 0 ? 7 : dow;
}

export const SchedulePage: React.FC = () => {
  const { user, profile, lang } = useAuth();
  const isStaff = user?.role === 'staff';

  const [selectedGroup, setSelectedGroup] = useState<string>(() => {
    if (isStaff) return 'ДУ-101';
    return profile?.group || 'ДУ-101';
  });

  const studentGroup = profile?.group || 'ДУ-101';
  const activeGroup = isStaff ? selectedGroup : studentGroup;

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
    let cancelled = false;
    const activeGrp = isStaff ? selectedGroup : studentGroup;
    (async () => {
      try {
        const [data, examData] = await Promise.all([
          api.getSchedule(undefined, activeGrp),
          api.getExams(activeGrp),
        ]);
        if (!cancelled) {
          setSchedule(data);
          setExams(examData);
        }
      } catch (err) {
        console.error('Error loading schedule:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isStaff, selectedGroup, studentGroup]);

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

  const filteredSchedule = schedule
    .filter((item) => {
      const itemDay = getEntryDayOfWeek(item);
      const dayMatch = viewMode === 'week' ? true : itemDay === selectedDay;
      const normalizedType = normalizeScheduleType(item.type);
      const typeMatch = filterType === 'all' ? true : normalizedType === filterType;
      return dayMatch && typeMatch;
    })
    .sort((a, b) => {
      const dayDiff = getEntryDayOfWeek(a) - getEntryDayOfWeek(b);
      if (dayDiff !== 0) return dayDiff;
      return a.start.localeCompare(b.start);
    });

  const handleExportIcs = () => {
    const dtStamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d+Z$/, 'Z');
    const formatIcsDateTime = (dateStr: string, timeStr: string) => {
      const compactDate = dateStr.replace(/-/g, '');
      const compactTime = timeStr.replace(/:/g, '') + '00';
      return `${compactDate}T${compactTime}`;
    };

    const escapeIcs = (str: string) =>
      str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

    const events = schedule
      .filter((s) => s.status !== 'cancelled')
      .map((s) => {
        const dtStart = formatIcsDateTime(s.date, s.start);
        const dtEnd = formatIcsDateTime(s.date, s.end);
        return [
          'BEGIN:VEVENT',
          `UID:${s.id}@demotech.edu`,
          `DTSTAMP:${dtStamp}`,
          `DTSTART:${dtStart}`,
          `DTEND:${dtEnd}`,
          `SUMMARY:${escapeIcs(s.subject)}`,
          `LOCATION:${escapeIcs(s.room)}`,
          `DESCRIPTION:${escapeIcs(`${s.teacher} (${s.type})`)}`,
          'STATUS:CONFIRMED',
          'END:VEVENT',
        ].join('\r\n');
      })
      .join('\r\n');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DemoTech University//Schedule//RU',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      events,
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `demotech-schedule-${activeGroup}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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

      const subjName = localizeText(editingEntry.subject, lang);
      setFeedbackMsg(
        notifyGroup
          ? tr(
              lang,
              `Изменения по занятию «${subjName}» сохранены. Студенты группы ${selectedGroup} оповещены!`,
              `Schedule changes for "${subjName}" saved. Group ${selectedGroup} has been notified!`
            )
          : tr(
              lang,
              `Изменения по занятию «${subjName}» успешно сохранены!`,
              `Schedule changes for "${subjName}" saved successfully!`
            )
      );

      setEditingEntry(null);
      await loadScheduleData(selectedGroup);
      setTimeout(() => setFeedbackMsg(null), 6000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      alert(
        message ||
          tr(lang, 'Ошибка сохранения изменений в расписании', 'Failed to save schedule changes')
      );
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
      const subjName = localizeText(editingEntry.subject, lang);
      setFeedbackMsg(
        tr(
          lang,
          `Занятие «${subjName}» возвращено в штатное расписание.`,
          `Class "${subjName}" restored to regular schedule.`
        )
      );
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
      subject: tr(lang, 'Новая дисциплина', 'New Discipline'),
      format: tr(lang, 'Устный экзамен по билетам', 'Oral Examination'),
      examiner: tr(lang, 'Преподаватель кафедры', 'Department Examiner'),
      date: tr(lang, '28 декабря 2026', 'Dec 28, 2026'),
      time: '10:00 – 14:00',
      room: tr(lang, 'Главный корпус, ауд. 312', 'Main Bldg, Room 312'),
      consultation: tr(lang, '26 декабря в 15:00', 'Dec 26 at 15:00'),
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
      const existsInList = exams.some((e) => e.id === examId);
      if (existsInList) {
        await api.updateExam(examId, changes);
      } else if (editingExam) {
        const { id: _ignoreId, ...rest } = editingExam;
        await api.createExam({ ...rest, ...changes });
      }
      const subjName = localizeText(changes.subject ?? editingExam?.subject, lang);
      setFeedbackMsg(
        changes.notifyGroup !== false
          ? tr(
              lang,
              `График экзамена по дисциплине «${subjName}» обновлен. Студенты группы ${selectedGroup} оповещены!`,
              `Exam schedule for "${subjName}" updated. Group ${selectedGroup} has been notified!`
            )
          : tr(
              lang,
              `График экзамена по дисциплине «${subjName}» успешно сохранен!`,
              `Exam schedule for "${subjName}" saved successfully!`
            )
      );
      await loadScheduleData(selectedGroup);
      setTimeout(() => setFeedbackMsg(null), 6000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      alert(message || tr(lang, 'Ошибка сохранения экзамена', 'Failed to save exam'));
    }
  };

  const handleResetExam = async (examId: string) => {
    try {
      await api.resetExam(examId);
      setFeedbackMsg(
        tr(
          lang,
          'Экзамен возвращен в штатный график сессии.',
          'Exam restored to regular session schedule.'
        )
      );
      await loadScheduleData(selectedGroup);
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      alert(message || tr(lang, 'Ошибка сброса экзамена', 'Failed to reset exam'));
    }
  };

  if (loading && schedule.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-28 bg-[#e2e4e8]/40 dark:bg-[#1e2533] rounded-xl" />
        <div className="h-96 bg-[#e2e4e8]/40 dark:bg-[#1e2533] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Feedback banner */}
      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-[#161821] text-[#FFFFFF] border border-[#33b712]/50 flex items-center justify-between shadow-md animate-fade-in text-xs font-sans">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-[#166534] dark:text-[#45d320] flex-shrink-0" />
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
        <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-[#161821]/15 via-[#161821]/10 to-[#f6f6f9] dark:to-[#171c26] border border-[#161821]/30 dark:border-[#273142] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#161821] text-[#45d320] flex items-center justify-center flex-shrink-0 shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-sm text-[#161821] dark:text-[#45d320]">
                  {tr(
                    lang,
                    'Служебный режим диспетчера деканата: Управление расписанием',
                    "Dean's Office Dispatcher Mode: Timetable Management"
                  )}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#33b712]/20 text-[#161821] dark:text-[#45d320] border border-[#33b712]/40">
                  {tr(lang, 'ПРАВА ДЕКАНАТА', 'DEAN AUTHORITY')}
                </span>
              </div>
              <p className="text-xs text-[#475569] dark:text-[#CBD5E1] font-sans mt-0.5 leading-relaxed">
                {tr(
                  lang,
                  'Вы можете переносить время занятий, заменять аудитории и отменять пары. При сохранении система автоматически отправит push-уведомление группе.',
                  'You can reschedule classes, reassign rooms, and cancel sessions. Saving automatically notifies the selected student group.'
                )}
              </p>
            </div>
          </div>

          {/* Group Selector for Staff */}
          <div className="flex items-center space-x-2 bg-white dark:bg-[#121620] p-1.5 rounded-lg border border-[#e2e4e8] dark:border-[#273142] self-start sm:self-center">
            <label htmlFor="staff-group-select" className="text-xs font-sans font-semibold text-[#475569] dark:text-[#94A3B8] pl-1.5">
              {tr(lang, 'Группа:', 'Group:')}
            </label>
            <select
              id="staff-group-select"
              aria-label={tr(lang, 'Группа:', 'Group:')}
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-[#161821] dark:text-[#45d320] focus:outline-none cursor-pointer pr-2"
            >
              <option value="ДУ-101">
                {tr(lang, 'ДУ-101 (2 курс, МО)', 'ДУ-101 (Year 2, IR)')}
              </option>
              <option value="ДУ-205">
                {tr(lang, 'ДУ-205 (3 курс, Мировая эк.)', 'ДУ-205 (Year 3, World Econ)')}
              </option>
            </select>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & DUAL MODE SELECTOR (Classes vs Exam Session)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e2e4e8] dark:border-[#273142]">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-sans text-[#161821] dark:text-[#45d320] font-semibold mb-1">
            <span>
              {tr(lang, `Академическая группа: ${activeGroup}`, `Academic Group: ${activeGroup}`)}
            </span>
            <span>•</span>
            <span>{tr(lang, 'Осенний семестр 2026/2027', 'Fall Term 2026/2027')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#161821] dark:text-[#FFFFFF]">
            {activeSubTab === 'classes'
              ? lang === 'ru'
                ? 'Академическое расписание'
                : 'Lecture Timetable'
              : lang === 'ru'
                ? 'Программа экзаменационной сессии'
                : 'Examination Session'}
          </h1>
          <p className="text-xs text-[#475569] dark:text-[#CBD5E1] font-sans mt-0.5">
            {tr(
              lang,
              'Учебные занятия, поточные лекции, семинары и экзаменационные комиссии',
              'Lectures, seminars, lab sessions, and official examination boards'
            )}
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main SubTab Toggle (Classes vs Exams) */}
          <div className="flex items-center bg-[#f6f6f9] dark:bg-[#121620] rounded-lg p-1 border border-[#e2e4e8] dark:border-[#273142] text-xs font-sans font-medium">
            <button
              onClick={() => setActiveSubTab('classes')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeSubTab === 'classes'
                  ? 'bg-[#161821] text-[#FFFFFF] font-semibold shadow-xs'
                  : 'text-[#475569] dark:text-[#CBD5E1] hover:text-[#161821]'
              }`}
            >
              {lang === 'ru' ? 'Занятия' : 'Classes'}
            </button>
            <button
              onClick={() => setActiveSubTab('exams')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeSubTab === 'exams'
                  ? 'bg-[#161821] text-[#FFFFFF] font-semibold shadow-xs'
                  : 'text-[#475569] dark:text-[#CBD5E1] hover:text-[#161821]'
              }`}
            >
              {lang === 'ru' ? 'Экзамены и сессия' : 'Exams & Session'}
            </button>
          </div>

          {activeSubTab === 'classes' && (
            <>
              {/* Day vs Week Mode Toggle */}
              <div className="flex items-center bg-[#f6f6f9] dark:bg-[#121620] rounded-lg p-1 border border-[#e2e4e8] dark:border-[#273142] text-xs font-sans font-medium">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === 'day'
                      ? 'bg-[#161821] text-[#FFFFFF] font-semibold shadow-xs'
                      : 'text-[#475569] dark:text-[#CBD5E1]'
                  }`}
                >
                  {lang === 'ru' ? 'День' : 'Day'}
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === 'week'
                      ? 'bg-[#161821] text-[#FFFFFF] font-semibold shadow-xs'
                      : 'text-[#475569] dark:text-[#CBD5E1]'
                  }`}
                >
                  {lang === 'ru' ? 'Вся неделя' : 'Week'}
                </button>
              </div>

              {/* ICS Export */}
              <button
                onClick={handleExportIcs}
                title={tr(
                  lang,
                  'Экспорт в персональный календарь (.ics)',
                  'Export to personal calendar (.ics)'
                )}
                className="p-2 sm:px-3 sm:py-2 rounded-lg bg-[#f6f6f9] dark:bg-[#121620] hover:bg-[#ebeef3] dark:hover:bg-[#1E2923] text-[#161821] dark:text-[#FFFFFF] border border-[#e2e4e8] dark:border-[#273142] transition-colors flex items-center space-x-1.5 text-xs font-sans font-medium cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                <span className="hidden sm:inline">{tr(lang, 'Экспорт .ICS', 'Export .ICS')}</span>
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
              {daysList.map((day) => {
                const isSelected = selectedDay === day.num;
                return (
                  <button
                    key={day.num}
                    onClick={() => setSelectedDay(day.num)}
                    className={`py-3 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#161821] text-[#FFFFFF] border-[#161821] shadow-sm ring-1 ring-[#33b712]/40'
                        : 'bg-white dark:bg-[#171c26] text-[#475569] dark:text-[#CBD5E1] hover:bg-[#f6f6f9] dark:hover:bg-[#1e2533] border-[#e2e4e8] dark:border-[#273142]'
                    }`}
                  >
                    <span className="block text-[10px] font-mono tracking-wider opacity-80 uppercase">
                      {day.short}
                    </span>
                    <span className="hidden sm:block text-xs font-semibold mt-0.5">
                      {day.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Class Type Filter Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs pb-1 font-sans">
            <Filter className="w-3.5 h-3.5 text-[#475569] dark:text-[#94A3B8] mr-1 flex-shrink-0" />
            {[
              { id: 'all', label: tr(lang, 'Все форматы', 'All Formats') },
              { id: 'lecture', label: tr(lang, 'Лекции', 'Lectures') },
              { id: 'seminar', label: tr(lang, 'Семинары', 'Seminars') },
              { id: 'lab', label: tr(lang, 'Лабораторные', 'Labs') },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1 rounded-lg border text-xs whitespace-nowrap transition-colors cursor-pointer ${
                  filterType === f.id
                    ? 'bg-[#161821] text-[#FFFFFF] border-[#161821] font-semibold'
                    : 'bg-white dark:bg-[#171c26] text-[#475569] dark:text-[#CBD5E1] border-[#e2e4e8] dark:border-[#273142]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Timetable List (ETH Modernist Grid) */}
          <div className="space-y-3">
            {filteredSchedule.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#171c26] rounded-xl border border-[#e2e4e8] dark:border-[#273142] space-y-2">
                <CalendarIcon className="w-8 h-8 text-[#475569] dark:text-[#94A3B8] mx-auto opacity-50" />
                <p className="text-sm font-semibold text-[#161821] dark:text-[#FFFFFF]">
                  {filterType !== 'all'
                    ? tr(
                        lang,
                        'Занятий выбранного формата нет',
                        'No classes match the selected format'
                      )
                    : tr(lang, 'В этот день занятий нет', 'No classes scheduled for this day')}
                </p>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                  {filterType !== 'all'
                    ? tr(
                        lang,
                        'Попробуйте переключить фильтр или выбрать режим «Вся неделя».',
                        'Try changing the class type filter or switching to Week view.'
                      )
                    : tr(
                        lang,
                        'Свободный день для самостоятельной научно-исследовательской работы и библиотеки',
                        'Free day for independent research and library study'
                      )}
                </p>
                {filterType !== 'all' && (
                  <button
                    onClick={() => setFilterType('all')}
                    className="mt-1 px-3 py-1 rounded-lg bg-[#161821] text-[#FFFFFF] text-xs font-medium hover:bg-[#11141c] cursor-pointer"
                  >
                    {tr(lang, 'Показать все форматы', 'Show All Formats')}
                  </button>
                )}
              </div>
            ) : (
              filteredSchedule.map((item, idx) => {
                const isCanceled = item.status === 'cancelled';
                const isMoved = item.status === 'moved';
                const isRoomChanged = item.status === 'room_changed';
                const dayInfo = daysList.find((d) => d.num === getEntryDayOfWeek(item));

                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                      isCanceled
                        ? 'bg-[#ff4d8b]/5 dark:bg-[#ff4d8b]/15 border-[#ff4d8b]/30'
                        : isMoved || isRoomChanged
                          ? 'bg-[#33b712]/10 dark:bg-[#33b712]/15 border-[#33b712]/40'
                          : 'bg-white dark:bg-[#171c26] border-[#e2e4e8] dark:border-[#273142] shadow-xs'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5">
                      {/* Period Badge */}
                      <div className="w-10 h-10 rounded-lg bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] flex flex-col items-center justify-center flex-shrink-0 text-center">
                        <span className="font-mono text-xs font-bold text-[#161821] dark:text-[#45d320]">
                          {idx + 1}
                        </span>
                        <span className="text-[8px] font-sans uppercase text-[#475569] dark:text-[#94A3B8]">
                          {tr(lang, 'пара', 'slot')}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {viewMode === 'week' && dayInfo && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#161821] text-[#FFFFFF]">
                              {dayInfo.short}
                            </span>
                          )}
                          <span className="text-xs font-mono font-bold text-[#161821] dark:text-[#45d320]">
                            {item.start} – {item.end}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#f6f6f9] dark:bg-[#121620] text-[#475569] dark:text-[#94A3B8] border border-[#e2e4e8] dark:border-[#273142]">
                            {getScheduleTypeLabel(item.type, lang)}
                          </span>
                          {isCanceled && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#be123c] text-white">
                              {getScheduleStatusLabel('cancelled', lang)}
                            </span>
                          )}
                          {isMoved && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#166534] text-white">
                              {getScheduleStatusLabel('moved', lang)}
                            </span>
                          )}
                          {isRoomChanged && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#166534] text-white">
                              {getScheduleStatusLabel('room_changed', lang)}
                            </span>
                          )}
                        </div>

                        <h3
                          className={`font-semibold text-base ${isCanceled ? 'line-through text-[#475569] dark:text-[#94A3B8]' : 'text-[#161821] dark:text-[#FFFFFF]'}`}
                        >
                          {localizeText(item.subject, lang)}
                        </h3>

                        <p className="text-xs text-[#475569] dark:text-[#CBD5E1] font-sans">
                          {tr(lang, 'Преподаватель:', 'Instructor:')}{' '}
                          <strong className="text-[#161821] dark:text-[#FFFFFF]">
                            {item.teacher}
                          </strong>
                        </p>

                        {item.changeNote && (
                          <p className="text-xs font-mono text-[#be123c] dark:text-[#fecdd3] font-medium pt-0.5">
                            {tr(lang, 'Примечание деканата:', "Dean's note:")} {item.changeNote}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#e2e4e8] dark:border-[#273142]">
                      <div className="flex items-center space-x-1.5 font-mono text-xs font-bold text-[#161821] dark:text-[#45d320]">
                        <MapPin className="w-4 h-4 text-[#be123c] dark:text-[#fecdd3]" />
                        <span>{item.room}</span>
                      </div>

                      {isStaff && (
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-2.5 py-1 rounded-md bg-[#161821] text-[#FFFFFF] text-xs font-sans font-medium hover:bg-[#11141c] flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320]" />
                          <span>{tr(lang, 'Изменить', 'Edit')}</span>
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
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#171c26] border border-[#e2e4e8] dark:border-[#273142] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-[#161821] dark:text-[#45d320]">
                  {tr(
                    lang,
                    'Зимняя промежуточная аттестация 2026/2027',
                    'Winter Examination Session 2026/2027'
                  )}
                </span>
                <span>•</span>
                <span className="text-xs text-[#475569] dark:text-[#94A3B8]">
                  {tr(lang, `Группа ${activeGroup}`, `Group ${activeGroup}`)}
                </span>
              </div>
              <h3 className="font-semibold text-base text-[#161821] dark:text-[#FFFFFF]">
                {isStaff
                  ? tr(
                      lang,
                      'Диспетчер экзаменационной сессии факультета',
                      'Faculty Examination Session Dispatcher'
                    )
                  : tr(lang, 'График экзаменов и консультаций', 'Exam & Consultation Timetable')}
              </h3>
              <p className="text-xs text-[#475569] dark:text-[#CBD5E1] font-sans max-w-2xl">
                {isStaff
                  ? tr(
                      lang,
                      'Управление датами экзаменов, комиссиями и аудиториями. Любые изменения автоматически направляются студентам группы.',
                      'Manage exam dates, examination boards, and rooms. Any changes automatically notify the student group.'
                    )
                  : tr(
                      lang,
                      'Студенты допускаются к экзаменам при выполнении программы текущего контроля (от 50 баллов БРС). Обязательно наличие студенческого билета.',
                      'Students are admitted to exams upon completing continuous assessment (50+ rating points). Student ID is mandatory.'
                    )}
              </p>
            </div>

            {isStaff && (
              <button
                onClick={handleAddNewExam}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-[#161821] hover:bg-[#11141c] text-[#FFFFFF] text-xs font-sans font-semibold border border-[#33b712]/40 shadow-xs transition-colors cursor-pointer self-start sm:self-auto flex-shrink-0"
              >
                <Plus className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                <span>{tr(lang, 'Назначить экзамен / пересдачу', 'Schedule Exam / Retake')}</span>
              </button>
            )}
          </div>

          {/* Exam Cards List */}
          <div className="space-y-3">
            {exams.length === 0 ? (
              <div className="p-12 text-center text-xs font-sans text-[#475569] dark:text-[#94A3B8] bg-white dark:bg-[#171c26] rounded-xl border border-[#e2e4e8] dark:border-[#273142]">
                {tr(
                  lang,
                  `Для группы ${activeGroup} экзамены пока не назначены.`,
                  `No exams scheduled yet for group ${activeGroup}.`
                )}
              </div>
            ) : (
              exams.map((ex) => {
                const isDateChanged = ex.status === 'date_changed';
                const isRoomChanged = ex.status === 'room_changed';
                const isPostponed = ex.status === 'postponed';
                const isCancelled = ex.status === 'cancelled';

                return (
                  <div
                    key={ex.id}
                    className={`p-5 rounded-xl border shadow-xs space-y-3.5 transition-all ${
                      isCancelled
                        ? 'bg-[#ff4d8b]/5 dark:bg-[#ff4d8b]/15 border-[#ff4d8b]/40'
                        : isDateChanged || isPostponed
                          ? 'bg-[#33b712]/10 dark:bg-[#33b712]/15 border-[#33b712]/60'
                          : isRoomChanged
                            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                            : ex.isDebt
                              ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                              : 'bg-white dark:bg-[#171c26] border-[#e2e4e8] dark:border-[#273142]'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#e2e4e8] dark:border-[#273142] pb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#161821] text-[#FFFFFF]">
                          {ex.code}
                        </span>
                        <h4
                          className={`font-semibold text-base ${isCancelled ? 'line-through text-[#475569] dark:text-[#94A3B8]' : 'text-[#161821] dark:text-[#FFFFFF]'}`}
                        >
                          {localizeText(ex.subject, lang)}
                        </h4>

                        {/* Status Badges */}
                        {isDateChanged && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#166534] text-white">
                            {getExamStatusLabel('date_changed', lang)}
                          </span>
                        )}
                        {isRoomChanged && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                            {getExamStatusLabel('room_changed', lang)}
                          </span>
                        )}
                        {isPostponed && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-700 text-white">
                            {getExamStatusLabel('postponed', lang)}
                          </span>
                        )}
                        {isCancelled && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#be123c] text-white">
                            {getExamStatusLabel('cancelled', lang)}
                          </span>
                        )}
                        {ex.isDebt && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#be123c] text-white">
                            {tr(lang, 'КОМИССИОННАЯ ПЕРЕСДАЧА', 'COMMITTEE RETAKE')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-auto">
                        <span className="text-xs font-mono font-bold text-[#161821] dark:text-[#45d320]">
                          {ex.credits} ECTS
                        </span>
                        {isStaff && (
                          <button
                            onClick={() => handleOpenEditExam(ex)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#161821] hover:bg-[#11141c] text-[#FFFFFF] text-xs font-sans font-semibold transition-colors cursor-pointer shadow-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320]" />
                            <span>{tr(lang, 'Изменить дату / комиссию', 'Edit Date / Board')}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-[#475569] dark:text-[#94A3B8] block">
                          {tr(lang, 'Формат аттестации', 'Assessment Format')}
                        </span>
                        <span className="font-medium text-[#161821] dark:text-[#FFFFFF]">
                          {localizeText(ex.format, lang)}
                        </span>
                        <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-0.5">
                          {tr(lang, 'Экзаменатор:', 'Examiner:')}{' '}
                          <strong className="text-[#161821] dark:text-[#FFFFFF]">
                            {ex.examiner}
                          </strong>
                        </p>
                        {ex.commissionMembers && (
                          <p className="text-[10px] text-[#475569] dark:text-[#94A3B8] mt-0.5">
                            {tr(lang, 'Комиссия:', 'Board:')} {ex.commissionMembers}
                          </p>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-mono text-[#475569] dark:text-[#94A3B8] block">
                          {tr(lang, 'Дата и время экзамена', 'Exam Date & Time')}
                        </span>
                        <span
                          className={`font-bold text-sm block ${isDateChanged ? 'text-[#166534] dark:text-[#45d320]' : 'text-[#161821] dark:text-[#FFFFFF]'}`}
                        >
                          {ex.date}
                        </span>
                        <p className="text-[11px] text-[#475569] dark:text-[#CBD5E1] font-mono mt-0.5">
                          {tr(lang, 'Время:', 'Time:')} {ex.time}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-mono text-[#475569] dark:text-[#94A3B8] block">
                          {tr(lang, 'Место и консультация', 'Location & Consultation')}
                        </span>
                        <div className="flex items-center space-x-1 font-medium text-[#161821] dark:text-[#FFFFFF]">
                          <MapPin className="w-3.5 h-3.5 text-[#be123c] dark:text-[#fecdd3]" />
                          <span>{ex.room}</span>
                        </div>
                        <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-0.5">
                          {tr(lang, 'Консультация:', 'Consultation:')} {ex.consultation}
                        </p>
                      </div>
                    </div>

                    {/* Dean's Official Change Note if present */}
                    {ex.changeNote && (
                      <div className="p-2.5 rounded-lg bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] text-xs font-mono text-[#161821] dark:text-[#45d320] flex items-center space-x-2">
                        <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>
                          {tr(lang, 'Основание деканата:', "Dean's notice:")} {ex.changeNote}
                        </span>
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
          <div className="relative w-full max-w-lg bg-white dark:bg-[#171c26] rounded-xl border border-[#e2e4e8] dark:border-[#273142] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e4e8] dark:border-[#273142]">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-[#161821] dark:text-[#45d320]" />
                <h3 className="font-semibold text-base text-[#161821] dark:text-[#FFFFFF]">
                  {tr(lang, 'Управление занятием:', 'Manage Class:')}{' '}
                  {localizeText(editingEntry.subject, lang)}
                </h3>
              </div>
              <button
                onClick={() => setEditingEntry(null)}
                aria-label={tr(lang, 'Закрыть', 'Close')}
                className="text-[#475569] dark:text-[#94A3B8] hover:text-[#161821] dark:hover:text-[#FFFFFF] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScheduleChange} className="space-y-4 text-xs font-sans">
              <div>
                <label htmlFor="edit-class-status-select" className="block font-medium text-[#161821] dark:text-[#FFFFFF] mb-1">
                  {tr(lang, 'Статус проведения занятия:', 'Class Status:')}
                </label>
                <select
                  id="edit-class-status-select"
                  aria-label={tr(lang, 'Статус проведения занятия:', 'Class Status:')}
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ScheduleStatus)}
                  className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-lg p-2.5 text-xs text-[#161821] dark:text-[#FFFFFF]"
                >
                  <option value="normal">
                    {tr(lang, 'Штатное проведение (по расписанию)', 'Regular schedule')}
                  </option>
                  <option value="room_changed">
                    {tr(lang, 'Замена аудитории', 'Room changed')}
                  </option>
                  <option value="moved">
                    {tr(lang, 'Перенос времени проведения', 'Time rescheduled')}
                  </option>
                  <option value="cancelled">{tr(lang, 'Отмена занятия', 'Class cancelled')}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-class-start-input" className="block font-medium text-[#161821] dark:text-[#FFFFFF] mb-1">
                    {tr(lang, 'Время начала:', 'Start time:')}
                  </label>
                  <input
                    id="edit-class-start-input"
                    aria-label={tr(lang, 'Время начала:', 'Start time:')}
                    type="time"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-lg p-2 font-mono text-xs text-[#161821] dark:text-[#FFFFFF]"
                  />
                </div>
                <div>
                  <label htmlFor="edit-class-end-input" className="block font-medium text-[#161821] dark:text-[#FFFFFF] mb-1">
                    {tr(lang, 'Время окончания:', 'End time:')}
                  </label>
                  <input
                    id="edit-class-end-input"
                    aria-label={tr(lang, 'Время окончания:', 'End time:')}
                    type="time"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-lg p-2 font-mono text-xs text-[#161821] dark:text-[#FFFFFF]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-class-room-input" className="block font-medium text-[#161821] dark:text-[#FFFFFF] mb-1">
                  {tr(lang, 'Аудитория:', 'Room:')}
                </label>
                <input
                  id="edit-class-room-input"
                  aria-label={tr(lang, 'Аудитория:', 'Room:')}
                  type="text"
                  value={editRoom}
                  onChange={(e) => setEditRoom(e.target.value)}
                  placeholder={tr(
                    lang,
                    'Например: Ауд. 312, Дистанционно (Zoom)',
                    'e.g. Room 312, Online (Zoom)'
                  )}
                  className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-lg p-2 text-xs text-[#161821] dark:text-[#FFFFFF]"
                />
              </div>

              <div>
                <label htmlFor="edit-class-note-textarea" className="block font-medium text-[#161821] dark:text-[#FFFFFF] mb-1">
                  {tr(lang, 'Официальное примечание деканата:', "Official Dean's Office Note:")}
                </label>
                <textarea
                  id="edit-class-note-textarea"
                  aria-label={tr(lang, 'Официальное примечание деканата:', "Official Dean's Office Note:")}
                  rows={2}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder={tr(
                    lang,
                    'Причина замены, ссылка на онлайн-конференцию или указания старосте...',
                    'Reason for change, online meeting link, or instructions...'
                  )}
                  className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-lg p-2 text-xs text-[#161821] dark:text-[#FFFFFF]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="notifyCheck"
                  checked={notifyGroup}
                  onChange={(e) => setNotifyGroup(e.target.checked)}
                  className="rounded border-[#e2e4e8] text-[#161821] focus:ring-[#161821]"
                />
                <label
                  htmlFor="notifyCheck"
                  className="text-xs text-[#161821] dark:text-[#FFFFFF] cursor-pointer"
                >
                  {tr(
                    lang,
                    `Отправить push-уведомление студентам группы ${selectedGroup}`,
                    `Send push notification to group ${selectedGroup}`
                  )}
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#e2e4e8] dark:border-[#273142]">
                <button
                  type="button"
                  onClick={handleResetToNormal}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg border border-[#e2e4e8] dark:border-[#273142] hover:bg-[#f6f6f9] dark:hover:bg-[#1e2533] text-xs font-sans text-[#475569] dark:text-[#94A3B8] cursor-pointer"
                >
                  {tr(lang, 'Сбросить в штатное', 'Restore Regular')}
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingEntry(null)}
                    className="px-3 py-1.5 rounded-lg border border-[#e2e4e8] dark:border-[#273142] hover:bg-[#f6f6f9] dark:hover:bg-[#1e2533] text-xs font-sans text-[#475569] dark:text-[#94A3B8] cursor-pointer"
                  >
                    {tr(lang, 'Отмена', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 rounded-lg bg-[#161821] text-[#FFFFFF] text-xs font-sans font-semibold hover:bg-[#11141c] cursor-pointer"
                  >
                    {saving
                      ? tr(lang, 'Сохранение...', 'Saving...')
                      : tr(lang, 'Сохранить изменения', 'Save Changes')}
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
