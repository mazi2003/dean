# Отчёт о тестировании и верификации (Test & Verification Report)

> **Проект:** Цифровой деканат будущего — DemoTech University  
> **Дата финального прогона:** 2026-11-22  
> **Статус:** Все исполняемые комплекты проверок (`backend`, `frontend`, `e2e`, `load`, static security scan) завершены со статусом **PASS (0 ошибок)**.

---

## 1. Сводная матрица проверок

| Уровень | Инструмент / Команда | Покрытие / Сценарии | Результат | Замечания по среде |
|---|---|---|---|---|
| **Backend TypeScript & Build** | `npm run typecheck && npm run build` (`tsc --noEmit`, `tsc`) | Строгая типизация Fastify v5, Prisma v6.19.3, Zod v4 | **PASS** (0 ошибок) | — |
| **Backend Integration & Security** | `npm test` (`Vitest` + `Supertest`) | 6 тест-сьютов: `auth-security`, `student-idor`, `staff-workflow`, `vercel-entrypoint`, `performance-headers`, `prisma-transaction` | **44 / 44 PASS** | Исполняется in-process с stateful Prisma test-double (`helpers/mockPrisma.ts`) + сквозной прогон с реальным PostgreSQL в E2E |
| **Frontend Static Lint** | `npm run lint` (`oxlint` + `ESLint`) | Правила корректности React, хуки, неиспользуемый код, строгий TypeScript | **PASS** (0 ошибок, 0 предупреждений) | — |
| **Frontend Component Tests** | `npm test` (`Vitest` + Testing Library + jsdom) | 22 теста: LoginPage, Footer, BottomNav (>=48px), StudentCardModal, GradesPage, RequestsPage (динамические поля), CampusMapModal, ScheduleCollisionAlert, i18n (`localizePersonName` RU/EN) & SchedulePage | **22 / 22 PASS** | С мокированным `fetch` (без `localStorage`-эмуляции API и без `TEST_USERS`) |
| **Frontend Production Build** | `npm run build` (`tsc -b && vite build`) | Сборка PWA с маршрутным code-splitting (`React.lazy` + `Suspense`, `vendor-react`, `vendor-icons`, `vendor-qr`) и self-hosted шрифтами `Inter` (`OFL-1.1`) | **PASS** (0 предупреждений) | Начальный JS на `/login`: 276.99 KB raw (85.67 KB gzip), CSS 84.63 KB raw (14.23 KB gzip) |
| **E2E Desktop & Mobile (Real Stack)** | `npx playwright test` (`scripts/local-stack.mjs`: `embedded-postgres` + Prisma + Fastify + Vite) | 42 теста (Desktop 1280×800 + Mobile 360×740): Auth/SSO, отсутствие Demo Switcher, WCAG Axe, RU/EN, тёмная тема, Студбилет симуляция NFC/QR, 360px overflow, серверный консультант, АРМ деканата, сквозной цикл справок на 4 аккаунтах, httpOnly cookie, RBAC `403`, IDOR `404`, аудит бандла | **42 / 42 PASS** | 0 непредвиденных ошибок консоли и сети, реальная БД PostgreSQL |
| **Load Smoke Benchmark (100 VU)** | `npm run test:load` (`e2e/load-smoke.mjs`) | 100 виртуальных пользователей, 10.03s нагрузки на Fastify API (`health`, `schedule`, `grades`) | **PASS** (12 267 req, 0% ошибок) | 1 222.7 RPS, **p50 73.86 ms**, **p95 155.03 ms**, **p99 220.19 ms** |
| **Static Secret & Token Scan** | PowerShell `Select-String` + `security-audit.spec.ts` | Поиск ключей API (`sk-`, `ghp_`, `AIza`), fallback-секретов, JWT в `localStorage` | **PASS** (0 утечек) | Секреты `JWT_SECRET` / `COOKIE_SECRET` fail-closed в production |
| **PostgreSQL Schema & Seed Suite** | `database/tests/schema.test.ts` | Проверка DDL-миграции, FK, constraints и idempotent seed в PostgreSQL 16 | **НЕ ЗАПУСКАЛАСЬ ЛОКАЛЬНО** | В локальной среде Windows отсутствует сервер PostgreSQL и Docker daemon; требуется `docker compose` / PG 16 |

---

## 2. Покрытие кода Backend (`backend/tests/`, v8 coverage)

Итоговая статистика по `npm run test:coverage` на актуальном контуре (**44/44 тестов пройдено** в 6 тест-сьютах, срез v8 coverage по базовым модулям ниже):
- **Statements:** `77.91%` (`455 / 584`)
- **Branches:** `49.35%` (`306 / 620`)
- **Functions:** `91.83%` (`90 / 98`)
- **Lines:** `81.37%` (`437 / 537`)

