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
  Building,
  ShieldCheck,
  Megaphone,
  X,
  Filter,
  CheckCircle2,
  Users,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { StudentRequest, RequestStatus, StaffAnnouncement, NotificationKind, StudentDossier } from '../types';
import { api } from '../services/api';
import { UniversityEmblem } from '../components/UniversityEmblem';
import { StudentDossierModal } from '../components/StudentDossierModal';

interface StaffDashboardPageProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  initialAnnounceTarget?: string;
  initialAnnounceStudentId?: string;
  initialAnnounceStudentName?: string;
}

export const StaffDashboardPage: React.FC<StaffDashboardPageProps> = ({
  activeTab = 'staff_requests',
  setActiveTab,
  initialAnnounceTarget,
  initialAnnounceStudentId,
  initialAnnounceStudentName,
}) => {
  const { lang, user, refreshUnreadCount } = useAuth();
  const [currentSection, setCurrentSection] = useState<'requests' | 'announcements'>(() => {
    return activeTab === 'staff_actions' ? 'announcements' : 'requests';
  });

  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [announcements, setAnnouncements] = useState<StaffAnnouncement[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Student Dossier Modal State
  const [selectedDossier, setSelectedDossier] = useState<StudentDossier | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [loadingDossier, setLoadingDossier] = useState(false);

  // Status Change Dialog State
  const [selectedReq, setSelectedReq] = useState<StudentRequest | null>(null);
  const [newStatus, setNewStatus] = useState<RequestStatus>('in_review');
  const [comment, setComment] = useState('');
  const [updating, setUpdating] = useState(false);

  // Announcement State
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceMsg, setAnnounceMsg] = useState('');
  const [announceTarget, setAnnounceTarget] = useState<string>(initialAnnounceTarget || 'all');
  const [targetStudentId, setTargetStudentId] = useState<string | undefined>(initialAnnounceStudentId);
  const [targetStudentName, setTargetStudentName] = useState<string | undefined>(initialAnnounceStudentName);
  const [announceKind, setAnnounceKind] = useState<NotificationKind>('announcement');
  const [announcePriority, setAnnouncePriority] = useState<'normal' | 'high' | 'urgent'>('high');
  const [sendingAnnounce, setSendingAnnounce] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleOpenStudentDossier = async (studentId: string) => {
    try {
      setLoadingDossier(true);
      const dossier = await api.getStudentDossier(studentId);
      if (dossier) {
        setSelectedDossier(dossier);
        setIsDossierOpen(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDossier(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'staff_actions') {
      setCurrentSection('announcements');
    } else if (activeTab === 'staff_requests') {
      setCurrentSection('requests');
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqData, annData] = await Promise.all([
        api.getStaffRequests(),
        api.getStaffAnnouncements(),
      ]);
      setRequests(reqData);
      setAnnouncements(annData);
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
      setFeedback(`Статус заявления № ${selectedReq.id} успешно обновлен на «${newStatus}». Студент оповещен.`);
      await loadData();
      await refreshUnreadCount();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Ошибка обновления статуса заявления');
    } finally {
      setUpdating(false);
    }
  };

  const handlePublishAnnounce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle.trim() || !announceMsg.trim()) return;

    setSendingAnnounce(true);
    try {
      const isUserTarget = announceTarget.startsWith('usr-');
      const res = await api.sendStaffAnnouncement({
        title: announceTitle.trim(),
        message: announceMsg.trim(),
        targetGroup: isUserTarget || announceTarget === 'all' ? null : announceTarget,
        targetUserId: isUserTarget ? announceTarget : null,
        priority: announcePriority,
        kind: announceKind,
      });

      setFeedback(`Распоряжение успешно опубликовано и доставлено в личные кабинеты (получателей: ${res.count}).`);
      setIsAnnounceModalOpen(false);
      setAnnounceTitle('');
      setAnnounceMsg('');
      setAnnounceTarget('all');
      setAnnouncePriority('high');
      setAnnounceKind('announcement');

      await loadData();
      await refreshUnreadCount();
      setTimeout(() => setFeedback(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Ошибка публикации объявления');
    } finally {
      setSendingAnnounce(false);
    }
  };

  const applyTemplate = (title: string, msg: string, kind: NotificationKind, priority: 'normal' | 'high' | 'urgent', target: string = 'all') => {
    setAnnounceTitle(title);
    setAnnounceMsg(msg);
    setAnnounceKind(kind);
    setAnnouncePriority(priority);
    setAnnounceTarget(target);
  };

  const handleDeleteAnnouncement = async (id: string, title: string) => {
    if (!confirm(`Вы действительно хотите отозвать распоряжение «${title}» и удалить его из журнала?`)) {
      return;
    }
    try {
      await api.deleteStaffAnnouncement(id);
      setFeedback(`Распоряжение «${title}» успешно отозвано и удалено из журнала.`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Ошибка удаления распоряжения');
    }
  };

  const filtered = requests.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const statusBadges: Record<RequestStatus, { label: string; color: string }> = {
    submitted: { label: 'Новое', color: 'bg-[#142D4E]/10 text-[#142D4E] dark:text-[#245A91] border-[#142D4E]/25' },
    in_review: { label: 'В работе', color: 'bg-[#142D4E]/20 text-[#142D4E] dark:text-[#245A91] border-[#142D4E]/35' },
    needs_info: { label: 'Уточнение', color: 'bg-[#C63740]/15 text-[#C63740] dark:text-[#F06A73] border-[#C63740]/30' },
    ready: { label: 'Подписано ЭЦП', color: 'bg-[#142D4E] text-[#FFFFFF] border-[#245A91]/40' },
    rejected: { label: 'Отклонено', color: 'bg-[#C63740]/15 text-[#C63740] border-[#C63740]/30' },
    cancelled: { label: 'Отозвано', color: 'bg-[#F8FAFC] text-[#667085] border-[#DCE2EA]' },
  };

  const pendingCount = requests.filter(r => r.status === 'submitted' || r.status === 'in_review').length;

  if (loading && requests.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-28 bg-[#DCE2EA]/40 dark:bg-[#162A45] rounded-xl" />
        <div className="h-80 bg-[#DCE2EA]/40 dark:bg-[#162A45] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-4 rounded-xl bg-[#142D4E] text-[#FFFFFF] border border-[#245A91]/50 flex items-center justify-between shadow-md animate-fade-in text-xs font-sans">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-[#245A91] flex-shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-[#FFFFFF]/70 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header & Section Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#DCE2EA] dark:border-[#193150]">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#142D4E] dark:text-[#245A91] font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 text-[#245A91]" />
            <span>Служебная панель сотрудника деканата МО</span>
            <span>•</span>
            <span>Мария Волкова</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#0F1D30] dark:text-[#FFFFFF]">
            {currentSection === 'requests' ? 'Заявления и документы студентов' : 'Рассылки и объявления деканата'}
          </h1>
          <p className="text-xs text-[#475467] dark:text-[#CBD5E1] font-sans mt-0.5">
            {currentSection === 'requests'
              ? 'Рассмотрение справок об обучении, ПГАС, общежития с выпуском квалифицированной ЭЦП'
              : 'Централизованная отправка распоряжений, дедлайнов и push-уведомлений в личные кабинеты'}
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[#F8FAFC] dark:bg-[#0E1B2D] p-1 rounded-lg border border-[#DCE2EA] dark:border-[#1E395B] text-xs font-sans font-medium">
            <button
              onClick={() => setCurrentSection('requests')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
                currentSection === 'requests'
                  ? 'bg-[#142D4E] text-[#FFFFFF] font-semibold shadow-xs'
                  : 'text-[#475467] dark:text-[#CBD5E1] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF]'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Заявления ({requests.length})</span>
            </button>
            <button
              onClick={() => setCurrentSection('announcements')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
                currentSection === 'announcements'
                  ? 'bg-[#142D4E] text-[#FFFFFF] font-semibold shadow-xs'
                  : 'text-[#475467] dark:text-[#CBD5E1] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF]'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 text-[#245A91]" />
              <span>Объявления ({announcements.length})</span>
            </button>
          </div>

          <button
            onClick={() => setIsAnnounceModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] text-xs font-sans font-semibold border border-[#245A91]/40 transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <Send className="w-3.5 h-3.5 text-[#245A91]" />
            <span className="hidden sm:inline">Создать объявление</span>
          </button>
        </div>
      </div>

      {/* 2. SECTION: ANNOUNCEMENTS & BROADCAST */}
      {currentSection === 'announcements' && (
        <div className="space-y-6">
          {/* Create Announcement Direct Card */}
          <div className="rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE2EA] dark:border-[#193150]">
              <div className="flex items-center space-x-2">
                <Megaphone className="w-5 h-5 text-[#245A91]" />
                <h3 className="font-serif font-bold text-base text-[#0F1D30] dark:text-[#FFFFFF]">
                  Опубликовать новое распоряжение или уведомление
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#667085]">
                Доставка в личный кабинет студента и push
              </span>
            </div>

            {/* Quick Templates */}
            <div>
              <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[#667085] block mb-2">
                Быстрые шаблоны деканата:
              </span>
              <div className="flex flex-wrap gap-2 text-xs font-sans">
                <button
                  type="button"
                  onClick={() =>
                    applyTemplate(
                      'Сроки комиссионных пересдач осеннего семестра',
                      'Вниманию студентов, имеющих академические задолженности! Комиссионные пересдачи пройдут с 24 по 30 ноября. Пожалуйста, получите направления в деканате (ауд. 312).',
                      'deadline',
                      'urgent'
                    )
                  }
                  className="px-2.5 py-1.5 rounded-md bg-[#F8FAFC] dark:bg-[#0E1B2D] hover:bg-[#EDF2F7] dark:hover:bg-[#1E2923] text-[#0F1D30] dark:text-[#FFFFFF] border border-[#DCE2EA] dark:border-[#1E395B] transition-colors"
                >
                  ⚡ Сроки пересдач задолженностей
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyTemplate(
                      'Прием заявлений на повышенную стипендию (ПГАС)',
                      'Напоминаем, что прием заявлений на ПГАС за достижения в научно-исследовательской и общественной деятельности завершается 25 ноября в 18:00.',
                      'announcement',
                      'high'
                    )
                  }
                  className="px-2.5 py-1.5 rounded-md bg-[#F8FAFC] dark:bg-[#0E1B2D] hover:bg-[#EDF2F7] dark:hover:bg-[#1E2923] text-[#0F1D30] dark:text-[#FFFFFF] border border-[#DCE2EA] dark:border-[#1E395B] transition-colors"
                >
                  📑 Прием заявлений на ПГАС
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyTemplate(
                      'Электронные справки с ЭЦП готовы к скачиванию',
                      'Все заказанные справки об обучении заверены квалифицированной электронной подписью деканата и доступны для скачивания в формате PDF в разделе "Справки".',
                      'request_update',
                      'normal'
                    )
                  }
                  className="px-2.5 py-1.5 rounded-md bg-[#F8FAFC] dark:bg-[#0E1B2D] hover:bg-[#EDF2F7] dark:hover:bg-[#1E2923] text-[#0F1D30] dark:text-[#FFFFFF] border border-[#DCE2EA] dark:border-[#1E395B] transition-colors"
                >
                  🔏 Готовность справок с ЭЦП
                </button>
              </div>
            </div>

            <form onSubmit={handlePublishAnnounce} className="space-y-4 text-xs sm:text-sm font-sans pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Target Audience */}
                <div>
                  <label className="block font-medium text-[#0F1D30] dark:text-[#FFFFFF] mb-1.5">
                    Получатели (Аудитория)
                  </label>
                  <select
                    value={announceTarget}
                    onChange={e => setAnnounceTarget(e.target.value)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg px-3 py-2 text-[#0F1D30] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#142D4E]"
                  >
                    <option value="all">Все студенты (Все группы)</option>
                    <option value="ДУ-101">Группа ДУ-101 (2 курс, МО)</option>
                    <option value="ДУ-205">Группа ДУ-205 (3 курс, Эк.)</option>
                    <option value="usr-aigul-101">Персонально: Айгуль Нурова</option>
                    <option value="usr-timur-205">Персонально: Тимур Белов</option>
                    <option value="usr-lina-101">Персонально: Лина Окафор</option>
                  </select>
                </div>

                {/* Notification Kind */}
                <div>
                  <label className="block font-medium text-[#0F1D30] dark:text-[#FFFFFF] mb-1.5">
                    Категория сообщения
                  </label>
                  <select
                    value={announceKind}
                    onChange={e => setAnnounceKind(e.target.value as NotificationKind)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg px-3 py-2 text-[#0F1D30] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#142D4E]"
                  >
                    <option value="announcement">📢 Официальное объявление</option>
                    <option value="deadline">⏰ Академический дедлайн / Сессия</option>
                    <option value="schedule_change">📅 Изменение в расписании</option>
                    <option value="request_update">📑 Документы и заявления</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block font-medium text-[#0F1D30] dark:text-[#FFFFFF] mb-1.5">
                    Приоритет
                  </label>
                  <select
                    value={announcePriority}
                    onChange={e => setAnnouncePriority(e.target.value as any)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg px-3 py-2 text-[#0F1D30] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#142D4E]"
                  >
                    <option value="normal">Обычное (В список уведомлений)</option>
                    <option value="high">Важное (Выделенный бейдж)</option>
                    <option value="urgent">⚡ Срочное (Баннер на главной студента)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#0F1D30] dark:text-[#FFFFFF] mb-1.5">
                  Заголовок объявления
                </label>
                <input
                  type="text"
                  required
                  value={announceTitle}
                  onChange={e => setAnnounceTitle(e.target.value)}
                  placeholder="Например: О графике проведения пересдач осенней сессии"
                  className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg px-3 py-2 text-[#0F1D30] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#142D4E]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#0F1D30] dark:text-[#FFFFFF] mb-1.5">
                  Текст сообщения
                </label>
                <textarea
                  required
                  rows={4}
                  value={announceMsg}
                  onChange={e => setAnnounceMsg(e.target.value)}
                  placeholder="Полный текст распоряжения с указанием дат, мест проведения и порядка действий для студентов..."
                  className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg px-3 py-2 text-[#0F1D30] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#142D4E]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={sendingAnnounce}
                  className="px-5 py-2.5 rounded-lg bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] text-xs font-sans font-semibold border border-[#245A91]/40 shadow-xs flex items-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-[#245A91]" />
                  <span>{sendingAnnounce ? 'Отправка...' : 'Опубликовать и разослать студентам'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* History of published announcements */}
          <div className="rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE2EA] dark:border-[#193150]">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#142D4E] dark:text-[#245A91]" />
                <h3 className="font-sans font-semibold text-xs sm:text-sm uppercase tracking-wider text-[#0F1D30] dark:text-[#FFFFFF]">
                  Журнал опубликованных распоряжений деканата ({announcements.length})
                </h3>
              </div>
            </div>

            {announcements.length === 0 ? (
              <p className="text-xs text-[#667085] text-center py-6">
                Ранее опубликованных объявлений не найдено.
              </p>
            ) : (
              <div className="divide-y divide-[#DCE2EA] dark:divide-[#193150]">
                {announcements.map(ann => {
                  const dateStr = new Date(ann.createdAt).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={ann.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              ann.priority === 'urgent'
                                ? 'bg-[#C63740] text-[#FFFFFF]'
                                : ann.priority === 'high'
                                ? 'bg-[#245A91] text-[#142D4E]'
                                : 'bg-[#142D4E]/15 text-[#142D4E] dark:text-[#245A91]'
                            }`}
                          >
                            {ann.priority === 'urgent' ? 'Срочно' : ann.priority === 'high' ? 'Важно' : 'Обычное'}
                          </span>
                          <span className="text-xs font-mono font-semibold text-[#142D4E] dark:text-[#245A91]">
                            Целевая группа: {ann.targetGroup === 'all' ? 'Все студенты' : ann.targetGroup}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#667085]">{dateStr}</span>
                      </div>

                      <h4 className="font-serif font-bold text-sm text-[#0F1D30] dark:text-[#FFFFFF]">
                        {ann.title}
                      </h4>

                      <p className="text-xs text-[#475467] dark:text-[#CBD5E1] font-sans leading-relaxed">
                        {ann.body}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-2 text-[11px] text-[#667085]">
                          <Users className="w-3.5 h-3.5 text-[#142D4E] dark:text-[#245A91]" />
                          <span>Доставлено получателям ({ann.recipientCount || 'Все студенты'})</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-sans font-medium text-[#C63740] hover:bg-[#C63740]/10 border border-[#C63740]/30 hover:border-[#C63740] transition-colors cursor-pointer"
                          title="Отозвать распоряжение и удалить из журнала"
                        >
                          <Trash2 className="w-3 h-3 text-[#C63740]" />
                          <span>Отозвать / Удалить</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SECTION: STUDENT REQUESTS QUEUE */}
      {currentSection === 'requests' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-1 font-sans">
            <Filter className="w-3.5 h-3.5 text-[#667085] mr-1 flex-shrink-0" />
            {[
              { id: 'all', label: `Все заявления (${requests.length})` },
              { id: 'submitted', label: `Новые (${requests.filter(r => r.status === 'submitted').length})` },
              { id: 'in_review', label: `В работе (${requests.filter(r => r.status === 'in_review').length})` },
              { id: 'needs_info', label: `Требуют уточнения (${requests.filter(r => r.status === 'needs_info').length})` },
              { id: 'ready', label: `Подписано ЭЦП (${requests.filter(r => r.status === 'ready').length})` },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-medium ${
                  filter === t.id
                    ? 'bg-[#142D4E] text-[#FFFFFF] font-semibold'
                    : 'bg-white dark:bg-[#112238] text-[#475467] dark:text-[#CBD5E1] border border-[#DCE2EA] dark:border-[#1E395B] hover:bg-[#F8FAFC]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Requests Queue List */}
          {filtered.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B]">
              <FileCheck className="w-10 h-10 text-[#245A91] mx-auto mb-2 opacity-60" />
              <p className="text-sm font-serif font-bold text-[#0F1D30] dark:text-[#FFFFFF]">
                Нет заявлений в выбранной очереди
              </p>
              <p className="text-xs text-[#667085] dark:text-[#94A3B8] mt-1 font-sans">
                Все поступившие обращения студентов обработаны.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(req => {
                const badge = statusBadges[req.status] || { label: req.status, color: 'bg-slate-100 text-slate-800' };
                const dateStr = new Date(req.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={req.id}
                    className="p-5 rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] shadow-xs space-y-3 hover:border-[#142D4E]/40 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-sans font-semibold border ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="font-mono text-xs text-[#667085]">
                            № {req.id}
                          </span>
                        </div>
                        <h3 className="font-serif font-bold text-base text-[#0F1D30] dark:text-[#FFFFFF]">
                          {req.typeTitle}
                        </h3>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedReq(req);
                            setNewStatus(req.status);
                            setComment('');
                          }}
                          className="px-3.5 py-2 rounded-lg bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] text-xs font-sans font-semibold border border-[#245A91]/40 shadow-xs flex items-center space-x-1.5 transition-colors"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-[#245A91]" />
                          <span>Изменить статус / ЭЦП</span>
                        </button>
                      </div>
                    </div>

                    {/* Student Info Box */}
                    <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] flex flex-wrap items-center justify-between text-xs font-sans gap-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-3.5 h-3.5 text-[#142D4E] dark:text-[#245A91]" />
                        <span className="font-semibold text-[#0F1D30] dark:text-[#FFFFFF]">
                          {req.studentName || 'Студент факультета'}
                        </span>
                        <span className="text-[#667085]">({req.studentGroup || 'ДУ-101'})</span>
                        <button
                          type="button"
                          onClick={() => handleOpenStudentDossier(req.studentId)}
                          className="ml-2 px-2 py-0.5 rounded text-[10px] font-sans font-medium text-[#142D4E] dark:text-[#245A91] hover:bg-[#EDF2F7] dark:hover:bg-[#1E2923] border border-[#DCE2EA] dark:border-[#1E395B] transition-colors cursor-pointer"
                        >
                          Личное дело
                        </button>
                      </div>
                      <div className="text-[11px] font-mono text-[#667085]">
                        Подано: {dateStr} • Срок ответа: до {req.expectedDate}
                      </div>
                    </div>

                    {/* Form Fields Data Details */}
                    {req.data && Object.keys(req.data).length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans pt-1">
                        {Object.entries(req.data).map(([key, val]) => (
                          <div key={key} className="text-[#475467] dark:text-[#CBD5E1]">
                            <span className="text-[#667085] capitalize">{key}: </span>
                            <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF]">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Status Change & Digital Signing Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#142D4E] text-[#FFFFFF] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#FFFFFF]">
                  Решение по заявлению № {selectedReq.id}
                </h3>
                <p className="text-xs text-[#245A91] font-sans">
                  {selectedReq.typeTitle} • {selectedReq.studentName} ({selectedReq.studentGroup})
                </p>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1 rounded-md text-[#FFFFFF]/75 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4 text-xs sm:text-sm font-sans">
              <div>
                <label className="block font-medium text-[#0F1D30] dark:text-[#FFFFFF] mb-1.5">
                  Установить новый статус:
                </label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as RequestStatus)}
                  className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg px-3 py-2 text-[#0F1D30] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#142D4E]"
                >
                  <option value="in_review">В обработке (на рассмотрении деканата)</option>
                  <option value="needs_info">Требуется уточнение у студента</option>
                  <option value="ready">Готово с ЭЦП (выпустить электронный документ)</option>
                  <option value="rejected">Отклонить заявление</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#0F1D30] dark:text-[#FFFFFF] mb-1.5">
                  Официальный комментарий деканата для студента:
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Например: Документ заверен усиленной квалифицированной ЭЦП деканата и доступен в личном кабинете."
                  className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg px-3 py-2 text-[#0F1D30] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#142D4E]"
                />
              </div>

              <div className="pt-3 border-t border-[#DCE2EA] dark:border-[#193150] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 text-xs font-sans text-[#667085] hover:bg-[#F8FAFC] rounded-lg"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-lg bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] text-xs font-sans font-semibold border border-[#245A91]/40 disabled:opacity-50"
                >
                  {updating ? 'Сохранение...' : 'Утвердить и уведомить студента'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Separate Broadcast Announcement Modal */}
      {isAnnounceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#112238] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#142D4E] text-[#FFFFFF] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#FFFFFF]">
                  Публикация официального распоряжения
                </h3>
                <p className="text-xs text-[#245A91] font-sans">
                  Рассылка уведомления в личные кабинеты студентов
                </p>
              </div>
              <button
                onClick={() => setIsAnnounceModalOpen(false)}
                className="p-1 rounded-md text-[#FFFFFF]/75 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishAnnounce} className="p-6 space-y-4 text-xs sm:text-sm font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#0F1D30] dark:text-[#FFFFFF] mb-1.5">
                    Получатели
                  </label>
                  <select
                    value={announceTarget}
                    onChange={e => setAnnounceTarget(e.target.value)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg px-3 py-2 text-[#0F1D30] dark:text-[#FFFFFF]"
                  >
                    <option value="all">Все студенты</option>
                    <option value="ДУ-101">Группа ДУ-101</option>
                    <option value="ДУ-205">Группа ДУ-205</option>
                    <option value="usr-aigul-101">Айгуль Нурова</option>
                    <option value="usr-timur-205">Тимур Белов</option>
                    <option value="usr-lina-101">Лина Окафор</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#0F1D30] dark:text-[#FFFFFF] mb-1.5">
                    Приоритет
                  </label>
                  <select
                    value={announcePriority}
                    onChange={e => setAnnouncePriority(e.target.value as any)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg px-3 py-2 text-[#0F1D30] dark:text-[#FFFFFF]"
                  >
                    <option value="normal">Обычное</option>
                    <option value="high">Важное</option>
                    <option value="urgent">⚡ Срочное</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#0F1D30] dark:text-[#FFFFFF] mb-1.5">
                  Заголовок объявления
                </label>
                <input
                  type="text"
                  required
                  value={announceTitle}
                  onChange={e => setAnnounceTitle(e.target.value)}
                  placeholder="Например: О графике проведения пересдач осенней сессии"
                  className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg px-3 py-2 text-[#0F1D30] dark:text-[#FFFFFF]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#0F1D30] dark:text-[#FFFFFF] mb-1.5">
                  Текст сообщения
                </label>
                <textarea
                  required
                  rows={4}
                  value={announceMsg}
                  onChange={e => setAnnounceMsg(e.target.value)}
                  placeholder="Полный текст приказа с указанием дат, аудиторий и порядка действий..."
                  className="w-full bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] rounded-lg px-3 py-2 text-[#0F1D30] dark:text-[#FFFFFF]"
                />
              </div>

              <div className="pt-3 border-t border-[#DCE2EA] dark:border-[#193150] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAnnounceModalOpen(false)}
                  className="px-4 py-2 text-xs font-sans text-[#667085] hover:bg-[#F8FAFC] rounded-lg"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={sendingAnnounce}
                  className="px-4 py-2 rounded-lg bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] text-xs font-sans font-semibold border border-[#245A91]/40 disabled:opacity-50"
                >
                  {sendingAnnounce ? 'Отправка...' : 'Опубликовать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Student Dossier Modal */}
      <StudentDossierModal
        isOpen={isDossierOpen}
        dossier={selectedDossier}
        onClose={() => setIsDossierOpen(false)}
        onSendMessage={(name, id, group) => {
          setIsAnnounceModalOpen(true);
          setAnnounceTarget(group || 'all');
          setTargetStudentId(id);
          setTargetStudentName(name);
          setAnnounceTitle(`Уведомление деканата для: ${name}`);
        }}
      />
    </div>
  );
};
