import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { StudentCardModal } from './components/StudentCardModal';
import { AssistantModal } from './components/AssistantModal';
import { CertificatePreviewModal } from './components/CertificatePreviewModal';

import { LoginPage } from './pages/LoginPage';
import { TodayPage } from './pages/TodayPage';
import { SchedulePage } from './pages/SchedulePage';
import { GradesPage } from './pages/GradesPage';
import { RequestsPage } from './pages/RequestsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { StudentRequest } from './types';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('today');
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [certToPreview, setCertToPreview] = useState<StudentRequest | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white animate-spin">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <p className="text-xs text-slate-500 font-medium">Загрузка цифрового деканата...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
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
          {(activeTab === 'staff_requests' || activeTab === 'staff_actions') && (
            <StaffDashboardPage />
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
