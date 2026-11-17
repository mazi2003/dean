import {
  AssessmentType,
  ExamStatus,
  NotificationKind,
  RequestStatus,
  ScheduleStatus,
  ScheduleType,
} from '../types';

export type Lang = 'ru' | 'en';

export function tr(lang: Lang, ru: string, en: string): string {
  return lang === 'ru' ? ru : en;
}

const SCHEDULE_TYPE_LABELS: Record<ScheduleType, { ru: string; en: string }> = {
  lecture: { ru: 'Лекция', en: 'Lecture' },
  seminar: { ru: 'Семинар', en: 'Seminar' },
  lab: { ru: 'Лабораторная', en: 'Lab' },
  exam: { ru: 'Экзамен', en: 'Exam' },
};

function matchScheduleType(type: string): ScheduleType | null {
  const lower = type.trim().toLowerCase();
  if (lower.includes('семин') || lower.startsWith('sem')) return 'seminar';
  if (lower.includes('лаб') || lower.startsWith('lab')) return 'lab';
  if (lower.includes('экзам') || lower.startsWith('exam')) return 'exam';
  if (lower.includes('лекц') || lower.startsWith('lect')) return 'lecture';
  return null;
}

export function normalizeScheduleType(type: string): ScheduleType {
  return matchScheduleType(type) ?? 'lecture';
}

export function getScheduleTypeLabel(type: string, lang: Lang): string {
  const matched = matchScheduleType(type);
  if (matched) return SCHEDULE_TYPE_LABELS[matched][lang];
  return type;
}

const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, { ru: string; en: string }> = {
  normal: { ru: 'По расписанию', en: 'Scheduled' },
  room_changed: { ru: 'ЗАМЕНА АУДИТОРИИ', en: 'ROOM CHANGED' },
  moved: { ru: 'ПЕРЕНОС ВРЕМЕНИ', en: 'TIME MOVED' },
  cancelled: { ru: 'ОТМЕНЕНО ДЕКАНАТОМ', en: 'CANCELLED BY DEAN' },
};

export function getScheduleStatusLabel(status: ScheduleStatus, lang: Lang): string {
  return SCHEDULE_STATUS_LABELS[status]?.[lang] ?? status;
}

const EXAM_STATUS_LABELS: Record<ExamStatus, { ru: string; en: string }> = {
  scheduled: { ru: 'Штатный график', en: 'Scheduled' },
  date_changed: { ru: 'ДАТА ПЕРЕНЕСЕНА ДЕКАНАТОМ', en: 'DATE RESCHEDULED' },
  room_changed: { ru: 'ЗАМЕНА АУДИТОРИИ', en: 'ROOM CHANGED' },
  postponed: { ru: 'ПЕРЕНЕСЕНО НА РЕЗЕРВНЫЙ ДЕНЬ', en: 'POSTPONED TO RESERVE DAY' },
  cancelled: { ru: 'ЭКЗАМЕН ОТМЕНЕН', en: 'EXAM CANCELLED' },
};

export function getExamStatusLabel(status: ExamStatus, lang: Lang): string {
  return EXAM_STATUS_LABELS[status]?.[lang] ?? status;
}

const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, { ru: string; en: string }> = {
  exam: { ru: 'Экзамен', en: 'Exam' },
  credit: { ru: 'Зачет', en: 'Pass/Fail Credit' },
  coursework: { ru: 'Курсовая работа', en: 'Coursework' },
};

export function getAssessmentTypeLabel(type: AssessmentType, lang: Lang): string {
  return ASSESSMENT_TYPE_LABELS[type]?.[lang] ?? type;
}

