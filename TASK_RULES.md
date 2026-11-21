# TASK_RULES.md
> Operational Development Directives & Efficiency Constraints
> Dean's Office of the Future Project

---

## 1. Zero-Redundant Exploration Policy
- **Never scan the entire repository** for routine or localized tasks.
- Always consult `AGENTS.md` and `PROJECT_MAP.md` as the primary architectural reference before touching code.
- Locate the target module, inspect only the files directly involved, and execute immediately.

---

## 2. Exploration Levels

| Level | Scope | Example | Actions |
| :--- | :--- | :--- | :--- |
| **Level 1** | Micro Change | Text, spacing, colors, button styling, icons | Edit target component directly. Zero architectural search. |
| **Level 2** | Component Change | Redesigning a card, modal, or form section | Inspect target component and direct styles/props. Implement & test. |
| **Level 3** | Feature Change | New page, updated API endpoint, new workflow | Inspect relevant feature route/page and direct schema/types. Verify. |
| **Level 4** | System Change | Auth overhaul, DB schema migration, API redesign | Scope affected modules systematically. Run integration test suite. |
| **Level 5** | Full Audit | Security review, repo overhaul (explicit user request only) | Full repository analysis only when specifically commanded. |

---

## 3. Git-Aware Development Workflow
1. Run `git status --short` before making changes to understand existing uncommitted work.
2. Never revert, overwrite, or discard unrelated uncommitted modifications.
3. Make changes exclusively in the target files required for the task.
4. Verify changes with `git diff --stat` to guarantee zero unintended modifications.

---

## 4. Verification Standards
- Run only the targeted test suite or typecheck corresponding to the changed module:
  - Backend change: `npm --prefix backend run test` or `npm --prefix backend run typecheck`
  - Frontend change: `npm --prefix frontend run test` or `npm --prefix frontend run typecheck`
  - Database change: `npm --prefix database run test`
- Never claim a test passed without actually running it.

---

## 5. Architectural Map Maintenance
- Update `PROJECT_MAP.md` **only** when a change introduces or modifies:
  - Entry points, core routing, or API contracts.
  - Database models or migrations.
  - Major dependencies or directory responsibilities.
- Do not update `PROJECT_MAP.md` for routine UI tweaks, bug fixes, or text edits.
