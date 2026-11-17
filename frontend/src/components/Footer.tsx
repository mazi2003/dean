import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Info, Building, Mail, Phone, MapPin, Globe, ExternalLink, Compass } from 'lucide-react';
import { UNIVERSITY_INFO } from '../services/mockData';
import { UniversityEmblem } from './UniversityEmblem';

export const Footer: React.FC = () => {
  const { lang } = useAuth();

  return (
    <footer className="mt-auto border-t border-[#E3DDD1] dark:border-[#26362F] bg-[#FAF8F3] dark:bg-[#121715] text-[#7E877B] dark:text-[#8E9B93] transition-colors select-none">
      {/* ─────────────────────────────────────────────────────────────
          COMPREHENSIVE MULTI-COLUMN INSTITUTIONAL FOOTER (Oxford & ETH)
          ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Column 1: University Heraldry & Charter */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#102923] border border-[#C4A46B]/60 flex items-center justify-center p-1 shadow-xs">
                <UniversityEmblem size={30} variant="full" />
              </div>
              <div>
                <h4
                  className="font-bold text-sm text-[#252923] dark:text-[#F3EFE5] tracking-wider uppercase leading-none"
                  style={{ fontFamily: "'Cinzel', 'Crimson Pro', Georgia, serif" }}
                >
                  DemoTech
                </h4>
                <p className="text-[10px] text-[#C4A46B] font-sans uppercase tracking-widest mt-1">
                  University
                </p>
              </div>
            </div>

            <p className="text-xs font-serif italic text-[#575F53] dark:text-[#C8D1CA] leading-relaxed">
              «Veritas • Scientia • Innovatio» — Международный научно-технологический университет, основанный в 2026 году.
            </p>

            <div className="pt-1 text-[11px] font-sans space-y-1.5 text-[#575F53] dark:text-[#C8D1CA]">
              <div className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#C4A46B] flex-shrink-0" />
                <span>Главный кампус • Академический проспект, 1</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building className="w-3.5 h-3.5 text-[#C4A46B] flex-shrink-0" />
                <span>Деканат: Главный корпус, 3 этаж, каб. 312</span>
              </div>
            </div>
          </div>

          {/* Column 2: Academic Faculties & Schools */}
          <div className="space-y-3">
            <h5 className="font-serif font-bold text-xs uppercase tracking-widest text-[#183D35] dark:text-[#C4A46B] border-b border-[#E3DDD1] dark:border-[#26362F] pb-2">
              {lang === 'ru' ? 'Факультеты и институты' : 'Faculties & Schools'}
            </h5>
            <ul className="text-xs space-y-2 font-sans">
              <li className="hover:text-[#183D35] dark:hover:text-[#F3EFE5] transition-colors cursor-pointer">
                Факультет международных отношений
              </li>
              <li className="hover:text-[#183D35] dark:hover:text-[#F3EFE5] transition-colors cursor-pointer">
                Институт компьютерных наук и ИИ
              </li>
              <li className="hover:text-[#183D35] dark:hover:text-[#F3EFE5] transition-colors cursor-pointer">
                Школа мировой экономики и финансов
              </li>
              <li className="hover:text-[#183D35] dark:hover:text-[#F3EFE5] transition-colors cursor-pointer">
                Академический совет и аспирантура
              </li>
            </ul>
          </div>

          {/* Column 3: Student & Registrar Services */}
          <div className="space-y-3">
            <h5 className="font-serif font-bold text-xs uppercase tracking-widest text-[#183D35] dark:text-[#C4A46B] border-b border-[#E3DDD1] dark:border-[#26362F] pb-2">
              {lang === 'ru' ? 'Службы деканата' : 'Student & Registrar Services'}
            </h5>
            <ul className="text-xs space-y-2 font-sans">
              <li className="hover:text-[#183D35] dark:hover:text-[#F3EFE5] transition-colors cursor-pointer">
                Выдача справок об обучении с ЭЦП
              </li>
              <li className="hover:text-[#183D35] dark:hover:text-[#F3EFE5] transition-colors cursor-pointer">
                Академические ведомости и БРС
              </li>
              <li className="hover:text-[#183D35] dark:hover:text-[#F3EFE5] transition-colors cursor-pointer">
                Стипендиальный комитет (ПГАС)
              </li>
              <li className="hover:text-[#183D35] dark:hover:text-[#F3EFE5] transition-colors cursor-pointer">
                Центр академической мобильности (ECTS)
              </li>
            </ul>
          </div>

          {/* Column 4: Institutional Contacts & Registry Hours */}
          <div className="space-y-3">
            <h5 className="font-serif font-bold text-xs uppercase tracking-widest text-[#183D35] dark:text-[#C4A46B] border-b border-[#E3DDD1] dark:border-[#26362F] pb-2">
              {lang === 'ru' ? 'Контакты канцелярии' : 'Registry & Office Hours'}
            </h5>
            <div className="text-xs font-sans space-y-2">
              <p className="text-[#575F53] dark:text-[#C8D1CA]">
                Часы работы: <strong>Пн-Пт 09:00 - 18:00</strong>
              </p>
              <div className="flex items-center space-x-2 text-[#575F53] dark:text-[#C8D1CA]">
                <Mail className="w-3.5 h-3.5 text-[#C4A46B]" />
                <span className="font-mono text-[11px]">{UNIVERSITY_INFO.deanOfficeEmail}</span>
              </div>
              <div className="flex items-center space-x-2 text-[#575F53] dark:text-[#C8D1CA]">
                <Phone className="w-3.5 h-3.5 text-[#C4A46B]" />
                <span className="font-mono text-[11px]">+7 (495) 000-00-00</span>
              </div>
              <div className="pt-2 flex items-center space-x-2 text-[11px] text-[#183D35] dark:text-[#C4A46B] font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#C4A46B]" />
                <span>ЭЦП ГОСТ Р 34.10-2012</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            MANDATORY COMPETITION DISCLAIMER & DATA SECURITY BANNER
            ───────────────────────────────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-[#E3DDD1] dark:border-[#26362F] flex flex-col items-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#F3EFE5] dark:bg-[#1A2520] text-[#575F53] dark:text-[#C8D1CA] border border-[#E3DDD1] dark:border-[#2D3E35] text-[11px] font-sans shadow-xs">
            <Info className="w-3.5 h-3.5 text-[#C4A46B] flex-shrink-0" />
            <span className="text-center font-medium">
              {lang === 'ru'
                ? 'Конкурсный концепт. Не является официальным сервисом университета. Все данные и имена вымышлены.'
                : 'Competition concept, not an official university service. Fictional data.'}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-sans text-[#7E877B] dark:text-[#8E9B93]">
            <span>© MMXXVI DemoTech University</span>
            <span>•</span>
            <span>All rights reserved</span>
            <span>•</span>
            <span className="flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#183D35] dark:text-[#C4A46B]" />
              {lang === 'ru' ? 'Изоляция персональных данных: сессионный контроль' : 'Student data isolation verified'}
            </span>
            <span>•</span>
            <span className="font-mono">Veritas • Scientia • Innovatio</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
