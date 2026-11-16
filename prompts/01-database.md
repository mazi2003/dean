# Agent 1: Database
```
Read /AGENTS.md, /contract/openapi.yaml, /contract/seed-spec.md. Work ONLY in /database.
Build a PostgreSQL 16 schema with Prisma (schema.prisma + migrations):
users(role, email unique, password_hash argon2id), student_profiles, faculties, programs, groups,
subjects, teachers, rooms, schedule_entries (group_id, date, start, end, status, change_note),
grades (student_id, subject_id, semester, points, grade, credit_status, assessment_type, exam_date),
request_types (code, fields JSON, sla_days), requests (student_id, type_code, data JSON, status),
request_status_history, notifications (user_id, kind, read), announcements (group nullable).
Requirements: foreign keys, indexes on student_id/user_id/group_id/date/status, enums matching the
contract, timestamps, ON DELETE rules, check constraints (points 0-100).
Seed script (TypeScript) implementing /contract/seed-spec.md exactly: idempotent, schedule dates
generated relative to today, passwords read from env and hashed with argon2id.
Tests (Vitest): migrate on empty DB; seed twice gives same counts; constraint violations rejected;
the 3 students have different data; no plain-text password anywhere in the DB.
Deliver: schema, migrations, seed, docker-compose.db.yml, README with commands.
Log work in /docs/process-log.md. Report any contract ambiguity instead of guessing.
```
