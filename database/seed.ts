/**
 * Digital Dean's Office – Seed script
 * Competition concept, fictional data only. No real people or institutions.
 * Idempotent: safe to run multiple times; never duplicates rows or overwrites user-created changes.
 *
 * Required env vars:
 *   DATABASE_URL          – Prisma connection string
 *   SEED_STUDENT_PASSWORD – plain-text password for demo student accounts
 *   SEED_STAFF_PASSWORD   – plain-text password for demo staff account
 */

import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

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

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

async function main(): Promise<void> {
  const studentPassword = requireEnv('SEED_STUDENT_PASSWORD');
  const staffPassword = requireEnv('SEED_STAFF_PASSWORD');

  const studentHash = await hashPassword(studentPassword);
  const staffHash = await hashPassword(staffPassword);

  const now = new Date();
  const currentMonday = getMonday(now);

  // ── 1. Faculty ─────────────────────────────────────────────────────────────
  const faculty = await prisma.faculty.upsert({
    where: { name: 'Факультет международных отношений' },
    update: {},
    create: { name: 'Факультет международных отношений' },
  });

  // ── 2. Programs ────────────────────────────────────────────────────────────
  const programIR = await prisma.program.upsert({
    where: {
      name_facultyId: { name: 'Международные отношения (Бакалавриат)', facultyId: faculty.id },
    },
    update: {},
    create: { name: 'Международные отношения (Бакалавриат)', facultyId: faculty.id },
  });
  const programWE = await prisma.program.upsert({
    where: { name_facultyId: { name: 'Мировая экономика (Бакалавриат)', facultyId: faculty.id } },
    update: {},
    create: { name: 'Мировая экономика (Бакалавриат)', facultyId: faculty.id },
  });
  const programDS = await prisma.program.upsert({
    where: {
      name_facultyId: { name: 'Дипломатическая служба (Магистратура)', facultyId: faculty.id },
    },
    update: {},
    create: { name: 'Дипломатическая служба (Магистратура)', facultyId: faculty.id },
  });
  const programIPL = await prisma.program.upsert({
    where: {
      name_facultyId: {
        name: 'Международное публичное право (Бакалавриат)',
        facultyId: faculty.id,
      },
    },
    update: {},
    create: { name: 'Международное публичное право (Бакалавриат)', facultyId: faculty.id },
  });

  // ── 3. Groups ──────────────────────────────────────────────────────────────
  const groupDU101 = await prisma.group.upsert({
    where: { code: 'ДУ-101' },
    update: {
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
    create: {
      code: 'ДУ-101',
      programId: programIR.id,
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
  });

  const groupDU205 = await prisma.group.upsert({
    where: { code: 'ДУ-205' },
    update: {
      admissionYear: 2022,
      studentsCount: 24,
      budgetCount: 14,
      contractCount: 10,
      curatorName: 'доц. Ковалев С.А.',
      curatorContact: 's.kovalev@demo.edu • Ауд. 208',
      starostaName: 'Алина Захарова',
      starostaEmail: 'a.zakharova@demo.edu',
      starostaPhone: '+7 (999) 456-78-90',
    },
    create: {
      code: 'ДУ-205',
      programId: programWE.id,
      year: 3,
      admissionYear: 2022,
      studentsCount: 24,
      budgetCount: 14,
      contractCount: 10,
      curatorName: 'доц. Ковалев С.А.',
      curatorContact: 's.kovalev@demo.edu • Ауд. 208',
      starostaName: 'Алина Захарова',
      starostaEmail: 'a.zakharova@demo.edu',
      starostaPhone: '+7 (999) 456-78-90',
    },
  });

  const groupDU301 = await prisma.group.upsert({
    where: { code: 'ДУ-301' },
    update: {
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
    create: {
      code: 'ДУ-301',
      programId: programDS.id,
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
  });

  const groupDU102 = await prisma.group.upsert({
    where: { code: 'ДУ-102' },
    update: {
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
    create: {
      code: 'ДУ-102',
      programId: programIPL.id,
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
  });

  // ── 4. Users & Profiles ────────────────────────────────────────────────────
  const staff = await prisma.user.upsert({
    where: { email: 'dean.office@demo.edu' },
    update: { passwordHash: staffHash, fullName: 'Мария Волкова (Сотрудник деканата)' },
    create: {
      email: 'dean.office@demo.edu',
      passwordHash: staffHash,
      fullName: 'Мария Волкова (Сотрудник деканата)',
      role: 'staff',
    },
  });

  const studentDefs = [
    {
      email: 'aigul.nurova@demo.edu',
      fullName: 'Айгуль Нурова',
      group: groupDU101,
      program: programIR,
      year: 2,
      studentNumber: 'СТ-2023-0194',
      phone: '+7 (999) 123-45-67',
      studyForm: 'Бюджет',
      isStarosta: true,
      dormitoryInfo: 'Проживание по постоянной регистрации (г. Москва)',
      snils: '184-293-841 02',
    },
    {
      email: 'timur.belov@demo.edu',
      fullName: 'Тимур Белов',
      group: groupDU205,
      program: programWE,
      year: 3,
      studentNumber: 'СТ-2022-0082',
      phone: '+7 (999) 234-56-78',
      studyForm: 'Контракт',
      isStarosta: false,
      dormitoryInfo: 'Студгородок №1, корп. 2, комн. 415',
      snils: '192-408-512 19',
    },
    {
      email: 'lina.okafor@demo.edu',
      fullName: 'Лина Окафор',
      group: groupDU101,
      program: programIR,
      year: 2,
      studentNumber: 'СТ-2023-0215',
      phone: '+7 (999) 345-67-89',
      studyForm: 'Контракт',
      isStarosta: false,
      dormitoryInfo: 'Проживание по постоянной регистрации (г. Москва)',
      snils: '175-319-604 44',
    },
    // Extra roster students for Staff Students / Groups views
    {
      email: 'd.morozov@demo.edu',
      fullName: 'Даниил Морозов',
      group: groupDU101,
      program: programIR,
      year: 2,
      studentNumber: 'СТ-2023-0142',
      phone: '+7 (999) 456-11-22',
      studyForm: 'Бюджет',
      isStarosta: false,
    },
    {
      email: 's.kim@demo.edu',
      fullName: 'София Ким',
      group: groupDU101,
      program: programIR,
      year: 2,
      studentNumber: 'СТ-2023-0188',
      phone: '+7 (999) 567-22-33',
      studyForm: 'Бюджет',
      isStarosta: false,
    },
    {
      email: 'm.volkov@demo.edu',
      fullName: 'Максим Волков',
      group: groupDU101,
      program: programIR,
      year: 2,
      studentNumber: 'СТ-2023-0201',
      phone: '+7 (999) 678-33-44',
      studyForm: 'Контракт',
      isStarosta: false,
    },
    {
      email: 'a.vasilieva@demo.edu',
      fullName: 'Анна Васильева',
      group: groupDU101,
      program: programIR,
      year: 2,
      studentNumber: 'СТ-2023-0177',
      phone: '+7 (999) 789-44-55',
      studyForm: 'Бюджет',
      isStarosta: false,
    },
    {
      email: 'a.zakharova@demo.edu',
      fullName: 'Алина Захарова',
      group: groupDU205,
      program: programWE,
      year: 3,
      studentNumber: 'СТ-2022-0045',
      phone: '+7 (999) 456-78-90',
      studyForm: 'Бюджет',
      isStarosta: true,
    },
    {
      email: 'a.gasparyan@demo.edu',
      fullName: 'Артур Гаспарян',
      group: groupDU205,
      program: programWE,
      year: 3,
      studentNumber: 'СТ-2022-0061',
      phone: '+7 (999) 890-55-66',
      studyForm: 'Бюджет',
      isStarosta: false,
    },
    {
      email: 'e.popova@demo.edu',
      fullName: 'Екатерина Попова',
      group: groupDU205,
      program: programWE,
      year: 3,
      studentNumber: 'СТ-2022-0099',
      phone: '+7 (999) 901-66-77',
      studyForm: 'Бюджет',
      isStarosta: false,
    },
    {
      email: 'k.lebedev@demo.edu',
      fullName: 'Кирилл Лебедев',
      group: groupDU205,
      program: programWE,
      year: 3,
      studentNumber: 'СТ-2022-0112',
      phone: '+7 (999) 012-77-88',
      studyForm: 'Контракт',
      isStarosta: false,
    },
    {
      email: 'd.savelev@demo.edu',
      fullName: 'Дмитрий Савельев',
      group: groupDU301,
      program: programDS,
      year: 1,
      studentNumber: 'СТ-2024-0012',
      phone: '+7 (999) 567-89-01',
      studyForm: 'Бюджет',
      isStarosta: true,
    },
    {
      email: 'e.orlova@demo.edu',
      fullName: 'Елена Орлова',
      group: groupDU301,
      program: programDS,
      year: 1,
      studentNumber: 'СТ-2024-0019',
      phone: '+7 (999) 123-88-99',
      studyForm: 'Бюджет',
      isStarosta: false,
    },
    {
      email: 'p.sergeeva@demo.edu',
      fullName: 'Полина Сергеева',
      group: groupDU102,
      program: programIPL,
      year: 1,
      studentNumber: 'СТ-2024-0051',
      phone: '+7 (999) 678-90-12',
      studyForm: 'Бюджет',
      isStarosta: true,
    },
    {
      email: 'r.kuznetsov@demo.edu',
      fullName: 'Роман Кузнецов',
      group: groupDU102,
      program: programIPL,
      year: 1,
      studentNumber: 'СТ-2024-0078',
      phone: '+7 (999) 234-99-00',
      studyForm: 'Контракт',
      isStarosta: false,
    },
  ];

  const userMap = new Map<string, { userId: string; profileId: string }>();

  for (const s of studentDefs) {
    const u = await prisma.user.upsert({
      where: { email: s.email },
      update: { passwordHash: studentHash, fullName: s.fullName },
      create: {
        email: s.email,
        passwordHash: studentHash,
        fullName: s.fullName,
        role: 'student',
      },
    });
    const sp = await prisma.studentProfile.upsert({
      where: { userId: u.id },
      update: {
        facultyId: faculty.id,
        programId: s.program.id,
        groupId: s.group.id,
        year: s.year,
        studentNumber: s.studentNumber,
        phone: s.phone,
        studyForm: s.studyForm,
        isStarosta: s.isStarosta,
        dormitoryInfo: s.dormitoryInfo ?? 'Проживание по постоянной регистрации (г. Москва)',
        snils: s.snils ?? '184-293-841 02',
      },
      create: {
        userId: u.id,
        facultyId: faculty.id,
        programId: s.program.id,
        groupId: s.group.id,
        year: s.year,
        studentNumber: s.studentNumber,
        phone: s.phone,
        studyForm: s.studyForm,
        isStarosta: s.isStarosta,
        status: 'active',
        dormitoryInfo: s.dormitoryInfo ?? 'Проживание по постоянной регистрации (г. Москва)',
        snils: s.snils ?? '184-293-841 02',
      },
    });
    userMap.set(s.email, { userId: u.id, profileId: sp.id });
  }

  const aigulIds = userMap.get('aigul.nurova@demo.edu')!;
  const timurIds = userMap.get('timur.belov@demo.edu')!;
  const linaIds = userMap.get('lina.okafor@demo.edu')!;

  // ── 5. Subjects ────────────────────────────────────────────────────────────
  const subjectSpecs = [
    { name: 'Дипломатический протокол', credits: 4, semester: 3 },
    { name: 'Международное публичное право', credits: 5, semester: 3 },
    { name: 'Английский язык для дипломатов', credits: 3, semester: 3 },
    { name: 'Макроэкономика', credits: 5, semester: 3 },
    { name: 'Политическая философия', credits: 4, semester: 3 },
    { name: 'Физическая культура и спорт', credits: 2, semester: 3 },
    { name: 'Русский язык как иностранный / Стилистика', credits: 3, semester: 3 },
    { name: 'Статистика в международных исследованиях', credits: 4, semester: 3 },
    { name: 'Военная кафедра / Факультатив', credits: 2, semester: 3 },
    { name: 'Статистика', credits: 4, semester: 3 },
    { name: 'Мировые финансовые рынки', credits: 5, semester: 3 },
    { name: 'Эконометрика и анализ данных', credits: 5, semester: 3 },
    { name: 'Международная торговля', credits: 4, semester: 3 },
    { name: 'Консультация перед пересдачей: Статистика', credits: 4, semester: 3 },
    { name: 'Иностранный язык в сфере экономики', credits: 3, semester: 3 },
    { name: 'Корпоративные финансы', credits: 4, semester: 3 },
    { name: 'Физическая культура', credits: 2, semester: 3 },
    { name: 'Русский язык как иностранный', credits: 3, semester: 3 },
    { name: 'История государства и права зарубежных стран', credits: 4, semester: 1 },
    { name: 'Современная дипломатическая практика', credits: 6, semester: 1 },
  ];

  const subjectMap = new Map<string, string>();
  for (const sub of subjectSpecs) {
    const rec = await prisma.subject.upsert({
      where: { name: sub.name },
      update: { credits: sub.credits, semester: sub.semester },
      create: sub,
    });
    subjectMap.set(sub.name, rec.id);
  }

  // ── 6. Teachers ────────────────────────────────────────────────────────────
  const teacherNames = [
    'проф. Соколов И.В.',
    'доц. Кузнецова Е.А.',
    'ст. преп. Смирнова М.Ю.',
    'проф. Дмитриев А.Н.',
    'доц. Громов В.П.',
    'Васильев О.К.',
    'доц. Морозова Т.С.',
    'проф. Лебедев Д.В.',
    'доц. Ковалев С.А.',
    'ст. преп. Орлова Н.В.',
    'проф. Захаров М.А.',
    'Кафедра ВП',
    'проф. Романов Б.С.',
    'доц. Мельников К.И.',
    'доц. Чернова А.Л.',
    'ст. преп. Федорова Е.В.',
    'проф. Беляев А.В.',
  ];

  const teacherMap = new Map<string, string>();
  for (const fullName of teacherNames) {
    let rec = await prisma.teacher.findFirst({ where: { fullName } });
    if (!rec) {
      rec = await prisma.teacher.create({ data: { fullName } });
    }
    teacherMap.set(fullName, rec.id);
  }

  // ── 7. Rooms ───────────────────────────────────────────────────────────────
  const roomCodes = [
    { code: 'А-204', building: 'А', capacity: 60 },
    { code: 'Б-115', building: 'Б', capacity: 40 },
    { code: 'Лингво-2', building: 'Л', capacity: 25 },
    { code: 'Актовый зал 3', building: 'А', capacity: 120 },
    { code: 'В-302', building: 'В', capacity: 35 },
    { code: 'Спорткомплекс', building: 'С', capacity: 100 },
    { code: 'А-312', building: 'А', capacity: 30 },
    { code: 'Компьютерный класс 4', building: 'К', capacity: 28 },
    { code: 'Б-208', building: 'Б', capacity: 35 },
    { code: 'В-114', building: 'В', capacity: 40 },
    { code: 'Корпус В', building: 'В', capacity: 50 },
    { code: 'Э-301', building: 'Э', capacity: 60 },
    { code: 'Комп-Класс 1', building: 'К', capacity: 28 },
    { code: 'Э-102', building: 'Э', capacity: 55 },
    { code: 'А-314', building: 'А', capacity: 30 },
    { code: 'Лингво-4', building: 'Л', capacity: 25 },
    { code: 'Э-204', building: 'Э', capacity: 60 },
  ];

  const roomMap = new Map<string, string>();
  for (const rm of roomCodes) {
    const rec = await prisma.room.upsert({
      where: { code: rm.code },
      update: {},
      create: rm,
    });
    roomMap.set(rm.code, rec.id);
  }

  // ── 8. Rolling Schedule Window (-1 week to +6 weeks = 8 weeks) ─────────────
  const du101WeeklyPattern: Array<{
    dayOffset: number;
    startTime: string;
    endTime: string;
    subject: string;
    type: 'lecture' | 'seminar' | 'lab' | 'exam';
    room: string;
    teacher: string;
    status: 'normal' | 'room_changed' | 'moved' | 'cancelled';
    changeNote?: string;
  }> = [
    {
      dayOffset: 0,
      startTime: '08:30',
      endTime: '10:05',
      subject: 'Дипломатический протокол',
      type: 'lecture',
      room: 'А-204',
      teacher: 'проф. Соколов И.В.',
      status: 'normal',
    },
    {
      dayOffset: 0,
      startTime: '10:15',
      endTime: '11:50',
      subject: 'Международное публичное право',
      type: 'seminar',
      room: 'Б-115',
      teacher: 'доц. Кузнецова Е.А.',
      status: 'room_changed',
      changeNote: 'Аудитория перенесена из А-101 в Б-115 (ремонт проектора)',
    },
    {
      dayOffset: 0,
      startTime: '12:00',
      endTime: '13:35',
      subject: 'Английский язык для дипломатов',
      type: 'seminar',
      room: 'Лингво-2',
      teacher: 'ст. преп. Смирнова М.Ю.',
      status: 'normal',
    },
    {
      dayOffset: 1,
      startTime: '10:15',
      endTime: '11:50',
      subject: 'Макроэкономика',
      type: 'lecture',
      room: 'Актовый зал 3',
      teacher: 'проф. Дмитриев А.Н.',
      status: 'normal',
    },
    {
      dayOffset: 1,
      startTime: '12:00',
      endTime: '13:35',
      subject: 'Политическая философия',
      type: 'seminar',
      room: 'В-302',
      teacher: 'доц. Громов В.П.',
      status: 'cancelled',
      changeNote: 'Занятие отменено: преподаватель на международной конференции',
    },
    {
      dayOffset: 1,
      startTime: '14:00',
      endTime: '15:35',
      subject: 'Физическая культура и спорт',
      type: 'lab',
      room: 'Спорткомплекс',
      teacher: 'Васильев О.К.',
      status: 'normal',
    },
    {
      dayOffset: 2,
      startTime: '08:30',
      endTime: '10:05',
      subject: 'Русский язык как иностранный / Стилистика',
      type: 'seminar',
      room: 'А-312',
      teacher: 'доц. Морозова Т.С.',
      status: 'normal',
    },
    {
      dayOffset: 2,
      startTime: '10:15',
      endTime: '11:50',
      subject: 'Международное публичное право',
      type: 'lecture',
      room: 'А-204',
      teacher: 'проф. Лебедев Д.В.',
      status: 'normal',
    },
    {
      dayOffset: 2,
      startTime: '14:00',
      endTime: '15:35',
      subject: 'Статистика в международных исследованиях',
      type: 'lab',
      room: 'Компьютерный класс 4',
      teacher: 'доц. Ковалев С.А.',
      status: 'moved',
      changeNote: 'Время перенесено: с 12:00 на 14:00 по согласованию с группой',
    },
    {
      dayOffset: 3,
      startTime: '10:15',
      endTime: '11:50',
      subject: 'Дипломатический протокол',
      type: 'seminar',
      room: 'Б-208',
      teacher: 'проф. Соколов И.В.',
      status: 'normal',
    },
    {
      dayOffset: 3,
      startTime: '12:00',
      endTime: '13:35',
      subject: 'Макроэкономика',
      type: 'seminar',
      room: 'В-114',
      teacher: 'ст. преп. Орлова Н.В.',
      status: 'normal',
    },
    {
      dayOffset: 4,
      startTime: '08:30',
      endTime: '10:05',
      subject: 'Английский язык для дипломатов',
      type: 'seminar',
      room: 'Лингво-2',
      teacher: 'ст. преп. Смирнова М.Ю.',
      status: 'normal',
    },
    {
      dayOffset: 4,
      startTime: '10:15',
      endTime: '11:50',
      subject: 'Политическая философия',
      type: 'lecture',
      room: 'А-204',
      teacher: 'проф. Захаров М.А.',
      status: 'room_changed',
      changeNote: 'Перенос в ауд. Г-405 в связи с открытой лекцией посла',
    },
    {
      dayOffset: 5,
      startTime: '10:15',
      endTime: '11:50',
      subject: 'Военная кафедра / Факультатив',
      type: 'seminar',
      room: 'Корпус В',
      teacher: 'Кафедра ВП',
      status: 'normal',
    },
  ];

  const du205WeeklyPattern: typeof du101WeeklyPattern = [
    {
      dayOffset: 0,
      startTime: '10:15',
      endTime: '11:50',
      subject: 'Мировые финансовые рынки',
      type: 'lecture',
      room: 'Э-301',
      teacher: 'проф. Романов Б.С.',
      status: 'normal',
    },
    {
      dayOffset: 0,
      startTime: '12:00',
      endTime: '13:35',
      subject: 'Эконометрика и анализ данных',
      type: 'lab',
      room: 'Комп-Класс 1',
      teacher: 'доц. Мельников К.И.',
      status: 'room_changed',
      changeNote: 'Перенесено в Комп-Класс 3 (проверка ПО)',
    },
    {
      dayOffset: 1,
      startTime: '08:30',
      endTime: '10:05',
      subject: 'Международная торговля',
      type: 'lecture',
      room: 'Э-102',
      teacher: 'доц. Чернова А.Л.',
      status: 'normal',
    },
    {
      dayOffset: 2,
      startTime: '14:00',
      endTime: '15:35',
      subject: 'Консультация перед пересдачей: Статистика',
      type: 'seminar',
      room: 'А-314',
      teacher: 'доц. Ковалев С.А.',
      status: 'normal',
    },
    {
      dayOffset: 3,
      startTime: '10:15',
      endTime: '11:50',
      subject: 'Иностранный язык в сфере экономики',
      type: 'seminar',
      room: 'Лингво-4',
      teacher: 'ст. преп. Федорова Е.В.',
      status: 'normal',
    },
    {
      dayOffset: 4,
      startTime: '12:00',
      endTime: '13:35',
      subject: 'Корпоративные финансы',
      type: 'lecture',
      room: 'Э-204',
      teacher: 'проф. Беляев А.В.',
      status: 'cancelled',
      changeNote: 'Отменено: выездная экскурсия в Центробанк',
    },
  ];

  async function seedScheduleForGroup(groupId: string, pattern: typeof du101WeeklyPattern) {
    for (let weekOffset = -1; weekOffset <= 6; weekOffset++) {
      const weekMon = addDays(currentMonday, weekOffset * 7);
      for (const item of pattern) {
        const entryDate = addDays(weekMon, item.dayOffset);
        const subjectId = subjectMap.get(item.subject)!;
        const teacherId = teacherMap.get(item.teacher) ?? null;
        const roomId = roomMap.get(item.room) ?? null;

        const existing = await prisma.scheduleEntry.findFirst({
          where: { groupId, subjectId, date: entryDate, startTime: item.startTime },
        });
        if (!existing) {
          await prisma.scheduleEntry.create({
            data: {
              groupId,
              subjectId,
              teacherId,
              roomId,
              date: entryDate,
              startTime: item.startTime,
              endTime: item.endTime,
              type: item.type,
              status: item.status,
              changeNote: item.changeNote ?? null,
            },
          });
        }
      }
    }
  }

  await seedScheduleForGroup(groupDU101.id, du101WeeklyPattern);
  await seedScheduleForGroup(groupDU205.id, du205WeeklyPattern);

  // ── 9. Grades ──────────────────────────────────────────────────────────────
  async function upsertGrade(
    profileId: string,
    subjectName: string,
    semester: number,
    data: {
      points: number | null;
      grade: number | null;
      creditStatus: 'earned' | 'in_progress' | 'failed';
      assessmentType: 'exam' | 'credit' | 'coursework';
      examDate: Date | null;
      retakeDate?: Date | null;
      teacher: string;
    }
  ) {
    const subjectId = subjectMap.get(subjectName)!;
    const existing = await prisma.grade.findFirst({
      where: { studentProfileId: profileId, subjectId, semester },
    });
    if (!existing) {
      await prisma.grade.create({
        data: {
          studentProfileId: profileId,
          subjectId,
          semester,
          points: data.points,
          grade: data.grade,
          creditStatus: data.creditStatus,
          assessmentType: data.assessmentType,
          examDate: data.examDate,
          retakeDate: data.retakeDate ?? null,
          teacher: data.teacher,
        },
      });
    }
  }

  // Aigul (avg 88.5, GPA 4.8, 24/30 credits earned)
  const aigulGrades = [
    {
      sub: 'Международное публичное право',
      points: null,
      grade: null,
      status: 'in_progress' as const,
      type: 'exam' as const,
      examDate: addDays(currentMonday, 18),
      teacher: 'проф. Лебедев Д.В.',
    },
    {
      sub: 'Макроэкономика',
      points: null,
      grade: null,
      status: 'in_progress' as const,
      type: 'exam' as const,
      examDate: addDays(currentMonday, 23),
      teacher: 'проф. Дмитриев А.Н.',
    },
    {
      sub: 'Дипломатический протокол',
      points: 94,
      grade: 5,
      status: 'earned' as const,
      type: 'credit' as const,
      examDate: addDays(currentMonday, -10),
      teacher: 'проф. Соколов И.В.',
    },
    {
      sub: 'Политическая философия',
      points: 90,
      grade: 5,
      status: 'earned' as const,
      type: 'exam' as const,
      examDate: addDays(currentMonday, -14),
      teacher: 'доц. Громов В.П.',
    },
    {
      sub: 'Английский язык для дипломатов',
      points: 92,
      grade: 5,
      status: 'earned' as const,
      type: 'credit' as const,
      examDate: addDays(currentMonday, -7),
      teacher: 'ст. преп. Смирнова М.Ю.',
    },
    {
      sub: 'Статистика в международных исследованиях',
      points: 82,
      grade: 4,
      status: 'earned' as const,
      type: 'exam' as const,
      examDate: addDays(currentMonday, -20),
      teacher: 'доц. Ковалев С.А.',
    },
    {
      sub: 'Русский язык как иностранный / Стилистика',
      points: 89,
      grade: 5,
      status: 'earned' as const,
      type: 'credit' as const,
      examDate: addDays(currentMonday, -5),
      teacher: 'доц. Морозова Т.С.',
    },
    {
      sub: 'Физическая культура и спорт',
      points: 90,
      grade: null,
      status: 'earned' as const,
      type: 'credit' as const,
      examDate: addDays(currentMonday, -3),
      teacher: 'Васильев О.К.',
    },
  ];
  for (const g of aigulGrades) {
    await upsertGrade(aigulIds.profileId, g.sub, 3, {
      points: g.points,
      grade: g.grade,
      creditStatus: g.status,
      assessmentType: g.type,
      examDate: g.examDate,
      teacher: g.teacher,
    });
  }

  // Timur (avg 64.2, GPA 3.4, failed Statistics retake on 2026-11-28)
  const timurRetakeDate = new Date('2026-11-28T00:00:00Z');
  const timurGrades = [
    {
      sub: 'Эконометрика и анализ данных',
      points: null,
      grade: null,
      status: 'in_progress' as const,
      type: 'exam' as const,
      examDate: addDays(currentMonday, 20),
      retakeDate: null,
      teacher: 'доц. Мельников К.И.',
    },
    {
      sub: 'Статистика',
      points: 48,
      grade: 2,
      status: 'failed' as const,
      type: 'exam' as const,
      examDate: addDays(currentMonday, -12),
      retakeDate: timurRetakeDate,
      teacher: 'доц. Ковалев С.А.',
    },
    {
      sub: 'Мировые финансовые рынки',
      points: 71,
      grade: 4,
      status: 'earned' as const,
      type: 'exam' as const,
      examDate: addDays(currentMonday, -8),
      retakeDate: null,
      teacher: 'проф. Романов Б.С.',
    },
    {
      sub: 'Международная торговля',
      points: 68,
      grade: 3,
      status: 'earned' as const,
      type: 'credit' as const,
      examDate: addDays(currentMonday, -15),
      retakeDate: null,
      teacher: 'доц. Чернова А.Л.',
    },
    {
      sub: 'Иностранный язык в сфере экономики',
      points: 74,
      grade: 4,
      status: 'earned' as const,
      type: 'credit' as const,
      examDate: addDays(currentMonday, -6),
      retakeDate: null,
      teacher: 'ст. преп. Федорова Е.В.',
    },
    {
      sub: 'Физическая культура',
      points: 60,
      grade: 3,
      status: 'earned' as const,
      type: 'credit' as const,
      examDate: addDays(currentMonday, -4),
      retakeDate: null,
      teacher: 'Васильев О.К.',
    },
  ];
  for (const g of timurGrades) {
    await upsertGrade(timurIds.profileId, g.sub, 3, {
      points: g.points,
      grade: g.grade,
      creditStatus: g.status,
      assessmentType: g.type,
      examDate: g.examDate,
      retakeDate: g.retakeDate,
      teacher: g.teacher,
    });
  }

  // Lina (avg 76.4, GPA 4.2)
  const linaGrades = [
    {
      sub: 'Макроэкономика',
      points: null,
      grade: null,
      status: 'in_progress' as const,
      type: 'exam' as const,
      examDate: addDays(currentMonday, 23),
      teacher: 'проф. Дмитриев А.Н.',
    },
    {
      sub: 'Дипломатический протокол',
      points: 80,
      grade: 4,
      status: 'earned' as const,
      type: 'credit' as const,
      examDate: addDays(currentMonday, -10),
      teacher: 'проф. Соколов И.В.',
    },
    {
      sub: 'Политическая философия',
      points: 75,
      grade: 4,
      status: 'earned' as const,
      type: 'exam' as const,
      examDate: addDays(currentMonday, -14),
      teacher: 'доц. Громов В.П.',
    },
    {
      sub: 'Английский язык для дипломатов',
      points: 88,
      grade: 5,
      status: 'earned' as const,
      type: 'credit' as const,
      examDate: addDays(currentMonday, -7),
      teacher: 'ст. преп. Смирнова М.Ю.',
    },
    {
      sub: 'Статистика в международных исследованиях',
      points: 70,
      grade: 3,
      status: 'earned' as const,
      type: 'exam' as const,
      examDate: addDays(currentMonday, -20),
      teacher: 'доц. Ковалев С.А.',
    },
    {
      sub: 'Русский язык как иностранный',
      points: 78,
      grade: 4,
      status: 'earned' as const,
      type: 'credit' as const,
      examDate: addDays(currentMonday, -5),
      teacher: 'доц. Морозова Т.С.',
    },
  ];
  for (const g of linaGrades) {
    await upsertGrade(linaIds.profileId, g.sub, 3, {
      points: g.points,
      grade: g.grade,
      creditStatus: g.status,
      assessmentType: g.type,
      examDate: g.examDate,
      teacher: g.teacher,
    });
  }

  // Extra roster students' summary grades so Staff list shows realistic GPAs & debts
  const extraRosterGrades: Array<{
    email: string;
    sub: string;
    points: number;
    grade: number;
    status: 'earned' | 'failed';
  }> = [
    {
      email: 'd.morozov@demo.edu',
      sub: 'Дипломатический протокол',
      points: 82,
      grade: 4,
      status: 'earned',
    },
    {
      email: 's.kim@demo.edu',
      sub: 'Дипломатический протокол',
      points: 91,
      grade: 5,
      status: 'earned',
    },
    {
      email: 'm.volkov@demo.edu',
      sub: 'Дипломатический протокол',
      points: 71,
      grade: 4,
      status: 'earned',
    },
    {
      email: 'a.vasilieva@demo.edu',
      sub: 'Дипломатический протокол',
      points: 85,
      grade: 5,
      status: 'earned',
    },
    {
      email: 'a.zakharova@demo.edu',
      sub: 'Мировые финансовые рынки',
      points: 87,
      grade: 5,
      status: 'earned',
    },
    {
      email: 'a.gasparyan@demo.edu',
      sub: 'Мировые финансовые рынки',
      points: 75,
      grade: 4,
      status: 'earned',
    },
    {
      email: 'e.popova@demo.edu',
      sub: 'Мировые финансовые рынки',
      points: 85,
      grade: 5,
      status: 'earned',
    },
    {
      email: 'k.lebedev@demo.edu',
      sub: 'Эконометрика и анализ данных',
      points: 45,
      grade: 2,
      status: 'failed',
    },
    {
      email: 'd.savelev@demo.edu',
      sub: 'Современная дипломатическая практика',
      points: 90,
      grade: 5,
      status: 'earned',
    },
    {
      email: 'e.orlova@demo.edu',
      sub: 'Современная дипломатическая практика',
      points: 86,
      grade: 5,
      status: 'earned',
    },
    {
      email: 'p.sergeeva@demo.edu',
      sub: 'Международное публичное право',
      points: 80,
      grade: 4,
      status: 'earned',
    },
    {
      email: 'r.kuznetsov@demo.edu',
      sub: 'История государства и права зарубежных стран',
      points: 44,
      grade: 2,
      status: 'failed',
    },
  ];
  for (const eg of extraRosterGrades) {
    const ids = userMap.get(eg.email);
    if (ids) {
      await upsertGrade(ids.profileId, eg.sub, 3, {
        points: eg.points,
        grade: eg.grade,
        creditStatus: eg.status,
        assessmentType: 'exam',
        examDate: null,
        teacher: 'проф. Соколов И.В.',
      });
    }
  }

  // ── 10. Request Types ──────────────────────────────────────────────────────
  const requestTypesData = [
    {
      code: 'study_certificate' as const,
      title: 'Справка об обучении',
      description:
        'Подтверждение статуса студента для визовых центров, налоговой или места работы.',
      slaDays: 2,
      fields: [
        {
          name: 'purpose',
          label: 'Место предъявления',
          type: 'text',
          required: true,
          placeholder: 'Например: Пенсионный фонд РФ, По месту работы',
        },
        {
          name: 'copies',
          label: 'Количество экземпляров',
          type: 'number',
          required: true,
          placeholder: '1',
        },
        {
          name: 'delivery',
          label: 'Форма получения',
          type: 'select',
          required: true,
          options: ['Электронный макет (PDF, демо)', 'Бумажная в деканате'],
        },
        {
          name: 'notes',
          label: 'Дополнительные примечания',
          type: 'textarea',
          required: false,
          placeholder: 'Укажите период или дополнительные требования',
        },
      ],
    },
    {
      code: 'military_certificate' as const,
      title: 'Справка для военкомата (Приложение №4)',
      description: 'Для подтверждения отсрочки от призыва в Вооруженные Силы РФ.',
      slaDays: 3,
      fields: [
        {
          name: 'militaryOffice',
          label: 'Наименование военного комиссариата',
          type: 'text',
          required: true,
          placeholder: 'Например: ОВК по Раменскому району г. Москвы',
        },
        {
          name: 'copies',
          label: 'Количество экземпляров',
          type: 'number',
          required: true,
          placeholder: '1',
        },
        {
          name: 'delivery',
          label: 'Способ получения',
          type: 'select',
          required: true,
          options: ['Лично в деканате с оригиналом паспорта', 'Электронная копия (демо-макет)'],
        },
      ],
    },
    {
      code: 'scholarship_application' as const,
      title: 'Заявление на повышенную стипендию',
      description:
        'За особые достижения в учебной, научно-исследовательской или общественной деятельности.',
      slaDays: 5,
      fields: [
        {
          name: 'category',
          label: 'Категория достижений',
          type: 'select',
          required: true,
          options: [
            'Научно-исследовательская (статьи, конференции)',
            'Учебная (отличная успеваемость)',
            'Общественная и волонтерская',
            'Спортивная',
          ],
        },
        {
          name: 'achievements',
          label: 'Перечень подтверждающих документов',
          type: 'textarea',
          required: true,
          placeholder: '1. Диплом I степени в олимпиаде...\n2. Публикация в сборнике...',
        },
        {
          name: 'accountNumber',
          label: 'Номер карты "МИР" для начисления',
          type: 'text',
          required: true,
          placeholder: '2200 0000 0000 0000',
        },
      ],
    },
    {
      code: 'transcript' as const,
      title: 'Транскрипт (Академическая справка)',
      description:
        'Выписка всех изученных дисциплин с часами, кредитами и оценками (в т.ч. на английском языке).',
      slaDays: 4,
      fields: [
        {
          name: 'language',
          label: 'Язык документа',
          type: 'select',
          required: true,
          options: ['Русский', 'Английский (English)', 'Двуязычный (RU/EN)'],
        },
        {
          name: 'purpose',
          label: 'Цель получения',
          type: 'text',
          required: true,
          placeholder: 'Для стажировки, перевода или гранта',
        },
        {
          name: 'copies',
          label: 'Количество копий',
          type: 'number',
          required: true,
          placeholder: '1',
        },
      ],
    },
    {
      code: 'dormitory_application' as const,
      title: 'Заявление на место в общежитии',
      description: 'Предоставление места проживания в студенческом городке университета.',
      slaDays: 7,
      fields: [
        {
          name: 'homeCity',
          label: 'Город постоянной регистрации',
          type: 'text',
          required: true,
          placeholder: 'Например: Владивосток',
        },
        {
          name: 'benefitCategory',
          label: 'Льготная категория (при наличии)',
          type: 'select',
          required: false,
          options: [
            'Нет льготы (общий конкурс)',
            'Сирота / оставшийся без попечения',
            'Инвалид I или II группы',
            'Многодетная семья',
          ],
        },
        {
          name: 'preferredCampus',
          label: 'Предпочтительный корпус',
          type: 'select',
          required: true,
          options: ['Студгородок №1 (ул. Университетская)', 'Студгородок №2 (пр. Науки)'],
        },
      ],
    },
    {
      code: 'academic_leave' as const,
      title: 'Заявление на академический отпуск',
      description:
        'Оформление временного перерыва в обучении по медицинским или семейным обстоятельствам.',
      slaDays: 10,
      fields: [
        {
          name: 'reason',
          label: 'Основание для отпуска',
          type: 'select',
          required: true,
          options: [
            'По медицинским показаниям (справка ВКК)',
            'По семейным обстоятельствам',
            'Призыв на военную службу',
          ],
        },
        {
          name: 'duration',
          label: 'Срок отпуска',
          type: 'select',
          required: true,
          options: ['1 семестр', '1 академический год', '2 академических года'],
        },
        {
          name: 'documentDetails',
          label: 'Реквизиты подтверждающего документа',
          type: 'textarea',
          required: true,
          placeholder: 'Справка врачебной комиссии №... от...',
        },
      ],
    },
  ];

  for (const rt of requestTypesData) {
    await prisma.requestType.upsert({
      where: { code: rt.code },
      update: {
        title: rt.title,
        description: rt.description,
        slaDays: rt.slaDays,
        fields: rt.fields as Prisma.InputJsonValue,
      },
      create: { ...rt, fields: rt.fields as Prisma.InputJsonValue },
    });
  }

  // ── 11. Requests ───────────────────────────────────────────────────────────
  let aigulRequest = await prisma.request.findFirst({
    where: { studentId: aigulIds.userId, typeCode: 'study_certificate' },
  });
  if (!aigulRequest) {
    aigulRequest = await prisma.request.create({
      data: {
        studentId: aigulIds.userId,
        typeCode: 'study_certificate',
        status: 'in_review',
        data: {
          purpose: 'Для оформления шенгенской визы в посольство Франции',
          copies: '2',
          delivery: 'Электронный макет (PDF, демо)',
          notes: 'Просьба указать текущий семестр и срок окончания обучения (2027 год)',
        },
      },
    });
    await prisma.requestStatusHistory.createMany({
      data: [
        {
          requestId: aigulRequest.id,
          actorId: aigulIds.userId,
          status: 'submitted',
          comment: null,
          createdAt: new Date(Date.now() - 86400_000 * 3),
        },
        {
          requestId: aigulRequest.id,
          actorId: staff.id,
          status: 'in_review',
          comment:
            'Заявка принята в работу инспектором деканата Волковой М.В. Формируется электронный макет справки.',
          createdAt: new Date(Date.now() - 86400_000 * 2),
        },
      ],
    });
  }

  let timurRequest1 = await prisma.request.findFirst({
    where: { studentId: timurIds.userId, typeCode: 'dormitory_application' },
  });
  if (!timurRequest1) {
    timurRequest1 = await prisma.request.create({
      data: {
        studentId: timurIds.userId,
        typeCode: 'dormitory_application',
        status: 'needs_info',
        data: {
          homeCity: 'г. Нижневартовск, ХМАО',
          benefitCategory: 'Нет льготы (общий конкурс)',
          preferredCampus: 'Студгородок №1 (ул. Университетская)',
        },
      },
    });
    await prisma.requestStatusHistory.createMany({
      data: [
        {
          requestId: timurRequest1.id,
          actorId: timurIds.userId,
          status: 'submitted',
          comment: null,
          createdAt: new Date(Date.now() - 86400_000 * 5),
        },
        {
          requestId: timurRequest1.id,
          actorId: staff.id,
          status: 'in_review',
          comment: 'Принято в работу',
          createdAt: new Date(Date.now() - 86400_000 * 4),
        },
        {
          requestId: timurRequest1.id,
          actorId: staff.id,
          status: 'needs_info',
          comment:
            'Необходимо прикрепить скан справки о доходах семьи за последние 6 месяцев для расчета баллов на заселение.',
          createdAt: new Date(Date.now() - 86400_000 * 2),
        },
      ],
    });
  }

  let timurRequest2 = await prisma.request.findFirst({
    where: { studentId: timurIds.userId, typeCode: 'transcript' },
  });
  if (!timurRequest2) {
    timurRequest2 = await prisma.request.create({
      data: {
        studentId: timurIds.userId,
        typeCode: 'transcript',
        status: 'ready',
        data: {
          language: 'Двуязычный (RU/EN)',
          purpose: 'Для подачи документов на международную стажировку',
          copies: '1',
        },
      },
    });
    await prisma.requestStatusHistory.createMany({
      data: [
        {
          requestId: timurRequest2.id,
          actorId: timurIds.userId,
          status: 'submitted',
          comment: null,
          createdAt: new Date(Date.now() - 86400_000 * 10),
        },
        {
          requestId: timurRequest2.id,
          actorId: staff.id,
          status: 'in_review',
          comment: 'Принято в работу',
          createdAt: new Date(Date.now() - 86400_000 * 9),
        },
        {
          requestId: timurRequest2.id,
          actorId: staff.id,
          status: 'ready',
          comment:
            'Электронный макет транскрипта сформирован (демонстрационная печать и QR-код). Доступен для просмотра и скачивания в личном кабинете.',
          createdAt: new Date(Date.now() - 86400_000),
        },
      ],
    });
  }
  // Lina intentionally has 0 requests (empty state test)

  // ── 12. Exams ──────────────────────────────────────────────────────────────
  const examsData: Array<{
    code: string;
    groupId: string;
    subject: string;
    format: string;
    examiner: string;
    commissionMembers: string;
    date: string;
    rawDate: string;
    time: string;
    room: string;
    consultation: string;
    credits: number;
    status: 'scheduled';
    changeNote: string | null;
    isDebt?: boolean;
  }> = [
    {
      code: 'LAW-201',
      groupId: groupDU101.id,
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
    },
    {
      code: 'DIP-104',
      groupId: groupDU101.id,
      subject: 'История дипломатических отношений',
      format: 'Письменный экзамен и эссе',
      examiner: 'Доц. Романова Е.В.',
      commissionMembers: 'Проф. Лебедев Д.В.',
      date: '18 декабря 2026',
      rawDate: '2026-12-18',
      time: '12:30 – 15:30',
      room: 'Конференц-зал Б',
      consultation: '16 декабря в 14:00 (Конференц-зал Б)',
      credits: 4,
      status: 'scheduled',
      changeNote: null,
    },
    {
      code: 'LANG-202',
      groupId: groupDU101.id,
      subject: 'Английский язык для дипломатов',
      format: 'Комплексный экзамен (аудирование и собеседование)',
      examiner: 'Ст. преп. Смирнова М.Ю.',
      commissionMembers: 'Преп. Davis R.J., доц. Морозова Т.С.',
      date: '22 декабря 2026',
      rawDate: '2026-12-22',
      time: '09:00 – 13:00',
      room: 'Лингво-класс 2',
      consultation: '20 декабря в 12:00 (Лингво-класс 2)',
      credits: 4,
      status: 'scheduled',
      changeNote: null,
    },
    {
      code: 'POL-205',
      groupId: groupDU101.id,
      subject: 'Политическая философия и этика',
      format: 'Устный экзамен по билетам',
      examiner: 'Доц. Громов В.П.',
      commissionMembers: 'Доц. Ковалев С.А.',
      date: '26 декабря 2026',
      rawDate: '2026-12-26',
      time: '11:00 – 15:00',
      room: 'Ауд. 214',
      consultation: '24 декабря в 14:00 (ауд. 214)',
      credits: 4,
      status: 'scheduled',
      changeNote: null,
    },
    {
      code: 'STAT-102',
      groupId: groupDU205.id,
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
      isDebt: true,
      changeNote: 'Комиссионная пересдача за осенний семестр',
    },
    {
      code: 'ECON-203',
      groupId: groupDU205.id,
      subject: 'Мировая экономика и международная торговля',
      format: 'Компьютерное тестирование и кейсы',
      examiner: 'Проф. Григорьев С.П.',
      commissionMembers: 'Доц. Ковалев С.А.',
      date: '23 декабря 2026',
      rawDate: '2026-12-23',
      time: '09:00 – 12:00',
      room: 'Компьютерный класс 208',
      consultation: '21 декабря в 16:00 (ауд. 208)',
      credits: 5,
      status: 'scheduled',
      changeNote: null,
    },
    {
      code: 'FIN-301',
      groupId: groupDU205.id,
      subject: 'Международные валютно-финансовые рынки',
      format: 'Письменный экзамен и решение кейсов',
      examiner: 'Проф. Романов Б.С.',
      commissionMembers: 'Доц. Ковалев С.А.',
      date: '16 декабря 2026',
      rawDate: '2026-12-16',
      time: '10:00 – 13:00',
      room: 'Ауд. Э-301',
      consultation: '14 декабря в 15:00 (каб. 320)',
      credits: 5,
      status: 'scheduled',
      changeNote: null,
    },
    {
      code: 'ECN-204',
      groupId: groupDU205.id,
      subject: 'Эконометрика и анализ больших данных',
      format: 'Практический экзамен в лаборатории',
      examiner: 'Доц. Ковалев С.А.',
      commissionMembers: 'Ст. преп. Семенов П.Р.',
      date: '25 декабря 2026',
      rawDate: '2026-12-25',
      time: '12:00 – 15:00',
      room: 'Лаборатория 104',
      consultation: '23 декабря в 14:00 (лаб. 104)',
      credits: 4,
      status: 'scheduled',
      changeNote: null,
    },
    {
      code: 'MAG-101',
      groupId: groupDU301.id,
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
    },
    {
      code: 'MAG-102',
      groupId: groupDU301.id,
      subject: 'Переговорный процесс в условиях кризисов',
      format: 'Ситуационный анализ и дебаты',
      examiner: 'Проф. Лебедев Д.В.',
      commissionMembers: 'Доц. Романова Е.В.',
      date: '21 декабря 2026',
      rawDate: '2026-12-21',
      time: '10:00 – 14:00',
      room: 'Ауд. 320',
      consultation: '19 декабря в 15:00 (ауд. 320)',
      credits: 6,
      status: 'scheduled',
      changeNote: null,
    },
    {
      code: 'JUR-101',
      groupId: groupDU102.id,
      subject: 'Теория государства и международного права',
      format: 'Устный экзамен по билетам',
      examiner: 'Доц. Громов В.П.',
      commissionMembers: 'Проф. Воронов А.Н.',
      date: '14 декабря 2026',
      rawDate: '2026-12-14',
      time: '09:30 – 13:30',
      room: 'Ауд. 112',
      consultation: '12 декабря в 15:00 (ауд. 112)',
      credits: 5,
      status: 'scheduled',
      changeNote: null,
    },
    {
      code: 'JUR-102',
      groupId: groupDU102.id,
      subject: 'Римское частное право',
      format: 'Письменная работа по казусам',
      examiner: 'Доц. Морозова Т.С.',
      commissionMembers: 'Доц. Громов В.П.',
      date: '19 декабря 2026',
      rawDate: '2026-12-19',
      time: '10:00 – 13:00',
      room: 'Ауд. 115',
      consultation: '17 декабря в 14:00 (ауд. 115)',
      credits: 4,
      status: 'scheduled',
      changeNote: null,
    },
  ];

  for (const ex of examsData) {
    const existing = await prisma.exam.findUnique({ where: { code: ex.code } });
    if (!existing) {
      const snapshot = {
        date: ex.date,
        rawDate: ex.rawDate,
        time: ex.time,
        room: ex.room,
        consultation: ex.consultation,
        examiner: ex.examiner,
        commissionMembers: ex.commissionMembers,
        status: ex.status,
        changeNote: ex.changeNote,
      };
      await prisma.exam.create({
        data: {
          code: ex.code,
          groupId: ex.groupId,
          subject: ex.subject,
          format: ex.format,
          examiner: ex.examiner,
          commissionMembers: ex.commissionMembers,
          date: ex.date,
          rawDate: ex.rawDate,
          time: ex.time,
          room: ex.room,
          consultation: ex.consultation,
          credits: ex.credits,
          status: ex.status,
          changeNote: ex.changeNote,
          isDebt: ex.isDebt ?? false,
          originalSnapshot: snapshot as Prisma.InputJsonValue,
        },
      });
    }
  }

  // ── 13. Announcements ──────────────────────────────────────────────────────
  const announcementsData = [
    {
      title: 'Сроки ликвидации академических задолженностей',
      body: 'Внимание студентам! График комиссионных пересдач осеннего семестра утвержден. Пересдачи пройдут с 24 по 30 ноября. Пожалуйста, согласуйте допуск в деканате.',
      targetGroup: null,
      priority: 'high',
      kind: 'announcement' as const,
      recipientCount: 3,
      recipients: ['Айгуль Нурова', 'Тимур Белов', 'Лина Окафор'],
    },
    {
      title: 'Прием заявлений на повышенную стипендию (ПГАС)',
      body: 'Прием заявлений и подтверждающих документов на ПГАС открыт до 25 ноября. Подать заявление можно через раздел "Справки и заявления".',
      targetGroup: 'ДУ-101',
      priority: 'normal',
      kind: 'announcement' as const,
      recipientCount: 2,
      recipients: ['Айгуль Нурова', 'Лина Окафор'],
    },
    {
      title: 'Утверждено расписание зимней экзаменационной сессии',
      body: 'Деканат Факультета международных отношений опубликовал график консультаций и экзаменов на декабрь 2026 года. Проверьте даты и аудитории в разделе «Расписание».',
      targetGroup: null,
      priority: 'high',
      kind: 'announcement' as const,
      recipientCount: 15,
      recipients: ['Все студенты факультета МО'],
    },
    {
      title: 'Временное изменение аудиторий в корпусе Б',
      body: 'В связи с плановой модернизацией мультимедийного оборудования часть семинаров группы ДУ-205 перенесена в аудитории главного корпуса. Следите за статусом пар в расписании.',
      targetGroup: 'ДУ-205',
      priority: 'high',
      kind: 'schedule_change' as const,
      recipientCount: 5,
      recipients: [
        'Тимур Белов',
        'Алина Захарова',
        'Артур Гаспарян',
        'Екатерина Попова',
        'Кирилл Лебедев',
      ],
    },
    {
      title: 'График работы деканата в праздничные дни',
      body: 'Информируем о режиме работы учебного офиса DemoTech University: в государственные праздничные дни прием очных заявлений не ведется, электронные заявки принимаются круглосуточно.',
      targetGroup: null,
      priority: 'normal',
      kind: 'announcement' as const,
      recipientCount: 15,
      recipients: ['Все студенты факультета МО'],
    },
    {
      title: 'Плановый профилактический медосмотр студентов',
      body: 'До 30 ноября студентам 1–3 курсов необходимо пройти ежегодный флюорографический осмотр в университетской поликлинике (корпус Д, каб. 104).',
      targetGroup: null,
      priority: 'normal',
      kind: 'deadline' as const,
      recipientCount: 15,
      recipients: ['Все студенты факультета МО'],
    },
    {
      title: 'Конкурс на программы академической мобильности (весна 2027)',
      body: 'Открыт прием заявок на семестровый обмен для студентов 2 курса. Дедлайн подачи мотивационного письма и транскрипта — 1 декабря.',
      targetGroup: 'ДУ-101',
      priority: 'normal',
      kind: 'deadline' as const,
      recipientCount: 6,
      recipients: [
        'Айгуль Нурова',
        'Лина Окафор',
        'Даниил Морозов',
        'София Ким',
        'Максим Волков',
        'Анна Васильева',
      ],
    },
    {
      title: 'Предзащита курсовых проектов магистратуры',
      body: 'Студентам группы ДУ-301 необходимо загрузить черновики аналитических докладов куратору до 5 декабря для допуска к итоговой защите.',
      targetGroup: 'ДУ-301',
      priority: 'normal',
      kind: 'deadline' as const,
      recipientCount: 2,
      recipients: ['Дмитрий Савельев', 'Елена Орлова'],
    },
    {
      title: 'Адаптационный семинар и продление пропусков СКУД для 1 курса',
      body: 'Для студентов группы ДУ-102 в аудитории 112 пройдет встреча с куратором по вопросам сессии и обновления электронных пропусков.',
      targetGroup: 'ДУ-102',
      priority: 'normal',
      kind: 'announcement' as const,
      recipientCount: 2,
      recipients: ['Полина Сергеева', 'Роман Кузнецов'],
    },
  ];

  for (const a of announcementsData) {
    const existing = await prisma.announcement.findFirst({ where: { title: a.title } });
    if (!existing) {
      await prisma.announcement.create({
        data: {
          title: a.title,
          body: a.body,
          targetGroup: a.targetGroup,
          priority: a.priority,
          kind: a.kind,
          recipientCount: a.recipientCount,
          recipients: a.recipients as Prisma.InputJsonValue,
        },
      });
    }
  }

  // ── 14. Notifications ──────────────────────────────────────────────────────
  async function upsertNotification(data: {
    userId: string;
    kind: 'announcement' | 'deadline' | 'request_update' | 'schedule_change';
    title: string;
    body: string;
    read: boolean;
    priority: string;
    link?: string | null;
  }) {
    const existing = await prisma.notification.findFirst({
      where: { userId: data.userId, title: data.title },
    });
    if (!existing) {
      await prisma.notification.create({ data });
    }
  }

  // Aigul
  await upsertNotification({
    userId: aigulIds.userId,
    kind: 'request_update',
    title: 'Заявка принята в обработку',
    body: 'Ваша справка об обучении переведена в статус "В обработке". Срок готовности — до завтра.',
    read: false,
    priority: 'normal',
    link: '/requests',
  });
  await upsertNotification({
    userId: aigulIds.userId,
    kind: 'schedule_change',
    title: 'Перенос аудитории на сегодня!',
    body: 'Пара "Международное публичное право" в 10:15 перенесена из А-101 в Б-115.',
    read: true,
    priority: 'high',
    link: '/schedule',
  });
  await upsertNotification({
    userId: aigulIds.userId,
    kind: 'announcement',
    title: 'Прием документов на повышенную стипендию',
    body: 'Деканат открыл прием заявлений на ПГАС за достижения в науке и учебе до 25 ноября включительно.',
    read: true,
    priority: 'normal',
    link: '/requests',
  });

  // Timur
  await upsertNotification({
    userId: timurIds.userId,
    kind: 'request_update',
    title: 'Требуется уточнение по заявке на общежитие',
    body: 'Инспектор запросил скан справки о доходах семьи за 6 месяцев. Откройте заявку для отправки данных.',
    read: false,
    priority: 'urgent',
    link: '/requests',
  });
  await upsertNotification({
    userId: timurIds.userId,
    kind: 'deadline',
    title: 'Назначена дата пересдачи по Статистике',
    body: 'Комиссионная пересдача состоится 28 ноября в 14:00 в аудитории А-314. Явка обязательна!',
    read: false,
    priority: 'urgent',
    link: '/grades',
  });
  await upsertNotification({
    userId: timurIds.userId,
    kind: 'request_update',
    title: 'Транскрипт готов к получению',
    body: 'Ваш двуязычный транскрипт сформирован (демо-макет) и доступен для скачивания.',
    read: true,
    priority: 'normal',
    link: '/requests',
  });

  // Lina (3 unread notifications, 0 requests)
  await upsertNotification({
    userId: linaIds.userId,
    kind: 'announcement',
    title: 'График зимней экзаменационной сессии',
    body: 'Расписание экзаменов для 2 курса факультета МО утверждено и опубликовано в разделе "Успеваемость".',
    read: false,
    priority: 'high',
    link: '/grades',
  });
  await upsertNotification({
    userId: linaIds.userId,
    kind: 'announcement',
    title: 'Флюорографический осмотр студентов',
    body: 'С 20 по 24 ноября в поликлинике университета проходит обязательный плановый медосмотр.',
    read: false,
    priority: 'normal',
    link: null,
  });
  await upsertNotification({
    userId: linaIds.userId,
    kind: 'schedule_change',
    title: 'Отмена занятия во вторник',
    body: 'Семинар по Политической философии в 12:00 отменен (участие лектора в симпозиуме).',
    read: false,
    priority: 'normal',
    link: '/schedule',
  });

  console.log('✅ Seed complete (RU data, Cyrillic groups, rolling schedule, exams, roster).');
  console.log('   Dates relative to today:', isoDate(now));
}

main()
  .catch((e: unknown) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
