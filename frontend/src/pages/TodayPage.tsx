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
  Megaphone,
  ShieldCheck,
  Building,
  CalendarDays,
  FileBadge,
  Users,
} from 'lucide-react';
import { ScheduleEntry, StudentRequest, Notification, ExamEntry } from '../types';
import { api } from '../services/api';
import { UniversityEmblem } from '../components/UniversityEmblem';
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
}

export const TodayPage: React.FC<TodayPageProps> = ({
  setActiveTab,
  onOpenCard,
  onOpenAssistant,
  onPreviewCert,
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

  // Today date formatted without impure render-time call warning
  const [todayDateObj] = useState(() => new Date());
  const todayStr = new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(todayDateObj);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-5 animate-pulse">
        <div className="h-44 bg-[#DCE2EA]/40 dark:bg-[#162A45] rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-80 bg-[#DCE2EA]/40 dark:bg-[#162A45] rounded-xl" />
          <div className="h-80 bg-[#DCE2EA]/40 dark:bg-[#162A45] rounded-xl" />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // STAFF COMMAND CENTER VIEW
  // ─────────────────────────────────────────────────────────────
  if (isStaff) {
    const newRequestsCount = requests.filter(r => r.status === 'submitted').length;
    const inReviewCount = requests.filter(r => r.status === 'in_review').length;
    const readyCount = requests.filter(r => r.status === 'ready').length;

    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Masthead */}
        <section className="bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-5 dark:opacity-10 pointer-events-none">
            <UniversityEmblem size={220} variant="full" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 text-xs font-sans text-[#667085] dark:text-[#94A3B8]">
                <span className="font-mono text-[#142D4E] dark:text-[#245A91] font-semibold">
                  {tr(lang, 'Деканат Факультета МО', "Dean's Office, School of IR")}
                </span>
                <span>•</span>
                <span>{tr(lang, 'Главный корпус, ауд. 312', 'Main Bldg, Room 312')}</span>
                <span>•</span>
                <span className="capitalize">{todayStr}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0F1D30] dark:text-[#FFFFFF]">
                {lang === 'ru' ? 'Добрый день, Мария Волкова!' : 'Welcome, Maria Volkova!'}
              </h1>

              <p className="text-xs sm:text-sm text-[#475467] dark:text-[#CBD5E1] font-sans max-w-2xl">
                {tr(
                  lang,
                  'Заместитель декана по учебно-методической работе • Факультет международных отношений',
                  'Vice Dean for Academic Affairs • School of International Relations'
                )}
              </p>
            </div>

            {/* Quick Digital Signature status badge */}
            <div className="flex items-center space-x-3 bg-[#F8FAFC] dark:bg-[#0E1B2D] p-3.5 rounded-lg border border-[#DCE2EA] dark:border-[#1E395B] self-start">
              <div className="w-10 h-10 rounded-md bg-[#142D4E] text-[#245A91] flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-sans uppercase tracking-wider text-[#667085] dark:text-[#94A3B8]">
                  {tr(lang, 'ЭЦП деканата (ГОСТ)', "Dean's Digital Seal (GOST)")}
                </p>
                <span className="font-mono text-xs font-bold text-[#142D4E] dark:text-[#245A91] block">
                  {tr(lang, 'Активна и проверена', 'Active & Verified')}
                </span>
                <span className="text-[10px] text-[#667085] font-mono">
                  № 77AA-9402-E12F-2026
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons for Staff */}
          <div className="mt-6 pt-5 border-t border-[#DCE2EA] dark:border-[#193150] flex flex-wrap gap-2.5 text-xs font-sans">
            <button
              onClick={() => setActiveTab('staff_requests')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] font-medium transition-colors cursor-pointer"
            >
              <Inbox className="w-3.5 h-3.5 text-[#245A91]" />
              <span>
                {tr(
                  lang,
                  `Заявления студентов (${newRequestsCount} новых)`,
                  `Student Requests (${newRequestsCount} new)`
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('staff_students')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#F8FAFC] dark:bg-[#0E1B2D] hover:bg-[#EDF2F7] dark:hover:bg-[#1E2923] text-[#0F1D30] dark:text-[#FFFFFF] border border-[#DCE2EA] dark:border-[#1E395B] font-medium transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#142D4E] dark:text-[#245A91]" />
              <span>{tr(lang, 'Группы и студенты', 'Groups & Students')}</span>
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#F8FAFC] dark:bg-[#0E1B2D] hover:bg-[#EDF2F7] dark:hover:bg-[#1E2923] text-[#0F1D30] dark:text-[#FFFFFF] border border-[#DCE2EA] dark:border-[#1E395B] font-medium transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#142D4E] dark:text-[#245A91]" />
              <span>{tr(lang, 'Диспетчер расписания и замен', 'Timetable & Changes Dispatcher')}</span>
            </button>
            <button
              onClick={() => setActiveTab('staff_actions')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#F8FAFC] dark:bg-[#0E1B2D] hover:bg-[#EDF2F7] dark:hover:bg-[#1E2923] text-[#0F1D30] dark:text-[#FFFFFF] border border-[#DCE2EA] dark:border-[#1E395B] font-medium transition-colors cursor-pointer"
            >
              <Megaphone className="w-3.5 h-3.5 text-[#245A91]" />
              <span>{tr(lang, 'Опубликовать приказ', 'Publish Decree')}</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#F8FAFC] dark:bg-[#0E1B2D] hover:bg-[#EDF2F7] dark:hover:bg-[#1E2923] text-[#0F1D30] dark:text-[#FFFFFF] border border-[#DCE2EA] dark:border-[#1E395B] font-medium transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#245A91]" />
              <span>{tr(lang, 'Служебный профиль и права', 'Staff Dossier & Permissions')}</span>
            </button>
          </div>
        </section>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab('staff_requests')}
            className="p-4 rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] shadow-xs cursor-pointer hover:border-[#142D4E] transition-all space-y-1"
          >
            <span className="text-[11px] font-sans text-[#667085] uppercase tracking-wider block">
              {tr(lang, 'Новые заявления', 'New Petitions')}
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="font-mono text-2xl font-bold text-[#142D4E] dark:text-[#245A91]">
                {newRequestsCount}
              </span>
              <span className="text-xs text-[#667085]">
                {tr(lang, `из ${requests.length}`, `of ${requests.length}`)}
              </span>
            </div>
            <p className="text-[11px] text-[#475467] dark:text-[#CBD5E1]">
              {tr(lang, 'Ожидают первого рассмотрения', 'Awaiting initial review')}
            </p>
          </div>

          <div
            onClick={() => setActiveTab('staff_requests')}
            className="p-4 rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] shadow-xs cursor-pointer hover:border-[#142D4E] transition-all space-y-1"
          >
            <span className="text-[11px] font-sans text-[#667085] uppercase tracking-wider block">
              {tr(lang, 'В обработке', 'In Review')}
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="font-mono text-2xl font-bold text-[#142D4E] dark:text-[#245A91]">
                {inReviewCount}
              </span>
              <span className="text-xs text-[#667085]">{tr(lang, 'заявлений', 'requests')}</span>
            </div>
            <p className="text-[11px] text-[#475467] dark:text-[#CBD5E1]">
              {tr(lang, 'Проверка данных инспектором', 'Inspector verification')}
            </p>
          </div>

          <div
            onClick={() => setActiveTab('staff_requests')}
            className="p-4 rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] shadow-xs cursor-pointer hover:border-[#142D4E] transition-all space-y-1"
          >
            <span className="text-[11px] font-sans text-[#667085] uppercase tracking-wider block">
              {tr(lang, 'Подписано ЭЦП', 'Digitally Signed')}
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="font-mono text-2xl font-bold text-[#142D4E] dark:text-[#245A91]">
                {readyCount}
              </span>
              <span className="text-xs text-[#667085]">{tr(lang, 'готовых', 'ready')}</span>
            </div>
            <p className="text-[11px] text-[#475467] dark:text-[#CBD5E1]">
              {tr(lang, 'Сформированы и заверены', 'Issued & certified')}
            </p>
          </div>

          <div
            onClick={() => setActiveTab('schedule')}
            className="p-4 rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] shadow-xs cursor-pointer hover:border-[#142D4E] transition-all space-y-1"
          >
            <span className="text-[11px] font-sans text-[#667085] uppercase tracking-wider block">
              {tr(lang, 'Потоки в расписании', 'Active Streams')}
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="font-mono text-2xl font-bold text-[#142D4E] dark:text-[#245A91]">
                2
              </span>
              <span className="text-xs text-[#667085]">{tr(lang, 'группы', 'groups')}</span>
            </div>
            <p className="text-[11px] text-[#475467] dark:text-[#CBD5E1]">
              {tr(lang, 'ДУ-101 и ДУ-205 под контролем', 'ДУ-101 & ДУ-205 monitored')}
            </p>
          </div>
        </div>

        {/* Recent student requests requiring review */}
        <section className="bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE2EA] dark:border-[#193150]">
            <div className="flex items-center space-x-2">
              <Inbox className="w-4 h-4 text-[#142D4E] dark:text-[#245A91]" />
              <h3 className="font-semibold text-base text-[#0F1D30] dark:text-[#FFFFFF]">
                {tr(lang, 'Очередь последних входящих заявлений студентов', 'Recent Student Petition Queue')}
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('staff_requests')}
              className="text-xs font-sans font-semibold text-[#142D4E] dark:text-[#245A91] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>{tr(lang, `Все заявления (${requests.length})`, `All Requests (${requests.length})`)}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#DCE2EA] dark:divide-[#193150]">
            {requests.slice(0, 5).map(req => (
              <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-[#0F1D30] dark:text-[#FFFFFF]">
                      {localizeText(req.typeTitle, lang)}
                    </span>
                    <span className="font-mono text-[11px] text-[#667085]">№ {req.id}</span>
                  </div>
                  <p className="text-xs text-[#475467] dark:text-[#CBD5E1] font-sans">
                    {tr(lang, 'Студент:', 'Student:')}{' '}
                    <strong>{req.studentName || tr(lang, 'Студент', 'Student')}</strong> ({req.studentGroup || 'ДУ-101'}) •{' '}
                    {tr(lang, `Срок готовности: до ${req.expectedDate}`, `Due by: ${req.expectedDate}`)}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F8FAFC] dark:bg-[#0E1B2D] text-[#142D4E] dark:text-[#245A91] border border-[#DCE2EA] dark:border-[#1E395B]">
                    {getRequestStatusLabel(req.status, lang, 'staff')}
                  </span>
                  <button
                    onClick={() => setActiveTab('staff_requests')}
                    className="px-2.5 py-1 rounded bg-[#142D4E] text-[#FFFFFF] text-xs font-sans font-medium hover:bg-[#0E1F36] cursor-pointer"
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
  // STUDENT PORTAL VIEW (Oxford & ETH Zurich Editorial System)
  // ─────────────────────────────────────────────────────────────
  const todayClasses = schedule.slice(0, 3);
  const nextClass = todayClasses[0];
  const activeRequests = requests.filter(r => r.status === 'in_review' || r.status === 'needs_info');
  const readyRequests = requests.filter(r => r.status === 'ready');
  const urgentNotif = notifications.find(n => !n.read && (n.priority === 'urgent' || n.priority === 'high'));

  // Exam session items (dynamic from state)
  const upcomingExams = exams.length > 0
    ? exams.map(e => ({
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
          1. ACADEMIC INSTITUTIONAL MASTHEAD (Oxford Style)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative watermark */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-5 dark:opacity-10 pointer-events-none">
          <UniversityEmblem size={220} variant="full" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-2">
            {/* Academic metadata pill */}
            <div className="inline-flex items-center space-x-2 text-xs font-sans text-[#667085] dark:text-[#94A3B8]">
              <span className="font-mono text-[#142D4E] dark:text-[#245A91] font-semibold">
                {profile?.group}
              </span>
              <span>•</span>
              <span>{tr(lang, `${profile?.year} курс`, `Year ${profile?.year}`)}</span>
              <span>•</span>
              <span className="capitalize">{todayStr}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0F1D30] dark:text-[#FFFFFF]">
              {lang === 'ru'
                ? `С возвращением, ${user?.fullName.split(' ')[0]}!`
                : `Welcome back, ${user?.fullName.split(' ')[0]}!`}
            </h1>

            <p className="text-xs sm:text-sm text-[#475467] dark:text-[#CBD5E1] font-sans max-w-2xl">
              {localizeText(profile?.program, lang)} • {localizeText(profile?.faculty, lang)} •{' '}
              {tr(lang, 'Форма:', 'Study mode:')} {getStudyFormLabel(profile?.studyForm, lang)}
            </p>
          </div>

          {/* Academic Standing Metric Box (ECTS + GPA) */}
          <div className="flex items-center space-x-3 bg-[#F8FAFC] dark:bg-[#0E1B2D] p-3.5 rounded-lg border border-[#DCE2EA] dark:border-[#1E395B] self-start">
            <div className="w-10 h-10 rounded-md bg-[#142D4E] text-[#245A91] flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-sans uppercase tracking-wider text-[#667085] dark:text-[#94A3B8]">
                {lang === 'ru' ? 'Академический статус' : 'Academic Standing'}
              </p>
              <div className="flex items-baseline space-x-1.5">
                <span className="font-mono text-xl font-bold text-[#142D4E] dark:text-[#245A91]">
                  {profile?.gpa ? profile.gpa.toFixed(2) : '4.80'}
                </span>
                <span className="text-[11px] text-[#667085] dark:text-[#94A3B8] font-mono">
                  / 5.0 GPA
                </span>
                <span className="text-[10px] text-[#245A91] font-mono font-bold pl-1">
                  (48 ECTS)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Institutional Action Buttons */}
        <div className="mt-6 pt-5 border-t border-[#DCE2EA] dark:border-[#193150] flex flex-wrap gap-2.5 text-xs font-sans">
          <button
            onClick={() => setActiveTab('requests')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] font-medium transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#245A91]" />
            <span>{lang === 'ru' ? 'Заказать справку с ЭЦП' : 'Request Certified Document'}</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#F8FAFC] dark:bg-[#0E1B2D] hover:bg-[#EDF2F7] dark:hover:bg-[#1E2923] text-[#0F1D30] dark:text-[#FFFFFF] border border-[#DCE2EA] dark:border-[#1E395B] font-medium transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#142D4E] dark:text-[#245A91]" />
            <span>{lang === 'ru' ? 'Расписание и сессия' : 'Timetable & Exams'}</span>
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#F8FAFC] dark:bg-[#0E1B2D] hover:bg-[#EDF2F7] dark:hover:bg-[#1E2923] text-[#0F1D30] dark:text-[#FFFFFF] border border-[#DCE2EA] dark:border-[#1E395B] font-medium transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#142D4E] dark:text-[#245A91]" />
            <span>{lang === 'ru' ? 'Зачетная книжка и БРС' : 'Academic Records'}</span>
          </button>
          <button
            onClick={onOpenAssistant}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#F8FAFC] dark:bg-[#0E1B2D] hover:bg-[#EDF2F7] dark:hover:bg-[#1E2923] text-[#0F1D30] dark:text-[#FFFFFF] border border-[#DCE2EA] dark:border-[#1E395B] font-medium transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#245A91]" />
            <span>{lang === 'ru' ? 'Консультант деканата' : 'Ask Academic Copilot'}</span>
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. ACADEMIC CALENDAR & SEMESTER MILESTONES (Required)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#DCE2EA] dark:border-[#193150]">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-4 h-4 text-[#142D4E] dark:text-[#245A91]" />
            <h3 className="font-semibold text-sm text-[#0F1D30] dark:text-[#FFFFFF]">
              {lang === 'ru' ? 'Академический календарь: Весенний семестр 2026' : 'Academic Calendar & Semester Milestones'}
            </h3>
          </div>
          <span className="text-xs font-mono font-semibold text-[#142D4E] dark:text-[#245A91]">
            {lang === 'ru' ? '8-я учебная неделя из 16 (50% семестра)' : 'Week 8 of 16 (50% Term Completed)'}
          </span>
        </div>

        {/* Milestone Progress Steps */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-sans">
          <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] space-y-1">
            <span className="text-[10px] font-mono text-[#667085] uppercase block">
              {tr(lang, '1 февраля 2026', 'Feb 1, 2026')}
            </span>
            <div className="flex items-center space-x-1.5 font-semibold text-[#142D4E] dark:text-[#245A91]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#142D4E] dark:text-[#245A91]" />
              <span>{tr(lang, 'Старт семестра', 'Term Start')}</span>
            </div>
            <p className="text-[10px] text-[#667085]">
              {tr(lang, 'Учебный поток запущен', 'Academic term launched')}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#142D4E]/10 dark:bg-[#142D4E]/30 border border-[#142D4E]/30 dark:border-[#245A91]/40 space-y-1">
            <span className="text-[10px] font-mono text-[#142D4E] dark:text-[#245A91] font-bold uppercase block">
              {tr(lang, '10 – 24 ноября', 'Nov 10 – 24')}
            </span>
            <div className="flex items-center space-x-1.5 font-bold text-[#142D4E] dark:text-[#245A91]">
              <span className="w-2 h-2 rounded-full bg-[#142D4E] dark:bg-[#245A91] animate-pulse" />
              <span>{tr(lang, 'Промежуточный срез', 'Midterm Checkpoint')}</span>
            </div>
            <p className="text-[10px] text-[#475467] dark:text-[#CBD5E1]">
              {tr(lang, 'Контрольные точки БРС', 'Rating control points')}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] space-y-1">
            <span className="text-[10px] font-mono text-[#667085] uppercase block">
              {tr(lang, '1 декабря 2026', 'Dec 1, 2026')}
            </span>
            <div className="flex items-center space-x-1.5 font-medium text-[#0F1D30] dark:text-[#FFFFFF]">
              <span>{tr(lang, 'Зачетная неделя', 'Credit Week')}</span>
            </div>
            <p className="text-[10px] text-[#667085]">
              {tr(lang, 'Допуск к экзаменам', 'Exam admission')}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] space-y-1">
            <span className="text-[10px] font-mono text-[#667085] uppercase block">
              {tr(lang, '10 – 28 декабря', 'Dec 10 – 28')}
            </span>
            <div className="flex items-center space-x-1.5 font-medium text-[#0F1D30] dark:text-[#FFFFFF]">
              <span>{tr(lang, 'Зимняя сессия', 'Winter Exam Session')}</span>
            </div>
            <p className="text-[10px] text-[#667085]">
              {tr(lang, 'Экзамены и защита', 'Finals & thesis defense')}
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. URGENT ACADEMIC NOTICE (If present)
          ───────────────────────────────────────────────────────────── */}
      {urgentNotif && (
        <section className="bg-[#C63740]/10 dark:bg-[#C63740]/20 border-l-4 border-[#C63740] p-4 rounded-r-xl text-[#0F1D30] dark:text-[#FFFFFF] flex items-start justify-between gap-4">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-[#C63740] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm text-[#C63740] dark:text-[#F06A73]">
                {urgentNotif.title}
              </h3>
              <p className="text-xs text-[#475467] dark:text-[#CBD5E1] font-sans mt-0.5 leading-relaxed">
                {urgentNotif.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('notifications')}
            className="text-xs font-sans font-semibold text-[#C63740] dark:text-[#F06A73] hover:underline flex items-center space-x-1 flex-shrink-0 cursor-pointer"
          >
            <span>{lang === 'ru' ? 'Подробнее' : 'Details'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. MAIN DASHBOARD EDITORIAL GRID (Left 2 cols: Classes & Exams / Right 1 col: Admin & Certificates)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Classes, Timetable & Examination Program */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Lecture Focal Card */}
          {nextClass ? (
            <section className="bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] p-5 sm:p-6 shadow-xs relative">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCE2EA] dark:border-[#193150]">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#142D4E] dark:bg-[#245A91] animate-pulse" />
                  <span className="text-[11px] font-sans font-semibold uppercase tracking-widest text-[#142D4E] dark:text-[#245A91]">
                    {lang === 'ru' ? 'Ближайшее занятие' : 'Next Upcoming Class'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#F8FAFC] dark:bg-[#0E1B2D] text-[#142D4E] dark:text-[#245A91] border border-[#DCE2EA] dark:border-[#1E395B]">
                  {getScheduleTypeLabel(nextClass.type, lang)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="sm:col-span-2 space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-semibold text-[#0F1D30] dark:text-[#FFFFFF] leading-snug">
                    {localizeText(nextClass.subject, lang)}
                  </h3>
                  <p className="text-xs text-[#475467] dark:text-[#CBD5E1] font-sans">
                    {tr(lang, 'Преподаватель:', 'Instructor:')}{' '}
                    <strong className="text-[#0F1D30] dark:text-[#FFFFFF]">{nextClass.teacher}</strong>
                  </p>
                </div>

                <div className="sm:border-l sm:border-[#DCE2EA] sm:dark:border-[#193150] sm:pl-4 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-mono text-[#0F1D30] dark:text-[#FFFFFF]">
                    <Clock className="w-4 h-4 text-[#142D4E] dark:text-[#245A91]" />
                    <span className="font-bold text-sm">{nextClass.start} – {nextClass.end}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-sans text-[#475467] dark:text-[#CBD5E1]">
                    <MapPin className="w-4 h-4 text-[#C63740]" />
                    <span>{tr(lang, 'Аудитория', 'Room')} <strong>{nextClass.room}</strong></span>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <div className="p-6 bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] text-center text-xs text-[#667085]">
              {lang === 'ru' ? 'Сегодня нет запланированных занятий.' : 'No lectures scheduled for today.'}
            </div>
          )}

          {/* Today's Full Schedule Table (ETH Zurich Modernist Grid) */}
          <section className="bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE2EA] dark:border-[#193150] mb-4">
              <h3 className="font-semibold text-sm text-[#0F1D30] dark:text-[#FFFFFF] flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#142D4E] dark:text-[#245A91]" />
                <span>{lang === 'ru' ? 'Расписание на сегодня' : "Today's Classes"}</span>
              </h3>
              <button
                onClick={() => setActiveTab('schedule')}
                className="text-xs font-sans text-[#142D4E] dark:text-[#245A91] hover:underline font-semibold cursor-pointer"
              >
                {lang === 'ru' ? 'Вся неделя и сессия →' : 'Full Timetable →'}
              </button>
            </div>

            <div className="space-y-2.5">
              {todayClasses.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-[#142D4E] dark:text-[#245A91] font-bold text-[11px] w-6">
                      {idx + 1}
                    </span>
                    <span className="font-mono text-[#667085] text-[11px] w-24">
                      {item.start}–{item.end}
                    </span>
                    <div>
                      <h4 className="font-semibold text-xs text-[#0F1D30] dark:text-[#FFFFFF]">
                        {localizeText(item.subject, lang)}
                      </h4>
                      <p className="text-[11px] text-[#667085] font-sans">
                        {item.teacher} • <span className="uppercase font-mono">{getScheduleTypeLabel(item.type, lang)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 font-mono font-bold text-[#142D4E] dark:text-[#245A91]">
                    <MapPin className="w-3.5 h-3.5 text-[#C63740]" />
                    <span>{item.room}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────
              EXAMINATION PROGRAM & UPCOMING ASSESSMENTS (Required)
              ───────────────────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE2EA] dark:border-[#193150]">
              <div className="flex items-center space-x-2">
                <FileBadge className="w-4 h-4 text-[#142D4E] dark:text-[#245A91]" />
                <h3 className="font-semibold text-sm text-[#0F1D30] dark:text-[#FFFFFF]">
                  {lang === 'ru' ? 'Программа промежуточной аттестации и сессии' : 'Upcoming Examination Program'}
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#667085]">
                {lang === 'ru' ? 'Зимняя сессия 2026' : 'Winter Session 2026'}
              </span>
            </div>

            <div className="space-y-2.5">
              {upcomingExams.map((ex, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs ${
                    ex.isDebt
                      ? 'bg-[#C63740]/5 dark:bg-[#C63740]/15 border-[#C63740]/30'
                      : 'bg-[#F8FAFC] dark:bg-[#0E1B2D] border-[#DCE2EA] dark:border-[#1E395B]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#142D4E] text-[#FFFFFF]">
                        {ex.code}
                      </span>
                      <h4 className="font-semibold text-xs sm:text-sm text-[#0F1D30] dark:text-[#FFFFFF]">
                        {localizeText(ex.subject, lang)}
                      </h4>
                      {ex.status === 'date_changed' && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#245A91] text-[#FFFFFF]">
                          {tr(lang, 'ДАТА ПЕРЕНЕСЕНА', 'DATE RESCHEDULED')}
                        </span>
                      )}
                      {ex.status === 'room_changed' && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">
                          {tr(lang, 'АУДИТОРИЯ ИЗМЕНЕНА', 'ROOM CHANGED')}
                        </span>
                      )}
                      {ex.isDebt && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#C63740] text-white">
                          {tr(lang, 'ПЕРЕСДАЧА', 'RETAKE')}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#475467] dark:text-[#CBD5E1] font-sans">
                      {ex.teacher} • {tr(lang, 'Формат:', 'Format:')} <strong>{localizeText(ex.type, lang)}</strong> ({ex.credits} ECTS)
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 font-mono text-xs flex-shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="font-bold text-[#142D4E] dark:text-[#245A91] block">
                        {ex.date}
                      </span>
                      <span className="text-[#667085] text-[11px]">
                        {tr(lang, 'в', 'at')} {ex.time} • {ex.room}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Issued Certificates & Administrative Services */}
        <div className="space-y-6">
          {/* Digital Signature Certificates Ready for Download */}
          {readyRequests.length > 0 && (
            <section className="bg-[#142D4E] text-[#FFFFFF] rounded-xl p-5 shadow-xs border border-[#245A91]/40 space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#245A91]" />
                <h3 className="font-semibold text-sm text-[#FFFFFF]">
                  {lang === 'ru' ? 'Готовые официальные справки' : 'Issued Certified Documents'}
                </h3>
              </div>
              <p className="text-xs text-[#FFFFFF]/80 font-sans leading-relaxed">
                {tr(
                  lang,
                  'Документы подписаны усиленной квалифицированной ЭЦП деканата (ГОСТ Р 34.10-2012) и доступны для выгрузки.',
                  "Documents are certified with the Dean's Office digital signature (GOST) and ready for download."
                )}
              </p>
              <div className="space-y-2 pt-1">
                {readyRequests.map(r => (
                  <div
                    key={r.id}
                    onClick={() => onPreviewCert(r)}
                    className="p-3 rounded-lg bg-[#0E1F36] border border-[#245A91]/30 hover:border-[#245A91] cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-xs text-[#F8FAFC] block">
                        {localizeText(r.typeTitle, lang)}
                      </span>
                      <span className="text-[10px] font-mono text-[#245A91]">№ {r.id}</span>
                    </div>
                    <span className="text-[11px] font-sans font-semibold text-[#245A91] flex items-center space-x-1">
                      <span>{tr(lang, 'Открыть PDF', 'Open PDF')}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Active Applications in Progress */}
          <section className="bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE2EA] dark:border-[#193150]">
              <h3 className="font-semibold text-sm text-[#0F1D30] dark:text-[#FFFFFF] flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#142D4E] dark:text-[#245A91]" />
                <span>{lang === 'ru' ? 'Заявления на рассмотрении' : 'Active Petitions'}</span>
              </h3>
              <button
                onClick={() => setActiveTab('requests')}
                className="text-xs font-sans text-[#142D4E] dark:text-[#245A91] hover:underline font-semibold cursor-pointer"
              >
                {tr(lang, `Все (${requests.length}) →`, `All (${requests.length}) →`)}
              </button>
            </div>

            {activeRequests.length === 0 ? (
              <p className="text-xs text-[#667085] py-3 text-center">
                {tr(lang, 'Нет активных заявлений в обработке.', 'No active petitions in progress.')}
              </p>
            ) : (
              <div className="space-y-2.5">
                {activeRequests.map(r => (
                  <div
                    key={r.id}
                    onClick={() => setActiveTab('requests')}
                    className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] hover:border-[#142D4E]/40 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#0F1D30] dark:text-[#FFFFFF]">
                        {localizeText(r.typeTitle, lang)}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#245A91]/20 text-[#142D4E] dark:text-[#245A91] border border-[#245A91]/30 font-semibold">
                        {getRequestStatusLabel(r.status, lang, 'staff')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#667085] font-mono">
                      <span>{tr(lang, `Срок: до ${r.expectedDate}`, `Due: ${r.expectedDate}`)}</span>
                      <span>№ {r.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ─────────────────────────────────────────────────────────────
              ADMINISTRATIVE SERVICES DIRECTORY (Required)
              ───────────────────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] p-5 shadow-xs space-y-3">
            <h3 className="font-semibold text-sm text-[#0F1D30] dark:text-[#FFFFFF] pb-2 border-b border-[#DCE2EA] dark:border-[#193150] flex items-center space-x-2">
              <Building className="w-4 h-4 text-[#142D4E] dark:text-[#245A91]" />
              <span>{lang === 'ru' ? 'Службы и сервисы университета' : 'University Services Directory'}</span>
            </h3>

            <div className="space-y-2 text-xs font-sans">
              <div
                onClick={() => setActiveTab('requests')}
                className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] hover:border-[#142D4E] transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-4 h-4 text-[#142D4E] dark:text-[#245A91]" />
                  <div>
                    <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF] block">
                      {tr(lang, 'Канцелярия деканата', "Dean's Registry")}
                    </span>
                    <span className="text-[10px] text-[#667085]">
                      {tr(lang, 'Каб. 312 • Справки, выписки, приказы', 'Rm 312 • Certificates, transcripts, decrees')}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#667085]" />
              </div>

              <div
                onClick={onOpenAssistant}
                className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] hover:border-[#142D4E] transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-2.5">
                  <Sparkles className="w-4 h-4 text-[#245A91]" />
                  <div>
                    <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF] block">
                      {tr(lang, 'Цифровой консультант', 'Academic Copilot')}
                    </span>
                    <span className="text-[10px] text-[#667085]">
                      {tr(lang, 'ИИ-помощник по регламентам вуза', 'AI assistant for university procedures')}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#667085]" />
              </div>

              <div
                onClick={onOpenCard}
                className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] hover:border-[#142D4E] transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-2.5">
                  <IdCard className="w-4 h-4 text-[#142D4E] dark:text-[#245A91]" />
                  <div>
                    <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF] block">
                      {tr(lang, 'Студенческий пропуск', 'Digital Student Pass')}
                    </span>
                    <span className="text-[10px] text-[#667085]">
                      {tr(lang, 'Турникеты, кампус, библиотека', 'Turnstiles, campus access, library')}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#667085]" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
