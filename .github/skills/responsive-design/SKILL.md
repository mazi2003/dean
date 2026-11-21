---
name: responsive-design
description: >-
  Audits, designs, and refactors web interfaces for responsive, mobile-first design across all device viewports (360px to 4K). Use when the user asks to make a site responsive, fix mobile layout issues, adapt screens for mobile/tablet, audit horizontal scroll bugs, or enforce WCAG touch target standards.
---

# Responsive Web Design & Mobile-First Execution Skill

This skill guides coding agents through building, auditing, and verifying responsive, resilient user interfaces from small smartphones (360px) to ultra-wide displays (4K).

---

## 1. Core Principles & Breakpoint Standard

Always design and code **Mobile-First**: base CSS rules must target the smallest screen size first, adding complexity as viewport width expands.

### Target Breakpoints
| Breakpoint | Minimum Width | Target Devices | Layout Behavior |
|:---|:---|:---|:---|
| **Base (Mobile)** | `360px` - `639px` | iPhone SE, compact Android, modern phones | Single-column stack, bottom navigation, full-width cards, compact headers |
| **`sm:`** | `640px` | Large phones in landscape, phablets | 2-column compact grids, inline action buttons |
| **`md:`** | `768px` | Tablets (iPad Mini, iPad), foldables | Sidebar navigation reveals, 2-to-3 column grids, expanded table headers |
| **`lg:`** | `1024px` | Laptops, desktop monitors | Full multi-column dashboard layouts, persistent navigation sidebars |
| **`xl:`** / **`2xl:`** | `1280px` / `1536px` | Large desktop, high-res monitors | Centered container wrappers with max-width limits (`max-w-7xl mx-auto`) |

---

## 2. Universal Mobile Layout Rules

### A. Horizontal Overflow Prevention (Zero Horizontal Scroll)
Horizontal scrollbars on mobile devices degrade user experience and fail quality audits:
- **Never** use hardcoded fixed pixel widths (`w-[600px]`, `width: 800px`) on layout containers or outer wrappers. Use `w-full max-w-xl` or fluid percentages.
- **Flex Child Truncation:** Inside flex containers, always add `min-w-0` to text or card children. Without `min-w-0`, flex items default to `min-width: auto`, causing wide text or long email addresses to blow out the viewport.
- **Data Tables & Code Blocks:** Always wrap data tables, matrices, and code snippets in an explicit scroll container:
  ```tsx
  <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
    <table className="w-full min-w-[500px]">...</table>
  </div>
  ```
- **Images & SVGs:** Enforce `max-w-full h-auto` on all images, canvas, and vector elements.

### B. Touch Targets & Ergonomics (WCAG 2.5.5 / 2.5.8)
- Every interactive element (buttons, icon triggers, dropdowns, inputs, tabs) must have a touch target of at least **44x44px** on mobile viewports:
  ```tsx
  <button className="min-h-[44px] min-w-[44px] px-3 py-2 flex items-center justify-center ...">
  ```
- Space adjacent touch targets with at least **8px** gap to prevent accidental mis-taps.
- Interactive text links in body copy must have adequate line height and padding.

### C. Modal Windows & Drawers on Mobile
- On mobile viewports (`< 640px`), modals should convert to **bottom sheets** or **full-height screens**:
  ```tsx
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto ...">
  ```
- Sticky footers in modals should sit above virtual keyboard and browser safe-areas (`pb-safe` or `p-4`).

---

## 3. Responsive Audit Runbook

When auditing or fixing responsiveness on a webpage or component:

### Step 1: Scan for Fixed Width Anti-Patterns
Look for code patterns that break small viewports:
- `w-[...px]` without responsive overrides (`w-full sm:w-[500px]`).
- Hardcoded grid columns (`grid-cols-3` or `grid-cols-4` without `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).
- Unwrapped horizontal lists (`flex-row` without `flex-wrap` or horizontal scroll).

### Step 2: Validate Flexbox & Typography Truncation
- Ensure titles and student names have `truncate` or `break-words`.
- Check that labels and badges have `flex-shrink-0` if they must not be squished.

### Step 3: Verify Touch Target Boundaries
- Run automated accessibility audits (Playwright or Lighthouse) to ensure no buttons fall below 44px.

### Step 4: Automated Testing at Multiple Viewports
1. Run the static responsive audit script to detect anti-patterns:
   ```bash
   node scripts/audit-responsive.mjs
   ```
2. Use Playwright to execute headless checks at canonical viewports:
   - **Mobile:** 360 x 740 (standard compact Android)
   - **Tablet:** 768 x 1024 (iPad vertical)
   - **Desktop:** 1280 x 800 (standard laptop)

Verify:
1. `document.documentElement.scrollWidth <= document.documentElement.clientWidth` (no horizontal overflow).
2. Navigation switches cleanly between bottom nav / drawer and top / sidebar.
3. All dialogs and popovers stay within viewport boundaries.
