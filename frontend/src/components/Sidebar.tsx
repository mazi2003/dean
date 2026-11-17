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
} from 'lucide-react';

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
  icon: any;
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
      sublabel: lang === 'ru' ? 'Заявления с ЭЦП' : 'Certified petitions',
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
      sublabel: lang === 'ru' ? 'Очередь на подпись ЭЦП' : 'Pending verification',
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
      sublabel: lang === 'ru' ? 'Права доступа и ЭЦП' : 'Credentials & digital key',
      icon: User,
    },
  ];

  const items: NavItem[] = isStaff ? staffItems : studentItems;

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#F8FAFC] dark:bg-[#0E1F36] border-r border-[#DCE2EA] dark:border-[#193150] p-4 lg:p-5 space-y-5 transition-colors select-none">
      {/* ─────────────────────────────────────────────────────────────
          STUDENT / STAFF DOSSIER CARD (Collegiate Identity)
          ───────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#162A45] border border-[#DCE2EA] dark:border-[#1E395B] shadow-xs relative overflow-hidden">
        {/* Subtle decorative corner bevel */}
        <div className="absolute top-0 right-0 w-10 h-10 bg-gradient-to-bl from-[#245A91]/25 to-transparent pointer-events-none" />

        <div className="flex items-center space-x-3.5">
          <div className="relative flex-shrink-0">
            <img
              src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user?.fullName}
              className="w-12 h-12 rounded-lg object-cover border border-[#245A91]/70 shadow-xs"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#142D4E] border border-[#60A5FA] flex items-center justify-center text-[8px] text-[#FFFFFF]">
              ✓
            </span>
          </div>

          <div className="overflow-hidden flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-[#0F1D30] dark:text-[#FFFFFF] truncate">
              {user?.fullName}
            </h4>
            <p className="text-[11px] font-sans text-[#142D4E] dark:text-[#60A5FA] font-medium truncate mt-0.5">
              {isStaff
                ? lang === 'ru'
                  ? 'Инспектор деканата'
                  : 'Faculty Inspector'
                : `${profile?.group} • ${lang === 'ru' ? `${profile?.year} курс` : `Year ${profile?.year}`}`}
            </p>
            {!isStaff && (
              <p className="text-[10px] font-mono text-[#667085] dark:text-[#94A3B8] truncate">
                № {profile?.studentNumber}
              </p>
            )}
          </div>
        </div>

        {/* Academic Standing / GPA Metric */}
        {!isStaff && (
          <div className="mt-3.5 pt-3 border-t border-[#DCE2EA]/80 dark:border-[#1E395B] flex items-center justify-between text-xs">
            <span className="text-[#667085] dark:text-[#94A3B8] font-sans text-[11px]">
              {lang === 'ru' ? 'Средний балл (GPA):' : 'Cumulative GPA:'}
            </span>
            <div className="flex items-center space-x-1.5 font-mono font-bold text-[#142D4E] dark:text-[#60A5FA] bg-[#F2F4F7] dark:bg-[#0E1F36] px-2 py-0.5 rounded border border-[#DCE2EA] dark:border-[#1E395B]">
              <Award className="w-3 h-3 text-[#245A91] dark:text-[#60A5FA]" />
              <span>{profile?.gpa ? profile.gpa.toFixed(2) : '4.80'}</span>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PORTAL NAVIGATION ITEMS (Editorial Swiss Grid)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-sans font-semibold tracking-widest uppercase text-[#667085] dark:text-[#94A3B8]">
          {lang === 'ru' ? 'Разделы деканата' : 'Academic Portal'}
        </div>

        {items.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-sans font-medium transition-all group text-left cursor-pointer ${
                isActive
                  ? 'bg-[#142D4E] text-[#FFFFFF] shadow-xs'
                  : 'text-[#475467] dark:text-[#CBD5E1] hover:bg-[#EDF2F7] dark:hover:bg-[#162A45] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF]'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive
                      ? 'text-[#93C5FD]'
                      : 'text-[#667085] dark:text-[#94A3B8] group-hover:text-[#142D4E] dark:group-hover:text-[#60A5FA]'
                  }`}
                />
                <div className="truncate">
                  <span className="block truncate font-medium">{item.label}</span>
                  {item.sublabel && (
                    <span className={`block text-[10px] truncate ${isActive ? 'text-[#CBD5E1]' : 'text-[#667085] dark:text-[#94A3B8]'}`}>
                      {item.sublabel}
                    </span>
                  )}
                </div>
              </div>

              {item.badge !== undefined && item.badge > 0 ? (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-[#FFFFFF] text-[#142D4E]'
                      : 'bg-[#C63740] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-[#93C5FD] flex-shrink-0" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          INSTITUTIONAL SHORTCUTS & REGISTRY COLOPHON
          ───────────────────────────────────────────────────────────── */}
      <div className="pt-4 border-t border-[#DCE2EA] dark:border-[#193150] space-y-2">
        {!isStaff && (
          <button
            onClick={onOpenCard}
            className="w-full flex items-center space-x-2.5 px-3.5 py-2 rounded-lg text-xs font-sans font-medium bg-white dark:bg-[#162A45] hover:bg-[#EDF2F7] dark:hover:bg-[#1E395B] text-[#0F1D30] dark:text-[#FFFFFF] transition-colors border border-[#DCE2EA] dark:border-[#1E395B] cursor-pointer"
          >
            <IdCard className="w-4 h-4 text-[#245A91] dark:text-[#60A5FA]" />
            <span>{lang === 'ru' ? 'Студенческий билет' : 'Digital Student Pass'}</span>
          </button>
        )}

        <button
          onClick={onOpenAssistant}
          className="w-full flex items-center space-x-2.5 px-3.5 py-2 rounded-lg text-xs font-sans font-medium bg-[#142D4E]/10 dark:bg-[#162A45] hover:bg-[#142D4E]/15 text-[#142D4E] dark:text-[#93C5FD] border border-[#142D4E]/25 dark:border-[#274C78] transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#245A91] dark:text-[#93C5FD]" />
          <span>{lang === 'ru' ? 'Консультант деканата' : 'Dean\'s AI Advisor'}</span>
        </button>

        {/* Office Hours & Registry Info */}
        <div className="pt-2 px-1 text-[10px] text-[#667085] dark:text-[#94A3B8] font-sans space-y-1">
          <div className="flex items-center space-x-1.5">
            <Building className="w-3 h-3 text-[#245A91] flex-shrink-0" />
            <span className="truncate">
              {lang === 'ru' ? 'Деканат • Главный корпус, каб. 312' : "Dean's Office • Main Bldg, Rm 312"}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3 h-3 text-[#667085] flex-shrink-0" />
            <span className="truncate">
              {lang === 'ru' ? 'Приемные часы: Пн-Пт 9:00 - 18:00' : 'Office hours: Mon–Fri 9:00–18:00'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