const REQUEST_STATUS_LABELS: Record<RequestStatus, { ru: string; en: string }> = {
  submitted: { ru: 'Подано в деканат', en: 'Submitted' },
  in_review: { ru: 'На рассмотрении инспектором', en: 'In Review' },
  needs_info: { ru: 'Требуется уточнение данных', en: 'Needs Clarification' },
  ready: { ru: 'Подписано ЭЦП (Готово)', en: 'Ready (Signed)' },
  rejected: { ru: 'Отклонено деканатом', en: 'Rejected' },
  cancelled: { ru: 'Отозвано студентом', en: 'Cancelled' },
};

const STAFF_REQUEST_STATUS_LABELS: Record<RequestStatus, { ru: string; en: string }> = {
  submitted: { ru: 'Новое', en: 'New' },
  in_review: { ru: 'В работе', en: 'In Review' },
  needs_info: { ru: 'Уточнение', en: 'Needs Info' },
  ready: { ru: 'Подписано ЭЦП', en: 'Signed' },
  rejected: { ru: 'Отклонено', en: 'Rejected' },
  cancelled: { ru: 'Отозвано', en: 'Cancelled' },
};

export function getRequestStatusLabel(
  status: RequestStatus,
  lang: Lang,
  mode: 'student' | 'staff' = 'student'
): string {
  const dict = mode === 'staff' ? STAFF_REQUEST_STATUS_LABELS : REQUEST_STATUS_LABELS;
  return dict[status]?.[lang] ?? status;
}

const NOTIFICATION_KIND_LABELS: Record<NotificationKind, { ru: string; en: string }> = {
  announcement: { ru: 'Приказ / Распоряжение', en: 'Decree / Announcement' },
  deadline: { ru: 'Академический дедлайн', en: 'Academic Deadline' },
  schedule_change: { ru: 'Изменение расписания', en: 'Schedule Change' },
  request_update: { ru: 'Статус заявления', en: 'Request Update' },
};

export function getNotificationKindLabel(kind: NotificationKind, lang: Lang): string {
  return NOTIFICATION_KIND_LABELS[kind]?.[lang] ?? kind;
}

export function getStudyFormLabel(studyForm: string | undefined, lang: Lang): string {
  if (!studyForm) return tr(lang, 'Бюджет', 'State-funded');
  if (lang === 'ru') return studyForm;
  if (studyForm === 'Бюджет') return 'State-funded';
  if (studyForm === 'Контракт') return 'Tuition-based';
  return studyForm;
}

export function getGradeDescription(grade: number, lang: Lang): string {
  if (lang === 'ru') {
    return grade === 5 ? 'Отлично' : grade === 4 ? 'Хорошо' : 'Удовл.';
  }
  return grade === 5 ? 'Excellent' : grade === 4 ? 'Good' : grade === 3 ? 'Satisfactory' : 'Fail';
}

