/**
 * Digital Dean's Office – Seed script
 * Competition concept, fictional data only. No real people or institutions.
 * Idempotent: safe to run multiple times; counts stay the same.
 *
 * Required env vars:
 *   DATABASE_URL          – Prisma connection string
 *   SEED_STUDENT_PASSWORD – plain-text password for demo student accounts
 *   SEED_STAFF_PASSWORD   – plain-text password for demo staff account
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

/** Returns Monday of the current ISO week */
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Add days to a Date */
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Format as YYYY-MM-DD */
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

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const studentPassword = requireEnv('SEED_STUDENT_PASSWORD');
  const staffPassword   = requireEnv('SEED_STAFF_PASSWORD');

  // Hash passwords (argon2id – never stored plain)
  const studentHash = await hashPassword(studentPassword);
  const staffHash   = await hashPassword(staffPassword);

  const now   = new Date();
  const monday = getMonday(now);

  // Week dates: Mon=0 … Sat=5
  const weekDates = Array.from({ length: 6 }, (_, i) => addDays(monday, i));

  // ── 1. Faculty ───────────────────────────────────────────────────────────────
  const faculty = await prisma.faculty.upsert({
    where:  { name: 'Faculty of International Relations' },
    update: {},
    create: { name: 'Faculty of International Relations' },
  });

  // ── 2. Programs ──────────────────────────────────────────────────────────────
  const programIR = await prisma.program.upsert({
    where:  { name_facultyId: { name: 'International Relations (BA)', facultyId: faculty.id } },
    update: {},
    create: { name: 'International Relations (BA)', facultyId: faculty.id },
  });
  const programWE = await prisma.program.upsert({
    where:  { name_facultyId: { name: 'World Economy (BA)', facultyId: faculty.id } },
    update: {},
    create: { name: 'World Economy (BA)', facultyId: faculty.id },
  });

  // ── 3. Groups ────────────────────────────────────────────────────────────────
  const groupDU101 = await prisma.group.upsert({
    where:  { code: 'DU-101' },
    update: {},
    create: { code: 'DU-101', programId: programIR.id, year: 2 },
  });
  const groupDU205 = await prisma.group.upsert({
    where:  { code: 'DU-205' },
    update: {},
    create: { code: 'DU-205', programId: programWE.id, year: 3 },
  });

  // ── 4. Users ─────────────────────────────────────────────────────────────────
  const aigul = await prisma.user.upsert({
    where:  { email: 'aigul.nurova@demo.edu' },
    update: { passwordHash: studentHash },
    create: {
      email: 'aigul.nurova@demo.edu',
      passwordHash: studentHash,
      fullName: 'Aigul Nurova',
      role: 'student',
    },
  });
  const timur = await prisma.user.upsert({
    where:  { email: 'timur.belov@demo.edu' },
    update: { passwordHash: studentHash },
    create: {
      email: 'timur.belov@demo.edu',
      passwordHash: studentHash,
      fullName: 'Timur Belov',
      role: 'student',
    },
  });
  const lina = await prisma.user.upsert({
    where:  { email: 'lina.okafor@demo.edu' },
    update: { passwordHash: studentHash },
    create: {
      email: 'lina.okafor@demo.edu',
      passwordHash: studentHash,
      fullName: 'Lina Okafor',
      role: 'student',
    },
  });
  const staff = await prisma.user.upsert({
    where:  { email: 'dean.office@demo.edu' },
    update: { passwordHash: staffHash },
    create: {
      email: 'dean.office@demo.edu',
      passwordHash: staffHash,
      fullName: "Maria Volkova (Dean's Office)",
      role: 'staff',
    },
  });

  // ── 5. Student profiles ───────────────────────────────────────────────────────
  const profileAigul = await prisma.studentProfile.upsert({
    where:  { userId: aigul.id },
    update: {},
    create: {
      userId:        aigul.id,
      facultyId:     faculty.id,
      programId:     programIR.id,
      groupId:       groupDU101.id,
      year:          2,
      studentNumber: 'DU-2023-001',
    },
  });
  const profileTimur = await prisma.studentProfile.upsert({
    where:  { userId: timur.id },
    update: {},
    create: {
      userId:        timur.id,
      facultyId:     faculty.id,
      programId:     programWE.id,
      groupId:       groupDU205.id,
      year:          3,
      studentNumber: 'DU-2022-002',
    },
  });
  const profileLina = await prisma.studentProfile.upsert({
    where:  { userId: lina.id },
    update: {},
    create: {
      userId:        lina.id,
      facultyId:     faculty.id,
      programId:     programIR.id,
      groupId:       groupDU101.id,
      year:          2,
      studentNumber: 'DU-2023-003',
    },
  });

  // ── 6. Subjects ───────────────────────────────────────────────────────────────
  const subjects = await Promise.all([
    prisma.subject.upsert({ where: { name: 'Diplomatic Protocol' }, update: {}, create: { name: 'Diplomatic Protocol', credits: 4, semester: 3 } }),
    prisma.subject.upsert({ where: { name: 'Macroeconomics' },       update: {}, create: { name: 'Macroeconomics',       credits: 5, semester: 3 } }),
    prisma.subject.upsert({ where: { name: 'International Law' },    update: {}, create: { name: 'International Law',    credits: 5, semester: 3 } }),
    prisma.subject.upsert({ where: { name: 'Russian as a Foreign Language' }, update: {}, create: { name: 'Russian as a Foreign Language', credits: 3, semester: 3 } }),
    prisma.subject.upsert({ where: { name: 'Political Philosophy' }, update: {}, create: { name: 'Political Philosophy', credits: 4, semester: 3 } }),
    prisma.subject.upsert({ where: { name: 'Statistics' },           update: {}, create: { name: 'Statistics',           credits: 4, semester: 3 } }),
    prisma.subject.upsert({ where: { name: 'Physical Education' },   update: {}, create: { name: 'Physical Education',   credits: 2, semester: 3 } }),
    prisma.subject.upsert({ where: { name: 'English for Diplomacy' },update: {}, create: { name: 'English for Diplomacy',credits: 3, semester: 3 } }),
  ]);
  const [diplomaProtocol, macroeconomics, intlLaw, russianLang, politPhilo, statistics, physEd, engDiplomacy] = subjects;

  // ── 7. Teachers ──────────────────────────────────────────────────────────────
  const teachers = await Promise.all([
    prisma.teacher.upsert({ where: { id: (await prisma.teacher.findFirst({ where: { fullName: 'Prof. I. Sokolov' } }))?.id ?? 'NO_MATCH' }, update: {}, create: { fullName: 'Prof. I. Sokolov' } }).catch(() => prisma.teacher.findFirstOrThrow({ where: { fullName: 'Prof. I. Sokolov' } })),
    prisma.teacher.upsert({ where: { id: (await prisma.teacher.findFirst({ where: { fullName: 'Dr. A. Petrov' } }))?.id ?? 'NO_MATCH' }, update: {}, create: { fullName: 'Dr. A. Petrov' } }).catch(() => prisma.teacher.findFirstOrThrow({ where: { fullName: 'Dr. A. Petrov' } })),
    prisma.teacher.upsert({ where: { id: (await prisma.teacher.findFirst({ where: { fullName: 'Assoc. Prof. N. Kim' } }))?.id ?? 'NO_MATCH' }, update: {}, create: { fullName: 'Assoc. Prof. N. Kim' } }).catch(() => prisma.teacher.findFirstOrThrow({ where: { fullName: 'Assoc. Prof. N. Kim' } })),
    prisma.teacher.upsert({ where: { id: (await prisma.teacher.findFirst({ where: { fullName: 'Dr. L. Hassan' } }))?.id ?? 'NO_MATCH' }, update: {}, create: { fullName: 'Dr. L. Hassan' } }).catch(() => prisma.teacher.findFirstOrThrow({ where: { fullName: 'Dr. L. Hassan' } })),
  ]);

  // ── 8. Rooms ──────────────────────────────────────────────────────────────────
  const rooms = await Promise.all([
    prisma.room.upsert({ where: { code: 'A-204' },  update: {}, create: { code: 'A-204',  building: 'A', capacity: 60 } }),
    prisma.room.upsert({ where: { code: 'B-115' },  update: {}, create: { code: 'B-115',  building: 'B', capacity: 40 } }),
    prisma.room.upsert({ where: { code: 'Lab-3' },  update: {}, create: { code: 'Lab-3',  building: 'C', capacity: 25 } }),
    prisma.room.upsert({ where: { code: 'C-301' },  update: {}, create: { code: 'C-301',  building: 'C', capacity: 80 } }),
    prisma.room.upsert({ where: { code: 'Gym-1' },  update: {}, create: { code: 'Gym-1',  building: 'D', capacity: 100 } }),
    prisma.room.upsert({ where: { code: 'A-108' },  update: {}, create: { code: 'A-108',  building: 'A', capacity: 35 } }),
  ]);
  const [roomA204, roomB115, roomLab3, roomC301, roomGym1, roomA108] = rooms;

  // ── 9. Schedule entries – DU-101 (Aigul + Lina) ───────────────────────────────
  // Helper: upsert schedule entry by composite key (groupId + date + startTime + subjectId)
  async function upsertSchedule(data: {
    groupId:   string;
    subjectId: string;
    teacherId: string | null;
    roomId:    string | null;
    date:      Date;
    startTime: string;
    endTime:   string;
    type:      'lecture' | 'seminar' | 'lab' | 'exam';
    status:    'normal' | 'room_changed' | 'moved' | 'cancelled';
    changeNote?: string | null;
  }) {
    const existing = await prisma.scheduleEntry.findFirst({
      where: {
        groupId:   data.groupId,
        subjectId: data.subjectId,
        date:      data.date,
        startTime: data.startTime,
      },
    });
    if (existing) {
      return prisma.scheduleEntry.update({
        where: { id: existing.id },
        data:  {
          status:     data.status,
          changeNote: data.changeNote ?? null,
          roomId:     data.roomId,
          startTime:  data.startTime,
          endTime:    data.endTime,
        },
      });
    }
    return prisma.scheduleEntry.create({ data });
  }

  // DU-101 schedule (Mon-Sat)
  // Monday – 2 entries (normal)
  await upsertSchedule({ groupId: groupDU101.id, subjectId: diplomaProtocol.id, teacherId: teachers[0].id, roomId: roomA204.id,  date: weekDates[0], startTime: '08:30', endTime: '10:05', type: 'lecture', status: 'normal' });
  await upsertSchedule({ groupId: groupDU101.id, subjectId: intlLaw.id,         teacherId: teachers[1].id, roomId: roomC301.id,  date: weekDates[0], startTime: '10:15', endTime: '11:50', type: 'lecture', status: 'normal' });

  // Tuesday – room_changed (1 of 2 required)
  await upsertSchedule({ groupId: groupDU101.id, subjectId: macroeconomics.id,  teacherId: teachers[2].id, roomId: roomA108.id,  date: weekDates[1], startTime: '08:30', endTime: '10:05', type: 'lecture', status: 'room_changed', changeNote: 'Аудитория изменена с B-115 на A-108.' });
  await upsertSchedule({ groupId: groupDU101.id, subjectId: politPhilo.id,      teacherId: teachers[1].id, roomId: roomC301.id,  date: weekDates[1], startTime: '10:15', endTime: '11:50', type: 'seminar', status: 'normal' });

  // Wednesday – room_changed (2 of 2 required)
  await upsertSchedule({ groupId: groupDU101.id, subjectId: engDiplomacy.id,    teacherId: teachers[3].id, roomId: roomB115.id,  date: weekDates[2], startTime: '08:30', endTime: '10:05', type: 'lab',     status: 'room_changed', changeNote: 'Занятие перенесено в B-115 (прежняя аудитория на ремонте).' });
  await upsertSchedule({ groupId: groupDU101.id, subjectId: russianLang.id,     teacherId: teachers[0].id, roomId: roomLab3.id,  date: weekDates[2], startTime: '10:15', endTime: '11:50', type: 'seminar', status: 'normal' });

  // Thursday – cancelled (1 required)
  await upsertSchedule({ groupId: groupDU101.id, subjectId: physEd.id,          teacherId: teachers[2].id, roomId: roomGym1.id,  date: weekDates[3], startTime: '12:00', endTime: '13:35', type: 'seminar', status: 'cancelled', changeNote: 'Занятие отменено по болезни преподавателя.' });
  await upsertSchedule({ groupId: groupDU101.id, subjectId: diplomaProtocol.id, teacherId: teachers[0].id, roomId: roomA204.id,  date: weekDates[3], startTime: '14:00', endTime: '15:35', type: 'seminar', status: 'normal' });

  // Friday – moved (1 required)
  await upsertSchedule({ groupId: groupDU101.id, subjectId: intlLaw.id,         teacherId: teachers[1].id, roomId: roomC301.id,  date: weekDates[4], startTime: '10:15', endTime: '11:50', type: 'lecture', status: 'moved', changeNote: 'Занятие перенесено с 08:30 на 10:15.' });
  await upsertSchedule({ groupId: groupDU101.id, subjectId: politPhilo.id,      teacherId: teachers[1].id, roomId: roomA204.id,  date: weekDates[4], startTime: '12:00', endTime: '13:35', type: 'lecture', status: 'normal' });

  // Saturday – 2 entries
  await upsertSchedule({ groupId: groupDU101.id, subjectId: macroeconomics.id,  teacherId: teachers[2].id, roomId: roomC301.id,  date: weekDates[5], startTime: '08:30', endTime: '10:05', type: 'lecture', status: 'normal' });
  await upsertSchedule({ groupId: groupDU101.id, subjectId: engDiplomacy.id,    teacherId: teachers[3].id, roomId: roomB115.id,  date: weekDates[5], startTime: '10:15', endTime: '11:50', type: 'lab',     status: 'normal' });

  // DU-205 schedule (Timur – different subjects mix)
  await upsertSchedule({ groupId: groupDU205.id, subjectId: macroeconomics.id,  teacherId: teachers[2].id, roomId: roomC301.id,  date: weekDates[0], startTime: '08:30', endTime: '10:05', type: 'lecture', status: 'normal' });
  await upsertSchedule({ groupId: groupDU205.id, subjectId: statistics.id,      teacherId: teachers[1].id, roomId: roomA204.id,  date: weekDates[0], startTime: '10:15', endTime: '11:50', type: 'lecture', status: 'normal' });
  await upsertSchedule({ groupId: groupDU205.id, subjectId: politPhilo.id,      teacherId: teachers[0].id, roomId: roomB115.id,  date: weekDates[1], startTime: '08:30', endTime: '10:05', type: 'seminar', status: 'normal' });
  await upsertSchedule({ groupId: groupDU205.id, subjectId: intlLaw.id,         teacherId: teachers[3].id, roomId: roomC301.id,  date: weekDates[1], startTime: '10:15', endTime: '11:50', type: 'lecture', status: 'normal' });
  await upsertSchedule({ groupId: groupDU205.id, subjectId: statistics.id,      teacherId: teachers[1].id, roomId: roomA204.id,  date: weekDates[2], startTime: '08:30', endTime: '10:05', type: 'seminar', status: 'normal' });
  await upsertSchedule({ groupId: groupDU205.id, subjectId: macroeconomics.id,  teacherId: teachers[2].id, roomId: roomC301.id,  date: weekDates[2], startTime: '10:15', endTime: '11:50', type: 'seminar', status: 'normal' });
  await upsertSchedule({ groupId: groupDU205.id, subjectId: engDiplomacy.id,    teacherId: teachers[3].id, roomId: roomB115.id,  date: weekDates[3], startTime: '08:30', endTime: '10:05', type: 'lab',     status: 'normal' });
  await upsertSchedule({ groupId: groupDU205.id, subjectId: physEd.id,          teacherId: teachers[0].id, roomId: roomGym1.id,  date: weekDates[4], startTime: '12:00', endTime: '13:35', type: 'seminar', status: 'normal' });

  // ── 10. Grades ────────────────────────────────────────────────────────────────
  // Aigul: avg ~88, 2 upcoming exams (in_progress), rest earned
  const aigulExamDate1 = addDays(now, 7);
  const aigulExamDate2 = addDays(now, 14);

  const aigulGradesData = [
    { subjectId: diplomaProtocol.id, points: 92, grade: 5, creditStatus: 'earned'      as const, assessmentType: 'exam'      as const, examDate: null },
    { subjectId: macroeconomics.id,  points: 88, grade: 5, creditStatus: 'earned'      as const, assessmentType: 'exam'      as const, examDate: null },
    { subjectId: russianLang.id,     points: 85, grade: 4, creditStatus: 'earned'      as const, assessmentType: 'credit'    as const, examDate: null },
    { subjectId: politPhilo.id,      points: 90, grade: 5, creditStatus: 'earned'      as const, assessmentType: 'exam'      as const, examDate: null },
    { subjectId: physEd.id,          points: 95, grade: 5, creditStatus: 'earned'      as const, assessmentType: 'credit'    as const, examDate: null },
    { subjectId: engDiplomacy.id,    points: 87, grade: 4, creditStatus: 'earned'      as const, assessmentType: 'coursework' as const, examDate: null },
    { subjectId: intlLaw.id,         points: null, grade: null, creditStatus: 'in_progress' as const, assessmentType: 'exam' as const, examDate: aigulExamDate1 },
    { subjectId: statistics.id,      points: null, grade: null, creditStatus: 'in_progress' as const, assessmentType: 'exam' as const, examDate: aigulExamDate2 },
  ];

  for (const g of aigulGradesData) {
    const existing = await prisma.grade.findFirst({
      where: { studentProfileId: profileAigul.id, subjectId: g.subjectId, semester: 3 },
    });
    if (!existing) {
      await prisma.grade.create({
        data: {
          studentProfileId: profileAigul.id,
          subjectId:        g.subjectId,
          semester:         3,
          points:           g.points,
          grade:            g.grade,
          creditStatus:     g.creditStatus,
          assessmentType:   g.assessmentType,
          examDate:         g.examDate,
        },
      });
    }
  }

  // Timur: avg ~64, failed Statistics (retake date)
  const retakeDate = addDays(now, 21);
  const timurGradesData = [
    { subjectId: macroeconomics.id,  points: 68, grade: 3, creditStatus: 'earned'      as const, assessmentType: 'exam'      as const, examDate: null },
    { subjectId: politPhilo.id,      points: 62, grade: 3, creditStatus: 'earned'      as const, assessmentType: 'exam'      as const, examDate: null },
    { subjectId: intlLaw.id,         points: 70, grade: 3, creditStatus: 'earned'      as const, assessmentType: 'exam'      as const, examDate: null },
    { subjectId: engDiplomacy.id,    points: 65, grade: 3, creditStatus: 'earned'      as const, assessmentType: 'coursework' as const, examDate: null },
    { subjectId: physEd.id,          points: 72, grade: 3, creditStatus: 'earned'      as const, assessmentType: 'credit'    as const, examDate: null },
    { subjectId: russianLang.id,     points: 58, grade: 3, creditStatus: 'earned'      as const, assessmentType: 'credit'    as const, examDate: null },
    { subjectId: diplomaProtocol.id, points: 60, grade: 3, creditStatus: 'earned'      as const, assessmentType: 'exam'      as const, examDate: null },
    { subjectId: statistics.id,      points: 48, grade: 2, creditStatus: 'failed'       as const, assessmentType: 'exam'      as const, examDate: retakeDate },
  ];

  for (const g of timurGradesData) {
    const existing = await prisma.grade.findFirst({
      where: { studentProfileId: profileTimur.id, subjectId: g.subjectId, semester: 3 },
    });
    if (!existing) {
      await prisma.grade.create({
        data: {
          studentProfileId: profileTimur.id,
          subjectId:        g.subjectId,
          semester:         3,
          points:           g.points,
          grade:            g.grade,
          creditStatus:     g.creditStatus,
          assessmentType:   g.assessmentType,
          examDate:         g.examDate,
        },
      });
    }
  }

  // Lina: avg ~76, all in progress or earned
  const linaGradesData = [
    { subjectId: diplomaProtocol.id, points: 80, grade: 4, creditStatus: 'earned'      as const, assessmentType: 'exam'      as const, examDate: null },
    { subjectId: macroeconomics.id,  points: 74, grade: 3, creditStatus: 'earned'      as const, assessmentType: 'exam'      as const, examDate: null },
    { subjectId: intlLaw.id,         points: 78, grade: 4, creditStatus: 'earned'      as const, assessmentType: 'exam'      as const, examDate: null },
    { subjectId: russianLang.id,     points: 76, grade: 4, creditStatus: 'earned'      as const, assessmentType: 'credit'    as const, examDate: null },
    { subjectId: politPhilo.id,      points: 72, grade: 3, creditStatus: 'earned'      as const, assessmentType: 'exam'      as const, examDate: null },
    { subjectId: physEd.id,          points: 82, grade: 4, creditStatus: 'earned'      as const, assessmentType: 'credit'    as const, examDate: null },
    { subjectId: engDiplomacy.id,    points: 75, grade: 4, creditStatus: 'earned'      as const, assessmentType: 'coursework' as const, examDate: null },
    { subjectId: statistics.id,      points: 73, grade: 3, creditStatus: 'earned'      as const, assessmentType: 'exam'      as const, examDate: null },
  ];

  for (const g of linaGradesData) {
    const existing = await prisma.grade.findFirst({
      where: { studentProfileId: profileLina.id, subjectId: g.subjectId, semester: 3 },
    });
    if (!existing) {
      await prisma.grade.create({
        data: {
          studentProfileId: profileLina.id,
          subjectId:        g.subjectId,
          semester:         3,
          points:           g.points,
          grade:            g.grade,
          creditStatus:     g.creditStatus,
          assessmentType:   g.assessmentType,
          examDate:         g.examDate,
        },
      });
    }
  }

  // ── 11. Request types ─────────────────────────────────────────────────────────
  const requestTypesData = [
    {
      code: 'study_certificate' as const,
      title: 'Справка об обучении',
      description: 'Официальная справка, подтверждающая факт обучения в Demo University.',
      slaDays: 3,
      fields: [
        { key: 'purpose',  label: 'Цель получения', type: 'text',   required: true },
        { key: 'copies',   label: 'Количество копий', type: 'number', required: true },
        { key: 'delivery', label: 'Способ получения', type: 'select', required: true, options: ['pickup', 'email'] },
      ],
    },
    {
      code: 'military_certificate' as const,
      title: 'Справка для военкомата',
      description: 'Справка об обучении для предъявления в военный комиссариат.',
      slaDays: 5,
      fields: [
        { key: 'militaryOffice', label: 'Наименование военкомата', type: 'text', required: true },
        { key: 'copies',         label: 'Количество копий',         type: 'number', required: true },
      ],
    },
    {
      code: 'scholarship_application' as const,
      title: 'Заявление на стипендию',
      description: 'Заявление на получение академической или социальной стипендии.',
      slaDays: 10,
      fields: [
        { key: 'type',   label: 'Вид стипендии',       type: 'select', required: true, options: ['academic', 'social', 'enhanced'] },
        { key: 'reason', label: 'Основание (кратко)',   type: 'text',   required: true },
      ],
    },
    {
      code: 'academic_leave' as const,
      title: 'Академический отпуск',
      description: 'Заявление на предоставление академического отпуска.',
      slaDays: 14,
      fields: [
        { key: 'reason',    label: 'Причина',              type: 'select', required: true, options: ['medical', 'family', 'other'] },
        { key: 'startDate', label: 'Планируемая дата начала', type: 'text', required: true },
        { key: 'details',   label: 'Дополнительные сведения', type: 'text', required: false },
      ],
    },
    {
      code: 'transcript' as const,
      title: 'Академическая справка (транскрипт)',
      description: 'Документ с перечнем изученных дисциплин и оценок.',
      slaDays: 5,
      fields: [
        { key: 'language', label: 'Язык документа', type: 'select', required: true, options: ['russian', 'english'] },
        { key: 'copies',   label: 'Количество копий', type: 'number', required: true },
        { key: 'delivery', label: 'Способ получения', type: 'select', required: true, options: ['pickup', 'email'] },
      ],
    },
    {
      code: 'dormitory_application' as const,
      title: 'Заявление на общежитие',
      description: 'Заявление на предоставление места в студенческом общежитии.',
      slaDays: 7,
      fields: [
        { key: 'reason',         label: 'Причина заявки',      type: 'text',   required: true },
        { key: 'preferredBlock', label: 'Предпочтительный блок', type: 'select', required: false, options: ['A', 'B', 'C'] },
      ],
    },
  ];

  for (const rt of requestTypesData) {
    await prisma.requestType.upsert({
      where:  { code: rt.code },
      update: { title: rt.title, description: rt.description, slaDays: rt.slaDays, fields: rt.fields },
      create: rt,
    });
  }

  // ── 12. Requests ──────────────────────────────────────────────────────────────
  // Aigul: 1 request in_review (study_certificate)
  let aigulRequest = await prisma.request.findFirst({
    where: { studentId: aigul.id, typeCode: 'study_certificate' },
  });
  if (!aigulRequest) {
    aigulRequest = await prisma.request.create({
      data: {
        studentId: aigul.id,
        typeCode:  'study_certificate',
        status:    'in_review',
        data:      { purpose: 'Для банка', copies: 2, delivery: 'pickup' },
      },
    });
    await prisma.requestStatusHistory.createMany({
      data: [
        { requestId: aigulRequest.id, actorId: aigul.id,  status: 'submitted', comment: null,          createdAt: new Date(Date.now() - 86400_000 * 3) },
        { requestId: aigulRequest.id, actorId: staff.id,  status: 'in_review', comment: 'Принято в работу', createdAt: new Date(Date.now() - 86400_000 * 2) },
      ],
    });
  }

  // Timur: 1 needs_info (dormitory), 1 ready (transcript)
  let timurRequest1 = await prisma.request.findFirst({
    where: { studentId: timur.id, typeCode: 'dormitory_application' },
  });
  if (!timurRequest1) {
    timurRequest1 = await prisma.request.create({
      data: {
        studentId: timur.id,
        typeCode:  'dormitory_application',
        status:    'needs_info',
        data:      { reason: 'Иногородний студент', preferredBlock: 'B' },
      },
    });
    await prisma.requestStatusHistory.createMany({
      data: [
        { requestId: timurRequest1.id, actorId: timur.id,  status: 'submitted',  comment: null,                        createdAt: new Date(Date.now() - 86400_000 * 5) },
        { requestId: timurRequest1.id, actorId: staff.id,  status: 'in_review',  comment: 'Принято в работу',           createdAt: new Date(Date.now() - 86400_000 * 4) },
        { requestId: timurRequest1.id, actorId: staff.id,  status: 'needs_info', comment: 'Приложите справку о регистрации по месту жительства.', createdAt: new Date(Date.now() - 86400_000 * 2) },
      ],
    });
  }

  let timurRequest2 = await prisma.request.findFirst({
    where: { studentId: timur.id, typeCode: 'transcript' },
  });
  if (!timurRequest2) {
    timurRequest2 = await prisma.request.create({
      data: {
        studentId: timur.id,
        typeCode:  'transcript',
        status:    'ready',
        data:      { language: 'russian', copies: 1, delivery: 'pickup' },
      },
    });
    await prisma.requestStatusHistory.createMany({
      data: [
        { requestId: timurRequest2.id, actorId: timur.id,  status: 'submitted', comment: null,                        createdAt: new Date(Date.now() - 86400_000 * 10) },
        { requestId: timurRequest2.id, actorId: staff.id,  status: 'in_review', comment: 'Принято в работу',           createdAt: new Date(Date.now() - 86400_000 * 9) },
        { requestId: timurRequest2.id, actorId: staff.id,  status: 'ready',     comment: 'Документ готов. Получите в деканате до пятницы.', createdAt: new Date(Date.now() - 86400_000) },
      ],
    });
  }
  // Lina: no requests (empty state test) – intentionally empty

  // ── 13. Announcements (8+) ────────────────────────────────────────────────────
  const announcementsData = [
    {
      title: 'Расписание экзаменационной сессии',
      body:  'Опубликовано расписание зимней сессии. Ознакомьтесь с датами в личном кабинете.',
      targetGroup: null,
    },
    {
      title: 'Дедлайн по документам на стипендию',
      body:  `Документы на академическую стипендию принимаются до ${isoDate(addDays(now, 5))}. Не пропустите срок!`,
      targetGroup: null,
    },
    {
      title: 'Изменение аудитории: Дипломатический протокол',
      body:  'Занятие по Дипломатическому протоколу во вторник перенесено в аудиторию A-108.',
      targetGroup: 'DU-101',
    },
    {
      title: 'Праздничный день 4 ноября',
      body:  'Занятия 4 ноября не проводятся в связи с праздником. Расписание на следующую неделю уточните в деканате.',
      targetGroup: null,
    },
    {
      title: 'Подача заявлений на академический отпуск',
      body:  'Приём заявлений на академический отпуск начинается с 1 декабря. Бланки доступны на сайте.',
      targetGroup: null,
    },
    {
      title: 'Встреча с куратором – DU-101',
      body:  `Встреча куратора с группой DU-101 состоится ${isoDate(addDays(now, 2))} в 14:00 в ауд. B-115.`,
      targetGroup: 'DU-101',
    },
    {
      title: 'Встреча с куратором – DU-205',
      body:  `Встреча куратора с группой DU-205 состоится ${isoDate(addDays(now, 3))} в 15:00 в ауд. A-204.`,
      targetGroup: 'DU-205',
    },
    {
      title: 'Обновление правил пользования библиотекой',
      body:  'С 1 декабря вступают в силу новые правила записи книг. Подробности на сайте библиотеки.',
      targetGroup: null,
    },
    {
      title: 'Конкурс студенческих проектов «Дипломат будущего»',
      body:  'Подайте заявку до 20 декабря на факультетский конкурс. Победители получат гранты на участие в международной конференции.',
      targetGroup: null,
    },
    {
      title: 'Техническое обслуживание: Электронный деканат',
      body:  'В субботу с 02:00 до 06:00 плановое ТО. Личный кабинет будет недоступен.',
      targetGroup: null,
    },
  ];

  for (const a of announcementsData) {
    const existing = await prisma.announcement.findFirst({
      where: { title: a.title },
    });
    if (!existing) {
      await prisma.announcement.create({ data: a });
    }
  }

  // ── 14. Notifications ────────────────────────────────────────────────────────
  // Helper: upsert notification by user+title (to stay idempotent)
  async function upsertNotification(data: {
    userId:    string;
    kind:      'announcement' | 'deadline' | 'request_update' | 'schedule_change';
    title:     string;
    body:      string;
    read:      boolean;
    link?:     string | null;
    createdAt?: Date;
  }) {
    const existing = await prisma.notification.findFirst({
      where: { userId: data.userId, title: data.title },
    });
    if (!existing) {
      await prisma.notification.create({ data });
    }
  }

  // Aigul notifications
  await upsertNotification({ userId: aigul.id, kind: 'request_update', title: 'Ваша заявка принята в работу', body: 'Справка об обучении передана в деканат на оформление.', read: true,  link: `/requests/${aigulRequest?.id}` });
  await upsertNotification({ userId: aigul.id, kind: 'deadline',       title: 'Дедлайн по стипендиальным документам', body: `Документы принимаются до ${isoDate(addDays(now, 5))}. Осталось 5 дней.`, read: true, link: '/request-types' });
  await upsertNotification({ userId: aigul.id, kind: 'schedule_change', title: 'Изменение расписания: Дипломатический протокол', body: 'Аудитория во вторник изменена с B-115 на A-108.', read: false, link: '/schedule' });
  await upsertNotification({ userId: aigul.id, kind: 'announcement',   title: 'Расписание экзаменационной сессии опубликовано', body: 'Ознакомьтесь с датами своих экзаменов в личном кабинете.', read: true, link: '/grades' });

  // Timur notifications
  await upsertNotification({ userId: timur.id, kind: 'request_update', title: 'Требуется дополнительная информация', body: 'По заявке на общежитие запрошены дополнительные документы.', read: true,  link: `/requests/${timurRequest1?.id}` });
  await upsertNotification({ userId: timur.id, kind: 'request_update', title: 'Документ готов к выдаче', body: 'Транскрипт готов. Получите в деканате до пятницы.', read: true, link: `/requests/${timurRequest2?.id}` });
  await upsertNotification({ userId: timur.id, kind: 'deadline',       title: 'Пересдача по Статистике', body: `Дата пересдачи назначена на ${isoDate(retakeDate)}. Подготовьтесь заранее.`, read: false, link: '/grades' });
  await upsertNotification({ userId: timur.id, kind: 'announcement',   title: 'Встреча куратора – DU-205', body: `Встреча ${isoDate(addDays(now, 3))} в 15:00, ауд. A-204.`, read: false, link: '/schedule' });

  // Lina: 3 unread notifications (spec requirement)
  await upsertNotification({ userId: lina.id,  kind: 'schedule_change', title: 'Отмена занятия: Физическая культура', body: 'Занятие в четверг отменено по болезни преподавателя.', read: false, link: '/schedule' });
  await upsertNotification({ userId: lina.id,  kind: 'schedule_change', title: 'Изменение аудитории: Английский для дипломатов', body: 'Среда, 08:30 — ауд. изменена на B-115.', read: false, link: '/schedule' });
  await upsertNotification({ userId: lina.id,  kind: 'announcement',    title: 'Встреча куратора – DU-101', body: `${isoDate(addDays(now, 2))} в 14:00, ауд. B-115.`, read: false, link: '/schedule' });
  // Also give Lina one read announcement so her list isn't totally empty
  await upsertNotification({ userId: lina.id,  kind: 'announcement',    title: 'Расписание сессии опубликовано', body: 'Ознакомьтесь с датами экзаменов.', read: true, link: '/grades' });

  console.log('✅  Seed complete.');
  console.log(`   Faculty:         1`);
  console.log(`   Programs:        2`);
  console.log(`   Groups:          2`);
  console.log(`   Users:           4  (3 students, 1 staff)`);
  console.log(`   Subjects:        ${subjects.length}`);
  console.log(`   Teachers:        ${teachers.length}`);
  console.log(`   Rooms:           ${rooms.length}`);
  console.log(`   Announcements:   ${announcementsData.length}`);
  console.log(`   Request types:   ${requestTypesData.length}`);
  console.log('   Dates are relative to today:', isoDate(now));
}

main()
  .catch((e: unknown) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
