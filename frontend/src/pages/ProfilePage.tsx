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
      <div className="rounded-xl bg-white dark:bg-[#18221D] border border-[#E3DDD1] dark:border-[#2D3E35] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative watermark */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-5 dark:opacity-10 pointer-events-none">
          <UniversityEmblem size={180} variant="full" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
          <div className="relative">
            <img
              src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160'}
              alt={user?.fullName}
              className="w-24 h-24 rounded-xl object-cover border-2 border-[#C4A46B]/70 shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#183D35] border border-[#C4A46B] flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C4A46B]" />
            </span>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-sans font-semibold bg-[#183D35]/15 text-[#183D35] dark:text-[#C4A46B] border border-[#183D35]/30">
                {isStaff ? '🏛️ Сотрудник деканата' : `Группа ${profile?.group}`}
              </span>
              {isStaff ? (
                <span className="px-2.5 py-0.5 rounded text-xs font-sans font-semibold bg-[#C4A46B]/20 text-[#183D35] dark:text-[#C4A46B] border border-[#C4A46B]/40">
                  Статус: Аккредитованный администратор
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded text-xs font-sans font-semibold bg-[#C4A46B]/20 text-[#183D35] dark:text-[#C4A46B] border border-[#C4A46B]/40">
                  {profile?.year} курс • {profile?.studyForm || 'Бюджет'}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#252923] dark:text-[#F3EFE5]">
              {user?.fullName}
            </h1>

            <p className="text-xs sm:text-sm text-[#575F53] dark:text-[#C8D1CA] font-sans">
              {profile?.program} • {profile?.faculty}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs font-mono text-[#7E877B] dark:text-[#8E9B93]">
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
            className="px-4 py-2 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] hover:bg-[#A33D35]/10 hover:text-[#A33D35] border border-[#E3DDD1] dark:border-[#2D3E35] text-xs font-sans font-medium transition-colors flex items-center space-x-1.5 self-center sm:self-start cursor-pointer"
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
        <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#18221D] border border-[#E3DDD1] dark:border-[#2D3E35] shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-sm text-[#252923] dark:text-[#F3EFE5] pb-2 border-b border-[#E3DDD1] dark:border-[#26362F] flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-[#183D35] dark:text-[#C4A46B]" />
            <span>
              {isStaff ? 'Служебные реквизиты сотрудника' : 'Учебные реквизиты студента'}
            </span>
          </h3>

          <div className="space-y-2.5 text-xs font-sans">
            <div className="flex justify-between py-1 border-b border-[#E3DDD1]/50 dark:border-[#26362F]">
              <span className="text-[#7E877B]">Учебное заведение:</span>
              <span className="font-medium text-[#252923] dark:text-[#F3EFE5]">{UNIVERSITY_INFO.nameEn}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E3DDD1]/50 dark:border-[#26362F]">
              <span className="text-[#7E877B]">Факультет:</span>
              <span className="font-medium text-[#252923] dark:text-[#F3EFE5]">{profile?.faculty}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E3DDD1]/50 dark:border-[#26362F]">
              <span className="text-[#7E877B]">Направление:</span>
              <span className="font-medium text-[#252923] dark:text-[#F3EFE5]">{profile?.program}</span>
            </div>
            {!isStaff ? (
              <>
                <div className="flex justify-between py-1 border-b border-[#E3DDD1]/50 dark:border-[#26362F]">
                  <span className="text-[#7E877B]">Академическая группа:</span>
                  <span className="font-mono font-bold text-[#183D35] dark:text-[#C4A46B]">{profile?.group}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E3DDD1]/50 dark:border-[#26362F]">
                  <span className="text-[#7E877B]">Форма обучения:</span>
                  <span className="font-medium text-[#252923] dark:text-[#F3EFE5]">{profile?.studyForm || 'Очная'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#7E877B]">Номер студенческого билета:</span>
                  <span className="font-mono font-bold text-[#183D35] dark:text-[#C4A46B]">{profile?.studentNumber}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between py-1 border-b border-[#E3DDD1]/50 dark:border-[#26362F]">
                  <span className="text-[#7E877B]">Табельный номер:</span>
                  <span className="font-mono font-bold text-[#183D35] dark:text-[#C4A46B]">ТАБ-0441</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E3DDD1]/50 dark:border-[#26362F]">
                  <span className="text-[#7E877B]">Должность:</span>
                  <span className="font-medium text-[#252923] dark:text-[#F3EFE5]">Зам. декана по УМР</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#7E877B]">Кабинет и часы приема:</span>
                  <span className="font-medium text-[#252923] dark:text-[#F3EFE5]">Каб. 312 • Пн-Пт 9-18</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Digital Identity & Security Certificate (GOST R 34.10) */}
        <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#18221D] border border-[#E3DDD1] dark:border-[#2D3E35] shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-sm text-[#252923] dark:text-[#F3EFE5] pb-2 border-b border-[#E3DDD1] dark:border-[#26362F] flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#183D35] dark:text-[#C4A46B]" />
            <span>Цифровой сертификат и безопасность</span>
          </h3>

          <div className="space-y-3 text-xs font-sans">
            <div className="p-3 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#7E877B] block">Стандарт криптографической подписи</span>
              <span className="font-mono font-semibold text-[#183D35] dark:text-[#C4A46B]">
                ГОСТ Р 34.10-2012 / 34.11-2012
              </span>
              <p className="text-[11px] text-[#575F53] dark:text-[#C8D1CA]">
                Усиленная квалифицированная ЭЦП деканата для справок и приказов.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#7E877B] block">Удостоверяющий центр</span>
              <span className="font-semibold text-[#252923] dark:text-[#F3EFE5]">
                УЦ «DemoTech Root Certification Authority»
              </span>
              <p className="text-[11px] text-[#7E877B] font-mono">
                Серийный номер: 77AA-9402-E12F-2026-REG
              </p>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-[#183D35] dark:text-[#C4A46B]">
              <Lock className="w-3.5 h-3.5" />
              <span>Сессионная изоляция персональных данных активна</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. REGULATORY COMPLIANCE MEMORANDUM
          ───────────────────────────────────────────────────────────── */}
      <div className="p-5 rounded-xl bg-[#FAF8F3] dark:bg-[#15201A] border border-[#E3DDD1] dark:border-[#2D3E35] text-xs font-sans text-[#7E877B] dark:text-[#8E9B93] space-y-2">
        <h4 className="font-serif font-bold text-sm text-[#252923] dark:text-[#F3EFE5]">
          Регламент обработки персональных данных и статус концепта
        </h4>
        <p className="leading-relaxed">
          Настоящий веб-сервис «Цифровой деканат DemoTech University» является конкурсным концептом студенческого портала. Все представленные персональные данные, номера приказов, зачетные книжки и оценки являются учебными и вымышленными. Система не хранит конфиденциальные данные реальных физических лиц.
        </p>
      </div>
    </div>
  );
};
