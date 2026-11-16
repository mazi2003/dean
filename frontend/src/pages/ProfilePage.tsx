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
} from 'lucide-react';
import { UNIVERSITY_INFO } from '../services/mockData';

export const ProfilePage: React.FC = () => {
  const { user, profile, logout, lang } = useAuth();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Profile Card Header */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
          <img
            src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160'}
            alt=""
            className="w-24 h-24 rounded-2xl object-cover ring-4 ring-blue-500/30 shadow-md"
          />

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                {user?.role === 'staff' ? 'Сотрудник деканата' : `Группа ${profile?.group}`}
              </span>
              {user?.role === 'student' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                  {profile?.studyForm || 'Бюджет'}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {user?.fullName}
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {profile?.program}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500">
              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                Студбилет: {profile?.studentNumber}
              </span>
              <span>Email: {user?.email}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-800 transition-colors flex items-center space-x-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти</span>
          </button>
        </div>
      </div>

      {/* Academic Details (if student) */}
      {user?.role === 'student' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
            <Award className="w-4 h-4 text-blue-600" />
            <span>Учебная карточка студента</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <span className="text-slate-400">Факультет:</span>
              <p className="font-semibold text-slate-900 dark:text-white">{profile?.faculty}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <span className="text-slate-400">Направление подготовки:</span>
              <p className="font-semibold text-slate-900 dark:text-white">{profile?.program}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <span className="text-slate-400">Курс и группа:</span>
              <p className="font-semibold text-slate-900 dark:text-white">{profile?.year} курс, группа {profile?.group}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
              <span className="text-slate-400">Форма финансирования:</span>
              <p className="font-semibold text-slate-900 dark:text-white">{profile?.studyForm || 'Бюджетная основа'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Security & Data Protection Guarantee */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Безопасность и защита персональных данных</span>
        </h3>

        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start space-x-2.5">
            <Lock className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Строгая изоляция сессий:</strong> Каждый студент имеет доступ исключительно к своим оценкам, расписанию и заказанным справкам. Прямые обращения к чужим идентификаторам блокируются на уровне сервера.
            </p>
          </div>
          <div className="flex items-start space-x-2.5">
            <Lock className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Криптографическая защита:</strong> Пароли хешируются с использованием алгоритма Argon2id. Аутентификация осуществляется через безопасные httpOnly-куки с флагами SameSite=Lax.
            </p>
          </div>
          <div className="flex items-start space-x-2.5">
            <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Вымышленные данные:</strong> Прототип использует исключительно демонстрационные данные. Никакие реальные персональные данные не хранятся и не обрабатываются.
            </p>
          </div>
        </div>
      </div>

      {/* Dean's Office Contact Directory */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
          <Building className="w-4 h-4 text-blue-600" />
          <span>Контакты и график работы деканата</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Часы приема:</p>
              <p className="text-slate-500">{UNIVERSITY_INFO.deanOfficeHours}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Кабинет деканата:</p>
              <p className="text-slate-500">{UNIVERSITY_INFO.deanOfficeLocation}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Электронная почта:</p>
              <p className="text-slate-500">{UNIVERSITY_INFO.deanOfficeEmail}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Телефон деканата:</p>
              <p className="text-slate-500">{UNIVERSITY_INFO.deanOfficePhone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
