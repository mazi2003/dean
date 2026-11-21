import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  FileText,
  User,
  Inbox,
  Shield,
  Users,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { user, lang } = useAuth();
  const isStaff = user?.role === 'staff';

  const studentTabs = [
    { id: 'today', label: lang === 'ru' ? 'Главная' : 'Overview', icon: LayoutDashboard },
    { id: 'schedule', label: lang === 'ru' ? 'Расписание' : 'Timetable', icon: Calendar },
    { id: 'grades', label: lang === 'ru' ? 'Зачетка' : 'Records', icon: GraduationCap },
    { id: 'requests', label: lang === 'ru' ? 'Справки' : 'Requests', icon: FileText },
    { id: 'profile', label: lang === 'ru' ? 'Профиль' : 'Dossier', icon: User },
  ];

  const staffTabs = [
    { id: 'staff_requests', label: lang === 'ru' ? 'Заявления' : 'Inbox', icon: Inbox },
    { id: 'staff_students', label: lang === 'ru' ? 'Группы' : 'Groups', icon: Users },
    { id: 'schedule', label: lang === 'ru' ? 'Диспетчер' : 'Timetable', icon: Calendar },
    { id: 'staff_actions', label: lang === 'ru' ? 'Приказы' : 'Decrees', icon: Shield },
    { id: 'profile', label: lang === 'ru' ? 'Служебный' : 'Staff', icon: User },
  ];

  const tabs = isStaff ? staffTabs : studentTabs;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#171c26]/95 backdrop-blur-md border-t border-[#e2e4e8] dark:border-[#273142] pb-safe transition-colors select-none shadow-lg">
      <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 h-full min-w-[48px] min-h-[48px] px-1 rounded-2xl transition-all relative cursor-pointer ${
                isActive
                  ? 'text-[#166534] dark:text-[#45d320] font-semibold'
                  : 'text-[#475569] dark:text-[#94a3b8] hover:text-[#161821] dark:hover:text-[#ffffff]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4] text-[#166534] dark:text-[#45d320]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#33b712]" />
                )}
              </div>
              <span className="text-[10px] font-heading mt-1 tracking-tight truncate max-w-full">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
