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

  const kindIcons: Record<NotificationKind, any> = {
    announcement: Sparkles,
    deadline: Clock,
    request_update: FileText,
    schedule_change: Calendar,
  };

  const filtered = notifications.filter(n => {
    if (selectedKind === 'all') return true;
    if (selectedKind === 'unread') return !n.read;
    return n.kind === selectedKind;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Bell className="w-6 h-6 text-blue-600" />
            <span>{lang === 'ru' ? 'Центр уведомлений' : 'Notifications'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Официальные объявления деканата, изменения в расписании и статусы справок
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center space-x-1.5 self-start sm:self-center"
        >
          <CheckCheck className="w-4 h-4 text-blue-500" />
          <span>{lang === 'ru' ? 'Прочитать все' : 'Mark all read'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-1">
        <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 flex-shrink-0" />
        {[
          { id: 'all', label: 'Все' },
          { id: 'unread', label: 'Непрочитанные' },
          { id: 'request_update', label: 'Заявления' },
          { id: 'schedule_change', label: 'Расписание' },
          { id: 'announcement', label: 'Объявления' },
          { id: 'deadline', label: 'Дедлайны' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedKind(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              selectedKind === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Нет новых уведомлений в этой категории
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(item => {
            const Icon = kindIcons[item.kind] || Bell;
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.read) handleMarkRead(item.id);
                  if (item.link) {
                    const tab = item.link.replace('/', '');
                    setActiveTab(tab);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between space-x-3 ${
                  !item.read
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      !item.read
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-slate-400 block pt-1">
                      {new Date(item.createdAt).toLocaleString('ru-RU')}
                    </span>
                  </div>
                </div>

                {item.link && (
                  <ChevronRight className="w-4 h-4 text-slate-400 self-center flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
