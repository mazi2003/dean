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
  MapPin,
  Compass,
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
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#FBF9F4] dark:bg-[#141C18] border-r border-[#E3DDD1] dark:border-[#26362F] p-4 lg:p-5 space-y-5 transition-colors select-none">
      {/* ─────────────────────────────────────────────────────────────
          STUDENT / STAFF DOSSIER CARD (Collegiate Identity)
          ───────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#1A2520] border border-[#E3DDD1] dark:border-[#2D3E35] shadow-xs relative overflow-hidden">
        {/* Subtle decorative gold corner bevel */}
        <div className="absolute top-0 right-0 w-10 h-10 bg-gradient-to-bl from-[#C4A46B]/25 to-transparent pointer-events-none" />

        <div className="flex items-center space-x-3.5">
          <div className="relative flex-shrink-0">
            <img
              src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user?.fullName}
              className="w-12 h-12 rounded-lg object-cover border border-[#C4A46B]/70 shadow-xs"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#183D35] border border-[#C4A46B] flex items-center justify-center text-[8px] text-[#C4A46B]">
              ✓
            </span>
          </div>

          <div className="overflow-hidden flex-1 min-w-0">
            <h4 className="font-serif font-bold text-sm text-[#252923] dark:text-[#F3EFE5] truncate">
              {user?.fullName}
            </h4>
            <p className="text-[11px] font-sans text-[#183D35] dark:text-[#C4A46B] font-medium truncate mt-0.5">
              {isStaff ? 'Инспектор деканата' : `${profile?.group} • ${profile?.year} курс`}
            </p>
            {!isStaff && (
              <p className="text-[10px] font-mono text-[#7E877B] dark:text-[#8E9B93] truncate">
                № {profile?.studentNumber}
              </p>
            )}
          </div>
        </div>

        {/* Academic Standing / GPA Metric */}
        {!isStaff && (
          <div className="mt-3.5 pt-3 border-t border-[#E3DDD1]/80 dark:border-[#2D3E35] flex items-center justify-between text-xs">
            <span className="text-[#7E877B] dark:text-[#8E9B93] font-sans text-[11px]">
              {lang === 'ru' ? 'Средний балл (GPA):' : 'Cumulative GPA:'}
            </span>
            <div className="flex items-center space-x-1.5 font-mono font-bold text-[#183D35] dark:text-[#C4A46B] bg-[#F6F3EB] dark:bg-[#101714] px-2 py-0.5 rounded border border-[#E3DDD1] dark:border-[#2D3E35]">
              <Award className="w-3 h-3 text-[#C4A46B]" />
              <span>{profile?.gpa ? profile.gpa.toFixed(2) : '4.80'}</span>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PORTAL NAVIGATION ITEMS (Editorial Swiss Grid)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-sans font-semibold tracking-widest uppercase text-[#7E877B] dark:text-[#8E9B93]">
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
                  ? 'bg-[#183D35] text-[#F3EFE5] shadow-xs'
                  : 'text-[#575F53] dark:text-[#C8D1CA] hover:bg-[#F2EEE4] dark:hover:bg-[#1E2923] hover:text-[#252923] dark:hover:text-[#F3EFE5]'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive
                      ? 'text-[#C4A46B]'
                      : 'text-[#7E877B] group-hover:text-[#183D35] dark:group-hover:text-[#C4A46B]'
                  }`}
                />
                <div className="truncate">
                  <span className="block truncate font-medium">{item.label}</span>
                  {item.sublabel && (
                    <span className={`block text-[10px] truncate ${isActive ? 'text-[#C4A46B]/80' : 'text-[#7E877B] dark:text-[#8E9B93]'}`}>
                      {item.sublabel}
                    </span>
                  )}
                </div>
              </div>

              {item.badge !== undefined && item.badge > 0 ? (
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-[#C4A46B] text-[#183D35]'
                      : 'bg-[#A33D35] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-[#C4A46B] flex-shrink-0" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          INSTITUTIONAL SHORTCUTS & REGISTRY COLOPHON
          ───────────────────────────────────────────────────────────── */}
      <div className="pt-4 border-t border-[#E3DDD1] dark:border-[#26362F] space-y-2">
        {!isStaff && (
          <button
            onClick={onOpenCard}
            className="w-full flex items-center space-x-2.5 px-3.5 py-2 rounded-lg text-xs font-sans font-medium bg-white dark:bg-[#1A2520] hover:bg-[#F2EEE4] dark:hover:bg-[#202E28] text-[#252923] dark:text-[#F3EFE5] transition-colors border border-[#E3DDD1] dark:border-[#2D3E35] cursor-pointer"
          >
            <IdCard className="w-4 h-4 text-[#C4A46B]" />
            <span>{lang === 'ru' ? 'Студенческий билет' : 'Digital Student Pass'}</span>
          </button>
        )}

        <button
          onClick={onOpenAssistant}
          className="w-full flex items-center space-x-2.5 px-3.5 py-2 rounded-lg text-xs font-sans font-medium bg-[#183D35]/10 dark:bg-[#183D35]/30 hover:bg-[#183D35]/15 text-[#183D35] dark:text-[#C4A46B] border border-[#183D35]/25 dark:border-[#C4A46B]/30 transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#C4A46B]" />
          <span>{lang === 'ru' ? 'Консультант деканата' : 'Dean\'s AI Advisor'}</span>
        </button>

        {/* Office Hours & Registry Info */}
        <div className="pt-2 px-1 text-[10px] text-[#7E877B] dark:text-[#8E9B93] font-sans space-y-1">
          <div className="flex items-center space-x-1.5">
            <Building className="w-3 h-3 text-[#C4A46B] flex-shrink-0" />
            <span className="truncate">Деканат • Главный корпус, каб. 312</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3 h-3 text-[#7E877B] flex-shrink-0" />
            <span className="truncate">Приемные часы: Пн-Пт 9:00 - 18:00</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
