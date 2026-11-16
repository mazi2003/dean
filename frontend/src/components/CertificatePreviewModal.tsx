import React from 'react';
import { X, Printer, Download, CheckCircle2, QrCode } from 'lucide-react';
import { StudentRequest } from '../types';
import { UNIVERSITY_INFO } from '../services/mockData';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col my-auto">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
              Электронный документ с ЭЦП
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">
              ЮРИДИЧЕСКИ ЗНАЧИМ
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center space-x-1 shadow-sm"
              title="Печать"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Печать</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center space-x-1 shadow-sm"
              title="Скачать PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet (Simulated A4 paper) */}
        <div className="p-6 sm:p-10 bg-white text-slate-900 font-serif leading-relaxed text-xs sm:text-sm shadow-sm space-y-6">
          {/* Letterhead */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <p className="font-sans text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              Министерство науки и высшего образования Российской Федерации
            </p>
            <h2 className="text-base sm:text-lg font-bold font-sans tracking-wide uppercase text-slate-900">
              ФГАОУ ВО «{UNIVERSITY_INFO.name.toUpperCase()}»
            </h2>
            <p className="text-[11px] font-sans text-slate-600">
              {UNIVERSITY_INFO.faculty}
            </p>
            <p className="text-[10px] font-sans text-slate-400">
              г. Москва, ул. Академика Сахарова, д. 12 • Тел: {UNIVERSITY_INFO.deanOfficePhone} • E-mail: {UNIVERSITY_INFO.deanOfficeEmail}
            </p>
          </div>

          {/* Reference Number & Date */}
          <div className="flex justify-between text-xs text-slate-600 font-sans">
            <div>
              <p>Рег. № <strong>ЭД-{request.id.toUpperCase()}</strong></p>
              <p>Дата выдачи: <strong>{new Date().toLocaleDateString('ru-RU')}</strong></p>
            </div>
            <div className="text-right">
              <p>Код проверки: <strong>{request.id.slice(-6).toUpperCase()}</strong></p>
              <p>Срок действия: <strong>30 календарных дней</strong></p>
            </div>
          </div>

          {/* Certificate Title */}
          <div className="text-center py-4">
            <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider">
              {request.typeTitle}
            </h1>
          </div>

          {/* Main Body Text */}
          <div className="space-y-4 text-justify font-sans text-sm">
            <p>
              Дана настоящая <strong>{request.studentName || 'Студенту'}</strong> в том, что он(а) действительно является студентом <strong>2 курса очной формы обучения</strong> факультета «{UNIVERSITY_INFO.faculty}» федерального государственного автономного образовательного учреждения высшего образования «{UNIVERSITY_INFO.name}», обучающимся по направлению подготовки бакалавриата «Международные отношения».
            </p>
            <p>
              Обучение осуществляется на основании лицензии на право осуществления образовательной деятельности № 2841 и свидетельства о государственной аккредитации № 3105.
            </p>
            {request.data.purpose && (
              <p>
                Справка выдана для предъявления по месту требования: <em>{request.data.purpose}</em>.
              </p>
            )}
            <p>
              Ориентировочный срок окончания полного курса обучения — <strong>июнь 2027 года</strong>.
            </p>
          </div>

          {/* Electronic Stamp & QR Seal */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-200">
            {/* Verification QR */}
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 border-2 border-slate-800 p-1 rounded-lg">
                <QrCode className="w-full h-full text-slate-900" />
              </div>
              <div className="text-[10px] font-sans text-slate-500">
                <p className="font-bold text-slate-800">Проверка подлинности</p>
                <p>Отсканируйте камерой смартфона</p>
                <p className="font-mono text-blue-600">verify.demo.edu/{request.id}</p>
              </div>
            </div>

            {/* Blue Digital Signature Stamp Box */}
            <div className="border-2 border-blue-600 rounded-xl p-3 bg-blue-50/50 text-blue-900 font-sans text-[11px] max-w-xs shadow-sm">
              <div className="flex items-center space-x-1.5 font-bold text-blue-700 uppercase tracking-tight text-[10px] mb-1">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Документ подписан электронной подписью</span>
              </div>
              <p><strong>Сертификат:</strong> 00E1035678AB9012CF34900</p>
              <p><strong>Владелец:</strong> Волкова Мария Викторовна, Деканат</p>
              <p><strong>Действителен:</strong> с 01.01.2026 по 01.01.2027</p>
            </div>
          </div>

          <div className="text-center pt-2 text-[10px] text-slate-400 font-sans">
            {UNIVERSITY_INFO.disclaimer}
          </div>
        </div>
      </div>
    </div>
  );
};
