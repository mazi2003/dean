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
import { getAvatarDataUri } from '../utils/avatar';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
  });
  return res;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.message === 'string' && body.message.trim()) {
      return body.message;
    }
  } catch {
    // ignore JSON parse error
  }
  return fallback;
}

function hydrateAvatar(profile: StudentProfile): StudentProfile {
  return {
    ...profile,
    avatarUrl: profile.avatarUrl || getAvatarDataUri(profile.fullName),
  };
}

export const api = {
  // ─── Auth ───
  async login(email: string, password: string): Promise<{ user: User; profile: StudentProfile }> {
    let res: Response;
    try {
      res = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error('Сервер авторизации недоступен. Проверьте подключение.');
    }

    if (!res.ok) {
      const msg = await parseErrorMessage(res, 'Неверный адрес электронной почты или пароль');
      throw new Error(msg);
    }

    const user = (await res.json()) as User;
    const profRes = await apiFetch('/profile');
    if (profRes.ok) {
      const profile = hydrateAvatar((await profRes.json()) as StudentProfile);
      return { user, profile };
    }

    return {
      user,
      profile: hydrateAvatar({
        ...user,
        faculty: '',
        program: '',
        year: 0,
        group: '',
        studentNumber: '',
      }),
    };
  },

  async logout(): Promise<void> {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined);
  },

  async getCurrentUser(): Promise<{ user: User; profile: StudentProfile } | null> {
    let res: Response;
    try {
      res = await apiFetch('/profile');
    } catch {
      return null;
    }

    if (!res.ok) {
      return null;
    }

    const profile = hydrateAvatar((await res.json()) as StudentProfile);
    const user: User = {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
    };
    return { user, profile };
  },

  // ─── Profile ───
  async getProfile(): Promise<StudentProfile> {
    const res = await apiFetch('/profile');
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Не удалось загрузить профиль'));
    }
    return hydrateAvatar((await res.json()) as StudentProfile);
  },

  // ─── Schedule ───
  async getSchedule(date?: string, groupOverride?: string): Promise<ScheduleEntry[]> {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (groupOverride) params.set('group', groupOverride);
    const qs = params.toString();
    const res = await apiFetch(`/schedule${qs ? `?${qs}` : ''}`);
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Не удалось загрузить расписание'));
    }
    return (await res.json()) as ScheduleEntry[];
  },

  // ─── Grades ───
  async getGrades(): Promise<GradesSummary> {
    const res = await apiFetch('/grades');
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Не удалось загрузить оценки'));
    }
    return (await res.json()) as GradesSummary;
  },

  // ─── Requests ───
  async getRequestTypes(): Promise<RequestType[]> {
    const res = await apiFetch('/request-types');
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Не удалось загрузить каталог справок'));
    }
    return (await res.json()) as RequestType[];
  },

  async getRequests(): Promise<StudentRequest[]> {
    const res = await apiFetch('/requests');
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Не удалось загрузить заявления'));
    }
    const payload = await res.json();
    const rawItems = Array.isArray(payload) ? payload : payload.items ?? [];
    return rawItems.map((r: StudentRequest & { expectedBy?: string }) => ({
      ...r,
      expectedDate: r.expectedDate ?? r.expectedBy ?? '',
    }));
  },

  async createRequest(typeCode: string, data: Record<string, unknown>): Promise<StudentRequest> {
    const res = await apiFetch('/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ typeCode, data }),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Ошибка создания заявления'));
    }
    return (await res.json()) as StudentRequest;
  },

  async cancelRequest(requestId: string): Promise<void> {
    const res = await apiFetch(`/requests/${encodeURIComponent(requestId)}/cancel`, { method: 'POST' });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Не удалось отменить заявление'));
    }
  },

  // ─── Notifications ───
  async getNotifications(): Promise<Notification[]> {
    const res = await apiFetch('/notifications');
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Не удалось загрузить уведомления'));
    }
    const payload = await res.json();
    const rawItems = Array.isArray(payload) ? payload : payload.items ?? [];
    return rawItems.map((n: Notification & { body?: string }) => ({
      ...n,
      message: n.message ?? n.body ?? '',
    }));
  },

  async markNotificationRead(id: string): Promise<void> {
    const res = await apiFetch(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
    if (!res.ok && res.status !== 204) {
      throw new Error(await parseErrorMessage(res, 'Ошибка обновления уведомления'));
    }
  },

  async markAllNotificationsRead(): Promise<void> {
    const res = await apiFetch('/notifications/read-all', { method: 'POST' });
    if (!res.ok && res.status !== 204) {
      throw new Error(await parseErrorMessage(res, 'Ошибка обновления уведомлений'));
    }
  },

  // ─── Staff Only APIs ───
  async getStaffRequests(): Promise<StudentRequest[]> {
    const res = await apiFetch('/staff/requests');
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Не удалось загрузить очередь заявлений'));
    }
    const payload = await res.json();
    const rawItems = Array.isArray(payload) ? payload : payload.items ?? [];
    return rawItems.map((r: StudentRequest & { expectedBy?: string }) => ({
      ...r,
      expectedDate: r.expectedDate ?? r.expectedBy ?? '',
    }));
  },

  async updateStaffRequestStatus(
    requestId: string,
    status: RequestStatus,
    comment?: string
  ): Promise<StudentRequest> {
    const res = await apiFetch(`/staff/requests/${encodeURIComponent(requestId)}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, comment }),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Ошибка обновления статуса заявления'));
    }
    return (await res.json()) as StudentRequest;
  },

  async getStaffAnnouncements(): Promise<StaffAnnouncement[]> {
    const res = await apiFetch('/staff/announcements');
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Не удалось загрузить распоряжения'));
    }
    return (await res.json()) as StaffAnnouncement[];
  },

  async deleteStaffAnnouncement(announcementId: string): Promise<void> {
    const res = await apiFetch(`/staff/announcements/${encodeURIComponent(announcementId)}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Не удалось удалить объявление'));
    }
  },

  async sendStaffAnnouncement(params: {
    title: string;
    message: string;
    targetGroup?: string | null;
    targetUserId?: string | null;
    priority?: 'normal' | 'high' | 'urgent';
    kind?: NotificationKind;
  }): Promise<{ success: boolean; count: number }> {
    const res = await apiFetch('/staff/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: params.title,
        body: params.message,
        group: params.targetGroup === 'all' ? null : params.targetGroup || null,
        targetUserId: params.targetUserId ?? null,
        priority: params.priority ?? 'high',
        kind: params.kind ?? 'announcement',
      }),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Ошибка публикации объявления'));
    }
    const data = await res.json();
    return { success: true, count: data.count ?? 0 };
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
    const res = await apiFetch('/staff/schedule-changes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduleEntryId,
        status: changes.status,
        room: changes.room,
        start: changes.start,
        end: changes.end,
        note: changes.note,
        notifyGroup: changes.notifyGroup ?? true,
      }),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Ошибка обновления расписания'));
    }
  },

  // ─── Dean's Office Academic Groups & Student Rosters ───
  async getStaffGroups(): Promise<AcademicGroup[]> {
    const res = await apiFetch('/staff/groups');
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Не удалось загрузить академические группы'));
    }
    return (await res.json()) as AcademicGroup[];
  },

  async getGroupStudents(groupCode?: string): Promise<StudentListItem[]> {
    const path = groupCode && groupCode !== 'all'
      ? `/staff/groups/${encodeURIComponent(groupCode)}/students`
      : '/staff/students';
    const res = await apiFetch(path);
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Не удалось загрузить список студентов'));
    }
    const list = (await res.json()) as StudentListItem[];
    return list.map((s) => ({
      ...s,
      avatarUrl: s.avatarUrl || getAvatarDataUri(s.fullName),
    }));
  },

  async getStudentDossier(studentId: string): Promise<StudentDossier | null> {
    const res = await apiFetch(`/staff/students/${encodeURIComponent(studentId)}/dossier`);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Не удалось загрузить личное дело'));
    }
    const dossier = (await res.json()) as StudentDossier;
    return {
      ...dossier,
      profile: {
        ...dossier.profile,
        avatarUrl: dossier.profile.avatarUrl || getAvatarDataUri(dossier.profile.fullName),
      },
    };
  },

  // ─── Examination Session & Scheduling ───
  async getExams(groupCode?: string): Promise<ExamEntry[]> {
    const path = groupCode && groupCode !== 'all'
      ? `/exams?group=${encodeURIComponent(groupCode)}`
      : '/exams';
    const res = await apiFetch(path);
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Не удалось загрузить график экзаменов'));
    }
    return (await res.json()) as ExamEntry[];
  },

  async updateExam(
    examId: string,
    changes: Partial<ExamEntry> & { notifyGroup?: boolean }
  ): Promise<ExamEntry> {
    const res = await apiFetch('/staff/exam-changes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId, ...changes }),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Ошибка обновления экзамена'));
    }
    return (await res.json()) as ExamEntry;
  },

  async createExam(
    examData: Omit<ExamEntry, 'id'> & { notifyGroup?: boolean }
  ): Promise<ExamEntry> {
    const res = await apiFetch('/staff/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(examData),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Ошибка создания экзамена'));
    }
    return (await res.json()) as ExamEntry;
  },

  async resetExam(examId: string): Promise<ExamEntry> {
    const res = await apiFetch(`/staff/exams/${encodeURIComponent(examId)}/reset`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Ошибка сброса расписания экзамена'));
    }
    return (await res.json()) as ExamEntry;
  },

  // ─── AI Academic Copilot (Server-side only) ───
  async askAssistant(
    question: string,
    lang: 'ru' | 'en' = 'ru'
  ): Promise<{ answer: string; source: 'llm' | 'rules' }> {
    const res = await apiFetch('/assistant/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, lang }),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Не удалось получить ответ консультанта'));
    }
    const data = (await res.json()) as { answer: string; source?: 'llm' | 'rules' };
    return {
      answer: data.answer,
      source: data.source ?? 'rules',
    };
  },
};
