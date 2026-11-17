import React from 'react';
import { X, Printer, Download, CheckCircle2, QrCode, ShieldCheck } from 'lucide-react';
import { StudentRequest } from '../types';
import { UNIVERSITY_INFO } from '../services/mockData';
import { UniversityEmblem } from './UniversityEmblem';

interface CertificatePreviewModalProps {
  request: StudentRequest | null;
  onClose: () => void;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({ request, onClose }) => {
  if (!request) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#18221D] rounded-xl shadow-2xl overflow-hidden border border-[#E3DDD1] dark:border-[#2D3E35] flex flex-col my-auto">
        {/* Top Control Bar */}
        <div className="px-5 py-3.5 bg-[#183D35] text-[#F3EFE5] border-b border-[#C4A46B]/30 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#C4A46B]" />
            <span className="font-serif font-bold text-sm text-[#F3EFE5]">
              Электронный документ с усиленной квалифицированной ЭЦП
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-md bg-[#102923] hover:bg-[#15342D] border border-[#C4A46B]/40 text-[#F3EFE5] text-xs font-sans font-medium flex items-center space-x-1.5 shadow-xs transition-colors"
              title="Распечатать документ"
            >
              <Printer className="w-3.5 h-3.5 text-[#C4A46B]" />
              <span className="hidden sm:inline">Печать</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-md bg-[#C4A46B] hover:bg-[#D9BD8A] text-[#183D35] text-xs font-sans font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
              title="Скачать официальный PDF"
            >
              <Download className="w-3.5 h-3.5 text-[#183D35]" />
              <span>PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#F3EFE5]/75 hover:text-white hover:bg-[#102923] transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Bond Paper Sheet (Simulated State University Certificate) */}
        <div className="p-6 sm:p-10 bg-[#FFFFFF] text-[#252923] font-serif leading-relaxed text-xs sm:text-sm space-y-6 shadow-inner select-text">
          {/* Official Letterhead */}
          <div className="text-center border-b-2 border-[#183D35] pb-4 space-y-1.5">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <UniversityEmblem size={44} />
            </div>
            <p className="font-sans text-[10px] uppercase tracking-widest text-[#7E877B] font-semibold">
              Министерство науки и высшего образования Российской Федерации
            </p>
            <h2 className="text-base sm:text-lg font-bold font-serif tracking-wide uppercase text-[#183D35]">
              ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ АВТОНОМНОЕ ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ ВЫСШЕГО ОБРАЗОВАНИЯ<br />
              «{UNIVERSITY_INFO.name.toUpperCase()}»
            </h2>
            <p className="text-[11px] font-sans text-[#575F53]">
              {UNIVERSITY_INFO.faculty}
            </p>
            <p className="text-[10px] font-sans text-[#7E877B]">
              г. Москва, ул. Академика Сахарова, д. 12 • Тел: {UNIVERSITY_INFO.deanOfficePhone} • E-mail: {UNIVERSITY_INFO.deanOfficeEmail}
            </p>
          </div>

          {/* Reference Number & Date */}
          <div className="flex justify-between text-xs text-[#575F53] font-sans">
            <div>
              <p>Рег. № <strong className="font-mono text-[#252923]">ЭД-{request.id.toUpperCase()}</strong></p>
              <p>Дата выдачи: <strong className="font-mono">{new Date().toLocaleDateString('ru-RU')}</strong></p>
            </div>
            <div className="text-right">
              <p>Код валидации: <strong className="font-mono text-[#183D35]">{request.id.slice(-6).toUpperCase()}</strong></p>
              <p>Срок действия: <strong>30 календарных дней</strong></p>
            </div>
          </div>

          {/* Certificate Title */}
          <div className="text-center py-3">
            <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[#183D35]">
              {request.typeTitle}
            </h1>
          </div>

          {/* Main Body Text */}
          <div className="space-y-4 text-justify font-sans text-xs sm:text-sm leading-relaxed text-[#252923]">
            <p>
              Дана настоящая <strong>{request.studentName || 'Студенту'}</strong> в том, что он(а) действительно является студентом <strong>2 курса очной формы обучения</strong> факультета «{UNIVERSITY_INFO.faculty}» федерального государственного автономного образовательного учреждения высшего образования «{UNIVERSITY_INFO.name}», обучающимся по направлению подготовки бакалавриата «Международные отношения».
            </p>
            <p>
              Обучение осуществляется на основании лицензии на право осуществления образовательной деятельности № 2841 от 14.04.2021 г. и свидетельства о государственной аккредитации образовательной деятельности № 3105 от 19.05.2021 г., выданных Федеральной службой по надзору в сфере образования и науки.
            </p>
            <p>
              Справка выдана для предъявления: <strong>{request.data?.purpose || 'по месту требования'}</strong>.
            </p>
          </div>

          {/* Signatures & Official Electronic Cryptographic Seal */}
          <div className="pt-6 border-t border-[#E3DDD1] grid grid-cols-1 sm:grid-cols-2 gap-4 items-end font-sans">
            <div className="space-y-1 text-xs">
              <p className="font-bold text-[#252923]">И.о. Декана факультета</p>
              <p className="text-[#575F53]">д.полит.н., профессор</p>
              <p className="font-serif font-bold text-[#183D35] text-sm pt-1">А.В. Смирнов</p>
            </div>

            {/* Official Digital Signature Box (ГОСТ Р 34.10-2012) */}
            <div className="p-3 rounded-lg border-2 border-[#183D35] bg-[#FAF8F3] text-[10px] space-y-1 relative">
              <div className="flex items-center space-x-1.5 font-bold text-[#183D35]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#183D35]" />
                <span className="uppercase tracking-wider">ДОКУМЕНТ ПОДПИСАН ЭЦП</span>
              </div>
              <p className="font-mono text-[9px] text-[#252923] truncate">
                Сертификат: 00E10350320A7B202611F30048E
              </p>
              <p className="text-[9px] text-[#575F53]">
                Владелец: ФГАОУ ВО «{UNIVERSITY_INFO.name}»
              </p>
              <p className="text-[9px] text-[#575F53]">
                Действителен: с 01.01.2026 по 01.01.2027
              </p>
              <div className="pt-0.5 flex items-center justify-between text-[8px] font-mono text-[#7E877B]">
                <span>ГОСТ Р 34.10-2012</span>
                <span className="font-semibold text-[#183D35]">verify.demo.edu/{request.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
