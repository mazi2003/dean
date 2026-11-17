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
} from 'lucide-react';
import { ScheduleEntry, ScheduleStatus } from '../types';
import { api } from '../services/api';

export const SchedulePage: React.FC = () => {
  const { user, profile, lang } = useAuth();
  const isStaff = user?.role === 'staff';

  const [selectedGroup, setSelectedGroup] = useState<string>(() => {
    if (isStaff) return 'ДУ-101';
    return profile?.group || 'ДУ-101';
  });

  const [activeSubTab, setActiveSubTab] = useState<'classes' | 'exams'>('classes');
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
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

  const loadScheduleData = async (groupToLoad: string) => {
    try {
      setLoading(true);
      const data = await api.getSchedule(undefined, groupToLoad);
      setSchedule(data);
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

  // Examination schedule data
  const examProgram = [
    {
      code: 'LAW-201',
      subject: 'Международное публичное право',
      format: 'Устный экзамен по билетам',
      examiner: 'Проф. Воронов А.Н.',
      date: '12 декабря 2026',
      time: '10:00 - 14:00',
      room: 'Главный корпус, ауд. 312',
      consultation: '10 декабря в 15:00',
      credits: 5,
    },
    {
      code: 'DIP-104',
      subject: 'История дипломатических отношений',
      format: 'Письменный экзамен и эссе',
      examiner: 'Доц. Романова Е.В.',
      date: '18 декабря 2026',
      time: '12:30 - 15:30',
      room: 'Конференц-зал Б',
      consultation: '16 декабря в 14:00',
      credits: 4,
    },
    {
      code: 'ECON-203',
      subject: 'Мировая экономика и международная торговля',
      format: 'Компьютерное тестирование и кейсы',
      examiner: 'Проф. Григорьев С.П.',
      date: '23 декабря 2026',
      time: '09:00 - 12:00',
      room: 'Компьютерный класс 208',
      consultation: '21 декабря в 16:00',
      credits: 5,
    },
    {
      code: 'STAT-102',
      subject: 'Математическая статистика и анализ данных',
      format: 'Комиссионная пересдача (Комиссия факультета)',
      examiner: 'Проф. Соколов Д.М., доц. Иванова К.А.',
      date: '28 ноября 2026',
      time: '14:00 - 17:00',
      room: 'Ауд. А-314',
      consultation: '26 ноября в 17:00',
      credits: 3,
      isDebt: profile?.studentNumber === 'СТ-2022-0082',
    },
  ];

  if (loading && schedule.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-28 bg-[#E3DDD1]/40 dark:bg-[#1A2520] rounded-xl" />
        <div className="h-96 bg-[#E3DDD1]/40 dark:bg-[#1A2520] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Feedback banner */}
      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-[#183D35] text-[#F3EFE5] border border-[#C4A46B]/50 flex items-center justify-between shadow-md animate-fade-in text-xs font-sans">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-[#C4A46B] flex-shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-[#F3EFE5]/70 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Staff Dispatcher Mode Notice Banner */}
      {isStaff && (
        <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-[#183D35]/15 via-[#183D35]/10 to-[#FAF8F3] dark:to-[#18221D] border border-[#183D35]/30 dark:border-[#2D3E35] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#183D35] text-[#C4A46B] flex items-center justify-center flex-shrink-0 shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif font-bold text-sm text-[#183D35] dark:text-[#C4A46B]">
                  Служебный режим диспетчера деканата: Управление расписанием
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C4A46B]/20 text-[#183D35] dark:text-[#C4A46B] border border-[#C4A46B]/40">
                  ПРАВА ДЕКАНАТА
                </span>
              </div>
              <p className="text-xs text-[#575F53] dark:text-[#C8D1CA] font-sans mt-0.5 leading-relaxed">
                Вы можете переносить время занятий, заменять аудитории и отменять пары. При сохранении система автоматически отправит push-уведомление группе.
              </p>
            </div>
          </div>

          {/* Group Selector for Staff */}
          <div className="flex items-center space-x-2 bg-white dark:bg-[#121714] p-1.5 rounded-lg border border-[#E3DDD1] dark:border-[#2D3E35] self-start sm:self-center">
            <span className="text-xs font-sans font-semibold text-[#7E877B] pl-1.5">
              Группа:
            </span>
            <select
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-[#183D35] dark:text-[#C4A46B] focus:outline-none cursor-pointer pr-2"
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E3DDD1] dark:border-[#26362F]">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#183D35] dark:text-[#C4A46B] font-semibold mb-1">
            <span>Академическая группа: {selectedGroup}</span>
            <span>•</span>
            <span>Осенний семестр 2026/2027</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#252923] dark:text-[#F3EFE5]">
            {activeSubTab === 'classes'
              ? (lang === 'ru' ? 'Академическое расписание' : 'Lecture Timetable')
              : (lang === 'ru' ? 'Программа экзаменационной сессии' : 'Examination Session')}
          </h1>
          <p className="text-xs text-[#575F53] dark:text-[#C8D1CA] font-sans mt-0.5">
            Учебные занятия, поточные лекции, семинары и экзаменационные комиссии
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main SubTab Toggle (Classes vs Exams) */}
          <div className="flex items-center bg-[#FAF8F3] dark:bg-[#121714] rounded-lg p-1 border border-[#E3DDD1] dark:border-[#2D3E35] text-xs font-sans font-medium">
            <button
              onClick={() => setActiveSubTab('classes')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeSubTab === 'classes'
                  ? 'bg-[#183D35] text-[#F3EFE5] font-semibold shadow-xs'
                  : 'text-[#575F53] dark:text-[#C8D1CA] hover:text-[#252923]'
              }`}
            >
              {lang === 'ru' ? 'Занятия' : 'Lectures'}
            </button>
            <button
              onClick={() => setActiveSubTab('exams')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeSubTab === 'exams'
                  ? 'bg-[#183D35] text-[#F3EFE5] font-semibold shadow-xs'
                  : 'text-[#575F53] dark:text-[#C8D1CA] hover:text-[#252923]'
              }`}
            >
              {lang === 'ru' ? 'Экзамены и сессия' : 'Exams & Session'}
            </button>
          </div>

          {activeSubTab === 'classes' && (
            <>
              {/* Day vs Week Mode Toggle */}
              <div className="flex items-center bg-[#FAF8F3] dark:bg-[#121714] rounded-lg p-1 border border-[#E3DDD1] dark:border-[#2D3E35] text-xs font-sans font-medium">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === 'day'
                      ? 'bg-[#183D35] text-[#F3EFE5] font-semibold shadow-xs'
                      : 'text-[#575F53] dark:text-[#C8D1CA]'
                  }`}
                >
                  {lang === 'ru' ? 'День' : 'Day'}
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    viewMode === 'week'
                      ? 'bg-[#183D35] text-[#F3EFE5] font-semibold shadow-xs'
                      : 'text-[#575F53] dark:text-[#C8D1CA]'
                  }`}
                >
                  {lang === 'ru' ? 'Вся неделя' : 'Week'}
                </button>
              </div>

              {/* ICS Export */}
              <button
                onClick={handleExportIcs}
                title="Экспорт в персональный календарь (.ics)"
                className="p-2 sm:px-3 sm:py-2 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] hover:bg-[#EAE4D7] dark:hover:bg-[#1E2923] text-[#252923] dark:text-[#F3EFE5] border border-[#E3DDD1] dark:border-[#2D3E35] transition-colors flex items-center space-x-1.5 text-xs font-sans font-medium cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#C4A46B]" />
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
                        ? 'bg-[#183D35] text-[#F3EFE5] border-[#183D35] shadow-sm ring-1 ring-[#C4A46B]/40'
                        : 'bg-white dark:bg-[#18221D] text-[#575F53] dark:text-[#C8D1CA] hover:bg-[#FAF8F3] dark:hover:bg-[#1F2C26] border-[#E3DDD1] dark:border-[#2D3E35]'
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
            <Filter className="w-3.5 h-3.5 text-[#7E877B] mr-1 flex-shrink-0" />
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
                    ? 'bg-[#183D35] text-[#F3EFE5] border-[#183D35] font-semibold'
                    : 'bg-white dark:bg-[#18221D] text-[#575F53] dark:text-[#C8D1CA] border-[#E3DDD1] dark:border-[#2D3E35]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Timetable List (ETH Modernist Grid) */}
          <div className="space-y-3">
            {filteredSchedule.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] space-y-2">
                <CalendarIcon className="w-8 h-8 text-[#7E877B] mx-auto opacity-50" />
                <p className="text-sm font-serif font-bold text-[#252923] dark:text-[#F3EFE5]">
                  В этот день занятий нет
                </p>
                <p className="text-xs text-[#7E877B]">
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
                        ? 'bg-[#A33D35]/5 dark:bg-[#A33D35]/15 border-[#A33D35]/30'
                        : isMoved || isRoomChanged
                        ? 'bg-[#C4A46B]/10 dark:bg-[#C4A46B]/15 border-[#C4A46B]/40'
                        : 'bg-white dark:bg-[#18221D] border-[#E3DDD1] dark:border-[#2D3E35] shadow-xs'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5">
                      {/* Period Badge */}
                      <div className="w-10 h-10 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] flex flex-col items-center justify-center flex-shrink-0 text-center">
                        <span className="font-mono text-xs font-bold text-[#183D35] dark:text-[#C4A46B]">
                          {idx + 1}
                        </span>
                        <span className="text-[8px] font-sans uppercase text-[#7E877B]">пара</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#183D35] dark:text-[#C4A46B]">
                            {item.start} – {item.end}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FAF8F3] dark:bg-[#121714] text-[#7E877B] border border-[#E3DDD1] dark:border-[#2D3E35]">
                            {item.type}
                          </span>
                          {isCanceled && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#A33D35] text-white">
                              ОТМЕНЕНО ДЕКАНАТОМ
                            </span>
                          )}
                          {isMoved && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#C4A46B] text-[#183D35]">
                              ПЕРЕНОС ВРЕМЕНИ
                            </span>
                          )}
                          {isRoomChanged && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#C4A46B] text-[#183D35]">
                              ЗАМЕНА АУДИТОРИИ
                            </span>
                          )}
                        </div>

                        <h3 className={`font-serif font-bold text-base ${isCanceled ? 'line-through text-[#7E877B]' : 'text-[#252923] dark:text-[#F3EFE5]'}`}>
                          {item.subject}
                        </h3>

                        <p className="text-xs text-[#575F53] dark:text-[#C8D1CA] font-sans">
                          Преподаватель: <strong className="text-[#252923] dark:text-[#F3EFE5]">{item.teacher}</strong>
                        </p>

                        {item.changeNote && (
                          <p className="text-xs font-mono text-[#A33D35] dark:text-[#E2766E] font-medium pt-0.5">
                            Примечание деканата: {item.changeNote}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E3DDD1] dark:border-[#26362F]">
                      <div className="flex items-center space-x-1.5 font-mono text-xs font-bold text-[#183D35] dark:text-[#C4A46B]">
                        <MapPin className="w-4 h-4 text-[#A33D35]" />
                        <span>{item.room}</span>
                      </div>

                      {isStaff && (
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-2.5 py-1 rounded-md bg-[#183D35] text-[#F3EFE5] text-xs font-sans font-medium hover:bg-[#102923] flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#C4A46B]" />
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
          EXAMINATION PROGRAM VIEW
          ───────────────────────────────────────────────────────────── */}
      {activeSubTab === 'exams' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#18221D] border border-[#E3DDD1] dark:border-[#2D3E35] shadow-xs">
            <h3 className="font-serif font-bold text-sm text-[#252923] dark:text-[#F3EFE5] mb-1">
              Регламент проведения зимней промежуточной аттестации (2026/2027)
            </h3>
            <p className="text-xs text-[#575F53] dark:text-[#C8D1CA] font-sans leading-relaxed">
              Студенты допускаются к экзаменам при условии отсутствия академических задолженностей по предшествующему семестру и выполнения программы текущего контроля (минимум 50 баллов БРС). На экзамен обязательно предъявление студенческого билета.
            </p>
          </div>

          <div className="space-y-3">
            {examProgram.map((ex, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-xl border shadow-xs space-y-3 ${
                  ex.isDebt
                    ? 'bg-[#A33D35]/5 dark:bg-[#A33D35]/15 border-[#A33D35]/40'
                    : 'bg-white dark:bg-[#18221D] border-[#E3DDD1] dark:border-[#2D3E35]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E3DDD1] dark:border-[#26362F] pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#183D35] text-[#F3EFE5]">
                      {ex.code}
                    </span>
                    <h4 className="font-serif font-bold text-base text-[#252923] dark:text-[#F3EFE5]">
                      {ex.subject}
                    </h4>
                    {ex.isDebt && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#A33D35] text-white">
                        КОМИССИОННАЯ ПЕРЕСДАЧА
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-[#183D35] dark:text-[#C4A46B]">
                    {ex.credits} ECTS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#7E877B] block">Формат экзамена</span>
                    <span className="font-medium text-[#252923] dark:text-[#F3EFE5]">{ex.format}</span>
                    <p className="text-[11px] text-[#7E877B] mt-0.5">Экзаменатор: {ex.examiner}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#7E877B] block">Дата и время экзамена</span>
                    <span className="font-bold text-[#183D35] dark:text-[#C4A46B]">{ex.date}</span>
                    <p className="text-[11px] text-[#575F53] dark:text-[#C8D1CA] mt-0.5">Время: {ex.time}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#7E877B] block">Место и консультация</span>
                    <span className="font-medium text-[#252923] dark:text-[#F3EFE5]">{ex.room}</span>
                    <p className="text-[11px] text-[#7E877B] mt-0.5">Консультация: {ex.consultation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAFF SCHEDULE EDIT MODAL (Full functionality preserved)
          ───────────────────────────────────────────────────────────── */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3DDD1] dark:border-[#26362F]">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-[#183D35] dark:text-[#C4A46B]" />
                <h3 className="font-serif font-bold text-base text-[#252923] dark:text-[#F3EFE5]">
                  Управление занятием: {editingEntry.subject}
                </h3>
              </div>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-[#7E877B] hover:text-[#252923] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScheduleChange} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-medium text-[#252923] dark:text-[#F3EFE5] mb-1">
                  Статус проведения занятия:
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as ScheduleStatus)}
                  className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg p-2.5 text-xs text-[#252923] dark:text-[#F3EFE5]"
                >
                  <option value="normal">Штатное проведение (по расписанию)</option>
                  <option value="room_changed">Замена аудитории</option>
                  <option value="moved">Перенос времени проведения</option>
                  <option value="cancelled">Отмена занятия</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#252923] dark:text-[#F3EFE5] mb-1">
                    Время начала:
                  </label>
                  <input
                    type="time"
                    value={editStart}
                    onChange={e => setEditStart(e.target.value)}
                    className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg p-2 font-mono text-xs text-[#252923] dark:text-[#F3EFE5]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#252923] dark:text-[#F3EFE5] mb-1">
                    Время окончания:
                  </label>
                  <input
                    type="time"
                    value={editEnd}
                    onChange={e => setEditEnd(e.target.value)}
                    className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg p-2 font-mono text-xs text-[#252923] dark:text-[#F3EFE5]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#252923] dark:text-[#F3EFE5] mb-1">
                  Аудитория:
                </label>
                <input
                  type="text"
                  value={editRoom}
                  onChange={e => setEditRoom(e.target.value)}
                  placeholder="Например: Ауд. 312, Дистанционно (Zoom)"
                  className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg p-2 text-xs text-[#252923] dark:text-[#F3EFE5]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#252923] dark:text-[#F3EFE5] mb-1">
                  Официальное примечание деканата:
                </label>
                <textarea
                  rows={2}
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  placeholder="Причина замены, ссылка на онлайн-конференцию или указания старосте..."
                  className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg p-2 text-xs text-[#252923] dark:text-[#F3EFE5]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="notifyCheck"
                  checked={notifyGroup}
                  onChange={e => setNotifyGroup(e.target.checked)}
                  className="rounded border-[#E3DDD1] text-[#183D35] focus:ring-[#183D35]"
                />
                <label htmlFor="notifyCheck" className="text-xs text-[#252923] dark:text-[#F3EFE5] cursor-pointer">
                  Отправить push-уведомление студентам группы {selectedGroup}
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#E3DDD1] dark:border-[#26362F]">
                <button
                  type="button"
                  onClick={handleResetToNormal}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg border border-[#E3DDD1] hover:bg-[#FAF8F3] text-xs font-sans text-[#7E877B] cursor-pointer"
                >
                  Сбросить в штатное
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingEntry(null)}
                    className="px-3 py-1.5 rounded-lg border border-[#E3DDD1] text-xs font-sans text-[#7E877B] cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 rounded-lg bg-[#183D35] text-[#F3EFE5] text-xs font-sans font-semibold hover:bg-[#102923] cursor-pointer"
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
