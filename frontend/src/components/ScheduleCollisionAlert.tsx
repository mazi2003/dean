import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  MapPin,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from 'lucide-react';
import { tr, localizeText, localizePersonName } from '../utils/i18n';

export interface ConflictingClassInfo {
  subject: string;
  time: string;
  room: string;
  teacher?: string;
}

interface ScheduleCollisionAlertProps {
  retakeDate: string;
  retakeTime: string;
  retakeSubject: string;
  retakeRoom?: string;
  conflictingClass?: ConflictingClassInfo | null;
  onOpenMap?: (room: string) => void;
  compact?: boolean;
}

export const ScheduleCollisionAlert: React.FC<ScheduleCollisionAlertProps> = ({
  retakeDate,
  retakeTime,
  retakeSubject,
  retakeRoom,
  conflictingClass,
  onOpenMap,
  compact = false,
}) => {
  const { lang, profile } = useAuth();
  const [showDirectiveModal, setShowDirectiveModal] = useState(false);

  const conflictSubjectRu = conflictingClass?.subject || retakeSubject;
  const conflictSubjectEn = localizeText(conflictSubjectRu, 'en');
  const conflictTime = conflictingClass?.time || retakeTime;
  const conflictRoom = conflictingClass?.room || retakeRoom || '';
  const conflictTeacherRu = conflictingClass?.teacher || '';
  const conflictTeacherEn = conflictTeacherRu ? localizeText(conflictTeacherRu, 'en') : '';

  return (
    <div
      className={`rounded-2xl border transition-all ${
        compact
          ? 'p-3 bg-[#fff8eb] dark:bg-[#2b1f0c] border-[#f59e0b]/40 text-xs'
          : 'p-4 sm:p-5 bg-gradient-to-br from-[#fff7ed] via-white to-[#fffaf0] dark:from-[#291b0f] dark:via-[#1c140e] dark:to-[#171c26] border-[#f97316]/40 shadow-xs space-y-3.5'
      }`}
    >
      {/* Collision Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-[#c2410c] text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-heading font-bold text-xs sm:text-sm text-[#9a3412] dark:text-[#fed7aa]">
                {tr(
                  lang,
                  '⚡ Обнаружен конфликт расписания (Schedule Collision)',
                  '⚡ Schedule Collision Detected'
                )}
              </span>
              <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-[#c2410c] text-white">
                {tr(lang, 'НАКЛАДКА СЛОТА', 'SLOT OVERLAP')}
              </span>
            </div>
            <p className="text-xs text-[#7c2d12] dark:text-[#fdba74] font-sans mt-0.5 leading-relaxed">
              {conflictingClass
                ? tr(
                    lang,
                    `Время повторной аттестации (${retakeDate}, ${retakeTime}) совпадает со слотом обязательного занятия учебной группы: «${conflictSubjectRu}» (${conflictTime}${conflictRoom ? `, ауд. ${conflictRoom}` : ''}).`,
                    `Retake exam slot (${localizeText(retakeDate, lang)}, ${retakeTime}) overlaps with scheduled group class: "${conflictSubjectEn}" (${conflictTime}${conflictRoom ? `, Room ${localizeText(conflictRoom, lang)}` : ''}).`
                  )
                : tr(
                    lang,
                    `Время повторной аттестации по дисциплине «${retakeSubject}» (${retakeDate}, ${retakeTime}) пересекается с учебным расписанием.`,
                    `Retake exam slot for "${localizeText(retakeSubject, lang)}" (${localizeText(retakeDate, lang)}, ${retakeTime}) overlaps with the regular timetable.`
                  )}
            </p>
          </div>
        </div>
      </div>

      {/* Resolution & Institutional Priority Rule */}
      <div className="p-3 rounded-xl bg-white/80 dark:bg-[#121620]/80 border border-[#f97316]/20 space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-[#9a3412] dark:text-[#fed7aa] font-heading font-semibold text-[11px] uppercase tracking-wider">
          <ShieldAlert className="w-3.5 h-3.5 text-[#f97316]" />
          <span>
            {tr(
              lang,
              'Академический регламент DemoTech: Приоритет аттестации (Level 1)',
              'Academic Policy: Assessment Priority (Level 1)'
            )}
          </span>
        </div>
        <p className="text-[11px] text-[#4b5563] dark:text-[#cbd5e1] font-sans leading-relaxed">
          {tr(
            lang,
            'В соответствии с Регламентом аттестации DemoTech University, комиссионная пересдача имеет приоритет 1-й категории над регулярными семинарскими занятиями. Освобождение от присутствия на занятии внесено в электронную ведомость автоматически.',
            'Under DemoTech University academic policy, commission examinations hold Level 1 priority over regular class attendance. Excused absence waiver has been granted automatically.'
          )}
        </p>

        {/* Action Controls */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          {/* Dean's Directive Toggle Button */}
          <button
            type="button"
            onClick={() => setShowDirectiveModal(!showDirectiveModal)}
            className="px-3 py-1.5 min-h-[44px] rounded-lg bg-[#fef3c7] dark:bg-[#451a03] text-[#92400e] dark:text-[#fde68a] hover:bg-[#fde68a] dark:hover:bg-[#78350f] text-[11px] font-heading font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>
              {showDirectiveModal
                ? tr(lang, 'Скрыть распоряжение № 118-А', 'Hide Memo #118-A')
                : tr(lang, 'Служебная записка деканата № 118-А', 'Dean Memo #118-A')}
            </span>
            {showDirectiveModal ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Interactive Room Wayfinding Button */}
          {onOpenMap && retakeRoom && (
            <button
              type="button"
              onClick={() => onOpenMap(retakeRoom)}
              className="px-3 py-1.5 min-h-[44px] rounded-lg bg-[#161821] text-white hover:bg-[#11141c] text-[11px] font-heading font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#45d320]" />
              <span>
                {tr(
                  lang,
                  `Найти ауд. ${retakeRoom} на карте кампуса`,
                  `Locate Room ${localizeText(retakeRoom, lang)} on Map`
                )}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Dean's Directive Details */}
      {showDirectiveModal && (
        <div className="p-4 rounded-xl bg-white dark:bg-[#11141c] border border-[#f97316]/30 text-xs font-sans space-y-2 animate-fade-in shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e4e8] dark:border-[#273142] pb-2 text-[10px] text-[#475569] dark:text-[#94a3b8]">
            <span>РАСПОРЯЖЕНИЕ ДЕКАНАТА № 118-А-СТ</span>
            <span>{localizeText(retakeDate, lang)}</span>
          </div>
          <p className="text-[11px] font-sans text-[#161821] dark:text-white leading-relaxed">
            {tr(
              lang,
              `«Об освобождении студента${profile?.group ? ` гр. ${profile.group}` : ''} ${profile?.fullName || ''} от аудиторных занятий (${retakeDate}, ${retakeTime}) в связи с участием в работе аттестационной комиссии по дисциплине «${localizeText(retakeSubject, lang)}».${conflictTeacherRu ? ` Преподавателю ${conflictTeacherRu} засчитать причину отсутствия уважительной.` : ''}»`,
              `"Excused absence directive for student ${localizePersonName(profile?.fullName, 'en') || ''}${profile?.group ? ` (group ${profile.group})` : ''} on ${localizeText(retakeDate, 'en')} at ${retakeTime} due to commission re-examination in "${localizeText(retakeSubject, 'en')}".${conflictTeacherEn ? ` Instructor ${conflictTeacherEn} shall record an excused absence.` : ''} Academic sanctions shall not apply."`
            )}
          </p>
          <div className="flex items-center justify-between text-[10px] text-[#166534] dark:text-[#45d320] font-semibold pt-1">
            <span>И.о. Декана факультета: проф. А.В. Смирнов</span>
            <span>СТАТУС: СОГЛАСОВАНО В ЕИС</span>
          </div>
        </div>
      )}
    </div>
  );
};
