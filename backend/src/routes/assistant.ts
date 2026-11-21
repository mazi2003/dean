import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const AskSchema = z.object({
  question: z.string().min(1).max(500),
  lang: z.enum(['ru', 'en']).optional().default('ru'),
});

interface CallerContext {
  fullName: string;
  role: string;
  groupCode: string | null;
  programName: string | null;
  failedSubjects: Array<{
    name: string;
    points: number | null;
    grade: number | null;
    retakeDate: string | null;
    teacher: string | null;
  }>;
  todayClasses: Array<{ startTime: string; subject: string; room: string; status: string }>;
  activeRequests: Array<{ title: string; status: string }>;
}

function buildRulesAnswer(question: string, lang: 'ru' | 'en', ctx: CallerContext): string {
  const q = question.toLowerCase();
  const firstName = ctx.fullName.split(' ')[0] || (lang === 'en' ? 'Student' : 'Студент');

  // 1. Academic debts / retakes
  if (
    q.includes('пересдач') ||
    q.includes('долг') ||
    q.includes('статистик') ||
    q.includes('задолж') ||
    q.includes('retake') ||
    q.includes('debt') ||
    q.includes('statistics')
  ) {
    if (ctx.failedSubjects.length > 0) {
      const f = ctx.failedSubjects[0];
      const retakeStr = f.retakeDate ?? '2026-11-28';
      return lang === 'en'
        ? `${firstName}, according to your record, you have an academic debt in "${f.name}" (${f.points ?? 48} pts, grade ${f.grade ?? 2}). Retake is scheduled for ${retakeStr} at 14:00, Room А-314${f.teacher ? ` (${f.teacher})` : ''}.`
        : `${firstName}, по данным вашей зачетной книжки зафиксирована академическая задолженность по дисциплине «${f.name}» (${f.points ?? 48} баллов, оценка «${f.grade ?? 2}»). Комиссионная пересдача назначена на ${retakeStr} в 14:00, ауд. А-314${f.teacher ? ` (${f.teacher})` : ''}.`;
    }
    return lang === 'en'
      ? `${firstName}, you currently have no academic debts! All graded subjects in your record are passed.`
      : `${firstName}, у вас нет академических задолженностей! Все оцененные дисциплины в вашей зачетной книжке сданы успешно.`;
  }

  // 2. Scholarships (PGAS)
  if (
    q.includes('стипенди') ||
    q.includes('пгас') ||
    q.includes('выплат') ||
    q.includes('scholarship') ||
    q.includes('merit')
  ) {
    return lang === 'en'
      ? 'Applications for the Enhanced Merit Scholarship (PGAS) are open until Nov 25. Submit your application under "Certificates & Requests" -> "Enhanced Merit Scholarship", listing your research publications, Olympiad diplomas, or social achievements.'
      : 'Прием заявлений на повышенную государственную академическую стипендию (ПГАС) открыт до 25 ноября. Вы можете подать заявку онлайн в разделе «Справки и заявления» -> «Заявление на повышенную стипендию», указав ваши научные публикации, дипломы олимпиад или общественные достижения.';
  }

  // 3. Certificates / requests / statuses
  if (
    q.includes('справк') ||
    q.includes('заказ') ||
    q.includes('заявлен') ||
    q.includes('документ') ||
    q.includes('certificate') ||
    q.includes('order') ||
    q.includes('request') ||
    q.includes('document')
  ) {
    const reqNote =
      ctx.activeRequests.length > 0
        ? lang === 'en'
          ? ` You currently have ${ctx.activeRequests.length} request(s) in your log (latest: "${ctx.activeRequests[0].title}" — status: ${ctx.activeRequests[0].status}).`
          : ` Сейчас в вашем журнале ${ctx.activeRequests.length} заявк(а/и) (последняя: «${ctx.activeRequests[0].title}», статус: ${ctx.activeRequests[0].status}).`
        : '';
    return lang === 'en'
      ? `You can submit a request for an enrollment certificate, transcript, or military office document in 3 clicks under "Certificates & Requests". Standard processing takes 2–5 business days.${reqNote}`
      : `Вы можете оформить справку об обучении, транскрипт или заявление в разделе «Справки и заявления». Стандартный срок обработки — 2–5 рабочих дней; готовые макеты документов отображаются прямо в кабинете.${reqNote}`;
  }

  // 4. Schedule / classes
  if (
    q.includes('расписан') ||
    q.includes('пара') ||
    q.includes('пары') ||
    q.includes('аудитор') ||
    q.includes('schedule') ||
    q.includes('class') ||
    q.includes('room') ||
    q.includes('timetable')
  ) {
    if (ctx.todayClasses.length > 0) {
      const list = ctx.todayClasses
        .map((c) => `${c.startTime} ${c.subject} (${c.room})`)
        .join('; ');
      return lang === 'en'
        ? `Today's schedule for group ${ctx.groupCode ?? 'your group'}: ${list}.`
        : `Сегодня у группы ${ctx.groupCode ?? 'вашей группы'} по расписанию: ${list}. Актуальные замены и экспорт .ics доступны во вкладке «Расписание».`;
    }
    return lang === 'en'
      ? `No classes are scheduled for today${ctx.groupCode ? ` for group ${ctx.groupCode}` : ''}. Check the full week view in the "Timetable & Exams" tab.`
      : `Сегодня у вашей группы${ctx.groupCode ? ` (${ctx.groupCode})` : ''} занятий нет. Полная неделя и график экзаменов доступны во вкладке «Расписание и сессия».`;
  }

  // 5. Dean's office contacts / hours
  if (
    q.includes('деканат') ||
    q.includes('часы') ||
    q.includes('контакт') ||
    q.includes('где') ||
    q.includes('office') ||
    q.includes('hours') ||
    q.includes('contact')
  ) {
    return lang === 'en'
      ? "The Faculty of International Relations Dean's Office is located in the Main Building, 3rd Floor, Room 312. Office hours: Mon–Fri 09:00–18:00 (lunch 13:00–14:00). Email: dean.office@demo.edu."
      : 'Деканат факультета международных отношений расположен в Главном корпусе, 3 этаж, кабинет 312. Часы приема студентов: Пн–Пт с 09:00 до 18:00 (обед 13:00–14:00). Электронная почта: dean.office@demo.edu.';
  }

  // 6. Default contextual summary
  return lang === 'en'
    ? `Hello, ${firstName}! I am your DemoTech University server-side Academic Advisor. Context loaded from your account: group ${ctx.groupCode ?? 'Staff'}, debts: ${ctx.failedSubjects.length}, requests: ${ctx.activeRequests.length}. Ask me about retakes, classes, certificates, PGAS scholarships, or Dean's Office hours.`
    : `Здравствуйте, ${firstName}! Я серверный консультант деканата ДемоТех Университета. Контекст вашего профиля: группа ${ctx.groupCode ?? 'Сотрудник'}, задолженностей: ${ctx.failedSubjects.length}, заявлений в журнале: ${ctx.activeRequests.length}. Вы можете спросить про пересдачи, расписание, справки, ПГАС или часы работы деканата.`;
}

