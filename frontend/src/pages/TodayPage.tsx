import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  MapPin,
  AlertTriangle,
  FileText,
  Calendar,
  Sparkles,
  IdCard,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { ScheduleEntry, StudentRequest, Notification } from '../types';
import { api } from '../services/api';

interface TodayPageProps {
  setActiveTab: (tab: string) => void;
  onOpenCard: () => void;
  onOpenAssistant: () => void;
  onPreviewCert: (req: StudentRequest) => void;
}

export const TodayPage: React.FC<TodayPageProps> = ({
  setActiveTab,
  onOpenCard,
  onOpenAssistant,
  onPreviewCert,
}) => {
  const { user, profile, lang } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sch, reqs, notifs] = await Promise.all([
          api.getSchedule(),
          api.getRequests(),
          api.getNotifications(),
        ]);
        setSchedule(sch);
        setRequests(reqs);
        setNotifications(notifs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  // Today's classes (take Monday/first classes from schedule as today's demo)
  const todayClasses = schedule.slice(0, 3);
  const nextClass = todayClasses[0];

  const activeRequests = requests.filter(r => r.status === 'in_review' || r.status === 'needs_info');
  const readyRequests = requests.filter(r => r.status === 'ready');
  const urgentNotif = notifications.find(n => !n.read && (n.priority === 'urgent' || n.priority === 'high'));

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto animate-pulse">
        <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white p-6 sm:p-8 shadow-xl shadow-blue-500/15">
        <div className="absolute right-0 top-0 -mr-10 -mt-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-2">
              <span>{profile?.group}</span>
              <span>•</span>
              <span>{profile?.year} курс</span>
              <span>•</span>
              <span className="text-cyan-200">{profile?.studyForm || 'Бюджет'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {lang === 'ru' ? `Добрый день, ${user?.fullName.split(' ')[0]}!` : `Hello, ${user?.fullName.split(' ')[0]}!`}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-lg">
              {lang === 'ru'
                ? 'Все дела по учебе, справки и расписание — под вашим контролем.'
                : 'Your schedule, documents, and grades organized in one place.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            <button
              onClick={() => setActiveTab('requests')}
              className="px-4 py-2.5 rounded-xl bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>{lang === 'ru' ? 'Заказать справку' : 'Order Certificate'}</span>
            </button>
            <button
              onClick={onOpenCard}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <IdCard className="w-4 h-4 text-cyan-200" />
              <span>{lang === 'ru' ? 'Студбилет' : 'Student ID'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Urgent Notification / Alert (if any) */}
      {urgentNotif && (
        <div
          onClick={() => setActiveTab('notifications')}
          className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start space-x-3 cursor-pointer hover:bg-amber-100/60 transition-all shadow-sm"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-sm mb-0.5">{urgentNotif.title}</h4>
            <p className="text-slate-600 dark:text-slate-300">{urgentNotif.message}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-500 self-center" />
        </div>
      )}

      {/* Active Requests Progress Ribbon */}
      {activeRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>{lang === 'ru' ? 'Активные заявления в деканате' : 'Active Requests'}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeRequests.map(req => (
              <div
                key={req.id}
                onClick={() => setActiveTab('requests')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate pr-2">
                    {req.typeTitle}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      req.status === 'needs_info'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    }`}
                  >
                    {req.status === 'needs_info' ? 'Требует уточнения' : 'В обработке'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      req.status === 'needs_info' ? 'bg-amber-500 w-2/3' : 'bg-blue-600 w-1/2'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>№ {req.id}</span>
                  <span>Готовность: {req.expectedDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ready Documents for Download Banner */}
      {readyRequests.length > 0 && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
                {readyRequests[0].typeTitle} подписан ЭЦП и готов!
              </h4>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Электронный документ с QR-кодом верификации доступен для скачивания.
              </p>
            </div>
          </div>
          <button
            onClick={() => onPreviewCert(readyRequests[0])}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm whitespace-nowrap"
          >
            {lang === 'ru' ? 'Открыть' : 'View'}
          </button>
        </div>
      )}

      {/* Next Class Hero Card */}
      {nextClass && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-blue-500" />
              {lang === 'ru' ? 'Ближайшая пара' : 'Next Class'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {nextClass.start} - {nextClass.end}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {nextClass.subject}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {nextClass.teacher} • <span className="uppercase">{nextClass.type}</span>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span>Ауд. {nextClass.room}</span>
              </div>
            </div>
          </div>

          {nextClass.status === 'room_changed' && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{nextClass.changeNote || 'Внимание: аудитория перенесена!'}</span>
            </div>
          )}
        </div>
      )}

      {/* Today's Full Schedule Preview */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{lang === 'ru' ? 'Расписание на сегодня' : 'Today\'s Classes'}</span>
          </h3>
          <button
            onClick={() => setActiveTab('schedule')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center"
          >
            <span>{lang === 'ru' ? 'Вся неделя' : 'Full Week'}</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {todayClasses.map((item, idx) => (
            <div key={item.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.subject}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {item.start} - {item.end} • {item.teacher}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {item.room}
                </span>
                {item.status !== 'normal' && (
                  <span className="block text-[9px] font-bold text-amber-500 uppercase">
                    {item.status === 'room_changed' ? 'Замена ауд.' : item.status === 'cancelled' ? 'Отменено' : 'Перенос'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Assistant Promo Teaser */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-200/80 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 text-cyan-200 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              {lang === 'ru' ? 'AI Ассистент готов ответить на вопросы' : 'AI Copilot Ready'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lang === 'ru'
                ? 'Спросите про пересдачи, дедлайны стипендий или график сессии'
                : 'Ask about exam dates, retakes, or certificate requirements'}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenAssistant}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
        >
          {lang === 'ru' ? 'Спросить ассистента' : 'Ask Assistant'}
        </button>
      </div>
    </div>
  );
};
