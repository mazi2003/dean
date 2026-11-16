import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Calendar,
  GraduationCap,
  FileText,
  User,
  Inbox,
  Shield,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { user, lang } = useAuth();
  const isStaff = user?.role === 'staff';

  const studentTabs = [
    { id: 'today', label: lang === 'ru' ? 'Сегодня' : 'Today', icon: Home },
    { id: 'schedule', label: lang === 'ru' ? 'Расписание' : 'Schedule', icon: Calendar },
    { id: 'grades', label: lang === 'ru' ? 'Оценки' : 'Grades', icon: GraduationCap },
    { id: 'requests', label: lang === 'ru' ? 'Справки' : 'Requests', icon: FileText },
    { id: 'profile', label: lang === 'ru' ? 'Профиль' : 'Profile', icon: User },
  ];

  const staffTabs = [
    { id: 'staff_requests', label: lang === 'ru' ? 'Входящие' : 'Inbox', icon: Inbox },
    { id: 'schedule', label: lang === 'ru' ? 'Расписание' : 'Schedule', icon: Calendar },
    { id: 'staff_actions', label: lang === 'ru' ? 'Управление' : 'Manage', icon: Shield },
    { id: 'profile', label: lang === 'ru' ? 'Профиль' : 'Profile', icon: User },
  ];

  const tabs = isStaff ? staffTabs : studentTabs;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 h-full min-w-[48px] min-h-[48px] rounded-lg transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
