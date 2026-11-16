-- Digital Dean's Office – Initial migration
-- Competition concept, fictional data only.
-- PostgreSQL 16

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE "Role" AS ENUM ('student', 'staff');
CREATE TYPE "ScheduleStatus" AS ENUM ('normal', 'room_changed', 'moved', 'cancelled');
CREATE TYPE "ScheduleType" AS ENUM ('lecture', 'seminar', 'lab', 'exam');
CREATE TYPE "AssessmentType" AS ENUM ('exam', 'credit', 'coursework');
CREATE TYPE "CreditStatus" AS ENUM ('earned', 'in_progress', 'failed');
CREATE TYPE "RequestTypeCode" AS ENUM (
  'study_certificate',
  'military_certificate',
  'scholarship_application',
  'academic_leave',
  'transcript',
  'dormitory_application'
);
CREATE TYPE "RequestStatus" AS ENUM (
  'submitted', 'in_review', 'needs_info', 'ready', 'rejected', 'cancelled'
);
CREATE TYPE "NotificationKind" AS ENUM (
  'announcement', 'deadline', 'request_update', 'schedule_change'
);

-- ─── Core tables ──────────────────────────────────────────────────────────────

CREATE TABLE "users" (
  "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
  "email"         TEXT         NOT NULL,
  "password_hash" TEXT         NOT NULL,
  "full_name"     TEXT         NOT NULL,
  "role"          "Role"       NOT NULL,
  "created_at"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_role_idx"         ON "users"("role");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "faculties" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "name"       TEXT        NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "faculties_name_key" ON "faculties"("name");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "programs" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "name"       TEXT        NOT NULL,
  "faculty_id" UUID        NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "programs_pkey"               PRIMARY KEY ("id"),
  CONSTRAINT "programs_faculty_id_fkey"    FOREIGN KEY ("faculty_id")
    REFERENCES "faculties"("id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX "programs_name_faculty_id_key" ON "programs"("name", "faculty_id");
CREATE INDEX        "programs_faculty_id_idx"       ON "programs"("faculty_id");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "groups" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "code"       TEXT        NOT NULL,
  "program_id" UUID        NOT NULL,
  "year"       INTEGER     NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "groups_pkey"            PRIMARY KEY ("id"),
  CONSTRAINT "groups_program_id_fkey" FOREIGN KEY ("program_id")
    REFERENCES "programs"("id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX "groups_code_key"       ON "groups"("code");
CREATE INDEX        "groups_program_id_idx" ON "groups"("program_id");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "student_profiles" (
  "id"             UUID        NOT NULL DEFAULT gen_random_uuid(),
  "user_id"        UUID        NOT NULL,
  "faculty_id"     UUID        NOT NULL,
  "program_id"     UUID        NOT NULL,
  "group_id"       UUID        NOT NULL,
  "year"           INTEGER     NOT NULL,
  "student_number" TEXT        NOT NULL,
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "student_profiles_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "student_profiles_user_id_fkey"   FOREIGN KEY ("user_id")
    REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "student_profiles_faculty_id_fkey" FOREIGN KEY ("faculty_id")
    REFERENCES "faculties"("id") ON DELETE RESTRICT,
  CONSTRAINT "student_profiles_program_id_fkey" FOREIGN KEY ("program_id")
    REFERENCES "programs"("id") ON DELETE RESTRICT,
  CONSTRAINT "student_profiles_group_id_fkey"   FOREIGN KEY ("group_id")
    REFERENCES "groups"("id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX "student_profiles_user_id_key"        ON "student_profiles"("user_id");
CREATE UNIQUE INDEX "student_profiles_student_number_key" ON "student_profiles"("student_number");
CREATE INDEX        "student_profiles_user_id_idx"        ON "student_profiles"("user_id");
CREATE INDEX        "student_profiles_group_id_idx"       ON "student_profiles"("group_id");
CREATE INDEX        "student_profiles_faculty_id_idx"     ON "student_profiles"("faculty_id");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "subjects" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "name"       TEXT        NOT NULL,
  "credits"    INTEGER     NOT NULL,
  "semester"   INTEGER     NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "teachers" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "full_name"  TEXT        NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "rooms" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "code"       TEXT        NOT NULL,
  "building"   TEXT,
  "capacity"   INTEGER,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rooms_code_key" ON "rooms"("code");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "schedule_entries" (
  "id"          UUID            NOT NULL DEFAULT gen_random_uuid(),
  "group_id"    UUID            NOT NULL,
  "subject_id"  UUID            NOT NULL,
  "teacher_id"  UUID,
  "room_id"     UUID,
  "date"        DATE            NOT NULL,
  "start_time"  TEXT            NOT NULL,
  "end_time"    TEXT            NOT NULL,
  "type"        "ScheduleType"  NOT NULL DEFAULT 'lecture',
  "status"      "ScheduleStatus" NOT NULL DEFAULT 'normal',
  "change_note" TEXT,
  "created_at"  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT "schedule_entries_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "schedule_entries_group_id_fkey"  FOREIGN KEY ("group_id")
    REFERENCES "groups"("id") ON DELETE CASCADE,
  CONSTRAINT "schedule_entries_subject_id_fkey" FOREIGN KEY ("subject_id")
    REFERENCES "subjects"("id") ON DELETE RESTRICT,
  CONSTRAINT "schedule_entries_teacher_id_fkey" FOREIGN KEY ("teacher_id")
    REFERENCES "teachers"("id") ON DELETE SET NULL,
  CONSTRAINT "schedule_entries_room_id_fkey"    FOREIGN KEY ("room_id")
    REFERENCES "rooms"("id") ON DELETE SET NULL
);

CREATE INDEX "schedule_entries_group_id_idx"      ON "schedule_entries"("group_id");
CREATE INDEX "schedule_entries_date_idx"           ON "schedule_entries"("date");
CREATE INDEX "schedule_entries_status_idx"         ON "schedule_entries"("status");
CREATE INDEX "schedule_entries_group_id_date_idx"  ON "schedule_entries"("group_id", "date");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "grades" (
  "id"              UUID            NOT NULL DEFAULT gen_random_uuid(),
  "student_id"      UUID            NOT NULL,
  "subject_id"      UUID            NOT NULL,
  "semester"        INTEGER         NOT NULL,
  "points"          INTEGER,
  "grade"           INTEGER,
  "credit_status"   "CreditStatus"  NOT NULL,
  "assessment_type" "AssessmentType" NOT NULL,
  "exam_date"       DATE,
  "created_at"      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "updated_at"      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT "grades_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "grades_student_id_fkey" FOREIGN KEY ("student_id")
    REFERENCES "student_profiles"("id") ON DELETE CASCADE,
  CONSTRAINT "grades_subject_id_fkey" FOREIGN KEY ("subject_id")
    REFERENCES "subjects"("id") ON DELETE RESTRICT,
  CONSTRAINT "grades_points_check"    CHECK ("points" IS NULL OR ("points" >= 0 AND "points" <= 100)),
  CONSTRAINT "grades_grade_check"     CHECK ("grade"  IS NULL OR ("grade"  >= 2 AND "grade"  <= 5)),
  CONSTRAINT "grades_unique"          UNIQUE ("student_id", "subject_id", "semester")
);

CREATE INDEX "grades_student_id_idx"    ON "grades"("student_id");
CREATE INDEX "grades_subject_id_idx"    ON "grades"("subject_id");
CREATE INDEX "grades_credit_status_idx" ON "grades"("credit_status");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "request_types" (
  "code"        "RequestTypeCode" NOT NULL,
  "title"       TEXT              NOT NULL,
  "description" TEXT              NOT NULL,
  "fields"      JSONB             NOT NULL DEFAULT '[]',
  "sla_days"    INTEGER           NOT NULL,
  "created_at"  TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ       NOT NULL DEFAULT NOW(),

  CONSTRAINT "request_types_pkey" PRIMARY KEY ("code")
);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "requests" (
  "id"         UUID             NOT NULL DEFAULT gen_random_uuid(),
  "student_id" UUID             NOT NULL,
  "type_code"  "RequestTypeCode" NOT NULL,
  "data"       JSONB            NOT NULL DEFAULT '{}',
  "status"     "RequestStatus"  NOT NULL DEFAULT 'submitted',
  "created_at" TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT "requests_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "requests_student_id_fkey" FOREIGN KEY ("student_id")
    REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "requests_type_code_fkey"  FOREIGN KEY ("type_code")
    REFERENCES "request_types"("code") ON DELETE RESTRICT
);

CREATE INDEX "requests_student_id_idx" ON "requests"("student_id");
CREATE INDEX "requests_status_idx"     ON "requests"("status");
CREATE INDEX "requests_type_code_idx"  ON "requests"("type_code");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "request_status_history" (
  "id"         UUID            NOT NULL DEFAULT gen_random_uuid(),
  "request_id" UUID            NOT NULL,
  "actor_id"   UUID,
  "status"     "RequestStatus" NOT NULL,
  "comment"    TEXT,
  "created_at" TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT "request_status_history_pkey"           PRIMARY KEY ("id"),
  CONSTRAINT "request_status_history_request_id_fkey" FOREIGN KEY ("request_id")
    REFERENCES "requests"("id") ON DELETE CASCADE,
  CONSTRAINT "request_status_history_actor_id_fkey"   FOREIGN KEY ("actor_id")
    REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX "request_status_history_request_id_idx" ON "request_status_history"("request_id");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "notifications" (
  "id"         UUID               NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    UUID               NOT NULL,
  "kind"       "NotificationKind" NOT NULL,
  "title"      TEXT               NOT NULL,
  "body"       TEXT               NOT NULL,
  "read"       BOOLEAN            NOT NULL DEFAULT FALSE,
  "link"       TEXT,
  "created_at" TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  CONSTRAINT "notifications_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "notifications_user_id_idx"      ON "notifications"("user_id");
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");
CREATE INDEX "notifications_kind_idx"         ON "notifications"("kind");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "announcements" (
  "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
  "title"        TEXT        NOT NULL,
  "body"         TEXT        NOT NULL,
  "target_group" TEXT,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "announcements_target_group_idx" ON "announcements"("target_group");
