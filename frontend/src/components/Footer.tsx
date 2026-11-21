import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Info, Building, Mail, Phone, MapPin } from 'lucide-react';
import { UNIVERSITY_INFO } from '../constants/university';
import { UniversityEmblem } from './UniversityEmblem';

export const Footer: React.FC = () => {
  const { lang } = useAuth();

  return (
    <footer className="mt-auto border-t border-[#DCE2EA] dark:border-[#193150] bg-[#F8FAFC] dark:bg-[#0E1B2D] text-[#667085] dark:text-[#94A3B8] transition-colors select-none">
      {/* ─────────────────────────────────────────────────────────────
          COMPREHENSIVE MULTI-COLUMN INSTITUTIONAL FOOTER (Oxford & ETH)
          ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Column 1: University Heraldry & Charter */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#0E1F36] border border-[#245A91]/60 flex items-center justify-center p-1 shadow-xs">
                <UniversityEmblem size={30} variant="full" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#0F1D30] dark:text-[#FFFFFF] tracking-tight uppercase leading-none">
                  DemoTech
                </h4>
                <p className="text-[10px] text-[#142D4E] dark:text-[#93C5FD] font-sans uppercase tracking-widest mt-1">
                  University
                </p>
              </div>
            </div>

            <p className="text-xs italic text-[#475467] dark:text-[#CBD5E1] leading-relaxed">
              {lang === 'ru'
                ? '«Veritas • Scientia • Innovatio» — Международный научно-технологический университет, основанный в 2026 году.'
                : '"Veritas • Scientia • Innovatio" — International Institute of Science & Technology, founded in 2026.'}
            </p>

            <div className="pt-1 text-[11px] font-sans space-y-1.5 text-[#475467] dark:text-[#CBD5E1]">
              <div className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#245A91] flex-shrink-0" />
                <span>
                  {lang === 'ru'
                    ? 'Главный кампус • Академический проспект, 1'
                    : 'Main Campus • 1 Academic Avenue'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Building className="w-3.5 h-3.5 text-[#245A91] flex-shrink-0" />
                <span>
                  {lang === 'ru'
                    ? 'Деканат: Главный корпус, 3 этаж, каб. 312'
                    : "Dean's Office: Main Building, 3rd Floor, Rm 312"}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Academic Faculties & Schools */}
          <div className="space-y-3">
            <h5 className="font-semibold text-xs uppercase tracking-widest text-[#142D4E] dark:text-[#93C5FD] border-b border-[#DCE2EA] dark:border-[#193150] pb-2">
              {lang === 'ru' ? 'Факультеты и институты' : 'Faculties & Schools'}
            </h5>
            <ul className="text-xs space-y-2 font-sans">
              <li className="hover:text-[#142D4E] dark:hover:text-[#FFFFFF] transition-colors cursor-pointer">
                {lang === 'ru'
                  ? 'Факультет международных отношений'
                  : 'School of International Relations'}
              </li>
              <li className="hover:text-[#142D4E] dark:hover:text-[#FFFFFF] transition-colors cursor-pointer">
                {lang === 'ru'
                  ? 'Институт компьютерных наук и ИИ'
                  : 'Institute of Computer Science & AI'}
              </li>
              <li className="hover:text-[#142D4E] dark:hover:text-[#FFFFFF] transition-colors cursor-pointer">
                {lang === 'ru'
                  ? 'Школа мировой экономики и финансов'
                  : 'School of World Economy & Finance'}
              </li>
              <li className="hover:text-[#142D4E] dark:hover:text-[#FFFFFF] transition-colors cursor-pointer">
                {lang === 'ru'
                  ? 'Академический совет и аспирантура'
                  : 'Academic Senate & Graduate School'}
              </li>
            </ul>
          </div>

          {/* Column 3: Student & Registrar Services */}
          <div className="space-y-3">
            <h5 className="font-semibold text-xs uppercase tracking-widest text-[#142D4E] dark:text-[#93C5FD] border-b border-[#DCE2EA] dark:border-[#193150] pb-2">
              {lang === 'ru' ? 'Службы деканата' : 'Student & Registrar Services'}
            </h5>
            <ul className="text-xs space-y-2 font-sans">
              <li className="hover:text-[#142D4E] dark:hover:text-[#FFFFFF] transition-colors cursor-pointer">
                {lang === 'ru'
                  ? 'Электронные справки (демо-макет)'
                  : 'Digital Certificates (Demo Preview)'}
              </li>
              <li className="hover:text-[#142D4E] dark:hover:text-[#FFFFFF] transition-colors cursor-pointer">
                {lang === 'ru' ? 'Академические ведомости и БРС' : 'Academic Records & Rating'}
              </li>
              <li className="hover:text-[#142D4E] dark:hover:text-[#FFFFFF] transition-colors cursor-pointer">
                {lang === 'ru' ? 'Стипендиальный комитет (ПГАС)' : 'Merit Scholarship Committee'}
              </li>
              <li className="hover:text-[#142D4E] dark:hover:text-[#FFFFFF] transition-colors cursor-pointer">
                {lang === 'ru'
                  ? 'Центр академической мобильности (ECTS)'
                  : 'Academic Mobility Office (ECTS)'}
              </li>
            </ul>
          </div>

          {/* Column 4: Institutional Contacts & Registry Hours */}
          <div className="space-y-3">
            <h5 className="font-semibold text-xs uppercase tracking-widest text-[#142D4E] dark:text-[#93C5FD] border-b border-[#DCE2EA] dark:border-[#193150] pb-2">
              {lang === 'ru' ? 'Контакты канцелярии' : 'Registry & Office Hours'}
            </h5>
            <div className="text-xs font-sans space-y-2">
              <p className="text-[#475467] dark:text-[#CBD5E1]">
                {lang === 'ru' ? 'Часы работы:' : 'Hours:'}{' '}
                <strong>{lang === 'ru' ? 'Пн-Пт 09:00 - 18:00' : 'Mon–Fri 09:00–18:00'}</strong>
              </p>
              <div className="flex items-center space-x-2 text-[#475467] dark:text-[#CBD5E1]">
                <Mail className="w-3.5 h-3.5 text-[#245A91]" />
                <span className="font-mono text-[11px]">{UNIVERSITY_INFO.deanOfficeEmail}</span>
              </div>
              <div className="flex items-center space-x-2 text-[#475467] dark:text-[#CBD5E1]">
                <Phone className="w-3.5 h-3.5 text-[#245A91]" />
                <span className="font-mono text-[11px]">+7 (495) 000-00-00</span>
              </div>
              <div className="pt-2 flex items-center space-x-2 text-[11px] text-[#142D4E] dark:text-[#93C5FD] font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#245A91]" />
                <span>
                  {lang === 'ru'
                    ? 'Иллюстративный макет ЭЦП (демо)'
                    : 'Illustrative Digital Seal (Demo)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            MANDATORY COMPETITION DISCLAIMER & DATA SECURITY BANNER
            ───────────────────────────────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-[#DCE2EA] dark:border-[#193150] flex flex-col items-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#FFFFFF] dark:bg-[#162A45] text-[#475467] dark:text-[#CBD5E1] border border-[#DCE2EA] dark:border-[#1E395B] text-[11px] font-sans shadow-xs">
            <Info className="w-3.5 h-3.5 text-[#245A91] flex-shrink-0" />
            <span className="text-center font-medium">
              {lang === 'ru'
                ? 'Конкурсный концепт. Не является официальным сервисом университета. Все данные и имена вымышлены.'
                : 'Competition concept, not an official university service. Fictional data.'}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-sans text-[#667085] dark:text-[#94A3B8]">
            <span>© MMXXVI DemoTech University</span>
            <span>•</span>
            <span>All rights reserved</span>
            <span>•</span>
            <span className="flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#142D4E] dark:text-[#60A5FA]" />
              {lang === 'ru'
                ? 'Изоляция персональных данных: сессионный контроль'
                : 'Student data isolation verified'}
            </span>
            <span>•</span>
            <span className="font-mono">Veritas • Scientia • Innovatio</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