| Файл | % Stmts | % Branch | % Funcs | % Lines | Что проверено |
|---|---|---|---|---|---|
| `src/app.ts` | 100.00% | 75.00% | 100.00% | 100.00% | `helmet`, строгий CORS, `setErrorHandler` (отсутствие stack trace у клиента), `rateLimit` |
| `src/middleware/auth.ts` | 88.88% | 100.00% | 100.00% | 88.88% | Проверка httpOnly JWT cookie, отклонение анонимных и поддельных токенов (`401`), RBAC |
| `src/routes/auth.ts` | 93.10% | 91.66% | 100.00% | 93.10% | `Argon2id` верификация, constant-time защита от перебора email, нормализация `.trim().toLowerCase()`, cookie флаги `HttpOnly; SameSite=Lax`, logout |
| `src/routes/requests.ts` | 91.52% | 73.07% | 100.00% | 94.54% | Жизненный цикл заявки, IDOR-изоляция (`404` на чужой `request.id` и не-UUID), отмена заявки |
| `src/routes/staff.ts` | 91.47% | 66.44% | 94.59% | 94.40% | Блокировка студенческих аккаунтов (`403`), смена статусов ЭЦП, публикация/отзыв распоряжений, группы/досье, изменение дат экзаменов |
| `src/routes/notifications.ts` | 93.54% | 78.57% | 100.00% | 92.85% | Чтение личных/групповых/общих уведомлений, отметка прочитанным без утечки чужих ID (`404`) |
| `src/routes/schedule.ts` | 94.73% | 62.50% | 100.00% | 100.00% | Фильтрация по датам и группе студента, статусы замен и переносов |
| `src/routes/grades.ts` | 87.80% | 70.37% | 100.00% | 93.33% | БРС-оценки по семестрам, расчёт GPA и академических долгов (кейс Тимура по «Статистике») |
| `src/routes/assistant.ts` | 90.90% | 61.11% | 100.00% | 90.90% | Строгий контекст только текущего студента в ответах ИИ-консультанта |
| `src/routes/profile.ts` | 85.71% | 50.00% | 100.00% | 85.71% | Чтение профиля без поля `passwordHash` |

---

## 3. Ключевые дефекты, выявленные и исправленные при верификации

1. **Критический баг UX при ошибке входа (`frontend/src/context/AuthContext.tsx`):** `login()` переключал глобальный флаг `isLoading`, из-за чего `App` размонтировал `<LoginPage />` на экран загрузки и при неверном пароле сбрасывал состояние формы без показа ошибки `401`. Исправлено: состояние загрузки формы управляется локально внутри `LoginPage`.
2. **Критический баг FK/IDOR в заявках (`backend/src/routes/requests.ts`):** `Request.studentId` в схеме Prisma ссылается на `User.id`, тогда как маршрут передавал `StudentProfile.id`. Исправлено на `req.user.sub`, добавлена валидация UUID (`404` вместо `500`), исправлены схемы Zod v4.
3. **Утечка текста 500-х ошибок в Fastify (`backend/src/app.ts`):** `setErrorHandler` был зарегистрирован после плагина маршрутов `/api/v1`, поэтому ошибки дочернего инкапсулированного контекста не попадали в центральный обработчик. Перенесено вверх до `app.register(...)`.
4. **Несоответствие версий Prisma (`database/`, `backend/`):** выровнены версии `prisma@^6.19.3` и `@prisma/client@^6.19.3`, добавлена обратная связь `Faculty.studentProfiles`, перегенерированы клиенты, добавлены non-root `Dockerfile` для `backend` и `frontend`.
5. **Горизонтальный скролл и перекрытие `BottomNav` на 360px (`App.tsx`, `Header.tsx`, `StaffDashboardPage.tsx`):** отсутствие `min-w-0` у `<main>` и длинные непереносимые заголовки/фильтры приводили к расширению layout-вьюпорта > 360px. Добавлены `min-w-0`, обёртка фильтров `flex-wrap`, компактная адаптивная вёрстка шапки и `flex-shrink-0` на маркере семестра.
6. **Контрастность WCAG AA, предотвращение авто-зума iOS и мобильная карта кампуса:** устранены заниженные цветовые пары (`#245A91` на тёмно-синем `#142D4E` заменено на `#93C5FD`/`#FFFFFF`), удалено ограничение зума `user-scalable=no` и `maximum-scale=1.0` из `index.html` с переходом на `font-size: 16px` на мобильных полях ввода (отсутствие авто-зума без нарушения WCAG 1.4.4), переработан мобильный скролл и сортировка этажей `CampusMapModal.tsx`, добавлен офлайн Service Worker `public/sw.js` (с обходом `/api/*`), RFC 5545 поля `UID`/`DTSTAMP` в `.ics`-экспорте расписания и `matchScheduleType` в `i18n.ts`.
