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
  'Деканат Факультета МО': "Dean's Office, School of International Relations",
  'Административное управление': 'Academic Administration',
  'Международные отношения (Бакалавриат)': 'International Relations (B.A.)',
  'Мировая экономика (Бакалавриат)': 'World Economy (B.A.)',
  'Дипломатическая служба (Магистратура)': 'Diplomatic Service (M.A.)',
  'Международное публичное право (Бакалавриат)': 'International Public Law (B.A.)',

  // Subjects
  'Дипломатический протокол': 'Diplomatic Protocol',
  'Международное публичное право': 'International Public Law',
  'Английский язык для дипломатов': 'English for Diplomacy',
  Макроэкономика: 'Macroeconomics',
  'Политическая философия': 'Political Philosophy',
  'Политическая философия и этика': 'Political Philosophy & Ethics',
  'Физическая культура и спорт': 'Physical Education & Sports',
  'Физическая культура': 'Physical Education',
  'Русский язык как иностранный / Стилистика': 'Russian as a Foreign Language / Stylistics',
  'Русский язык как иностранный': 'Russian as a Foreign Language',
  'Статистика в международных исследованиях': 'Statistics in International Studies',
  Статистика: 'Statistics',
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
  Экзамен: 'Exam',
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
  'Для подачи документов на международную стажировку': 'For international internship application',
  'По месту требования': 'To Whom It May Concern',
  'В визовый центр': 'To Visa Application Center',
  'Двуязычный (RU/EN)': 'Bilingual (RU/EN)',

  // Notifications: Titles & Bodies
  'Справка об обучении в обработке': 'Enrollment Certificate in Processing',
  'Ваше заявление передано на подпись в деканат.':
    'Your application has been forwarded for signature at the Dean\'s Office.',
  'Требуется уточнение по заявлению на общежитие':
    'Clarification Required: Dormitory Housing Application',
  'Пожалуйста, загрузите справку о доходах.':
    'Please upload your family income statement.',
  'Замена аудитории (Международное право)': 'Room Change: International Law',
  'Семинар перенесен в ауд. Б-115.': 'Seminar relocated to Room B-115.',
  'Прием заявок на ПГАС до 25 ноября': 'Merit Scholarship Applications Open until Nov 25',
  'Подайте документы через раздел «Справки и заявления».':
    'Submit supporting documents via the "Certificates & Petitions" tab.',
  'Опубликован график зимней экзаменационной сессии':
    'Winter Examination Schedule Published',
  'Проверьте даты консультаций и экзаменов во вкладке «Расписание».':
    'Check consultation and exam dates in the "Timetable" section.',
  'Утверждено расписание зимней экзаменационной сессии':
    'Winter Examination Schedule Approved',
  'График экзаменов и предэкзаменационных консультаций доступен в личных кабинетах студентов.':
    'Exam and consultation schedules are now available in student accounts.',
  'Сроки ликвидации академических задолженностей':
    'Academic Debt Clearance Deadlines',
  'Внимание студентам! График комиссионных пересдач осеннего семестра утвержден. Пересдачи пройдут с 24 по 30 ноября. Пожалуйста, согласуйте допуск в деканате.':
    'Attention students! The fall semester committee retake schedule is approved. Retakes will take place Nov 24–30. Please confirm admission at the Dean\'s Office.',
  'Прием заявлений на повышенную стипендию (ПГАС)':
    'Merit Scholarship (PGAS) Applications Open',
  'Прием заявлений и подтверждающих документов на ПГАС открыт до 25 ноября. Подать заявление можно через раздел "Справки и заявления".':
    'Applications and supporting documents for PGAS are open until Nov 25. Submit via "Certificates & Petitions".',
  'Деканат Факультета международных отношений опубликовал график консультаций и экзаменов на декабрь 2026 года. Проверьте даты и аудитории в разделе «Расписание».':
    'The Faculty Dean\'s Office has published the December 2026 exam and consultation schedule. Check dates and rooms in "Timetable".',
  'Временное изменение аудиторий в корпусе Б':
    'Temporary Room Relocations in Bldg B',
  'В связи с плановой модернизацией мультимедийного оборудования часть семинаров группы ДУ-205 перенесена в аудитории главного корпуса. Следите за статусом пар в расписании.':
    'Due to multimedia equipment modernization, select seminars for group DU-205 are relocated to the Main Bldg. Monitor timetable status.',
  'График работы деканата в праздничные дни':
    'Dean\'s Office Holiday Operating Hours',
  'Информируем о режиме работы учебного офиса DemoTech University: в государственные праздничные дни прием очных заявлений не ведется, электронные заявки принимаются круглосуточно.':
    'Notice on DemoTech University academic office hours: in-person desk is closed on public holidays; online requests are accepted 24/7.',
  'Плановый профилактический медосмотр студентов':
    'Annual Student Health Screening',
  'До 30 ноября студентам 1–3 курсов необходимо пройти ежегодный флюорографический осмотр в университетской поликлинике (корпус Д, каб. 104).':
    'Students of Years 1–3 must complete the annual chest X-ray screening at the university clinic (Bldg D, Rm 104) by Nov 30.',
  'Конкурс на программы академической мобильности (весна 2027)':
    'Academic Mobility Exchange Program (Spring 2027)',
  'Открыт прием заявок на семестровый обмен для студентов 2 курса. Дедлайн подачи мотивационного письма и транскрипта — 1 декабря.':
    'Semester exchange applications open for 2nd year students. Deadline for motivation letter and transcript is Dec 1.',
  'Предзащита курсовых проектов магистратуры':
    'Master\'s Coursework Project Pre-Defense',
  'Студентам группы ДУ-301 необходимо загрузить черновики аналитических докладов куратору до 5 декабря для допуска к итоговой защите.':
    'Group DU-301 students must upload draft reports to their advisor by Dec 5 for final defense clearance.',
  'Адаптационный семинар и продление пропусков СКУД для 1 курса':
    'Freshman Orientation & Campus Pass Extension',
  'Для студентов группы ДУ-102 в аудитории 112 пройдет встреча с куратором по вопросам сессии и обновления электронных пропусков.':
    'Group DU-102 meeting with mentor in Rm 112 regarding exam session and digital passes.',
  'Заявка принята в обработку': 'Application Accepted for Processing',
  'Ваша справка об обучении переведена в статус "В обработке". Срок готовности — до завтра.':
    'Your enrollment certificate status is now "In Review". Ready by tomorrow.',
  'Перенос аудитории на сегодня!': 'Classroom Relocated Today!',
  'Пара "Международное публичное право" в 10:15 перенесена из А-101 в Б-115.':
    'Class "International Public Law" at 10:15 relocated from A-101 to B-115.',
  'Прием документов на повышенную стипендию':
    'Merit Scholarship Applications Open',
  'Деканат открыл прием заявлений на ПГАС за достижения в науке и учебе до 25 ноября включительно.':
    'Dean\'s Office opened applications for enhanced merit scholarships until Nov 25.',
  'Требуется уточнение по заявке на общежитие':
    'Clarification Required for Dormitory Petition',
  'Инспектор запросил скан справки о доходах семьи за 6 месяцев. Откройте заявку для отправки данных.':
    'Inspector requested a 6-month family income statement. Open petition to submit document.',
  'Назначена дата пересдачи по Статистике': 'Statistics Retake Date Scheduled',
  'Комиссионная пересдача состоится 28 ноября в 14:00 в аудитории А-314. Явка обязательна!':
    'Committee retake scheduled for Nov 28 at 14:00 in Rm A-314. Attendance is mandatory!',
  'Транскрипт готов к получению': 'Transcript Ready for Download',
  'Ваш двуязычный транскрипт сформирован (демо-макет) и доступен для скачивания.':
    'Your bilingual transcript is generated and ready for download.',
  'График зимней экзаменационной сессии': 'Winter Exam Session Schedule',
  'Расписание экзаменов для 2 курса факультета МО утверждено и опубликовано в разделе "Успеваемость".':
    'Exam timetable for 2nd year students is approved and published in the "Records" tab.',
  'Флюорографический осмотр студентов': 'Annual Medical Screening',
  'С 20 по 24 ноября в поликлинике университета проходит обязательный плановый медосмотр.':
    'Mandatory scheduled health screening held at the university clinic Nov 20–24.',
  'Отмена занятия во вторник': 'Class Cancelled on Tuesday',
  'Семинар по Политической философии в 12:00 отменен (участие лектора в симпозиуме).':
    'Political Philosophy seminar at 12:00 is cancelled (lecturer attending symposium).',
  'Ваше заявление зарегистрировано и передано на рассмотрение в деканат.':
    'Your application has been registered and forwarded to the Dean\'s Office for review.',

  // Inspector Remarks & History Comments
  'Заявление принято в работу канцелярией. Проводится верификация данных.':
    'Petition accepted by the Registry. Data verification in progress.',
  'Заявление принято инспектором деканата в обработку':
    'Application accepted for processing by Dean\'s Office inspector',
  'Пожалуйста, приложите справку о составе семьи и доходах':
    'Please attach proof of family composition and income',
  'Академический транскрипт сформирован и готов к выдаче':
    'Academic transcript generated and ready for issuance',
  'Принято в работу': 'Accepted into workflow',
  'Заявка принята в работу инспектором деканата Волковой М.В. Формируется электронный макет справки.':
    'Application accepted into workflow by Dean\'s Office inspector M.V. Volkova. Electronic certificate layout is in progress.',
  'Необходимо прикрепить скан справки о доходах семьи за последние 6 месяцев для расчета баллов на заселение.':
    'Please attach scanned family income statement for the last 6 months to compute housing points.',
  'Электронный макет транскрипта сформирован (демонстрационная печать и QR-код). Доступен для просмотра и скачивания в личном кабинете.':
    'Digital transcript layout generated. Available for viewing and download in your portal.',

  // Additional Subjects
  'Дипломатический протокол и этикет': 'Diplomatic Protocol & Etiquette',
  'Статистика (Комиссионная пересдача)': 'Statistics (Faculty Committee Retake)',

  // Request Catalog Titles & Descriptions
  'Официальная справка о статусе обучающегося': 'Official student status confirmation',
  'Воинский учет': 'Military Registration',
  'Заявление на повышенную стипендию (ПГАС)': 'Merit Scholarship Application (PGAS)',
  'Конкурс достижений': 'Merit Competition',
  'Академический отпуск': 'Academic Leave',
  'Временный перерыв в обучении': 'Temporary Study Break',
  'Академическая справка (Транскрипт)': 'Academic Transcript',
  'Выписка оценок и кредитов ECTS': 'Transcript of grades and ECTS credits',
  'Заявление на предоставление общежития': 'Dormitory Housing Application',
  'Заселение в студгородок': 'Campus Housing Accommodations',

  // Rooms & Locations
  'Ауд. А-204': 'Rm. A-204',
  'Ауд. А-314': 'Rm. A-314',
  'А-204': 'A-204',
  'Б-115': 'B-115',
  'Лингво-2': 'Linguo-2',
  'Актовый зал 3': 'Assembly Hall 3',
  'В-302': 'V-302',
  'Спорткомплекс': 'Sports Complex',
  'А-312': 'A-312',
  'Компьютерный класс 4': 'Computer Lab 4',
  'Б-208': 'B-208',
  'В-114': 'V-114',
  'Корпус В': 'Bldg V',
  'Э-301': 'E-301',
  'Комп-Класс 1': 'Computer Lab 1',
  'Э-102': 'E-102',
  'А-314': 'A-314',
  'Лингво-4': 'Linguo-4',
  'Э-204': 'E-204',
  'Главный корпус, ауд. 312': 'Main Bldg, Rm 312',
  'Конференц-зал Б': 'Conference Hall B',
  'Лингво-класс 2': 'Linguo Lab 2',
  'Ауд. 214': 'Rm 214',
  'Компьютерный класс 208': 'Computer Lab 208',
  'Ауд. Э-301': 'Rm E-301',
  'Лаборатория 104': 'Lab 104',
  'Зал Ученого совета': 'Academic Senate Hall',
  'Ауд. 320': 'Rm 320',
  'Ауд. 112': 'Rm 112',
  'Ауд. 115': 'Rm 115',
  'Лаб-3': 'Lab-3',

  // Dates & Hours
  '16 декабря 2026': 'Dec 16, 2026',
  '28 декабря 2026': 'Dec 28, 2026',
  '26 декабря в 15:00': 'Dec 26 at 15:00',
  '28 ноября, 14:00': 'Nov 28, 14:00',
  '28 ноября 2026 г.': 'Nov 28, 2026',
  '28 ноября 2026': 'Nov 28, 2026',
  '30 ноября 2026': 'Nov 30, 2026',
  '1 декабря 2026': 'Dec 1, 2026',
  '5 декабря 2026': 'Dec 5, 2026',
  'Каб. 312 • Пн-Пт 9-18': 'Rm 312 • Mon–Fri 9–18',

  // Institutional Names & Orders
  'ДЕМОТЕХ УНИВЕРСИТЕТ': 'DEMOTECH UNIVERSITY',
  'ДемоТех Университет': 'DemoTech University',
  'Факультет международных отношений и цифровой дипломатии': 'Faculty of International Relations & Digital Diplomacy',
  'Факультет международных отношений • Деканат': "Faculty of International Relations • Dean's Office",
  'Единый деканат факультета международных отношений': "Unified Dean's Office of Faculty of International Relations",
  'Кафедра международных отношений': 'Department of International Relations',
  'Приказ № 841-СТ от 25.08.2024 г.': 'Decree No. 841-ST of Aug 25, 2024',
  'Приказ № 841-СТ': 'Decree No. 841-ST',
  'Основание выдачи:': 'Matriculation Order:',
  'Студенческий билет № ': 'Student ID No. ',
  'АКТИВЕН ДО 31.08.2026': 'VALID THRU 31.08.2026',
  'МИНОБРНАУКИ РОССИИ • ГОСАККРЕДИТАЦИЯ': 'STATE ACCREDITED UNIVERSITY',

  // Exam Formats
  'Письменная работа + защита': 'Written Paper + Defense',
  'Письменная работа + защита (4 ECTS)': 'Written Paper + Defense (4 ECTS)',
  'Письменная работа': 'Written Exam',
  'Устный экзамен': 'Oral Exam',
  'Компьютерное тестирование': 'Computerized Testing',
  'Комиссионный экзамен': 'Commission Examination',
  'Зачет с оценкой': 'Graded Credit',
  'Зачет': 'Credit',

  // Request Reasons, Purposes & Form Values
  'По месту работы родителей': "For parents' employment verification",
  'Перевод в корпус №2 студгородка': 'Transfer to Dormitory Building No. 2',
  'RU / EN (билингвальный макет)': 'RU / EN (Bilingual Layout)',
  'Для предоставления в банк': 'For bank loan verification',
  'Для визового центра': 'For visa processing centre',
  'Для военкомата': 'For military enlistment office',
  'Общежитие №2': 'Dormitory No. 2',
  'Корпус №2': 'Building No. 2',

  // Student & Staff Names (RU -> EN)
  'Мария Волкова (Сотрудник деканата)': "Maria Volkova (Dean's Office Staff)",
  'Мария Волкова': 'Maria Volkova',
  Мария: 'Maria',
  'Айгуль Нурова': 'Aigul Nurova',
  Айгуль: 'Aigul',
  'Тимур Белов': 'Timur Belov',
  Тимур: 'Timur',
  'Лина Окафор': 'Lina Okafor',
  Лина: 'Lina',
  'Даниил Морозов': 'Daniil Morozov',
  Даниил: 'Daniil',
  'София Ким': 'Sofia Kim',
  София: 'Sofia',
  'Максим Волков': 'Maxim Volkov',
  Максим: 'Maxim',
  'Анна Васильева': 'Anna Vasilieva',
  Анна: 'Anna',
  'Алина Захарова': 'Alina Zakharova',
  Алина: 'Alina',
  'Артур Гаспарян': 'Artur Gasparyan',
  Артур: 'Artur',
  'Екатерина Попова': 'Ekaterina Popova',
  Екатерина: 'Ekaterina',
  'Кирилл Лебедев': 'Kirill Lebedev',
  Кирилл: 'Kirill',
  'Дмитрий Савельев': 'Dmitry Savelev',
  Дмитрий: 'Dmitry',
  'Елена Орлова': 'Elena Orlova',
  Елена: 'Elena',
  'Полина Сергеева': 'Polina Sergeeva',
  Полина: 'Polina',
  'Роман Кузнецов': 'Roman Kuznetsov',
  Роман: 'Roman',

  // Dormitory & Residence Info
  'Проживание по постоянной регистрации (г. Москва)': 'Permanent Residence (Moscow)',
  'Студгородок №1, корп. 2, комн. 415': 'Campus Dormitory No. 1, Bldg 2, Rm 415',
};

