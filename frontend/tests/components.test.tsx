import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { LoginPage } from '../src/pages/LoginPage';
import { Footer } from '../src/components/Footer';
import { BottomNav } from '../src/components/BottomNav';
import { Header } from '../src/components/Header';
import { StudentCardModal } from '../src/components/StudentCardModal';
import { GradesPage } from '../src/pages/GradesPage';
import { RequestsPage } from '../src/pages/RequestsPage';
import { SchedulePage } from '../src/pages/SchedulePage';
import { ProfilePage } from '../src/pages/ProfilePage';
import { TodayPage } from '../src/pages/TodayPage';
import { CampusMapModal } from '../src/components/CampusMapModal';
import { ScheduleCollisionAlert } from '../src/components/ScheduleCollisionAlert';
import { UniversityEmblem } from '../src/components/UniversityEmblem';
import { NotificationsPage } from '../src/pages/NotificationsPage';
import { AssistantModal } from '../src/components/AssistantModal';
import { CertificatePreviewModal } from '../src/components/CertificatePreviewModal';
import { StaffDashboardPage } from '../src/pages/StaffDashboardPage';
import { StaffStudentsPage } from '../src/pages/StaffStudentsPage';
import { Sidebar } from '../src/components/Sidebar';
import { normalizeScheduleType, localizeText, localizePersonName } from '../src/utils/i18n';

