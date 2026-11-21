import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  CheckCheck,
  Calendar,
  FileText,
  Clock,
  Filter,
  Megaphone,
  type LucideIcon,
} from 'lucide-react';
import { Notification, NotificationKind } from '../types';
import { api } from '../services/api';
import { tr, getNotificationKindLabel } from '../utils/i18n';

interface NotificationsPageProps {
  setActiveTab?: (tab: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = () => {
  const { user, lang, refreshUnreadCount } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedKind, setSelectedKind] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getNotifications();
        if (!cancelled) setNotifications(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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

  const kindConfig: Record<NotificationKind, { label: string; icon: LucideIcon; color: string }> = {
    announcement: {
      label: getNotificationKindLabel('announcement', lang),
      icon: Megaphone,
      color: 'bg-[#142D4E]/15 text-[#142D4E] dark:text-[#93C5FD] border-[#142D4E]/30',
    },
    deadline: {
      label: getNotificationKindLabel('deadline', lang),
      icon: Clock,
      color: 'bg-[#C63740]/15 text-[#C63740] dark:text-[#F06A73] border-[#C63740]/30',
    },
    schedule_change: {
      label: getNotificationKindLabel('schedule_change', lang),
      icon: Calendar,
      color: 'bg-[#245A91]/20 text-[#142D4E] dark:text-[#93C5FD] border-[#245A91]/40',
    },
    request_update: {
      label: getNotificationKindLabel('request_update', lang),
      icon: FileText,
      color: 'bg-[#142D4E]/10 text-[#142D4E] dark:text-[#93C5FD] border-[#142D4E]/25',
    },
  };

  const filteredNotifs = notifications.filter((n) => {
    if (selectedKind === 'all') return true;
    return n.kind === selectedKind;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 animate-pulse">
        <div className="h-28 bg-[#DCE2EA]/40 dark:bg-[#162A45] rounded-xl" />
        <div className="h-96 bg-[#DCE2EA]/40 dark:bg-[#162A45] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & ACTIONS
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#DCE2EA] dark:border-[#193150]">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#142D4E] dark:text-[#93C5FD] font-semibold mb-1">
            <span>
              {tr(lang, 'Официальный вестник университета', 'Official University Gazette')}
            </span>
            <span>•</span>
            <span>{tr(lang, 'Канцелярия ректората', 'Rectorate Chancellery')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F1D30] dark:text-[#FFFFFF]">
            {lang === 'ru' ? 'Вестник и распоряжения ректората' : 'University Gazettes & Decrees'}
          </h1>
          <p className="text-xs text-[#475467] dark:text-[#CBD5E1] font-sans mt-0.5">
            {tr(
              lang,
              'Приказы по личному составу, изменения учебного плана, расписание сессии и стипендии',
              'Academic decrees, curriculum notices, exam schedules, and scholarship announcements'
            )}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] hover:bg-[#EDF2F7] dark:hover:bg-[#1E2923] text-[#142D4E] dark:text-[#93C5FD] border border-[#DCE2EA] dark:border-[#1E395B] text-xs font-sans font-medium flex items-center space-x-1.5 self-start sm:self-center transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-[#245A91]" />
            <span>
              {tr(lang, `Прочитать все (${unreadCount})`, `Mark all read (${unreadCount})`)}
            </span>
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CATEGORY FILTERS
          ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-1 font-sans">
        <Filter className="w-3.5 h-3.5 text-[#667085] dark:text-[#94A3B8] mr-1 flex-shrink-0" />
        {[
          { id: 'all', label: tr(lang, 'Все публикации', 'All Notices') },
          { id: 'announcement', label: tr(lang, 'Приказы и распоряжения', 'Decrees & Bulletins') },
          { id: 'deadline', label: tr(lang, 'Академические дедлайны', 'Academic Deadlines') },
          { id: 'schedule_change', label: tr(lang, 'Изменения расписания', 'Schedule Changes') },
          { id: 'request_update', label: tr(lang, 'Статусы заявлений', 'Petition Updates') },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedKind(cat.id)}
            className={`px-3 py-1 rounded-lg border text-xs whitespace-nowrap transition-colors cursor-pointer ${
              selectedKind === cat.id
                ? 'bg-[#142D4E] text-[#FFFFFF] border-[#142D4E] font-semibold'
                : 'bg-white dark:bg-[#112238] text-[#475467] dark:text-[#CBD5E1] border-[#DCE2EA] dark:border-[#1E395B]'
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
          <div className="p-10 text-center bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] text-xs text-[#667085] dark:text-[#94A3B8] space-y-2">
            <Bell className="w-8 h-8 text-[#667085] dark:text-[#94A3B8] mx-auto opacity-50" />
            <p className="font-semibold text-sm text-[#0F1D30] dark:text-[#FFFFFF]">
              {tr(lang, 'В этой категории нет уведомлений', 'No notifications in this category')}
            </p>
            <p>
              {tr(
                lang,
                'Все официальные распоряжения и приказы публикуются здесь.',
                'All official university decrees and announcements are published here.'
              )}
            </p>
          </div>
        ) : (
          filteredNotifs.map((n) => {
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
                      ? 'bg-[#C63740]/10 dark:bg-[#C63740]/20 border-[#C63740]/40 shadow-xs'
                      : 'bg-[#F8FAFC] dark:bg-[#162A45] border-[#245A91]/40 shadow-xs'
                    : 'bg-white dark:bg-[#112238] border-[#DCE2EA] dark:border-[#1E395B]'
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                      isUrgent
                        ? 'bg-[#C63740] text-white border-[#C63740]'
                        : 'bg-[#142D4E] text-[#93C5FD] border-[#245A91]/40'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                      {isUrgent && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#C63740] text-white">
                          {tr(lang, 'ВАЖНОЕ РАСПОРЯЖЕНИЕ', 'URGENT NOTICE')}
                        </span>
                      )}
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-[#142D4E] dark:bg-[#60A5FA]" />
                      )}
                      <span
                        className={`text-[11px] font-mono ${
                          !n.read && isUrgent
                            ? 'text-rose-950 dark:text-rose-200 font-medium'
                            : 'text-[#475467] dark:text-[#CBD5E1]'
                        }`}
                      >
                        {n.createdAt}
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm sm:text-base text-[#0F1D30] dark:text-[#FFFFFF]">
                      {n.title}
                    </h3>

                    <p className="text-xs text-[#475467] dark:text-[#CBD5E1] font-sans leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  {!n.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(n.id);
                      }}
                      className="px-3 py-1.5 min-h-[44px] rounded-lg bg-[#142D4E] text-[#FFFFFF] text-[11px] font-sans font-medium hover:bg-[#0E1F36] transition-colors cursor-pointer flex items-center justify-center shadow-xs"
                    >
                      {tr(lang, 'Отметить прочитанным', 'Mark as read')}
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
