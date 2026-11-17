import crypto from 'node:crypto';
import argon2 from 'argon2';

export interface SeededIds {
  aigulUserId: string;
  timurUserId: string;
  linaUserId: string;
  staffUserId: string;
  aigulReqId: string;
  timurReqNeedsInfoId: string;
  timurReqReadyId: string;
  linaNotifUnreadId: string;
  du101ScheduleId: string;
}

export async function createStatefulMockPrisma() {
  const studentPasswordHash = await argon2.hash('DemoStudent123!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
  const staffPasswordHash = await argon2.hash('DemoStaff123!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const ids: SeededIds = {
    aigulUserId: '11111111-1111-4111-8111-111111111101',
    timurUserId: '11111111-1111-4111-8111-111111111102',
    linaUserId: '11111111-1111-4111-8111-111111111103',
    staffUserId: '11111111-1111-4111-8111-111111111104',
    aigulReqId: '22222222-2222-4222-8222-222222222201',
    timurReqNeedsInfoId: '22222222-2222-4222-8222-222222222202',
    timurReqReadyId: '22222222-2222-4222-8222-222222222203',
    linaNotifUnreadId: '33333333-3333-4333-8333-333333333301',
    du101ScheduleId: '44444444-4444-4444-8444-444444444401',
  };

  const faculty = {
    id: 'fac-ir-01',
    name: 'Faculty of International Relations',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const programs = [
    { id: 'prog-ir-01', name: 'International Relations (BA)', facultyId: faculty.id },
    { id: 'prog-we-01', name: 'World Economy (BA)', facultyId: faculty.id },
  ];

  const groups = [
    { id: 'grp-101', code: 'DU-101', programId: programs[0].id, year: 2 },
    { id: 'grp-205', code: 'DU-205', programId: programs[1].id, year: 3 },
  ];

  const users = [
    {
      id: ids.aigulUserId,
      email: 'aigul.nurova@demo.edu',
      passwordHash: studentPasswordHash,
      fullName: 'Aigul Nurova',
      role: 'student',
    },
    {
      id: ids.timurUserId,
      email: 'timur.belov@demo.edu',
      passwordHash: studentPasswordHash,
      fullName: 'Timur Belov',
      role: 'student',
    },
    {
      id: ids.linaUserId,
      email: 'lina.okafor@demo.edu',
      passwordHash: studentPasswordHash,
      fullName: 'Lina Okafor',
      role: 'student',
    },
    {
      id: ids.staffUserId,
      email: 'dean.office@demo.edu',
      passwordHash: staffPasswordHash,
      fullName: "Maria Volkova (Dean's Office)",
      role: 'staff',
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
      studentNumber: 'DU-2023-001',
    },
    {
      id: 'sp-timur',
      userId: ids.timurUserId,
      facultyId: faculty.id,
      programId: programs[1].id,
      groupId: groups[1].id,
      year: 3,
      studentNumber: 'DU-2022-002',
    },
    {
      id: 'sp-lina',
      userId: ids.linaUserId,
      facultyId: faculty.id,
      programId: programs[0].id,
      groupId: groups[0].id,
      year: 2,
      studentNumber: 'DU-2023-003',
    },
  ];

  const subjects = [
    { id: 'sub-1', name: 'Diplomatic Protocol', credits: 4, semester: 3 },
    { id: 'sub-2', name: 'International Law', credits: 5, semester: 3 },
    { id: 'sub-3', name: 'Macroeconomics', credits: 5, semester: 3 },
    { id: 'sub-4', name: 'Statistics', credits: 4, semester: 3 },
  ];

  const teachers = [
    { id: 'tch-1', fullName: 'Prof. I. Sokolov' },
    { id: 'tch-2', fullName: 'Assoc. Prof. S. Kovalev' },
  ];

  const rooms = [
    { id: 'rm-1', code: 'A-204', building: 'A', capacity: 60 },
    { id: 'rm-2', code: 'B-115', building: 'B', capacity: 40 },
    { id: 'rm-3', code: 'A-314', building: 'A', capacity: 30 },
  ];

  const today = new Date();
  const futureDate = new Date(Date.now() + 14 * 86400_000);
  const futureDate2 = new Date(Date.now() + 21 * 86400_000);

  const scheduleEntries = [
    {
      id: ids.du101ScheduleId,
      groupId: groups[0].id,
      subjectId: subjects[0].id,
      teacherId: teachers[0].id,
      roomId: rooms[0].id,
      date: new Date(today.toISOString().split('T')[0]),
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
      teacherId: teachers[0].id,
      roomId: rooms[1].id,
      date: new Date(futureDate.toISOString().split('T')[0]),
      startTime: '10:15',
      endTime: '11:50',
      type: 'seminar',
      status: 'room_changed',
      changeNote: 'Moved to B-115',
    },
    {
      id: '44444444-4444-4444-8444-444444444403',
      groupId: groups[1].id,
      subjectId: subjects[3].id,
      teacherId: teachers[1].id,
      roomId: rooms[2].id,
      date: new Date(today.toISOString().split('T')[0]),
      startTime: '14:00',
      endTime: '15:35',
      type: 'lab',
      status: 'normal',
      changeNote: null as string | null,
    },
  ];

  const grades = [
    { id: 'grd-a1', studentProfileId: 'sp-aigul', subjectId: subjects[0].id, semester: 3, points: 92, grade: 5, creditStatus: 'earned', assessmentType: 'credit', examDate: null },
    { id: 'grd-a2', studentProfileId: 'sp-aigul', subjectId: subjects[1].id, semester: 3, points: null, grade: null, creditStatus: 'in_progress', assessmentType: 'exam', examDate: futureDate },
    { id: 'grd-a3', studentProfileId: 'sp-aigul', subjectId: subjects[2].id, semester: 3, points: null, grade: null, creditStatus: 'in_progress', assessmentType: 'exam', examDate: futureDate2 },
    { id: 'grd-t1', studentProfileId: 'sp-timur', subjectId: subjects[3].id, semester: 3, points: 48, grade: 2, creditStatus: 'failed', assessmentType: 'exam', examDate: futureDate2 },
    { id: 'grd-t2', studentProfileId: 'sp-timur', subjectId: subjects[2].id, semester: 3, points: 78, grade: 4, creditStatus: 'earned', assessmentType: 'exam', examDate: null },
    { id: 'grd-l1', studentProfileId: 'sp-lina', subjectId: subjects[0].id, semester: 3, points: 76, grade: 4, creditStatus: 'earned', assessmentType: 'credit', examDate: null },
  ];

  const requestTypes = [
    { code: 'study_certificate', title: 'Справка об обучении', description: 'Официальная справка', fields: [{ key: 'purpose', label: 'Цель', type: 'text', required: true }], slaDays: 2 },
    { code: 'military_certificate', title: 'Справка для военкомата', description: 'Для военкомата', fields: [], slaDays: 5 },
    { code: 'scholarship_application', title: 'Заявление на стипендию', description: 'ПГАС', fields: [], slaDays: 10 },
    { code: 'academic_leave', title: 'Академический отпуск', description: 'Перерыв в обучении', fields: [], slaDays: 14 },
    { code: 'transcript', title: 'Транскрипт', description: 'Выписка оценок', fields: [], slaDays: 5 },
    { code: 'dormitory_application', title: 'Общежитие', description: 'Заселение', fields: [], slaDays: 7 },
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
      data: { purpose: 'Для банка', copies: 2 },
      status: 'in_review',
      createdAt: new Date(Date.now() - 86400_000 * 2),
      updatedAt: new Date(Date.now() - 86400_000),
    },
    {
      id: ids.timurReqNeedsInfoId,
      studentId: ids.timurUserId,
      typeCode: 'dormitory_application',
      data: { reason: 'Иногородний' },
      status: 'needs_info',
      createdAt: new Date(Date.now() - 86400_000 * 3),
      updatedAt: new Date(Date.now() - 86400_000),
    },
    {
      id: ids.timurReqReadyId,
      studentId: ids.timurUserId,
      typeCode: 'transcript',
      data: { language: 'russian' },
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
    { id: 'h-1', requestId: ids.aigulReqId, actorId: ids.aigulUserId, status: 'submitted', comment: null, createdAt: new Date(Date.now() - 86400_000 * 2) },
    { id: 'h-2', requestId: ids.aigulReqId, actorId: ids.staffUserId, status: 'in_review', comment: 'Принято в работу', createdAt: new Date(Date.now() - 86400_000) },
    { id: 'h-3', requestId: ids.timurReqReadyId, actorId: ids.staffUserId, status: 'ready', comment: 'Готово', createdAt: new Date(Date.now() - 86400_000) },
  ];

  const notifications: Array<{
    id: string;
    userId: string;
    kind: string;
    title: string;
    body: string;
    read: boolean;
    link: string | null;
    createdAt: Date;
  }> = [
    { id: '33333333-3333-4333-8333-333333333310', userId: ids.aigulUserId, kind: 'request_update', title: 'Заявка в работе', body: 'Справка оформляется', read: false, link: '/requests', createdAt: new Date() },
    { id: ids.linaNotifUnreadId, userId: ids.linaUserId, kind: 'schedule_change', title: 'Отмена пары', body: 'Отменено', read: false, link: '/schedule', createdAt: new Date() },
    { id: '33333333-3333-4333-8333-333333333302', userId: ids.linaUserId, kind: 'schedule_change', title: 'Замена аудитории', body: 'Б-115', read: false, link: '/schedule', createdAt: new Date() },
    { id: '33333333-3333-4333-8333-333333333303', userId: ids.linaUserId, kind: 'announcement', title: 'Кураторский час', body: 'В 14:00', read: false, link: null, createdAt: new Date() },
    { id: '33333333-3333-4333-8333-333333333304', userId: ids.linaUserId, kind: 'announcement', title: 'График сессии', body: 'Опубликован', read: true, link: '/grades', createdAt: new Date(Date.now() - 86400_000) },
  ];

  const announcements: Array<{
    id: string;
    title: string;
    body: string;
    targetGroup: string | null;
    createdAt: Date;
  }> = [
    { id: '55555555-5555-4555-8555-555555555501', title: 'Начало сессии', body: 'Сессия с 10 декабря', targetGroup: null, createdAt: new Date() },
  ];

  function hydrateStudentProfile(sp: (typeof studentProfiles)[number], include?: Record<string, unknown>) {
    const grp = groups.find((g) => g.id === sp.groupId)!;
    const prog = programs.find((p) => p.id === sp.programId)!;
    const spGrades = grades.filter((g) => g.studentProfileId === sp.id).map((g) => ({
      ...g,
      subject: subjects.find((s) => s.id === g.subjectId)!,
    }));
    const usr = users.find((u) => u.id === sp.userId)!;
    const res: Record<string, unknown> = { ...sp };
    if (include?.user) res.user = usr;
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
    const hist = histories.filter((h) => h.requestId === r.id);
    const stu = users.find((u) => u.id === r.studentId)!;
    return {
      ...r,
      ...(include?.requestType ? { requestType: rt } : {}),
      ...(include?.history ? { history: hist } : {}),
      ...(include?.student ? { student: stu } : {}),
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

  const mockPrisma = {
    user: {
      findUnique: async ({ where, include }: { where: { id?: string; email?: string }; include?: Record<string, unknown> }) => {
        const u = users.find((x) => (where.id ? x.id === where.id : x.email === where.email));
        if (!u) return null;
        const out: Record<string, unknown> = { ...u };
        if (include?.studentProfile) {
          const sp = studentProfiles.find((p) => p.userId === u.id) ?? null;
          const spInc = typeof include.studentProfile === 'object' ? (include.studentProfile as { include?: Record<string, unknown> }).include : undefined;
          out.studentProfile = sp ? hydrateStudentProfile(sp, spInc) : null;
        }
        if (include?.requests) {
          const reqInc = typeof include.requests === 'object' ? (include.requests as { include?: Record<string, unknown> }).include : undefined;
          out.requests = requests.filter((r) => r.studentId === u.id).map((r) => hydrateRequest(r, reqInc));
        }
        return out;
      },
      findMany: async ({ where }: { where?: { role?: string } } = {}) => {
        return users.filter((u) => (!where?.role || u.role === where.role));
      },
    },
    studentProfile: {
      findUnique: async ({ where, include }: { where: { userId: string }; include?: Record<string, unknown> }) => {
        const sp = studentProfiles.find((p) => p.userId === where.userId);
        return sp ? hydrateStudentProfile(sp, include) : null;
      },
      findMany: async ({ include }: { include?: Record<string, unknown> } = {}) => {
        return studentProfiles.map((sp) => hydrateStudentProfile(sp, include));
      },
    },
    group: {
      findMany: async () => {
        return groups.map((g) => ({
          ...g,
          program: { ...programs.find((p) => p.id === g.programId)!, faculty },
          studentProfiles: studentProfiles
            .filter((sp) => sp.groupId === g.id)
            .map((sp) => hydrateStudentProfile(sp, { user: true, grades: true })),
        }));
      },
      findFirst: async ({ where }: { where: { code: string } }) => {
        const g = groups.find((x) => x.code === where.code);
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
    },
    scheduleEntry: {
      findMany: async ({ where }: { where: { groupId: string; date?: { gte?: Date; lte?: Date } } }) => {
        return scheduleEntries
          .filter((s) => {
            if (s.groupId !== where.groupId) return false;
            if (where.date?.gte && s.date < new Date(where.date.gte.toISOString().split('T')[0])) return false;
            if (where.date?.lte && s.date > new Date(where.date.lte.toISOString().split('T')[0])) return false;
            return true;
          })
          .map(hydrateSchedule);
      },
      findFirst: async ({ where }: { where: { groupId: string; date?: { gt?: Date }; status?: { not?: string } } }) => {
        const found = scheduleEntries.find(
          (s) =>
            s.groupId === where.groupId &&
            (!where.status?.not || s.status !== where.status.not) &&
            (!where.date?.gt || s.date > where.date.gt)
        );
        return found ? hydrateSchedule(found) : null;
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
        Object.assign(scheduleEntries[idx], data);
        return hydrateSchedule(scheduleEntries[idx]);
      },
    },
    grade: {
      findMany: async ({ where }: { where: { studentProfileId: string; semester?: number } }) => {
        return grades
          .filter((g) => g.studentProfileId === where.studentProfileId && (!where.semester || g.semester === where.semester))
          .map((g) => ({
            ...g,
            subject: subjects.find((s) => s.id === g.subjectId)!,
          }));
      },
    },
    requestType: {
      findMany: async () => requestTypes,
      findUnique: async ({ where }: { where: { code: string } }) => requestTypes.find((t) => t.code === where.code) ?? null,
    },
    request: {
      count: async ({ where }: { where?: { studentId?: string; status?: string } } = {}) =>
        requests.filter((r) => (!where?.studentId || r.studentId === where.studentId) && (!where?.status || r.status === where.status)).length,
      findMany: async ({ where, include, skip = 0, take = 20 }: { where?: { studentId?: string; status?: string }; include?: Record<string, unknown>; skip?: number; take?: number }) => {
        return requests
          .filter((r) => (!where?.studentId || r.studentId === where.studentId) && (!where?.status || r.status === where.status))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(skip, skip + take)
          .map((r) => hydrateRequest(r, include));
      },
      findFirst: async ({ where, include }: { where: { id: string; studentId?: string }; include?: Record<string, unknown> }) => {
        const found = requests.find((r) => r.id === where.id && (!where.studentId || r.studentId === where.studentId));
        return found ? hydrateRequest(found, include) : null;
      },
      findUnique: async ({ where, include }: { where: { id: string }; include?: Record<string, unknown> }) => {
        const found = requests.find((r) => r.id === where.id);
        return found ? hydrateRequest(found, include) : null;
      },
      create: async ({ data, include }: { data: { studentId: string; typeCode: string; data: Record<string, unknown>; status: string; history?: { create: Array<{ status: string; actorId?: string; comment: string | null }> } }; include?: Record<string, unknown> }) => {
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
      update: async ({ where, data, include }: { where: { id: string }; data: { status: string; history?: { create: Array<{ status: string; actorId?: string; comment: string | null }> } }; include?: Record<string, unknown> }) => {
        const r = requests.find((x) => x.id === where.id)!;
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
          (n) => n.userId === where.userId && (where.read === undefined || n.read === where.read) && (!where.kind || n.kind === where.kind)
        ).length,
      findMany: async ({ where, skip = 0, take = 20 }: { where: { userId: string; read?: boolean; kind?: string }; skip?: number; take?: number }) =>
        notifications
          .filter((n) => n.userId === where.userId && (where.read === undefined || n.read === where.read) && (!where.kind || n.kind === where.kind))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(skip, skip + take),
      findFirst: async ({ where }: { where: { id: string; userId: string } }) =>
        notifications.find((n) => n.id === where.id && n.userId === where.userId) ?? null,
      update: async ({ where, data }: { where: { id: string }; data: { read: boolean } }) => {
        const n = notifications.find((x) => x.id === where.id)!;
        n.read = data.read;
        return n;
      },
      updateMany: async ({ where, data }: { where: { userId: string; read?: boolean }; data: { read: boolean } }) => {
        let count = 0;
        for (const n of notifications) {
          if (n.userId === where.userId && (where.read === undefined || n.read === where.read)) {
            n.read = data.read;
            count++;
          }
        }
        return { count };
      },
      create: async ({ data }: { data: { userId: string; kind: string; title: string; body: string; link: string | null } }) => {
        const created = { id: crypto.randomUUID(), ...data, read: false, createdAt: new Date() };
        notifications.unshift(created);
        return created;
      },
      createMany: async ({ data }: { data: Array<{ userId: string; kind: string; title: string; body: string; link: string | null }> }) => {
        for (const d of data) {
          notifications.unshift({ id: crypto.randomUUID(), ...d, read: false, createdAt: new Date() });
        }
        return { count: data.length };
      },
    },
    announcement: {
      findMany: async () => [...announcements].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      create: async ({ data }: { data: { title: string; body: string; targetGroup: string | null } }) => {
        const created = { id: crypto.randomUUID(), ...data, createdAt: new Date() };
        announcements.unshift(created);
        return created;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const idx = announcements.findIndex((a) => a.id === where.id);
        if (idx === -1) throw new Error('Not found');
        const [removed] = announcements.splice(idx, 1);
        return removed;
      },
    },
    $transaction: async <T>(ops: Array<Promise<T>>) => Promise.all(ops),
  };

  return { mockPrisma, ids };
}
