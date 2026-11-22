import crypto from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { hashPassword } from './password';

function getMonday(d: Date): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d.getTime());
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

function normalizeGroupCode(code?: string | null): string {
  if (!code) return '';
  const trimmed = code.trim().toUpperCase();
  if (trimmed === 'DU-101') return 'ДУ-101';
  if (trimmed === 'DU-205') return 'ДУ-205';
  if (trimmed === 'DU-301') return 'ДУ-301';
  if (trimmed === 'DU-102') return 'ДУ-102';
  return trimmed;
}

async function createFallbackStore() {
  const studentPlain = process.env.SEED_STUDENT_PASSWORD || ['Demo', 'Student', '123!'].join('');
  const staffPlain = process.env.SEED_STAFF_PASSWORD || ['Demo', 'Staff', '123!'].join('');

  const [studentPasswordHash, staffPasswordHash] = await Promise.all([
    hashPassword(studentPlain),
    hashPassword(staffPlain),
  ]);

  const ids = {
    aigulUserId: '11111111-1111-4111-8111-111111111101',
    timurUserId: '11111111-1111-4111-8111-111111111102',
    linaUserId: '11111111-1111-4111-8111-111111111103',
    staffUserId: '11111111-1111-4111-8111-111111111104',
    aigulReqId: '22222222-2222-4222-8222-222222222201',
    timurReqNeedsInfoId: '22222222-2222-4222-8222-222222222202',
    timurReqReadyId: '22222222-2222-4222-8222-222222222203',
  };

  const faculty = {
    id: 'fac-ir-01',
    name: 'Факультет международных отношений',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const programs = [
    { id: 'prog-ir-01', name: 'Международные отношения (Бакалавриат)', facultyId: faculty.id },
    { id: 'prog-we-01', name: 'Мировая экономика (Бакалавриат)', facultyId: faculty.id },
    { id: 'prog-ds-01', name: 'Дипломатическая служба (Магистратура)', facultyId: faculty.id },
    {
      id: 'prog-il-01',
      name: 'Международное публичное право (Бакалавриат)',
      facultyId: faculty.id,
    },
  ];

  const groups = [
    {
      id: 'grp-101',
      code: 'ДУ-101',
      programId: programs[0].id,
      year: 2,
      admissionYear: 2023,
      studentsCount: 28,
      budgetCount: 18,
      contractCount: 10,
      curatorName: 'проф. Лебедев Д.В.',
      curatorContact: 'd.lebedev@demo.edu • Ауд. 314',
      starostaName: 'Айгуль Нурова',
      starostaEmail: 'aigul.nurova@demo.edu',
      starostaPhone: '+7 (999) 123-45-67',
    },
    {
      id: 'grp-205',
      code: 'ДУ-205',
      programId: programs[1].id,
      year: 3,
      admissionYear: 2022,
      studentsCount: 24,
      budgetCount: 14,
      contractCount: 10,
      curatorName: 'доц. Ковалев С.И.',
      curatorContact: 's.kovalev@demo.edu • Ауд. 210',
      starostaName: 'Алина Захарова',
      starostaEmail: 'a.zakharova@demo.edu',
      starostaPhone: '+7 (999) 456-78-90',
    },
    {
      id: 'grp-301',
      code: 'ДУ-301',
      programId: programs[2].id,
      year: 1,
      admissionYear: 2024,
      studentsCount: 16,
      budgetCount: 12,
      contractCount: 4,
      curatorName: 'чл.-корр. Романов Б.С.',
      curatorContact: 'b.romanov@demo.edu • Каб. 320',
      starostaName: 'Дмитрий Савельев',
      starostaEmail: 'd.savelev@demo.edu',
      starostaPhone: '+7 (999) 567-89-01',
    },
    {
      id: 'grp-102',
      code: 'ДУ-102',
      programId: programs[3].id,
      year: 1,
      admissionYear: 2024,
      studentsCount: 30,
      budgetCount: 20,
      contractCount: 10,
      curatorName: 'доц. Громов В.П.',
      curatorContact: 'v.gromov@demo.edu • Ауд. 112',
      starostaName: 'Полина Сергеева',
      starostaEmail: 'p.sergeeva@demo.edu',
      starostaPhone: '+7 (999) 678-90-12',
    },
  ];

  const users = [
    {
      id: ids.aigulUserId,
      email: 'aigul.nurova@demo.edu',
      passwordHash: studentPasswordHash,
      fullName: 'Айгуль Нурова',
      role: 'student',
    },
    {
      id: ids.timurUserId,
      email: 'timur.belov@demo.edu',
      passwordHash: studentPasswordHash,
      fullName: 'Тимур Белов',
      role: 'student',
    },
    {
      id: ids.linaUserId,
      email: 'lina.okafor@demo.edu',
      passwordHash: studentPasswordHash,
      fullName: 'Лина Окафор',
      role: 'student',
    },
    {
      id: ids.staffUserId,
      email: 'dean.office@demo.edu',
      passwordHash: staffPasswordHash,
      fullName: 'Мария Волкова (Сотрудник деканата)',
      role: 'staff',
    },
    {
      id: '11111111-1111-4111-8111-111111111105',
      email: 'd.morozov@demo.edu',
      passwordHash: studentPasswordHash,
      fullName: 'Даниил Морозов',
      role: 'student',
    },
    {
      id: '11111111-1111-4111-8111-111111111106',
      email: 's.kim@demo.edu',
      passwordHash: studentPasswordHash,
      fullName: 'София Ким',
      role: 'student',
    },
    {
      id: '11111111-1111-4111-8111-111111111107',
      email: 'a.zakharova@demo.edu',
      passwordHash: studentPasswordHash,
      fullName: 'Алина Захарова',
      role: 'student',
    },
    {
      id: '11111111-1111-4111-8111-111111111108',
      email: 'd.savelev@demo.edu',
      passwordHash: studentPasswordHash,
      fullName: 'Дмитрий Савельев',
      role: 'student',
    },
    {
      id: '11111111-1111-4111-8111-111111111109',
      email: 'p.sergeeva@demo.edu',
      passwordHash: studentPasswordHash,
      fullName: 'Полина Сергеева',
      role: 'student',
    },
  ];

  const studentProfiles = [
    {
      id: 'sp-aigul',
      userId: ids.aigulUserId,
      facultyId: faculty.id,
      programId: programs[0].id,
      groupId: groups[0].id,
      year: 2,
      studentNumber: 'СТ-2023-0194',
      phone: '+7 (999) 123-45-67',
      studyForm: 'Бюджет',
      isStarosta: true,
      status: 'active',
      dormitoryInfo: 'Проживание по постоянной регистрации (г. Москва)',
      snils: '184-293-841 02',
    },
    {
      id: 'sp-timur',
      userId: ids.timurUserId,
      facultyId: faculty.id,
      programId: programs[1].id,
      groupId: groups[1].id,
      year: 3,
      studentNumber: 'СТ-2022-0082',
      phone: '+7 (999) 234-56-78',
      studyForm: 'Контракт',
      isStarosta: false,
      status: 'active',
      dormitoryInfo: 'Студгородок №1, корп. 2, комн. 415',
      snils: '192-408-512 19',
    },
    {
      id: 'sp-lina',
      userId: ids.linaUserId,
      facultyId: faculty.id,
      programId: programs[0].id,
      groupId: groups[0].id,
      year: 2,
      studentNumber: 'СТ-2023-0215',
      phone: '+7 (999) 345-67-89',
      studyForm: 'Контракт',
      isStarosta: false,
      status: 'active',
      dormitoryInfo: 'Проживание по постоянной регистрации (г. Москва)',
      snils: '175-319-604 44',
    },
    {
      id: 'sp-morozov',
      userId: '11111111-1111-4111-8111-111111111105',
      facultyId: faculty.id,
      programId: programs[0].id,
      groupId: groups[0].id,
      year: 2,
      studentNumber: 'СТ-2023-0142',
      phone: '+7 (999) 456-11-22',
      studyForm: 'Бюджет',
      isStarosta: false,
      status: 'active',
      dormitoryInfo: 'Проживание по постоянной регистрации (г. Москва)',
      snils: '184-293-841 05',
    },
    {
      id: 'sp-kim',
      userId: '11111111-1111-4111-8111-111111111106',
      facultyId: faculty.id,
      programId: programs[0].id,
      groupId: groups[0].id,
      year: 2,
      studentNumber: 'СТ-2023-0188',
      phone: '+7 (999) 567-22-33',
      studyForm: 'Бюджет',
      isStarosta: false,
      status: 'active',
      dormitoryInfo: 'Проживание по постоянной регистрации (г. Москва)',
      snils: '184-293-841 06',
    },
    {
      id: 'sp-zakharova',
      userId: '11111111-1111-4111-8111-111111111107',
      facultyId: faculty.id,
      programId: programs[1].id,
      groupId: groups[1].id,
      year: 3,
      studentNumber: 'СТ-2022-0045',
      phone: '+7 (999) 456-78-90',
      studyForm: 'Бюджет',
      isStarosta: true,
      status: 'active',
      dormitoryInfo: 'Проживание по постоянной регистрации (г. Москва)',
      snils: '184-293-841 07',
    },
    {
      id: 'sp-savelev',
      userId: '11111111-1111-4111-8111-111111111108',
      facultyId: faculty.id,
      programId: programs[2].id,
      groupId: groups[2].id,
      year: 1,
      studentNumber: 'СТ-2024-0012',
      phone: '+7 (999) 567-89-01',
      studyForm: 'Бюджет',
      isStarosta: true,
      status: 'active',
      dormitoryInfo: 'Проживание по постоянной регистрации (г. Москва)',
      snils: '184-293-841 08',
    },
    {
      id: 'sp-sergeeva',
      userId: '11111111-1111-4111-8111-111111111109',
      facultyId: faculty.id,
      programId: programs[3].id,
      groupId: groups[3].id,
      year: 1,
      studentNumber: 'СТ-2024-0051',
      phone: '+7 (999) 678-90-12',
      studyForm: 'Бюджет',
      isStarosta: true,
      status: 'active',
      dormitoryInfo: 'Проживание по постоянной регистрации (г. Москва)',
      snils: '184-293-841 09',
    },
  ];

  const subjects = [
    { id: 'sub-1', name: 'Дипломатический протокол и этикет', credits: 4, semester: 3 },
    { id: 'sub-2', name: 'Международное публичное право', credits: 5, semester: 3 },
    { id: 'sub-3', name: 'Макроэкономика', credits: 5, semester: 3 },
    { id: 'sub-4', name: 'Статистика', credits: 4, semester: 3 },
    { id: 'sub-5', name: 'Политическая философия', credits: 4, semester: 3 },
    { id: 'sub-6', name: 'Английский язык для дипломатов', credits: 3, semester: 3 },
  ];

  const teachers = [
    { id: 'tch-1', fullName: 'проф. Соколов И.В.' },
    { id: 'tch-2', fullName: 'доц. Ковалев С.И.' },
    { id: 'tch-3', fullName: 'проф. Воронов А.Н.' },
  ];

  const rooms = [
    { id: 'rm-1', code: 'А-204', building: 'А', capacity: 60 },
    { id: 'rm-2', code: 'Б-115', building: 'Б', capacity: 40 },
    { id: 'rm-3', code: 'А-314', building: 'А', capacity: 30 },
    { id: 'rm-4', code: 'Лаб-3', building: 'В', capacity: 25 },
  ];

  const monday = getMonday(new Date());
  const scheduleEntries = [
    {
      id: '44444444-4444-4444-8444-444444444401',
      groupId: groups[0].id,
      subjectId: subjects[0].id,
      teacherId: teachers[0].id,
      roomId: rooms[0].id,
      date: addDays(monday, 0),
      startTime: '08:30',
      endTime: '10:05',
      type: 'lecture',
      status: 'normal',
      changeNote: null as string | null,
    },
    {
      id: '44444444-4444-4444-8444-444444444402',
      groupId: groups[0].id,
      subjectId: subjects[1].id,
      teacherId: teachers[2].id,
      roomId: rooms[1].id,
      date: addDays(monday, 1),
      startTime: '10:15',
      endTime: '11:50',
      type: 'seminar',
      status: 'room_changed',
      changeNote: 'Перенос в ауд. Б-115 (ремонт проектора)',
    },
    {
      id: '44444444-4444-4444-8444-444444444403',
      groupId: groups[0].id,
      subjectId: subjects[5].id,
      teacherId: teachers[0].id,
      roomId: rooms[3].id,
      date: addDays(monday, 2),
      startTime: '12:00',
      endTime: '13:35',
      type: 'lab',
      status: 'normal',
      changeNote: null as string | null,
    },
    {
      id: '44444444-4444-4444-8444-444444444405',
      groupId: groups[0].id,
      subjectId: subjects[2].id,
      teacherId: teachers[1].id,
      roomId: rooms[0].id,
      date: addDays(monday, 3),
      startTime: '10:15',
      endTime: '11:50',
      type: 'lecture',
      status: 'normal',
      changeNote: null as string | null,
    },
    {
      id: '44444444-4444-4444-8444-444444444406',
      groupId: groups[0].id,
      subjectId: subjects[4].id,
      teacherId: teachers[2].id,
      roomId: rooms[1].id,
      date: addDays(monday, 4),
      startTime: '12:00',
      endTime: '13:35',
      type: 'seminar',
      status: 'normal',
      changeNote: null as string | null,
    },
    {
      id: '44444444-4444-4444-8444-444444444407',
      groupId: groups[0].id,
      subjectId: subjects[5].id,
      teacherId: teachers[0].id,
      roomId: rooms[3].id,
      date: addDays(monday, 5),
      startTime: '10:15',
      endTime: '11:50',
      type: 'lab',
      status: 'normal',
      changeNote: null as string | null,
    },
    {
      id: '44444444-4444-4444-8444-444444444408',
      groupId: groups[0].id,
      subjectId: subjects[0].id,
      teacherId: teachers[0].id,
      roomId: rooms[0].id,
      date: addDays(monday, 7),
      startTime: '08:30',
      endTime: '10:05',
      type: 'lecture',
      status: 'normal',
      changeNote: null as string | null,
    },
    {
      id: '44444444-4444-4444-8444-444444444404',
      groupId: groups[1].id,
      subjectId: subjects[3].id,
      teacherId: teachers[1].id,
      roomId: rooms[2].id,
      date: addDays(monday, 1),
      startTime: '14:00',
      endTime: '15:35',
      type: 'lab',
      status: 'normal',
      changeNote: null as string | null,
    },
    {
      id: '44444444-4444-4444-8444-444444444409',
      groupId: groups[1].id,
      subjectId: subjects[2].id,
      teacherId: teachers[1].id,
      roomId: rooms[2].id,
      date: addDays(monday, 3),
      startTime: '14:00',
      endTime: '15:35',
      type: 'lecture',
      status: 'normal',
      changeNote: null as string | null,
    },
    {
      id: '44444444-4444-4444-8444-444444444410',
      groupId: groups[1].id,
      subjectId: subjects[3].id,
      teacherId: teachers[1].id,
      roomId: rooms[2].id,
      date: addDays(monday, 7),
      startTime: '10:15',
      endTime: '11:50',
      type: 'seminar',
      status: 'normal',
      changeNote: null as string | null,
    },
  ];

  const futureDate = addDays(monday, 14);
  const futureDate2 = addDays(monday, 21);

  const grades = [
    {
      id: 'grd-a1',
      studentProfileId: 'sp-aigul',
      subjectId: subjects[0].id,
      semester: 3,
      points: 94,
      grade: 5,
      creditStatus: 'earned',
      assessmentType: 'credit',
      examDate: null,
      retakeDate: null,
      teacher: 'проф. Соколов И.В.',
    },
    {
      id: 'grd-a2',
      studentProfileId: 'sp-aigul',
      subjectId: subjects[2].id,
      semester: 3,
      points: 90,
      grade: 5,
      creditStatus: 'earned',
      assessmentType: 'exam',
      examDate: null,
      retakeDate: null,
      teacher: 'доц. Ковалев С.И.',
    },
    {
      id: 'grd-a3',
      studentProfileId: 'sp-aigul',
      subjectId: subjects[4].id,
      semester: 3,
      points: 86,
      grade: 5,
      creditStatus: 'earned',
      assessmentType: 'exam',
      examDate: null,
      retakeDate: null,
      teacher: 'проф. Соколов И.В.',
    },
    {
      id: 'grd-a4',
      studentProfileId: 'sp-aigul',
      subjectId: subjects[5].id,
      semester: 3,
      points: 84,
      grade: 4,
      creditStatus: 'earned',
      assessmentType: 'credit',
      examDate: null,
      retakeDate: null,
      teacher: 'доц. Ковалев С.И.',
    },
    {
      id: 'grd-a5',
      studentProfileId: 'sp-aigul',
      subjectId: subjects[1].id,
      semester: 3,
      points: null,
      grade: null,
      creditStatus: 'in_progress',
      assessmentType: 'exam',
      examDate: futureDate,
      retakeDate: null,
      teacher: 'проф. Воронов А.Н.',
    },
    {
      id: 'grd-t1',
      studentProfileId: 'sp-timur',
      subjectId: subjects[3].id,
      semester: 3,
      points: 48,
      grade: 2,
      creditStatus: 'failed',
      assessmentType: 'exam',
      examDate: futureDate2,
      retakeDate: new Date('2026-11-28T00:00:00.000Z'),
      teacher: 'доц. Ковалев С.И.',
    },
    {
      id: 'grd-t2',
      studentProfileId: 'sp-timur',
      subjectId: subjects[2].id,
      semester: 3,
      points: 78,
      grade: 4,
      creditStatus: 'earned',
      assessmentType: 'exam',
      examDate: null,
      retakeDate: null,
      teacher: 'доц. Ковалев С.И.',
    },
    {
      id: 'grd-l1',
      studentProfileId: 'sp-lina',
      subjectId: subjects[0].id,
      semester: 3,
      points: 76,
      grade: 4,
      creditStatus: 'earned',
      assessmentType: 'credit',
      examDate: null,
      retakeDate: null,
      teacher: 'проф. Соколов И.В.',
    },
    {
      id: 'grd-m1',
      studentProfileId: 'sp-morozov',
      subjectId: subjects[0].id,
      semester: 3,
      points: 82,
      grade: 4,
      creditStatus: 'earned',
      assessmentType: 'credit',
      examDate: null,
      retakeDate: null,
      teacher: 'проф. Соколов И.В.',
    },
    {
      id: 'grd-k1',
      studentProfileId: 'sp-kim',
      subjectId: subjects[0].id,
      semester: 3,
      points: 91,
      grade: 5,
      creditStatus: 'earned',
      assessmentType: 'credit',
      examDate: null,
      retakeDate: null,
      teacher: 'проф. Соколов И.В.',
    },
    {
      id: 'grd-z1',
      studentProfileId: 'sp-zakharova',
      subjectId: subjects[2].id,
      semester: 3,
      points: 93,
      grade: 5,
      creditStatus: 'earned',
      assessmentType: 'exam',
      examDate: null,
      retakeDate: null,
      teacher: 'доц. Ковалев С.И.',
    },
    {
      id: 'grd-s1',
      studentProfileId: 'sp-savelev',
      subjectId: subjects[0].id,
      semester: 3,
      points: 89,
      grade: 5,
      creditStatus: 'earned',
      assessmentType: 'credit',
      examDate: null,
      retakeDate: null,
      teacher: 'проф. Соколов И.В.',
    },
    {
      id: 'grd-sr1',
      studentProfileId: 'sp-sergeeva',
      subjectId: subjects[1].id,
      semester: 3,
      points: 88,
      grade: 5,
      creditStatus: 'earned',
      assessmentType: 'exam',
      examDate: null,
      retakeDate: null,
      teacher: 'проф. Воронов А.Н.',
    },
  ];

  const requestTypes = [
    {
      code: 'study_certificate',
      title: 'Справка об обучении',
      description:
        'Подтверждение статуса студента для визовых центров, налоговой или места работы.',
      slaDays: 2,
      fields: [
        {
          name: 'purpose',
          label: 'Место предъявления',
          labelEn: 'Purpose / Recipient',
          type: 'text',
          required: true,
          placeholder: 'Например: Пенсионный фонд РФ, По месту работы',
        },
        {
          name: 'copies',
          label: 'Количество экземпляров',
          labelEn: 'Number of copies',
          type: 'number',
          required: true,
          placeholder: '1',
        },
        {
          name: 'delivery',
          label: 'Форма получения',
          labelEn: 'Delivery format',
          type: 'select',
          required: true,
          options: ['Электронный макет (PDF, демо)', 'Бумажная в деканате'],
          optionsEn: ['Electronic draft (PDF, demo)', "Paper copy at the Dean's Office"],
        },
        {
          name: 'notes',
          label: 'Дополнительные примечания',
          labelEn: 'Additional notes',
          type: 'textarea',
          required: false,
          placeholder: 'Укажите период или дополнительные требования',
        },
      ],
    },
    {
      code: 'military_certificate',
      title: 'Справка для военкомата (Приложение №4)',
      description: 'Для подтверждения отсрочки от призыва в Вооруженные Силы РФ.',
      slaDays: 3,
      fields: [
        {
          name: 'militaryOffice',
          label: 'Наименование военного комиссариата',
          labelEn: 'Military commissariat name',
          type: 'text',
          required: true,
          placeholder: 'Например: ОВК по Раменскому району г. Москвы',
        },
        {
          name: 'copies',
          label: 'Количество экземпляров',
          labelEn: 'Number of copies',
          type: 'number',
          required: true,
          placeholder: '1',
        },
        {
          name: 'delivery',
          label: 'Способ получения',
          labelEn: 'Delivery method',
          type: 'select',
          required: true,
          options: ['Лично в деканате с оригиналом паспорта', 'Электронная копия (демо-макет)'],
          optionsEn: [
            "In person at the Dean's Office with passport",
            'Electronic copy (demo draft)',
          ],
        },
      ],
    },
    {
      code: 'scholarship_application',
      title: 'Заявление на повышенную стипендию',
      description:
        'За особые достижения в учебной, научно-исследовательской или общественной деятельности.',
      slaDays: 5,
      fields: [
        {
          name: 'category',
          label: 'Категория достижений',
          labelEn: 'Achievement category',
          type: 'select',
          required: true,
          options: [
            'Научно-исследовательская (статьи, конференции)',
            'Учебная (отличная успеваемость)',
            'Общественная и волонтерская',
            'Спортивная',
          ],
          optionsEn: [
            'Research (papers, conferences)',
            'Academic (excellent grades)',
            'Social & volunteering',
            'Sports',
          ],
        },
        {
          name: 'achievements',
          label: 'Перечень подтверждающих документов',
          labelEn: 'Supporting documents list',
          type: 'textarea',
          required: true,
          placeholder: '1. Диплом I степени в олимпиаде...\n2. Публикация в сборнике...',
        },
        {
          name: 'accountNumber',
          label: 'Номер карты "МИР" для начисления',
          labelEn: 'MIR bank card number',
          type: 'text',
          required: true,
          placeholder: '2200 0000 0000 0000',
        },
      ],
    },
    {
      code: 'transcript',
      title: 'Транскрипт (Академическая справка)',
      description:
        'Выписка всех изученных дисциплин с часами, кредитами и оценками (в т.ч. на английском языке).',
      slaDays: 4,
      fields: [
        {
          name: 'language',
          label: 'Язык документа',
          labelEn: 'Document language',
          type: 'select',
          required: true,
          options: ['Русский', 'Английский (English)', 'Двуязычный (RU/EN)'],
          optionsEn: ['Russian', 'English', 'Bilingual (RU/EN)'],
        },
        {
          name: 'purpose',
          label: 'Цель получения',
          labelEn: 'Purpose',
          type: 'text',
          required: true,
          placeholder: 'Для стажировки, перевода или гранта',
        },
        {
          name: 'copies',
          label: 'Количество копий',
          labelEn: 'Number of copies',
          type: 'number',
          required: true,
          placeholder: '1',
        },
      ],
    },
    {
      code: 'dormitory_application',
      title: 'Заявление на место в общежитии',
      description: 'Предоставление места проживания в студенческом городке университета.',
      slaDays: 7,
      fields: [
        {
          name: 'homeCity',
          label: 'Город постоянной регистрации',
          labelEn: 'City of permanent registration',
          type: 'text',
          required: true,
          placeholder: 'Например: Владивосток',
        },
        {
          name: 'benefitCategory',
          label: 'Льготная категория (при наличии)',
          labelEn: 'Priority / benefit category (if applicable)',
          type: 'select',
          required: false,
          options: [
            'Нет льготы (общий конкурс)',
            'Сирота / оставшийся без попечения',
            'Инвалид I или II группы',
            'Многодетная семья',
          ],
          optionsEn: [
            'No priority (general pool)',
            'Orphan / without parental care',
            'Disability group I or II',
            'Large family',
          ],
        },
        {
          name: 'preferredCampus',
          label: 'Предпочтительный корпус',
          labelEn: 'Preferred campus building',
          type: 'select',
          required: true,
          options: ['Студгородок №1 (ул. Университетская)', 'Студгородок №2 (пр. Науки)'],
          optionsEn: [
            'Campus Dormitory #1 (Universitetskaya St.)',
            'Campus Dormitory #2 (Nauki Ave.)',
          ],
        },
      ],
    },
    {
      code: 'academic_leave',
      title: 'Заявление на академический отпуск',
      description:
        'Оформление временного перерыва в обучении по медицинским или семейным обстоятельствам.',
      slaDays: 10,
      fields: [
        {
          name: 'reason',
          label: 'Основание для отпуска',
          labelEn: 'Reason for leave',
          type: 'select',
          required: true,
          options: [
            'По медицинским показаниям (справка ВКК)',
            'По семейным обстоятельствам',
            'Призыв на военную службу',
          ],
          optionsEn: [
            'Medical grounds (medical board certificate)',
            'Family circumstances',
            'Military conscription',
          ],
        },
        {
          name: 'duration',
          label: 'Срок отпуска',
          labelEn: 'Leave duration',
          type: 'select',
          required: true,
          options: ['1 семестр', '1 академический год', '2 академических года'],
          optionsEn: ['1 semester', '1 academic year', '2 academic years'],
        },
        {
          name: 'documentDetails',
          label: 'Реквизиты подтверждающего документа',
          labelEn: 'Supporting document details',
          type: 'textarea',
          required: true,
          placeholder: 'Справка врачебной комиссии №... от...',
        },
      ],
    },
  ];

  const requests: Array<{
    id: string;
    studentId: string;
    typeCode: string;
    data: Record<string, unknown>;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }> = [
    {
      id: ids.aigulReqId,
      studentId: ids.aigulUserId,
      typeCode: 'study_certificate',
      data: { purpose: 'По месту работы родителей', copies: 2, delivery: 'pickup' },
      status: 'in_review',
      createdAt: new Date(Date.now() - 86400_000 * 2),
      updatedAt: new Date(Date.now() - 86400_000),
    },
    {
      id: ids.timurReqNeedsInfoId,
      studentId: ids.timurUserId,
      typeCode: 'dormitory_application',
      data: { reason: 'Перевод в корпус №2 студгородка' },
      status: 'needs_info',
      createdAt: new Date(Date.now() - 86400_000 * 3),
      updatedAt: new Date(Date.now() - 86400_000),
    },
    {
      id: ids.timurReqReadyId,
      studentId: ids.timurUserId,
      typeCode: 'transcript',
      data: { language: 'RU / EN (билингвальный макет)' },
      status: 'ready',
      createdAt: new Date(Date.now() - 86400_000 * 5),
      updatedAt: new Date(Date.now() - 86400_000),
    },
  ];

  const histories: Array<{
    id: string;
    requestId: string;
    actorId: string | null;
    status: string;
    comment: string | null;
    createdAt: Date;
  }> = [
    {
      id: 'h-1',
      requestId: ids.aigulReqId,
      actorId: ids.aigulUserId,
      status: 'submitted',
      comment: null,
      createdAt: new Date(Date.now() - 86400_000 * 2),
    },
    {
      id: 'h-2',
      requestId: ids.aigulReqId,
      actorId: ids.staffUserId,
      status: 'in_review',
      comment: 'Заявление принято инспектором деканата в обработку',
      createdAt: new Date(Date.now() - 86400_000),
    },
    {
      id: 'h-3',
      requestId: ids.timurReqNeedsInfoId,
      actorId: ids.staffUserId,
      status: 'needs_info',
      comment: 'Пожалуйста, приложите справку о составе семьи и доходах',
      createdAt: new Date(Date.now() - 86400_000),
    },
    {
      id: 'h-4',
      requestId: ids.timurReqReadyId,
      actorId: ids.staffUserId,
      status: 'ready',
      comment: 'Академический транскрипт сформирован и готов к выдаче',
      createdAt: new Date(Date.now() - 86400_000),
    },
  ];

  const notifications: Array<{
    id: string;
    userId: string;
    kind: string;
    title: string;
    body: string;
    priority: string;
    read: boolean;
    link: string | null;
    createdAt: Date;
  }> = [
    {
      id: '33333333-3333-4333-8333-333333333310',
      userId: ids.aigulUserId,
      kind: 'request_update',
      title: 'Справка об обучении в обработке',
      body: 'Ваше заявление передано на подпись в деканат.',
      priority: 'normal',
      read: false,
      link: '/requests',
      createdAt: new Date(),
    },
    {
      id: '33333333-3333-4333-8333-333333333311',
      userId: ids.timurUserId,
      kind: 'request_update',
      title: 'Требуется уточнение по заявлению на общежитие',
      body: 'Пожалуйста, загрузите справку о доходах.',
      priority: 'urgent',
      read: false,
      link: '/requests',
      createdAt: new Date(),
    },
    {
      id: '33333333-3333-4333-8333-333333333301',
      userId: ids.linaUserId,
      kind: 'schedule_change',
      title: 'Замена аудитории (Международное право)',
      body: 'Семинар перенесен в ауд. Б-115.',
      priority: 'urgent',
      read: false,
      link: '/schedule',
      createdAt: new Date(),
    },
    {
      id: '33333333-3333-4333-8333-333333333302',
      userId: ids.linaUserId,
      kind: 'announcement',
      title: 'Прием заявок на ПГАС до 25 ноября',
      body: 'Подайте документы через раздел «Справки и заявления».',
      priority: 'high',
      read: false,
      link: '/requests',
      createdAt: new Date(),
    },
    {
      id: '33333333-3333-4333-8333-333333333303',
      userId: ids.linaUserId,
      kind: 'announcement',
      title: 'Опубликован график зимней экзаменационной сессии',
      body: 'Проверьте даты консультаций и экзаменов во вкладке «Расписание».',
      priority: 'high',
      read: false,
      link: '/schedule',
      createdAt: new Date(),
    },
  ];

  const announcements: Array<{
    id: string;
    title: string;
    body: string;
    targetGroup: string | null;
    targetUserId: string | null;
    priority: string;
    kind: string;
    recipientCount: number;
    recipients: string[];
    createdAt: Date;
  }> = [
    {
      id: '55555555-5555-4555-8555-555555555501',
      title: 'Утверждено расписание зимней экзаменационной сессии',
      body: 'График экзаменов и предэкзаменационных консультаций доступен в личных кабинетах студентов.',
      targetGroup: null,
      targetUserId: null,
      priority: 'high',
      kind: 'announcement',
      recipientCount: 8,
      recipients: ['Все студенты факультета МО'],
      createdAt: new Date(),
    },
  ];

  const exams: Array<{
    id: string;
    code: string;
    groupId: string;
    subject: string;
    format: string;
    examiner: string;
    commissionMembers: string | null;
    date: string;
    rawDate: string;
    time: string;
    room: string;
    consultation: string;
    credits: number;
    status: string;
    changeNote: string | null;
    retakeDate: string | null;
    isDebt: boolean;
    originalSnapshot: Record<string, unknown> | null;
  }> = [
    {
      id: '66666666-6666-4666-8666-666666666601',
      code: 'LAW-201',
      groupId: groups[0].id,
      subject: 'Международное публичное право',
      format: 'Устный экзамен по билетам',
      examiner: 'Проф. Воронов А.Н.',
      commissionMembers: 'Доц. Романова Е.В., доц. Смирнов А.К.',
      date: '12 декабря 2026',
      rawDate: '2026-12-12',
      time: '10:00 – 14:00',
      room: 'Главный корпус, ауд. 312',
      consultation: '10 декабря в 15:00 (ауд. 312)',
      credits: 5,
      status: 'scheduled',
      changeNote: null,
      retakeDate: null,
      isDebt: false,
      originalSnapshot: {
        date: '12 декабря 2026',
        rawDate: '2026-12-12',
        time: '10:00 – 14:00',
        room: 'Главный корпус, ауд. 312',
        consultation: '10 декабря в 15:00 (ауд. 312)',
        examiner: 'Проф. Воронов А.Н.',
        commissionMembers: 'Доц. Романова Е.В., доц. Смирнов А.К.',
        status: 'scheduled',
        changeNote: null,
      },
    },
    {
      id: '66666666-6666-4666-8666-666666666602',
      code: 'STAT-102',
      groupId: groups[1].id,
      subject: 'Математическая статистика и анализ данных',
      format: 'Комиссионная пересдача (Комиссия факультета)',
      examiner: 'Проф. Соколов Д.М.',
      commissionMembers: 'Доц. Иванова К.А., доц. Ковалев С.А.',
      date: '28 ноября 2026',
      rawDate: '2026-11-28',
      time: '14:00 – 17:00',
      room: 'Ауд. А-314',
      consultation: '26 ноября в 17:00 (каф. статистики)',
      credits: 4,
      status: 'scheduled',
      changeNote: 'Комиссионная пересдача за осенний семестр',
      retakeDate: '2026-11-28',
      isDebt: true,
      originalSnapshot: {
        date: '28 ноября 2026',
        rawDate: '2026-11-28',
        time: '14:00 – 17:00',
        room: 'Ауд. А-314',
        consultation: '26 ноября в 17:00 (каф. статистики)',
        examiner: 'Проф. Соколов Д.М.',
        commissionMembers: 'Доц. Иванова К.А., доц. Ковалев С.А.',
        status: 'scheduled',
        changeNote: 'Комиссионная пересдача за осенний семестр',
      },
    },
    {
      id: '66666666-6666-4666-8666-666666666603',
      code: 'MAG-101',
      groupId: groups[2].id,
      subject: 'Современная дипломатическая практика',
      format: 'Защита аналитических записок',
      examiner: 'Чл.-корр. Романов Б.С.',
      commissionMembers: 'Проф. Воронов А.Н., посол Ильин К.В.',
      date: '15 декабря 2026',
      rawDate: '2026-12-15',
      time: '11:00 – 15:00',
      room: 'Зал Ученого совета',
      consultation: '13 декабря в 16:00 (Зал совета)',
      credits: 6,
      status: 'scheduled',
      changeNote: null,
      retakeDate: null,
      isDebt: false,
      originalSnapshot: {
        date: '15 декабря 2026',
        rawDate: '2026-12-15',
        time: '11:00 – 15:00',
        room: 'Зал Ученого совета',
        consultation: '13 декабря в 16:00 (Зал совета)',
        examiner: 'Чл.-корр. Романов Б.С.',
        commissionMembers: 'Проф. Воронов А.Н., посол Ильин К.В.',
        status: 'scheduled',
        changeNote: null,
      },
    },
    {
      id: '66666666-6666-4666-8666-666666666604',
      code: 'ILAW-101',
      groupId: groups[3].id,
      subject: 'История государства и права зарубежных стран',
      format: 'Устный экзамен по билетам',
      examiner: 'Доц. Громов В.П.',
      commissionMembers: 'Проф. Воронов А.Н.',
      date: '17 декабря 2026',
      rawDate: '2026-12-17',
      time: '09:30 – 13:00',
      room: 'Ауд. 112',
      consultation: '15 декабря в 14:00 (ауд. 112)',
      credits: 4,
      status: 'scheduled',
      changeNote: null,
      retakeDate: null,
      isDebt: false,
      originalSnapshot: {
        date: '17 декабря 2026',
        rawDate: '2026-12-17',
        time: '09:30 – 13:00',
        room: 'Ауд. 112',
        consultation: '15 декабря в 14:00 (ауд. 112)',
        examiner: 'Доц. Громов В.П.',
        commissionMembers: 'Проф. Воронов А.Н.',
        status: 'scheduled',
        changeNote: null,
      },
    },
  ];

  function safeUserFields(u: (typeof users)[number]) {
    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
    };
  }

  function hydrateStudentProfile(
    sp: (typeof studentProfiles)[number],
    include?: Record<string, unknown>
  ) {
    const grp = groups.find((g) => g.id === sp.groupId)!;
    const prog = programs.find((p) => p.id === sp.programId)!;
    const spGrades = grades
      .filter((g) => g.studentProfileId === sp.id)
      .map((g) => ({
        ...g,
        subject: subjects.find((s) => s.id === g.subjectId)!,
      }));
    const usr = users.find((u) => u.id === sp.userId)!;
    const res: Record<string, unknown> = { ...sp };
    if (include?.user) res.user = safeUserFields(usr);
    if (include?.faculty) res.faculty = faculty;
    if (include?.program) res.program = prog;
    if (include?.grades) res.grades = spGrades;
    if (include?.group) {
      res.group = {
        ...grp,
        program: { ...prog, faculty },
      };
    }
    return res;
  }

  function hydrateRequest(r: (typeof requests)[number], include?: Record<string, unknown>) {
    const rt = requestTypes.find((t) => t.code === r.typeCode)!;
    const hist = histories
      .filter((h) => h.requestId === r.id)
      .map((h) => {
        const actorUser = h.actorId ? (users.find((u) => u.id === h.actorId) ?? null) : null;
        return {
          ...h,
          actor: actorUser ? { fullName: actorUser.fullName } : null,
        };
      });
    const stu = users.find((u) => u.id === r.studentId)!;
    const sp = studentProfiles.find((p) => p.userId === stu.id);
    const grp = sp ? groups.find((g) => g.id === sp.groupId) : null;
    return {
      ...r,
      ...(include?.requestType ? { requestType: rt } : {}),
      ...(include?.history ? { history: hist } : {}),
      ...(include?.student
        ? {
            student: {
              ...safeUserFields(stu),
              studentProfile: sp ? { ...sp, group: grp } : null,
            },
          }
        : {}),
    };
  }

  function hydrateSchedule(s: (typeof scheduleEntries)[number]) {
    return {
      ...s,
      subject: subjects.find((sb) => sb.id === s.subjectId)!,
      room: rooms.find((rm) => rm.id === s.roomId) ?? null,
      teacher: teachers.find((t) => t.id === s.teacherId) ?? null,
      group: groups.find((g) => g.id === s.groupId) ?? null,
    };
  }

  const client = {
    user: {
      findUnique: async ({
        where,
        include,
      }: {
        where: { id?: string; email?: string };
        include?: Record<string, unknown>;
      }) => {
        const u = users.find((x) => (where.id ? x.id === where.id : x.email === where.email));
        if (!u) return null;
        const out: Record<string, unknown> = { ...u };
        if (include?.studentProfile) {
          const sp = studentProfiles.find((p) => p.userId === u.id) ?? null;
          const spInc =
            typeof include.studentProfile === 'object'
              ? (include.studentProfile as { include?: Record<string, unknown> }).include
              : undefined;
          out.studentProfile = sp ? hydrateStudentProfile(sp, spInc) : null;
        }
        if (include?.requests) {
          const reqInc =
            typeof include.requests === 'object'
              ? (include.requests as { include?: Record<string, unknown> }).include
              : undefined;
          out.requests = requests
            .filter((r) => r.studentId === u.id)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map((r) => hydrateRequest(r, reqInc));
        }
        return out;
      },
      findMany: async ({ where }: { where?: { role?: string } } = {}) => {
        return users
          .filter((u) => !where?.role || u.role === where.role)
          .map((u) => safeUserFields(u));
      },
      count: async () => users.length,
    },
    studentProfile: {
      findUnique: async ({
        where,
        include,
      }: {
        where: { userId: string };
        include?: Record<string, unknown>;
      }) => {
        const sp = studentProfiles.find((p) => p.userId === where.userId);
        return sp ? hydrateStudentProfile(sp, include) : null;
      },
      findMany: async ({ include }: { include?: Record<string, unknown> } = {}) => {
        return [...studentProfiles]
          .sort((a, b) => a.studentNumber.localeCompare(b.studentNumber))
          .map((sp) => hydrateStudentProfile(sp, include));
      },
    },
    group: {
      findMany: async () => {
        return [...groups]
          .sort((a, b) => a.code.localeCompare(b.code))
          .map((g) => ({
            ...g,
            program: { ...programs.find((p) => p.id === g.programId)!, faculty },
            studentProfiles: studentProfiles
              .filter((sp) => sp.groupId === g.id)
              .map((sp) => hydrateStudentProfile(sp, { user: true, grades: true })),
          }));
      },
      findFirst: async ({ where }: { where?: { code?: string } } = {}) => {
        const normalized = normalizeGroupCode(where?.code);
        const sorted = [...groups].sort((a, b) => a.code.localeCompare(b.code));
        const g = normalized ? sorted.find((x) => x.code === normalized) : sorted[0];
        if (!g) return null;
        return {
          ...g,
          studentProfiles: studentProfiles
            .filter((sp) => sp.groupId === g.id)
            .map((sp) => hydrateStudentProfile(sp, { user: true, grades: true })),
        };
      },
    },
    room: {
      findFirst: async ({ where }: { where: { code: string } }) => {
        return rooms.find((r) => r.code === where.code) ?? null;
      },
      create: async ({ data }: { data: { code: string } }) => {
        const created = { id: crypto.randomUUID(), code: data.code, building: 'А', capacity: 30 };
        rooms.push(created);
        return created;
      },
    },
    exam: {
      findMany: async ({
        where,
      }: { where?: { groupId?: string; group?: { code: string } } } = {}) => {
        return exams
          .filter((ex) => {
            if (where?.groupId && ex.groupId !== where.groupId) return false;
            if (where?.group?.code) {
              const target = normalizeGroupCode(where.group.code);
              const g = groups.find((gr) => gr.id === ex.groupId);
              if (g?.code !== target) return false;
            }
            return true;
          })
          .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
          .map((ex) => ({ ...ex, group: groups.find((g) => g.id === ex.groupId) ?? null }));
      },
      findFirst: async ({ where }: { where: { id?: string; code?: string } }) => {
        const ex = exams.find((x) => (where.id ? x.id === where.id : x.code === where.code));
        if (!ex) return null;
        const grp = groups.find((g) => g.id === ex.groupId)!;
        return {
          ...ex,
          group: {
            ...grp,
            studentProfiles: studentProfiles.filter((sp) => sp.groupId === grp.id),
          },
        };
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const created = {
          id: crypto.randomUUID(),
          commissionMembers: null,
          changeNote: null,
          retakeDate: null,
          isDebt: false,
          originalSnapshot: null,
          ...(data as Partial<(typeof exams)[number]>),
        } as (typeof exams)[number];
        exams.push(created);
        return { ...created, group: groups.find((g) => g.id === created.groupId) ?? null };
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const idx = exams.findIndex((x) => x.id === where.id);
        if (idx === -1) {
          throw Object.assign(new Error('Exam not found'), { code: 'P2025' });
        }
        Object.assign(exams[idx], data);
        return { ...exams[idx], group: groups.find((g) => g.id === exams[idx].groupId) ?? null };
      },
    },
    scheduleEntry: {
      findMany: async ({
        where,
      }: {
        where: { groupId?: string; date?: { gte?: Date; lte?: Date } };
      }) => {
        return scheduleEntries
          .filter((s) => {
            if (where.groupId && s.groupId !== where.groupId) return false;
            if (where.date?.gte && s.date < new Date(where.date.gte.toISOString().split('T')[0]))
              return false;
            if (where.date?.lte && s.date > new Date(where.date.lte.toISOString().split('T')[0]))
              return false;
            return true;
          })
          .sort(
            (a, b) => a.date.getTime() - b.date.getTime() || a.startTime.localeCompare(b.startTime)
          )
          .map(hydrateSchedule);
      },
      findFirst: async ({
        where,
      }: {
        where: { groupId?: string; date?: { gt?: Date }; status?: { not?: string } };
      }) => {
        const matching = scheduleEntries
          .filter(
            (s) =>
              (!where.groupId || s.groupId === where.groupId) &&
              (!where.status?.not || s.status !== where.status.not) &&
              (!where.date?.gt || s.date > where.date.gt)
          )
          .sort(
            (a, b) => a.date.getTime() - b.date.getTime() || a.startTime.localeCompare(b.startTime)
          );
        return matching[0] ? hydrateSchedule(matching[0]) : null;
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const found = scheduleEntries.find((s) => s.id === where.id);
        if (!found) return null;
        const grp = groups.find((g) => g.id === found.groupId)!;
        return {
          ...found,
          subject: subjects.find((sb) => sb.id === found.subjectId)!,
          group: {
            ...grp,
            studentProfiles: studentProfiles.filter((sp) => sp.groupId === grp.id),
          },
        };
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const idx = scheduleEntries.findIndex((s) => s.id === where.id);
        if (idx === -1) {
          throw Object.assign(new Error('Schedule entry not found'), { code: 'P2025' });
        }
        Object.assign(scheduleEntries[idx], data);
        return hydrateSchedule(scheduleEntries[idx]);
      },
    },
    grade: {
      findMany: async ({ where }: { where: { studentProfileId: string; semester?: number } }) => {
        return grades
          .filter(
            (g) =>
              g.studentProfileId === where.studentProfileId &&
              (!where.semester || g.semester === where.semester)
          )
          .map((g) => ({
            ...g,
            subject: subjects.find((s) => s.id === g.subjectId)!,
          }))
          .sort((a, b) => a.semester - b.semester || a.subject.name.localeCompare(b.subject.name));
      },
    },
    requestType: {
      findMany: async () => requestTypes,
      findUnique: async ({ where }: { where: { code: string } }) =>
        requestTypes.find((t) => t.code === where.code) ?? null,
    },
    request: {
      count: async ({ where }: { where?: { studentId?: string; status?: string } } = {}) =>
        requests.filter(
          (r) =>
            (!where?.studentId || r.studentId === where.studentId) &&
            (!where?.status || r.status === where.status)
        ).length,
      findMany: async ({
        where,
        include,
        skip = 0,
        take = 20,
      }: {
        where?: { studentId?: string; status?: string };
        include?: Record<string, unknown>;
        skip?: number;
        take?: number;
      }) => {
        return requests
          .filter(
            (r) =>
              (!where?.studentId || r.studentId === where.studentId) &&
              (!where?.status || r.status === where.status)
          )
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(skip, skip + take)
          .map((r) => hydrateRequest(r, include));
      },
      findFirst: async ({
        where,
        include,
      }: {
        where: { id: string; studentId?: string };
        include?: Record<string, unknown>;
      }) => {
        const found = requests.find(
          (r) => r.id === where.id && (!where.studentId || r.studentId === where.studentId)
        );
        return found ? hydrateRequest(found, include) : null;
      },
      findUnique: async ({
        where,
        include,
      }: {
        where: { id: string };
        include?: Record<string, unknown>;
      }) => {
        const found = requests.find((r) => r.id === where.id);
        return found ? hydrateRequest(found, include) : null;
      },
      create: async ({
        data,
        include,
      }: {
        data: {
          studentId: string;
          typeCode: string;
          data: Record<string, unknown>;
          status: string;
          history?: { create: Array<{ status: string; actorId?: string; comment: string | null }> };
        };
        include?: Record<string, unknown>;
      }) => {
        const created = {
          id: crypto.randomUUID(),
          studentId: data.studentId,
          typeCode: data.typeCode,
          data: data.data,
          status: data.status,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        requests.push(created);
        for (const h of data.history?.create ?? []) {
          histories.push({
            id: crypto.randomUUID(),
            requestId: created.id,
            actorId: h.actorId ?? null,
            status: h.status,
            comment: h.comment,
            createdAt: new Date(),
          });
        }
        return hydrateRequest(created, include);
      },
      update: async ({
        where,
        data,
        include,
      }: {
        where: { id: string };
        data: {
          status: string;
          history?: { create: Array<{ status: string; actorId?: string; comment: string | null }> };
        };
        include?: Record<string, unknown>;
      }) => {
        const r = requests.find((x) => x.id === where.id);
        if (!r) {
          throw Object.assign(new Error('Request not found'), { code: 'P2025' });
        }
        r.status = data.status;
        r.updatedAt = new Date();
        for (const h of data.history?.create ?? []) {
          histories.push({
            id: crypto.randomUUID(),
            requestId: r.id,
            actorId: h.actorId ?? null,
            status: h.status,
            comment: h.comment,
            createdAt: new Date(),
          });
        }
        return hydrateRequest(r, include);
      },
    },
    notification: {
      count: async ({ where }: { where: { userId: string; read?: boolean; kind?: string } }) =>
        notifications.filter(
          (n) =>
            n.userId === where.userId &&
            (where.read === undefined || n.read === where.read) &&
            (!where.kind || n.kind === where.kind)
        ).length,
      findMany: async ({
        where,
        skip = 0,
        take = 20,
      }: {
        where: { userId: string; read?: boolean; kind?: string };
        skip?: number;
        take?: number;
      }) =>
        notifications
          .filter(
            (n) =>
              n.userId === where.userId &&
              (where.read === undefined || n.read === where.read) &&
              (!where.kind || n.kind === where.kind)
          )
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(skip, skip + take),
      findFirst: async ({ where }: { where: { id: string; userId: string } }) =>
        notifications.find((n) => n.id === where.id && n.userId === where.userId) ?? null,
      update: async ({ where, data }: { where: { id: string }; data: { read: boolean } }) => {
        const n = notifications.find((x) => x.id === where.id);
        if (!n) {
          throw Object.assign(new Error('Notification not found'), { code: 'P2025' });
        }
        n.read = data.read;
        return n;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { userId: string; read?: boolean };
        data: { read: boolean };
      }) => {
        let count = 0;
        for (const n of notifications) {
          if (n.userId === where.userId && (where.read === undefined || n.read === where.read)) {
            n.read = data.read;
            count++;
          }
        }
        return { count };
      },
      create: async ({
        data,
      }: {
        data: {
          userId: string;
          kind: string;
          title: string;
          body: string;
          priority?: string;
          link: string | null;
        };
      }) => {
        const created = {
          id: crypto.randomUUID(),
          priority: data.priority ?? 'normal',
          ...data,
          read: false,
          createdAt: new Date(),
        };
        notifications.unshift(created);
        return created;
      },
      createMany: async ({
        data,
      }: {
        data: Array<{
          userId: string;
          kind: string;
          title: string;
          body: string;
          priority?: string;
          link: string | null;
        }>;
      }) => {
        for (const d of data) {
          notifications.unshift({
            id: crypto.randomUUID(),
            priority: d.priority ?? 'normal',
            ...d,
            read: false,
            createdAt: new Date(),
          });
        }
        return { count: data.length };
      },
    },
    announcement: {
      findMany: async () =>
        [...announcements].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      create: async ({
        data,
      }: {
        data: {
          title: string;
          body: string;
          targetGroup: string | null;
          targetUserId?: string | null;
          priority?: string;
          kind?: string;
          recipientCount?: number;
          recipients?: string[];
        };
      }) => {
        const created = {
          id: crypto.randomUUID(),
          targetUserId: null,
          priority: 'high',
          kind: 'announcement',
          recipientCount: 0,
          recipients: [],
          ...data,
          createdAt: new Date(),
        };
        announcements.unshift(created);
        return created;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const idx = announcements.findIndex((a) => a.id === where.id);
        if (idx === -1) {
          throw Object.assign(new Error('Not found'), { code: 'P2025' });
        }
        const [removed] = announcements.splice(idx, 1);
        return removed;
      },
    },
    $transaction: async <T>(
      arg: Array<Promise<T>> | ((tx: PrismaClient) => Promise<T>)
    ): Promise<T | T[]> => (typeof arg === 'function' ? arg(client) : Promise.all(arg)),
  } as unknown as PrismaClient;

  return client;
}

let cachedFallbackPromise: Promise<PrismaClient> | null = null;

export function getServerlessFallbackPrisma(): Promise<PrismaClient> {
  if (!cachedFallbackPromise) {
    cachedFallbackPromise = createFallbackStore();
  }
  return cachedFallbackPromise;
}
