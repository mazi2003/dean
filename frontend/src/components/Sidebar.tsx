import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  GraduationCap,
  FileText,
  User,
  Bell,
  Inbox,
  Shield,
  Sparkles,
  IdCard,
  Building,
  Award,
  ChevronRight,
  LayoutDashboard,
  Clock,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { resolveAvatarSrc } from '../utils/avatar';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCard: () => void;
  onOpenAssistant: () => void;
}

interface NavItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCard,
  onOpenAssistant,
}) => {
  const { user, profile, lang, unreadCount } = useAuth();
  const isStaff = user?.role === 'staff';

  const studentItems: NavItem[] = [
    {
      id: 'today',
      label: lang === 'ru' ? 'Главная (Сегодня)' : 'Academic Overview',
      sublabel: lang === 'ru' ? 'Сводка дня и дедлайны' : 'Daily brief & deadlines',
      icon: LayoutDashboard,
    },
    {
      id: 'schedule',
      label: lang === 'ru' ? 'Расписание и сессия' : 'Timetable & Exams',
      sublabel: lang === 'ru' ? 'Занятия и экзамены' : 'Lectures & exam session',
      icon: Calendar,
    },
    {
      id: 'grades',
      label: lang === 'ru' ? 'Зачетная книжка' : 'Academic Records',
      sublabel: lang === 'ru' ? 'БРС баллы и ECTS' : 'Transcript & ECTS',
      icon: GraduationCap,
    },
    {
      id: 'requests',
      label: lang === 'ru' ? 'Справки и документы' : 'Official Certificates',
      sublabel: lang === 'ru' ? 'Заявления и макеты PDF' : 'Petitions & PDF previews',
      icon: FileText,
    },
    {
      id: 'notifications',
      label: lang === 'ru' ? 'Вестник и приказы' : 'Decrees & Bulletins',
      sublabel: lang === 'ru' ? 'Распоряжения ректората' : 'Official announcements',
      icon: Bell,
      badge: unreadCount,
    },
    {
      id: 'profile',
      label: lang === 'ru' ? 'Учебная карточка' : 'Student Dossier',
      sublabel: lang === 'ru' ? 'Личные данные и статус' : 'Identity & standing',
      icon: User,
    },
  ];

  const staffItems: NavItem[] = [
    {
      id: 'staff_requests',
      label: lang === 'ru' ? 'Заявления студентов' : 'Student Inquiries',
      sublabel: lang === 'ru' ? 'Очередь рассмотрения' : 'Pending review queue',
      icon: Inbox,
    },
    {
      id: 'staff_students',
      label: lang === 'ru' ? 'Группы и студенты' : 'Groups & Students',
      sublabel: lang === 'ru' ? 'Списки групп и личные дела' : 'Rosters & student dossiers',
      icon: Users,
    },
    {
      id: 'schedule',
      label: lang === 'ru' ? 'Диспетчер расписания' : 'Faculty Timetable',
      sublabel: lang === 'ru' ? 'Замены пар и аудиторий' : 'Lecture rooms & dispatch',
      icon: Calendar,
    },
    {
      id: 'staff_actions',
      label: lang === 'ru' ? 'Публикация приказов' : 'Decrees & Notices',
      sublabel: lang === 'ru' ? 'Рассылка распоряжений' : 'Official broadcasts',
      icon: Shield,
    },
    {
      id: 'profile',
      label: lang === 'ru' ? 'Служебный профиль' : 'Staff Dossier',
      sublabel: lang === 'ru' ? 'Права доступа (RBAC)' : 'Role permissions',
      icon: User,
    },
  ];

  const items: NavItem[] = isStaff ? staffItems : studentItems;

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#f6f6f9] dark:bg-[#121620] border-r border-[#e2e4e8] dark:border-[#273142] p-4 lg:p-5 space-y-5 transition-colors select-none">
      {/* ─────────────────────────────────────────────────────────────
          STUDENT / STAFF PROFILE CARD (Innopolis High-Tech Surface)
          ───────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#171c26] border border-[#e2e4e8] dark:border-[#273142] shadow-xs relative overflow-hidden">
        <div className="flex items-center space-x-3.5">
          <div className="relative flex-shrink-0">
            <img
              src={resolveAvatarSrc(profile?.avatarUrl, user?.fullName)}
              alt={user?.fullName}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#33b712] shadow-xs"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#33b712] border-2 border-white dark:border-[#171c26] flex items-center justify-center text-[7px] text-white">
              ✓
            </span>
          </div>

          <div className="overflow-hidden flex-1 min-w-0">
            <h4 className="font-heading font-semibold text-sm text-[#161821] dark:text-[#ffffff] truncate">
              {user?.fullName}
            </h4>
            <p className="text-[11px] font-sans text-[#166534] dark:text-[#45d320] font-semibold truncate mt-0.5">
              {isStaff
                ? lang === 'ru'
                  ? 'Инспектор деканата'
                  : 'Faculty Inspector'
                : `${profile?.group} • ${lang === 'ru' ? `${profile?.year} курс` : `Year ${profile?.year}`}`}
            </p>
            {!isStaff && (
              <p className="text-[10px] font-mono text-[#475569] dark:text-[#94a3b8] truncate">
                № {profile?.studentNumber}
              </p>
            )}
          </div>
        </div>

        {/* Academic Standing / GPA Metric */}
        {!isStaff && (
          <div className="mt-3 pt-3 border-t border-[#e2e4e8] dark:border-[#273142] flex items-center justify-between text-xs">
            <span className="text-[#475569] dark:text-[#94a3b8] font-sans text-[11px]">
              {lang === 'ru' ? 'Средний балл (GPA):' : 'Cumulative GPA:'}
            </span>
            <div className="flex items-center space-x-1.5 font-mono font-bold text-[#166534] dark:text-[#45d320] bg-[#ebfbee] dark:bg-[#1e2d24] px-2.5 py-0.5 rounded-full border border-[#33b712]/30">
              <Award className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320]" />
              <span>{profile?.gpa ? profile.gpa.toFixed(2) : '4.80'}</span>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PORTAL NAVIGATION ITEMS (Innopolis Pill Menu)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 space-y-1.5">
        <div className="px-3 pb-1 text-[10px] font-heading font-semibold tracking-wider uppercase text-[#475569] dark:text-[#94a3b8]">
          {lang === 'ru' ? 'Разделы деканата' : 'Academic Portal'}
        </div>

        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs sm:text-sm font-heading font-medium transition-all group text-left cursor-pointer ${
                isActive
                  ? 'bg-[#161821] dark:bg-[#ffffff] text-white dark:text-[#161821] shadow-xs'
                  : 'text-[#4b5563] dark:text-[#cbd5e1] hover:bg-white dark:hover:bg-[#171c26] hover:text-[#161821] dark:hover:text-[#ffffff]'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive
                      ? 'text-[#166534] dark:text-[#45d320]'
                      : 'text-[#475569] dark:text-[#94a3b8] group-hover:text-[#166534] dark:text-[#45d320]'
                  }`}
                />
                <div className="truncate">
                  <span className="block truncate font-semibold">{item.label}</span>
                  {item.sublabel && (
                    <span
                      className={`block text-[10px] font-sans truncate ${isActive ? 'opacity-80' : 'text-[#475569] dark:text-[#94a3b8]'}`}
                    >
                      {item.sublabel}
                    </span>
                  )}
                </div>
              </div>

              {item.badge !== undefined && item.badge > 0 ? (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-[#166534] text-white'
                      : 'bg-[#be123c] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320] flex-shrink-0" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          INSTITUTIONAL SHORTCUTS & REGISTRY INFO
          ───────────────────────────────────────────────────────────── */}
      <div className="pt-3 border-t border-[#e2e4e8] dark:border-[#273142] space-y-2">
        {!isStaff && (
          <button
            onClick={onOpenCard}
            className="w-full flex items-center space-x-2.5 px-4 py-2.5 rounded-full text-xs font-heading font-semibold bg-white dark:bg-[#171c26] hover:bg-[#ebeef3] dark:hover:bg-[#1f293d] text-[#161821] dark:text-[#ffffff] transition-all border border-[#e2e4e8] dark:border-[#273142] cursor-pointer shadow-2xs"
          >
            <IdCard className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
            <span>{lang === 'ru' ? 'Студенческий билет' : 'Digital Student Pass'}</span>
          </button>
        )}

        <button
          onClick={onOpenAssistant}
          className="w-full flex items-center space-x-2.5 px-4 py-2.5 rounded-full text-xs font-heading font-semibold bg-[#ebfbee] dark:bg-[#1e2d24] hover:bg-[#d8f7e6] text-[#161821] dark:text-[#ffffff] border border-[#33b712]/30 transition-all cursor-pointer shadow-2xs"
        >
          <Sparkles className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
          <span>{lang === 'ru' ? 'Консультант деканата' : "Dean's AI Advisor"}</span>
        </button>

        {/* Office Hours & Registry Info */}
        <div className="pt-2 px-2 text-[10px] text-[#475569] dark:text-[#94a3b8] font-sans space-y-1">
          <div className="flex items-center space-x-1.5">
            <Building className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320] flex-shrink-0" />
            <span className="truncate">
              {lang === 'ru'
                ? 'Деканат • Главный корпус, каб. 312'
                : "Dean's Office • Main Bldg, Rm 312"}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-[#475569] dark:text-[#94a3b8] flex-shrink-0" />
            <span className="truncate">
              {lang === 'ru'
                ? 'Приемные часы: Пн-Пт 9:00 - 18:00'
                : 'Office hours: Mon–Fri 9:00–18:00'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
