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
import { TEST_USERS } from '../src/services/mockData';
import { normalizeScheduleType, localizeText } from '../src/utils/i18n';

vi.mock('qrcode', () => ({
  default: {
    toDataURL: (_payload: string, _opts: unknown, cb: (err: Error | null, url: string) => void) => {
      cb(null, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB');
    },
  },
}));

beforeEach(() => {
  // Force network fetch rejection so tests exercise Client Fallback Engine deterministically
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Offline in unit test')));
});

describe('Frontend Component & Accessibility Suite', () => {
  it('LoginPage renders institutional SSO form without Demo Switcher and enforces password visibility toggle', async () => {
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

    // Invalid credentials show error message
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
      screen.getByText(/Конкурсный концепт\. Не является официальным сервисом университета\. Все данные и имена вымышлены\./i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('SwitchLang'));

    expect(
      screen.getByText(/Competition concept, not an official university service\. Fictional data\./i)
    ).toBeInTheDocument();
  });

  it('BottomNav provides WCAG AA >= 48px touch targets and role-based tabs', async () => {
    localStorage.setItem('dean_current_user', JSON.stringify(TEST_USERS['dean.office@demo.edu'].user));
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

  it('StudentCardModal renders digital pass, expands QR code scanner, and simulates NFC turnstile pass', async () => {
    localStorage.setItem('dean_current_user', JSON.stringify(TEST_USERS['aigul.nurova@demo.edu'].user));
    render(
      <AuthProvider>
        <StudentCardModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/MIFARE DESFire EV3/i)).toBeInTheDocument();
    });

    // NFC turnstile simulation
    const nfcBtn = screen.getByRole('button', { name: /Приложить к турникету \(NFC Test\)/i });
    fireEvent.click(nfcBtn);
    await waitFor(
      () => {
        expect(screen.getByText(/Проход через турникет разрешен!/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Enlarge QR mode
    fireEvent.click(screen.getByTitle(/Нажмите, чтобы открыть QR-код на весь экран/i));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Назад/i })).toBeInTheDocument();
    });
  });

  it('GradesPage displays Timur failed Statistics debt banner and retake info', async () => {
    localStorage.setItem('dean_current_user', JSON.stringify(TEST_USERS['timur.belov@demo.edu'].user));
    render(
      <AuthProvider>
        <GradesPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Академическая задолженность: Статистика/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/28 ноября 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/А-314/i)).toBeInTheDocument();
  });

  it('RequestsPage displays empty state for Lina and allows creating a new certificate request', async () => {
    localStorage.setItem('dean_current_user', JSON.stringify(TEST_USERS['lina.okafor@demo.edu'].user));
    render(
      <AuthProvider>
        <RequestsPage onPreviewCert={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/У вас пока нет активных заявлений/i)).toBeInTheDocument();
    });

    // Open wizard and submit a study certificate request
    fireEvent.click(screen.getByRole('button', { name: /Подать новое заявление/i }));
    await waitFor(() => {
      expect(screen.getByText(/Отправить в деканат/i)).toBeInTheDocument();
    });

    const purposeInput = screen.getByPlaceholderText(/Например: Пенсионный фонд РФ/i);
    const copiesInput = screen.getByPlaceholderText('1');
    const deliverySelect = screen.getByRole('combobox');

    fireEvent.change(purposeInput, { target: { value: 'Для визового центра' } });
    fireEvent.change(copiesInput, { target: { value: '2' } });
    fireEvent.change(deliverySelect, { target: { value: 'Электронная с ЭЦП (PDF)' } });

    fireEvent.click(screen.getByRole('button', { name: /Отправить в деканат/i }));

    await waitFor(() => {
      expect(screen.getByText(/Журнал поданных заявлений \(1\)/i)).toBeInTheDocument();
    });
  });

  it('AuthProvider + Header switches RU <-> EN globally, persists dean_lang, and updates document.lang and ProfilePage', async () => {
    localStorage.setItem('dean_current_user', JSON.stringify(TEST_USERS['aigul.nurova@demo.edu'].user));

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
    localStorage.setItem('dean_current_user', JSON.stringify(TEST_USERS['timur.belov@demo.edu'].user));

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
    localStorage.setItem('dean_current_user', JSON.stringify(TEST_USERS['aigul.nurova@demo.edu'].user));

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

    // Wait for Monday classes (default day 1) to appear in RU mode
    await waitFor(() => {
      expect(screen.getByText('Дипломатический протокол')).toBeInTheDocument();
    });
    expect(screen.getByText('Международное публичное право')).toBeInTheDocument();

    // Filter Monday by Lectures
    fireEvent.click(screen.getByRole('button', { name: 'Лекции' }));
    expect(screen.getByText('Дипломатический протокол')).toBeInTheDocument();
    expect(screen.queryByText('Международное публичное право')).not.toBeInTheDocument();

    // Filter Monday by Labs -> empty state with reset action
    fireEvent.click(screen.getByRole('button', { name: 'Лабораторные' }));
    expect(screen.getByText(/Занятий выбранного формата нет/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Показать все форматы' }));
    expect(screen.getByText('Дипломатический протокол')).toBeInTheDocument();

    // Switch to Tuesday (has Lecture, Seminar, and Lab)
    fireEvent.click(screen.getByRole('button', { name: /Вторник/i }));
    await waitFor(() => {
      expect(screen.getByText('Макроэкономика')).toBeInTheDocument();
    });
    expect(screen.getByText('Политическая философия')).toBeInTheDocument();
    expect(screen.getByText('Физическая культура и спорт')).toBeInTheDocument();

    // Toggle UI language to EN while staying on SchedulePage
    fireEvent.click(screen.getByTitle('Switch to English'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Lectures' })).toBeInTheDocument();
    });
    expect(screen.getByText('Macroeconomics')).toBeInTheDocument();
    expect(screen.getByText('Political Philosophy')).toBeInTheDocument();
    expect(screen.getByText('Physical Education & Sports')).toBeInTheDocument();

    // Filter in EN mode: Seminars
    fireEvent.click(screen.getByRole('button', { name: 'Seminars' }));
    expect(screen.getByText('Political Philosophy')).toBeInTheDocument();
    expect(screen.queryByText('Macroeconomics')).not.toBeInTheDocument();
    expect(screen.queryByText('Physical Education & Sports')).not.toBeInTheDocument();

    // Filter in EN mode: Labs
    fireEvent.click(screen.getByRole('button', { name: 'Labs' }));
    expect(screen.getByText('Physical Education & Sports')).toBeInTheDocument();
    expect(screen.queryByText('Political Philosophy')).not.toBeInTheDocument();

    // Filter in EN mode: Lectures
    fireEvent.click(screen.getByRole('button', { name: 'Lectures' }));
    expect(screen.getByText('Macroeconomics')).toBeInTheDocument();
    expect(screen.queryByText('Physical Education & Sports')).not.toBeInTheDocument();

    // Reset to All Formats
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
});
