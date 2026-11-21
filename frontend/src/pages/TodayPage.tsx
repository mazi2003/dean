import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  MapPin,
  FileText,
  Calendar,
  Sparkles,
  IdCard,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  BookOpen,
  ArrowUpRight,
  ShieldAlert,
  Inbox,
  Building,
  CalendarDays,
  FileBadge,
  Users,
} from 'lucide-react';
import { ScheduleEntry, StudentRequest, Notification, ExamEntry } from '../types';
import { api } from '../services/api';
import { UniversityEmblem } from '../components/UniversityEmblem';
import { ScheduleCollisionAlert } from '../components/ScheduleCollisionAlert';
import {
  tr,
  getScheduleTypeLabel,
  getRequestStatusLabel,
  getStudyFormLabel,
  localizeText,
} from '../utils/i18n';

interface TodayPageProps {
  setActiveTab: (tab: string) => void;
  onOpenCard: () => void;
  onOpenAssistant: () => void;
  onPreviewCert: (req: StudentRequest) => void;
  onOpenMap?: (room?: string) => void;
}

export const TodayPage: React.FC<TodayPageProps> = ({
  setActiveTab,
  onOpenCard,
  onOpenAssistant,
  onPreviewCert,
  onOpenMap,
}) => {
  const { user, profile, lang } = useAuth();
  const isStaff = user?.role === 'staff';

  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [exams, setExams] = useState<ExamEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const userGroup = profile?.group || 'ДУ-101';

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isStaff) {
          const [sch, reqs, notifs, exList] = await Promise.all([
            api.getSchedule(undefined, 'ДУ-101'),
            api.getStaffRequests(),
            api.getNotifications(),
            api.getExams('ДУ-101'),
          ]);
          setSchedule(sch);
          setRequests(reqs);
          setNotifications(notifs);
          setExams(exList);
        } else {
          const [sch, reqs, notifs, exList] = await Promise.all([
            api.getSchedule(),
            api.getRequests(),
            api.getNotifications(),
            api.getExams(userGroup),
          ]);
          setSchedule(sch);
          setRequests(reqs);
          setNotifications(notifs);
          setExams(exList);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, isStaff, userGroup]);

  // Today date formatted
  const [todayDateObj] = useState(() => new Date());
  const todayStr = new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(todayDateObj);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-44 bg-white/60 dark:bg-[#171c26]/60 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-white/60 dark:bg-[#171c26]/60 rounded-3xl" />
          <div className="h-80 bg-white/60 dark:bg-[#171c26]/60 rounded-3xl" />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // STAFF COMMAND CENTER VIEW (Innopolis Design System)
  // ─────────────────────────────────────────────────────────────
  if (isStaff) {
    const newRequestsCount = requests.filter((r) => r.status === 'submitted').length;
    const inReviewCount = requests.filter((r) => r.status === 'in_review').length;
    const readyCount = requests.filter((r) => r.status === 'ready').length;

    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Masthead */}
        <section className="bg-white dark:bg-[#171c26] rounded-3xl border border-[#e2e4e8] dark:border-[#273142] p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-5 pointer-events-none">
            <UniversityEmblem size={220} variant="full" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 text-xs font-sans text-[#475569] dark:text-[#94a3b8]">
                <span className="font-sans text-[#166534] dark:text-[#45d320] font-semibold">
                  {tr(lang, 'Деканат Факультета МО', "Dean's Office, School of IR")}
                </span>
                <span>•</span>
                <span>{tr(lang, 'Главный корпус, ауд. 312', 'Main Bldg, Room 312')}</span>
                <span>•</span>
                <span className="capitalize">{todayStr}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold tracking-tight text-[#161821] dark:text-[#ffffff]">
                {lang === 'ru'
                  ? `Добрый день, ${user?.fullName || 'Мария Волкова'}!`
                  : `Welcome, ${user?.fullName || 'Maria Volkova'}!`}
              </h1>

              <p className="text-xs sm:text-sm text-[#4b5563] dark:text-[#cbd5e1] font-sans max-w-2xl">
                {tr(
                  lang,
                  'Единая диспетчерская панель сотрудника деканата: обработка входящих заявлений студентов, списки групп, расписание и экзаменационные сессии.',
                  "Staff Command Center: processing student inquiries, managing cohorts, schedule dispatch, and examination sessions."
                )}
              </p>
            </div>

            {/* Status pills */}
            <div className="flex items-center space-x-3 bg-[#f6f6f9] dark:bg-[#121620] p-4 rounded-2xl border border-[#e2e4e8] dark:border-[#273142] self-start">
              <div className="w-10 h-10 rounded-full bg-[#161821] text-[#45d320] flex items-center justify-center flex-shrink-0">
                <Inbox className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-heading uppercase tracking-wider text-[#475569] dark:text-[#94a3b8]">
                  {lang === 'ru' ? 'Входящие заявления' : 'Active Inquiries'}
                </p>
                <div className="flex items-baseline space-x-1.5">
                  <span className="font-sans text-xl font-bold text-[#161821] dark:text-[#ffffff]">
                    {requests.length}
                  </span>
                  <span className="text-[10px] text-[#166534] dark:text-[#45d320] font-sans font-bold">
                    ({newRequestsCount} {lang === 'ru' ? 'новых' : 'new'})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Staff Navigation */}
          <div className="mt-6 pt-5 border-t border-[#e2e4e8] dark:border-[#273142] flex flex-wrap gap-2.5 text-xs">
            <button
              onClick={() => setActiveTab('staff_requests')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full btn-innopolis-primary text-xs font-heading cursor-pointer"
            >
              <Inbox className="w-3.5 h-3.5 text-white" />
              <span>{tr(lang, 'Очередь заявлений', 'Inquiries Queue')}</span>
            </button>
            <button
              onClick={() => setActiveTab('staff_students')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#f6f6f9] dark:bg-[#121620] hover:bg-[#ebeef3] text-[#161821] dark:text-[#ffffff] border border-[#e2e4e8] dark:border-[#273142] font-heading font-medium transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320]" />
              <span>{tr(lang, 'Группы и личные дела', 'Groups & Dossiers')}</span>
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#f6f6f9] dark:bg-[#121620] hover:bg-[#ebeef3] text-[#161821] dark:text-[#ffffff] border border-[#e2e4e8] dark:border-[#273142] font-heading font-medium transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320]" />
              <span>{tr(lang, 'Диспетчер расписания', 'Timetable Dispatch')}</span>
            </button>
          </div>
        </section>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab('staff_requests')}
            className="p-5 rounded-3xl bg-white dark:bg-[#171c26] border border-[#e2e4e8] dark:border-[#273142] shadow-xs cursor-pointer hover:border-[#33b712] transition-all space-y-1.5"
          >
            <span className="text-[11px] font-heading text-[#475569] dark:text-[#94a3b8] uppercase tracking-wider block">
              {tr(lang, 'Новые заявления', 'New Inquiries')}
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="font-sans text-2xl font-bold text-[#be123c] dark:text-[#fecdd3]">
                {newRequestsCount}
              </span>
              <span className="text-xs text-[#475569] dark:text-[#94a3b8]">{tr(lang, 'ожидают', 'pending')}</span>
            </div>
            <p className="text-[11px] text-[#4b5563] dark:text-[#cbd5e1]">
              {tr(lang, 'Требуют первичной проверки', 'Initial check required')}
            </p>
          </div>

          <div
            onClick={() => setActiveTab('staff_requests')}
            className="p-5 rounded-3xl bg-white dark:bg-[#171c26] border border-[#e2e4e8] dark:border-[#273142] shadow-xs cursor-pointer hover:border-[#33b712] transition-all space-y-1.5"
          >
            <span className="text-[11px] font-heading text-[#475569] dark:text-[#94a3b8] uppercase tracking-wider block">
              {tr(lang, 'В обработке', 'In Review')}
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="font-sans text-2xl font-bold text-[#0369a1] dark:text-[#38bdf8]">
                {inReviewCount}
              </span>
              <span className="text-xs text-[#475569] dark:text-[#94a3b8]">{tr(lang, 'заявлений', 'requests')}</span>
            </div>
            <p className="text-[11px] text-[#4b5563] dark:text-[#cbd5e1]">
              {tr(lang, 'Проверка данных инспектором', 'Inspector verification')}
            </p>
          </div>

          <div
            onClick={() => setActiveTab('staff_requests')}
            className="p-5 rounded-3xl bg-white dark:bg-[#171c26] border border-[#e2e4e8] dark:border-[#273142] shadow-xs cursor-pointer hover:border-[#33b712] transition-all space-y-1.5"
          >
            <span className="text-[11px] font-heading text-[#475569] dark:text-[#94a3b8] uppercase tracking-wider block">
              {tr(lang, 'Готово к выдаче', 'Ready to Issue')}
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="font-sans text-2xl font-bold text-[#166534] dark:text-[#45d320]">
                {readyCount}
              </span>
              <span className="text-xs text-[#475569] dark:text-[#94a3b8]">{tr(lang, 'готовых', 'ready')}</span>
            </div>
            <p className="text-[11px] text-[#4b5563] dark:text-[#cbd5e1]">
              {tr(lang, 'Макеты сформированы', 'Previews generated')}
            </p>
          </div>

          <div
            onClick={() => setActiveTab('schedule')}
            className="p-5 rounded-3xl bg-white dark:bg-[#171c26] border border-[#e2e4e8] dark:border-[#273142] shadow-xs cursor-pointer hover:border-[#33b712] transition-all space-y-1.5"
          >
            <span className="text-[11px] font-heading text-[#475569] dark:text-[#94a3b8] uppercase tracking-wider block">
              {tr(lang, 'Потоки в расписании', 'Active Streams')}
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="font-sans text-2xl font-bold text-[#161821] dark:text-[#ffffff]">
                2
              </span>
              <span className="text-xs text-[#475569] dark:text-[#94a3b8]">{tr(lang, 'группы', 'groups')}</span>
            </div>
            <p className="text-[11px] text-[#4b5563] dark:text-[#cbd5e1]">
              {tr(lang, 'ДУ-101 и ДУ-205 под контролем', 'ДУ-101 & ДУ-205 monitored')}
            </p>
          </div>
        </div>

        {/* Recent student requests requiring review */}
        <section className="bg-white dark:bg-[#171c26] rounded-3xl border border-[#e2e4e8] dark:border-[#273142] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#e2e4e8] dark:border-[#273142]">
            <div className="flex items-center space-x-2">
              <Inbox className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
              <h3 className="font-heading font-semibold text-base text-[#161821] dark:text-[#ffffff]">
                {tr(
                  lang,
                  'Очередь последних входящих заявлений студентов',
                  'Recent Student Petition Queue'
                )}
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('staff_requests')}
              className="text-xs font-heading font-semibold text-[#166534] dark:text-[#45d320] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>
                {tr(
                  lang,
                  `Все заявления (${requests.length})`,
                  `All Requests (${requests.length})`
                )}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#e2e4e8] dark:divide-[#273142]">
            {requests.slice(0, 5).map((req) => (
              <div
                key={req.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-heading font-semibold text-sm text-[#161821] dark:text-[#ffffff]">
                      {localizeText(req.typeTitle, lang)}
                    </span>
                    <span className="font-sans text-[11px] text-[#475569] dark:text-[#94a3b8]">№ {req.id}</span>
                  </div>
                  <p className="text-xs text-[#4b5563] dark:text-[#cbd5e1] font-sans mt-0.5">
                    {tr(lang, 'Студент:', 'Student:')}{' '}
                    <strong>{req.studentName || tr(lang, 'Студент', 'Student')}</strong> (
                    {req.studentGroup || 'ДУ-101'}) •{' '}
                    {tr(
                      lang,
                      `Срок готовности: до ${req.expectedDate}`,
                      `Due by: ${req.expectedDate}`
                    )}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-sans font-semibold bg-[#f6f6f9] dark:bg-[#121620] text-[#161821] dark:text-[#ffffff] border border-[#e2e4e8] dark:border-[#273142]">
                    {getRequestStatusLabel(req.status, lang, 'staff')}
                  </span>
                  <button
                    onClick={() => setActiveTab('staff_requests')}
                    className="px-3 py-1 rounded-full bg-[#161821] text-white text-xs font-heading font-medium hover:bg-[#262a38] cursor-pointer"
                  >
                    {tr(lang, 'Открыть', 'Open')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // STUDENT PORTAL VIEW (Innopolis Design System)
  // ─────────────────────────────────────────────────────────────
  const todayClasses = schedule.slice(0, 3);
  const nextClass = todayClasses[0];
  const activeRequests = requests.filter(
    (r) => r.status === 'in_review' || r.status === 'needs_info'
  );
  const readyRequests = requests.filter((r) => r.status === 'ready');
  const urgentNotif = notifications.find(
    (n) => !n.read && (n.priority === 'urgent' || n.priority === 'high')
  );

  const upcomingExams =
    exams.length > 0
      ? exams.map((e) => ({
          code: e.code,
          subject: e.subject,
          type: e.format,
          date: e.date,
          time: e.time,
          room: e.room,
          teacher: e.examiner,
          credits: e.credits,
          status: e.status,
          changeNote: e.changeNote,
          isDebt: e.isDebt,
        }))
      : [
          {
            code: 'LAW-201',
            subject: 'Международное публичное право',
            type: 'Экзамен',
            date: '12 декабря 2026',
            time: '10:00',
            room: 'Ауд. 312',
            teacher: 'Проф. Воронов А.Н.',
            credits: 5,
            status: 'scheduled',
            changeNote: null,
            isDebt: false,
          },
          {
            code: 'DIP-104',
            subject: 'История дипломатических отношений',
            type: 'Дифференцированный зачет',
            date: '18 декабря 2026',
            time: '12:30',
            room: 'Конференц-зал Б',
            teacher: 'Доц. Романова Е.В.',
            credits: 4,
            status: 'scheduled',
            changeNote: null,
            isDebt: false,
          },
          {
            code: 'STAT-102',
            subject: 'Математическая статистика и анализ данных',
            type: 'Комиссионная пересдача',
            date: '28 ноября 2026',
            time: '14:00',
            room: 'Ауд. А-314',
            teacher: 'Проф. Соколов Д.М.',
            credits: 3,
            status: 'scheduled',
            changeNote: null,
            isDebt: profile?.studentNumber === 'СТ-2022-0082',
          },
        ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. ACADEMIC INSTITUTIONAL MASTHEAD (Innopolis Style)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#171c26] rounded-3xl border border-[#e2e4e8] dark:border-[#273142] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-5 pointer-events-none">
          <UniversityEmblem size={220} variant="full" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-2">
            {/* Academic metadata pill */}
            <div className="inline-flex items-center space-x-2 text-xs font-sans text-[#475569] dark:text-[#94a3b8]">
              <span className="font-sans text-[#166534] dark:text-[#45d320] font-semibold bg-[#ebfbee] dark:bg-[#1e2d24] px-2.5 py-0.5 rounded-full">
                {profile?.group}
              </span>
              <span>•</span>
              <span>{tr(lang, `${profile?.year} курс`, `Year ${profile?.year}`)}</span>
              <span>•</span>
              <span className="capitalize">{todayStr}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold tracking-tight text-[#161821] dark:text-[#ffffff]">
              {lang === 'ru'
                ? `С возвращением, ${user?.fullName.split(' ')[0]}!`
                : `Welcome back, ${user?.fullName.split(' ')[0]}!`}
            </h1>

            <p className="text-xs sm:text-sm text-[#4b5563] dark:text-[#cbd5e1] font-sans max-w-2xl">
              {localizeText(profile?.program, lang)} • {localizeText(profile?.faculty, lang)} •{' '}
              {tr(lang, 'Форма:', 'Study mode:')} {getStudyFormLabel(profile?.studyForm, lang)}
            </p>
          </div>

          {/* Academic Standing Metric Box (ECTS + GPA) */}
          <div className="flex items-center space-x-3 bg-[#f6f6f9] dark:bg-[#121620] p-4 rounded-3xl border border-[#e2e4e8] dark:border-[#273142] self-start shadow-xs">
            <div className="w-11 h-11 rounded-2xl bg-[#161821] text-[#45d320] flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-heading uppercase tracking-wider text-[#475569] dark:text-[#94a3b8]">
                {lang === 'ru' ? 'Академический статус' : 'Academic Standing'}
              </p>
              <div className="flex items-baseline space-x-1.5">
                <span className="font-sans text-xl font-bold text-[#161821] dark:text-[#ffffff]">
                  {profile?.gpa ? profile.gpa.toFixed(2) : '4.80'}
                </span>
                <span className="text-[11px] text-[#475569] dark:text-[#94a3b8] font-sans">
                  / 5.0 GPA
                </span>
                <span className="text-[10px] text-[#166534] dark:text-[#45d320] font-sans font-bold pl-1">
                  (48 ECTS)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Pills (Innopolis Pill Controls) */}
        <div className="mt-6 pt-5 border-t border-[#e2e4e8] dark:border-[#273142] flex flex-wrap gap-2.5 text-xs">
          <button
            onClick={() => setActiveTab('requests')}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-full btn-innopolis-primary text-xs font-heading cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-white" />
            <span>{lang === 'ru' ? 'Заказать справку' : 'Request Certificate'}</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-[#f6f6f9] dark:bg-[#121620] hover:bg-[#ebeef3] text-[#161821] dark:text-[#ffffff] border border-[#e2e4e8] dark:border-[#273142] font-heading font-medium transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320]" />
            <span>{lang === 'ru' ? 'Расписание и сессия' : 'Timetable & Exams'}</span>
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-[#f6f6f9] dark:bg-[#121620] hover:bg-[#ebeef3] text-[#161821] dark:text-[#ffffff] border border-[#e2e4e8] dark:border-[#273142] font-heading font-medium transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320]" />
            <span>{lang === 'ru' ? 'Зачетная книжка и БРС' : 'Academic Records'}</span>
          </button>
          <button
            onClick={onOpenAssistant}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-[#ebfbee] dark:bg-[#1e2d24] hover:bg-[#d8f7e6] text-[#161821] dark:text-[#ffffff] border border-[#33b712]/30 font-heading font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320]" />
            <span>{lang === 'ru' ? 'Консультант деканата' : 'Ask Academic Copilot'}</span>
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. ACADEMIC CALENDAR & SEMESTER MILESTONES
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#171c26] rounded-3xl border border-[#e2e4e8] dark:border-[#273142] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#e2e4e8] dark:border-[#273142]">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
            <h3 className="font-heading font-semibold text-sm text-[#161821] dark:text-[#ffffff]">
              {lang === 'ru'
                ? 'Академический календарь: Весенний семестр 2026'
                : 'Academic Calendar & Semester Milestones'}
            </h3>
          </div>
          <span className="text-xs font-sans font-semibold text-[#166534] dark:text-[#45d320] bg-[#ebfbee] dark:bg-[#1e2d24] px-3 py-1 rounded-full">
            {lang === 'ru'
              ? '8-я учебная неделя из 16 (50% семестра)'
              : 'Week 8 of 16 (50% Term Completed)'}
          </span>
        </div>

        {/* Milestone Progress Steps (Pastel category accents) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-sans">
          <div className="p-3.5 rounded-2xl bg-[#ebfbee] dark:bg-[#1e2d24] border border-[#33b712]/30 space-y-1">
            <span className="text-[10px] font-sans text-[#166534] dark:text-[#45d320] uppercase font-bold block">
              {tr(lang, '1 февраля 2026', 'Feb 1, 2026')}
            </span>
            <div className="flex items-center space-x-1.5 font-heading font-semibold text-[#161821] dark:text-[#ffffff]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320] flex-shrink-0" />
              <span>{tr(lang, 'Старт семестра', 'Term Start')}</span>
            </div>
            <p className="text-[10px] text-[#4b5563] dark:text-[#cbd5e1]">
              {tr(lang, 'Учебный поток запущен', 'Academic term launched')}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#e8f4fd] dark:bg-[#1a2838] border border-[#3598fe]/30 space-y-1">
            <span className="text-[10px] font-sans text-[#0369a1] dark:text-[#38bdf8] font-bold uppercase block">
              {tr(lang, '10 – 24 ноября', 'Nov 10 – 24')}
            </span>
            <div className="flex items-center space-x-1.5 font-heading font-bold text-[#161821] dark:text-[#ffffff]">
              <span className="w-2 h-2 rounded-full bg-[#3598fe] animate-pulse flex-shrink-0" />
              <span>{tr(lang, 'Промежуточный срез', 'Midterm Checkpoint')}</span>
            </div>
            <p className="text-[10px] text-[#4b5563] dark:text-[#cbd5e1]">
              {tr(lang, 'Контрольные точки БРС', 'Rating control points')}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#fbf0eb] dark:bg-[#2b1f1a] border border-[#ff7675]/30 space-y-1">
            <span className="text-[10px] font-sans text-[#c2410c] dark:text-[#fb923c] uppercase font-bold block">
              {tr(lang, '1 декабря 2026', 'Dec 1, 2026')}
            </span>
            <div className="flex items-center space-x-1.5 font-heading font-medium text-[#161821] dark:text-[#ffffff]">
              <span>{tr(lang, 'Зачетная неделя', 'Credit Week')}</span>
            </div>
            <p className="text-[10px] text-[#4b5563] dark:text-[#cbd5e1]">
              {tr(lang, 'Допуск к экзаменам', 'Exam admission')}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#f4ebfc] dark:bg-[#281b36] border border-[#8b5cf6]/30 space-y-1">
            <span className="text-[10px] font-sans text-[#7c3aed] dark:text-[#c4b5fd] uppercase font-bold block">
              {tr(lang, '10 – 28 декабря', 'Dec 10 – 28')}
            </span>
            <div className="flex items-center space-x-1.5 font-heading font-medium text-[#161821] dark:text-[#ffffff]">
              <span>{tr(lang, 'Зимняя сессия', 'Winter Exam Session')}</span>
            </div>
            <p className="text-[10px] text-[#4b5563] dark:text-[#cbd5e1]">
              {tr(lang, 'Экзамены и защита', 'Finals & thesis defense')}
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. URGENT ACADEMIC NOTICE (Innopolis Warning Card)
          ───────────────────────────────────────────────────────────── */}
      {urgentNotif && (
        <section className="bg-[#fff9e6] dark:bg-[#2c2210] border border-[#ffeeba] dark:border-[#523e1b] p-4 rounded-3xl text-[#161821] dark:text-[#ffffff] flex items-start justify-between gap-4 shadow-xs">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-[#b45309] dark:text-[#fbbf24] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-heading font-semibold text-sm text-[#b45309] dark:text-[#b45309]">
                {urgentNotif.title}
              </h3>
              <p className="text-xs text-[#4b5563] dark:text-[#cbd5e1] font-sans mt-0.5 leading-relaxed">
                {urgentNotif.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('notifications')}
            className="text-xs font-heading font-semibold text-[#b45309] dark:text-[#b45309] hover:underline flex items-center space-x-1 flex-shrink-0 cursor-pointer"
          >
            <span>{lang === 'ru' ? 'Подробнее' : 'Details'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. MAIN DASHBOARD GRID
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Classes, Timetable & Examination Program */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Lecture Focal Card */}
          {nextClass ? (
            <section className="bg-white dark:bg-[#171c26] rounded-3xl border border-[#e2e4e8] dark:border-[#273142] p-6 shadow-xs relative">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2e4e8] dark:border-[#273142]">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#33b712] animate-pulse" />
                  <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-[#166534] dark:text-[#45d320]">
                    {lang === 'ru' ? 'Ближайшее занятие' : 'Next Upcoming Class'}
                  </span>
                </div>
                <span className="text-xs font-sans font-semibold px-3 py-1 rounded-full bg-[#ebfbee] dark:bg-[#1e2d24] text-[#166534] dark:text-[#45d320] border border-[#33b712]/30">
                  {getScheduleTypeLabel(nextClass.type, lang)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="sm:col-span-2 space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-heading font-semibold text-[#161821] dark:text-[#ffffff] leading-snug">
                    {localizeText(nextClass.subject, lang)}
                  </h3>
                  <p className="text-xs text-[#4b5563] dark:text-[#cbd5e1] font-sans">
                    {tr(lang, 'Преподаватель:', 'Instructor:')}{' '}
                    <strong className="text-[#161821] dark:text-[#ffffff]">
                      {nextClass.teacher}
                    </strong>
                  </p>
                </div>

                <div className="sm:border-l sm:border-[#e2e4e8] sm:dark:border-[#273142] sm:pl-4 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-sans text-[#161821] dark:text-[#ffffff]">
                    <Clock className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                    <span className="font-bold text-sm">
                      {nextClass.start} – {nextClass.end}
                    </span>
                  </div>
                  <button
                    onClick={() => onOpenMap?.(nextClass.room)}
                    className="flex items-center space-x-2 text-xs font-sans text-[#4b5563] dark:text-[#cbd5e1] hover:text-[#166534] dark:hover:text-[#45d320] transition-colors cursor-pointer group"
                    title={lang === 'ru' ? 'Найти аудиторию на карте' : 'Locate room on map'}
                  >
                    <MapPin className="w-4 h-4 text-[#be123c] dark:text-[#fecdd3] group-hover:scale-110 transition-transform" />
                    <span>
                      {tr(lang, 'Аудитория', 'Room')}{' '}
                      <strong className="underline decoration-dotted underline-offset-2">{nextClass.room}</strong>
                    </span>
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <div className="p-6 bg-white dark:bg-[#171c26] rounded-3xl border border-[#e2e4e8] dark:border-[#273142] text-center text-xs text-[#475569] dark:text-[#94a3b8]">
              {lang === 'ru'
                ? 'Сегодня нет запланированных занятий.'
                : 'No lectures scheduled for today.'}
            </div>
          )}

          {/* Today's Full Schedule Table */}
          <section className="bg-white dark:bg-[#171c26] rounded-3xl border border-[#e2e4e8] dark:border-[#273142] p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e4e8] dark:border-[#273142] mb-4">
              <h3 className="font-heading font-semibold text-sm text-[#161821] dark:text-[#ffffff] flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                <span>{lang === 'ru' ? 'Расписание на сегодня' : "Today's Classes"}</span>
              </h3>
              <button
                onClick={() => setActiveTab('schedule')}
                className="text-xs font-heading text-[#166534] dark:text-[#45d320] hover:underline font-semibold cursor-pointer"
              >
                {lang === 'ru' ? 'Вся неделя и сессия →' : 'Full Timetable →'}
              </button>
            </div>

            <div className="space-y-2.5">
              {todayClasses.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] flex items-center justify-between text-xs hover:border-[#33b712]/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-sans text-[#166534] dark:text-[#45d320] font-bold text-[11px] w-6">
                      {idx + 1}
                    </span>
                    <span className="font-sans text-[#475569] dark:text-[#94a3b8] text-[11px] w-24">
                      {item.start}–{item.end}
                    </span>
                    <div>
                      <h4 className="font-heading font-semibold text-xs text-[#161821] dark:text-[#ffffff]">
                        {localizeText(item.subject, lang)}
                      </h4>
                      <p className="text-[11px] text-[#475569] dark:text-[#94a3b8] font-sans">
                        {item.teacher} •{' '}
                        <span className="uppercase font-sans">
                          {getScheduleTypeLabel(item.type, lang)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenMap?.(item.room)}
                    className="flex items-center space-x-1 font-sans font-bold text-[#161821] dark:text-[#ffffff] hover:text-[#166534] dark:hover:text-[#45d320] transition-colors cursor-pointer group"
                    title={lang === 'ru' ? 'Найти аудиторию на карте' : 'Locate room on map'}
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#be123c] dark:text-[#fecdd3] group-hover:scale-110 transition-transform" />
                    <span className="underline decoration-dotted underline-offset-2">{item.room}</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────
              EXAMINATION PROGRAM & UPCOMING ASSESSMENTS
              ───────────────────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-[#171c26] rounded-3xl border border-[#e2e4e8] dark:border-[#273142] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e4e8] dark:border-[#273142]">
              <div className="flex items-center space-x-2">
                <FileBadge className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                <h3 className="font-heading font-semibold text-sm text-[#161821] dark:text-[#ffffff]">
                  {lang === 'ru'
                    ? 'Программа промежуточной аттестации и сессии'
                    : 'Upcoming Examination Program'}
                </h3>
              </div>
              <span className="text-[11px] font-sans text-[#475569] dark:text-[#94a3b8]">
                {lang === 'ru' ? 'Зимняя сессия 2026' : 'Winter Session 2026'}
              </span>
            </div>

            <div className="space-y-2.5">
              {upcomingExams.map((ex, i) => (
                <div key={i} className="space-y-2">
                  <div
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs ${
                      ex.isDebt
                        ? 'bg-[#ff4d8b]/5 dark:bg-[#ff4d8b]/15 border-[#ff4d8b]/30'
                        : 'bg-[#f6f6f9] dark:bg-[#121620] border-[#e2e4e8] dark:border-[#273142]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-sans text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#161821] text-white">
                          {ex.code}
                        </span>
                        <h4 className="font-heading font-semibold text-xs sm:text-sm text-[#161821] dark:text-[#ffffff]">
                          {localizeText(ex.subject, lang)}
                        </h4>
                        {ex.status === 'date_changed' && (
                          <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-[#3598fe] text-white">
                            {tr(lang, 'ДАТА ПЕРЕНЕСЕНА', 'DATE RESCHEDULED')}
                          </span>
                        )}
                        {ex.status === 'room_changed' && (
                          <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-[#8b5cf6] text-white">
                            {tr(lang, 'АУДИТОРИЯ ИЗМЕНЕНА', 'ROOM CHANGED')}
                          </span>
                        )}
                        {ex.isDebt && (
                          <span className="text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full bg-[#be123c] text-white">
                            {tr(lang, 'ПЕРЕСДАЧА', 'RETAKE')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#4b5563] dark:text-[#cbd5e1] font-sans">
                        {ex.teacher} • {tr(lang, 'Формат:', 'Format:')}{' '}
                        <strong>{localizeText(ex.type, lang)}</strong> ({ex.credits} ECTS)
                      </p>
                    </div>

                    <div className="flex items-center space-x-4 font-sans text-xs flex-shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="font-bold text-[#166534] dark:text-[#45d320] block">
                          {ex.date}
                        </span>
                        <button
                          onClick={() => onOpenMap?.(ex.room)}
                          className="text-[#475569] dark:text-[#94a3b8] hover:text-[#166534] dark:hover:text-[#45d320] text-[11px] flex items-center sm:justify-end space-x-1 cursor-pointer group transition-colors"
                          title={lang === 'ru' ? 'Найти аудиторию на карте' : 'Locate room on map'}
                        >
                          <span>{tr(lang, 'в', 'at')} {ex.time} •</span>
                          <MapPin className="w-3 h-3 text-[#be123c] dark:text-[#fecdd3] group-hover:scale-110 transition-transform" />
                          <span className="underline decoration-dotted underline-offset-2">{ex.room}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Schedule Collision Alert for Retakes */}
                  {ex.isDebt && (
                    <ScheduleCollisionAlert
                      compact
                      retakeDate={ex.date}
                      retakeTime={ex.time}
                      retakeSubject={ex.subject}
                      retakeRoom={ex.room}
                      onOpenMap={onOpenMap}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Issued Certificates & Administrative Services */}
        <div className="space-y-6">
          {/* Digital Signature Certificates Ready for Download */}
          {readyRequests.length > 0 && (
            <section className="bg-[#161821] text-white rounded-3xl p-6 shadow-sm border border-[#33b712]/40 space-y-3.5">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#45d320]" />
                <h3 className="font-heading font-semibold text-sm text-white">
                  {lang === 'ru' ? 'Готовые официальные справки' : 'Issued Certified Documents'}
                </h3>
              </div>
              <p className="text-xs text-white/80 font-sans leading-relaxed">
                {tr(
                  lang,
                  'Заказанные справки подписаны деканатом и готовы к просмотру.',
                  'Your requested documents are approved and ready to preview.'
                )}
              </p>
              <div className="space-y-2 pt-1">
                {readyRequests.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => onPreviewCert(r)}
                    className="p-3.5 rounded-2xl bg-white/10 border border-white/10 hover:border-[#33b712] cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <span className="font-heading font-semibold text-xs text-white block">
                        {localizeText(r.typeTitle, lang)}
                      </span>
                      <span className="text-[10px] font-sans text-[#45d320]">№ {r.id}</span>
                    </div>
                    <span className="text-[11px] font-heading font-semibold text-[#45d320] flex items-center space-x-1">
                      <span>{tr(lang, 'Открыть PDF', 'Open PDF')}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Active Applications in Progress */}
          <section className="bg-white dark:bg-[#171c26] rounded-3xl border border-[#e2e4e8] dark:border-[#273142] p-6 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e4e8] dark:border-[#273142]">
              <h3 className="font-heading font-semibold text-sm text-[#161821] dark:text-[#ffffff] flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                <span>{lang === 'ru' ? 'Заявления на рассмотрении' : 'Active Petitions'}</span>
              </h3>
              <button
                onClick={() => setActiveTab('requests')}
                className="text-xs font-heading text-[#166534] dark:text-[#45d320] hover:underline font-semibold cursor-pointer"
              >
                {tr(lang, `Все (${requests.length}) →`, `All (${requests.length}) →`)}
              </button>
            </div>

            {activeRequests.length === 0 ? (
              <p className="text-xs text-[#475569] dark:text-[#94a3b8] py-3 text-center">
                {tr(
                  lang,
                  'Нет активных заявлений в обработке.',
                  'No active petitions in progress.'
                )}
              </p>
            ) : (
              <div className="space-y-2.5">
                {activeRequests.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setActiveTab('requests')}
                    className="p-3.5 rounded-2xl bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] hover:border-[#33b712]/50 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-semibold text-xs text-[#161821] dark:text-[#ffffff]">
                        {localizeText(r.typeTitle, lang)}
                      </span>
                      <span className="text-[10px] font-sans px-2.5 py-0.5 rounded-full bg-[#e8f4fd] dark:bg-[#1a2838] text-[#0369a1] dark:text-[#38bdf8] border border-[#3598fe]/30 font-semibold">
                        {getRequestStatusLabel(r.status, lang, 'staff')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#475569] dark:text-[#94a3b8] font-sans">
                      <span>
                        {tr(lang, `Срок: до ${r.expectedDate}`, `Due: ${r.expectedDate}`)}
                      </span>
                      <span>№ {r.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ─────────────────────────────────────────────────────────────
              ADMINISTRATIVE SERVICES DIRECTORY
              ───────────────────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-[#171c26] rounded-3xl border border-[#e2e4e8] dark:border-[#273142] p-6 shadow-xs space-y-3.5">
            <h3 className="font-heading font-semibold text-sm text-[#161821] dark:text-[#ffffff] pb-2 border-b border-[#e2e4e8] dark:border-[#273142] flex items-center space-x-2">
              <Building className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
              <span>
                {lang === 'ru' ? 'Службы и сервисы университета' : 'University Services Directory'}
              </span>
            </h3>

            <div className="space-y-2 text-xs font-sans">
              <div
                onClick={() => setActiveTab('requests')}
                className="p-3 rounded-2xl bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] hover:border-[#33b712] transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                  <div>
                    <span className="font-heading font-medium text-[#161821] dark:text-[#ffffff] block">
                      {tr(lang, 'Канцелярия деканата', "Dean's Registry")}
                    </span>
                    <span className="text-[10px] text-[#475569] dark:text-[#94a3b8]">
                      {tr(
                        lang,
                        'Каб. 312 • Справки, выписки, приказы',
                        'Rm 312 • Certificates, transcripts, decrees'
                      )}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#475569] dark:text-[#94a3b8]" />
              </div>

              <div
                onClick={onOpenAssistant}
                className="p-3 rounded-2xl bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] hover:border-[#33b712] transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                  <div>
                    <span className="font-heading font-medium text-[#161821] dark:text-[#ffffff] block">
                      {tr(lang, 'Цифровой консультант', 'Academic Copilot')}
                    </span>
                    <span className="text-[10px] text-[#475569] dark:text-[#94a3b8]">
                      {tr(
                        lang,
                        'ИИ-помощник по регламентам вуза',
                        'AI assistant for university procedures'
                      )}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#475569] dark:text-[#94a3b8]" />
              </div>

              <div
                onClick={onOpenCard}
                className="p-3 rounded-2xl bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] hover:border-[#33b712] transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <IdCard className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                  <div>
                    <span className="font-heading font-medium text-[#161821] dark:text-[#ffffff] block">
                      {tr(lang, 'Студенческий пропуск', 'Digital Student Pass')}
                    </span>
                    <span className="text-[10px] text-[#475569] dark:text-[#94a3b8]">
                      {tr(
                        lang,
                        'Турникеты, кампус, библиотека',
                        'Turnstiles, campus access, library'
                      )}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#475569] dark:text-[#94a3b8]" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
