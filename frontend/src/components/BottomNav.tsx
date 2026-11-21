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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FFFFFF]/95 dark:bg-[#0E1B2D]/95 backdrop-blur-md border-t border-[#DCE2EA] dark:border-[#193150] pb-safe transition-colors select-none">
      <div className="flex items-center justify-around h-16 px-0.5 sm:px-1 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 h-full min-w-[48px] min-h-[48px] px-0.5 rounded-lg transition-colors relative cursor-pointer ${
                isActive
                  ? 'text-[#142D4E] dark:text-[#93C5FD] font-semibold'
                  : 'text-[#667085] dark:text-[#94A3B8] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.7]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#142D4E] dark:bg-[#93C5FD]" />
                )}
              </div>
              <span className="text-[9.5px] sm:text-[10px] font-sans mt-1 tracking-tight truncate max-w-full">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
