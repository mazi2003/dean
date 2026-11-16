# Seed specification (all data fictional)
University: **Demo University** (fictional). Faculty: Faculty of International Relations (fictional).
Passwords come from env (SEED_STUDENT_PASSWORD / SEED_STAFF_PASSWORD), hashed with argon2id.
Seed must be idempotent (upsert).

## Users
| Role | Email | Full name | Faculty | Program | Year | Group |
|---|---|---|---|---|---|---|
| student | aigul.nurova@demo.edu | Aigul Nurova | Intl Relations | International Relations (BA) | 2 | DU-101 |
| student | timur.belov@demo.edu | Timur Belov | Intl Relations | World Economy (BA) | 3 | DU-205 |
| student | lina.okafor@demo.edu | Lina Okafor | Intl Relations | International Relations (BA) | 2 | DU-101 |
| staff | dean.office@demo.edu | Maria Volkova (Dean's Office) | | | | |

## Subjects (semester 3, credits)
Diplomatic Protocol (4), Macroeconomics (5), International Law (5), Russian as a Foreign Language (3),
Political Philosophy (4), Statistics (4), Physical Education (2), English for Diplomacy (3).
Grading: 0-100 points + grade (5/4/3/2) + credit status (earned / in progress / failed). Exam types: exam, credit (pass/fail), coursework.

## Data differences (must differ per student)
- Aigul: avg ~88, all passed except 2 upcoming exams; 1 request `in_review` (study certificate).
- Timur: avg ~64, failed Statistics (retake date set), 1 request `needs_info` (dormitory), 1 `ready` (transcript).
- Lina: avg ~76, no requests (tests empty state), 3 unread notifications.
- Aigul and Lina share group DU-101 schedule; Timur has a different group schedule.

## Schedule
Mon-Sat, 3-4 classes/day, 08:30/10:15/12:00/14:00/15:45 slots, rooms like A-204, B-115, Lab-3, teachers fictional
(e.g. Prof. I. Sokolov). Include for the current week: 2 room changes, 1 cancelled class, 1 moved class (new time).
Dates must be relative to "today" at seed time (generate current week dynamically).

## Request types
study_certificate, military_certificate, scholarship_application, academic_leave, transcript, dormitory_application.
Each has: title, description, required fields (e.g. purpose, copies, delivery: pickup|email), SLA days.
Status flow: submitted -> in_review -> (needs_info -> in_review) -> ready | rejected; student may cancel while submitted/in_review.

## Notifications / announcements
8+ announcements (deadline for scholarship docs, exam schedule published, room changes, holiday notice).
Per-user notifications: deadline reminders, request status changes, schedule changes. Mix read/unread.