export async function assistantRoutes(app: FastifyInstance) {
  app.post('/assistant/ask', {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const parsed = AskSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(422).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: parsed.error.flatten(),
        });
      }

      const { question, lang } = parsed.data;
      const userId = request.user!.sub;

      // Gather strictly caller's own data (never other users' data)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          studentProfile: {
            include: {
              group: { include: { program: { include: { faculty: true } } } },
              grades: { include: { subject: true } },
            },
          },
          requests: {
            include: { requestType: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      const sp = user?.studentProfile;
      const now = new Date();
      const todayStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
      );
      const todayEnd = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
      );

      const todaySchedule = sp
        ? await prisma.scheduleEntry.findMany({
            where: { groupId: sp.groupId, date: { gte: todayStart, lte: todayEnd } },
            include: { subject: true, room: true },
            orderBy: { startTime: 'asc' },
          })
        : [];

      const ctx: CallerContext = {
        fullName: user?.fullName ?? 'Студент',
        role: request.user!.role,
        groupCode: sp?.group?.code ?? null,
        programName: sp?.group?.program?.name ?? null,
        failedSubjects: (sp?.grades ?? [])
          .filter((g) => g.creditStatus === 'failed')
          .map((g) => ({
            name: g.subject.name,
            points: g.points,
            grade: g.grade,
            retakeDate: g.retakeDate ? g.retakeDate.toISOString().split('T')[0] : null,
            teacher: g.teacher ?? null,
          })),
        todayClasses: todaySchedule.map((s) => ({
          startTime: s.startTime,
          subject: s.subject.name,
          room: s.room?.code ?? '—',
          status: s.status,
        })),
        activeRequests: (user?.requests ?? []).map((r) => ({
          title: r.requestType.title,
          status: r.status,
        })),
      };

      // Optional OpenAI-compatible LLM (server-side only, Authorization header, 10s timeout)
      const apiKey = process.env.AI_API_KEY?.trim();
      const baseUrl = process.env.AI_BASE_URL?.trim();
      const model = process.env.AI_MODEL?.trim() || 'gpt-4o-mini';

      const isAllowedBaseUrl =
        !!baseUrl &&
        (baseUrl.startsWith('https://') ||
          baseUrl.startsWith('http://localhost') ||
          baseUrl.startsWith('http://127.0.0.1'));

      if (apiKey && isAllowedBaseUrl) {
        const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
        const failedStr =
          ctx.failedSubjects
            .map((f) => `${f.name} (retake: ${f.retakeDate ?? 'TBD'})`)
            .join(', ') || 'none';
        const reqStr =
          ctx.activeRequests.map((r) => `${r.title} [${r.status}]`).join(', ') || 'none';
        const systemPrompt =
          `You are a helpful Dean's Office Academic Advisor for DemoTech University (competition prototype, fictional data). ` +
          `Respond concisely in ${lang === 'en' ? 'English' : 'Russian'}. ` +
          `Caller context (ONLY this user's data): Role=${ctx.role}, Group=${ctx.groupCode ?? 'N/A'}, Program=${ctx.programName ?? 'N/A'}, ` +
          `AcademicDebts=${failedStr}, Requests=${reqStr}. ` +
          `Dean's Office: Main Building, 3rd floor, Room 312, Mon-Fri 09:00-18:00, dean.office@demo.edu.`;

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: question },
              ],
              temperature: 0.3,
              max_tokens: 400,
            }),
            signal: AbortSignal.timeout(10_000),
          });

          if (response.ok) {
            const data = (await response.json()) as {
              choices?: Array<{ message?: { content?: string } }>;
            };
            const llmAnswer = data?.choices?.[0]?.message?.content?.trim();
            if (llmAnswer) {
              return reply.send({ answer: llmAnswer, source: 'llm' as const });
            }
          }
        } catch {
          // Fall through cleanly to deterministic server rules engine
        }
      }

      const rulesAnswer = buildRulesAnswer(question, lang, ctx);
      return reply.send({ answer: rulesAnswer, source: 'rules' as const });
    },
  });
}
