# Цифровой деканат будущего (Digital Dean's Office of the Future)
> **Конкурсный концепт личного кабинета студента • DemoTech University**  
> *Не является официальным сервисом университета. Все данные, оценки, фамилии и номера документов вымышлены.*

---

## 🚀 О проекте

«Цифровой деканат будущего» — это веб-сервис и PWA-приложение на базе **Node.js (Fastify) + PostgreSQL 16 + React 19**, объединяющее студенческие сервисы и рабочее место сотрудника деканата:
- **Умный главный экран «Сегодня»**: отсчет времени до следующей пары, номер аудитории, уведомления о заменах и статус заказанных документов.
- **Расписание с оперативными изменениями**: день/неделя, бейджи замен аудиторий и переносов, расписание экзаменационной сессии и экспорт в `.ics` (Google/Apple Calendar).
- **Успеваемость и зачетка**: средний балл GPA, шкала БРС (0–100), прогресс закрытых кредитов ECTS, предупреждения о задолженностях и датах пересдач.
- **Справки и электронные заявления**: оформление в 3 клика, отслеживание жизненного цикла заявки (Подано → В обработке → Требуется уточнение → Готово), просмотр и печать **демонстрационного макета PDF** с иллюстративным штампом (в учебном прототипе настоящая квалифицированная ЭЦП не используется, документ носит ознакомительный характер и не имеет юридической силы).
- **Цифровой студенческий билет (Digital Student ID)**: электронный пропуск с динамическим QR-кодом и интерактивной **симуляцией NFC-прохода** через турникеты кампуса (иллюстративный макет).
- **Серверный Academic Copilot**: помощник деканата на сервере (`POST /api/v1/assistant/ask`), отвечающий на основе детерминированного движка правил по личным данным текущего пользователя (с опциональным подключением OpenAI-compatible LLM на стороне сервера; ключ хранится только в `.env` на сервере).
- **Панель сотрудника деканата (АРМ)**: защищенный ролевой контур для согласования заявлений, управления академическими группами и досье студентов, корректировки расписания и экзаменов, а также публикации объявлений.

---

## 👥 Тестовые учетные записи для жюри

Авторизация в системе выполняется через реальный серверный эндпоинт `POST /api/v1/auth/login` с проверкой `Argon2id`-хеша пароля и установкой `httpOnly + SameSite=Lax` cookie `dean_session`. Переключатели профилей в один клик отсутствуют; система строго изолирует данные на уровне серверной сессии.

| Роль | Логин | Пароль | Сценарий тестирования |
|---|---|---|---|
| **Студент 1** | `aigul.nurova@demo.edu` | `DemoStudent123!` | 2 курс, гр. ДУ-101. Отличница (GPA 4.8). 1 активная заявка на справку об обучении со статусом «В обработке». |
| **Студент 2** | `timur.belov@demo.edu` | `DemoStudent123!` | 3 курс, гр. ДУ-205. Академический долг по «Статистике» (пересдача 28 ноября, ауд. А-314), заявка на общежитие со статусом «Требуется уточнение» и 1 готовый макет транскрипта (PDF). |
| **Студент 3** | `lina.okafor@demo.edu` | `DemoStudent123!` | 2 курс, гр. ДУ-101. Демонстрация пустых состояний (нет заявлений) и 3 непрочитанных уведомления. |
| **Сотрудник деканата** | `dean.office@demo.edu` | `DemoStaff123!` | Мария Волкова. Панель сотрудника: обработка заявлений, изменение статусов, группы/досье, перенос экзаменов, публикация объявлений. |

---

## 🛠️ Технологический стек и безопасность

- **Frontend**: React 19, Vite 8 (Rolldown code splitting), TypeScript, Tailwind CSS v4, Lucide React, QRCode (lazy-loaded), self-hosted Inter WOFF2 (Cyrillic & Latin subsets), PWA + Service Worker v2 (Cache-First `/assets/*`, Network-First HTML, API pass-through; работает только с реальным API через cookie-сессию; в `localStorage` сохраняются только настройки темы и языка `dean_theme`/`dean_lang`).
- **Backend**: Node.js 20, Fastify v5, `@fastify/compress` (Brotli + Gzip, Vercel Edge delegation), Zod v4, Argon2id, JSON Web Tokens, Helmet, CORS, Rate Limiting, `Cache-Control: private, no-store` security hook, `trustProxy`.
- **Database**: PostgreSQL 16, Prisma ORM v6.19 (миграции и идемпотентный сид с относительным окном расписания).
- **QA**: Vitest, Testing Library, Supertest, Playwright (1280×800 и 360×740), `@axe-core/playwright`, oxlint, Docker + Caddy.
- **Безопасность**:
  - Защита от IDOR: каждый студенческий запрос фильтруется по `userId` из серверного JWT; чужие ID возвращают `404 Not Found`.
  - Пароли: хешируются через `Argon2id` (64 МБ, 3 итерации), проверка при входе в константном времени (фиктивный хеш при неизвестном email).
  - Сессия: JWT в cookie `dean_session` (`httpOnly`, `Secure` в production, `SameSite=Lax`). Токены никогда не сохраняются в `localStorage`.
  - AI Copilot: опциональные ключи (`AI_API_KEY`, `AI_BASE_URL`) хранятся только на сервере; в промпт передаются только данные текущего пользователя.