vi.mock('qrcode', () => ({
  default: {
    toDataURL: (_payload: string, _opts: unknown, cb: (err: Error | null, url: string) => void) => {
      cb(null, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB');
    },
  },
}));

const TEST_PROFILES = {
  aigul: {
    id: '11111111-1111-4111-8111-111111111101',
    email: 'aigul.nurova@demo.edu',
    fullName: 'Айгуль Нурова',
    role: 'student',
    faculty: 'Факультет международных отношений',
    program: 'Международные отношения (Бакалавриат)',
    year: 2,
    group: 'ДУ-101',
    studentNumber: 'СТ-2023-0194',
    gpa: 4.8,
    averageScore: 88.5,
    studyForm: 'Бюджет',
  },
  timur: {
    id: '11111111-1111-4111-8111-111111111102',
    email: 'timur.belov@demo.edu',
    fullName: 'Тимур Белов',
    role: 'student',
    faculty: 'Факультет международных отношений',
    program: 'Мировая экономика (Бакалавриат)',
    year: 3,
    group: 'ДУ-205',
    studentNumber: 'СТ-2022-0082',
    gpa: 3.4,
    averageScore: 64.2,
    studyForm: 'Контракт',
  },
  lina: {
    id: '11111111-1111-4111-8111-111111111103',
    email: 'lina.okafor@demo.edu',
    fullName: 'Лина Окафор',
    role: 'student',
    faculty: 'Факультет международных отношений',
    program: 'Международные отношения (Бакалавриат)',
    year: 2,
    group: 'ДУ-101',
    studentNumber: 'СТ-2023-0215',
    gpa: 4.2,
    averageScore: 76.4,
    studyForm: 'Контракт',
  },
  staff: {
    id: '11111111-1111-4111-8111-111111111104',
    email: 'dean.office@demo.edu',
    fullName: 'Мария Волкова (Сотрудник деканата)',
    role: 'staff',
    faculty: 'Деканат Факультета МО',
    program: 'Административное управление',
    year: 0,
    group: 'ДЕКАНАТ-МО',
    studentNumber: 'ТАБ-0441',
  },
};

function installApiFetchMock(
  persona: keyof typeof TEST_PROFILES | null,
  options?: {
    emptyExams?: boolean;
    emptyStudents?: boolean;
    omitGrades?: boolean;
  }
) {
  const requestsStore: Array<Record<string, unknown>> = [];
  const notificationsStore: Array<Record<string, unknown>> = [
    {
      id: 'notif-1',
      userId: TEST_PROFILES[persona || 'aigul'].id,
      kind: 'announcement',
      title: 'Утверждено расписание зимней экзаменационной сессии',
      message: 'Проверьте даты консультаций и экзаменов во вкладке «Расписание».',
      read: false,
      createdAt: '2026-11-18T10:00:00.000Z',
      priority: 'high',
    },
    {
      id: 'notif-2',
      userId: TEST_PROFILES[persona || 'aigul'].id,
      kind: 'deadline',
      title: 'Прием заявок на ПГАС до 25 ноября',
      message: 'Подайте документы через раздел «Справки и заявления».',
      read: false,
      createdAt: '2026-11-19T12:00:00.000Z',
      priority: 'urgent',
    },
  ];
  const announcementsStore: Array<Record<string, unknown>> = [];
  const staffGroupsStore = [
    {
      id: 'grp-1',
      code: 'ДУ-101',
      program: 'Международные отношения (Бакалавриат)',
      faculty: 'Факультет международных отношений',
      year: 2023,
      courseNumber: 2,
      studentsCount: 2,
      budgetCount: 1,
      contractCount: 1,
      curatorName: 'доц. Смирнов А.К.',
      averageGpa: 4.5,
      debtCount: 0,
    },
    {
      id: 'grp-2',
      code: 'ДУ-102',
      program: 'Международные отношения (Бакалавриат)',
      faculty: 'Факультет международных отношений',
      year: 2024,
      courseNumber: 1,
      studentsCount: 1,
      budgetCount: 1,
      contractCount: 0,
      curatorName: 'доц. Орлова Е.В.',
      averageGpa: 4.4,
      debtCount: 0,
    },
    {
      id: 'grp-3',
      code: 'ДУ-205',
      program: 'Мировая экономика (Бакалавриат)',
      faculty: 'Факультет международных отношений',
      year: 2022,
      courseNumber: 3,
      studentsCount: 1,
      budgetCount: 0,
      contractCount: 1,
      curatorName: 'доц. Ковалев С.А.',
      averageGpa: 3.4,
      debtCount: 1,
    },
    {
      id: 'grp-4',
      code: 'ДУ-301',
      program: 'Дипломатическая служба (Магистратура)',
      faculty: 'Факультет международных отношений',
      year: 2024,
      courseNumber: 1,
      studentsCount: 1,
      budgetCount: 1,
      contractCount: 0,
      curatorName: 'проф. Воронов А.Н.',
      averageGpa: 4.9,
      debtCount: 0,
    },
  ];

  const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method || 'GET').toUpperCase();

    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });

    if (url.endsWith('/auth/login') && method === 'POST') {
      return json(
        { code: 'UNAUTHORIZED', message: 'Неверный адрес электронной почты или пароль' },
        401
      );
    }

    if (url.endsWith('/profile')) {
      if (!persona) return json({ code: 'UNAUTHORIZED', message: 'Not authenticated' }, 401);
      if (options?.omitGrades) {
        const { gpa: _gpa, ...rest } = TEST_PROFILES[persona] as Record<string, unknown>;
        return json(rest);
      }
      return json(TEST_PROFILES[persona]);
    }

    if (url.includes('/schedule')) {
      const todayIso = new Date().toISOString().slice(0, 10);
      if (persona === 'timur') {
        return json([
          {
            id: 'sch-timur-consult',
            date: '2026-11-28',
            dayOfWeek: 6,
            start: '14:00',
            end: '15:35',
            subject: 'Консультация перед пересдачей: Статистика',
            type: 'seminar',
            room: 'А-314',
            teacher: 'доц. Ковалев С.А.',
            status: 'normal',
            groupId: 'ДУ-205',
          },
        ]);
      }
      return json([
        {
          id: 'sch-1',
          date: todayIso,
          dayOfWeek: 1,
          start: '08:30',
          end: '10:05',
          subject: 'Дипломатический протокол',
          type: 'lecture',
          room: 'А-204',
          teacher: 'проф. Соколов И.В.',
          status: 'normal',
          groupId: 'ДУ-101',
        },
        {
          id: 'sch-2',
          date: todayIso,
          dayOfWeek: 1,
          start: '10:15',
          end: '11:50',
          subject: 'Международное публичное право',
          type: 'seminar',
          room: 'Б-115',
          teacher: 'доц. Кузнецова Е.А.',
          status: 'room_changed',
          changeNote: 'Перенесено в Б-115',
          groupId: 'ДУ-101',
        },
        {
          id: 'sch-3',
          date: todayIso,
          dayOfWeek: 2,
          start: '10:15',
          end: '11:50',
          subject: 'Макроэкономика',
          type: 'lecture',
          room: 'Актовый зал 3',
          teacher: 'проф. Дмитриев А.Н.',
          status: 'normal',
          groupId: 'ДУ-101',
        },
        {
          id: 'sch-4',
          date: todayIso,
          dayOfWeek: 2,
          start: '12:00',
          end: '13:35',
          subject: 'Политическая философия',
          type: 'seminar',
          room: 'В-302',
          teacher: 'доц. Громов В.П.',
          status: 'cancelled',
          groupId: 'ДУ-101',
        },
        {
          id: 'sch-5',
          date: todayIso,
          dayOfWeek: 2,
          start: '14:00',
          end: '15:35',
          subject: 'Физическая культура и спорт',
          type: 'lab',
          room: 'Спорткомплекс',
          teacher: 'Васильев О.К.',
          status: 'normal',
          groupId: 'ДУ-101',
        },
      ]);
    }

    if (url.includes('/grades')) {
      if (options?.omitGrades) {
        return json({ code: 'NOT_FOUND', message: 'No grades' }, 404);
      }
      if (persona === 'timur') {
        return json({
          semester: 3,
          averagePoints: 64.2,
          gpa: 3.4,
          creditsEarned: 18,
          creditsRequired: 30,
          upcomingExams: [],
          items: [
            {
              id: 'grd-t-stat',
              subject: 'Статистика',
              credits: 4,
              assessmentType: 'exam',
              points: 48,
              grade: 2,
              creditStatus: 'failed',
              examDate: '2026-11-28',
              retakeDate: '2026-11-28',
              teacher: 'доц. Ковалев С.А.',
              semester: 3,
            },
          ],
        });
      }
      return json({
        semester: 3,
        averagePoints: 88.5,
        gpa: 4.8,
        creditsEarned: 24,
        creditsRequired: 30,
        upcomingExams: [],
        items: [],
      });
    }

    if (url.includes('/request-types')) {
      return json([
        {
          code: 'study_certificate',
          title: 'Справка об обучении',
          description: 'Подтверждение статуса студента',
          slaDays: 2,
          fields: [
            {
              name: 'purpose',
              label: 'Место предъявления',
              labelEn: 'Recipient Organization',
              type: 'text',
              required: true,
              placeholder: 'Например: Пенсионный фонд РФ',
              placeholderEn: 'e.g., Visa Center',
            },
            {
              name: 'copies',
              label: 'Количество экземпляров',
              labelEn: 'Number of Copies',
              type: 'number',
              required: true,
              placeholder: '1',
            },
            {
              name: 'delivery',
              label: 'Форма получения',
              labelEn: 'Delivery Format',
              type: 'select',
              required: true,
              options: ['Электронный макет (PDF, демо)', 'Бумажная в деканате'],
              optionsEn: ['Digital Preview (PDF, Demo)', 'Paper at Dean Office'],
            },
            {
              name: 'notes',
              label: 'Дополнительный комментарий',
              labelEn: 'Additional Notes',
              type: 'textarea',
              required: false,
              placeholder: 'Комментарий к заявке',
              placeholderEn: 'Optional request comments',
            },
            {
              name: 'neededBy',
              label: 'Желаемая дата',
              labelEn: 'Desired Date',
              type: 'date',
              required: false,
            },
          ],
        },
      ]);
    }

    if (url.includes('/staff/requests/') && url.endsWith('/status') && method === 'POST') {
      return json({ id: 'staff-req-1', status: 'ready' });
    }

    if (url.includes('/staff/requests')) {
      return json({
        items: [
          {
            id: 'staff-req-1',
            studentId: TEST_PROFILES.aigul.id,
            studentName: TEST_PROFILES.aigul.fullName,
            studentGroup: 'ДУ-101',
            typeCode: 'study_certificate',
            typeTitle: 'Справка об обучении',
            data: { purpose: 'По месту работы родителей', copies: 1 },
            status: 'submitted',
            slaDays: 2,
            expectedDate: '2026-11-24',
            createdAt: '2026-11-20T10:00:00.000Z',
            updatedAt: '2026-11-20T10:00:00.000Z',
            history: [],
          },
        ],
      });
    }

    if (url.endsWith('/requests') && method === 'POST') {
      const body = JSON.parse(String(init?.body || '{}'));
      const created = {
        id: 'req-new-1',
        studentId: TEST_PROFILES[persona || 'lina'].id,
        typeCode: body.typeCode,
        typeTitle: 'Справка об обучении',
        data: body.data || {},
        status: 'submitted',
        slaDays: 2,
        expectedDate: '2026-11-20',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [
          {
            id: 'h-1',
            status: 'submitted',
            createdAt: new Date().toISOString(),
            authorName: 'Лина Окафор',
          },
        ],
      };
      requestsStore.unshift(created);
      return json(created, 201);
    }

    if (url.includes('/requests')) {
      return json({ items: requestsStore });
    }

    if (url.endsWith('/notifications/read-all') && method === 'POST') {
      notificationsStore.forEach((n) => {
        n.read = true;
      });
      return new Response(null, { status: 204 });
    }

    if (url.includes('/notifications/') && url.endsWith('/read') && method === 'POST') {
      const id = url.split('/notifications/')[1].split('/read')[0];
      const item = notificationsStore.find((n) => n.id === id);
      if (item) item.read = true;
      return new Response(null, { status: 204 });
    }

    if (url.includes('/notifications')) {
      return json({
        items: notificationsStore,
        unreadCount: notificationsStore.filter((n) => !n.read).length,
      });
    }

    if (url.includes('/exams')) {
      if (options?.emptyExams) return json([]);
      if (persona === 'timur') {
        return json([
          {
            id: 'ex-stat-102',
            code: 'STAT-102',
            groupId: 'ДУ-205',
            subject: 'Математическая статистика и анализ данных',
            format: 'Комиссионная пересдача (Комиссия факультета)',
            examiner: 'доц. Ковалев С.А.',
            date: '28 ноября 2026',
            rawDate: '2026-11-28',
            time: '14:00 – 17:00',
            room: 'Ауд. А-314',
            consultation: '26 ноября в 14:00',
            credits: 4,
            status: 'scheduled',
            changeNote: null,
            retakeDate: '2026-11-28',
            isDebt: true,
          },
        ]);
      }
      return json([]);
    }

    if (url.endsWith('/assistant/ask') && method === 'POST') {
      return json({
        answer: 'Пересдача по статистике назначена на 28 ноября в аудитории А-314.',
        source: 'rules',
      });
    }

    if (url.includes('/staff/groups/') && url.endsWith('/students')) {
      return json(
        options?.emptyStudents
          ? []
          : [
              {
                id: TEST_PROFILES.timur.id,
                fullName: TEST_PROFILES.timur.fullName,
                email: TEST_PROFILES.timur.email,
                group: TEST_PROFILES.timur.group,
                year: TEST_PROFILES.timur.year,
                studentNumber: TEST_PROFILES.timur.studentNumber,
                studyForm: 'Контракт',
                gpa: 3.4,
                averageScore: 64.2,
                debtCount: 1,
                debtSubjects: ['Статистика'],
                status: 'active',
              },
            ]
      );
    }

    if (url.includes('/staff/groups')) {
      return json(staffGroupsStore);
    }

    if (url.includes('/staff/students/') && url.endsWith('/dossier')) {
      return json({
        profile: {
          ...TEST_PROFILES.timur,
          admissionYear: 2022,
          recordBookNumber: 'ЗК-2022-0082',
          debtCount: 1,
          debtSubjects: ['Статистика'],
          status: 'active',
        },
        gradesSummary: {
          semester: 5,
          averagePoints: 64.2,
          gpa: 3.4,
          creditsEarned: 18,
          creditsRequired: 30,
          upcomingExams: [],
          items: [
            {
              id: 'grd-t-stat',
              subject: 'Статистика',
              credits: 4,
              assessmentType: 'exam',
              points: 48,
              grade: 2,
              creditStatus: 'failed',
              examDate: '2026-11-28',
              retakeDate: '2026-11-28',
              teacher: 'доц. Ковалев С.А.',
              semester: 5,
            },
          ],
        },
        requests: [],
      });
    }

    if (url.includes('/staff/students')) {
      return json(
        options?.emptyStudents
          ? []
          : [
              {
                id: TEST_PROFILES.timur.id,
                fullName: TEST_PROFILES.timur.fullName,
                email: TEST_PROFILES.timur.email,
                group: TEST_PROFILES.timur.group,
                year: TEST_PROFILES.timur.year,
                studentNumber: TEST_PROFILES.timur.studentNumber,
                studyForm: 'Контракт',
                gpa: 3.4,
                averageScore: 64.2,
                debtCount: 1,
                debtSubjects: ['Статистика'],
                status: 'active',
              },
            ]
      );
    }

    if (url.endsWith('/staff/announcements') && method === 'POST') {
      const body = JSON.parse(String(init?.body || '{}'));
      announcementsStore.unshift({
        id: `ann-${Date.now()}`,
        title: body.title,
        body: body.body,
        targetGroup: body.group || 'all',
        priority: body.priority || 'high',
        kind: body.kind || 'announcement',
        createdAt: new Date().toISOString(),
        recipientCount: 15,
      });
      return json({ success: true, count: 15 }, 201);
    }

    if (url.includes('/staff/announcements')) {
      return json(announcementsStore);
    }

    return json({});
  });

  vi.stubGlobal('fetch', mockFetch);
  return mockFetch;
}

