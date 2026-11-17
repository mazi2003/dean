import React, { useState, useEffect } from 'react';
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
  Sparkles,
  CheckCircle2,
  BookOpen,
  Users,
} from 'lucide-react';
import { ExamEntry, ExamStatus } from '../types';

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
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [room, setRoom] = useState('');
  const [examiner, setExaminer] = useState('');
  const [commission, setCommission] = useState('');
  const [consultation, setConsultation] = useState('');
  const [format, setFormat] = useState('');
  const [status, setStatus] = useState<ExamStatus>('scheduled');
  const [changeNote, setChangeNote] = useState('');
  const [notifyGroup, setNotifyGroup] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (exam) {
      setDate(exam.date || '');
      setTime(exam.time || '10:00 – 14:00');
      setRoom(exam.room || '');
      setExaminer(exam.examiner || '');
      setCommission(exam.commissionMembers || '');
      setConsultation(exam.consultation || '');
      setFormat(exam.format || 'Устный экзамен по билетам');
      setStatus(exam.status || 'scheduled');
      setChangeNote(exam.changeNote || '');
      setNotifyGroup(true);
    }
  }, [exam]);

  if (!isOpen || !exam) return null;

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
      <div className="bg-white dark:bg-[#161F1A] rounded-2xl max-w-2xl w-full border border-[#E3DDD1] dark:border-[#2D3E35] shadow-2xl overflow-hidden my-auto animate-scale-up">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#FAF8F3] dark:bg-[#111714] border-b border-[#E3DDD1] dark:border-[#26362F] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#183D35] text-[#C4A46B] flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#183D35] text-[#C4A46B]">
                  ГРУППА {exam.groupId}
                </span>
                <span className="text-[11px] font-mono text-[#7E877B]">{exam.code}</span>
              </div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-[#183D35] dark:text-[#F3EFE5] mt-0.5">
                Распоряжение деканата: график экзамена
              </h2>
              <p className="text-xs text-[#7E877B] font-sans truncate max-w-md">
                {exam.subject}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7E877B] hover:text-[#252923] dark:hover:text-[#F3EFE5] hover:bg-[#EAE4D7] dark:hover:bg-[#1A2520] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs font-sans">
          {/* Quick Warning / Notice */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] flex items-center space-x-3">
            <AlertTriangle className="w-4 h-4 text-[#C4A46B] flex-shrink-0" />
            <p className="text-[11px] text-[#575F53] dark:text-[#C8D1CA]">
              Изменение даты или аудитории экзамена утверждается распоряжением декана. При включенном флажке студенты группы <strong className="text-[#183D35] dark:text-[#C4A46B]">{exam.groupId}</strong> получат срочное системное оповещение.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Exam Date */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E877B] mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#183D35] dark:text-[#C4A46B]" />
                <span>Дата проведения экзамена</span>
              </label>
              <input
                type="text"
                required
                value={date}
                onChange={e => {
                  setDate(e.target.value);
                  if (status === 'scheduled') setStatus('date_changed');
                }}
                placeholder="Например: 15 декабря 2026"
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] text-[#252923] dark:text-[#F3EFE5] font-semibold focus:outline-hidden focus:border-[#183D35] dark:focus:border-[#C4A46B]"
              />
            </div>

            {/* Exam Time */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E877B] mb-1.5 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-[#183D35] dark:text-[#C4A46B]" />
                <span>Время проведения</span>
              </label>
              <input
                type="text"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                placeholder="10:00 – 14:00"
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] text-[#252923] dark:text-[#F3EFE5] font-mono focus:outline-hidden focus:border-[#183D35] dark:focus:border-[#C4A46B]"
              />
            </div>

            {/* Room / Auditorium */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E877B] mb-1.5 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#A33D35]" />
                <span>Аудитория проведения</span>
              </label>
              <input
                type="text"
                required
                value={room}
                onChange={e => {
                  setRoom(e.target.value);
                  if (status === 'scheduled') setStatus('room_changed');
                }}
                placeholder="Главный корпус, ауд. 312"
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] text-[#252923] dark:text-[#F3EFE5] focus:outline-hidden focus:border-[#183D35] dark:focus:border-[#C4A46B]"
              />
            </div>

            {/* Status in Schedule */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E877B] mb-1.5 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-[#183D35] dark:text-[#C4A46B]" />
                <span>Статус в графике сессии</span>
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ExamStatus)}
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] text-[#252923] dark:text-[#F3EFE5] font-medium focus:outline-hidden focus:border-[#183D35] dark:focus:border-[#C4A46B]"
              >
                <option value="scheduled">Штатный график (scheduled)</option>
                <option value="date_changed">Перенос даты экзамена (date_changed)</option>
                <option value="room_changed">Замена аудитории (room_changed)</option>
                <option value="postponed">Перенос на резервный день (postponed)</option>
                <option value="cancelled">Экзамен отменен (cancelled)</option>
              </select>
            </div>
          </div>

          {/* Examiner & Commission */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E877B] mb-1.5 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-[#183D35] dark:text-[#C4A46B]" />
                <span>Экзаменатор / Председатель</span>
              </label>
              <input
                type="text"
                required
                value={examiner}
                onChange={e => setExaminer(e.target.value)}
                placeholder="Проф. Воронов А.Н."
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] text-[#252923] dark:text-[#F3EFE5] focus:outline-hidden focus:border-[#183D35] dark:focus:border-[#C4A46B]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E877B] mb-1.5 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-[#7E877B]" />
                <span>Члены комиссии (если есть)</span>
              </label>
              <input
                type="text"
                value={commission}
                onChange={e => setCommission(e.target.value)}
                placeholder="Доц. Романова Е.В., доц. Смирнов А.К."
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] text-[#252923] dark:text-[#F3EFE5] focus:outline-hidden focus:border-[#183D35] dark:focus:border-[#C4A46B]"
              />
            </div>
          </div>

          {/* Consultation and Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E877B] mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#7E877B]" />
                <span>Предэкзаменационная консультация</span>
              </label>
              <input
                type="text"
                value={consultation}
                onChange={e => setConsultation(e.target.value)}
                placeholder="10 декабря в 15:00 (ауд. 312)"
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] text-[#252923] dark:text-[#F3EFE5] focus:outline-hidden focus:border-[#183D35] dark:focus:border-[#C4A46B]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E877B] mb-1.5 flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#7E877B]" />
                <span>Формат аттестации</span>
              </label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] text-[#252923] dark:text-[#F3EFE5] focus:outline-hidden focus:border-[#183D35] dark:focus:border-[#C4A46B]"
              >
                <option value="Устный экзамен по билетам">Устный экзамен по билетам</option>
                <option value="Письменный экзамен и эссе">Письменный экзамен и эссе</option>
                <option value="Компьютерное тестирование и кейсы">Компьютерное тестирование и кейсы</option>
                <option value="Комплексный экзамен (аудирование и собеседование)">Комплексный экзамен (собеседование)</option>
                <option value="Комиссионная пересдача (Комиссия факультета)">Комиссионная пересдача (Комиссия)</option>
              </select>
            </div>
          </div>

          {/* Change Note / Rationale */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#7E877B] mb-1.5">
              Официальное основание переноса / примечание деканата
            </label>
            <textarea
              rows={2}
              value={changeNote}
              onChange={e => setChangeNote(e.target.value)}
              placeholder="Распоряжение деканата № 21-Э: дата экзамена перенесена в связи с участием лектора в международном форуме..."
              className="w-full px-3 py-2 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] text-[#252923] dark:text-[#F3EFE5] placeholder-[#7E877B] focus:outline-hidden focus:border-[#183D35] dark:focus:border-[#C4A46B]"
            />
          </div>

          {/* Notify Group Checkbox */}
          <div className="p-3 rounded-lg bg-[#FAF8F3] dark:bg-[#121714] border border-[#E3DDD1] dark:border-[#2D3E35] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <BellRing className="w-4 h-4 text-[#C4A46B]" />
              <div>
                <span className="font-semibold text-xs text-[#252923] dark:text-[#F3EFE5] block">
                  Оповестить группу {exam.groupId}
                </span>
                <span className="text-[10px] text-[#7E877B]">
                  Отправить срочное уведомление всем студентам группы
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              id="notify-group-check"
              checked={notifyGroup}
              onChange={e => setNotifyGroup(e.target.checked)}
              className="w-4 h-4 rounded text-[#183D35] border-[#E3DDD1] cursor-pointer"
            />
          </div>

          {/* Buttons Footer */}
          <div className="pt-3 border-t border-[#E3DDD1] dark:border-[#26362F] flex flex-wrap items-center justify-between gap-2">
            <div>
              {onReset && exam.status !== 'scheduled' && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-sans font-medium text-[#7E877B] hover:text-[#A33D35] hover:bg-[#FAF8F3] transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Вернуть первоначальный график</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-sans text-[#7E877B] hover:text-[#252923] dark:hover:text-[#F3EFE5] hover:bg-[#FAF8F3] cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-[#183D35] hover:bg-[#102923] text-[#F3EFE5] text-xs font-sans font-semibold border border-[#C4A46B]/40 shadow-xs cursor-pointer transition-colors disabled:opacity-50 flex items-center space-x-1.5"
              >
                {saving ? (
                  <span>Сохранение...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#C4A46B]" />
                    <span>Утвердить изменения</span>
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
