import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Calendar,
  GraduationCap,
  FileText,
  User,
  Bell,
  Inbox,
  Shield,
  Sparkles,
  IdCard,
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
    { id: 'today', label: lang === 'ru' ? 'Главная (Сегодня)' : 'Today Overview', icon: Home },
    { id: 'schedule', label: lang === 'ru' ? 'Расписание занятий' : 'Schedule', icon: Calendar },
    { id: 'grades', label: lang === 'ru' ? 'Успеваемость и сессия' : 'Academic Grades', icon: GraduationCap },
    { id: 'requests', label: lang === 'ru' ? 'Справки и заявления' : 'Applications & Certs', icon: FileText },
    { id: 'notifications', label: lang === 'ru' ? 'Уведомления' : 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'profile', label: lang === 'ru' ? 'Мой профиль' : 'Student Profile', icon: User },
  ];

  const staffItems: NavItem[] = [
    { id: 'staff_requests', label: lang === 'ru' ? 'Заявления студентов' : 'Student Requests', icon: Inbox },
    { id: 'schedule', label: lang === 'ru' ? 'Расписание и замены' : 'Schedule Management', icon: Calendar },
    { id: 'staff_actions', label: lang === 'ru' ? 'Объявления деканата' : 'Announcements', icon: Shield },
    { id: 'profile', label: lang === 'ru' ? 'Профиль сотрудника' : 'Staff Profile', icon: User },
  ];

  const items: NavItem[] = isStaff ? staffItems : studentItems;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 space-y-6">
      {/* Student/Staff Info Card */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-800/60 dark:to-blue-950/20 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <img
            src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt=""
            className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-500/40"
          />
          <div className="overflow-hidden">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
              {user?.fullName}
            </h4>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              {isStaff ? 'Сотрудник деканата' : `${profile?.group} • ${profile?.year} курс`}
            </p>
          </div>
        </div>

        {!isStaff && (
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Средний балл:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
              {profile?.averageScore || '88.5'} ({profile?.gpa || '4.8'})
            </span>
          </div>
        )}
      </div>

      {/* Main Nav */}
      <div className="flex-1 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
          {lang === 'ru' ? 'Меню кабинета' : 'Navigation'}
        </div>
        {items.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Standout feature shortcuts */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        {!isStaff && (
          <button
            onClick={onOpenCard}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <IdCard className="w-4 h-4 text-blue-500" />
            <span>{lang === 'ru' ? 'Цифровой студбилет' : 'Digital Student ID'}</span>
          </button>
        )}

        <button
          onClick={onOpenAssistant}
          className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600/10 to-indigo-600/10 text-blue-700 dark:text-blue-300 hover:from-blue-600/20 hover:to-indigo-600/20 transition-all border border-blue-200 dark:border-blue-900/50"
        >
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{lang === 'ru' ? 'Задать вопрос AI деканату' : 'Ask AI Copilot'}</span>
        </button>
      </div>
    </aside>
  );
};
