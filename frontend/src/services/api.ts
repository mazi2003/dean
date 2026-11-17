import {
  User,
  StudentProfile,
  ScheduleEntry,
  ScheduleStatus,
  GradesSummary,
  RequestType,
  StudentRequest,
  Notification,
  NotificationKind,
  RequestStatus,
  StaffAnnouncement,
  AcademicGroup,
  StudentListItem,
  StudentDossier,
  ExamEntry,
} from '../types';
import {
  TEST_USERS,
  MOCK_REQUEST_TYPES,
  getMockSchedule,
  getMockGrades,
  INITIAL_REQUESTS,
  INITIAL_NOTIFICATIONS,
  MOCK_GROUPS,
  MOCK_STUDENTS,
  getMockStudentDossier,
  INITIAL_EXAMS,
} from './mockData';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

let offlineUntil = 0;

async function apiFetch(path: string, init?: RequestInit): Promise<Response | null> {
  if (Date.now() < offlineUntil) {
    return null;
  }
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: 'include',
    });
    const contentType = res.headers.get('content-type') || '';
    if (
      res.headers.get('X-DemoTech-Offline-Mock') === '1' ||
      !contentType.includes('application/json')
    ) {
      offlineUntil = Date.now() + 15_000;
      return null;
    }
    return res;
  } catch {
    offlineUntil = Date.now() + 15_000;
    return null;
  }
}

// Local storage keys for persistent demo state
const STORAGE_KEYS = {
  CURRENT_USER: 'dean_current_user',
  REQUESTS: 'dean_mock_requests',
  NOTIFICATIONS: 'dean_mock_notifications',
  SCHEDULE_OVERRIDES: 'dean_mock_schedule_overrides',
  ANNOUNCEMENTS: 'dean_mock_announcements',
  EXAMS: 'dean_mock_exams',
};

function getStoredExams(): ExamEntry[] {
  const data = localStorage.getItem(STORAGE_KEYS.EXAMS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // ignore
    }
  }
  return [...INITIAL_EXAMS];
}

function saveStoredExams(exams: ExamEntry[]) {
  localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
}

function getStoredRequests(): StudentRequest[] {
  const data = localStorage.getItem(STORAGE_KEYS.REQUESTS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // ignore
    }
  }
  return [...INITIAL_REQUESTS];
}

function saveStoredRequests(reqs: StudentRequest[]) {
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(reqs));
}

function getStoredNotifications(): Notification[] {
  const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // ignore
    }
  }
  return [...INITIAL_NOTIFICATIONS];
}

function saveStoredNotifications(notifs: Notification[]) {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
}

function getStoredScheduleOverrides(): Record<string, Partial<ScheduleEntry>> {
  const data = localStorage.getItem(STORAGE_KEYS.SCHEDULE_OVERRIDES);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // ignore
    }
  }
  return {};
}

function saveStoredScheduleOverrides(overrides: Record<string, Partial<ScheduleEntry>>) {
  localStorage.setItem(STORAGE_KEYS.SCHEDULE_OVERRIDES, JSON.stringify(overrides));
}

function getStoredAnnouncements(): StaffAnnouncement[] {
  const data = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // ignore
    }
  }
  return [
    {
      id: 'ann-init-1',
      title: 'Сроки ликвидации академических задолженностей',
      body: 'Внимание студентам! График комиссионных пересдач осеннего семестра утвержден. Пересдачи пройдут с 24 по 30 ноября. Пожалуйста, согласуйте допуск в деканате.',
      targetGroup: 'all',
      priority: 'high',
      kind: 'announcement',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      recipientCount: 3,
      recipients: ['Айгуль Нурова', 'Тимур Белов', 'Лина Окафор'],
    },
    {
      id: 'ann-init-2',
      title: 'Прием заявлений на повышенную стипендию (ПГАС)',
      body: 'Прием заявлений и подтверждающих документов на ПГАС открыт до 25 ноября. Подать заявление можно через раздел "Справки и заявления".',
      targetGroup: 'ДУ-101',
      priority: 'normal',
      kind: 'announcement',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      recipientCount: 2,
      recipients: ['Айгуль Нурова', 'Лина Окафор'],
    },
  ];
}

