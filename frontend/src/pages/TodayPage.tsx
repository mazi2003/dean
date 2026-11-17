import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  MapPin,
  AlertTriangle,
  FileText,
  Calendar,
  Sparkles,
  IdCard,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Bell,
  BookOpen,
  ArrowUpRight,
  ShieldAlert,
  Inbox,
  Megaphone,
  ShieldCheck,
  Building,
  Award,
  CalendarDays,
  FileCheck2,
  ExternalLink,
  BookMarked,
  Library,
  HelpCircle,
  FileBadge,
  Users,
} from 'lucide-react';
import { ScheduleEntry, StudentRequest, Notification, ExamEntry } from '../types';
import { api } from '../services/api';
import { UniversityEmblem } from '../components/UniversityEmblem';

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
            api.getExams(profile?.group || 'ДУ-101'),
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
  }, [user, isStaff]);

  // Today date formatted
  const todayStr = new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-5 animate-pulse">
        <div className="h-44 bg-[#E3DDD1]/40 dark:bg-[#1A2520] rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-80 bg-[#E3DDD1]/40 dark:bg-[#1A2520] rounded-xl" />
          <div className="h-80 bg-[#E3DDD1]/40 dark:bg-[#1A2520] rounded-xl" />
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
        <section className="bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-5 dark:opacity-10 pointer-events-none">
            <UniversityEmblem size={220} variant="full" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 text-xs font-sans text-[#7E877B] dark:text-[#8E9B93]">
                <span className="font-mono text-[#183D35] dark:text-[#C4A46B] font-semibold">
                  Деканат Факультета МО
                </span>
                <span>•</span>
                <span>Главный корпус, ауд. 312</span>
                <span>•</span>
                <span className="capitalize">{todayStr}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight text-[#252923] dark:text-[#F3EFE5]">
                {lang === 'ru' ? 'Добрый день, Мария Волкова!' : 'Welcome, Maria Volkova!'}
              </h1>

              <p className="text-xs sm:text-sm text-[#575F53] dark:text-[#C8D1CA] font-sans max-w-2xl">
                Заместитель декана по учебно-методической работе • Факультет международных отношений
              </p>
            </div>

            {/* Quick Digital Signature status badge */}
            <div className="flex items-center space-x-3 bg-[#FAF8F3] dark:bg-[#121714] p-3.5 rounded-lg border border-[#E3DDD1] dark:border-[#2D3E35] self-start">
              <div className="w-10 h-10 rounded-md bg-[#183D35] text-[#C4A46B] flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-sans uppercase tracking-wider text-[#7E877B] dark:text-[#8E9B93]">
                  ЭЦП деканата (ГОСТ)
                </p>
                <span className="font-mono text-xs font-bold text-[#183D35] dark:text-[#C4A46B] block">
                  Активна и проверена
                </span>
                <span className="text-[10px] text-[#7E877B] font-mono">
                  № 77AA-9402-E12F-2026
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons for Staff */}
          <div className="mt-6 pt-5 border-t border-[#E3DDD1] dark:border-[#26362F] flex flex-wrap gap-2.5 text-xs font-sans">
            <button
              onClick={() => setActiveTab('staff_requests')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#183D35] hover:bg-[#102923] text-[#F3EFE5] font-medium transition-colors cursor-pointer"
            >
              <Inbox className="w-3.5 h-3.5 text-[#C4A46B]" />
              <span>Заявления студентов ({newRequestsCount} новых)</span>
            </button>
            <button
              onClick={() => setActiveTab('staff_students')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#FAF8F3] dark:bg-[#121714] hover:bg-[#EAE4D7] dark:hover:bg-[#1E2923] text-[#252923] dark:text-[#F3EFE5] border border-[#E3DDD1] dark:border-[#2D3E35] font-medium transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#183D35] dark:text-[#C4A46B]" />
              <span>Группы и студенты</span>
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#FAF8F3] dark:bg-[#121714] hover:bg-[#EAE4D7] dark:hover:bg-[#1E2923] text-[#252923] dark:text-[#F3EFE5] border border-[#E3DDD1] dark:border-[#2D3E35] font-medium transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#183D35] dark:text-[#C4A46B]" />
              <span>Диспетчер расписания и замен</span>
            </button>
            <button
              onClick={() => setActiveTab('staff_actions')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#FAF8F3] dark:bg-[#121714] hover:bg-[#EAE4D7] dark:hover:bg-[#1E2923] text-[#252923] dark:text-[#F3EFE5] border border-[#E3DDD1] dark:border-[#2D3E35] font-medium transition-colors cursor-pointer"
            >
              <Megaphone className="w-3.5 h-3.5 text-[#C4A46B]" />
              <span>Опубликовать приказ</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#FAF8F3] dark:bg-[#121714] hover:bg-[#EAE4D7] dark:hover:bg-[#1E2923] text-[#252923] dark:text-[#F3EFE5] border border-[#E3DDD1] dark:border-[#2D3E35] font-medium transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#C4A46B]" />
              <span>Служебный профиль и права</span>
            </button>
          </div>
        </section>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab('staff_requests')}
            className="p-4 rounded-xl bg-white dark:bg-[#18221D] border border-[#E3DDD1] dark:border-[#2D3E35] shadow-xs cursor-pointer hover:border-[#183D35] transition-all space-y-1"
          >
            <span className="text-[11px] font-sans text-[#7E877B] uppercase tracking-wider block">
              Новые заявления
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="font-mono text-2xl font-bold text-[#183D35] dark:text-[#C4A46B]">
                {newRequestsCount}
              </span>
              <span className="text-xs text-[#7E877B]">из {requests.length}</span>
            </div>
            <p className="text-[11px] text-[#575F53] dark:text-[#C8D1CA]">Ожидают первого рассмотрения</p>
          </div>

          <div
            onClick={() => setActiveTab('staff_requests')}
            className="p-4 rounded-xl bg-white dark:bg-[#18221D] border border-[#E3DDD1] dark:border-[#2D3E35] shadow-xs cursor-pointer hover:border-[#183D35] transition-all space-y-1"
          >
            <span className="text-[11px] font-sans text-[#7E877B] uppercase tracking-wider block">
              В обработке
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="font-mono text-2xl font-bold text-[#183D35] dark:text-[#C4A46B]">
                {inReviewCount}
              </span>
              <span className="text-xs text-[#7E877B]">заявлений</span>
            </div>
            <p className="text-[11px] text-[#575F53] dark:text-[#C8D1CA]">Проверка данных инспектором</p>
          </div>

          <div
            onClick={() => setActiveTab('staff_requests')}
            className="p-4 rounded-xl bg-white dark:bg-[#18221D] border border-[#E3DDD1] dark:border-[#2D3E35] shadow-xs cursor-pointer hover:border-[#183D35] transition-all space-y-1"
          >
            <span className="text-[11px] font-sans text-[#7E877B] uppercase tracking-wider block">
              Подписано ЭЦП
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="font-mono text-2xl font-bold text-[#183D35] dark:text-[#C4A46B]">
                {readyCount}
              </span>
              <span className="text-xs text-[#7E877B]">готовых</span>
            </div>
            <p className="text-[11px] text-[#575F53] dark:text-[#C8D1CA]">Сформированы и заверены</p>
          </div>

          <div
            onClick={() => setActiveTab('schedule')}
            className="p-4 rounded-xl bg-white dark:bg-[#18221D] border border-[#E3DDD1] dark:border-[#2D3E35] shadow-xs cursor-pointer hover:border-[#183D35] transition-all space-y-1"
          >
            <span className="text-[11px] font-sans text-[#7E877B] uppercase tracking-wider block">
              Потоки в расписании
            </span>
            <div className="flex items-baseline space-x-2">
              <span className="font-mono text-2xl font-bold text-[#183D35] dark:text-[#C4A46B]">
                2
              </span>
              <span className="text-xs text-[#7E877B]">группы</span>
            </div>
            <p className="text-[11px] text-[#575F53] dark:text-[#C8D1CA]">ДУ-101 и ДУ-205 под контролем</p>
          </div>
        </div>

        {/* Recent student requests requiring review */}
        <section className="bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3DDD1] dark:border-[#26362F]">
            <div className="flex items-center space-x-2">
              <Inbox className="w-4 h-4 text-[#183D35] dark:text-[#C4A46B]" />
              <h3 className="font-serif font-bold text-base text-[#252923] dark:text-[#F3EFE5]">
                Очередь последних входящих заявлений студентов
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('staff_requests')}
              className="text-xs font-sans font-semibold text-[#183D35] dark:text-[#C4A46B] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Все заявления ({requests.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#E3DDD1] dark:divide-[#26362F]">
            {requests.slice(0, 5).map(req => (
              <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-serif font-bold text-sm text-[#252923] dark:text-[#F3EFE5]">
                      {req.typeTitle}
                    </span>
                    <span className="font-mono text-[11px] text-[#7E877B]">№ {req.id}</span>
                  </div>
                  <p className="text-xs text-[#575F53] dark:text-[#C8D1CA] font-sans">
                    Студент: <strong>{req.studentName || 'Студент'}</strong> ({req.studentGroup || 'ДУ-101'}) • Срок готовности: до {req.expectedDate}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#FAF8F3] dark:bg-[#121714] text-[#183D35] dark:text-[#C4A46B] border border-[#E3DDD1] dark:border-[#2D3E35]">
                    {req.status}
                  </span>
                  <button
                    onClick={() => setActiveTab('staff_requests')}
                    className="px-2.5 py-1 rounded bg-[#183D35] text-[#F3EFE5] text-xs font-sans font-medium hover:bg-[#102923] cursor-pointer"
                  >
                    Открыть
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
      <section className="bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative watermark */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-5 dark:opacity-10 pointer-events-none">
          <UniversityEmblem size={220} variant="full" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-2">
            {/* Academic metadata pill */}
            <div className="inline-flex items-center space-x-2 text-xs font-sans text-[#7E877B] dark:text-[#8E9B93]">
              <span className="font-mono text-[#183D35] dark:text-[#C4A46B] font-semibold">
                {profile?.group}
              </span>
              <span>•</span>
              <span>{profile?.year} курс</span>
              <span>•</span>
              <span className="capitalize">{todayStr}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight text-[#252923] dark:text-[#F3EFE5]">
              {lang === 'ru'
                ? `С возвращением, ${user?.fullName.split(' ')[0]}!`
                : `Welcome back, ${user?.fullName.split(' ')[0]}!`}
            </h1>

            <p className="text-xs sm:text-sm text-[#575F53] dark:text-[#C8D1CA] font-sans max-w-2xl">
              {profile?.program} • {profile?.faculty} • Форма: {profile?.studyForm || 'Бюджет'}
            </p>
          </div>

          {/* Academic Standing Metric Box (ECTS + GPA) */}
          <div className="flex items-center space-x-3 bg-[#FAF8F3] dark:bg-[#121714] p-3.5 rounded-lg border border-[#E3DDD1] dark:border-[#2D3E35] self-start">
            <div className="w-10 h-10 rounded-md bg-[#183D35] text-[#C4A46B] flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-sans uppercase tracking-wider text-[#7E877B] dark:text-[#8E9B93]">
                {lang === 'ru' ? 'Академический статус' : 'Academic Standing'}
              </p>
              <div className="flex items-baseline space-x-1.5">
                <span className="font-mono text-xl font-bold text-[#183D35] dark:text-[#C4A46B]">
                  {profile?.gpa ? profile.gpa.toFixed(2) : '4.80'}
                </span>
                <span className="text-[11px] text-[#7E877B] dark:text-[#8E9B93] font-mono">
                  / 5.0 GPA
                </span>
                <span className="text-[10px] text-[#C4A46B] font-mono font-bold pl-1">
                  (48 ECTS)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Institutional Action Buttons */}
        <div className="mt-6 pt-5 border-t border-[#E3DDD1] dark:border-[#26362F] flex flex-wrap gap-2.5 text-xs font-sans">
          <button
            onClick={() => setActiveTab('requests')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#183D35] hover:bg-[#102923] text-[#F3EFE5] font-medium transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#C4A46B]" />
            <span>{lang === 'ru' ? 'Заказать справку с ЭЦП' : 'Request Certified Document'}</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#FAF8F3] dark:bg-[#121714] hover:bg-[#EAE4D7] dark:hover:bg-[#1E2923] text-[#252923] dark:text-[#F3EFE5] border border-[#E3DDD1] dark:border-[#2D3E35] font-medium transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#183D35] dark:text-[#C4A46B]" />
            <span>{lang === 'ru' ? 'Расписание и сессия' : 'Timetable & Exams'}</span>
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#FAF8F3] dark:bg-[#121714] hover:bg-[#EAE4D7] dark:hover:bg-[#1E2923] text-[#252923] dark:text-[#F3EFE5] border border-[#E3DDD1] dark:border-[#2D3E35] font-medium transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#183D35] dark:text-[#C4A46B]" />
            <span>{lang === 'ru' ? 'Зачетная книжка и БРС' : 'Academic Records'}</span>
          </button>
          <button
            onClick={onOpenAssistant}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#FAF8F3] dark:bg-[#121714] hover:bg-[#EAE4D7] dark:hover:bg-[#1E2923] text-[#252923] dark:text-[#F3EFE5] border border-[#E3DDD1] dark:border-[#2D3E35] font-medium transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C4A46B]" />
            <span>{lang === 'ru' ? 'Консультант деканата' : 'Ask Academic Copilot'}</span>
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. ACADEMIC CALENDAR & SEMESTER MILESTONES (Required)
          ───────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#E3DDD1] dark:border-[#26362F]">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-4 h-4 text-[#183D35] dark:text-[#C4A46B]" />
            <h3 className="font-serif font-bold text-sm text-[#252923] dark:text-[#F3EFE5]">
              {lang === 'ru' ? 'Академический календарь: Весенний семестр 2026' : 'Academic Calendar & Semester Milestones'}
            </h3>
          </div>
          <span className="text-xs font-mono font-semibold text-[#183D35] dark:text-[#C4A46B]">
            {lang === 'ru' ? '8-я учебная неделя из 16 (50% семестра)' : 'Week 8 of 16 (50% Term Completed)'}
          </span>
        </div>

        {/* Milestone Progress Steps */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-sans">
          <div className="p-3 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] space-y-1">
            <span className="text-[10px] font-mono text-[#7E877B] uppercase block">1 февраля 2026</span>
            <div className="flex items-center space-x-1.5 font-semibold text-[#183D35] dark:text-[#C4A46B]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#183D35] dark:text-[#C4A46B]" />
              <span>Старт семестра</span>
            </div>
            <p className="text-[10px] text-[#7E877B]">Учебный поток запущен</p>
          </div>

          <div className="p-3 rounded-lg bg-[#183D35]/10 dark:bg-[#183D35]/30 border border-[#183D35]/30 dark:border-[#C4A46B]/40 space-y-1">
            <span className="text-[10px] font-mono text-[#183D35] dark:text-[#C4A46B] font-bold uppercase block">
              10 – 24 ноября
            </span>
            <div className="flex items-center space-x-1.5 font-bold text-[#183D35] dark:text-[#C4A46B]">
              <span className="w-2 h-2 rounded-full bg-[#183D35] dark:bg-[#C4A46B] animate-pulse" />
              <span>Промежуточный срез</span>
            </div>
            <p className="text-[10px] text-[#575F53] dark:text-[#C8D1CA]">Контрольные точки БРС</p>
          </div>

          <div className="p-3 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] space-y-1">
            <span className="text-[10px] font-mono text-[#7E877B] uppercase block">1 декабря 2026</span>
            <div className="flex items-center space-x-1.5 font-medium text-[#252923] dark:text-[#F3EFE5]">
              <span>Зачетная неделя</span>
            </div>
            <p className="text-[10px] text-[#7E877B]">Допуск к экзаменам</p>
          </div>

          <div className="p-3 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] space-y-1">
            <span className="text-[10px] font-mono text-[#7E877B] uppercase block">10 – 28 декабря</span>
            <div className="flex items-center space-x-1.5 font-medium text-[#252923] dark:text-[#F3EFE5]">
              <span>Зимняя сессия</span>
            </div>
            <p className="text-[10px] text-[#7E877B]">Экзамены и защита</p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. URGENT ACADEMIC NOTICE (If present)
          ───────────────────────────────────────────────────────────── */}
      {urgentNotif && (
        <section className="bg-[#A33D35]/10 dark:bg-[#A33D35]/20 border-l-4 border-[#A33D35] p-4 rounded-r-xl text-[#252923] dark:text-[#F3EFE5] flex items-start justify-between gap-4">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-[#A33D35] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-serif font-bold text-sm text-[#A33D35] dark:text-[#E2766E]">
                {urgentNotif.title}
              </h3>
              <p className="text-xs text-[#575F53] dark:text-[#C8D1CA] font-sans mt-0.5 leading-relaxed">
                {urgentNotif.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('notifications')}
            className="text-xs font-sans font-semibold text-[#A33D35] dark:text-[#E2766E] hover:underline flex items-center space-x-1 flex-shrink-0 cursor-pointer"
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
            <section className="bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] p-5 sm:p-6 shadow-xs relative">
              <div className="flex items-center justify-between pb-3 border-b border-[#E3DDD1] dark:border-[#26362F]">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#183D35] dark:bg-[#C4A46B] animate-pulse" />
                  <span className="text-[11px] font-sans font-semibold uppercase tracking-widest text-[#183D35] dark:text-[#C4A46B]">
                    {lang === 'ru' ? 'Ближайшее занятие' : 'Next Upcoming Class'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#FAF8F3] dark:bg-[#121714] text-[#183D35] dark:text-[#C4A46B] border border-[#E3DDD1] dark:border-[#2D3E35]">
                  {nextClass.type}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="sm:col-span-2 space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-[#252923] dark:text-[#F3EFE5] leading-snug">
                    {nextClass.subject}
                  </h3>
                  <p className="text-xs text-[#575F53] dark:text-[#C8D1CA] font-sans">
                    Преподаватель: <strong className="text-[#252923] dark:text-[#F3EFE5]">{nextClass.teacher}</strong>
                  </p>
                </div>

                <div className="sm:border-l sm:border-[#E3DDD1] sm:dark:border-[#26362F] sm:pl-4 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-mono text-[#252923] dark:text-[#F3EFE5]">
                    <Clock className="w-4 h-4 text-[#183D35] dark:text-[#C4A46B]" />
                    <span className="font-bold text-sm">{nextClass.start} – {nextClass.end}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-sans text-[#575F53] dark:text-[#C8D1CA]">
                    <MapPin className="w-4 h-4 text-[#A33D35]" />
                    <span>Аудитория <strong>{nextClass.room}</strong></span>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <div className="p-6 bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] text-center text-xs text-[#7E877B]">
              {lang === 'ru' ? 'Сегодня нет запланированных занятий.' : 'No lectures scheduled for today.'}
            </div>
          )}

          {/* Today's Full Schedule Table (ETH Zurich Modernist Grid) */}
          <section className="bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3DDD1] dark:border-[#26362F] mb-4">
              <h3 className="font-serif font-bold text-sm text-[#252923] dark:text-[#F3EFE5] flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#183D35] dark:text-[#C4A46B]" />
                <span>{lang === 'ru' ? 'Расписание на сегодня' : 'Today\'s Classes'}</span>
              </h3>
              <button
                onClick={() => setActiveTab('schedule')}
                className="text-xs font-sans text-[#183D35] dark:text-[#C4A46B] hover:underline font-semibold cursor-pointer"
              >
                {lang === 'ru' ? 'Вся неделя и сессия →' : 'Full Timetable →'}
              </button>
            </div>

            <div className="space-y-2.5">
              {todayClasses.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-[#183D35] dark:text-[#C4A46B] font-bold text-[11px] w-6">
                      {idx + 1}
                    </span>
                    <span className="font-mono text-[#7E877B] text-[11px] w-24">
                      {item.start}–{item.end}
                    </span>
                    <div>
                      <h4 className="font-serif font-bold text-xs text-[#252923] dark:text-[#F3EFE5]">
                        {item.subject}
                      </h4>
                      <p className="text-[11px] text-[#7E877B] font-sans">
                        {item.teacher} • <span className="uppercase font-mono">{item.type}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 font-mono font-bold text-[#183D35] dark:text-[#C4A46B]">
                    <MapPin className="w-3.5 h-3.5 text-[#A33D35]" />
                    <span>{item.room}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────
              EXAMINATION PROGRAM & UPCOMING ASSESSMENTS (Required)
              ───────────────────────────────────────────────────────────── */}
          <section className="bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3DDD1] dark:border-[#26362F]">
              <div className="flex items-center space-x-2">
                <FileBadge className="w-4 h-4 text-[#183D35] dark:text-[#C4A46B]" />
                <h3 className="font-serif font-bold text-sm text-[#252923] dark:text-[#F3EFE5]">
                  {lang === 'ru' ? 'Программа промежуточной аттестации и сессии' : 'Upcoming Examination Program'}
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#7E877B]">
                {lang === 'ru' ? 'Зимняя сессия 2026' : 'Winter Session 2026'}
              </span>
            </div>

            <div className="space-y-2.5">
              {upcomingExams.map((ex, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs ${
                    ex.isDebt
                      ? 'bg-[#A33D35]/5 dark:bg-[#A33D35]/15 border-[#A33D35]/30'
                      : 'bg-[#FAF8F3] dark:bg-[#121714] border-[#E3DDD1] dark:border-[#2D3E35]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#183D35] text-[#F3EFE5]">
                        {ex.code}
                      </span>
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[#252923] dark:text-[#F3EFE5]">
                        {ex.subject}
                      </h4>
                      {ex.status === 'date_changed' && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#C4A46B] text-[#183D35]">
                          ДАТА ПЕРЕНЕСЕНА
                        </span>
                      )}
                      {ex.status === 'room_changed' && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">
                          АУДИТОРИЯ ИЗМЕНЕНА
                        </span>
                      )}
                      {ex.isDebt && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#A33D35] text-white">
                          ПЕРЕСДАЧА
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#575F53] dark:text-[#C8D1CA] font-sans">
                      {ex.teacher} • Формат: <strong>{ex.type}</strong> ({ex.credits} ECTS)
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 font-mono text-xs flex-shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="font-bold text-[#183D35] dark:text-[#C4A46B] block">
                        {ex.date}
                      </span>
                      <span className="text-[#7E877B] text-[11px]">
                        в {ex.time} • {ex.room}
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
            <section className="bg-[#183D35] text-[#F3EFE5] rounded-xl p-5 shadow-xs border border-[#C4A46B]/40 space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#C4A46B]" />
                <h3 className="font-serif font-bold text-sm text-[#F3EFE5]">
                  {lang === 'ru' ? 'Готовые официальные справки' : 'Issued Certified Documents'}
                </h3>
              </div>
              <p className="text-xs text-[#F3EFE5]/80 font-sans leading-relaxed">
                Документы подписаны усиленной квалифицированной ЭЦП деканата (ГОСТ Р 34.10-2012) и доступны для выгрузки.
              </p>
              <div className="space-y-2 pt-1">
                {readyRequests.map(r => (
                  <div
                    key={r.id}
                    onClick={() => onPreviewCert(r)}
                    className="p-3 rounded-lg bg-[#102923] border border-[#C4A46B]/30 hover:border-[#C4A46B] cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <span className="font-serif font-bold text-xs text-[#FAF8F3] block">
                        {r.typeTitle}
                      </span>
                      <span className="text-[10px] font-mono text-[#C4A46B]">№ {r.id}</span>
                    </div>
                    <span className="text-[11px] font-sans font-semibold text-[#C4A46B] flex items-center space-x-1">
                      <span>Открыть PDF</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Active Applications in Progress */}
          <section className="bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3DDD1] dark:border-[#26362F]">
              <h3 className="font-serif font-bold text-sm text-[#252923] dark:text-[#F3EFE5] flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#183D35] dark:text-[#C4A46B]" />
                <span>{lang === 'ru' ? 'Заявления на рассмотрении' : 'Active Petitions'}</span>
              </h3>
              <button
                onClick={() => setActiveTab('requests')}
                className="text-xs font-sans text-[#183D35] dark:text-[#C4A46B] hover:underline font-semibold cursor-pointer"
              >
                Все ({requests.length}) →
              </button>
            </div>

            {activeRequests.length === 0 ? (
              <p className="text-xs text-[#7E877B] py-3 text-center">
                Нет активных заявлений в обработке.
              </p>
            ) : (
              <div className="space-y-2.5">
                {activeRequests.map(r => (
                  <div
                    key={r.id}
                    onClick={() => setActiveTab('requests')}
                    className="p-3 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] hover:border-[#183D35]/40 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-xs text-[#252923] dark:text-[#F3EFE5]">
                        {r.typeTitle}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C4A46B]/20 text-[#183D35] dark:text-[#C4A46B] border border-[#C4A46B]/30 font-semibold">
                        {r.status === 'needs_info' ? 'Уточнение' : 'В работе'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#7E877B] font-mono">
                      <span>Срок: до {r.expectedDate}</span>
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
          <section className="bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] p-5 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-sm text-[#252923] dark:text-[#F3EFE5] pb-2 border-b border-[#E3DDD1] dark:border-[#26362F] flex items-center space-x-2">
              <Building className="w-4 h-4 text-[#183D35] dark:text-[#C4A46B]" />
              <span>{lang === 'ru' ? 'Службы и сервисы университета' : 'University Services Directory'}</span>
            </h3>

            <div className="space-y-2 text-xs font-sans">
              <div
                onClick={() => setActiveTab('requests')}
                className="p-2.5 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] hover:border-[#183D35] transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-4 h-4 text-[#183D35] dark:text-[#C4A46B]" />
                  <div>
                    <span className="font-medium text-[#252923] dark:text-[#F3EFE5] block">Канцелярия деканата</span>
                    <span className="text-[10px] text-[#7E877B]">Каб. 312 • Справки, выписки, приказы</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#7E877B]" />
              </div>

              <div
                onClick={onOpenAssistant}
                className="p-2.5 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] hover:border-[#183D35] transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-2.5">
                  <Sparkles className="w-4 h-4 text-[#C4A46B]" />
                  <div>
                    <span className="font-medium text-[#252923] dark:text-[#F3EFE5] block">Цифровой консультант</span>
                    <span className="text-[10px] text-[#7E877B]">ИИ-помощник по регламентам вуза</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#7E877B]" />
              </div>

              <div
                onClick={onOpenCard}
                className="p-2.5 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] hover:border-[#183D35] transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-2.5">
                  <IdCard className="w-4 h-4 text-[#183D35] dark:text-[#C4A46B]" />
                  <div>
                    <span className="font-medium text-[#252923] dark:text-[#F3EFE5] block">Студенческий пропуск</span>
                    <span className="text-[10px] text-[#7E877B]">Турникеты, кампус, библиотека</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#7E877B]" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