---

## 💻 Запуск и развертывание

### Вариант 1: Production-развертывание на VPS (Docker Compose + Caddy HTTPS)
Рекомендуемый способ публикации для доступа из РФ без VPN (например, Timeweb Cloud, Selectel, Beget, REG.RU — Ubuntu 22.04/24.04):

```bash
cp .env.example .env
# Заполните DB_PASSWORD, JWT_SECRET, COOKIE_SECRET, DOMAIN, CORS_ORIGIN, SEED_STUDENT_PASSWORD, SEED_STAFF_PASSWORD
docker compose up -d --build
```

Или автоматическая настройка чистого Ubuntu VPS (Docker, UFW, swap, генерация секретов, автоматический HTTPS-домен `<ip>.sslip.io` через Caddy):
```bash
sudo bash deploy/bootstrap-vps.sh --mirror
```
Подробная инструкция и проверка доступности с российских узлов (без VPN) — в [deploy/README.md](deploy/README.md).

Сервисы в Docker Compose:
- `proxy` (Caddy 2): HTTPS (`80`/`443`), маршрутизация `/api/*` → `api:3000`, остальное → `web:8080`.
- `api` (Fastify + Prisma): порт `3000` (внутренний).
- `web` (Nginx unprivileged): порт `8080` (внутренний).
- `migrate`: однократный контейнер миграций `prisma migrate deploy` + `seed.ts`.
- `db` (PostgreSQL 16): без публикации порта наружу.

### Вариант 1б: Деплой на Vercel (Vercel Services — Beta)
Репозиторий подготовлен к публикации на Vercel через [vercel.json](vercel.json) (единый домен для `frontend` Vite и `backend` Fastify и same-origin `httpOnly` cookies). Подробная инструкция по подключению Postgres, миграциям и переменным окружения — в [deploy/vercel.md](deploy/vercel.md).

```bash
vercel link
vercel --prod
```

### Вариант 2: Локальный полный стек без Docker (PostgreSQL + Backend + Frontend)
Для локального запуска с реальной встроенной БД PostgreSQL (без необходимости устанавливать Docker):
```bash
# 1. Сборка backend и frontend
cd backend && npm install && npm run build && cd ..
cd frontend && npm install && npm run build && cd ..
cd e2e && npm install && cd ..

# 2. Запуск полного стека (Embedded PostgreSQL :54329 + migrate + seed + Fastify :3000 + Preview :4176)
node scripts/local-stack.mjs
```
Откройте в браузере: `http://127.0.0.1:4176`

### Вариант 3: Автотесты и контроль качества
```bash
# Backend (typecheck + build + unit/IDOR/RBAC тесты)
cd backend && npm run typecheck && npm run build && npm test

# Frontend (oxlint + Vitest + production bundle)
cd frontend && npm run lint && npm test && npm run build

# E2E на реальном стеке PostgreSQL + Fastify + Vite (Desktop 1280x800 + Mobile 360x740 + Axe WCAG + Security Audit)
cd e2e && npx playwright test
```

---

## 📁 Структура репозитория

```
├── contract/             # Спецификация OpenAPI 3.0.3 и правила сида
├── database/             # Схема Prisma, SQL-миграции, Dockerfile миграций и seed.ts
├── backend/              # Сервер Fastify v5 (auth, profile, schedule, exams, grades, requests, staff, assistant)
├── frontend/             # Клиентское PWA-приложение React 19 + Tailwind v4 (без client-side auth bypass)
├── deploy/               # Скрипты автоматического развертывания на VPS, бэкапа и healthcheck
├── scripts/              # Локальный полный стек без Docker (embedded-postgres + API + Web)
├── e2e/                  # Сквозные тесты Playwright (Desktop/Mobile, WCAG Axe, RBAC/IDOR, аудит бандла)
├── docs/                 # Документация для жюри: submission.md/.pdf, architecture.md, process-log.md, performance-baseline.md, performance-optimization-guide.md, performance-report.md, видео и скриншоты
├── prompts/              # Промпты мультиагентной разработки
└── AGENTS.md             # Правила безопасности и архитектурные ограничения
```

---

## 📌 Ключевые характеристики прототипа

- **Продуктовая основа**: опрос 7 студентов, закрыты ключевые сценарии (расписание с заменами, БРС/GPA/ECTS, заявки и справки, уведомления) + АРМ деканата, цифровой пропуск и серверный консультант.
- **Прозрачный AI-процесс**: разработка с использованием Antigravity AI, Claude Code, Cursor IDE и Gemini; журнал ошибок ИИ и способов их устранения зафиксирован в `docs/process-log.md`.
- **Реальная серверная изоляция**: PostgreSQL 16 + Prisma, `Argon2id`, `httpOnly` JWT-куки, проверка прав на каждом роуте деканата и `404` при обращении к чужим документам.
- **Мобильная адаптивность и доступность**: Mobile-First верстка от `360px`, нижняя панель навигации с зонами нажатия ≥ 48px, светлая и тёмная темы, RU/EN локализация.
