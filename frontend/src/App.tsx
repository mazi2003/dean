import React, { useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PageSkeleton } from './components/PageSkeleton';
import { LoginPage } from './pages/LoginPage';

// Keep authenticated portal shell (Header, Sidebar, BottomNav, all 8 authenticated
// pages, and all global modals) strictly lazy so unauthenticated visitors only load
// the lean public login screen without a serial fetch waterfall.
const AuthenticatedShell = lazy(() =>
  import('./components/AuthenticatedShell').then((m) => ({ default: m.AuthenticatedShell }))
);

const MainLayout: React.FC = () => {
  const { user, lang } = useAuth();

  useEffect(() => {
    if (!user) {
      document.title =
        lang === 'ru' ? 'Вход • DemoTech University' : 'Sign In • DemoTech University';
    }
  }, [user, lang]);

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
