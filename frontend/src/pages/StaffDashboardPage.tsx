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
    submitted: { label: 'Новое', color: 'bg-[#183D35]/10 text-[#183D35] dark:text-[#C4A46B] border-[#183D35]/25' },
    in_review: { label: 'В работе', color: 'bg-[#183D35]/20 text-[#183D35] dark:text-[#C4A46B] border-[#183D35]/35' },
    needs_info: { label: 'Уточнение', color: 'bg-[#A33D35]/15 text-[#A33D35] dark:text-[#E2766E] border-[#A33D35]/30' },
    ready: { label: 'Подписано ЭЦП', color: 'bg-[#183D35] text-[#F3EFE5] border-[#C4A46B]/40' },
    rejected: { label: 'Отклонено', color: 'bg-[#A33D35]/15 text-[#A33D35] border-[#A33D35]/30' },
    cancelled: { label: 'Отозвано', color: 'bg-[#FAF8F3] text-[#7E877B] border-[#E3DDD1]' },
  };

  const pendingCount = requests.filter(r => r.status === 'submitted' || r.status === 'in_review').length;

  if (loading && requests.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-28 bg-[#E3DDD1]/40 dark:bg-[#1A2520] rounded-xl" />
        <div className="h-80 bg-[#E3DDD1]/40 dark:bg-[#1A2520] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-4 rounded-xl bg-[#183D35] text-[#F3EFE5] border border-[#C4A46B]/50 flex items-center justify-between shadow-md animate-fade-in text-xs font-sans">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-[#C4A46B] flex-shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-[#F3EFE5]/70 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header & Section Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E3DDD1] dark:border-[#26362F]">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#183D35] dark:text-[#C4A46B] font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 text-[#C4A46B]" />
            <span>Служебная панель сотрудника деканата МО</span>
            <span>•</span>
            <span>Мария Волкова</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#252923] dark:text-[#F3EFE5]">
            {currentSection === 'requests' ? 'Заявления и документы студентов' : 'Рассылки и объявления деканата'}
          </h1>
          <p className="text-xs text-[#575F53] dark:text-[#C8D1CA] font-sans mt-0.5">
            {currentSection === 'requests'
              ? 'Рассмотрение справок об обучении, ПГАС, общежития с выпуском квалифицированной ЭЦП'
              : 'Централизованная отправка распоряжений, дедлайнов и push-уведомлений в личные кабинеты'}
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[#FAF8F3] dark:bg-[#121714] p-1 rounded-lg border border-[#E3DDD1] dark:border-[#2D3E35] text-xs font-sans font-medium">
            <button
              onClick={() => setCurrentSection('requests')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
                currentSection === 'requests'
                  ? 'bg-[#183D35] text-[#F3EFE5] font-semibold shadow-xs'
                  : 'text-[#575F53] dark:text-[#C8D1CA] hover:text-[#252923] dark:hover:text-[#F3EFE5]'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Заявления ({requests.length})</span>
            </button>
            <button
              onClick={() => setCurrentSection('announcements')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
                currentSection === 'announcements'
                  ? 'bg-[#183D35] text-[#F3EFE5] font-semibold shadow-xs'
                  : 'text-[#575F53] dark:text-[#C8D1CA] hover:text-[#252923] dark:hover:text-[#F3EFE5]'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 text-[#C4A46B]" />
              <span>Объявления ({announcements.length})</span>
            </button>
          </div>

          <button
            onClick={() => setIsAnnounceModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#183D35] hover:bg-[#102923] text-[#F3EFE5] text-xs font-sans font-semibold border border-[#C4A46B]/40 transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <Send className="w-3.5 h-3.5 text-[#C4A46B]" />
            <span className="hidden sm:inline">Создать объявление</span>
          </button>
        </div>
      </div>

      {/* 2. SECTION: ANNOUNCEMENTS & BROADCAST */}
      {currentSection === 'announcements' && (
        <div className="space-y-6">
          {/* Create Announcement Direct Card */}
          <div className="rounded-xl bg-white dark:bg-[#18221D] border border-[#E3DDD1] dark:border-[#2D3E35] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3DDD1] dark:border-[#26362F]">
              <div className="flex items-center space-x-2">
                <Megaphone className="w-5 h-5 text-[#C4A46B]" />
                <h3 className="font-serif font-bold text-base text-[#252923] dark:text-[#F3EFE5]">
                  Опубликовать новое распоряжение или уведомление
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#7E877B]">
                Доставка в личный кабинет студента и push
              </span>
            </div>

            {/* Quick Templates */}
            <div>
              <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[#7E877B] block mb-2">
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
                  className="px-2.5 py-1.5 rounded-md bg-[#FAF8F3] dark:bg-[#121714] hover:bg-[#EAE4D7] dark:hover:bg-[#1E2923] text-[#252923] dark:text-[#F3EFE5] border border-[#E3DDD1] dark:border-[#2D3E35] transition-colors"
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
                  className="px-2.5 py-1.5 rounded-md bg-[#FAF8F3] dark:bg-[#121714] hover:bg-[#EAE4D7] dark:hover:bg-[#1E2923] text-[#252923] dark:text-[#F3EFE5] border border-[#E3DDD1] dark:border-[#2D3E35] transition-colors"
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
                  className="px-2.5 py-1.5 rounded-md bg-[#FAF8F3] dark:bg-[#121714] hover:bg-[#EAE4D7] dark:hover:bg-[#1E2923] text-[#252923] dark:text-[#F3EFE5] border border-[#E3DDD1] dark:border-[#2D3E35] transition-colors"
                >
                  🔏 Готовность справок с ЭЦП
                </button>
              </div>
            </div>

            <form onSubmit={handlePublishAnnounce} className="space-y-4 text-xs sm:text-sm font-sans pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Target Audience */}
                <div>
                  <label className="block font-medium text-[#252923] dark:text-[#F3EFE5] mb-1.5">
                    Получатели (Аудитория)
                  </label>
                  <select
                    value={announceTarget}
                    onChange={e => setAnnounceTarget(e.target.value)}
                    className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg px-3 py-2 text-[#252923] dark:text-[#F3EFE5] focus:outline-none focus:ring-2 focus:ring-[#183D35]"
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
                  <label className="block font-medium text-[#252923] dark:text-[#F3EFE5] mb-1.5">
                    Категория сообщения
                  </label>
                  <select
                    value={announceKind}
                    onChange={e => setAnnounceKind(e.target.value as NotificationKind)}
                    className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg px-3 py-2 text-[#252923] dark:text-[#F3EFE5] focus:outline-none focus:ring-2 focus:ring-[#183D35]"
                  >
                    <option value="announcement">📢 Официальное объявление</option>
                    <option value="deadline">⏰ Академический дедлайн / Сессия</option>
                    <option value="schedule_change">📅 Изменение в расписании</option>
                    <option value="request_update">📑 Документы и заявления</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block font-medium text-[#252923] dark:text-[#F3EFE5] mb-1.5">
                    Приоритет
                  </label>
                  <select
                    value={announcePriority}
                    onChange={e => setAnnouncePriority(e.target.value as any)}
                    className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg px-3 py-2 text-[#252923] dark:text-[#F3EFE5] focus:outline-none focus:ring-2 focus:ring-[#183D35]"
                  >
                    <option value="normal">Обычное (В список уведомлений)</option>
                    <option value="high">Важное (Выделенный бейдж)</option>
                    <option value="urgent">⚡ Срочное (Баннер на главной студента)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#252923] dark:text-[#F3EFE5] mb-1.5">
                  Заголовок объявления
                </label>
                <input
                  type="text"
                  required
                  value={announceTitle}
                  onChange={e => setAnnounceTitle(e.target.value)}
                  placeholder="Например: О графике проведения пересдач осенней сессии"
                  className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg px-3 py-2 text-[#252923] dark:text-[#F3EFE5] focus:outline-none focus:ring-2 focus:ring-[#183D35]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#252923] dark:text-[#F3EFE5] mb-1.5">
                  Текст сообщения
                </label>
                <textarea
                  required
                  rows={4}
                  value={announceMsg}
                  onChange={e => setAnnounceMsg(e.target.value)}
                  placeholder="Полный текст распоряжения с указанием дат, мест проведения и порядка действий для студентов..."
                  className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg px-3 py-2 text-[#252923] dark:text-[#F3EFE5] focus:outline-none focus:ring-2 focus:ring-[#183D35]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={sendingAnnounce}
                  className="px-5 py-2.5 rounded-lg bg-[#183D35] hover:bg-[#102923] text-[#F3EFE5] text-xs font-sans font-semibold border border-[#C4A46B]/40 shadow-xs flex items-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-[#C4A46B]" />
                  <span>{sendingAnnounce ? 'Отправка...' : 'Опубликовать и разослать студентам'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* History of published announcements */}
          <div className="rounded-xl bg-white dark:bg-[#18221D] border border-[#E3DDD1] dark:border-[#2D3E35] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3DDD1] dark:border-[#26362F]">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#183D35] dark:text-[#C4A46B]" />
                <h3 className="font-sans font-semibold text-xs sm:text-sm uppercase tracking-wider text-[#252923] dark:text-[#F3EFE5]">
                  Журнал опубликованных распоряжений деканата ({announcements.length})
                </h3>
              </div>
            </div>

            {announcements.length === 0 ? (
              <p className="text-xs text-[#7E877B] text-center py-6">
                Ранее опубликованных объявлений не найдено.
              </p>
            ) : (
              <div className="divide-y divide-[#E3DDD1] dark:divide-[#26362F]">
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
                                ? 'bg-[#A33D35] text-[#F3EFE5]'
                                : ann.priority === 'high'
                                ? 'bg-[#C4A46B] text-[#183D35]'
                                : 'bg-[#183D35]/15 text-[#183D35] dark:text-[#C4A46B]'
                            }`}
                          >
                            {ann.priority === 'urgent' ? 'Срочно' : ann.priority === 'high' ? 'Важно' : 'Обычное'}
                          </span>
                          <span className="text-xs font-mono font-semibold text-[#183D35] dark:text-[#C4A46B]">
                            Целевая группа: {ann.targetGroup === 'all' ? 'Все студенты' : ann.targetGroup}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#7E877B]">{dateStr}</span>
                      </div>

                      <h4 className="font-serif font-bold text-sm text-[#252923] dark:text-[#F3EFE5]">
                        {ann.title}
                      </h4>

                      <p className="text-xs text-[#575F53] dark:text-[#C8D1CA] font-sans leading-relaxed">
                        {ann.body}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-2 text-[11px] text-[#7E877B]">
                          <Users className="w-3.5 h-3.5 text-[#183D35] dark:text-[#C4A46B]" />
                          <span>Доставлено получателям ({ann.recipientCount || 'Все студенты'})</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-sans font-medium text-[#A33D35] hover:bg-[#A33D35]/10 border border-[#A33D35]/30 hover:border-[#A33D35] transition-colors cursor-pointer"
                          title="Отозвать распоряжение и удалить из журнала"
                        >
                          <Trash2 className="w-3 h-3 text-[#A33D35]" />
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
            <Filter className="w-3.5 h-3.5 text-[#7E877B] mr-1 flex-shrink-0" />
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
                    ? 'bg-[#183D35] text-[#F3EFE5] font-semibold'
                    : 'bg-white dark:bg-[#18221D] text-[#575F53] dark:text-[#C8D1CA] border border-[#E3DDD1] dark:border-[#2D3E35] hover:bg-[#FAF8F3]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Requests Queue List */}
          {filtered.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-white dark:bg-[#18221D] border border-[#E3DDD1] dark:border-[#2D3E35]">
              <FileCheck className="w-10 h-10 text-[#C4A46B] mx-auto mb-2 opacity-60" />
              <p className="text-sm font-serif font-bold text-[#252923] dark:text-[#F3EFE5]">
                Нет заявлений в выбранной очереди
              </p>
              <p className="text-xs text-[#7E877B] dark:text-[#8E9B93] mt-1 font-sans">
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
                    className="p-5 rounded-xl bg-white dark:bg-[#18221D] border border-[#E3DDD1] dark:border-[#2D3E35] shadow-xs space-y-3 hover:border-[#183D35]/40 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-sans font-semibold border ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="font-mono text-xs text-[#7E877B]">
                            № {req.id}
                          </span>
                        </div>
                        <h3 className="font-serif font-bold text-base text-[#252923] dark:text-[#F3EFE5]">
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
                          className="px-3.5 py-2 rounded-lg bg-[#183D35] hover:bg-[#102923] text-[#F3EFE5] text-xs font-sans font-semibold border border-[#C4A46B]/40 shadow-xs flex items-center space-x-1.5 transition-colors"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-[#C4A46B]" />
                          <span>Изменить статус / ЭЦП</span>
                        </button>
                      </div>
                    </div>

                    {/* Student Info Box */}
                    <div className="p-3 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] flex flex-wrap items-center justify-between text-xs font-sans gap-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-3.5 h-3.5 text-[#183D35] dark:text-[#C4A46B]" />
                        <span className="font-semibold text-[#252923] dark:text-[#F3EFE5]">
                          {req.studentName || 'Студент факультета'}
                        </span>
                        <span className="text-[#7E877B]">({req.studentGroup || 'ДУ-101'})</span>
                        <button
                          type="button"
                          onClick={() => handleOpenStudentDossier(req.studentId)}
                          className="ml-2 px-2 py-0.5 rounded text-[10px] font-sans font-medium text-[#183D35] dark:text-[#C4A46B] hover:bg-[#EAE4D7] dark:hover:bg-[#1E2923] border border-[#E3DDD1] dark:border-[#2D3E35] transition-colors cursor-pointer"
                        >
                          Личное дело
                        </button>
                      </div>
                      <div className="text-[11px] font-mono text-[#7E877B]">
                        Подано: {dateStr} • Срок ответа: до {req.expectedDate}
                      </div>
                    </div>

                    {/* Form Fields Data Details */}
                    {req.data && Object.keys(req.data).length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans pt-1">
                        {Object.entries(req.data).map(([key, val]) => (
                          <div key={key} className="text-[#575F53] dark:text-[#C8D1CA]">
                            <span className="text-[#7E877B] capitalize">{key}: </span>
                            <span className="font-medium text-[#252923] dark:text-[#F3EFE5]">{String(val)}</span>
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
          <div className="w-full max-w-lg bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#183D35] text-[#F3EFE5] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#F3EFE5]">
                  Решение по заявлению № {selectedReq.id}
                </h3>
                <p className="text-xs text-[#C4A46B] font-sans">
                  {selectedReq.typeTitle} • {selectedReq.studentName} ({selectedReq.studentGroup})
                </p>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1 rounded-md text-[#F3EFE5]/75 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4 text-xs sm:text-sm font-sans">
              <div>
                <label className="block font-medium text-[#252923] dark:text-[#F3EFE5] mb-1.5">
                  Установить новый статус:
                </label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as RequestStatus)}
                  className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg px-3 py-2 text-[#252923] dark:text-[#F3EFE5] focus:outline-none focus:ring-2 focus:ring-[#183D35]"
                >
                  <option value="in_review">В обработке (на рассмотрении деканата)</option>
                  <option value="needs_info">Требуется уточнение у студента</option>
                  <option value="ready">Готово с ЭЦП (выпустить электронный документ)</option>
                  <option value="rejected">Отклонить заявление</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#252923] dark:text-[#F3EFE5] mb-1.5">
                  Официальный комментарий деканата для студента:
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Например: Документ заверен усиленной квалифицированной ЭЦП деканата и доступен в личном кабинете."
                  className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg px-3 py-2 text-[#252923] dark:text-[#F3EFE5] focus:outline-none focus:ring-2 focus:ring-[#183D35]"
                />
              </div>

              <div className="pt-3 border-t border-[#E3DDD1] dark:border-[#26362F] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 text-xs font-sans text-[#7E877B] hover:bg-[#FAF8F3] rounded-lg"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-lg bg-[#183D35] hover:bg-[#102923] text-[#F3EFE5] text-xs font-sans font-semibold border border-[#C4A46B]/40 disabled:opacity-50"
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
          <div className="w-full max-w-lg bg-white dark:bg-[#18221D] rounded-xl border border-[#E3DDD1] dark:border-[#2D3E35] shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#183D35] text-[#F3EFE5] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#F3EFE5]">
                  Публикация официального распоряжения
                </h3>
                <p className="text-xs text-[#C4A46B] font-sans">
                  Рассылка уведомления в личные кабинеты студентов
                </p>
              </div>
              <button
                onClick={() => setIsAnnounceModalOpen(false)}
                className="p-1 rounded-md text-[#F3EFE5]/75 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishAnnounce} className="p-6 space-y-4 text-xs sm:text-sm font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#252923] dark:text-[#F3EFE5] mb-1.5">
                    Получатели
                  </label>
                  <select
                    value={announceTarget}
                    onChange={e => setAnnounceTarget(e.target.value)}
                    className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg px-3 py-2 text-[#252923] dark:text-[#F3EFE5]"
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
                  <label className="block font-medium text-[#252923] dark:text-[#F3EFE5] mb-1.5">
                    Приоритет
                  </label>
                  <select
                    value={announcePriority}
                    onChange={e => setAnnouncePriority(e.target.value as any)}
                    className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg px-3 py-2 text-[#252923] dark:text-[#F3EFE5]"
                  >
                    <option value="normal">Обычное</option>
                    <option value="high">Важное</option>
                    <option value="urgent">⚡ Срочное</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#252923] dark:text-[#F3EFE5] mb-1.5">
                  Заголовок объявления
                </label>
                <input
                  type="text"
                  required
                  value={announceTitle}
                  onChange={e => setAnnounceTitle(e.target.value)}
                  placeholder="Например: О графике проведения пересдач осенней сессии"
                  className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg px-3 py-2 text-[#252923] dark:text-[#F3EFE5]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#252923] dark:text-[#F3EFE5] mb-1.5">
                  Текст сообщения
                </label>
                <textarea
                  required
                  rows={4}
                  value={announceMsg}
                  onChange={e => setAnnounceMsg(e.target.value)}
                  placeholder="Полный текст приказа с указанием дат, аудиторий и порядка действий..."
                  className="w-full bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] rounded-lg px-3 py-2 text-[#252923] dark:text-[#F3EFE5]"
                />
              </div>

              <div className="pt-3 border-t border-[#E3DDD1] dark:border-[#26362F] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAnnounceModalOpen(false)}
                  className="px-4 py-2 text-xs font-sans text-[#7E877B] hover:bg-[#FAF8F3] rounded-lg"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={sendingAnnounce}
                  className="px-4 py-2 rounded-lg bg-[#183D35] hover:bg-[#102923] text-[#F3EFE5] text-xs font-sans font-semibold border border-[#C4A46B]/40 disabled:opacity-50"
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
