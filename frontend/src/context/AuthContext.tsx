import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StudentProfile } from '../types';
import { api } from '../services/api';
import { TEST_USERS } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  profile: StudentProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchAccount: (email: string) => Promise<void>;
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<'ru' | 'en'>('ru');
  const [unreadCount, setUnreadCount] = useState(0);

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
          // Default to Aigul for immediate demonstration if no session
          const defaultUser = TEST_USERS['aigul.nurova@demo.edu'];
          setUser(defaultUser.user);
          setProfile(defaultUser.profile);
          localStorage.setItem('dean_current_user', JSON.stringify(defaultUser.user));
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

  const switchAccount = async (email: string) => {
    const target = TEST_USERS[email];
    if (target) {
      setIsLoading(true);
      try {
        await api.login(email, target.password);
        setUser(target.user);
        setProfile(target.profile);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
        switchAccount,
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