const RU_TO_EN_DICTIONARY: Record<string, string> = {
  // Faculties & Programs
  'Международных отношений': 'School of International Relations',
  'Факультет международных отношений': 'School of International Relations',
  'Деканат Факультета МО': 'Dean\'s Office, School of International Relations',
  'Административное управление': 'Academic Administration',
  'Международные отношения (Бакалавриат)': 'International Relations (B.A.)',
  'Мировая экономика (Бакалавриат)': 'World Economy (B.A.)',
  'Дипломатическая служба (Магистратура)': 'Diplomatic Service (M.A.)',
  'Международное публичное право (Бакалавриат)': 'International Public Law (B.A.)',

  // Subjects
  'Дипломатический протокол': 'Diplomatic Protocol',
  'Международное публичное право': 'International Public Law',
  'Английский язык для дипломатов': 'English for Diplomacy',
  'Макроэкономика': 'Macroeconomics',
  'Политическая философия': 'Political Philosophy',
  'Политическая философия и этика': 'Political Philosophy & Ethics',
  'Физическая культура и спорт': 'Physical Education & Sports',
  'Физическая культура': 'Physical Education',
  'Русский язык как иностранный / Стилистика': 'Russian as a Foreign Language / Stylistics',
  'Русский язык как иностранный': 'Russian as a Foreign Language',
  'Статистика в международных исследованиях': 'Statistics in International Studies',
  'Статистика': 'Statistics',
  'Статистика (Пересдача)': 'Statistics (Retake)',
  'Военная кафедра / Факультатив': 'Military Studies / Elective',
  'Мировые финансовые рынки': 'Global Financial Markets',
  'Международные валютно-финансовые рынки': 'International Currency & Financial Markets',
  'Эконометрика и анализ данных': 'Econometrics & Data Analysis',
  'Эконометрика и анализ больших данных': 'Econometrics & Big Data Analysis',
  'Международная торговля': 'International Trade',
  'Мировая экономика и международная торговля': 'World Economy & International Trade',
  'Консультация перед пересдачей: Статистика': 'Pre-Retake Consultation: Statistics',
  'Иностранный язык в сфере экономики': 'Foreign Language for Economics',
  'Корпоративные финансы': 'Corporate Finance',
  'История дипломатических отношений': 'History of Diplomatic Relations',
  'Математическая статистика и анализ данных': 'Mathematical Statistics & Data Analysis',
  'Современная дипломатическая практика': 'Contemporary Diplomatic Practice',
  'Переговорный процесс в условиях кризисов': 'Crisis Negotiation Process',
  'Теория государства и международного права': 'Theory of State & International Law',
  'Римское частное право': 'Roman Private Law',
  'Новая дисциплина': 'New Discipline',

  // Exam formats
  'Устный экзамен по билетам': 'Oral Examination',
  'Письменный экзамен и эссе': 'Written Exam & Essay',
  'Комплексный экзамен (аудирование и собеседование)': 'Comprehensive Exam (Listening & Oral)',
  'Комиссионная пересдача (Комиссия факультета)': 'Committee Retake (Faculty Board)',
  'Компьютерное тестирование и кейсы': 'Computer-Based Testing & Case Studies',
  'Письменный экзамен и решение кейсов': 'Written Exam & Case Analysis',
  'Практический экзамен в лаборатории': 'Practical Lab Examination',
  'Защита аналитических записок': 'Policy Brief Defense',
  'Ситуационный анализ и дебаты': 'Situational Analysis & Debates',
  'Письменная работа по казусам': 'Case Law Written Exam',
  'Экзамен': 'Exam',
  'Дифференцированный зачет': 'Graded Credit',
  'Комиссионная пересдача': 'Committee Retake',

  // Request types
  'Справка об обучении': 'Enrollment Certificate',
  'Официальное подтверждение статуса студента для визовых центров, налоговой или работы.':
    'Official confirmation of student enrollment for visa centers, tax offices, or employers.',
  'Справка для военкомата (Приложение №4)': 'Military Registration Certificate (Form 4)',
  'Для подтверждения отсрочки от призыва в Вооруженные Силы РФ.':
    'Official enrollment confirmation for military service deferment.',
  'Заявление на повышенную стипендию': 'Merit Scholarship Application',
  'За особые достижения в учебной, научно-исследовательской или общественной деятельности.':
    'Application for enhanced academic, research, or extracurricular merit scholarship.',
  'Транскрипт (Академическая справка)': 'Academic Transcript',
  'Выписка всех изученных дисциплин с часами, кредитами и оценками (в т.ч. на английском языке).':
    'Official record of all completed courses with hours, ECTS credits, and grades.',
  'Заявление на место в общежитии': 'Dormitory Housing Application',
  'Предоставление места проживания в студенческом городке университета.':
    'Application for student accommodation in the university campus dormitories.',
  'Заявление на академический отпуск': 'Academic Leave Application',
  'Оформление временного перерыва в обучении по медицинским или семейным обстоятельствам.':
    'Request for temporary leave of absence due to medical or family reasons.',
};

export function localizeText(text: string | undefined | null, lang: Lang): string {
  if (!text) return '';
  if (lang === 'ru') return text;
  return RU_TO_EN_DICTIONARY[text] ?? text;
}
