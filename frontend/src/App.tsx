import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { StudentCardModal } from './components/StudentCardModal';
import { AssistantModal } from './components/AssistantModal';
import { CertificatePreviewModal } from './components/CertificatePreviewModal';
import { UniversityEmblem } from './components/UniversityEmblem';

import { LoginPage } from './pages/LoginPage';
import { TodayPage } from './pages/TodayPage';
import { SchedulePage } from './pages/SchedulePage';
import { GradesPage } from './pages/GradesPage';
import { RequestsPage } from './pages/RequestsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { StaffStudentsPage } from './pages/StaffStudentsPage';
import { StudentRequest } from './types';

const MainLayout: React.FC = () => {
  const { user, isLoading, lang } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('today');
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [certToPreview, setCertToPreview] = useState<StudentRequest | null>(null);
  const [announcePrefill, setAnnouncePrefill] = useState<{ group?: string; studentId?: string; studentName?: string }>({});

  // Dynamic browser tab title
  useEffect(() => {
    if (!user) {
      document.title = lang === 'ru' ? 'Вход • DemoTech University' : 'Sign In • DemoTech University';
      return;
    }

    const titlesRu: Record<string, string> = {
      today: 'Главная',
      schedule: 'Расписание',
      grades: 'Оценки',
      requests: 'Справки',
      notifications: 'Уведомления',
      profile: 'Профиль',
      staff_requests: 'АРМ Деканата',
      staff_students: 'Группы и студенты',
      staff_actions: 'Приказы',
    };

    const titlesEn: Record<string, string> = {
      today: 'Dashboard',
      schedule: 'Schedule',
      grades: 'Grades',
      requests: 'Requests',
      notifications: 'Alerts',
      profile: 'Profile',
      staff_requests: 'Registry',
      staff_students: 'Groups & Students',
      staff_actions: 'Orders',
    };

    const map = lang === 'ru' ? titlesRu : titlesEn;
    const pageLabel = map[activeTab] || 'Деканат';
    document.title = `${pageLabel} • DemoTech`;
  }, [activeTab, user, lang]);

  // Sync role-based initial tabs
  useEffect(() => {
    if (user?.role === 'staff') {
      if (activeTab === 'today' || activeTab === 'grades' || activeTab === 'requests') {
        setActiveTab('staff_requests');
      }
    } else if (user?.role === 'student') {
      if (activeTab === 'staff_requests' || activeTab === 'staff_actions') {
        setActiveTab('today');
      }
    }
  }, [user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F7] dark:bg-[#0B1524] transition-colors">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-xl bg-[#142D4E] border border-[#245A91]/60 flex items-center justify-center p-2 shadow-md">
            <UniversityEmblem size={44} />
          </div>
          <div className="text-center space-y-1">
            <p className="font-serif font-bold text-sm text-[#142D4E] dark:text-[#245A91] tracking-tight">
              DemoTech University
            </p>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8] font-sans">
              Загрузка цифрового деканата...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F4F7] dark:bg-[#0B1524] text-[#0F1D30] dark:text-[#FFFFFF] transition-colors">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCard={() => setIsCardOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenCard={() => setIsCardOpen(true)}
          onOpenAssistant={() => setIsAssistantOpen(true)}
        />

        <main className="flex-1 pb-20 md:pb-8 overflow-y-auto">
          {activeTab === 'today' && (
            <TodayPage
              setActiveTab={setActiveTab}
              onOpenCard={() => setIsCardOpen(true)}
              onOpenAssistant={() => setIsAssistantOpen(true)}
              onPreviewCert={(req) => setCertToPreview(req)}
            />
          )}
          {activeTab === 'schedule' && <SchedulePage />}
          {activeTab === 'grades' && <GradesPage />}
          {activeTab === 'requests' && (
            <RequestsPage onPreviewCert={(req) => setCertToPreview(req)} />
          )}
          {activeTab === 'notifications' && (
            <NotificationsPage setActiveTab={setActiveTab} />
          )}
          {activeTab === 'profile' && <ProfilePage />}
          {activeTab === 'staff_students' && (
            <StaffStudentsPage
              onOpenAnnouncement={(group, studentId, studentName) => {
                setAnnouncePrefill({ group, studentId, studentName });
                setActiveTab('staff_actions');
              }}
            />
          )}
          {(activeTab === 'staff_requests' || activeTab === 'staff_actions') && (
            <StaffDashboardPage
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              initialAnnounceTarget={announcePrefill.group}
              initialAnnounceStudentId={announcePrefill.studentId}
              initialAnnounceStudentName={announcePrefill.studentName}
            />
          )}
        </main>
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <Footer />

      {/* Global Modals */}
      <StudentCardModal isOpen={isCardOpen} onClose={() => setIsCardOpen(false)} />
      <AssistantModal isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
      <CertificatePreviewModal request={certToPreview} onClose={() => setCertToPreview(null)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
