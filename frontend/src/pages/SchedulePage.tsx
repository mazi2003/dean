import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  AlertTriangle,
  Download,
  Filter,
} from 'lucide-react';
import { ScheduleEntry } from '../types';
import { api } from '../services/api';

export const SchedulePage: React.FC = () => {
  const { user, profile, lang } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1); // 1=Mon ... 6=Sat
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getSchedule();
        setSchedule(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const daysRu = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const daysEn = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const filteredSchedule = schedule.filter(item => {
    const dayMatch = viewMode === 'week' ? true : item.dayOfWeek === selectedDay;
    const typeMatch = filterType === 'all' ? true : item.type === filterType;
    return dayMatch && typeMatch;
  });

  const handleExportIcs = () => {
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//DemoTech University//Schedule//RU\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n${schedule
      .map(
        s =>
          `BEGIN:VEVENT\nSUMMARY:${s.subject}\nLOCATION:${s.room}\nDESCRIPTION:${s.teacher} (${s.type})\nSTATUS:CONFIRMED\nEND:VEVENT`
      )
      .join('\n')}\nEND:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `schedule-${profile?.group || 'group'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            <span>{lang === 'ru' ? 'Расписание занятий' : 'Academic Schedule'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Группа <strong>{profile?.group}</strong> • Осенний семестр 2026/2027
          </p>
        </div>

        {/* View Toggle & Calendar Export */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'ru' ? 'День' : 'Day'}
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'ru' ? 'Неделя' : 'Week'}
            </button>
          </div>

          <button
            onClick={handleExportIcs}
            title="Экспорт в Google/Apple Календарь (.ics)"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center space-x-1.5 text-xs font-medium"
          >
            <Download className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">.ICS</span>
          </button>
        </div>
      </div>

      {/* Day of Week Selector Bar (if Day view) */}
      {viewMode === 'day' && (
        <div className="grid grid-cols-6 gap-1 sm:gap-2">
          {daysRu.map((day, idx) => {
            const dayNum = idx + 1;
            const isSelected = selectedDay === dayNum;
            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
                className={`py-2 sm:py-3 px-1 rounded-2xl text-center transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                    : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 font-medium'
                }`}
              >
                <span className="block text-[10px] sm:text-xs opacity-75 uppercase">
                  {lang === 'ru' ? day.slice(0, 2) : daysEn[idx].slice(0, 3)}
                </span>
                <span className="hidden sm:block text-xs mt-0.5">{day}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filter by class type */}
      <div className="flex items-center space-x-1.5 overflow-x-auto text-xs pb-1">
        <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 flex-shrink-0" />
        {['all', 'lecture', 'seminar', 'lab'].map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all ${
              filterType === t
                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t === 'all'
              ? 'Все типы'
              : t === 'lecture'
              ? 'Лекции'
              : t === 'seminar'
              ? 'Семинары'
              : 'Лабораторные'}
          </button>
        ))}
      </div>

      {/* Schedule Items List */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      ) : filteredSchedule.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {lang === 'ru' ? 'В этот день занятий нет' : 'No classes scheduled for this day'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Отличное время для подготовки к сессии или отдыха!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSchedule.map((item, idx) => {
            const isCancelled = item.status === 'cancelled';
            const isRoomChanged = item.status === 'room_changed';
            const isMoved = item.status === 'moved';

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${
                  isCancelled
                    ? 'border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10 opacity-75'
                    : isRoomChanged
                    ? 'border-amber-300 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    {/* Time Slot Badge */}
                    <div className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-center flex-shrink-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block font-mono">
                        {item.start}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {item.end}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                            item.type === 'lecture'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : item.type === 'seminar'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {item.type === 'lecture'
                            ? 'Лекция'
                            : item.type === 'seminar'
                            ? 'Семинар'
                            : 'Практика'}
                        </span>

                        {isCancelled && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                            ОТМЕНЕНО
                          </span>
                        )}
                        {isRoomChanged && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            ЗАМЕНА АУДИТОРИИ
                          </span>
                        )}
                        {isMoved && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                            ПЕРЕНОС ВРЕМЕНИ
                          </span>
                        )}
                      </div>

                      <h3 className={`text-sm sm:text-base font-bold text-slate-900 dark:text-white ${isCancelled ? 'line-through text-slate-400' : ''}`}>
                        {item.subject}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.teacher}
                      </p>
                    </div>
                  </div>

                  {/* Room indicator */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span>{item.room}</span>
                    </div>
                  </div>
                </div>

                {/* Change note notice */}
                {item.changeNote && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{item.changeNote}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
