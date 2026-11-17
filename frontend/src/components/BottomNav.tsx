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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/95 dark:bg-[#121715]/95 backdrop-blur-md border-t border-[#E3DDD1] dark:border-[#26362F] pb-safe transition-colors select-none">
      <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 h-full min-w-[48px] min-h-[48px] rounded-lg transition-colors relative cursor-pointer ${
                isActive
                  ? 'text-[#183D35] dark:text-[#C4A46B] font-semibold'
                  : 'text-[#7E877B] dark:text-[#8E9B93] hover:text-[#252923] dark:hover:text-[#F3EFE5]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.7]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#183D35] dark:bg-[#C4A46B]" />
                )}
              </div>
              <span className="text-[10px] font-sans mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
