import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Info, Building, Mail, Phone, MapPin } from 'lucide-react';
import { UNIVERSITY_INFO } from '../constants/university';
import { UniversityEmblem } from './UniversityEmblem';

export const Footer: React.FC = () => {
  const { lang } = useAuth();

  return (
    <footer className="mt-auto border-t border-[#e2e4e8] dark:border-[#273142] bg-white dark:bg-[#121620] text-[#475569] dark:text-[#94a3b8] transition-colors select-none">
      {/* ─────────────────────────────────────────────────────────────
          MULTI-COLUMN INSTITUTIONAL FOOTER (Modern Campus Design System)
          ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Column 1: University Heraldry & Charter */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#161821] dark:bg-[#11141c] border border-[#33b712]/40 flex items-center justify-center p-1 shadow-xs">
                <UniversityEmblem size={30} variant="full" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-[#161821] dark:text-[#ffffff] tracking-tight uppercase leading-none">
                  DemoTech
                </h4>
                <p className="text-[10px] text-[#166534] dark:text-[#45d320] font-heading font-semibold uppercase tracking-wider mt-1">
                  University
                </p>
              </div>
            </div>

            <p className="text-xs italic text-[#4b5563] dark:text-[#cbd5e1] leading-relaxed">
              {lang === 'ru'
                ? '«Veritas • Scientia • Innovatio» — Международный научно-технологический университет «ДемоТех», основанный в 2026 году.'
                : '"Veritas • Scientia • Innovatio" — DemoTech International University of Science & Technology, founded in 2026.'}
            </p>

            <div className="pt-1 text-[11px] font-sans space-y-1.5 text-[#4b5563] dark:text-[#cbd5e1]">
              <div className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320] flex-shrink-0" />
                <span>
                  {lang === 'ru'
                    ? 'Главный кампус • Университетский проспект, 1'
                    : 'Main Campus • 1 University Avenue'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Building className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320] flex-shrink-0" />
                <span>{UNIVERSITY_INFO.deanOfficeLocation}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Academic Program & Faculty */}
          <div className="space-y-3">
            <h5 className="font-heading font-semibold text-xs uppercase tracking-wider text-[#161821] dark:text-[#ffffff]">
              {lang === 'ru' ? 'Академические программы' : 'Academic Faculties'}
            </h5>
            <ul className="text-xs space-y-2 text-[#4b5563] dark:text-[#cbd5e1]">
              <li>
                <span className="font-medium text-[#161821] dark:text-[#ffffff]">
                  {lang === 'ru' ? 'Факультет МО' : 'School of IR'}
                </span>
                <span className="block text-[11px] text-[#475569] dark:text-[#94a3b8]">
                  {lang === 'ru'
                    ? 'Международные отношения • Бакалавриат'
                    : 'International Relations • B.A.'}
                </span>
              </li>
              <li>
                <span className="font-medium text-[#161821] dark:text-[#ffffff]">
                  {lang === 'ru' ? 'Кафедра мировой экономики' : 'World Economics Department'}
                </span>
                <span className="block text-[11px] text-[#475569] dark:text-[#94a3b8]">
                  {lang === 'ru' ? 'Мировая экономика • Бакалавриат' : 'Global Economics • B.Sc.'}
                </span>
              </li>
              <li>
                <span className="font-medium text-[#161821] dark:text-[#ffffff]">
                  {lang === 'ru' ? 'Цифровой деканат' : 'Digital Registrar'}
                </span>
                <span className="block text-[11px] text-[#475569] dark:text-[#94a3b8]">
                  {lang === 'ru'
                    ? 'Автоматизация документооборота и справок'
                    : 'Automated Academic Workflows'}
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Dean's Office Contacts */}
          <div className="space-y-3">
            <h5 className="font-heading font-semibold text-xs uppercase tracking-wider text-[#161821] dark:text-[#ffffff]">
              {lang === 'ru' ? 'Контакты деканата' : "Dean's Office Contacts"}
            </h5>
            <div className="text-xs space-y-2 text-[#4b5563] dark:text-[#cbd5e1]">
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320] flex-shrink-0" />
                <a
                  href={`mailto:${UNIVERSITY_INFO.deanOfficeEmail}`}
                  className="hover:underline font-sans"
                >
                  {UNIVERSITY_INFO.deanOfficeEmail}
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-[#166534] dark:text-[#45d320] flex-shrink-0" />
                <span className="font-sans">{UNIVERSITY_INFO.deanOfficePhone}</span>
              </div>
              <p className="text-[11px] text-[#475569] dark:text-[#94a3b8] pt-1 leading-relaxed">
                {UNIVERSITY_INFO.deanOfficeHours}
              </p>
            </div>
          </div>

          {/* Column 4: Quality & Legal Disclaimer */}
          <div className="space-y-3">
            <h5 className="font-heading font-semibold text-xs uppercase tracking-wider text-[#161821] dark:text-[#ffffff]">
              {lang === 'ru' ? 'Статус платформы' : 'Platform Status'}
            </h5>
            <div className="p-3.5 rounded-2xl bg-[#f6f6f9] dark:bg-[#171c26] border border-[#e2e4e8] dark:border-[#273142] text-[11px] space-y-2">
              <div className="flex items-center space-x-2 text-[#166534] dark:text-[#45d320] font-heading font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#166534] dark:text-[#45d320]" />
                <span>{lang === 'ru' ? 'Защищенный доступ' : 'Secure Access'}</span>
              </div>
              <p className="text-[#4b5563] dark:text-[#cbd5e1] leading-relaxed">
                {lang === 'ru'
                  ? 'Единая защищенная сессия и персональная изоляция данных.'
                  : 'Encrypted institutional session and personal data protection.'}
              </p>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            MANDATORY COMPETITION DISCLAIMER (Legal Requirement)
            ───────────────────────────────────────────────────────────── */}
        <div className="mt-8 pt-6 border-t border-[#e2e4e8] dark:border-[#273142] flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-xs">
          <div className="flex items-center space-x-2 text-[#475569] dark:text-[#94a3b8]">
            <Info className="w-4 h-4 text-[#166534] dark:text-[#45d320] flex-shrink-0" />
            <p className="font-sans">
              {lang === 'ru' ? UNIVERSITY_INFO.disclaimer : UNIVERSITY_INFO.disclaimerEn}
            </p>
          </div>

          <div className="text-[11px] text-[#475569] dark:text-[#94a3b8] font-sans">
            DemoTech University © 2026 • Digital Dean&apos;s Office
          </div>
        </div>
      </div>
    </footer>
  );
};
