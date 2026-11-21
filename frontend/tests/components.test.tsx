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
import { normalizeScheduleType, localizeText } from '../src/utils/i18n';

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

function installApiFetchMock(persona: keyof typeof TEST_PROFILES | null) {
  const requestsStore: Array<Record<string, unknown>> = [];

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
      return json(TEST_PROFILES[persona]);
    }

    if (url.includes('/schedule')) {
      const todayIso = new Date().toISOString().slice(0, 10);
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
              type: 'text',
              required: true,
              placeholder: 'Например: Пенсионный фонд РФ',
            },
            {
              name: 'copies',
              label: 'Количество экземпляров',
              type: 'number',
              required: true,
              placeholder: '1',
            },
            {
              name: 'delivery',
              label: 'Форма получения',
              type: 'select',
              required: true,
              options: ['Электронный макет (PDF, демо)', 'Бумажная в деканате'],
            },
          ],
        },
      ]);
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

    if (url.includes('/notifications')) {
      return json({ items: [], unreadCount: 0 });
    }

    if (url.includes('/exams')) {
      return json([]);
    }

    if (url.includes('/staff/requests')) {
      return json({ items: [] });
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

  it('StudentCardModal renders Apple Wallet and Google Wallet export buttons and generates pass download', async () => {
    installApiFetchMock('aigul');
    render(
      <AuthProvider>
        <StudentCardModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTitle(/Добавить в Apple Wallet/i)).toBeInTheDocument();
    });
    expect(screen.getByTitle(/Сохранить в Google Wallet/i)).toBeInTheDocument();
  });
});
