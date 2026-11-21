# Implementation Plan: Official Academic Portal & Institutional Authority Upgrade

## Context & Purpose
This implementation plan addresses the tension between high-concept tech-startup mockups and authoritative university portal requirements. It provides step-by-step, deterministic instructions for upgrading the student portal (`Header.tsx`, `StudentCardModal.tsx`, `OfficialTranscriptModal.tsx`, `CertificatePreviewModal.tsx`, and `index.css`) to meet Russian higher education standards (ГОСТ Р 52872-2019 / WCAG AA, academic credentialing, dual-seal verification) while preserving the modern Swiss-tech precision of «Айдентика №2 (Квантум • Деканат)».

---

## 1. Scope of Changes

### File 1: `frontend/src/index.css`
- **Objective**: Ensure color tokens strictly reflect authoritative academic cobalt, deep obsidian, and gold seal accents, while removing non-standard neon/glow shadows that detract from institutional gravity.
- **Tokens to verify**:
  - `--color-academic-navy: #0E1F36` (Primary institutional background)
  - `--color-academic-cobalt: #142D4E` (Institutional masthead & primary buttons)
  - `--color-academic-blue: #1D4ED8` (Active interactive links & badges)
  - `--color-academic-gold: #C8A96A` (Official academic seal & honors accent)
  - `--color-academic-surface: #F8FAFC` (Clean ice document paper)
  - Focus rings: 2px solid `#1D4ED8` with 2px offset for WCAG AA compliance.

### File 2: `frontend/src/components/Header.tsx`
- **Objective**: Elevate the institutional authority of the top utility bar and masthead.
- **Specific Changes**:
  1. Add the official accessibility mode toggle (`Eye` icon / «Версия для слабовидящих» according to ГОСТ Р 52872-2019) to the Tier-1 institutional utility bar alongside Language and Theme toggles.
  2. Maintain the co-branded title lockup: «DemoTech University | Цифровой деканат» with the institutional motto «Veritas • Scientia • Innovatio».
  3. Ensure all badge labels («Студент», «Деканат МО») use high-contrast borders and uppercase tracking.

### File 3: `frontend/src/components/StudentCardModal.tsx`
- **Objective**: Transform the NFC pass from an abstract Dribbble-style plastic card into an authentic Physical-Digital Hybrid Campus Pass.
- **Specific Changes**:
  1. Add formal Russian academic credentials to the card face:
     - Header: «МИНОБРНАУКИ РОССИИ • МНТУ „ДЕМОТЕХ”»
     - Document title: «СТУДЕНЧЕСКИЙ БИЛЕТ № 2024-БИ-0412»
     - Validity band: «ДЕЙСТВИТЕЛЕН ПО 31.08.2026 Г. • ОЧНАЯ ФОРМА»
     - Order of matriculation: «Приказ о зачислении № 841-СТ от 25.08.2024»
  2. Retain the cutting-edge NFC / Turnstile scanner functionality:
     - Embedded RFID microchip antenna graphic in frosted acrylic.
     - Dynamic anti-tamper optical QR code with rotating TOTP code (30s refresh) to prevent screenshot sharing at campus turnstiles.
     - Fullscreen optical turnstile presentation mode.

### File 4: `frontend/src/components/OfficialTranscriptModal.tsx`
- **Objective**: Replace informal draft styling with an official academic transcript format complying with Russian and European standards.
- **Specific Changes**:
  1. Institutional letterhead with state educational license numbers:
     - «Лицензия Рособрнадзора № 2841, Свидетельство о госаккредитации № 3105».
  2. Archival registration block:
     - «Регистрационный номер: ВЕД-2026/0412-СТ».
     - «Дата выдачи: [Текущая дата] г.».
  3. Academic metric table:
     - Dual credit tracking: «Трудоёмкость (ЗЕТ / ECTS)» and «Балл БРС (0-100)».
  4. Dual-seal authentication block:
     - Left: Archival registration box with simulated digital digest (SHA-256 hash).
     - Right: Round Guilloché Dean's Office Stamp («ПЕЧАТЬ ДЛЯ СПРАВОК • ДЕКАНАТ МНТУ ДЕМОТЕХ») and Cryptographic QR Verification stamp linking to verification registry.

### File 5: `frontend/src/components/CertificatePreviewModal.tsx`
- **Objective**: Ensure student certificates match official state university certificate formatting (ГОСТ Р 7.0.97-2016 for organizational documents).
- **Specific Changes**:
  1. Standard corner registration stamp («Угловой штамп учреждения»).
  2. Official order references («Выдана на основании личного дела студента...»).
  3. Official signature block with faculty title («И.о. Декана факультета МО, д.полит.н., проф. А.В. Смирнов»).
  4. Blue rectangular electronic seal stamp («ДОКУМЕНТ ПОДПИСАН ПРОСТОЙ ЭЛЕКТРОННОЙ ПОДПИСЬЮ»).

---

## 2. Verification & Safety Gate
- All tests must pass:
  1. `cd frontend && npm run lint`
  2. `cd frontend && npm test`
  3. `cd frontend && npm run build`
  4. `cd e2e && npx playwright test`
- No IDOR vulnerabilities or hardcoded real personal data.
- Footers must preserve the mandatory competition disclaimer:
  *«Конкурсный концепт. Не является официальным сервисом университета. Все данные и имена вымышлены.»*
