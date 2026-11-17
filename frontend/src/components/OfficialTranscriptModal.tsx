import React, { useRef, useMemo } from 'react';
import { X, Printer, ShieldCheck, FileText } from 'lucide-react';
import { StudentDossier } from '../types';
import { UniversityEmblem } from './UniversityEmblem';

interface OfficialTranscriptModalProps {
  dossier: StudentDossier | null;
  onClose: () => void;
}

export const OfficialTranscriptModal: React.FC<OfficialTranscriptModalProps> = ({
  dossier,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => {
    return new Date().toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }, []);

  if (!dossier) return null;
  const { profile, gradesSummary } = dossier;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#112238] rounded-2xl max-w-3xl w-full border border-[#DCE2EA] dark:border-[#1E395B] shadow-2xl overflow-hidden my-auto">
        {/* Modal Controls Header */}
        <div className="px-5 py-3.5 bg-[#F8FAFC] dark:bg-[#111714] border-b border-[#DCE2EA] dark:border-[#193150] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-sans text-[#142D4E] dark:text-[#245A91] font-semibold">
            <FileText className="w-4 h-4 text-[#245A91]" />
            <span>Официальная выписка из зачетно-экзаменационной ведомости</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] text-xs font-medium cursor-pointer transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Печать / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#667085] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF] hover:bg-[#EDF2F7] dark:hover:bg-[#162A45] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Transcript Document Paper */}
        <div ref={printRef} className="p-6 sm:p-10 space-y-6 bg-[#FFFFFF] dark:bg-[#0E1B2D] text-[#0F1D30] dark:text-[#FFFFFF] print:p-0 print:bg-white print:text-black">
          {/* Institutional Masthead */}
          <div className="border-b-2 border-[#142D4E] dark:border-[#245A91] pb-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-lg bg-[#142D4E] text-[#245A91] flex items-center justify-center p-2 flex-shrink-0">
                <UniversityEmblem size={44} variant="full" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-base sm:text-lg tracking-tight text-[#142D4E] dark:text-[#245A91]">
                  ДЕМОТЕХ УНИВЕРСИТЕТ
                </h2>
                <p className="text-[11px] font-sans text-[#667085] uppercase tracking-wider">
                  Факультет международных отношений • Деканат
                </p>
                <p className="text-[10px] text-[#667085] font-mono">
                  Москва, Университетская наб., д. 1 • Тел.: +7 (495) 000-00-00
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-[11px] text-[#667085]">
              <div>Исх. № <span className="font-bold text-[#142D4E] dark:text-[#245A91]">ВЫП-2026/{profile.studentNumber.slice(-4)}</span></div>
              <div>Дата выдачи: {today}</div>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center space-y-1">
            <h1 className="font-serif text-lg sm:text-xl font-bold uppercase tracking-wide text-[#142D4E] dark:text-[#FFFFFF]">
              Академическая справка — Выписка успеваемости
            </h1>
            <p className="text-xs text-[#667085] font-sans">
              Выдана для подтверждения освоения образовательной программы высшего образования
            </p>
          </div>

          {/* Student Info Grid */}
          <div className="bg-white dark:bg-[#162A45] p-4 rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
            <div>
              <span className="text-[#667085] block text-[11px]">ФИО обучающегося:</span>
              <span className="font-bold text-sm text-[#142D4E] dark:text-[#245A91]">{profile.fullName}</span>
            </div>
            <div>
              <span className="text-[#667085] block text-[11px]">Номер студенческого билета / Зачетки:</span>
              <span className="font-mono font-semibold">{profile.studentNumber} / {profile.recordBookNumber}</span>
            </div>
            <div>
              <span className="text-[#667085] block text-[11px]">Направление подготовки:</span>
              <span className="font-medium">{profile.program}</span>
            </div>
            <div>
              <span className="text-[#667085] block text-[11px]">Группа / Курс:</span>
              <span className="font-medium">{profile.group} • {profile.year} курс ({profile.studyForm})</span>
            </div>
          </div>

          {/* Grades Table */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#667085]">
              Результаты промежуточной аттестации (Семестр 3):
            </h3>
            <div className="overflow-x-auto rounded-lg border border-[#DCE2EA] dark:border-[#1E395B]">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#F8FAFC] dark:bg-[#111714] text-[10px] uppercase font-semibold text-[#667085] border-b border-[#DCE2EA] dark:border-[#1E395B]">
                  <tr>
                    <th className="py-2.5 px-3">№</th>
                    <th className="py-2.5 px-3">Наименование дисциплины</th>
                    <th className="py-2.5 px-2 text-center">З.Е.</th>
                    <th className="py-2.5 px-2 text-center">Форма</th>
                    <th className="py-2.5 px-2 text-center">БРС</th>
                    <th className="py-2.5 px-3 text-right">Оценка</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE2EA] dark:divide-[#1E395B] bg-white dark:bg-[#112238]">
                  {gradesSummary.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#162A45]/50">
                      <td className="py-2 px-3 text-[#667085] font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2 px-3 font-medium text-[#0F1D30] dark:text-[#FFFFFF]">
                        {item.subject}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-[#667085]">{item.credits}</td>
                      <td className="py-2 px-2 text-center text-[11px] text-[#667085]">
                        {item.assessmentType === 'exam' ? 'Экзамен' : item.assessmentType === 'credit' ? 'Зачет' : 'Курсовая'}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-semibold">
                        {item.points ?? '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold">
                        {item.grade === 5 && <span className="text-emerald-600 dark:text-emerald-400">Отлично (5)</span>}
                        {item.grade === 4 && <span className="text-blue-600 dark:text-blue-400">Хорошо (4)</span>}
                        {item.grade === 3 && <span className="text-amber-600 dark:text-amber-400">Удовл. (3)</span>}
                        {item.grade === 2 && <span className="text-rose-600 dark:text-rose-400">Неудовл. (2)</span>}
                        {!item.grade && (item.creditStatus === 'earned' ? <span className="text-emerald-600">Зачтено</span> : <span className="text-[#667085]">В процессе</span>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Metric Box */}
          <div className="flex flex-wrap items-center justify-between p-3.5 bg-[#F8FAFC] dark:bg-[#111714] rounded-xl border border-[#DCE2EA] dark:border-[#1E395B] text-xs font-sans">
            <div>
              <span className="text-[#667085]">Средний балл (GPA): </span>
              <span className="font-mono font-bold text-base text-[#142D4E] dark:text-[#245A91]">{profile.gpa.toFixed(2)}</span>
              <span className="text-[#667085] ml-2">• Средний рейтинг БРС: </span>
              <span className="font-mono font-bold text-[#142D4E] dark:text-[#245A91]">{profile.averageScore}%</span>
            </div>
            <div>
              <span className="text-[#667085]">Освоено кредитов: </span>
              <span className="font-mono font-bold">{gradesSummary.creditsEarned} из {gradesSummary.creditsRequired} ECTS</span>
            </div>
          </div>

          {/* Digital Signature & Seal Verification Stamp */}
          <div className="pt-4 border-t border-[#DCE2EA] dark:border-[#1E395B] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 border-2 border-dashed border-[#142D4E]/40 dark:border-[#245A91]/40 rounded-xl p-3 bg-white dark:bg-[#112238]">
              <div className="w-10 h-10 rounded-lg bg-[#142D4E] text-[#245A91] flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-[10px] font-sans leading-tight">
                <span className="font-bold text-[#142D4E] dark:text-[#245A91] block uppercase">
                  ДОКУМЕНТ ПОДПИСАН КВАЛИФИЦИРОВАННОЙ ЭЦП
                </span>
                <span className="text-[#667085] block font-mono">
                  Сертификат: 77AA-9402-E12F-2026
                </span>
                <span className="text-[#667085] block">
                  Владелец: Волкова Мария Сергеевна, Зам. декана
                </span>
                <span className="text-[#667085] block">
                  Действителен: с 01.09.2026 по 31.08.2027
                </span>
              </div>
            </div>

            <div className="text-center sm:text-right text-[10px] text-[#667085] font-sans space-y-0.5">
              <p className="font-medium text-[#0F1D30] dark:text-[#FFFFFF]">
                Заместитель декана по УМР: М.С. Волкова
              </p>
              <p>М.П. (Гербовая печать деканата МО)</p>
              <p className="font-mono text-[9px] text-[#245A91]">
                Верификация в реестре: demo.edu/verify/77AA-9402
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
