import React, { useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UniversityEmblem } from './components/UniversityEmblem';
import { PageSkeleton } from './components/PageSkeleton';
import { LoginPage } from './pages/LoginPage';

// Keep authenticated portal shell (Header, Sidebar, BottomNav, all 8 authenticated
// pages, and all global modals) strictly lazy so unauthenticated visitors only load
// the lean public login screen without a serial fetch waterfall.
const AuthenticatedShell = lazy(() =>
  import('./components/AuthenticatedShell').then((m) => ({ default: m.AuthenticatedShell }))
);

const MainLayout: React.FC = () => {
  const { user, isLoading, lang } = useAuth();

  useEffect(() => {
    if (!user) {
      document.title =
        lang === 'ru' ? 'Вход • DemoTech University' : 'Sign In • DemoTech University';
    }
  }, [user, lang]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ebeef3] dark:bg-[#0f121a] transition-colors">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#161821] border border-[#33b712]/50 flex items-center justify-center p-2 shadow-md">
            <UniversityEmblem size={44} />
          </div>
          <div className="text-center space-y-1">
            <p className="font-heading font-semibold text-sm text-[#161821] dark:text-[#ffffff] tracking-tight">
              DemoTech University
            </p>
            <p className="text-xs text-[#475569] dark:text-[#94a3b8] font-sans">
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
    <Suspense fallback={<PageSkeleton />}>
      <AuthenticatedShell />
    </Suspense>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
