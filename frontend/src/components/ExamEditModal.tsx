import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Shield,
  BellRing,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  Users,
} from 'lucide-react';
import { ExamEntry, ExamStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { tr, localizeText } from '../utils/i18n';

interface ExamEditModalProps {
  exam: ExamEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    examId: string,
    changes: Partial<ExamEntry> & { notifyGroup?: boolean }
  ) => Promise<void>;
  onReset?: (examId: string) => Promise<void>;
}

export const ExamEditModal: React.FC<ExamEditModalProps> = ({
  exam,
  isOpen,
  onClose,
  onSave,
  onReset,
}) => {
  if (!isOpen || !exam) return null;

  return (
    <ExamEditModalContent
      key={`${exam.id}-${exam.date}-${exam.time}-${exam.room}-${exam.status}`}
      exam={exam}
      onClose={onClose}
      onSave={onSave}
      onReset={onReset}
    />
  );
};

interface ExamEditModalContentProps {
  exam: ExamEntry;
  onClose: () => void;
  onSave: (
    examId: string,
    changes: Partial<ExamEntry> & { notifyGroup?: boolean }
  ) => Promise<void>;
  onReset?: (examId: string) => Promise<void>;
}

const ExamEditModalContent: React.FC<ExamEditModalContentProps> = ({
  exam,
  onClose,
  onSave,
  onReset,
}) => {
  const { lang } = useAuth();
  const [date, setDate] = useState(exam.date || '');
  const [time, setTime] = useState(exam.time || '10:00 – 14:00');
  const [room, setRoom] = useState(exam.room || '');
  const [examiner, setExaminer] = useState(exam.examiner || '');
  const [commission, setCommission] = useState(exam.commissionMembers || '');
  const [consultation, setConsultation] = useState(exam.consultation || '');
  const [format, setFormat] = useState(exam.format || 'Устный экзамен по билетам');
  const [status, setStatus] = useState<ExamStatus>(exam.status || 'scheduled');
  const [changeNote, setChangeNote] = useState(exam.changeNote || '');
  const [notifyGroup, setNotifyGroup] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(exam.id, {
        date,
        time,
        room,
        examiner,
        commissionMembers: commission,
        consultation,
        format,
        status,
        changeNote: changeNote.trim() ? changeNote.trim() : null,
        notifyGroup,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!onReset) return;
    setSaving(true);
    try {
      await onReset(exam.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#112238] rounded-2xl max-w-2xl w-full border border-[#DCE2EA] dark:border-[#1E395B] shadow-2xl overflow-hidden my-auto animate-scale-up">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#F8FAFC] dark:bg-[#111714] border-b border-[#DCE2EA] dark:border-[#193150] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#142D4E] text-[#245A91] flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#142D4E] text-[#245A91]">
                  {tr(lang, 'ГРУППА', 'GROUP')} {exam.groupId}
                </span>
                <span className="text-[11px] font-mono text-[#667085]">{exam.code}</span>
              </div>
              <h2 className="font-semibold text-base sm:text-lg text-[#142D4E] dark:text-[#FFFFFF] mt-0.5">
                {tr(lang, 'Распоряжение деканата: график экзамена', "Dean's Directive: Exam Schedule")}
              </h2>
              <p className="text-xs text-[#667085] font-sans truncate max-w-md">
                {localizeText(exam.subject, lang)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#667085] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF] hover:bg-[#EDF2F7] dark:hover:bg-[#162A45] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs font-sans">
          {/* Quick Warning / Notice */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] flex items-center space-x-3">
            <AlertTriangle className="w-4 h-4 text-[#245A91] flex-shrink-0" />
            <p className="text-[11px] text-[#475467] dark:text-[#CBD5E1]">
              {lang === 'ru' ? (
                <>
                  Изменение даты или аудитории экзамена утверждается распоряжением декана. При включенном флажке студенты группы <strong className="text-[#142D4E] dark:text-[#245A91]">{exam.groupId}</strong> получат срочное системное оповещение.
                </>
              ) : (
                <>
                  Changes to an exam date or room are approved by Dean&apos;s directive. When checked below, students in group <strong className="text-[#142D4E] dark:text-[#245A91]">{exam.groupId}</strong> receive an urgent portal alert.
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Exam Date */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#667085] mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#142D4E] dark:text-[#245A91]" />
                <span>{tr(lang, 'Дата проведения экзамена', 'Exam Date')}</span>
              </label>
              <input
                type="text"
                required
                value={date}
                onChange={e => {
                  setDate(e.target.value);
                  if (status === 'scheduled') setStatus('date_changed');
                }}
                placeholder={tr(lang, 'Например: 15 декабря 2026', 'e.g., December 15, 2026')}
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] text-[#0F1D30] dark:text-[#FFFFFF] font-semibold focus:outline-hidden focus:border-[#142D4E] dark:focus:border-[#245A91]"
              />
            </div>

            {/* Exam Time */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#667085] mb-1.5 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-[#142D4E] dark:text-[#245A91]" />
                <span>{tr(lang, 'Время проведения', 'Exam Time')}</span>
              </label>
              <input
                type="text"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                placeholder="10:00 – 14:00"
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] text-[#0F1D30] dark:text-[#FFFFFF] font-mono focus:outline-hidden focus:border-[#142D4E] dark:focus:border-[#245A91]"
              />
            </div>

            {/* Room / Auditorium */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#667085] mb-1.5 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C63740]" />
                <span>{tr(lang, 'Аудитория проведения', 'Exam Room')}</span>
              </label>
              <input
                type="text"
                required
                value={room}
                onChange={e => {
                  setRoom(e.target.value);
                  if (status === 'scheduled') setStatus('room_changed');
                }}
                placeholder={tr(lang, 'Главный корпус, ауд. 312', 'Main Building, Room 312')}
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] text-[#0F1D30] dark:text-[#FFFFFF] focus:outline-hidden focus:border-[#142D4E] dark:focus:border-[#245A91]"
              />
            </div>

            {/* Status in Schedule */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#667085] mb-1.5 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-[#142D4E] dark:text-[#245A91]" />
                <span>{tr(lang, 'Статус в графике сессии', 'Session Schedule Status')}</span>
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ExamStatus)}
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] text-[#0F1D30] dark:text-[#FFFFFF] font-medium focus:outline-hidden focus:border-[#142D4E] dark:focus:border-[#245A91]"
              >
                <option value="scheduled">{tr(lang, 'Штатный график (scheduled)', 'As Scheduled (scheduled)')}</option>
                <option value="date_changed">{tr(lang, 'Перенос даты экзамена (date_changed)', 'Date Rescheduled (date_changed)')}</option>
                <option value="room_changed">{tr(lang, 'Замена аудитории (room_changed)', 'Room Changed (room_changed)')}</option>
                <option value="postponed">{tr(lang, 'Перенос на резервный день (postponed)', 'Postponed to Reserve Date (postponed)')}</option>
                <option value="cancelled">{tr(lang, 'Экзамен отменен (cancelled)', 'Exam Cancelled (cancelled)')}</option>
              </select>
            </div>
          </div>

          {/* Examiner & Commission */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#667085] mb-1.5 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-[#142D4E] dark:text-[#245A91]" />
                <span>{tr(lang, 'Экзаменатор / Председатель', 'Examiner / Chair')}</span>
              </label>
              <input
                type="text"
                required
                value={examiner}
                onChange={e => setExaminer(e.target.value)}
                placeholder={tr(lang, 'Проф. Воронов А.Н.', 'Prof. A.N. Voronov')}
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] text-[#0F1D30] dark:text-[#FFFFFF] focus:outline-hidden focus:border-[#142D4E] dark:focus:border-[#245A91]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#667085] mb-1.5 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-[#667085]" />
                <span>{tr(lang, 'Члены комиссии (если есть)', 'Commission Members (optional)')}</span>
              </label>
              <input
                type="text"
                value={commission}
                onChange={e => setCommission(e.target.value)}
                placeholder={tr(lang, 'Доц. Романова Е.В., доц. Смирнов А.К.', 'Assoc. Prof. E.V. Romanova, A.K. Smirnov')}
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] text-[#0F1D30] dark:text-[#FFFFFF] focus:outline-hidden focus:border-[#142D4E] dark:focus:border-[#245A91]"
              />
            </div>
          </div>

          {/* Consultation and Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#667085] mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#667085]" />
                <span>{tr(lang, 'Предэкзаменационная консультация', 'Pre-Exam Consultation')}</span>
              </label>
              <input
                type="text"
                value={consultation}
                onChange={e => setConsultation(e.target.value)}
                placeholder={tr(lang, '10 декабря в 15:00 (ауд. 312)', 'December 10 at 15:00 (Room 312)')}
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] text-[#0F1D30] dark:text-[#FFFFFF] focus:outline-hidden focus:border-[#142D4E] dark:focus:border-[#245A91]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#667085] mb-1.5 flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#667085]" />
                <span>{tr(lang, 'Формат аттестации', 'Assessment Format')}</span>
              </label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] text-[#0F1D30] dark:text-[#FFFFFF] focus:outline-hidden focus:border-[#142D4E] dark:focus:border-[#245A91]"
              >
                <option value="Устный экзамен по билетам">
                  {tr(lang, 'Устный экзамен по билетам', 'Oral Exam (Exam Tickets)')}
                </option>
                <option value="Письменный экзамен и эссе">
                  {tr(lang, 'Письменный экзамен и эссе', 'Written Exam & Essay')}
                </option>
                <option value="Компьютерное тестирование и кейсы">
                  {tr(lang, 'Компьютерное тестирование и кейсы', 'Computer Testing & Case Studies')}
                </option>
                <option value="Комплексный экзамен (аудирование и собеседование)">
                  {tr(lang, 'Комплексный экзамен (собеседование)', 'Comprehensive Exam (Listening & Oral)')}
                </option>
                <option value="Комиссионная пересдача (Комиссия факультета)">
                  {tr(lang, 'Комиссионная пересдача (Комиссия)', 'Commission Retake (Faculty Board)')}
                </option>
              </select>
            </div>
          </div>

          {/* Change Note / Rationale */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#667085] mb-1.5">
              {tr(lang, 'Официальное основание переноса / примечание деканата', "Official Rationale / Dean's Office Note")}
            </label>
            <textarea
              rows={2}
              value={changeNote}
              onChange={e => setChangeNote(e.target.value)}
              placeholder={tr(
                lang,
                'Распоряжение деканата № 21-Э: дата экзамена перенесена в связи с участием лектора в международном форуме...',
                "Dean's Directive No. 21-E: exam rescheduled due to lecturer's conference attendance...",
              )}
              className="w-full px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] text-[#0F1D30] dark:text-[#FFFFFF] placeholder-[#667085] focus:outline-hidden focus:border-[#142D4E] dark:focus:border-[#245A91]"
            />
          </div>

          {/* Notify Group Checkbox */}
          <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0E1B2D] border border-[#DCE2EA] dark:border-[#1E395B] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <BellRing className="w-4 h-4 text-[#245A91]" />
              <div>
                <span className="font-semibold text-xs text-[#0F1D30] dark:text-[#FFFFFF] block">
                  {tr(lang, `Оповестить группу ${exam.groupId}`, `Notify group ${exam.groupId}`)}
                </span>
                <span className="text-[10px] text-[#667085]">
                  {tr(lang, 'Отправить срочное уведомление всем студентам группы', 'Send urgent notification to all group students')}
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              id="notify-group-check"
              checked={notifyGroup}
              onChange={e => setNotifyGroup(e.target.checked)}
              className="w-4 h-4 rounded text-[#142D4E] border-[#DCE2EA] cursor-pointer"
            />
          </div>

          {/* Buttons Footer */}
          <div className="pt-3 border-t border-[#DCE2EA] dark:border-[#193150] flex flex-wrap items-center justify-between gap-2">
            <div>
              {onReset && exam.status !== 'scheduled' && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-sans font-medium text-[#667085] hover:text-[#C63740] hover:bg-[#F8FAFC] transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{tr(lang, 'Вернуть первоначальный график', 'Restore Original Schedule')}</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-sans text-[#667085] hover:text-[#0F1D30] dark:hover:text-[#FFFFFF] hover:bg-[#F8FAFC] cursor-pointer"
              >
                {tr(lang, 'Отмена', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-[#142D4E] hover:bg-[#0E1F36] text-[#FFFFFF] text-xs font-sans font-semibold border border-[#245A91]/40 shadow-xs cursor-pointer transition-colors disabled:opacity-50 flex items-center space-x-1.5"
              >
                {saving ? (
                  <span>{tr(lang, 'Сохранение...', 'Saving...')}</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#245A91]" />
                    <span>{tr(lang, 'Утвердить изменения', 'Approve Changes')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
