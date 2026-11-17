import React, { useMemo } from 'react';
import { X, Printer, Download, ShieldCheck } from 'lucide-react';
import { StudentRequest } from '../types';
import { UNIVERSITY_INFO } from '../services/mockData';
import { UniversityEmblem } from './UniversityEmblem';
import { useAuth } from '../context/AuthContext';
import { tr, localizeText } from '../utils/i18n';

interface CertificatePreviewModalProps {
  request: StudentRequest | null;
  onClose: () => void;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({ request, onClose }) => {
  const { lang } = useAuth();
  const issuedDate = useMemo(
    () => new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US'),
    [lang],
  );
  if (!request) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#112238] rounded-xl shadow-2xl overflow-hidden border border-[#DCE2EA] dark:border-[#1E395B] flex flex-col my-auto">
        {/* Top Control Bar */}
        <div className="px-5 py-3.5 bg-[#142D4E] text-[#FFFFFF] border-b border-[#60A5FA]/30 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#93C5FD]" />
            <span className="font-semibold text-sm text-[#FFFFFF]">
              {tr(
                lang,
                'Электронный документ с усиленной квалифицированной ЭЦП',
                'Electronic Document with Qualified Digital Signature (EDS)',
              )}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-md bg-[#0E1F36] hover:bg-[#1C3B65] border border-[#60A5FA]/40 text-[#FFFFFF] text-xs font-sans font-medium flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              title={tr(lang, 'Распечатать документ', 'Print document')}
            >
              <Printer className="w-3.5 h-3.5 text-[#93C5FD]" />
              <span className="hidden sm:inline">{tr(lang, 'Печать', 'Print')}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-md bg-[#245A91] hover:bg-[#1C3B65] text-[#FFFFFF] text-xs font-sans font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer border border-[#60A5FA]/30"
              title={tr(lang, 'Скачать официальный PDF', 'Download official PDF')}
            >
              <Download className="w-3.5 h-3.5 text-[#FFFFFF]" />
              <span>PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#FFFFFF]/75 hover:text-white hover:bg-[#0E1F36] transition-colors"
              aria-label={tr(lang, 'Закрыть', 'Close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Bond Paper Sheet (Simulated State University Certificate) */}
        <div className="p-6 sm:p-10 bg-[#FFFFFF] text-[#0F1D30] font-sans leading-relaxed text-xs sm:text-sm space-y-6 shadow-inner select-text">
          {/* Official Letterhead */}
          <div className="text-center border-b-2 border-[#142D4E] pb-4 space-y-1.5">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <UniversityEmblem size={44} />
            </div>
            <p className="font-sans text-[10px] uppercase tracking-widest text-[#667085] font-semibold">
              {tr(
                lang,
                'Министерство науки и высшего образования Российской Федерации',
                'Ministry of Science and Higher Education',
              )}
            </p>
            <h2 className="text-base sm:text-lg font-semibold tracking-wide uppercase text-[#142D4E]">
              {tr(
                lang,
                'ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ АВТОНОМНОЕ ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ ВЫСШЕГО ОБРАЗОВАНИЯ',
                'HIGHER EDUCATION INSTITUTION',
              )}
              <br />
              «{UNIVERSITY_INFO.name.toUpperCase()}»
            </h2>
            <p className="text-[11px] font-sans text-[#475467]">
              {localizeText(UNIVERSITY_INFO.faculty, lang)}
            </p>
            <p className="text-[10px] font-sans text-[#667085]">
              {tr(lang, 'г. Москва, ул. Академика Сахарова, д. 12', '12 Akademika Sakharova St., Moscow')} •{' '}
              {tr(lang, 'Тел:', 'Tel:')} {UNIVERSITY_INFO.deanOfficePhone} • E-mail: {UNIVERSITY_INFO.deanOfficeEmail}
            </p>
          </div>

          {/* Reference Number & Date */}
          <div className="flex justify-between text-xs text-[#475467] font-sans">
            <div>
              <p>
                {tr(lang, 'Рег. №', 'Reg. No.')}{' '}
                <strong className="font-mono text-[#0F1D30]">
                  {tr(lang, 'ЭД', 'ED')}-{request.id.toUpperCase()}
                </strong>
              </p>
              <p>
                {tr(lang, 'Дата выдачи:', 'Issue Date:')} <strong className="font-mono">{issuedDate}</strong>
              </p>
            </div>
            <div className="text-right">
              <p>
                {tr(lang, 'Код валидации:', 'Verification Code:')}{' '}
                <strong className="font-mono text-[#142D4E]">{request.id.slice(-6).toUpperCase()}</strong>
              </p>
              <p>
                {tr(lang, 'Срок действия:', 'Valid For:')}{' '}
                <strong>{tr(lang, '30 календарных дней', '30 calendar days')}</strong>
              </p>
            </div>
          </div>

          {/* Certificate Title */}
          <div className="text-center py-3">
            <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[#142D4E]">
              {localizeText(request.typeTitle, lang)}
            </h1>
          </div>

          {/* Main Body Text */}
          <div className="space-y-4 text-justify font-sans text-xs sm:text-sm leading-relaxed text-[#0F1D30]">
            {lang === 'ru' ? (
              <>
                <p>
                  Дана настоящая <strong>{request.studentName || 'Студенту'}</strong> в том, что он(а) действительно является студентом <strong>2 курса очной формы обучения</strong> факультета «{UNIVERSITY_INFO.faculty}» федерального государственного автономного образовательного учреждения высшего образования «{UNIVERSITY_INFO.name}», обучающимся по направлению подготовки бакалавриата «Международные отношения».
                </p>
                <p>
                  Обучение осуществляется на основании лицензии на право осуществления образовательной деятельности № 2841 от 14.04.2021 г. и свидетельства о государственной аккредитации образовательной деятельности № 3105 от 19.05.2021 г., выданных Федеральной службой по надзору в сфере образования и науки.
                </p>
                <p>
                  Справка выдана для предъявления: <strong>{request.data?.purpose || 'по месту требования'}</strong>.
                </p>
              </>
            ) : (
              <>
                <p>
                  This is to certify that <strong>{request.studentName || 'Student'}</strong> is a full-time <strong>Year 2 undergraduate student</strong> at the {localizeText(UNIVERSITY_INFO.faculty, 'en')} of {UNIVERSITY_INFO.name}, enrolled in the Bachelor&apos;s degree program in International Relations.
                </p>
                <p>
                  Studies are conducted under educational license No. 2841 dated April 14, 2021 and state accreditation certificate No. 3105 dated May 19, 2021.
                </p>
                <p>
                  Issued for presentation to: <strong>{request.data?.purpose || 'where requested'}</strong>.
                </p>
              </>
            )}
          </div>

          {/* Signatures & Official Electronic Cryptographic Seal */}
          <div className="pt-6 border-t border-[#DCE2EA] grid grid-cols-1 sm:grid-cols-2 gap-4 items-end font-sans">
            <div className="space-y-1 text-xs">
              <p className="font-bold text-[#0F1D30]">{tr(lang, 'И.о. Декана факультета', 'Acting Dean of Faculty')}</p>
              <p className="text-[#475467]">{tr(lang, 'д.полит.н., профессор', 'Doctor of Political Science, Professor')}</p>
              <p className="font-semibold text-[#142D4E] text-sm pt-1">{tr(lang, 'А.В. Смирнов', 'A.V. Smirnov')}</p>
            </div>

            {/* Official Digital Signature Box (ГОСТ Р 34.10-2012) */}
            <div className="p-3 rounded-lg border-2 border-[#142D4E] bg-[#F8FAFC] text-[10px] space-y-1 relative">
              <div className="flex items-center space-x-1.5 font-bold text-[#142D4E]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#142D4E]" />
                <span className="uppercase tracking-wider">
                  {tr(lang, 'ДОКУМЕНТ ПОДПИСАН ЭЦП', 'DOCUMENT SIGNED WITH EDS')}
                </span>
              </div>
              <p className="font-mono text-[9px] text-[#0F1D30] truncate">
                {tr(lang, 'Сертификат:', 'Certificate:')} 00E10350320A7B202611F30048E
              </p>
              <p className="text-[9px] text-[#475467]">
                {tr(lang, `Владелец: ФГАОУ ВО «${UNIVERSITY_INFO.name}»`, `Holder: ${UNIVERSITY_INFO.name}`)}
              </p>
              <p className="text-[9px] text-[#475467]">
                {tr(lang, 'Действителен: с 01.01.2026 по 01.01.2027', 'Valid: 01.01.2026 to 01.01.2027')}
              </p>
              <div className="pt-0.5 flex items-center justify-between text-[8px] font-mono text-[#667085]">
                <span>{tr(lang, 'ГОСТ Р 34.10-2012', 'GOST R 34.10-2012')}</span>
                <span className="font-semibold text-[#142D4E]">verify.demo.edu/{request.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
