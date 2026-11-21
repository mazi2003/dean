import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Footer } from './Footer';
import { PageSkeleton } from './PageSkeleton';
import { StudentRequest } from '../types';

// Lazy Authenticated Route Pages (Code Splitting)
const TodayPage = lazy(() => import('../pages/TodayPage').then((m) => ({ default: m.TodayPage })));
const SchedulePage = lazy(() =>
  import('../pages/SchedulePage').then((m) => ({ default: m.SchedulePage }))
);
const GradesPage = lazy(() =>
  import('../pages/GradesPage').then((m) => ({ default: m.GradesPage }))
);
const RequestsPage = lazy(() =>
  import('../pages/RequestsPage').then((m) => ({ default: m.RequestsPage }))
);
const NotificationsPage = lazy(() =>
  import('../pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
);
const ProfilePage = lazy(() =>
  import('../pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const StaffDashboardPage = lazy(() =>
  import('../pages/StaffDashboardPage').then((m) => ({ default: m.StaffDashboardPage }))
);
const StaffStudentsPage = lazy(() =>
  import('../pages/StaffStudentsPage').then((m) => ({ default: m.StaffStudentsPage }))
);

// Lazy Global Modals (Deferred until opened)
const StudentCardModal = lazy(() =>
  import('./StudentCardModal').then((m) => ({ default: m.StudentCardModal }))
);
const AssistantModal = lazy(() =>
  import('./AssistantModal').then((m) => ({ default: m.AssistantModal }))
);
const CertificatePreviewModal = lazy(() =>
  import('./CertificatePreviewModal').then((m) => ({ default: m.CertificatePreviewModal }))
);
const CampusMapModal = lazy(() =>
  import('./CampusMapModal').then((m) => ({ default: m.CampusMapModal }))
);

export const AuthenticatedShell: React.FC = () => {
  const { user, lang } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('today');
  const [tabNonce, setTabNonce] = useState(0);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setTabNonce((n) => n + 1);
  }, []);

  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapRoomCode, setMapRoomCode] = useState<string | null>(null);

  const handleOpenMap = useCallback((room?: string) => {
    setMapRoomCode(room || null);
    setIsMapOpen(true);
  }, []);

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

  useEffect(() => {
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
  }, [resolvedTab, lang]);

  return (
    <div className="min-h-screen flex flex-col bg-[#ebeef3] dark:bg-[#0f121a] text-[#161821] dark:text-[#ffffff] transition-colors">
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
          <Suspense fallback={<PageSkeleton />}>
            {resolvedTab === 'today' && (
              <TodayPage
                setActiveTab={handleTabChange}
                onOpenCard={() => setIsCardOpen(true)}
                onOpenAssistant={() => setIsAssistantOpen(true)}
                onPreviewCert={(req) => setCertToPreview(req)}
                onOpenMap={handleOpenMap}
              />
            )}
            {resolvedTab === 'schedule' && <SchedulePage onOpenMap={handleOpenMap} />}
            {resolvedTab === 'grades' && <GradesPage onOpenMap={handleOpenMap} />}
            {resolvedTab === 'requests' && (
              <RequestsPage onPreviewCert={(req) => setCertToPreview(req)} />
            )}
            {resolvedTab === 'notifications' && (
              <NotificationsPage setActiveTab={handleTabChange} />
            )}
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
          </Suspense>
        </main>
      </div>

      <BottomNav activeTab={resolvedTab} setActiveTab={handleTabChange} />
      <Footer />

      {/* Global Modals (Lazy Loaded on Demand) */}
      {isCardOpen && (
        <Suspense fallback={null}>
          <StudentCardModal isOpen={isCardOpen} onClose={() => setIsCardOpen(false)} />
        </Suspense>
      )}
      {isAssistantOpen && (
        <Suspense fallback={null}>
          <AssistantModal isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
        </Suspense>
      )}
      {certToPreview && (
        <Suspense fallback={null}>
          <CertificatePreviewModal
            request={certToPreview}
            onClose={() => setCertToPreview(null)}
          />
        </Suspense>
      )}
      {isMapOpen && (
        <Suspense fallback={null}>
          <CampusMapModal
            isOpen={isMapOpen}
            onClose={() => setIsMapOpen(false)}
            initialRoomCode={mapRoomCode}
          />
        </Suspense>
      )}
    </div>
  );
};
