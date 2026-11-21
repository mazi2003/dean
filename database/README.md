# Database Layer (`/database`)

PostgreSQL 16+ schema, SQL migrations, idempotent TypeScript seed, and schema constraint tests for **Digital Dean's Office of the Future (DemoTech University)**.

> *Competition concept, not an official university service. Fictional data.*

---

## 1. Overview & Models

Defined in [`schema.prisma`](./schema.prisma) per [`/contract/openapi.yaml`](../contract/openapi.yaml) and [`/contract/seed-spec.md`](../contract/seed-spec.md):

- **Identity & Access:** `User` (`email` unique, `passwordHash` Argon2id, `role`: `student` | `staff` | `admin`), `StudentProfile` (`studentNumber`, `year`, `studyForm`, `status`, `avatarUrl`).
- **Academic Structure:** `Faculty`, `Program`, `Group`.
- **Schedule & Exams:** `Subject`, `Teacher`, `Room`, `ScheduleEntry` (`date`, `startTime`, `endTime`, `lessonType`, `status`: `scheduled` | `room_changed` | `moved` | `cancelled`, `changeNote`), `Exam`.
- **Grades & Credits:** `Grade` (`semester`, `points` 0–100 with DB `CHECK` constraint, `grade` 2–5, `creditStatus`: `earned` | `in_progress` | `failed`, `assessmentType`, `examDate`).
- **Dean's Office Workflow:** `RequestType` (`code`, `fields` JSON, `slaDays`), `Request` (`status`: `submitted` | `in_review` | `needs_info` | `ready` | `rejected` | `cancelled`), `RequestStatusHistory`.
- **Communications:** `Notification` (`userId`, `kind`, `read`), `Announcement` (`groupId` nullable for university-wide broadcasts).

---

## 2. Environment Setup

Copy [`.env.example`](./.env.example) to `.env` and set your PostgreSQL connection string and demo passwords:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` — PostgreSQL 16+ connection URI
- `SEED_STUDENT_PASSWORD` — Password hashed with `argon2id` for demo students (`DemoStudent123!`)
- `SEED_STAFF_PASSWORD` — Password hashed with `argon2id` for demo staff (`DemoStaff123!`)

---

## 3. Commands

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run db:generate

# Run migrations in development
npm run db:migrate

# Deploy migrations in production / CI
npm run db:migrate:deploy

# Run idempotent seed (dynamic 8-week schedule relative to current UTC Monday)
npm run db:seed

# Typecheck, lint, and run schema tests
npm run typecheck
npm run lint
npm test
```

### Standalone Database Container

To start a standalone PostgreSQL 16 instance for local development:

```bash
docker compose -f docker-compose.db.yml up -d
```
