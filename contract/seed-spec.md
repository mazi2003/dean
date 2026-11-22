# Seed specification (all data fictional)

University: **DemoTech University / ДемоТех Университет** (fictional).
Faculty: **Факультет международных отношений** (fictional).
Passwords come from env (`SEED_STUDENT_PASSWORD` / `SEED_STAFF_PASSWORD`), hashed with `argon2id` (`memoryCost: 65536`, `timeCost: 3`, `parallelism: 4`).
Seed must be idempotent (upsert / existence check — safe to run repeatedly without duplicating rows).

## Programs & Academic Groups (4 programs, 4 Cyrillic groups)
| Group | Year | Admission | Roster (Budget / Contract) | Program | Starosta |
|---|---|---|---|---|---|
| `ДУ-101` | 2 | 2023 | 28 (18 / 10) | Международные отношения (Бакалавриат) | Айгуль Нурова |
| `ДУ-205` | 3 | 2022 | 24 (14 / 10) | Мировая экономика (Бакалавриат) | Алина Захарова |
| `ДУ-301` | 1 | 2024 | 16 (12 / 4) | Дипломатическая служба (Магистратура) | Дмитрий Савельев |
| `ДУ-102` | 1 | 2024 | 30 (20 / 10) | Международное публичное право (Бакалавриат) | Полина Сергеева |

## Users (16 total: 15 students + 1 staff)

### Primary Accounts
| Role | Email | Full name | Faculty | Program | Year | Group | Study form |
|---|---|---|---|---|---|---|---|
| `student` | `aigul.nurova@demo.edu` | Айгуль Нурова | Факультет международных отношений | Международные отношения (Бакалавриат) | 2 | `ДУ-101` | Бюджет |
| `student` | `timur.belov@demo.edu` | Тимур Белов | Факультет международных отношений | Мировая экономика (Бакалавриат) | 3 | `ДУ-205` | Контракт |
| `student` | `lina.okafor@demo.edu` | Лина Окафор | Факультет международных отношений | Международные отношения (Бакалавриат) | 2 | `ДУ-101` | Контракт |
| `staff` | `dean.office@demo.edu` | Мария Волкова (Сотрудник деканата) | — | — | — | — | — |

Plus **12 additional fictional roster students** across all 4 groups (`d.morozov@demo.edu`, `s.kim@demo.edu`, `m.volkov@demo.edu`, `a.vasilieva@demo.edu` in `ДУ-101`; `a.zakharova@demo.edu`, `a.gasparyan@demo.edu`, `e.popova@demo.edu`, `k.lebedev@demo.edu` in `ДУ-205`; `d.savelev@demo.edu`, `e.orlova@demo.edu` in `ДУ-301`; `p.sergeeva@demo.edu`, `r.kuznetsov@demo.edu` in `ДУ-102`).

## Subjects (20 subjects, Russian names)
Includes: `Дипломатический протокол` (4 cr), `Международное публичное право` (5 cr), `Английский язык для дипломатов` (3 cr), `Макроэкономика` (5 cr), `Политическая философия` (4 cr), `Физическая культура и спорт` (2 cr), `Русский язык как иностранный / Стилистика` (3 cr), `Статистика в международных исследованиях` (4 cr), `Военная кафедра / Факультатив` (2 cr), `Статистика` (4 cr), `Мировые финансовые рынки` (5 cr), `Эконометрика и анализ данных` (5 cr), `Международная торговля` (4 cr), `Консультация перед пересдачей: Статистика` (4 cr), `Иностранный язык в сфере экономики` (3 cr), `Корпоративные финансы` (4 cr), `Физическая культура` (2 cr), `Русский язык как иностранный` (3 cr), `История государства и права зарубежных стран` (4 cr), `Современная дипломатическая практика` (6 cr).

Grading: 0–100 points + grade (`5` / `4` / `3` / `2`) + credit status (`earned` / `in_progress` / `failed`). Assessment types: `exam`, `credit`, `coursework`.

## Data differences (must differ per student)
- **Aigul**: avg ~89.5 pts (6 `earned` + 2 `in_progress` upcoming exams with `examDate`), 1 request `in_review` (`study_certificate`), 3 notifications (1 unread, 2 read).
- **Timur**: avg ~64.2 pts (4 `earned`, 1 `in_progress`, 1 `failed` `'Статистика'` with `points: 48`, `grade: 2`, retake `2026-11-28`), 2 requests (`dormitory_application` `needs_info`, `transcript` `ready`), 3 notifications (2 unread, 1 read).
- **Lina**: avg ~78.2 pts (5 `earned`, 1 `in_progress`), 0 requests (tests empty state), 3 unread notifications.
- **Roster students**: 1 summary grade each (`k.lebedev@demo.edu` and `r.kuznetsov@demo.edu` seeded with `failed` status for debt-filtering tests).
- Aigul and Lina share `ДУ-101` schedule; Timur has the `ДУ-205` schedule.

## Schedule (8-week rolling window)
Mon–Sat, `08:30`/`10:15`/`12:00`/`14:00`/`15:45` slots, rooms like `А-101`, `Б-115`, `А-204`, `Лингво-2`, fictional teachers (`проф. Соколов И.В.`, `доц. Кузнецова Е.А.`, etc.).
Dates generated dynamically relative to UTC Monday of current week (`weekOffset` from `-1` to `+6` = 8 weeks) for `ДУ-101` (14 classes/week) and `ДУ-205` (6 classes/week).
Each week includes: 3 `room_changed` (2 in `ДУ-101`, 1 in `ДУ-205`), 2 `cancelled` (1 in `ДУ-101`, 1 in `ДУ-205`), 1 `moved` (in `ДУ-101`).

## Exams (12 seeded entries)
12 exams with `originalSnapshot`: 4 for `ДУ-101`, 4 for `ДУ-205` (including `STAT-102` debt retake `'Математическая статистика и анализ данных'`, linked to Timur's failed `'Статистика'` grade, with `isDebt: true`, `rawDate: 2026-11-28`), 2 for `ДУ-301`, 2 for `ДУ-102`.

## Request types (6 types)
`study_certificate`, `military_certificate`, `scholarship_application`, `academic_leave`, `transcript`, `dormitory_application`.
Each defines `title`, `description`, `slaDays`, and `fields[]` items following `{ name, label, labelEn?, type ('text' | 'textarea' | 'select' | 'number' | 'date'), required, placeholder?, options?, optionsEn? }`.
Status flow: `submitted` -> `in_review` -> (`needs_info` -> `in_review`) -> `ready` | `rejected`; student may cancel while `submitted` or `in_review`.

## Notifications / announcements
- **8+ announcements** (9 seeded across all-student, `ДУ-101`, `ДУ-205`, `ДУ-301`, `ДУ-102` scopes: academic debt retakes, PGAS scholarship deadline, winter exam schedule, building B room changes, holiday schedule, medical checkup, academic mobility deadline, Master's coursework defense, first-year adaptation).
- **9 per-user notifications** (3 Aigul, 3 Timur, 3 Lina): deadline reminders, request status changes, schedule changes, announcements (mix read/unread).
