# Admin Dashboard UI Implementation Plan

## Status: ✅ COMPLETED

All tasks have been implemented. See summary below.

---

## Pre-flight Fix
### `client/src/index.css`
- Remove duplicate CSS blocks (lines 291–870 are identical to 1–289). Keep a single copy so future edits are safe.

---

## New Components

### `client/src/components/admin/AdminStatCard.jsx`
Reusable stat card for dashboard metrics.

Props:
- `label` (string)
- `value` (string | number)
- `icon` (Lucide icon component)
- `trend` (optional: `{ value: string, positive: boolean }`)
- `iconBg` / `iconColor` (optional Tailwind classes matching existing token style)

Style: white/surface card, rounded-lg, border `border-[var(--border-light)]`, shadow `shadow-sm`, hover `shadow-md` transition.

---

### `client/src/components/admin/AdminDashboard.jsx`
Main overview page matching SYSTEM_PLAN §3.2 recommended metrics and cards.

Layout:
1. **Page header** — "Admin Dashboard" title + "Overview" subtitle.
2. **Stats grid** — 2×4 or 4×2 responsive grid of `AdminStatCard`:
   - Total Users: `1,284`
   - Active Users: `1,198`
   - New This Month: `+86`
   - Completed Profiles: `923`
   - Pending Approvals: `47`
   - Resumes Created: `312`
   - Recent Imports: `12`
   - Failed Imports: `3`
3. **Quick Actions** — row of action buttons:
   - Manage Users (Users icon)
   - View Audit Logs (ScrollText icon)
   - Bulk Import Users (Upload icon)
   - Yearbook Settings (Settings icon)
   All buttons are stubs (console.log or no-op).
4. **Recent Activity** — table showing last 5 audit log entries (mock data) using a simple styled `<table>` with columns: User, Action, Entity, Time.
5. **Failed Imports** — small alert-style list showing 2 mock failed import batches with reason.

Mock data:
```js
const mockStats = [ ... ]
const mockLogs = [ ... ]
const mockFailedImports = [ ... ]
```

Styling:
- Use existing design tokens (`var(--border-light)`, `var(--text-muted)`, etc.)
- Use `Geist Variable` font via existing Tailwind config.
- Responsive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` for stats.
- Tables: `w-full text-sm rounded-lg border border-[var(--border-light)] overflow-hidden`.
- Table header: `bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-semibold`.
- Table rows: `border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--bg-subtle)]/50`.

---

### `client/src/components/ui/badge.jsx` (minor addition)
Simple status badge component for the admin dashboard tables.

Variants via `data-variant` attribute:
- `approved` → green
- `pending` → amber/gold
- `rejected` → red
- `active` → emerald
- `inactive` → slate

Uses existing `buttonVariants` pattern or a simple `cn()` with inline classes.

---

## Integration Changes

### `client/src/components/navigation/AppSidebar.jsx`
- Add new prop `role` (`'student' | 'admin'`, default `'student'`).
- If `role === 'admin'`, prepend admin nav item to the menu:
  - Dashboard (`/admin`, `LayoutDashboard` icon)
- Keep existing student nav items.
- Active page logic already supports multiple keys.

### `client/src/App.jsx`
- Add `const [role, setRole] = useState('student')`.
- Add a small role toggle switch in the top-right (outside or above the dashboard layout) for dev preview:
  - Segmented control: "Student View" | "Admin View"
- Conditional render:
  - `role === 'admin'` → render `<AdminDashboard />` inside `<DashboardLayout>`.
  - `role === 'student'` → keep existing `<DashboardPage />`.

---

## Out of Scope
- Admin Users management page
- Admin Activity Logs page (separate from dashboard table)
- Bulk Excel Import page
- Admin Settings page
- Backend API calls, Supabase integration, React Router
- Tests, storybook, or documentation files
