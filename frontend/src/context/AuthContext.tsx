import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  accessibilityMode: boolean;
  toggleAccessibilityMode: () => void;
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
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } catch {
      return 'light';
    }
  });
  const [accessibilityMode, setAccessibilityMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dean_accessibility') === 'true';
    } catch {
      return false;
    }
  });
  const [lang, setLang] = useState<'ru' | 'en'>(() => {
    try {
      const saved = localStorage.getItem('dean_lang');
      if (saved === 'en' || saved === 'ru') return saved;
      return 'ru';
    } catch {
      return 'ru';
    }
  });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
      localStorage.setItem('dean_lang', lang);
    } catch {
      // ignore
    }
  }, [lang]);

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

  useEffect(() => {
    try {
      if (accessibilityMode) {
        document.documentElement.classList.add('accessibility-mode');
      } else {
        document.documentElement.classList.remove('accessibility-mode');
      }
      localStorage.setItem('dean_accessibility', String(accessibilityMode));
    } catch {
      // ignore
    }
  }, [accessibilityMode]);

  const refreshUnreadCount = useCallback(async () => {
    try {
      if (user) {
        const notifs = await api.getNotifications();
        setUnreadCount(notifs.filter((n) => !n.read).length);
      }
    } catch {
      // ignore
    }
  }, [user]);

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
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const notifs = await api.getNotifications();
        if (!cancelled) setUnreadCount(notifs.filter((n) => !n.read).length);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
    setProfile(res.profile);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setProfile(null);
  };

  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  const toggleAccessibilityMode = () => {
    setAccessibilityMode((a) => !a);
  };

  const toggleLang = () => {
    setLang((l) => (l === 'ru' ? 'en' : 'ru'));
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
        accessibilityMode,
        toggleAccessibilityMode,
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
