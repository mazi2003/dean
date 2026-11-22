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
import { tr, getNotificationKindLabel, localizeText, formatNotificationDate } from '../utils/i18n';

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
      color:
        'bg-[#ebfbee] dark:bg-[#16351d] text-[#166534] dark:text-[#45d320] border-[#33b712]/30',
    },
    deadline: {
      label: getNotificationKindLabel('deadline', lang),
      icon: Clock,
      color:
        'bg-[#fff2f5] dark:bg-[#38161f] text-[#be123c] dark:text-[#fecdd3] border-[#ff4d8b]/30',
    },
    schedule_change: {
      label: getNotificationKindLabel('schedule_change', lang),
      icon: Calendar,
      color:
        'bg-[#e8f4fd] dark:bg-[#1a2838] text-[#0369a1] dark:text-[#38bdf8] border-[#3598fe]/30',
    },
    request_update: {
      label: getNotificationKindLabel('request_update', lang),
      icon: FileText,
      color:
        'bg-[#f4ebfc] dark:bg-[#251b3b] text-[#6d28d9] dark:text-[#c4b5fd] border-[#8b5cf6]/30',
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
        <div className="h-28 bg-white/60 dark:bg-[#171c26]/60 rounded-3xl" />
        <div className="h-96 bg-white/60 dark:bg-[#171c26]/60 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & ACTIONS
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e2e4e8] dark:border-[#273142]">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-sans text-[#166534] dark:text-[#45d320] font-semibold mb-1">
            <span>
              {tr(lang, 'Официальный вестник университета', 'Official University Gazette')}
            </span>
            <span>•</span>
            <span>{tr(lang, 'Канцелярия ректората', 'Rectorate Chancellery')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-[#161821] dark:text-[#ffffff]">
            {lang === 'ru' ? 'Вестник и распоряжения ректората' : 'University Gazettes & Decrees'}
          </h1>
          <p className="text-xs text-[#4b5563] dark:text-[#cbd5e1] font-sans mt-0.5">
            {tr(
              lang,
              'Приказы по личному составу, изменения учебного плана, расписание сессии и стипендии',
              'Academic decrees, curriculum notices, exam schedules, and scholarship announcements'
            )}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="px-4 py-2 min-h-[44px] rounded-full bg-white dark:bg-[#171c26] hover:bg-[#ebeef3] dark:hover:bg-[#1e2533] text-[#161821] dark:text-[#ffffff] border border-[#e2e4e8] dark:border-[#273142] text-xs font-heading font-semibold flex items-center space-x-2 self-start sm:self-center transition-colors cursor-pointer shadow-2xs"
          >
            <CheckCheck className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
            <span>
              {tr(lang, `Прочитать все (${unreadCount})`, `Mark all read (${unreadCount})`)}
            </span>
          </button>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CATEGORY FILTERS (Pill Filter Controls)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-1 font-sans">
        <Filter className="w-3.5 h-3.5 text-[#475569] dark:text-[#94a3b8] mr-1 flex-shrink-0" />
        {[
          { id: 'all', label: tr(lang, 'Все публикации', 'All Notices') },
          { id: 'announcement', label: tr(lang, 'Приказы и распоряжения', 'Decrees & Bulletins') },
          { id: 'deadline', label: tr(lang, 'Академические дедлайны', 'Academic Deadlines') },
          { id: 'schedule_change', label: tr(lang, 'Изменения расписания', 'Schedule Changes') },
          { id: 'request_update', label: tr(lang, 'Статусы заявлений', 'Petition Updates') },
        ].map((cat) => (
          <button
            type="button"
            key={cat.id}
            onClick={() => setSelectedKind(cat.id)}
            className={`px-4 py-1.5 min-h-[44px] rounded-full border text-xs font-heading font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedKind === cat.id
                ? 'bg-[#161821] dark:bg-white text-white dark:text-[#161821] border-[#161821] font-semibold shadow-xs'
                : 'bg-white dark:bg-[#171c26] text-[#4b5563] dark:text-[#cbd5e1] border-[#e2e4e8] dark:border-[#273142] hover:border-[#33b712]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. NOTIFICATIONS LIST (Interactive Campus Cards)
          ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-[#171c26] rounded-3xl border border-[#e2e4e8] dark:border-[#273142] text-xs text-[#475569] dark:text-[#94a3b8] space-y-2">
            <Bell className="w-8 h-8 text-[#475569] dark:text-[#94a3b8] mx-auto opacity-50" />
            <p className="font-heading font-semibold text-sm text-[#161821] dark:text-[#ffffff]">
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
                className={`p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 ${
                  !n.read
                    ? isUrgent
                      ? 'bg-[#fff9e6] dark:bg-[#2c2210] border-[#ffeeba] dark:border-[#523e1b] shadow-xs'
                      : 'bg-[#ebfbee] dark:bg-[#1e2d24] border-[#33b712]/30 shadow-xs'
                    : 'bg-white dark:bg-[#171c26] border-[#e2e4e8] dark:border-[#273142]'
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                      isUrgent
                        ? 'bg-[#be123c] text-white border-[#ff4d8b]'
                        : 'bg-[#161821] text-[#45d320] border-[#33b712]/40'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-heading font-semibold uppercase px-2.5 py-0.5 rounded-full border ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                      {isUrgent && (
                        <span className="text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full bg-[#be123c] text-white">
                          {tr(lang, 'ВАЖНОЕ РАСПОРЯЖЕНИЕ', 'URGENT NOTICE')}
                        </span>
                      )}
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#33b712]" />}
                      <span className="text-[11px] font-sans text-[#475569] dark:text-[#94a3b8]">
                        {formatNotificationDate(n.createdAt, lang)}
                      </span>
                    </div>

                    <h2 className="font-heading font-semibold text-sm sm:text-base text-[#161821] dark:text-[#ffffff]">
                      {localizeText(n.title, lang)}
                    </h2>

                    <p className="text-xs text-[#4b5563] dark:text-[#cbd5e1] font-sans leading-relaxed">
                      {localizeText(n.message, lang)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n.id)}
                      className="px-4 py-2 min-h-[44px] rounded-full bg-[#161821] text-white text-[11px] font-heading font-semibold hover:bg-[#262a38] transition-colors cursor-pointer flex items-center justify-center shadow-xs"
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
