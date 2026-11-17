# Деплой на Vercel

Конфигурация [vercel.json](../vercel.json) использует **Vercel Services** (функция находится в статусе **Beta** на всех тарифах Vercel), чтобы разворачивать оба сервиса в рамках одного проекта и на одном домене (same-origin для `httpOnly` cookie `dean_session`):

- `backend` (`root: "backend"`, `framework: "fastify"`): Fastify API за маршрутом `/api/*` (точка входа `backend/src/app.ts` с `export default app`).
- `frontend` (`root: "frontend"`, `framework: "vite"`): Vite + React SPA с fallback-маршрутизацией на `/index.html`.

---

## 1. Подготовка PostgreSQL

Backend требует PostgreSQL 16+ и не запускает БД внутри Serverless Function. Рекомендуется подключить **Prisma Postgres** или **Neon Postgres** через Vercel Marketplace:

```bash
vercel link
vercel integration add prisma   # или: vercel integration add neon
vercel env pull .env.local --yes
```

При использовании **Prisma Postgres** для production-трафика из функций используйте pooled connection string (переменная `DATABASE_URL` с PgBouncer/pooler), а для миграций — direct connection string.

Примените миграции и заполните демонстрационные данные из папки `database/`:

```bash
cd database
npm install
# Задайте DATABASE_URL (direct connection), SEED_STUDENT_PASSWORD и SEED_STAFF_PASSWORD
npx prisma migrate deploy --schema=schema.prisma
npx ts-node --esm seed.ts
```

---

## 2. Переменные окружения в Vercel

Настройте в **Project Settings → Environment Variables** (Production & Preview) или через `vercel env add`:

| Переменная | Обязательна | Описание |
|---|---|---|
| `DATABASE_URL` | Да | Строка подключения к PostgreSQL (pooled URL для serverless; также поддерживаются `DATABASE_URL_POOLED`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL`) |
| `JWT_SECRET` | Да | Случайная строка (минимум 32 символа) |
| `COOKIE_SECRET` | Да | Случайная строка для подписи cookie (минимум 32 символа) |
| `SEED_STUDENT_PASSWORD` | Для авто-сида | Пароль демо-студентов (`DemoStudent123!`) — при наличии вместе с `SEED_STAFF_PASSWORD` сборка `backend` автоматически выполнит `prisma migrate deploy` и сид |
| `SEED_STAFF_PASSWORD` | Для авто-сида | Пароль демо-сотрудника деканата (`DemoStaff123!`) |
| `COOKIE_SECURE` | Рекомендуется | `true` для HTTPS на Vercel |
| `TRUST_PROXY` | Рекомендуется | `true` (учитывает `X-Forwarded-*` заголовки Vercel) |
| `CORS_ORIGIN` | Опционально | Ваш production-домен (через запятую для нескольких); домены Vercel (`VERCEL_URL`, `VERCEL_PROJECT_PRODUCTION_URL`) добавляются автоматически |
| `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` | Опционально | Ключи OpenAI-compatible LLM (только на сервере; без них работает детерминированный движок правил) |

---

## 3. Развертывание

### Через Git-интеграцию (рекомендуется)
1. Запушьте изменения в GitHub (`git push origin main`).
2. Импортируйте репозиторий в [Vercel Dashboard](https://vercel.com/new) (Root Directory оставьте корневым — `./`).
3. Добавьте базу данных и переменные окружения из шага 1–2 и запустите Deploy.

### Через Vercel CLI
```bash
vercel link
vercel --prod
```

Проверка работоспособности и состояния БД/сида после деплоя:
```bash
curl "https://<your-project>.vercel.app/api/v1/health?db=1"
```
