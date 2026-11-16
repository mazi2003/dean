import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Inbox,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  XCircle,
  FileCheck,
  User,
  MessageSquare,
} from 'lucide-react';
import { StudentRequest, RequestStatus } from '../types';
import { api } from '../services/api';

export const StaffDashboardPage: React.FC = () => {
  const { lang } = useAuth();
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Status Change Dialog State
  const [selectedReq, setSelectedReq] = useState<StudentRequest | null>(null);
  const [newStatus, setNewStatus] = useState<RequestStatus>('in_review');
  const [comment, setComment] = useState('');
  const [updating, setUpdating] = useState(false);

  // Announcement Dialog State
  const [isAnnounceOpen, setIsAnnounceOpen] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceMsg, setAnnounceMsg] = useState('');

  const loadData = async () => {
    try {
      const data = await api.getStaffRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    setUpdating(true);
    try {
      await api.updateStaffRequestStatus(selectedReq.id, newStatus, comment);
      setSelectedReq(null);
      setComment('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Ошибка обновления');
    } finally {
      setUpdating(false);
    }
  };

  const handlePublishAnnounce = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Объявление "${announceTitle}" опубликовано для всех студентов!`);
    setIsAnnounceOpen(false);
    setAnnounceTitle('');
    setAnnounceMsg('');
  };

  const filtered = requests.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              ПАНЕЛЬ СОТРУДНИКА
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Inbox className="w-6 h-6 text-purple-600" />
            <span>Входящие заявления студентов</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Обработка справок, заявлений на ПГАС и общежитие с автоматическим выпуском ЭЦП
          </p>
        </div>

        <button
          onClick={() => setIsAnnounceOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-500/20 flex items-center space-x-2 self-start sm:self-center"
        >
          <Send className="w-4 h-4" />
          <span>Создать объявление</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-1">
        {[
          { id: 'all', label: `Все (${requests.length})` },
          { id: 'submitted', label: 'Новые' },
          { id: 'in_review', label: 'В работе' },
          { id: 'needs_info', label: 'Ждут ответа студента' },
          { id: 'ready', label: 'Готовые (ЭЦП)' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              filter === t.id
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Requests Table / Cards */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <FileCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Нет заявлений в данной очереди
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <div
              key={req.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {req.typeTitle}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      № {req.id}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <User className="w-3.5 h-3.5 text-purple-500" />
                    <span>Студент: <strong>{req.studentName}</strong> ({req.studentGroup})</span>
                    <span>•</span>
                    <span>Подано: {new Date(req.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button
                    onClick={() => {
                      setSelectedReq(req);
                      setNewStatus(req.status);
                      setComment('');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800 transition-colors"
                  >
                    Изменить статус
                  </button>
                </div>
              </div>

              {/* Form parameters */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                {Object.entries(req.data).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-slate-400 capitalize">{k}:</span> <strong>{String(v)}</strong>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Change Status Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Изменение статуса заявления
            </h3>
            <p className="text-xs text-slate-500">
              {selectedReq.typeTitle} • {selectedReq.studentName} ({selectedReq.studentGroup})
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Новый статус:
                </label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as RequestStatus)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                >
                  <option value="in_review">В обработке (In Review)</option>
                  <option value="needs_info">Запросить уточнение у студента (Needs Info)</option>
                  <option value="ready">Подписать ЭЦП и выдать (Ready)</option>
                  <option value="rejected">Отклонить (Rejected)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Комментарий инспектора деканата (отобразится студенту):
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Например: Документ подписан квалифицированной ЭЦП и готов к загрузке..."
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  {updating ? 'Сохранение...' : 'Применить и уведомить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Announcement Modal */}
      {isAnnounceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <span>Публикация объявления деканата</span>
            </h3>

            <form onSubmit={handlePublishAnnounce} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Заголовок:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Сроки сдачи академических задолженностей"
                  value={announceTitle}
                  onChange={e => setAnnounceTitle(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Текст сообщения:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Введите текст объявления для студентов..."
                  value={announceMsg}
                  onChange={e => setAnnounceMsg(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAnnounceOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Опубликовать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
