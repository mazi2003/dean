import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  const [tabNonce, setTabNonce] = useState(0);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setTabNonce((n) => n + 1);
  }, []);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [certToPreview, setCertToPreview] = useState<StudentRequest | null>(null);
  const [announcePrefill, setAnnouncePrefill] = useState<{
    group?: string;
    studentId?: string;
    studentName?: string;
  }>({});

  const resolvedTab = useMemo(() => {
    if (
      user?.role === 'staff' &&
      (activeTab === 'today' || activeTab === 'grades' || activeTab === 'requests')
    ) {
      return 'staff_requests';
    }
    if (
      user?.role === 'student' &&
      (activeTab === 'staff_requests' ||
        activeTab === 'staff_actions' ||
        activeTab === 'staff_students')
    ) {
      return 'today';
    }
    return activeTab;
  }, [activeTab, user?.role]);

  // Dynamic browser tab title
  useEffect(() => {
    if (!user) {
      document.title =
        lang === 'ru' ? 'Вход • DemoTech University' : 'Sign In • DemoTech University';
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
    const pageLabel = map[resolvedTab] || (lang === 'ru' ? 'Деканат' : "Dean's Office");
    document.title = `${pageLabel} • DemoTech`;
  }, [resolvedTab, user, lang]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F7] dark:bg-[#0B1524] transition-colors">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-xl bg-[#142D4E] border border-[#245A91]/60 flex items-center justify-center p-2 shadow-md">
            <UniversityEmblem size={44} />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold text-sm text-[#142D4E] dark:text-[#93C5FD] tracking-tight">
              DemoTech University
            </p>
            <p className="text-xs text-[#667085] dark:text-[#94A3B8] font-sans">
              {lang === 'ru'
                ? 'Загрузка цифрового деканата...'
                : "Loading Digital Dean's Office..."}
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
        activeTab={resolvedTab}
        setActiveTab={handleTabChange}
        onOpenCard={() => setIsCardOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={resolvedTab}
          setActiveTab={handleTabChange}
          onOpenCard={() => setIsCardOpen(true)}
          onOpenAssistant={() => setIsAssistantOpen(true)}
        />

        <main className="flex-1 min-w-0 pb-20 md:pb-8 overflow-x-hidden overflow-y-auto">
          {resolvedTab === 'today' && (
            <TodayPage
              setActiveTab={handleTabChange}
              onOpenCard={() => setIsCardOpen(true)}
              onOpenAssistant={() => setIsAssistantOpen(true)}
              onPreviewCert={(req) => setCertToPreview(req)}
            />
          )}
          {resolvedTab === 'schedule' && <SchedulePage />}
          {resolvedTab === 'grades' && <GradesPage />}
          {resolvedTab === 'requests' && (
            <RequestsPage onPreviewCert={(req) => setCertToPreview(req)} />
          )}
          {resolvedTab === 'notifications' && <NotificationsPage setActiveTab={handleTabChange} />}
          {resolvedTab === 'profile' && <ProfilePage />}
          {resolvedTab === 'staff_students' && (
            <StaffStudentsPage
              onOpenAnnouncement={(group, studentId, studentName) => {
                setAnnouncePrefill({ group, studentId, studentName });
                handleTabChange('staff_actions');
              }}
            />
          )}
          {(resolvedTab === 'staff_requests' || resolvedTab === 'staff_actions') && (
            <StaffDashboardPage
              activeTab={resolvedTab}
              setActiveTab={handleTabChange}
              tabNonce={tabNonce}
              initialAnnounceTarget={announcePrefill.group}
              initialAnnounceStudentId={announcePrefill.studentId}
              initialAnnounceStudentName={announcePrefill.studentName}
            />
          )}
        </main>
      </div>

      <BottomNav activeTab={resolvedTab} setActiveTab={handleTabChange} />
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
