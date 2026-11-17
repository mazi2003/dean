import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Shield,
  Building,
  Mail,
  Phone,
  Clock,
  MapPin,
  Lock,
  LogOut,
  Award,
  ShieldCheck,
  GraduationCap,
  Calendar,
  FileCheck2,
  Megaphone,
  QrCode,
  KeyRound,
  CheckCircle2,
  FileBadge,
} from 'lucide-react';
import { UNIVERSITY_INFO } from '../services/mockData';
import { UniversityEmblem } from '../components/UniversityEmblem';

export const ProfilePage: React.FC = () => {
  const { user, profile, logout, lang } = useAuth();
  const isStaff = user?.role === 'staff';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. ACADEMIC DOSSIER HEADER
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative watermark */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-5 dark:opacity-10 pointer-events-none">
          <UniversityEmblem size={180} variant="full" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
          <div className="relative">
            <img
              src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160'}
              alt={user?.fullName}
              className="w-24 h-24 rounded-xl object-cover border-2 border-[#245A91]/70 shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#142D4E] border border-[#245A91] flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-[#245A91]" />
            </span>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-sans font-semibold bg-[#142D4E]/15 text-[#142D4E] dark:text-[#245A91] border border-[#142D4E]/30">
                {isStaff ? '🏛️ Сотрудник деканата' : `Группа ${profile?.group}`}
              </span>
              {isStaff ? (
                <span className="px-2.5 py-0.5 rounded text-xs font-sans font-semibold bg-[#245A91]/20 text-[#142D4E] dark:text-[#245A91] border border-[#245A91]/40">
                  Статус: Аккредитованный администратор
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded text-xs font-sans font-semibold bg-[#245A91]/20 text-[#142D4E] dark:text-[#245A91] border border-[#245A91]/40">
                  {profile?.year} курс • {profile?.studyForm || 'Бюджет'}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#0F1D30] dark:text-[#FFFFFF]">
              {user?.fullName}
            </h1>

            <p className="text-xs sm:text-sm text-[#475467] dark:text-[#CBD5E1] font-sans">
              {profile?.program} • {profile?.faculty}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs font-mono text-[#667085] dark:text-[#94A3B8]">
              <span>ID: {user?.id}</span>
              <span>•</span>
              <span>Email: {user?.email}</span>
              {!isStaff && (
                <>
                  <span>•</span>
                  <span>Студбилет: {profile?.studentNumber}</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] hover:bg-[#C63740]/10 hover:text-[#C63740] border border-[#DCE2EA] dark:border-[#1E395B] text-xs font-sans font-medium transition-colors flex items-center space-x-1.5 self-center sm:self-start cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Выйти из кабинета</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. DOSSIER DETAILS GRID
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Enrollment Info */}
        <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-sm text-[#0F1D30] dark:text-[#FFFFFF] pb-2 border-b border-[#DCE2EA] dark:border-[#193150] flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-[#142D4E] dark:text-[#245A91]" />
            <span>
              {isStaff ? 'Служебные реквизиты сотрудника' : 'Учебные реквизиты студента'}
            </span>
          </h3>

          <div className="space-y-2.5 text-xs font-sans">
            <div className="flex justify-between py-1 border-b border-[#DCE2EA]/50 dark:border-[#193150]">
              <span className="text-[#667085]">Учебное заведение:</span>
              <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF]">{UNIVERSITY_INFO.nameEn}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#DCE2EA]/50 dark:border-[#193150]">
              <span className="text-[#667085]">Факультет:</span>
              <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF]">{profile?.faculty}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#DCE2EA]/50 dark:border-[#193150]">
              <span className="text-[#667085]">Направление:</span>
              <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF]">{profile?.program}</span>
            </div>
            {!isStaff ? (
              <>
                <div className="flex justify-between py-1 border-b border-[#DCE2EA]/50 dark:border-[#193150]">
                  <span className="text-[#667085]">Академическая группа:</span>
                  <span className="font-mono font-bold text-[#142D4E] dark:text-[#245A91]">{profile?.group}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCE2EA]/50 dark:border-[#193150]">
                  <span className="text-[#667085]">Форма обучения:</span>
                  <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF]">{profile?.studyForm || 'Очная'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#667085]">Номер студенческого билета:</span>
                  <span className="font-mono font-bold text-[#142D4E] dark:text-[#245A91]">{profile?.studentNumber}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between py-1 border-b border-[#DCE2EA]/50 dark:border-[#193150]">
                  <span className="text-[#667085]">Табельный номер:</span>
                  <span className="font-mono font-bold text-[#142D4E] dark:text-[#245A91]">ТАБ-0441</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#DCE2EA]/50 dark:border-[#193150]">
                  <span className="text-[#667085]">Должность:</span>
                  <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF]">Зам. декана по УМР</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#667085]">Кабинет и часы приема:</span>
                  <span className="font-medium text-[#0F1D30] dark:text-[#FFFFFF]">Каб. 312 • Пн-Пт 9-18</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Digital Identity & Security Certificate (GOST R 34.10) */}
        <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#112238] border border-[#DCE2EA] dark:border-[#1E395B] shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-sm text-[#0F1D30] dark:text-[#FFFFFF] pb-2 border-b border-[#DCE2EA] dark:border-[#193150] flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#142D4E] dark:text-[#245A91]" />
            <span>Цифровой сертификат и безопасность</span>
          </h3>

          <div className="space-y-3 text-xs font-sans">
            <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#667085] block">Стандарт криптографической подписи</span>
              <span className="font-mono font-semibold text-[#142D4E] dark:text-[#245A91]">
                ГОСТ Р 34.10-2012 / 34.11-2012
              </span>
              <p className="text-[11px] text-[#475467] dark:text-[#CBD5E1]">
                Усиленная квалифицированная ЭЦП деканата для справок и приказов.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#667085] block">Удостоверяющий центр</span>
              <span className="font-semibold text-[#0F1D30] dark:text-[#FFFFFF]">
                УЦ «DemoTech Root Certification Authority»
              </span>
              <p className="text-[11px] text-[#667085] font-mono">
                Серийный номер: 77AA-9402-E12F-2026-REG
              </p>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-[#142D4E] dark:text-[#245A91]">
              <Lock className="w-3.5 h-3.5" />
              <span>Сессионная изоляция персональных данных активна</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. REGULATORY COMPLIANCE MEMORANDUM
          ───────────────────────────────────────────────────────────── */}
      <div className="p-5 rounded-xl bg-[#F8FAFC] dark:bg-[#15201A] border border-[#DCE2EA] dark:border-[#1E395B] text-xs font-sans text-[#667085] dark:text-[#94A3B8] space-y-2">
        <h4 className="font-serif font-bold text-sm text-[#0F1D30] dark:text-[#FFFFFF]">
          Регламент обработки персональных данных и статус концепта
        </h4>
        <p className="leading-relaxed">
          Настоящий веб-сервис «Цифровой деканат DemoTech University» является конкурсным концептом студенческого портала. Все представленные персональные данные, номера приказов, зачетные книжки и оценки являются учебными и вымышленными. Система не хранит конфиденциальные данные реальных физических лиц.
        </p>
      </div>
    </div>
  );
};
