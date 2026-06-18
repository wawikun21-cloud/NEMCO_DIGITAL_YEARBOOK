# Manage Users Feature - Implementation Plan

## Overview
Implement the Admin "Manage Users" UI/UX following SYSTEM_PLAN.md Section 3.4, with mobile responsiveness matching existing patterns in the codebase.

## Files to Create

### 1. Admin Users Page
**Path:** `client/src/pages/admin/ManageUsersPage.jsx`

- Header with title "Manage Users" and description
- Stats summary bar (Total, Active, Inactive, Pending Approval counts)
- Search bar with real-time filtering
- Filter dropdowns for: Role, Year Level, Course/Strand, Section
- User table with responsive columns:
  - Desktop: Avatar, Student #, Email, Full Name, Role, Year Level, Course/Strand, Section, Status, Actions
  - Mobile: Collapsed columns, expandable rows for details
- Empty state when no users match filters
- Pagination controls (mobile-friendly)

### 2. User Action Components
**Path:** `client/src/components/admin/UserActionMenu.jsx`

- Dropdown menu for each user row with actions:
  - Edit User (opens modal)
  - Assign Admin Role (toggle)
  - Deactivate/Reactivate User (based on status)
  - Reset Password
  - Delete User (with confirmation)
- Uses existing DropdownMenu UI component pattern

### 3. User Edit Modal
**Path:** `client/src/components/admin/UserEditModal.jsx`

- Form fields matching profiles table from SYSTEM_PLAN.md:
  - Student Number (required, read-only after creation)
  - Email (required)
  - Full Name (required)
  - Display Name (optional)
  - Role (dropdown: admin, user)
  - Year Level (required)
  - Course/Strand (required)
  - Section (optional)
  - Bio (optional, textarea)
  - Quote (optional, textarea)
  - Status (active/inactive toggle)
  - Profile Status (draft, completed, submitted, approved, rejected)
- Responsive modal using existing Dialog pattern
- Form validation UI states

### 4. User Create Modal
**Path:** `client/src/components/admin/UserCreateModal.jsx`

- Similar to Edit Modal but:
  - Student Number is editable (required)
  - Auto-generates temporary password (based on Import pattern)
  - All required fields marked
- "Create User" button in page header

### 5. User Row Component
**Path:** `client/src/components/admin/UserRow.jsx`

- Desktop: Full table row with all visible columns
- Mobile: Collapsed view showing: Avatar, Name, Status, Actions
- Touch-friendly action buttons
- Expandable details on mobile tap

### 6. User Form Modal
**Path:** `client/src/components/admin/UserFormModal.jsx`

- Uses existing Dialog primitive
- Form with all profile fields from SYSTEM_PLAN.md:
  - Student Number (required, read-only if editing)
  - Email (required input)
  - Full Name (required input)
  - Display Name (optional input)
  - Role (select dropdown: admin/user)
  - Year Level (input)
  - Course/Strand (input)
  - Section (optional input)
  - Bio (textarea)
  - Quote (textarea)
  - Status (select: active/inactive)
  - Profile Status (select: draft/completed/submitted/approved/rejected)
- Props: `open`, `onOpenChange`, `user` (null for create, user object for edit), `onSubmit`
- Responsive width: `w-full sm:w-[500px]`

### 7. User Filters Component
**Path:** `client/src/components/admin/UserFilters.jsx`

- Search input (debounced 300ms)
- Role filter: DropdownMenu with All/Admin/User options
- Year Level filter: Input with search icon
- Clear filters button (visible when filters active)
- Mobile: Condensed into icon button row

### 8. User Table Component
**Path:** `client/src/components/admin/UserTable.jsx`

- Desktop table view (hidden on mobile)
- Columns: Avatar, Student #, Email, Full Name, Role, Year Level, Course/Strand, Section, Status, Actions
- Props: `users`, `onEdit`, `onActionComplete`
- Empty state handled at page level

### 9. Mobile User List Component
**Path:** `client/src/components/admin/MobileUserList.jsx`

- Mobile card layout (hidden on sm+ screens)
- Each user as a card with Avatar, Name, Email, Role badge
- Expandable details on click
- Action menu button

## Missing UI Components Needed

### Custom Select Dropdown
**Path:** `client/src/components/ui/select.jsx`

- Not currently in codebase; need to create
- For role, status, and profile_status dropdowns
- Follows Radix UI Select patterns
- Uses existing design tokens (border, bg-surface, text-primary)

## Mock Data Structure

Following SYSTEM_PLAN.md Section 3.4 profile fields:

```javascript
const mockUsers = [
  {
    id: "uuid",
    student_number: "0026284",
    email: "student@example.com",
    full_name: "Juan Dela Cruz",
    display_name: "Juan",
    role: "user", // or "admin"
    year_level: "12",
    course_or_strand: "STEM",
    section: "A",
    status: "active", // or "inactive"
    profile_status: "approved", // or "draft", "completed", "submitted", "rejected"
    avatar_url: null,
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-06-10T00:00:00Z",
  }
]
```

## UI/UX Design Patterns

### Layout Container
```jsx
<div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
```

### Responsive Breakpoints
- Mobile: `< 640px` - Card layout, hidden columns
- Tablet: `640px - 1024px` - Condensed table
- Desktop: `≥ 1024px` - Full table

### Color Variables (following existing patterns)
- `var(--text-primary)` - Main text
- `var(--text-muted)` - Secondary text
- `var(--bg-surface)` - Card/surface background
- `var(--border-light)` - Borders
- `var(--status-green/red)` - Status colors

### Badge Variants (existing Badge component)
- `active` - Green (for status)
- `inactive` - Gray (for status)
- `admin` - Purple (for role)
- `user` - Blue (for role)
- `approved`/`pending`/`rejected` - Profile status variants

## Component Interactions

### Page States
1. **Loading** - Skeleton loaders for stats and table
2. **Empty** - No users found with illustrations
3. **Error** - Alert banner with retry button
4. **Success** - User table with data

### Modal Flow
1. Click "Create User" or Edit action → Open modal
2. Fill/Modify form fields
3. Submit → Show success toast (mock)
4. Close modal → Refresh user list (mock)

## Accessibility

- All interactive elements keyboard navigable
- Dialog traps focus
- ARIA labels for action buttons
- Form inputs have proper labels
- Status badges have descriptive text

## Badges for Role/Profile Status

The existing Badge component only supports: `approved`, `pending`, `rejected`, `active`, `inactive`.

Need to add `admin` and `user` variants (using purple/blue colors) in `client/src/components/ui/badge.jsx`.

## Implementation Order

1. Create Select UI component (`client/src/components/ui/select.jsx`)
2. Update Badge component with `admin`/`user` variants
3. Create `ManageUsersPage.jsx` with header, stats, filters, table structure
4. Create `UserFilters.jsx` component
5. Create `UserTable.jsx` component
6. Create `MobileUserList.jsx` component
7. Create `UserRow.jsx` and `MobileUserCard.jsx` components
8. Create `UserActionMenu.jsx` component
9. Create `UserFormModal.jsx` component
10. Update `App.jsx` to wire up the `/admin/users` route

## Integration Points

### App.jsx Update Required
Add route handling for `/admin/users`:
```javascript
if (path === "/admin/users") return <ManageUsersPage />
```