const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
  А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ё: 'Yo', Ж: 'Zh', З: 'Z', И: 'I',
  Й: 'Y', К: 'K', Л: 'L', М: 'M', Н: 'N', О: 'O', П: 'P', Р: 'R', С: 'S', Т: 'T',
  У: 'U', Ф: 'F', Х: 'Kh', Ц: 'Ts', Ч: 'Ch', Ш: 'Sh', Щ: 'Shch', Ъ: '', Ы: 'Y',
  Ь: '', Э: 'E', Ю: 'Yu', Я: 'Ya',
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y',
  ь: '', э: 'e', ю: 'yu', я: 'ya',
};

export function transliterateCyrillic(str: string): string {
  return str
    .split('')
    .map((char) => CYRILLIC_TO_LATIN_MAP[char] ?? char)
    .join('');
}

export function localizePersonName(name: string | undefined | null, lang: Lang): string {
  if (!name) return '';
  if (lang === 'ru') return name;
  const trimmed = name.trim();
  const direct = RU_TO_EN_DICTIONARY[trimmed];
  if (direct) return direct;
  if (trimmed.includes('(Сотрудник деканата)')) {
    const base = trimmed.replace('(Сотрудник деканата)', '').trim();
    return `${localizePersonName(base, lang)} (Dean's Office Staff)`;
  }
  return transliterateCyrillic(trimmed);
}