beforeEach(() => {
  installApiFetchMock(null);
});

describe('Frontend Component & Accessibility Suite', () => {
  it('LoginPage renders institutional SSO form without Demo Switcher and shows server 401 error on invalid login', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Вход в личный кабинет/i)).toBeInTheDocument();
    });

    // No Demo quick switch buttons exist
    expect(screen.queryByText(/^Demo:/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Айгуль' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Деканат' })).not.toBeInTheDocument();

    // Password visibility toggle
    const pwdInput = screen.getByPlaceholderText('••••••••••••') as HTMLInputElement;
    expect(pwdInput.type).toBe('password');
    const toggleBtn = screen.getByRole('button', { name: /Toggle password visibility/i });
    fireEvent.click(toggleBtn);
    expect(pwdInput.type).toBe('text');

    // Invalid credentials show backend error message
    const emailInput = screen.getByPlaceholderText('student@demo.edu') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'aigul.nurova@demo.edu' } });
    fireEvent.change(pwdInput, { target: { value: 'WrongPass!' } });
    fireEvent.click(screen.getByRole('button', { name: /Войти в личный кабинет/i }));

    await waitFor(() => {
      expect(screen.getByText(/Неверный адрес электронной почты или пароль/i)).toBeInTheDocument();
    });

    // Mandatory disclaimer footer is rendered
    expect(screen.getByText(/Конкурсный концепт/i)).toBeInTheDocument();
  });

  it('Footer renders mandatory fictional data competition disclaimer in RU and EN', () => {
    const Wrapper: React.FC = () => {
      const { toggleLang } = useAuth();
      return (
        <div>
          <button onClick={toggleLang}>SwitchLang</button>
          <Footer />
        </div>
      );
    };

    render(
      <AuthProvider>
        <Wrapper />
      </AuthProvider>
    );

    expect(
      screen.getByText(
        /Конкурсный концепт\. Не является официальным сервисом университета\. Все данные и имена вымышлены\./i
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('SwitchLang'));

    expect(
      screen.getByText(
        /Competition concept, not an official university service\. Fictional data\./i
      )
    ).toBeInTheDocument();
  });

  it('BottomNav provides WCAG AA >= 48px touch targets and role-based tabs', async () => {
    installApiFetchMock('staff');
    render(
      <AuthProvider>
        <BottomNav activeTab="staff_requests" setActiveTab={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Заявления')).toBeInTheDocument();
    });
    expect(screen.getByText('Группы')).toBeInTheDocument();
    expect(screen.getByText('Приказы')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn.className).toContain('min-h-[48px]');
      expect(btn.className).toContain('min-w-[48px]');
    }
  });

  it('StudentCardModal renders digital pass, illustrative NFC simulation, and enlarges QR code', async () => {
    installApiFetchMock('aigul');
    render(
      <AuthProvider>
        <StudentCardModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/симуляция NFC \/ QR-пропуска/i)).toBeInTheDocument();
    });

    const nfcBtn = screen.getByRole('button', { name: /Приложить к турникету \(Симуляция NFC\)/i });
    fireEvent.click(nfcBtn);
    await waitFor(
      () => {
        expect(screen.getByText(/Проход через турникет разрешен!/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    fireEvent.click(screen.getByTitle(/Нажмите, чтобы открыть QR-код на весь экран/i));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Назад/i })).toBeInTheDocument();
    });
  });

  it('GradesPage displays Timur failed Statistics debt banner and retake info from API', async () => {
    installApiFetchMock('timur');
    render(
      <AuthProvider>
        <GradesPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Академическая задолженность: Статистика/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText(/28 ноября 2026/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/А-314/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Обнаружен конфликт расписания/i)).toBeInTheDocument();
  });

  it('RequestsPage displays empty state for Lina and submits a new certificate request to API', async () => {
    installApiFetchMock('lina');
    render(
      <AuthProvider>
        <RequestsPage onPreviewCert={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/У вас пока нет активных заявлений/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Подать новое заявление/i }));
    await waitFor(() => {
      expect(screen.getByText(/Отправить в деканат/i)).toBeInTheDocument();
    });

    const purposeInput = screen.getByPlaceholderText(/Например: Пенсионный фонд РФ/i);
    const copiesInput = screen.getByPlaceholderText('1');
    const deliverySelect = screen.getByRole('combobox');

    fireEvent.change(purposeInput, { target: { value: 'Для визового центра' } });
    fireEvent.change(copiesInput, { target: { value: '2' } });
    fireEvent.change(deliverySelect, { target: { value: 'Электронный макет (PDF, демо)' } });

    fireEvent.click(screen.getByRole('button', { name: /Отправить в деканат/i }));

    await waitFor(() => {
      expect(screen.getByText(/Журнал поданных заявлений \(1\)/i)).toBeInTheDocument();
    });
  });

  it('AuthProvider + Header switches RU <-> EN globally, persists dean_lang, and updates document.lang', async () => {
    installApiFetchMock('aigul');

    render(
      <AuthProvider>
        <Header
          activeTab="profile"
          setActiveTab={vi.fn()}
          onOpenCard={vi.fn()}
          onOpenAssistant={vi.fn()}
        />
        <ProfilePage />
        <TodayPage
          setActiveTab={vi.fn()}
          onOpenCard={vi.fn()}
          onOpenAssistant={vi.fn()}
          onPreviewCert={vi.fn()}
        />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Учебные реквизиты студента/i)).toBeInTheDocument();
      expect(screen.getByText(/Расписание на сегодня/i)).toBeInTheDocument();
    });
    expect(document.documentElement.lang).toBe('ru');

    const toEnBtn = screen.getByTitle('Switch to English');
    fireEvent.click(toEnBtn);

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('en');
      expect(localStorage.getItem('dean_lang')).toBe('en');
      expect(screen.getByText(/Student Enrollment Record/i)).toBeInTheDocument();
      expect(screen.getByText(/Today's Classes/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Sign Out/i)).toBeInTheDocument();

    const toRuBtn = screen.getByTitle('Переключить на русский');
    fireEvent.click(toRuBtn);

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('ru');
      expect(localStorage.getItem('dean_lang')).toBe('ru');
      expect(screen.getByText(/Учебные реквизиты студента/i)).toBeInTheDocument();
    });
  });

  it('AuthProvider restores persisted EN language from localStorage on initial render', async () => {
    localStorage.setItem('dean_lang', 'en');
    installApiFetchMock('timur');

    render(
      <AuthProvider>
        <GradesPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('en');
      expect(screen.getByText(/Academic Debt: Statistics/i)).toBeInTheDocument();
    });
  });

  it('SchedulePage filters classes accurately by Lecture, Seminar, and Lab in both RU and EN modes', async () => {
    installApiFetchMock('aigul');

    render(
      <AuthProvider>
        <Header
          activeTab="schedule"
          setActiveTab={vi.fn()}
          onOpenCard={vi.fn()}
          onOpenAssistant={vi.fn()}
        />
        <SchedulePage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Дипломатический протокол')).toBeInTheDocument();
    });
    expect(screen.getByText('Международное публичное право')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Лекции' }));
    expect(screen.getByText('Дипломатический протокол')).toBeInTheDocument();
    expect(screen.queryByText('Международное публичное право')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Лабораторные' }));
    expect(screen.getByText(/Занятий выбранного формата нет/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Показать все форматы' }));
    expect(screen.getByText('Дипломатический протокол')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Вторник/i }));
    await waitFor(() => {
      expect(screen.getByText('Макроэкономика')).toBeInTheDocument();
    });
    expect(screen.getByText('Политическая философия')).toBeInTheDocument();
    expect(screen.getByText('Физическая культура и спорт')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Switch to English'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Lectures' })).toBeInTheDocument();
    });
    expect(screen.getByText('Macroeconomics')).toBeInTheDocument();
    expect(screen.getByText('Political Philosophy')).toBeInTheDocument();
    expect(screen.getByText('Physical Education & Sports')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Seminars' }));
    expect(screen.getByText('Political Philosophy')).toBeInTheDocument();
    expect(screen.queryByText('Macroeconomics')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Labs' }));
    expect(screen.getByText('Physical Education & Sports')).toBeInTheDocument();
    expect(screen.queryByText('Political Philosophy')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Lectures' }));
    expect(screen.getByText('Macroeconomics')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'All Formats' }));
    expect(screen.getByText('Macroeconomics')).toBeInTheDocument();
    expect(screen.getByText('Political Philosophy')).toBeInTheDocument();
    expect(screen.getByText('Physical Education & Sports')).toBeInTheDocument();
  });

  it('i18n helpers normalize Russian/English class types and translate known academic terms', () => {
    expect(normalizeScheduleType('lecture')).toBe('lecture');
    expect(normalizeScheduleType('Лекция')).toBe('lecture');
    expect(normalizeScheduleType('семинар')).toBe('seminar');
    expect(normalizeScheduleType('Лабораторная работа')).toBe('lab');
    expect(normalizeScheduleType('экзамен')).toBe('exam');

    expect(localizeText('Дипломатический протокол', 'en')).toBe('Diplomatic Protocol');
    expect(localizeText('Дипломатический протокол', 'ru')).toBe('Дипломатический протокол');

    expect(localizePersonName('Айгуль Нурова', 'en')).toBe('Aigul Nurova');
    expect(localizePersonName('Тимур Белов', 'en')).toBe('Timur Belov');
    expect(localizePersonName('Лина Окафор', 'en')).toBe('Lina Okafor');
    expect(localizePersonName('Мария Волкова (Сотрудник деканата)', 'en')).toBe(
      "Maria Volkova (Dean's Office Staff)"
    );
    expect(localizePersonName('Максим Волков', 'en')).toBe('Maxim Volkov');
    expect(localizePersonName('Дмитрий Савельев', 'en')).toBe('Dmitry Savelev');
    expect(localizePersonName('Айгуль Нурова', 'ru')).toBe('Айгуль Нурова');
  });

  it('CampusMapModal renders interactive SVG floor plan, switches floors, and highlights target room', async () => {
    installApiFetchMock('timur');
    const handleClose = vi.fn();
    render(
      <AuthProvider>
        <CampusMapModal isOpen={true} onClose={handleClose} initialRoomCode="А-314" />
      </AuthProvider>
    );

    expect(screen.getByText(/Интерактивная карта кампуса/i)).toBeInTheDocument();
    expect(screen.getAllByText(/А-314/i).length).toBeGreaterThanOrEqual(1);

    // Verify route calculation and stairs/ascent guidance (Floor 1 turnstiles -> Floor 3 A-314)
    expect(screen.getByText(/ТРЕБУЕТСЯ ПОДЪЕМ/i)).toBeInTheDocument();
    expect(screen.getByText(/Откуда \(Точка отправления \/ Вход\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Куда \(Точка назначения \/ Аудитория\)/i)).toBeInTheDocument();

    // Switch to Floor 1
    const floor1Btn = screen.getByRole('button', { name: /1 этаж/i });
    fireEvent.click(floor1Btn);
    expect(screen.getAllByText(/Конференц-зал Б/i).length).toBeGreaterThanOrEqual(1);

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /Закрыть карту/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('ScheduleCollisionAlert displays collision warning, shows institutional policy, and expands memo', () => {
    installApiFetchMock('timur');
    const handleOpenMap = vi.fn();
    render(
      <AuthProvider>
        <ScheduleCollisionAlert
          retakeDate="28 ноября 2026 г."
          retakeTime="14:00"
          retakeSubject="Математическая статистика и анализ данных"
          retakeRoom="А-314"
          onOpenMap={handleOpenMap}
        />
      </AuthProvider>
    );

    expect(screen.getByText(/Обнаружен конфликт расписания/i)).toBeInTheDocument();
    expect(screen.getByText(/Приоритет аттестации \(Level 1\)/i)).toBeInTheDocument();

    // Expand memo
    const memoToggle = screen.getByRole('button', { name: /Служебная записка деканата № 118-А/i });
    fireEvent.click(memoToggle);
    expect(screen.getByText(/РАСПОРЯЖЕНИЕ ДЕКАНАТА № 118-А-СТ/i)).toBeInTheDocument();

    // Trigger map click
    const mapBtn = screen.getByRole('button', { name: /Найти ауд\. А-314 на карте/i });
    fireEvent.click(mapBtn);
    expect(handleOpenMap).toHaveBeenCalledWith('А-314');
  });

  it('StudentCardModal renders digital student pass with NFC turnstile simulation and expandable QR code', async () => {
    installApiFetchMock('aigul');
    render(
      <AuthProvider>
        <StudentCardModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Приложить к турникету/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/2024-БИ-0412/i)).toBeInTheDocument();
  });

  it('localizeText translates notifications and status updates to English correctly', () => {
    expect(localizeText('Справка об обучении в обработке', 'en')).toBe(
      'Enrollment Certificate in Processing'
    );
    expect(localizeText('Ваше заявление передано на подпись в деканат.', 'en')).toBe(
      "Your application has been forwarded for signature at the Dean's Office."
    );
    expect(localizeText('Заявление принято: Справка об обучении', 'en')).toBe(
      'Petition Registered: Enrollment Certificate'
    );
  });

  it('UniversityEmblem renders Digital Rotunda Columns across variants, tones, and unique SVG gradient IDs', () => {
    const { container } = render(
      <div>
        <UniversityEmblem size={40} variant="full" tone="dark" />
        <UniversityEmblem size={44} variant="full" tone="light" />
        <UniversityEmblem size={48} variant="seal" />
        <UniversityEmblem size={32} variant="monochrome" />
        <UniversityEmblem size={36} variant="wordmark" />
      </div>
    );

    const emblems = screen.getAllByRole('img', { name: /DemoTech University Emblem/i });
    expect(emblems).toHaveLength(5);

    // Gradient IDs must be unique across sibling emblems (monochrome has no gradient)
    const gradientIds = Array.from(container.querySelectorAll('linearGradient')).map((el) =>
      el.getAttribute('id')
    );
    expect(gradientIds).toHaveLength(4);
    expect(new Set(gradientIds).size).toBe(4);

    // Dark tone uses crisp white structural ink; light tone uses obsidian ink
    expect(emblems[0].querySelector('path')?.getAttribute('stroke')).toBe('#FFFFFF');
    expect(emblems[1].querySelector('path')?.getAttribute('stroke')).toBe('#161821');

    // Seal variant renders outer concentric stamp rings
    expect(emblems[2].querySelectorAll('circle').length).toBeGreaterThanOrEqual(6);

    // Monochrome variant renders using currentColor without gradients
    expect(emblems[3].querySelector('linearGradient')).toBeNull();
    expect(emblems[3].querySelector('path')?.getAttribute('stroke')).toBe('currentColor');

    // Wordmark renders full institutional lockup
    expect(screen.getByText('DemoTech')).toBeInTheDocument();
    expect(screen.getByText('University')).toBeInTheDocument();
  });

  it('NotificationsPage filters notices, marks individual & all as read, and avoids nested interactive buttons', async () => {
    const fetchMock = installApiFetchMock('aigul');
    const { container } = render(
      <AuthProvider>
        <NotificationsPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Утверждено расписание зимней экзаменационной сессии/i)
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Прием заявок на ПГАС до 25 ноября/i)).toBeInTheDocument();

    // Ensure no nested <button> inside <button>
    expect(container.querySelectorAll('button button')).toHaveLength(0);

    // Filter by Academic Deadlines
    fireEvent.click(screen.getByRole('button', { name: /Академические дедлайны/i }));
    expect(screen.getByText(/Прием заявок на ПГАС до 25 ноября/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/Утверждено расписание зимней экзаменационной сессии/i)
    ).not.toBeInTheDocument();

    // Mark single notification read
    fireEvent.click(screen.getByRole('button', { name: /Отметить прочитанным/i }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/notifications/notif-2/read'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    // Reset filter and mark all remaining read
    fireEvent.click(screen.getByRole('button', { name: /Все публикации/i }));
    fireEvent.click(screen.getByRole('button', { name: /Прочитать все/i }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/notifications/read-all'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('AssistantModal submits questions to API, renders answer, and closes on Escape', async () => {
    installApiFetchMock('aigul');
    const handleClose = vi.fn();
    render(
      <AuthProvider>
        <AssistantModal isOpen={true} onClose={handleClose} />
      </AuthProvider>
    );

    const input = screen.getByLabelText(/Вопрос консультанту деканата/i);
    fireEvent.change(input, { target: { value: 'Когда пересдача?' } });
    fireEvent.click(screen.getByRole('button', { name: /Отправить сообщение/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Пересдача по статистике назначена на 28 ноября в аудитории А-314/i)
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Движок правил/i)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });

  it('CertificatePreviewModal renders fictional DemoTech copy without Minobrnauki/license claims and closes on Escape', async () => {
    installApiFetchMock('aigul');
    const handleClose = vi.fn();
    render(
      <AuthProvider>
        <CertificatePreviewModal
          request={{
            id: 'req-cert-1',
            studentId: TEST_PROFILES.aigul.id,
            studentName: TEST_PROFILES.aigul.fullName,
            studentGroup: 'ДУ-101',
            typeCode: 'study_certificate',
            typeTitle: 'Справка об обучении',
            data: { purpose: 'Для визового центра' },
            status: 'ready',
            slaDays: 2,
            expectedDate: '2026-11-24',
            createdAt: '2026-11-20T10:00:00.000Z',
            updatedAt: '2026-11-21T10:00:00.000Z',
            history: [],
          }}
          onClose={handleClose}
        />
      </AuthProvider>
    );

    expect(screen.getByText(/Университетский проспект, д\. 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/Минобрнауки/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/2841/i)).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });

  it('RequestsPage supports textarea, date, default number=1 submission, and EN labelEn/optionsEn', async () => {
    localStorage.setItem('dean_lang', 'en');
    const fetchMock = installApiFetchMock('lina');
    render(
      <AuthProvider>
        <RequestsPage onPreviewCert={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Order Document/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Order Document/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Recipient Organization/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Number of Copies/i)).toHaveValue(1);
    const notesTextarea = screen.getByLabelText(/Additional Notes/i);
    expect(notesTextarea.tagName).toBe('TEXTAREA');
    const dateInput = screen.getByLabelText(/Desired Date/i) as HTMLInputElement;
    expect(dateInput.type).toBe('date');

    expect(screen.getByRole('option', { name: 'Digital Preview (PDF, Demo)' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Recipient Organization/i), {
      target: { value: 'Visa Center' },
    });
    fireEvent.change(screen.getByLabelText(/Delivery Format/i), {
      target: { value: 'Электронный макет (PDF, демо)' },
    });
    fireEvent.change(notesTextarea, { target: { value: 'Need bilingual copy' } });
    fireEvent.change(dateInput, { target: { value: '2026-12-01' } });

    // Submit WITHOUT touching number field — default 1 must be sent
    fireEvent.click(screen.getByRole('button', { name: /Submit to Dean's Office/i }));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        ([u, i]) => String(u).endsWith('/requests') && i?.method === 'POST'
      );
      expect(postCall).toBeTruthy();
      const sentBody = JSON.parse(String(postCall?.[1]?.body || '{}'));
      expect(sentBody.data.copies).toBe(1);
      expect(sentBody.data.notes).toBe('Need bilingual copy');
      expect(sentBody.data.neededBy).toBe('2026-12-01');
    });
  });

  it('StaffDashboardPage populates all 4 dynamic groups and submits status & announcement updates', async () => {
    const fetchMock = installApiFetchMock('staff');
    render(
      <AuthProvider>
        <StaffDashboardPage activeTab="staff_requests" />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Айгуль Нурова/i)).toBeInTheDocument();
    });

    // Open status modal and submit
    fireEvent.click(screen.getByRole('button', { name: /Изменить статус/i }));
    fireEvent.click(screen.getByRole('button', { name: /Утвердить и уведомить студента/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/staff/requests/staff-req-1/status'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    // Switch to announcements and verify dynamic groups (ДУ-102, ДУ-301 present)
    fireEvent.click(screen.getByRole('button', { name: /Объявления/i }));
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /ДУ-301/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /ДУ-102/i })).toBeInTheDocument();
    });
  });

  it('StaffStudentsPage opens StudentDossierModal and OfficialTranscriptModal with dynamic semester and — GPA fallback', async () => {
    installApiFetchMock('staff');
    render(
      <AuthProvider>
        <StaffStudentsPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Тимур Белов/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Личное дело/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Досье студента/i })).toBeInTheDocument();
    });

    // Switch to Grades tab inside dossier: verify dynamic semester 5 (not hardcoded 3)
    fireEvent.click(screen.getByRole('button', { name: /Успеваемость и зачетка/i }));
    await waitFor(() => {
      expect(screen.getByText(/Экзаменационная ведомость — 5 семестр/i)).toBeInTheDocument();
    });

    // Open OfficialTranscriptModal: verify dynamic Semester 5 and no Minobrnauki/ЭЦП wording
    fireEvent.click(screen.getByRole('button', { name: /Сформировать выписку успеваемости/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/Результаты промежуточной аттестации \(Семестр 5\):/i)
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(/МИНОБРНАУКИ/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ПОДПИСАН ЭЛЕКТРОННОЙ ПОДПИСЬЮ/i)).not.toBeInTheDocument();

    // Also verify empty students list yields '—' instead of '4.35'
    installApiFetchMock('staff', { emptyStudents: true });
    render(
      <AuthProvider>
        <StaffStudentsPage />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.queryByText('4.35')).not.toBeInTheDocument();
    });
  });

  it('TodayPage & Sidebar render real creditsEarned, — GPA fallback, empty exams state, and dynamic staff groups', async () => {
    // 1) Aigul with real grades: shows (24 ECTS), not (48 ECTS)
    installApiFetchMock('aigul', { emptyExams: true });
    const { unmount } = render(
      <AuthProvider>
        <TodayPage
          setActiveTab={vi.fn()}
          onOpenCard={vi.fn()}
          onOpenAssistant={vi.fn()}
          onPreviewCert={vi.fn()}
        />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('(24 ECTS)')).toBeInTheDocument();
    });
    expect(screen.queryByText('(48 ECTS)')).not.toBeInTheDocument();
    expect(
      screen.getByText(/Экзамены и пересдачи для вашей группы пока не назначены/i)
    ).toBeInTheDocument();
    unmount();

    // 2) Missing GPA & grades: Sidebar and TodayPage show '—' instead of '4.80'
    installApiFetchMock('aigul', { omitGrades: true, emptyExams: true });
    const { unmount: unmountMissing } = render(
      <AuthProvider>
        <Sidebar
          activeTab="today"
          setActiveTab={vi.fn()}
          onOpenCard={vi.fn()}
          onOpenAssistant={vi.fn()}
        />
        <TodayPage
          setActiveTab={vi.fn()}
          onOpenCard={vi.fn()}
          onOpenAssistant={vi.fn()}
          onPreviewCert={vi.fn()}
        />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
    });
    expect(screen.queryByText('4.80')).not.toBeInTheDocument();
    unmountMissing();

    // 3) Staff masthead: shows dynamic 4 groups including ДУ-301 and ДУ-102
    installApiFetchMock('staff');
    render(
      <AuthProvider>
        <TodayPage
          setActiveTab={vi.fn()}
          onOpenCard={vi.fn()}
          onOpenAssistant={vi.fn()}
          onPreviewCert={vi.fn()}
        />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/ДУ-101, ДУ-102, ДУ-205, ДУ-301/i)).toBeInTheDocument();
    });
  });
});
