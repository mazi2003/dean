import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StudentProfile } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: StudentProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  lang: 'ru' | 'en';
  toggleLang: () => void;
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('dean_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });
  const [lang, setLang] = useState<'ru' | 'en'>('ru');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('dean_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const refreshUnreadCount = async () => {
    try {
      if (user) {
        const notifs = await api.getNotifications();
        setUnreadCount(notifs.filter(n => !n.read).length);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const current = await api.getCurrentUser();
        if (current) {
          setUser(current.user);
          setProfile(current.profile);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (user) {
      refreshUnreadCount();
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      setProfile(res.profile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setProfile(null);
  };

  const toggleTheme = () => {
    setTheme(t => (t === 'light' ? 'dark' : 'light'));
  };

  const toggleLang = () => {
    setLang(l => (l === 'ru' ? 'en' : 'ru'));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        login,
        logout,
        theme,
        toggleTheme,
        lang,
        toggleLang,
        unreadCount,
        refreshUnreadCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
