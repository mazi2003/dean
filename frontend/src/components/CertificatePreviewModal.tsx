import React, { useState } from 'react';
import { X, Printer, Download, ShieldCheck } from 'lucide-react';
import { StudentRequest } from '../types';
import { UNIVERSITY_INFO } from '../constants/university';
import { UniversityEmblem } from './UniversityEmblem';
import { useAuth } from '../context/AuthContext';
import { tr, localizeText } from '../utils/i18n';

interface CertificatePreviewModalProps {
  request: StudentRequest | null;
  onClose: () => void;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({
  request,
  onClose,
}) => {
  const { lang, profile } = useAuth();
  const [issuedTimestamp] = useState(() => Date.now());
  if (!request) return null;

  const issuedDate = new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US').format(
    issuedTimestamp
  );
  const studentYear = profile?.year || 2;
  const studentProgram = profile?.program
    ? localizeText(profile.program, lang)
    : lang === 'ru'
      ? 'Международные отношения'
      : 'International Relations';
  const reqData = (request.data || {}) as Record<string, unknown>;
  const reqPurpose = String(reqData.purpose || reqData.reason || '');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tr(lang, 'Макет электронной справки', 'Electronic Certificate Preview')}
        className="relative w-full max-w-2xl bg-white dark:bg-[#112238] rounded-xl shadow-2xl overflow-hidden border border-[#DCE2EA] dark:border-[#1E395B] flex flex-col my-auto"
      >
        {/* Top Control Bar */}
        <div className="px-5 py-3.5 bg-[#142D4E] text-[#FFFFFF] border-b border-[#60A5FA]/30 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#93C5FD]" />
            <span className="font-semibold text-sm text-[#FFFFFF]">
              {tr(
                lang,
                'Макет электронной справки (иллюстрация)',
                'Electronic Certificate Preview (Illustrative)'
              )}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-md bg-[#0E1F36] hover:bg-[#1C3B65] border border-[#60A5FA]/40 text-[#FFFFFF] text-xs font-sans font-medium flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              title={tr(lang, 'Распечатать макет', 'Print preview')}
            >
              <Printer className="w-3.5 h-3.5 text-[#93C5FD]" />
              <span className="hidden sm:inline">{tr(lang, 'Печать', 'Print')}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-md bg-[#245A91] hover:bg-[#1C3B65] text-[#FFFFFF] text-xs font-sans font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer border border-[#60A5FA]/30"
              title={tr(lang, 'Сохранить макет в PDF', 'Save preview as PDF')}
            >
              <Download className="w-3.5 h-3.5 text-[#FFFFFF]" />
              <span>PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-[#FFFFFF]/75 hover:text-white hover:bg-[#0E1F36] transition-colors cursor-pointer"
              aria-label={tr(lang, 'Закрыть', 'Close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Illustrative Prototype Disclaimer Banner */}
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-[11px] font-sans text-center font-medium">
          {tr(
            lang,
            'Иллюстрация прототипа: настоящая квалифицированная ЭЦП не используется, документ не имеет юридической силы.',
            'Illustrative prototype only: no real qualified e-signature is used; this document is not legally valid.'
          )}
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
                'Ministry of Science and Higher Education'
              )}
            </p>
            <h2 className="text-base sm:text-lg font-semibold tracking-wide uppercase text-[#142D4E]">
              {tr(
                lang,
                'ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ АВТОНОМНОЕ ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ ВЫСШЕГО ОБРАЗОВАНИЯ',
                'HIGHER EDUCATION INSTITUTION'
              )}
              <br />«{UNIVERSITY_INFO.name.toUpperCase()}»
            </h2>
            <p className="text-[11px] font-sans text-[#475467]">
              {localizeText(UNIVERSITY_INFO.faculty, lang)}
            </p>
            <p className="text-[10px] font-sans text-[#667085]">
              {tr(
                lang,
                'г. Москва, ул. Академика Сахарова, д. 12',
                '12 Akademika Sakharova St., Moscow'
              )}{' '}
              • {tr(lang, 'Тел:', 'Tel:')} {UNIVERSITY_INFO.deanOfficePhone} • E-mail:{' '}
              {UNIVERSITY_INFO.deanOfficeEmail}
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
                {tr(lang, 'Дата выдачи:', 'Issue Date:')}{' '}
                <strong className="font-mono">{issuedDate}</strong>
              </p>
            </div>
            <div className="text-right">
              <p>
                {tr(lang, 'Код валидации:', 'Verification Code:')}{' '}
                <strong className="font-mono text-[#142D4E]">
                  {request.id.slice(-6).toUpperCase()}
                </strong>
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
                  Дана настоящая <strong>{request.studentName || 'Студенту'}</strong> в том, что
                  он(а) действительно является студентом{' '}
                  <strong>{studentYear} курса очной формы обучения</strong> факультета «
                  {UNIVERSITY_INFO.faculty}» федерального государственного автономного
                  образовательного учреждения высшего образования «{UNIVERSITY_INFO.name}»,
                  обучающимся по направлению подготовки бакалавриата «{studentProgram}».
                </p>
                <p>
                  Обучение осуществляется на основании лицензии на право осуществления
                  образовательной деятельности № 2841 от 14.04.2021 г. и свидетельства о
                  государственной аккредитации образовательной деятельности № 3105 от 19.05.2021 г.,
                  выданных Федеральной службой по надзору в сфере образования и науки.
                </p>
                <p>
                  Справка выдана для предъявления:{' '}
                  <strong>{reqPurpose || 'по месту требования'}</strong>.
                </p>
              </>
            ) : (
              <>
                <p>
                  This is to certify that <strong>{request.studentName || 'Student'}</strong> is a
                  full-time <strong>Year {studentYear} undergraduate student</strong> at the{' '}
                  {localizeText(UNIVERSITY_INFO.faculty, 'en')} of {UNIVERSITY_INFO.name}, enrolled
                  in the Bachelor&apos;s degree program in {studentProgram}.
                </p>
                <p>
                  Studies are conducted under educational license No. 2841 dated April 14, 2021 and
                  state accreditation certificate No. 3105 dated May 19, 2021.
                </p>
                <p>
                  Issued for presentation to: <strong>{reqPurpose || 'where requested'}</strong>.
                </p>
              </>
            )}
          </div>

          {/* Signatures & Official Electronic Cryptographic Seal */}
          <div className="pt-6 border-t border-[#DCE2EA] grid grid-cols-1 sm:grid-cols-2 gap-4 items-end font-sans">
            <div className="space-y-1 text-xs">
              <p className="font-bold text-[#0F1D30]">
                {tr(lang, 'И.о. Декана факультета', 'Acting Dean of Faculty')}
              </p>
              <p className="text-[#475467]">
                {tr(lang, 'д.полит.н., профессор', 'Doctor of Political Science, Professor')}
              </p>
              <p className="font-semibold text-[#142D4E] text-sm pt-1">
                {tr(lang, 'А.В. Смирнов', 'A.V. Smirnov')}
              </p>
            </div>

            {/* Official Digital Signature Stamp (ГОСТ Р 7.0.97-2016) */}
            <div className="p-3.5 rounded-xl border-2 border-[#142D4E] bg-[#F8FAFC] text-[10px] space-y-1.5 shadow-sm">
              <div className="flex items-center space-x-1.5 font-bold text-[#142D4E] border-b border-[#142D4E]/20 pb-1.5">
                <ShieldCheck className="w-4 h-4 text-[#142D4E]" />
                <span className="uppercase tracking-wider text-[10px]">
                  {tr(lang, 'ИЛЛЮСТРАТИВНЫЙ ШТАМП (ДЕМО)', 'ILLUSTRATIVE STAMP (DEMO)')}
                </span>
              </div>
              <div className="space-y-0.5 text-[9px] font-mono text-[#475467]">
                <p>
                  <strong className="text-[#142D4E]">{tr(lang, 'Сертификат:', 'Cert:')}</strong>{' '}
                  00C8-DEMO-2026-СПР-{request.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="truncate">
                  <strong className="text-[#142D4E]">{tr(lang, 'Владелец:', 'Signer:')}</strong>{' '}
                  {tr(lang, 'Смирнов А.В., И.о. Декана факультета МО', 'A.V. Smirnov, Acting Dean')}
                </p>
                <p>
                  <strong className="text-[#142D4E]">
                    {tr(lang, 'Действителен:', 'Validity:')}
                  </strong>{' '}
                  01.09.2025 – 31.08.2027
                </p>
              </div>
              <div className="pt-1 border-t border-[#DCE2EA] flex items-center justify-between text-[8px] font-mono text-[#667085]">
                <span>{tr(lang, 'Конкурсный макет (вымышл.)', 'Competition concept')}</span>
                <span className="font-semibold text-[#142D4E]">
                  demotech.edu/verify/{request.id.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
