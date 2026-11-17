-- Migration: Add Exam table and metadata columns for groups, student_profiles, grades, notifications, announcements
-- Digital Dean's Office – PostgreSQL 16

CREATE TYPE "ExamStatus" AS ENUM ('scheduled', 'date_changed', 'room_changed', 'postponed', 'cancelled');

ALTER TABLE "groups"
  ADD COLUMN "admission_year" INTEGER,
  ADD COLUMN "students_count" INTEGER,
  ADD COLUMN "budget_count" INTEGER,
  ADD COLUMN "contract_count" INTEGER,
  ADD COLUMN "curator_name" TEXT,
  ADD COLUMN "curator_contact" TEXT,
  ADD COLUMN "starosta_name" TEXT,
  ADD COLUMN "starosta_email" TEXT,
  ADD COLUMN "starosta_phone" TEXT;

ALTER TABLE "student_profiles"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "study_form" TEXT NOT NULL DEFAULT 'Бюджет',
  ADD COLUMN "is_starosta" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN "dormitory_info" TEXT,
  ADD COLUMN "snils" TEXT;

ALTER TABLE "grades"
  ADD COLUMN "retake_date" DATE,
  ADD COLUMN "teacher" TEXT;

ALTER TABLE "notifications"
  ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'normal';

ALTER TABLE "announcements"
  ADD COLUMN "target_user_id" TEXT,
  ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'high',
  ADD COLUMN "kind" "NotificationKind" NOT NULL DEFAULT 'announcement',
  ADD COLUMN "recipient_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "recipients" JSONB;

CREATE TABLE "exams" (
  "id"                 UUID         NOT NULL DEFAULT gen_random_uuid(),
  "code"               TEXT         NOT NULL,
  "group_id"           UUID         NOT NULL,
  "subject"            TEXT         NOT NULL,
  "format"             TEXT         NOT NULL,
  "examiner"           TEXT         NOT NULL,
  "commission_members" TEXT,
  "date"               TEXT         NOT NULL,
  "raw_date"           TEXT         NOT NULL,
  "time"               TEXT         NOT NULL,
  "room"               TEXT         NOT NULL,
  "consultation"       TEXT         NOT NULL,
  "credits"            INTEGER      NOT NULL,
  "status"             "ExamStatus" NOT NULL DEFAULT 'scheduled',
  "change_note"        TEXT,
  "retake_date"        TEXT,
  "is_debt"            BOOLEAN      NOT NULL DEFAULT false,
  "original_snapshot"  JSONB,
  "created_at"         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT "exams_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "exams_group_id_fkey" FOREIGN KEY ("group_id")
    REFERENCES "groups"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "exams_code_key" ON "exams"("code");
CREATE INDEX "exams_group_id_idx" ON "exams"("group_id");
