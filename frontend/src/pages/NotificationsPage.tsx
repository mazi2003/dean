import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  CheckCheck,
  Calendar,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  Filter,
  ShieldAlert,
  Megaphone,
  BookOpen,
  Building,
  CheckCircle2,
} from 'lucide-react';
import { Notification, NotificationKind } from '../types';
import { api } from '../services/api';

interface NotificationsPageProps {
  setActiveTab: (tab: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ setActiveTab }) => {
  const { user, lang, refreshUnreadCount } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedKind, setSelectedKind] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleMarkRead = async (id: string) => {
    await api.markNotificationRead(id);
    await loadData();
    await refreshUnreadCount();
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    await loadData();
    await refreshUnreadCount();
  };

  const kindConfig: Record<NotificationKind, { label: string; icon: any; color: string }> = {
    announcement: {
      label: 'Приказ / Распоряжение',
      icon: Megaphone,
      color: 'bg-[#183D35]/15 text-[#183D35] dark:text-[#C4A46B] border-[#183D35]/30',
    },
    deadline: {
      label: 'Академический дедлайн',
      icon: Clock,
      color: 'bg-[#A33D35]/15 text-[#A33D35] dark:text-[#E2766E] border-[#A33D35]/30',
    },
    schedule_change: {
      label: 'Изменение расписания',
      icon: Calendar,
      color: 'bg-[#C4A46B]/20 text-[#183D35] dark:text-[#C4A46B] border-[#C4A46B]/40',
    },
    request_update: {
      label: 'Статус заявления',
      icon: FileText,
      color: 'bg-[#183D35]/10 text-[#183D35] dark:text-[#C4A46B] border-[#183D35]/25',
    },
  };

  const filteredNotifs = notifications.filter(n => {
    if (selectedKind === 'all') return true;
    return n.kind === selectedKind;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 animate-pulse">
        <div className="h-28 bg-[#E3DDD1]/40 dark:bg-[#1A2520] rounded-xl" />
        <div className="h-96 bg-[#E3DDD1]/40 dark:bg-[#1A2520] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & ACTIONS
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E3DDD1] dark:border-[#26362F]">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#183D35] dark:text-[#C4A46B] font-semibold mb-1">
            <span>Официальный вестник университета</span>
            <span>•</span>
            <span>Канцелярия ректората</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#252923] dark:text-[#F3EFE5]">
            {lang === 'ru' ? 'Вестник и распоряжения ректората' : 'University Gazettes & Decrees'}
          </h1>
          <p className="text-xs text-[#575F53] dark:text-[#C8D1CA] font-sans mt-0.5">
            Приказы по личному составу, изменения учебного плана, расписание сессии и стипендии
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] hover:bg-[#EAE4D7] dark:hover:bg-[#1E2923] text-[#183D35] dark:text-[#C4A46B] border border-[#E3DDD1] dark:border-[#2D3E35] text-xs font-sans font-medium flex items-center space-x-1.5 self-start sm:self-center transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-[#C4A46B]" />
            <span>Прочитать все ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CATEGORY FILTERS
          ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-1 font-sans">
        <Filter className="w-3.5 h-3.5 text-[#7E877B] mr-1 flex-shrink-0" />
        {[
          { id: 'all', label: 'Все публикации' },
          { id: 'announcement', label: 'Приказы и распоряжения' },
          { id: 'deadline', label: 'Академические дедлайны' },
          { id: 'schedule_change', label: 'Изменения расписания' },
          { id: 'request_update', label: 'Статусы заявлений' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedKind(cat.id)}
            className={`px-3 py-1 rounded-lg border text-xs whitespace-nowrap transition-colors cursor-pointer ${
              selectedKind === cat.id
                ? 'bg-[#183D35] text-[#F3EFE5] border-[#183D35] font-semibold'
                : 'bg-white dark:bg-[#18221D] text-[#575F53] dark:text-[#C8D1CA] border-[#E3DDD1] dark:border-[#2D3E35]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. NOTIFICATIONS LIST (Editorial Journal)
          ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] text-xs text-[#7E877B] space-y-2">
            <Bell className="w-8 h-8 text-[#7E877B] mx-auto opacity-50" />
            <p className="font-serif font-bold text-sm text-[#252923] dark:text-[#F3EFE5]">
              В этой категории нет уведомлений
            </p>
            <p>Все официальные распоряжения и приказы публикуются здесь.</p>
          </div>
        ) : (
          filteredNotifs.map(n => {
            const cfg = kindConfig[n.kind] || kindConfig.announcement;
            const Icon = cfg.icon;
            const isUrgent = n.priority === 'urgent' || n.priority === 'high';

            return (
              <div
                key={n.id}
                onClick={() => !n.read && handleMarkRead(n.id)}
                className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 cursor-pointer ${
                  !n.read
                    ? isUrgent
                      ? 'bg-[#A33D35]/10 dark:bg-[#A33D35]/20 border-[#A33D35]/40 shadow-xs'
                      : 'bg-[#FAF8F3] dark:bg-[#15201A] border-[#C4A46B]/40 shadow-xs'
                    : 'bg-white dark:bg-[#18221D] border-[#E3DDD1] dark:border-[#2D3E35]'
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                      isUrgent
                        ? 'bg-[#A33D35] text-white border-[#A33D35]'
                        : 'bg-[#183D35] text-[#C4A46B] border-[#C4A46B]/40'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {isUrgent && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#A33D35] text-white">
                          ВАЖНОЕ РАСПОРЯЖЕНИЕ
                        </span>
                      )}
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-[#183D35] dark:bg-[#C4A46B]" />
                      )}
                      <span className="text-[11px] font-mono text-[#7E877B]">
                        {n.createdAt}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-sm sm:text-base text-[#252923] dark:text-[#F3EFE5]">
                      {n.title}
                    </h3>

                    <p className="text-xs text-[#575F53] dark:text-[#C8D1CA] font-sans leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  {!n.read && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleMarkRead(n.id);
                      }}
                      className="px-2.5 py-1 rounded bg-[#183D35] text-[#F3EFE5] text-[11px] font-sans hover:bg-[#102923] cursor-pointer"
                    >
                      Отметить прочитанным
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