export function formatNotificationDate(dateStr: string | undefined | null, lang: Lang): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function localizeText(text: string | undefined | null, lang: Lang): string {
  if (!text) return '';
  if (lang === 'ru') return text;
  
  const direct = RU_TO_EN_DICTIONARY[text];
  if (direct) return direct;

  if (text.startsWith('Заявление принято: ')) {
    const sub = text.replace('Заявление принято: ', '');
    return `Petition Registered: ${localizeText(sub, lang)}`;
  }
  if (text.startsWith('Статус заявления изменен: ')) {
    const sub = text.replace('Статус заявления изменен: ', '');
    return `Petition Status Updated: ${localizeText(sub, lang)}`;
  }
  if (text.startsWith('Утвержден экзамен: ')) {
    const sub = text.replace('Утвержден экзамен: ', '');
    return `Exam Confirmed: ${localizeText(sub, lang)}`;
  }

  let result = text;
  let isTeacher = false;

  // Teacher prefix localization
  if (/^(?:проф\.|Проф\.)\s*/.test(result)) {
    result = result.replace(/^(?:проф\.|Проф\.)\s*/, 'Prof. ');
    isTeacher = true;
  } else if (/^(?:доц\.|Доц\.)\s*/.test(result)) {
    result = result.replace(/^(?:доц\.|Доц\.)\s*/, 'Assoc. Prof. ');
    isTeacher = true;
  } else if (/^(?:ст\.\s*преп\.|Ст\.\s*преп\.)\s*/.test(result)) {
    result = result.replace(/^(?:ст\.\s*преп\.|Ст\.\s*преп\.)\s*/, 'Sr. Lect. ');
    isTeacher = true;
  } else if (/^(?:преп\.|Преп\.)\s*/.test(result)) {
    result = result.replace(/^(?:преп\.|Преп\.)\s*/, 'Lect. ');
    isTeacher = true;
  } else if (/^(?:чл\.-корр\.|Чл\.-корр\.)\s*/.test(result)) {
    result = result.replace(/^(?:чл\.-корр\.|Чл\.-корр\.)\s*/, 'Corr. Member ');
    isTeacher = true;
  } else if (/^(?:кафедра|Кафедра)\s*/.test(result)) {
    result = result.replace(/^(?:кафедра|Кафедра)\s*/, 'Dept. ');
    isTeacher = true;
  }

  // Room prefix localization
  if (/^(?:ауд\.|Ауд\.)\s*/.test(result)) {
    result = result.replace(/^(?:ауд\.|Ауд\.)\s*/, 'Rm. ');
  } else if (/^(?:лаб-|Лаб-)/.test(result)) {
    result = result.replace(/^(?:лаб-|Лаб-)/, 'Lab-');
  }

  // Transliterate teacher Cyrillic name to Latin
  if (isTeacher || /[А-ЯЁ][а-яё]+\s+[А-ЯЁ]\s*\.\s*[А-ЯЁ]\s*\./.test(result)) {
    result = transliterateCyrillic(result);
  }

  return result;
}
