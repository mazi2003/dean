import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Inbox,
  CheckCircle,
  Clock,
  Send,
  FileCheck,
  User,
  ShieldCheck,
  Megaphone,
  X,
  Filter,
  Users,
  Trash2,
} from 'lucide-react';
import {
  StudentRequest,
  RequestStatus,
  StaffAnnouncement,
  NotificationKind,
  StudentDossier,
  StudentListItem,
} from '../types';
import { api } from '../services/api';
import { StudentDossierModal } from '../components/StudentDossierModal';
import { tr, getRequestStatusLabel, localizeText } from '../utils/i18n';

interface StaffDashboardPageProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  tabNonce?: number;
  initialAnnounceTarget?: string;
  initialAnnounceStudentId?: string;
  initialAnnounceStudentName?: string;
}

export const StaffDashboardPage: React.FC<StaffDashboardPageProps> = ({
  activeTab = 'staff_requests',
  setActiveTab,
  tabNonce,
  initialAnnounceTarget,
  initialAnnounceStudentId,
  initialAnnounceStudentName,
}) => {
  const { lang, refreshUnreadCount } = useAuth();
  const [prevActiveTab, setPrevActiveTab] = useState(activeTab);
  const [prevTabNonce, setPrevTabNonce] = useState(tabNonce);
  const [sectionOverride, setSectionOverride] = useState<'requests' | 'announcements' | null>(null);

  if (activeTab !== prevActiveTab) {
    setPrevActiveTab(activeTab);
    setSectionOverride(null);
  }
  if (tabNonce !== prevTabNonce) {
    setPrevTabNonce(tabNonce);
    setSectionOverride(null);
  }

  const currentSection =
    sectionOverride ?? (activeTab === 'staff_actions' ? 'announcements' : 'requests');

  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [announcements, setAnnouncements] = useState<StaffAnnouncement[]>([]);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Student Dossier Modal State
  const [selectedDossier, setSelectedDossier] = useState<StudentDossier | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  // Status Change Dialog State
  const [selectedReq, setSelectedReq] = useState<StudentRequest | null>(null);
  const [newStatus, setNewStatus] = useState<RequestStatus>('in_review');
  const [comment, setComment] = useState('');
  const [updating, setUpdating] = useState(false);

  // Announcement State
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState(() =>
    initialAnnounceStudentName ? `Уведомление деканата для: ${initialAnnounceStudentName}` : ''
  );
  const [announceMsg, setAnnounceMsg] = useState('');
  const [announceTarget, setAnnounceTarget] = useState<string>(
    initialAnnounceStudentId ? `user:${initialAnnounceStudentId}` : initialAnnounceTarget || 'all'
  );
  const [announceKind, setAnnounceKind] = useState<NotificationKind>('announcement');
  const [announcePriority, setAnnouncePriority] = useState<'normal' | 'high' | 'urgent'>('high');
  const [sendingAnnounce, setSendingAnnounce] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleOpenStudentDossier = async (studentId: string) => {
    try {
      const dossier = await api.getStudentDossier(studentId);
      if (dossier) {
        setSelectedDossier(dossier);
        setIsDossierOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqData, annData, stuData] = await Promise.all([
        api.getStaffRequests(),
        api.getStaffAnnouncements(),
        api.getGroupStudents('all').catch(() => []),
      ]);
      setRequests(reqData);
      setAnnouncements(annData);
      setStudents(stuData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [reqData, annData, stuData] = await Promise.all([
          api.getStaffRequests(),
          api.getStaffAnnouncements(),
          api.getGroupStudents('all').catch(() => []),
        ]);
        if (!cancelled) {
          setRequests(reqData);
          setAnnouncements(annData);
          setStudents(stuData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    setUpdating(true);
    try {
      await api.updateStaffRequestStatus(selectedReq.id, newStatus, comment);
      setSelectedReq(null);
      setComment('');
      setFeedback(
        tr(
          lang,
          `Статус заявления № ${selectedReq.id} успешно обновлен на «${newStatus}». Студент оповещен.`,
          `Request #${selectedReq.id} status updated to "${newStatus}". Student notified.`
        )
      );
      await loadData();
      await refreshUnreadCount();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      alert(
        message ||
          tr(lang, 'Ошибка обновления статуса заявления', 'Failed to update request status')
      );
    } finally {
      setUpdating(false);
    }
  };

  const handlePublishAnnounce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announceTitle.trim() || !announceMsg.trim()) return;

    setSendingAnnounce(true);
    try {
      const isUserTarget = announceTarget.startsWith('user:');
      const targetUserId = isUserTarget ? announceTarget.slice(5) : null;
      const res = await api.sendStaffAnnouncement({
        title: announceTitle.trim(),
        message: announceMsg.trim(),
        targetGroup: isUserTarget || announceTarget === 'all' ? null : announceTarget,
        targetUserId,
        priority: announcePriority,
        kind: announceKind,
      });

      setFeedback(
        tr(
          lang,
          `Распоряжение успешно опубликовано и доставлено в личные кабинеты (получателей: ${res.count}).`,
          `Notice published and delivered to student portals (recipients: ${res.count}).`
        )
      );
      setIsAnnounceModalOpen(false);
      setAnnounceTitle('');
      setAnnounceMsg('');
      setAnnounceTarget('all');
      setAnnouncePriority('high');
      setAnnounceKind('announcement');

      await loadData();
      await refreshUnreadCount();
      setTimeout(() => setFeedback(null), 6000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      alert(message || tr(lang, 'Ошибка публикации объявления', 'Failed to publish announcement'));
    } finally {
      setSendingAnnounce(false);
    }
  };

  const applyTemplate = (
    title: string,
    msg: string,
    kind: NotificationKind,
    priority: 'normal' | 'high' | 'urgent',
    target: string = 'all'
  ) => {
    setAnnounceTitle(title);
    setAnnounceMsg(msg);
    setAnnounceKind(kind);
    setAnnouncePriority(priority);
    setAnnounceTarget(target);
  };

  const handleDeleteAnnouncement = async (id: string, title: string) => {
    if (
      !confirm(
        tr(
          lang,
          `Вы действительно хотите отозвать распоряжение «${title}» и удалить его из журнала?`,
          `Are you sure you want to revoke "${title}" and remove it from the journal?`
        )
      )
    ) {
      return;
    }
    try {
      await api.deleteStaffAnnouncement(id);
      setFeedback(
        tr(
          lang,
          `Распоряжение «${title}» успешно отозвано и удалено из журнала.`,
          `Notice "${title}" has been revoked and deleted.`
        )
      );
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      alert(message || tr(lang, 'Ошибка удаления распоряжения', 'Failed to delete announcement'));
    }
  };

  const filtered = requests.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const statusBadges: Record<RequestStatus, { label: string; color: string }> = {
    submitted: {
      label: getRequestStatusLabel('submitted', lang, 'staff'),
      color: 'bg-[#161821]/10 text-[#161821] dark:text-[#45d320] border-[#161821]/25',
    },
    in_review: {
      label: getRequestStatusLabel('in_review', lang, 'staff'),
      color: 'bg-[#161821]/20 text-[#161821] dark:text-[#45d320] border-[#161821]/35',
    },
    needs_info: {
      label: getRequestStatusLabel('needs_info', lang, 'staff'),
      color: 'bg-[#ff4d8b]/15 text-[#be123c] dark:text-[#fecdd3] border-[#ff4d8b]/30',
    },
    ready: {
      label: getRequestStatusLabel('ready', lang, 'staff'),
      color: 'bg-[#161821] text-[#FFFFFF] border-[#45d320]/40',
    },
    rejected: {
      label: getRequestStatusLabel('rejected', lang, 'staff'),
      color: 'bg-[#ff4d8b]/15 text-[#be123c] dark:text-[#fecdd3] border-[#ff4d8b]/30',
    },
    cancelled: {
      label: getRequestStatusLabel('cancelled', lang, 'staff'),
      color: 'bg-[#f6f6f9] dark:bg-[#121620] text-[#475569] dark:text-[#94A3B8] border-[#e2e4e8] dark:border-[#273142]',
    },
  };

  if (loading && requests.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4 animate-pulse">
        <div className="h-28 bg-[#e2e4e8]/40 dark:bg-[#1e2533] rounded-xl" />
        <div className="h-80 bg-[#e2e4e8]/40 dark:bg-[#1e2533] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-4 rounded-xl bg-[#161821] text-[#FFFFFF] border border-[#33b712]/50 flex items-center justify-between shadow-md animate-fade-in text-xs font-sans">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-[#166534] dark:text-[#45d320] flex-shrink-0" />
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#e2e4e8] dark:border-[#273142]">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-sans text-[#161821] dark:text-[#45d320] font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 text-[#161821] dark:text-[#45d320]" />
            <span>
              {tr(
                lang,
                'Служебная панель сотрудника деканата МО',
                "Dean's Office Staff Console — Faculty of IR"
              )}
            </span>
            <span>•</span>
            <span>{tr(lang, 'Мария Волкова', 'Maria Volkova')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#161821] dark:text-[#FFFFFF]">
            {currentSection === 'requests'
              ? tr(lang, 'Заявления и документы студентов', 'Student Requests & Documents')
              : tr(
                  lang,
                  'Рассылки и объявления деканата',
                  "Dean's Office Announcements & Broadcasts"
                )}
          </h1>
          <p className="text-xs text-[#475569] dark:text-[#CBD5E1] font-sans mt-0.5">
            {currentSection === 'requests'
              ? tr(
                  lang,
                  'Рассмотрение заявлений на справки, ПГАС и общежитие с формированием электронных макетов',
                  'Review enrollment certificates, PGAS scholarships, and dormitory requests with document previews'
                )
              : tr(
                  lang,
                  'Централизованная отправка распоряжений, дедлайнов и push-уведомлений в личные кабинеты',
                  'Centralized dispatch of official directives, deadlines, and push notifications to student portals'
                )}
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[#f6f6f9] dark:bg-[#121620] p-1 rounded-lg border border-[#e2e4e8] dark:border-[#273142] text-xs font-sans font-medium">
            <button
              onClick={() => {
                setSectionOverride('requests');
                setActiveTab?.('staff_requests');
              }}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                currentSection === 'requests'
                  ? 'bg-[#161821] text-[#FFFFFF] font-semibold shadow-xs'
                  : 'text-[#475569] dark:text-[#CBD5E1] hover:text-[#161821] dark:hover:text-[#FFFFFF]'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>
                {tr(lang, 'Заявления', 'Requests')} ({requests.length})
              </span>
            </button>
            <button
              onClick={() => {
                setSectionOverride('announcements');
                setActiveTab?.('staff_actions');
              }}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                currentSection === 'announcements'
                  ? 'bg-[#161821] text-[#FFFFFF] font-semibold shadow-xs'
                  : 'text-[#475569] dark:text-[#CBD5E1] hover:text-[#161821] dark:hover:text-[#FFFFFF]'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320]" />
              <span>
                {tr(lang, 'Объявления', 'Announcements')} ({announcements.length})
              </span>
            </button>
          </div>

          <button
            onClick={() => setIsAnnounceModalOpen(true)}
            aria-label={tr(lang, 'Создать объявление', 'New Announcement')}
            title={tr(lang, 'Создать объявление', 'New Announcement')}
            className="px-3.5 py-2 rounded-lg bg-[#161821] hover:bg-[#11141c] text-[#FFFFFF] text-xs font-sans font-semibold border border-[#33b712]/40 transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320]" />
            <span className="hidden sm:inline">
              {tr(lang, 'Создать объявление', 'New Announcement')}
            </span>
          </button>
        </div>
      </div>

      {/* 2. SECTION: ANNOUNCEMENTS & BROADCAST */}
      {currentSection === 'announcements' && (
        <div className="space-y-6">
          {/* Create Announcement Direct Card */}
          <div className="rounded-xl bg-white dark:bg-[#171c26] border border-[#e2e4e8] dark:border-[#273142] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e4e8] dark:border-[#273142]">
              <div className="flex items-center space-x-2">
                <Megaphone className="w-5 h-5 text-[#166534] dark:text-[#45d320]" />
                <h3 className="font-semibold text-base text-[#161821] dark:text-[#FFFFFF]">
                  {tr(
                    lang,
                    'Опубликовать новое распоряжение или уведомление',
                    'Publish a New Directive or Notification'
                  )}
                </h3>
              </div>
              <span className="text-[11px] font-sans text-[#475569] dark:text-[#94A3B8]">
                {tr(
                  lang,
                  'Доставка в личный кабинет студента и push',
                  'Delivered to student portal and push'
                )}
              </span>
            </div>

            {/* Quick Templates */}
            <div>
              <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8] block mb-2">
                {tr(lang, 'Быстрые шаблоны деканата:', "Dean's Office Quick Templates:")}
              </span>
              <div className="flex flex-wrap gap-2 text-xs font-sans">
                <button
                  type="button"
                  onClick={() =>
                    applyTemplate(
                      tr(
                        lang,
                        'Сроки комиссионных пересдач осеннего семестра',
                        'Fall Semester Commission Retake Schedule'
                      ),
                      tr(
                        lang,
                        'Вниманию студентов, имеющих академические задолженности! Комиссионные пересдачи пройдут с 24 по 30 ноября. Пожалуйста, получите направления в деканате (ауд. 312).',
                        "Attention students with academic arrears! Commission retakes will take place from November 24 to November 30. Please obtain your retake slips at the Dean's Office (Room 312)."
                      ),
                      'deadline',
                      'urgent'
                    )
                  }
                  className="px-2.5 py-1.5 rounded-md bg-[#f6f6f9] dark:bg-[#121620] hover:bg-[#ebeef3] dark:hover:bg-[#1E2923] text-[#161821] dark:text-[#FFFFFF] border border-[#e2e4e8] dark:border-[#273142] transition-colors"
                >
                  {tr(lang, '⚡ Сроки пересдач задолженностей', '⚡ Retake Examination Deadlines')}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyTemplate(
                      tr(
                        lang,
                        'Прием заявлений на повышенную стипендию (ПГАС)',
                        'Merit Scholarship (PGAS) Application Window'
                      ),
                      tr(
                        lang,
                        'Напоминаем, что прием заявлений на ПГАС за достижения в научно-исследовательской и общественной деятельности завершается 25 ноября в 18:00.',
                        'Reminder: applications for the Enhanced State Academic Scholarship (PGAS) for research and civic achievements close on November 25 at 18:00.'
                      ),
                      'announcement',
                      'high'
                    )
                  }
                  className="px-2.5 py-1.5 rounded-md bg-[#f6f6f9] dark:bg-[#121620] hover:bg-[#ebeef3] dark:hover:bg-[#1E2923] text-[#161821] dark:text-[#FFFFFF] border border-[#e2e4e8] dark:border-[#273142] transition-colors"
                >
                  {tr(lang, '📑 Прием заявлений на ПГАС', '📑 PGAS Scholarship Applications')}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyTemplate(
                      tr(
                        lang,
                        'Электронные макеты справок готовы к скачиванию',
                        'Digital Certificate Previews Ready for Download'
                      ),
                      tr(
                        lang,
                        'Заказанные справки об обучении обработаны деканатом и доступны для просмотра в формате PDF в разделе «Справки».',
                        'Requested enrollment certificates have been processed and are available for preview in the Requests section.'
                      ),
                      'request_update',
                      'normal'
                    )
                  }
                  className="px-2.5 py-1.5 rounded-md bg-[#f6f6f9] dark:bg-[#121620] hover:bg-[#ebeef3] dark:hover:bg-[#1E2923] text-[#161821] dark:text-[#FFFFFF] border border-[#e2e4e8] dark:border-[#273142] transition-colors"
                >
                  {tr(lang, '📄 Готовность макетов справок', '📄 Certificate Previews Ready')}
                </button>
              </div>
            </div>

            <form
              onSubmit={handlePublishAnnounce}
              className="space-y-4 text-xs sm:text-sm font-sans pt-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Target Audience */}
                <div>
                  <label htmlFor="announce-target-select" className="block font-medium text-[#161821] dark:text-[#FFFFFF] mb-1.5">
                    {tr(lang, 'Получатели (Аудитория)', 'Recipients (Audience)')}
                  </label>
                  <select
                    id="announce-target-select"
                    aria-label={tr(lang, 'Получатели (Аудитория)', 'Recipients (Audience)')}
                    value={announceTarget}
                    onChange={(e) => setAnnounceTarget(e.target.value)}
                    className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-lg px-3 py-2 text-[#161821] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#161821]"
                  >
                    <option value="all">
                      {tr(lang, 'Все студенты (Все группы)', 'All Students (All Groups)')}
                    </option>
                    <option value="ДУ-101">
                      {tr(lang, 'Группа ДУ-101 (2 курс, МО)', 'Group ДУ-101 (Year 2, IR)')}
                    </option>
                    <option value="ДУ-205">
                      {tr(lang, 'Группа ДУ-205 (3 курс, Эк.)', 'Group ДУ-205 (Year 3, Econ.)')}
                    </option>
                    {announceTarget.startsWith('user:') &&
                      !students.some((s) => `user:${s.id}` === announceTarget) && (
                        <option value={announceTarget}>
                          {tr(lang, 'Персонально: Выбранный студент', 'Direct: Selected Student')}
                        </option>
                      )}
                    {students.map((stu) => (
                      <option key={stu.id} value={`user:${stu.id}`}>
                        {tr(lang, `Персонально: ${stu.fullName}`, `Direct: ${stu.fullName}`)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notification Kind */}
                <div>
                  <label htmlFor="announce-kind-select" className="block font-medium text-[#161821] dark:text-[#FFFFFF] mb-1.5">
                    {tr(lang, 'Категория сообщения', 'Message Category')}
                  </label>
                  <select
                    id="announce-kind-select"
                    aria-label={tr(lang, 'Категория сообщения', 'Message Category')}
                    value={announceKind}
                    onChange={(e) => setAnnounceKind(e.target.value as NotificationKind)}
                    className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-lg px-3 py-2 text-[#161821] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#161821]"
                  >
                    <option value="announcement">
                      {tr(lang, '📢 Официальное объявление', '📢 Official Announcement')}
                    </option>
                    <option value="deadline">
                      {tr(
                        lang,
                        '⏰ Академический дедлайн / Сессия',
                        '⏰ Academic Deadline / Exams'
                      )}
                    </option>
                    <option value="schedule_change">
                      {tr(lang, '📅 Изменение в расписании', '📅 Schedule Change')}
                    </option>
                    <option value="request_update">
                      {tr(lang, '📑 Документы и заявления', '📑 Documents & Requests')}
                    </option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label htmlFor="announce-priority-select" className="block font-medium text-[#161821] dark:text-[#FFFFFF] mb-1.5">
                    {tr(lang, 'Приоритет', 'Priority')}
                  </label>
                  <select
                    id="announce-priority-select"
                    aria-label={tr(lang, 'Приоритет', 'Priority')}
                    value={announcePriority}
                    onChange={(e) =>
                      setAnnouncePriority(e.target.value as 'normal' | 'high' | 'urgent')
                    }
                    className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-lg px-3 py-2 text-[#161821] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#161821]"
                  >
                    <option value="normal">
                      {tr(lang, 'Обычное (В список уведомлений)', 'Normal (Notification Feed)')}
                    </option>
                    <option value="high">
                      {tr(lang, 'Важное (Выделенный бейдж)', 'Important (Highlighted Badge)')}
                    </option>
                    <option value="urgent">
                      {tr(
                        lang,
                        '⚡ Срочное (Баннер на главной студента)',
                        '⚡ Urgent (Student Dashboard Banner)'
                      )}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#161821] dark:text-[#FFFFFF] mb-1.5">
                  {tr(lang, 'Заголовок объявления', 'Announcement Title')}
                </label>
                <input
                  type="text"
                  required
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                  placeholder={tr(
                    lang,
                    'Например: О графике проведения пересдач осенней сессии',
                    'e.g., Fall Semester Retake Examination Schedule'
                  )}
                  className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-lg px-3 py-2 text-[#161821] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#161821]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#161821] dark:text-[#FFFFFF] mb-1.5">
                  {tr(lang, 'Текст сообщения', 'Message Body')}
                </label>
                <textarea
                  required
                  rows={4}
                  value={announceMsg}
                  onChange={(e) => setAnnounceMsg(e.target.value)}
                  placeholder={tr(
                    lang,
                    'Полный текст распоряжения с указанием дат, мест проведения и порядка действий для студентов...',
                    'Full text of the directive including dates, rooms, and required student actions...'
                  )}
                  className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-lg px-3 py-2 text-[#161821] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#161821]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={sendingAnnounce}
                  className="px-5 py-2.5 rounded-lg bg-[#161821] hover:bg-[#11141c] text-[#FFFFFF] text-xs font-sans font-semibold border border-[#33b712]/40 shadow-xs flex items-center space-x-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                  <span>
                    {sendingAnnounce
                      ? tr(lang, 'Отправка...', 'Sending...')
                      : tr(lang, 'Опубликовать и разослать студентам', 'Publish & Notify Students')}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* History of published announcements */}
          <div className="rounded-xl bg-white dark:bg-[#171c26] border border-[#e2e4e8] dark:border-[#273142] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e4e8] dark:border-[#273142]">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#161821] dark:text-[#45d320]" />
                <h3 className="font-sans font-semibold text-xs sm:text-sm uppercase tracking-wider text-[#161821] dark:text-[#FFFFFF]">
                  {tr(
                    lang,
                    'Журнал опубликованных распоряжений деканата',
                    'Published Directives Log'
                  )}{' '}
                  ({announcements.length})
                </h3>
              </div>
            </div>

            {announcements.length === 0 ? (
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] text-center py-6">
                {tr(
                  lang,
                  'Ранее опубликованных объявлений не найдено.',
                  'No previously published announcements found.'
                )}
              </p>
            ) : (
              <div className="divide-y divide-[#e2e4e8] dark:divide-[#273142]">
                {announcements.map((ann) => {
                  const dateStr = new Date(ann.createdAt).toLocaleString(
                    lang === 'ru' ? 'ru-RU' : 'en-US',
                    {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  );

                  return (
                    <div key={ann.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase ${
                              ann.priority === 'urgent'
                                ? 'bg-[#be123c] text-white'
                                : ann.priority === 'high'
                                  ? 'bg-[#166534] text-white'
                                  : 'bg-[#161821]/15 dark:bg-[#33b712]/25 text-[#161821] dark:text-[#45d320]'
                            }`}
                          >
                            {ann.priority === 'urgent'
                              ? tr(lang, 'Срочно', 'Urgent')
                              : ann.priority === 'high'
                                ? tr(lang, 'Важно', 'Important')
                                : tr(lang, 'Обычное', 'Normal')}
                          </span>
                          <span className="text-xs font-sans font-semibold text-[#161821] dark:text-[#45d320]">
                            {tr(lang, 'Целевая группа', 'Target Group')}:{' '}
                            {ann.targetGroup === 'all'
                              ? tr(lang, 'Все студенты', 'All Students')
                              : ann.targetGroup}
                          </span>
                        </div>
                        <span className="text-[11px] font-sans text-[#475569] dark:text-[#94A3B8]">{dateStr}</span>
                      </div>

                      <h4 className="font-semibold text-sm text-[#161821] dark:text-[#FFFFFF]">
                        {localizeText(ann.title, lang)}
                      </h4>

                      <p className="text-xs text-[#475569] dark:text-[#CBD5E1] font-sans leading-relaxed">
                        {localizeText(ann.body, lang)}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center space-x-2 text-[11px] text-[#475569] dark:text-[#94A3B8]">
                          <Users className="w-3.5 h-3.5 text-[#161821] dark:text-[#45d320]" />
                          <span>
                            {tr(lang, 'Доставлено получателям', 'Delivered to recipients')} (
                            {ann.recipientCount || tr(lang, 'Все студенты', 'All Students')})
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-sans font-medium text-[#be123c] dark:text-[#fecdd3] hover:bg-[#ff4d8b]/10 border border-[#ff4d8b]/30 hover:border-[#ff4d8b] transition-colors cursor-pointer"
                          title={tr(
                            lang,
                            'Отозвать распоряжение и удалить из журнала',
                            'Revoke directive and remove from log'
                          )}
                        >
                          <Trash2 className="w-3 h-3 text-[#be123c] dark:text-[#fecdd3]" />
                          <span>{tr(lang, 'Отозвать / Удалить', 'Revoke / Delete')}</span>
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
          <div className="flex flex-wrap items-center gap-2 text-xs pb-1 font-sans">
            <Filter className="w-3.5 h-3.5 text-[#475569] dark:text-[#94A3B8] mr-1 flex-shrink-0" />
            {[
              {
                id: 'all',
                label: tr(
                  lang,
                  `Все заявления (${requests.length})`,
                  `All Requests (${requests.length})`
                ),
              },
              {
                id: 'submitted',
                label: tr(
                  lang,
                  `Новые (${requests.filter((r) => r.status === 'submitted').length})`,
                  `New (${requests.filter((r) => r.status === 'submitted').length})`
                ),
              },
              {
                id: 'in_review',
                label: tr(
                  lang,
                  `В работе (${requests.filter((r) => r.status === 'in_review').length})`,
                  `In Review (${requests.filter((r) => r.status === 'in_review').length})`
                ),
              },
              {
                id: 'needs_info',
                label: tr(
                  lang,
                  `Требуют уточнения (${requests.filter((r) => r.status === 'needs_info').length})`,
                  `Needs Info (${requests.filter((r) => r.status === 'needs_info').length})`
                ),
              },
              {
                id: 'ready',
                label: tr(
                  lang,
                  `Готово к выдаче (${requests.filter((r) => r.status === 'ready').length})`,
                  `Ready (${requests.filter((r) => r.status === 'ready').length})`
                ),
              },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-medium ${
                  filter === t.id
                    ? 'bg-[#161821] text-[#FFFFFF] font-semibold'
                    : 'bg-white dark:bg-[#171c26] text-[#475569] dark:text-[#CBD5E1] border border-[#e2e4e8] dark:border-[#273142] hover:bg-[#f6f6f9]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Requests Queue List */}
          {filtered.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-white dark:bg-[#171c26] border border-[#e2e4e8] dark:border-[#273142]">
              <FileCheck className="w-10 h-10 text-[#166534] dark:text-[#45d320] mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-[#161821] dark:text-[#FFFFFF]">
                {tr(lang, 'Нет заявлений в выбранной очереди', 'No requests in the selected queue')}
              </p>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-1 font-sans">
                {tr(
                  lang,
                  'Все поступившие обращения студентов обработаны.',
                  'All incoming student requests have been processed.'
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((req) => {
                const badge = statusBadges[req.status] || {
                  label: req.status,
                  color: 'bg-slate-100 text-slate-800',
                };
                const dateStr = new Date(req.createdAt).toLocaleDateString(
                  lang === 'ru' ? 'ru-RU' : 'en-US',
                  {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }
                );

                return (
                  <div
                    key={req.id}
                    className="p-5 rounded-xl bg-white dark:bg-[#171c26] border border-[#e2e4e8] dark:border-[#273142] shadow-xs flex flex-col gap-3 hover:border-[#161821]/40 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-sans font-semibold border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                          <span className="font-sans text-xs text-[#475569] dark:text-[#94A3B8]">№ {req.id}</span>
                        </div>
                        <h3 className="font-semibold text-base text-[#161821] dark:text-[#FFFFFF]">
                          {localizeText(req.typeTitle, lang)}
                        </h3>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedReq(req);
                            setNewStatus(req.status);
                            setComment('');
                          }}
                          className="px-3.5 py-2 rounded-lg bg-[#161821] hover:bg-[#11141c] text-[#FFFFFF] text-xs font-sans font-semibold border border-[#33b712]/40 shadow-xs flex items-center space-x-1.5 transition-colors"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320]" />
                          <span>{tr(lang, 'Изменить статус', 'Update Status')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Student Info Box */}
                    <div className="p-3 rounded-lg bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] flex flex-wrap items-center justify-between text-xs font-sans gap-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-3.5 h-3.5 text-[#161821] dark:text-[#45d320]" />
                        <span className="font-semibold text-[#161821] dark:text-[#FFFFFF]">
                          {req.studentName || tr(lang, 'Студент факультета', 'Faculty Student')}
                        </span>
                        <span className="text-[#475569] dark:text-[#94A3B8]">({req.studentGroup || 'ДУ-101'})</span>
                        <button
                          type="button"
                          onClick={() => handleOpenStudentDossier(req.studentId)}
                          className="ml-2 px-2 py-0.5 rounded text-[10px] font-sans font-medium text-[#161821] dark:text-[#45d320] hover:bg-[#ebeef3] dark:hover:bg-[#1E2923] border border-[#e2e4e8] dark:border-[#273142] transition-colors cursor-pointer"
                        >
                          {tr(lang, 'Личное дело', 'Student Dossier')}
                        </button>
                      </div>
                      <div className="text-[11px] font-sans text-[#475569] dark:text-[#94A3B8]">
                        {tr(lang, 'Подано', 'Submitted')}: {dateStr} •{' '}
                        {tr(lang, 'Срок ответа: до', 'Due by')} {req.expectedDate}
                      </div>
                    </div>

                    {/* Form Fields Data Details */}
                    {req.data && Object.keys(req.data).length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans pt-1">
                        {Object.entries(req.data).map(([key, val]) => (
                          <div key={key} className="text-[#475569] dark:text-[#CBD5E1]">
                            <span className="text-[#475569] dark:text-[#94A3B8] capitalize">{key}: </span>
                            <span className="font-medium text-[#161821] dark:text-[#FFFFFF]">
                              {String(val)}
                            </span>
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
          <div className="w-full max-w-lg bg-white dark:bg-[#171c26] rounded-xl border border-[#e2e4e8] dark:border-[#273142] shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#161821] text-[#FFFFFF] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-[#FFFFFF]">
                  {tr(lang, 'Решение по заявлению №', 'Decision for Request #')} {selectedReq.id}
                </h3>
                <p className="text-xs text-[#166534] dark:text-[#45d320] font-sans">
                  {localizeText(selectedReq.typeTitle, lang)} • {selectedReq.studentName} (
                  {selectedReq.studentGroup})
                </p>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1 rounded-md text-[#FFFFFF]/75 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleUpdateStatus}
              className="p-6 space-y-4 text-xs sm:text-sm font-sans"
            >
              <div>
                <label htmlFor="status-modal-select" className="block font-medium text-[#161821] dark:text-[#FFFFFF] mb-1.5">
                  {tr(lang, 'Установить новый статус:', 'Set new status:')}
                </label>
                <select
                  id="status-modal-select"
                  aria-label={tr(lang, 'Установить новый статус:', 'Set new status:')}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as RequestStatus)}
                  className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-lg px-3 py-2 text-[#161821] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#161821]"
                >
                  <option value="in_review">
                    {tr(
                      lang,
                      'В обработке (на рассмотрении деканата)',
                      "In Review (under Dean's Office consideration)"
                    )}
                  </option>
                  <option value="needs_info">
                    {tr(
                      lang,
                      'Требуется уточнение у студента',
                      'Clarification needed from student'
                    )}
                  </option>
                  <option value="ready">
                    {tr(
                      lang,
                      'Готово к выдаче (открыть макет документа)',
                      'Ready (unlock document preview)'
                    )}
                  </option>
                  <option value="rejected">
                    {tr(lang, 'Отклонить заявление', 'Reject request')}
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-[#161821] dark:text-[#FFFFFF] mb-1.5">
                  {tr(
                    lang,
                    'Официальный комментарий деканата для студента:',
                    "Official Dean's Office comment for the student:"
                  )}
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={tr(
                    lang,
                    'Например: Документ подготовлен и доступен для просмотра в личном кабинете (демо-макет).',
                    'e.g., Document has been prepared and is available for preview in your portal.'
                  )}
                  className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-lg px-3 py-2 text-[#161821] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#161821]"
                />
              </div>

              <div className="pt-3 border-t border-[#e2e4e8] dark:border-[#273142] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 text-xs font-sans text-[#475569] dark:text-[#94A3B8] hover:bg-[#f6f6f9] dark:hover:bg-[#1e2533] rounded-lg cursor-pointer"
                >
                  {tr(lang, 'Отмена', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-lg bg-[#161821] hover:bg-[#11141c] text-[#FFFFFF] text-xs font-sans font-semibold border border-[#33b712]/40 disabled:opacity-50"
                >
                  {updating
                    ? tr(lang, 'Сохранение...', 'Saving...')
                    : tr(lang, 'Утвердить и уведомить студента', 'Approve & Notify Student')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Separate Broadcast Announcement Modal */}
      {isAnnounceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#171c26] rounded-xl border border-[#e2e4e8] dark:border-[#273142] shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#161821] text-[#FFFFFF] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-[#FFFFFF]">
                  {tr(lang, 'Публикация официального распоряжения', 'Publish Official Directive')}
                </h3>
                <p className="text-xs text-[#166534] dark:text-[#45d320] font-sans">
                  {tr(
                    lang,
                    'Рассылка уведомления в личные кабинеты студентов',
                    'Broadcast notification to student portals'
                  )}
                </p>
              </div>
              <button
                onClick={() => setIsAnnounceModalOpen(false)}
                className="p-1 rounded-md text-[#FFFFFF]/75 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handlePublishAnnounce}
              className="p-6 space-y-4 text-xs sm:text-sm font-sans"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#161821] dark:text-[#FFFFFF] mb-1.5">
                    {tr(lang, 'Получатели', 'Recipients')}
                  </label>
                  <select
                    value={announceTarget}
                    onChange={(e) => setAnnounceTarget(e.target.value)}
                    className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-lg px-3 py-2 text-[#161821] dark:text-[#FFFFFF]"
                  >
                    <option value="all">{tr(lang, 'Все студенты', 'All Students')}</option>
                    <option value="ДУ-101">{tr(lang, 'Группа ДУ-101', 'Group ДУ-101')}</option>
                    <option value="ДУ-205">{tr(lang, 'Группа ДУ-205', 'Group ДУ-205')}</option>
                    {students.map((stu) => (
                      <option key={stu.id} value={`user:${stu.id}`}>
                        {stu.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#161821] dark:text-[#FFFFFF] mb-1.5">
                    {tr(lang, 'Приоритет', 'Priority')}
                  </label>
                  <select
                    value={announcePriority}
                    onChange={(e) =>
                      setAnnouncePriority(e.target.value as 'normal' | 'high' | 'urgent')
                    }
                    className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-lg px-3 py-2 text-[#161821] dark:text-[#FFFFFF]"
                  >
                    <option value="normal">{tr(lang, 'Обычное', 'Normal')}</option>
                    <option value="high">{tr(lang, 'Важное', 'Important')}</option>
                    <option value="urgent">{tr(lang, '⚡ Срочное', '⚡ Urgent')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#161821] dark:text-[#FFFFFF] mb-1.5">
                  {tr(lang, 'Заголовок объявления', 'Announcement Title')}
                </label>
                <input
                  type="text"
                  required
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                  placeholder={tr(
                    lang,
                    'Например: О графике проведения пересдач осенней сессии',
                    'e.g., Fall Semester Retake Examination Schedule'
                  )}
                  className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-lg px-3 py-2 text-[#161821] dark:text-[#FFFFFF]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#161821] dark:text-[#FFFFFF] mb-1.5">
                  {tr(lang, 'Текст сообщения', 'Message Body')}
                </label>
                <textarea
                  required
                  rows={4}
                  value={announceMsg}
                  onChange={(e) => setAnnounceMsg(e.target.value)}
                  placeholder={tr(
                    lang,
                    'Полный текст приказа с указанием дат, аудиторий и порядка действий...',
                    'Full text of the directive including dates, rooms, and required steps...'
                  )}
                  className="w-full bg-[#f6f6f9] dark:bg-[#121620] border border-[#e2e4e8] dark:border-[#273142] rounded-lg px-3 py-2 text-[#161821] dark:text-[#FFFFFF]"
                />
              </div>

              <div className="pt-3 border-t border-[#e2e4e8] dark:border-[#273142] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAnnounceModalOpen(false)}
                  className="px-4 py-2 text-xs font-sans text-[#475569] dark:text-[#94A3B8] hover:bg-[#f6f6f9] dark:hover:bg-[#1e2533] rounded-lg cursor-pointer"
                >
                  {tr(lang, 'Отмена', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={sendingAnnounce}
                  className="px-4 py-2 rounded-lg bg-[#161821] hover:bg-[#11141c] text-[#FFFFFF] text-xs font-sans font-semibold border border-[#33b712]/40 disabled:opacity-50"
                >
                  {sendingAnnounce
                    ? tr(lang, 'Отправка...', 'Sending...')
                    : tr(lang, 'Опубликовать', 'Publish')}
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
          setAnnounceTarget(id ? `user:${id}` : group || 'all');
          setAnnounceTitle(
            tr(lang, `Уведомление деканата для: ${name}`, `Dean's Office Notice for: ${name}`)
          );
        }}
      />
    </div>
  );
};
