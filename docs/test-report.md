# Отчёт о тестировании и верификации (Test & Verification Report)

> **Проект:** Цифровой деканат будущего — DemoTech University  
> **Дата финального прогона:** 2026-11-17  
> **Статус:** Все исполняемые комплекты проверок (`backend`, `frontend`, `e2e`, `load`, static security scan) завершены со статусом **PASS (0 ошибок)**.

---

## 1. Сводная матрица проверок

| Уровень | Инструмент / Команда | Покрытие / Сценарии | Результат | Замечания по среде |
|---|---|---|---|---|
| **Backend TypeScript & Build** | `npm run typecheck && npm run build` (`tsc --noEmit`, `tsc`) | Строгая типизация Fastify v5, Prisma v6.19.3, Zod v4 | **PASS** (0 ошибок) | — |
| **Backend Integration & Security** | `npm run test:coverage` (`Vitest` + `Supertest` v8) | 3 тест-сьюта: `auth-security`, `student-idor`, `staff-workflow` | **22 / 22 PASS** | Исполняется in-process с stateful Prisma test-double (`helpers/mockPrisma.ts`) + сквозной прогон с реальным PostgreSQL в E2E |
| **Frontend Static Lint** | `npm run lint` (`oxlint v1.94.0`) | Правила корректности React, хуки, неиспользуемый код | **PASS** (0 ошибок, 0 предупреждений) | — |
| **Frontend Component Tests** | `npm test` (`Vitest` + Testing Library + jsdom) | 10 тестов: LoginPage, Footer, BottomNav (>=48px), StudentCardModal, GradesPage, RequestsPage, i18n, RU/EN & SchedulePage | **10 / 10 PASS** (7.39s) | С мокированным `fetch` (без `localStorage`-эмуляции API и без `TEST_USERS`) |
| **Frontend Production Build** | `npm run build` (`tsc -b && vite build`) | Сборка PWA с code-splitting (`vendor-react`, `vendor-icons`, `vendor-qr`) и self-hosted шрифтами (`OFL-1.1`) | **PASS** (2.11s, 0 предупреждений) | Главный JS 65.20 kB gzip, CSS 39.19 kB gzip, локальные `.woff2` чанки |
| **E2E Desktop & Mobile (Real Stack)** | `npx playwright test` (`scripts/local-stack.mjs`: `embedded-postgres` + Prisma + Fastify + Vite) | 14 тестов: Auth/SSO, отсутствие Demo Switcher, WCAG Axe, RU/EN, тёмная тема, Студбилет симуляция NFC/QR, 360px overflow, серверный консультант, АРМ деканата, httpOnly cookie, RBAC `403`, IDOR `404`, аудит бандла | **14 / 14 PASS** (1.0m) | 0 непредвиденных ошибок консоли и сети, реальная БД PostgreSQL |
| **Load Smoke Benchmark (100 VU)** | `npm run test:load` (`e2e/load-smoke.mjs`) | 100 виртуальных пользователей, 10.06s нагрузки на Fastify API (`health`, `schedule`, `grades`) | **PASS** (10 600 req, 0% ошибок) | 1 053.4 RPS, **p50 79.73 ms**, **p95 149.28 ms**, **p99 495.29 ms** |
| **Static Secret & Token Scan** | PowerShell `Select-String` + `security-audit.spec.ts` | Поиск ключей API (`sk-`, `ghp_`, `AIza`), fallback-секретов, JWT в `localStorage` | **PASS** (0 утечек) | Секреты `JWT_SECRET` / `COOKIE_SECRET` fail-closed в production |
| **PostgreSQL Schema & Seed Suite** | `database/tests/schema.test.ts` | Проверка DDL-миграции, FK, constraints и idempotent seed в PostgreSQL 16 | **НЕ ЗАПУСКАЛАСЬ ЛОКАЛЬНО** | В локальной среде Windows отсутствует сервер PostgreSQL и Docker daemon; требуется `docker compose` / PG 16 |

---

## 2. Покрытие кода Backend (`backend/tests/`, v8 coverage)

Итоговая статистика по `npm run test:coverage` (**22/22 тестов пройдено**):
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
6. **Контрастность WCAG AA и доступность PWA:** устранены заниженные цветовые пары (`#245A91` на тёмно-синем `#142D4E` заменено на `#93C5FD`/`#FFFFFF`), удалено ограничение зума `user-scalable=no` из `index.html`, добавлен офлайн Service Worker `public/sw.js` (с обходом `/api/*`), RFC 5545 поля `UID`/`DTSTAMP` в `.ics`-экспорте расписания и `matchScheduleType` в `i18n.ts`.

---

## 4. Визуальные артефакты E2E

- Desktop 1280×800 (АРМ деканата — группы и контингент): `docs/screens/e2e_verified_staff_groups.png`
- Mobile 360×740 (Главная страница студента без горизонтального переполнения): `docs/screens/e2e_verified_mobile_360px.png`