function saveStoredAnnouncements(items: StaffAnnouncement[]) {
  localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(items));
}

export const api = {
  // ─── Auth ───
  async login(email: string, password: string): Promise<{ user: User; profile: StudentProfile }> {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res) {
      if (res.ok) {
        const user = (await res.json()) as User;
        const profRes = await apiFetch('/profile');
        if (profRes?.ok) {
          const profile = (await profRes.json()) as StudentProfile;
          return { user, profile };
        }
        return {
          user,
          profile: {
            ...user,
            faculty: '',
            program: '',
            year: 0,
            group: '',
            studentNumber: '',
          },
        };
      }
      if (res.status === 401 || res.status === 422 || res.status === 429) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || 'Неверный адрес электронной почты или пароль');
      }
    }

    // Mock verification (offline / static deployment fallback)
    const found = TEST_USERS[email.toLowerCase().trim()];
    if (!found || found.password !== password) {
      throw new Error('Неверный адрес электронной почты или пароль');
    }

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(found.user));
    return { user: found.user, profile: found.profile };
  },

  async logout(): Promise<void> {
    await apiFetch('/auth/logout', { method: 'POST' });
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  async getCurrentUser(): Promise<{ user: User; profile: StudentProfile } | null> {
    const res = await apiFetch('/profile');
    if (res) {
      if (res.ok) {
        const profile = (await res.json()) as StudentProfile;
        const user: User = {
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName,
          role: profile.role,
        };
        return { user, profile };
      }
      if (res.status === 401) {
        const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (!saved) return null;
      }
    }

    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!saved) return null;
    try {
      const user = JSON.parse(saved) as User;
      const found = Object.values(TEST_USERS).find(u => u.user.id === user.id);
      if (found) {
        return { user: found.user, profile: found.profile };
      }
    } catch {
      // ignore
    }
    return null;
  },

  // ─── Profile ───
  async getProfile(): Promise<StudentProfile> {
    const res = await apiFetch('/profile');
    if (res?.ok) return await res.json();

    const current = await this.getCurrentUser();
    if (!current) throw new Error('Пользователь не авторизован');
    return current.profile;
  },

  // ─── Schedule ───
  async getSchedule(date?: string, groupOverride?: string): Promise<ScheduleEntry[]> {
    const path = date ? `/schedule?date=${date}` : '/schedule';
    const res = await apiFetch(path);
    if (res?.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }

    const current = await this.getCurrentUser();
    let group = groupOverride;
    if (!group) {
      if (current?.user.role === 'staff') {
        group = 'ДУ-101';
      } else {
        group = current?.profile.group || 'ДУ-101';
      }
    }

    const baseSchedule = getMockSchedule(group);
    const overrides = getStoredScheduleOverrides();
    return baseSchedule.map(entry => {
      if (overrides[entry.id]) {
        return { ...entry, ...overrides[entry.id] };
      }
      return entry;
    });
  },

  // ─── Grades ───
  async getGrades(): Promise<GradesSummary> {
    const res = await apiFetch('/grades');
    if (res?.ok) return await res.json();

    const current = await this.getCurrentUser();
    if (!current) throw new Error('Пользователь не авторизован');

    return getMockGrades(current.user.id);
  },

  // ─── Requests ───
  async getRequestTypes(): Promise<RequestType[]> {
    const res = await apiFetch('/request-types');
    if (res?.ok) return await res.json();
    return MOCK_REQUEST_TYPES;
  },

  async getRequests(): Promise<StudentRequest[]> {
    const res = await apiFetch('/requests');
    if (res?.ok) {
      const payload = await res.json();
      const rawItems = Array.isArray(payload) ? payload : payload.items ?? [];
      return rawItems.map((r: StudentRequest & { expectedBy?: string }) => ({
        ...r,
        expectedDate: r.expectedDate ?? r.expectedBy ?? '',
      }));
    }

    const current = await this.getCurrentUser();
    if (!current) throw new Error('Пользователь не авторизован');

    const all = getStoredRequests();
    // STRICT DATA ISOLATION: Student sees ONLY their own requests!
    return all.filter(r => r.studentId === current.user.id);
  },

  async createRequest(typeCode: string, data: Record<string, unknown>): Promise<StudentRequest> {
    const res = await apiFetch('/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ typeCode, data }),
    });
    if (res?.ok) return await res.json();

    const current = await this.getCurrentUser();
    if (!current) throw new Error('Пользователь не авторизован');

    const typeDef = MOCK_REQUEST_TYPES.find(t => t.code === typeCode);
    const sla = typeDef?.slaDays ?? 3;
    const nowIso = new Date().toISOString();
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + sla);

    const newReq: StudentRequest = {
      id: `req-${Date.now().toString().slice(-6)}`,
      studentId: current.user.id,
      studentName: current.user.fullName,
      studentGroup: current.profile.group,
      typeCode: (typeCode as any),
      typeTitle: typeDef?.title ?? 'Заявление',
      data,
      status: 'submitted',
      slaDays: sla,
      expectedDate: expDate.toISOString().slice(0, 10),
      createdAt: nowIso,
      updatedAt: nowIso,
      history: [
        {
          id: `hist-${Date.now()}`,
          status: 'submitted',
          createdAt: nowIso,
          authorName: current.user.fullName,
          comment: 'Заявление отправлено в деканат на рассмотрение.',
        },
      ],
      digitalDocAvailable: typeCode === 'study_certificate' || typeCode === 'transcript',
    };

    const all = getStoredRequests();
    all.unshift(newReq);
    saveStoredRequests(all);

    // Also add confirmation notification
    const notifs = getStoredNotifications();
    notifs.unshift({
      id: `notif-${Date.now()}`,
      userId: current.user.id,
      kind: 'request_update',
      title: `Заявление принято: ${typeDef?.title}`,
      message: `Ваше заявление № ${newReq.id} зарегистрировано. Ожидаемый срок готовности: ${newReq.expectedDate}.`,
      read: false,
      createdAt: nowIso,
      link: '/requests',
      priority: 'normal',
    });
    saveStoredNotifications(notifs);

    return newReq;
  },

  async cancelRequest(requestId: string): Promise<void> {
    const res = await apiFetch(`/requests/${requestId}/cancel`, { method: 'POST' });
    if (res?.ok) return;

    const current = await this.getCurrentUser();
    if (!current) throw new Error('Пользователь не авторизован');

    const all = getStoredRequests();
    const target = all.find(r => r.id === requestId);
    if (!target) throw new Error('Заявление не найдено');
    if (target.studentId !== current.user.id) throw new Error('Доступ запрещен');
    if (target.status !== 'submitted' && target.status !== 'in_review') {
      throw new Error('Нельзя отменить заявление в текущем статусе');
    }

    target.status = 'cancelled';
    target.updatedAt = new Date().toISOString();
    target.history.push({
      id: `hist-${Date.now()}`,
      status: 'cancelled',
      createdAt: new Date().toISOString(),
      authorName: current.user.fullName,
      comment: 'Заявление отменено студентом.',
    });
    saveStoredRequests(all);
  },

  // ─── Notifications ───
  async getNotifications(): Promise<Notification[]> {
    const res = await apiFetch('/notifications');
    if (res?.ok) {
      const payload = await res.json();
      const rawItems = Array.isArray(payload) ? payload : payload.items ?? [];
      return rawItems.map((n: Notification & { body?: string }) => ({
        ...n,
        message: n.message ?? n.body ?? '',
      }));
    }

    const current = await this.getCurrentUser();
    if (!current) throw new Error('Пользователь не авторизован');

    const all = getStoredNotifications();
    return all.filter(n => n.userId === current.user.id);
  },

  async markNotificationRead(id: string): Promise<void> {
    await apiFetch(`/notifications/${id}/read`, { method: 'POST' });

    const all = getStoredNotifications();
    const item = all.find(n => n.id === id);
    if (item) {
      item.read = true;
      saveStoredNotifications(all);
    }
  },

  async markAllNotificationsRead(): Promise<void> {
    await apiFetch('/notifications/read-all', { method: 'POST' });

    const current = await this.getCurrentUser();
    if (!current) return;

    const all = getStoredNotifications();
    all.forEach(n => {
      if (n.userId === current.user.id) n.read = true;
    });
    saveStoredNotifications(all);
  },

  // ─── Staff Only APIs ───
  async getStaffRequests(): Promise<StudentRequest[]> {
    const res = await apiFetch('/staff/requests');
    if (res?.ok) {
      const payload = await res.json();
      const rawItems = Array.isArray(payload) ? payload : payload.items ?? [];
      return rawItems.map((r: StudentRequest & { expectedBy?: string }) => ({
        ...r,
        expectedDate: r.expectedDate ?? r.expectedBy ?? '',
      }));
    }
    // Staff sees all student requests
    return getStoredRequests();
  },

  async updateStaffRequestStatus(
    requestId: string,
    status: RequestStatus,
    comment?: string
  ): Promise<StudentRequest> {
    const res = await apiFetch(`/staff/requests/${requestId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, comment }),
    });
    if (res?.ok) return await res.json();

    const all = getStoredRequests();
    const req = all.find(r => r.id === requestId);
    if (!req) throw new Error('Заявление не найдено');

    const nowIso = new Date().toISOString();
    req.status = status;
    req.updatedAt = nowIso;
    req.history.push({
      id: `hist-${Date.now()}`,
      status,
      comment: comment || `Статус изменен на "${status}" сотрудником деканата`,
      createdAt: nowIso,
      authorName: 'Мария Волкова (Деканат)',
    });
    saveStoredRequests(all);

    // Notify student about status change!
    const notifs = getStoredNotifications();
    const statusMap: Record<RequestStatus, string> = {
      submitted: 'Подано',
      in_review: 'В обработке',
      needs_info: 'Требуется уточнение',
      ready: 'Готово к выдаче',
      rejected: 'Отклонено',
      cancelled: 'Отменено',
    };

    notifs.unshift({
      id: `notif-${Date.now()}`,
      userId: req.studentId,
      kind: 'request_update',
      title: `Статус заявления изменен: ${statusMap[status]}`,
      message: `${req.typeTitle} (№ ${req.id}): ${comment || 'Статус успешно обновлен деканатом.'}`,
      read: false,
      createdAt: nowIso,
      link: '/requests',
      priority: status === 'needs_info' ? 'urgent' : status === 'ready' ? 'high' : 'normal',
    });
    saveStoredNotifications(notifs);

    return req;
  },

  async getStaffAnnouncements(): Promise<StaffAnnouncement[]> {
    return getStoredAnnouncements();
  },

  async deleteStaffAnnouncement(announcementId: string): Promise<void> {
    await apiFetch(`/staff/announcements/${announcementId}`, { method: 'DELETE' });

    const all = getStoredAnnouncements();
    const updated = all.filter(a => a.id !== announcementId);
    saveStoredAnnouncements(updated);
  },

  async sendStaffAnnouncement(params: {
    title: string;
    message: string;
    targetGroup?: string | null;
    targetUserId?: string | null;
    priority?: 'normal' | 'high' | 'urgent';
    kind?: NotificationKind;
  }): Promise<{ success: boolean; count: number }> {
    // 1. Try real API
    await apiFetch('/staff/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: params.title,
        body: params.message,
        group: params.targetGroup === 'all' ? null : params.targetGroup || null,
      }),
    });

    // 2. Identify target user IDs
    let targetUsers: Array<{ id: string; fullName: string; group?: string }> = [];

    if (params.targetUserId) {
      const found = Object.values(TEST_USERS).find(u => u.user.id === params.targetUserId);
      if (found) {
        targetUsers.push({ id: found.user.id, fullName: found.user.fullName, group: found.profile.group });
      }
    } else if (params.targetGroup && params.targetGroup !== 'all') {
      targetUsers = Object.values(TEST_USERS)
        .filter(u => u.user.role === 'student' && u.profile.group === params.targetGroup)
        .map(u => ({ id: u.user.id, fullName: u.user.fullName, group: u.profile.group }));
    } else {
      // All students
      targetUsers = Object.values(TEST_USERS)
        .filter(u => u.user.role === 'student')
        .map(u => ({ id: u.user.id, fullName: u.user.fullName, group: u.profile.group }));
    }

    const nowIso = new Date().toISOString();
    const notifs = getStoredNotifications();

    targetUsers.forEach((stu, index) => {
      notifs.unshift({
        id: `notif-${Date.now()}-${index}`,
        userId: stu.id,
        kind: params.kind || 'announcement',
        title: params.title,
        message: params.message,
        read: false,
        createdAt: nowIso,
        priority: params.priority || 'high',
        link: params.kind === 'schedule_change' ? '/schedule' : params.kind === 'request_update' ? '/requests' : undefined,
      });
    });

    saveStoredNotifications(notifs);

    // Save in published announcements list
    const announcements = getStoredAnnouncements();
    announcements.unshift({
      id: `ann-${Date.now()}`,
      title: params.title,
      body: params.message,
      targetGroup: params.targetGroup || 'all',
      priority: params.priority || 'high',
      kind: params.kind || 'announcement',
      createdAt: nowIso,
      recipientCount: targetUsers.length,
      recipients: targetUsers.map(u => u.fullName),
    });
    saveStoredAnnouncements(announcements);

    return { success: true, count: targetUsers.length };
  },

  async updateScheduleEntry(
    scheduleEntryId: string,
    changes: {
      status: ScheduleStatus;
      room?: string;
      start?: string;
      end?: string;
      note?: string;
      notifyGroup?: boolean;
    }
  ): Promise<void> {
    // 1. Try real API
    await apiFetch('/staff/schedule-changes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduleEntryId,
        status: changes.status,
        room: changes.room,
        start: changes.start,
        end: changes.end,
        note: changes.note,
      }),
    });

    // 2. Save in local storage overrides
    const overrides = getStoredScheduleOverrides();
    overrides[scheduleEntryId] = {
      ...(overrides[scheduleEntryId] || {}),
      status: changes.status,
      room: changes.room,
      start: changes.start,
      end: changes.end,
      changeNote: changes.note,
    };
    saveStoredScheduleOverrides(overrides);

    // 3. Notify group students if requested
    if (changes.notifyGroup !== false) {
      const allEntries = [...getMockSchedule('ДУ-101'), ...getMockSchedule('ДУ-205')];
      const target = allEntries.find(e => e.id === scheduleEntryId);
      const targetGroup = target?.groupId || 'ДУ-101';
      const subjectName = target?.subject || 'Занятие';

      const statusLabels: Record<ScheduleStatus, string> = {
        normal: 'Расписание подтверждено',
        room_changed: `Замена аудитории на ${changes.room || 'новую'}`,
        moved: `Перенос времени на ${changes.start || ''}-${changes.end || ''}`,
        cancelled: 'Занятие отменено',
      };

      await this.sendStaffAnnouncement({
        title: `Изменение в расписании: ${subjectName}`,
        message: changes.note || `Внимание, группа ${targetGroup}! По дисциплине "${subjectName}" статус: ${statusLabels[changes.status]}.`,
        targetGroup,
        kind: 'schedule_change',
        priority: 'urgent',
      });
    }
  },

  // ─── Dean's Office Academic Groups & Student Rosters ───
  async getStaffGroups(): Promise<AcademicGroup[]> {
    const res = await apiFetch('/staff/groups');
    if (res?.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
    return MOCK_GROUPS;
  },

  async getGroupStudents(groupCode?: string): Promise<StudentListItem[]> {
    const path = groupCode && groupCode !== 'all'
      ? `/staff/groups/${encodeURIComponent(groupCode)}/students`
      : '/staff/students';
    const res = await apiFetch(path);
    if (res?.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }

    if (!groupCode || groupCode === 'all') {
      return MOCK_STUDENTS;
    }
    return MOCK_STUDENTS.filter(s => s.group === groupCode);
  },

  async getStudentDossier(studentId: string): Promise<StudentDossier | null> {
    const res = await apiFetch(`/staff/students/${encodeURIComponent(studentId)}/dossier`);
    if (res?.ok) {
      const data = await res.json();
      if (data && data.profile) return data;
    }

    // Client mock dossier with real stored requests
    const dossier = getMockStudentDossier(studentId);
    if (!dossier) return null;

    // Merge live stored requests
    const storedRequests = getStoredRequests();
    const matched = storedRequests.filter(
      r => r.studentId === studentId || r.studentName?.toLowerCase().includes(dossier.profile.fullName.toLowerCase())
    );
    if (matched.length > 0) {
      dossier.requests = matched;
    }

    return dossier;
  },

  // ─── Examination Session & Scheduling (Dean's Authority) ───
  async getExams(groupCode?: string): Promise<ExamEntry[]> {
    const path = groupCode && groupCode !== 'all'
      ? `/staff/exams?group=${encodeURIComponent(groupCode)}`
      : '/staff/exams';
    const res = await apiFetch(path);
    if (res?.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }

    const allExams = getStoredExams();
    if (!groupCode || groupCode === 'all') {
      return allExams;
    }
    return allExams.filter(e => e.groupId === groupCode);
  },

  async updateExam(
    examId: string,
    changes: Partial<ExamEntry> & { notifyGroup?: boolean }
  ): Promise<void> {
    // 1. Try real API
    await apiFetch('/staff/exam-changes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId, ...changes }),
    });

    // 2. Persistent local storage update
    const exams = getStoredExams();
    const index = exams.findIndex(e => e.id === examId);
    if (index !== -1) {
      const original = exams[index];
      const updated: ExamEntry = {
        ...original,
        ...changes,
        status: changes.status || 'date_changed',
      };
      exams[index] = updated;
      saveStoredExams(exams);

      // 3. Notify group students if requested
      if (changes.notifyGroup !== false) {
        const statusMap: Record<string, string> = {
          date_changed: 'Перенос даты экзамена',
          room_changed: 'Замена аудитории экзамена',
          postponed: 'Перенос экзамена на резервный день',
          cancelled: 'Отмена экзамена',
          scheduled: 'График экзамена подтвержден',
        };

        const noteText = changes.changeNote ? ` Примечание деканата: ${changes.changeNote}.` : '';
        const msg = `Внимание, группа ${original.groupId}! По дисциплине «${original.subject}» (${original.code}) статус: ${statusMap[updated.status] || 'Изменение в графике'}. Новая дата: ${updated.date}, время: ${updated.time}, ауд.: ${updated.room}. Консультация: ${updated.consultation}.${noteText}`;

        await this.sendStaffAnnouncement({
          title: `Изменение даты экзамена: ${original.subject}`,
          message: msg,
          targetGroup: original.groupId,
          kind: 'schedule_change',
          priority: 'urgent',
        });
      }
    }
  },

  async createExam(
    examData: Omit<ExamEntry, 'id'> & { notifyGroup?: boolean }
  ): Promise<ExamEntry> {
    const exams = getStoredExams();
    const newExam: ExamEntry = {
      ...examData,
      id: `ex-${Date.now()}`,
      status: examData.status || 'scheduled',
    };
    exams.push(newExam);
    saveStoredExams(exams);

    if (examData.notifyGroup !== false) {
      await this.sendStaffAnnouncement({
        title: `Утвержден экзамен: ${newExam.subject}`,
        message: `Внимание, группа ${newExam.groupId}! В график зимней сессии внесен экзамен по дисциплине «${newExam.subject}» на ${newExam.date} (${newExam.time}, ${newExam.room}). Экзаменатор: ${newExam.examiner}.`,
        targetGroup: newExam.groupId,
        kind: 'schedule_change',
        priority: 'high',
      });
    }

    return newExam;
  },

  async resetExam(examId: string): Promise<void> {
    const initial = INITIAL_EXAMS.find(e => e.id === examId);
    if (!initial) return;
    const exams = getStoredExams();
    const idx = exams.findIndex(e => e.id === examId);
    if (idx !== -1) {
      exams[idx] = { ...initial };
      saveStoredExams(exams);
    }
  },

  // ─── AI Academic Copilot ───
  async askAssistant(question: string, lang: 'ru' | 'en' = 'ru'): Promise<string> {
    const res = await apiFetch('/assistant/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (res?.ok) {
      const data = await res.json();
      return data.answer;
    }

    const current = await this.getCurrentUser();
    const q = question.toLowerCase();

    // Contextual responses tailored to student's real data
    if (q.includes('пересдач') || q.includes('долг') || q.includes('статистик') || q.includes('retake') || q.includes('debt') || q.includes('statistics')) {
      if (current?.user.id === 'usr-timur-205') {
        return lang === 'en'
          ? 'Timur, you have an academic debt in "Statistics" (48 points, grade "2"). The committee retake is scheduled for Nov 28 at 14:00, Room А-314 (Assoc. Prof. Kovalev S.A.). Consultation is on Wednesday at 14:00.'
          : 'Тимур, у вас зафиксирована академическая задолженность по дисциплине "Статистика" (48 баллов, оценка "2"). Комиссионная пересдача назначена на 28 ноября в 14:00, ауд. А-314 (доц. Ковалев С.А.). Консультация пройдет в среду в 14:00.';
      }
      return lang === 'en'
        ? 'You have no academic debts! All current courses have been passed successfully.'
        : 'У вас нет академических задолженностей! Все текущие предметы сданы успешно.';
    }

    if (q.includes('стипенди') || q.includes('пгас') || q.includes('выплат') || q.includes('scholarship') || q.includes('merit')) {
      return lang === 'en'
        ? 'Applications for the Enhanced Merit Scholarship are open until Nov 25. Submit your application online under "Official Certificates" -> "Merit Scholarship Application", attaching your publications or Olympiad diplomas.'
        : 'Прием заявлений на повышенную государственную академическую стипендию (ПГАС) открыт до 25 ноября. Вы можете подать заявление онлайн в разделе "Справки и заявления" -> "Заявление на повышенную стипендию", прикрепив список ваших научных публикаций или дипломов олимпиад.';
    }

    if (q.includes('справк') || q.includes('заказ') || q.includes('военкомат') || q.includes('виз') || q.includes('certificate') || q.includes('order') || q.includes('document')) {
      return lang === 'en'
        ? 'You can order any official certificate in a couple of clicks under "Official Certificates". A digitally signed PDF certificate is typically issued within 1–2 business days and will be ready for download in your portal.'
        : 'Вы можете оформить любую справку за пару кликов в разделе "Справки и заявления". Готовая электронная справка с квалифицированной ЭЦП деканата формируется в среднем за 1-2 рабочих дня и будет доступна для скачивания в формате PDF прямо в вашем кабинете.';
    }

    if (q.includes('расписан') || q.includes('пара') || q.includes('пары') || q.includes('аудитор') || q.includes('schedule') || q.includes('class') || q.includes('room') || q.includes('timetable')) {
      if (current?.profile.group === 'ДУ-101') {
        return lang === 'en'
          ? 'Your group ДУ-101 classes today: 08:30 Diplomatic Protocol (A-204), 10:15 International Public Law (note: moved to B-115!), 12:00 English for Diplomacy (Lingvo-2).'
          : 'Для вашей группы ДУ-101 сегодня в расписании занятия: 08:30 Дипломатический протокол (А-204), 10:15 Международное публичное право (внимание: перенесено в Б-115!), 12:00 Английский язык для дипломатов (Лингво-2).';
      }
      return lang === 'en'
        ? 'Your up-to-date timetable including room changes and rescheduling is available in the "Timetable & Exams" tab.'
        : 'Ваше актуальное расписание с учетом всех замен и переносов аудиторий доступно во вкладке "Расписание".';
    }

    if (q.includes('деканат') || q.includes('часы') || q.includes('контакт') || q.includes('где') || q.includes('office') || q.includes('hours') || q.includes('contact')) {
      return lang === 'en'
        ? "The School of International Relations Dean's Office is located in the Main Building, 3rd Floor, Room 312. Office hours: Mon–Fri 09:00–18:00 (lunch 13:00–14:00). Email: dean.office@demo.edu."
        : 'Деканат факультета международных отношений расположен в Главном корпусе, 3 этаж, кабинет 312. Часы приема студентов: Пн-Пт с 09:00 до 18:00 (обед 13:00-14:00). Электронная почта: dean.office@demo.edu.';
    }

    return lang === 'en'
      ? `Hello! I am your DemoTech University AI Academic Advisor. I have context on your group (${current?.profile.group ?? 'student'}), academic grades, petition statuses, and university rules. How can I help you?`
      : `Здравствуйте! Я ваш цифровой ассистент деканата ДемоТех Университета. Я знаю расписание вашей группы (${current?.profile.group ?? 'студента'}), вашу успеваемость, статус поданных заявлений и правила учебного процесса. Чем я могу помочь?`;
  },
};
