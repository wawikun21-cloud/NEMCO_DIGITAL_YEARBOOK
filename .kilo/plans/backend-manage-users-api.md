# Backend Implementation Plan: Manage Users API

## Overview

Implement backend API routes and services for managing users in the admin panel, replacing the current mock data in `ManageUsersPage.jsx` with real database operations via Supabase.

## API Endpoints Required (from SYSTEM_PLAN.md and frontend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/users | List all users with optional filtering (search, role, year_level, course_or_strand, section) |
| GET | /api/admin/users/:id | Get a single user by ID |
| POST | /api/admin/users | Create a new user |
| PATCH | /api/admin/users/:id | Update an existing user |
| DELETE | /api/admin/users/:id | Delete a user |
| POST | /api/admin/users/:id/reset-password | Reset user password |

## Files to Create/Modify

### Backend Files (deploy/server/src/)

1. **src/middlewares/authMiddleware.js** (NEW)
   - Verify JWT token from Authorization header
   - Check if user has admin role
   - Attach user/ profile to request object

2. **src/validators/userValidator.js** (NEW)
   - Zod schema for user creation: `student_number`, `email`, `full_name`, `role`, `year_level`, `course_or_strand`, `section`, `bio`, `quote`, `status`, `profile_status`
   - Zod schema for user update (partial)
   - Zod schema for password reset

3. **src/services/userService.js** (NEW)
   - `getUsers(filters)` - Fetch users from profiles table
   - `getUserById(id)` - Fetch single user
   - `createUser(data)` - Create user in Supabase Auth + profiles table
   - `updateUser(id, data)` - Update user profile
   - `deleteUser(id)` - Delete user from Auth + profiles
   - `resetUserPassword(id)` - Generate password reset email/link
   - `logAudit(action, entityType, entityId, oldData, newData)` - Record audit logs

4. **src/controllers/userController.js** (NEW)
   - `getUsers(req, res, next)` - List users controller
   - `getUser(req, res, next)` - Get single user controller
   - `createUser(req, res, next)` - Create user controller
   - `updateUser(req, res, next)` - Update user controller
   - `deleteUser(req, res, next)` - Delete user controller
   - `resetPassword(req, res, next)` - Reset password controller

5. **src/routes/userRoutes.js** (NEW)
   - Define admin user routes with auth middleware

6. **src/app.js** (MODIFY)
   - Add import for userRoutes
   - Mount userRoutes at `/api/admin/users`

### Frontend Files (client/src/)

7. **services/userService.js** (NEW)
   - `getUsers()` - Fetch all users
   - `getUser(id)` - Fetch single user
   - `createUser(data)` - Create user via API
   - `updateUser(id, data)` - Update user via API
   - `deleteUser(id)` - Delete user via API
   - `resetPassword(id)` - Reset password via API
   - All methods use auth token from sessionStorage/Supabase session

### Database Migration

8. **supabase/migrations/003_audit_log_enhancements.sql** (NEW)
   - Add trigger for automatic `updated_at` on audit_logs
   - Any additional indexes for user queries

## Implementation Details

### Auth Middleware Logic

```javascript
// Verify JWT token
const { data: { user } } = await supabaseAnon.auth.getUser(token)
if (!user) throw unauthorized error

// Check admin role
const { data: profile } = await supabaseAdmin.from('profiles')
  .select('role').eq('id', user.id).single()
if (profile.role !== 'admin') throw forbidden error
```

### User Creation Flow

1. Validate input data (email format, student_number unique, etc.)
2. Create user in Supabase Auth with `admin.createUser()`
3. Profile created automatically via `handle_new_user()` trigger
4. Update profile with provided details using `onConflict: 'id'`
5. Log action to audit_logs

### User Update Flow

1. Validate input data
2. Get old user data for audit log
3. Update profiles table
4. If email changed, update in Supabase Auth
5. Log action to audit_logs

### User Delete Flow

1. Get user data for audit log
2. Delete from Supabase Auth (cascades to profiles)
3. Log action to audit_logs

### Password Reset Flow

1. Generate password reset link using `supabaseAdmin.auth.generateLink()`
2. Return link or send email (based on implementation choice)
3. Log action to audit_logs

## Validation Rules

- `student_number`: Required, 7 digits, unique
- `email`: Required, valid email format, unique
- `full_name`: Required, min 2 characters
- `role`: Must be 'admin' or 'user'
- `year_level`: Must be '11' or '12' (based on frontend options)
- `course_or_strand`: Must be one of STEM, ABM, HUMSS, GAS, TVL
- `section`: Optional, one of A, B, C, D
- `status`: Must be 'active' or 'inactive'
- `profile_status`: Must be one of draft, completed, submitted, approved, rejected

## Response Formats

### GET /api/admin/users
```json
{
  "users": [
    {
      "id": "uuid",
      "student_number": "0026284",
      "email": "maria.santos@school.edu",
      "full_name": "Maria Santos",
      "display_name": "Maria",
      "role": "admin",
      "year_level": "12",
      "course_or_strand": "STEM",
      "section": "A",
      "status": "active",
      "profile_status": "approved",
      "bio": "...",
      "quote": "...",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

### POST /api/admin/users
```json
{
  "user": { /* created user object */ }
}
```

### PATCH /api/admin/users/:id
```json
{
  "user": { /* updated user object */ }
}
```

## Security Considerations

- All endpoints require authentication
- Only admins can access these endpoints (verified via `is_admin()` check)
- Service role key never exposed to frontend
- Audit logs record all admin actions
- Input validation on all endpoints

## Testing Strategy

- Test auth middleware with valid/invalid tokens
- Test user CRUD operations
- Test validation errors
- Test audit logging