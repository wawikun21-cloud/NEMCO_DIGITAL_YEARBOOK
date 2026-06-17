# Digital Yearbook with Profile and Resume Builder - System Plan

## 1. Project Overview

This system is a **Digital Yearbook** platform with editable user profiles, admin account management, activity logs, bulk user import, and a resume builder.

The system will use:

- **Frontend:** React + Vite
- **Backend:** Node.js API
- **Database/Auth/Storage:** Supabase
- **File storage:** Supabase Storage
- **Excel import:** Node.js backend using Excel parsing
- **Resume PDF export:** Node.js backend PDF generation
- **Deployment target:** Hostinger without requiring VPS, if the selected Hostinger plan supports Node.js Web App hosting

Current project status:

- The existing workspace contains a React client setup.
- The backend, Supabase configuration, database schema, admin dashboard, logs, Excel import, profile module, resume builder, and deployment setup are still needed.

---

## 2. User Roles

### Admin Account

Admin users should be able to:

- View the admin dashboard
- View audit logs and user activity
- Manage user accounts
- Create, edit, deactivate, reactivate, and delete users
- Assign or remove admin role
- Reset user passwords
- Bulk import users using Excel
- View import success and error reports
- Approve or reject yearbook profiles
- Manage yearbook visibility settings

### User Account

Regular users should be able to:

- Log in to the system
- Edit their profile
- Upload profile pictures
- Add yearbook information
- Create and edit resumes
- Preview resumes
- Export resumes as PDF
- Control profile visibility
- View approved public yearbook profiles if allowed

### Recommended Initial Roles

```txt
admin
user
```

### Optional Future Roles

```txt
super_admin
moderator
student
faculty
```

---

## 3. Main System Modules

### 3.1 Authentication

Use **Supabase Auth** for authentication.

Features:

- Email/password login
- Admin-created accounts
- Password reset
- Protected routes
- Role-based access control
- Session management

Important security rule:

> Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.  
> The frontend should only use the Supabase anonymous/public key.

---

### 3.2 Admin Dashboard

The admin dashboard should display system summaries and activity indicators.

Recommended dashboard metrics:

| Metric | Source |
|---|---|
| Total users | `profiles` |
| Active users | `profiles` |
| New users this month | `profiles.created_at` |
| Completed profiles | `profiles.profile_status` |
| Incomplete profiles | `profiles.profile_status` |
| Total resumes created | `resumes` |
| Recent failed imports | `import_batches` |
| Recent audit logs | `audit_logs` |
| Storage usage | Supabase Storage API |

Recommended dashboard cards:

- Total users
- Active users
- Completed profiles
- Pending profile approvals
- Resumes created
- Recent imports
- Recent failed imports
- Recent user activity

---

### 3.3 Admin Activity Logs

Create an `audit_logs` table to track user and admin activity.

Recommended actions to log:

- User login
- User logout
- Profile created
- Profile updated
- Profile submitted
- Resume created
- Resume updated
- Resume exported as PDF
- File uploaded
- Admin created user
- Admin updated user
- Admin deactivated user
- Admin deleted user
- Excel import started
- Excel import completed
- Excel import failed

Recommended `audit_logs` columns:

```txt
id
user_id
action
entity_type
entity_id
old_data
new_data
ip_address
user_agent
created_at
```

Recommended logging approach:

1. Use backend API middleware for request-based logs.
2. Use Supabase/Postgres triggers for database change logs.
3. Avoid relying only on frontend or API logs because direct database changes should also be recorded.

---

### 3.4 User Account Management

Admin should be able to manage users from the admin panel.

Features:

- View all users
- Search users
- Filter by role, year level, course/strand, or section
- Create user manually
- Edit user profile
- Assign admin role
- Deactivate user
- Reactivate user
- Delete user if required
- Reset user password
- View user activity logs

Recommended user management flow:

1. Admin opens user management page.
2. Admin searches or filters users.
3. Admin edits user details.
4. System validates changes.
5. System updates Supabase Auth and `profiles`.
6. System records the action in `audit_logs`.

---

### 3.5 Bulk Excel User Import

Admin should be able to upload an Excel file to create multiple users at once.

Recommended Excel columns:

```txt
student_number
email
full_name
role
year_level
course_or_strand
section
```

Optional columns:

```txt
display_name
bio
quote
```

Recommended import process:

1. Admin uploads Excel file.
2. Backend validates file type and structure.
3. Backend parses the Excel file.
4. Backend performs a dry-run validation.
5. Admin previews valid and invalid rows.
6. Admin confirms import.
7. Backend creates users in Supabase Auth.
8. Backend creates profile records.
9. Backend records import batch status.
10. Admin can download an error report if needed.

Validation checks:

- Required fields are not empty
- Email format is valid
- Email is not duplicated
- Student number is not duplicated
- Role is valid
- Year level is valid
- Course/strand is valid
- Excel row limit is not exceeded

Recommended import tables:

```txt
import_batches
import_errors
```

---

### 3.6 Editable User Profile

Each user should have an editable profile.

Recommended profile fields:

```txt
id
user_id
student_number
full_name
display_name
email
role
year_level
course_or_strand
section
bio
quote
avatar_url
profile_status
is_public
resume_public
created_at
updated_at
```

Recommended profile statuses:

```txt
draft
completed
submitted
approved
rejected
```

Recommended profile flow:

1. User edits profile.
2. User uploads avatar.
3. User saves draft.
4. User submits profile for approval.
5. Admin reviews profile.
6. Admin approves or rejects profile.
7. Approved profile appears in the public yearbook.

---

### 3.7 Resume Builder

The resume builder should allow users to create, edit, preview, and export resumes.

Recommended resume sections:

- Personal information
- Objective or summary
- Education
- Skills
- Work experience
- Projects
- Achievements
- Organizations
- References

Recommended resume table:

```txt
resumes
id
user_id
title
template
data
is_public
created_at
updated_at
```

Recommended resume flow:

1. User selects a resume template.
2. User fills resume sections.
3. System saves resume data as JSON.
4. User previews the resume.
5. User exports the resume as PDF.

Recommended PDF generation approach:

- Use `pdfkit` first because it is lightweight and easier to deploy.
- Use `puppeteer` only if the hosting environment supports native dependencies.

---

### 3.8 Digital Yearbook

Core yearbook features:

- Public or approved profile list
- Search by name
- Filter by year level, course/strand, or section
- Profile cards
- Profile detail page
- Avatar display
- Quote display
- Admin approval control

Optional future features:

- Photo gallery
- Memories wall
- Comments
- Reactions
- QR code profile link
- Class/group pages
- Graduation theme templates

---

## 4. Recommended Database Structure

### Tables

```txt
profiles
resumes
audit_logs
import_batches
import_errors
yearbook_settings
admin_notifications
```

### Storage Buckets

```txt
avatars
resumes
yearbook-photos
import-files
```

### Row Level Security Rules

| Table | Recommended Rule |
|---|---|
| `profiles` | Users can read public profiles. Users can update their own profile. Admins can update all profiles. |
| `resumes` | Users can read/write their own resumes. Admins can read all resumes. |
| `audit_logs` | Admins can read logs. Regular users should not read all logs. |
| `import_batches` | Admin only. |
| `import_errors` | Admin only. |

---

## 5. Backend API Structure

Recommended Node.js API routes:

```txt
POST   /api/admin/import/users
GET    /api/admin/import/batches
GET    /api/admin/import/batches/:id
GET    /api/admin/import/batches/:id/errors

GET    /api/admin/users
GET    /api/admin/users/:id
POST   /api/admin/users
PATCH  /api/admin/users/:id
DELETE /api/admin/users/:id
POST   /api/admin/users/:id/reset-password

GET    /api/admin/logs
GET    /api/admin/dashboard

GET    /api/profiles/me
PATCH  /api/profiles/me
POST   /api/profiles/submit

GET    /api/resumes
POST   /api/resumes
PATCH  /api/resumes/:id
POST   /api/resumes/:id/export-pdf

GET    /api/yearbook/profiles
GET    /api/yearbook/profiles/:id
```

Recommended backend packages:

```txt
express
@supabase/supabase-js
@supabase/ssr
xlsx
multer
pdfkit
uuid
zod
cors
helmet
morgan
dotenv
```

Recommended responsibilities:

- `zod`: request validation
- `xlsx`: Excel parsing
- `multer`: Excel file upload handling
- `pdfkit`: resume PDF export
- `helmet`: basic security headers
- `cors`: controlled frontend/backend access
- `morgan`: request logging

---

## 6. Supabase Setup

### Supabase Features to Use

- Auth
- Postgres database
- Storage
- Row Level Security
- Optional Edge Functions
- Optional Cron jobs
- Optional database triggers

### Initial Admin Seed Process

Create an initial admin account securely.

Options:

1. Create admin manually in Supabase Auth dashboard, then create a matching `profiles` row.
2. Use a seed script during local setup.
3. Use a controlled backend bootstrap endpoint that is disabled after first use.

Do not hardcode admin credentials in the repository.

---

## 7. Security Requirements

Required before deployment:

- Enable Supabase Row Level Security
- Store admin role in `profiles.role`
- Backend must verify admin role before admin actions
- Never expose Supabase service role key to frontend
- Validate all API requests
- Validate Excel file type and structure
- Validate uploaded image file type and size
- Restrict CORS to the production domain
- Enable HTTPS
- Use signed URLs for private files
- Add rate limiting for login and admin routes
- Record audit logs for sensitive actions
- Sanitize user-generated content
- Protect against XSS
- Use prepared database policies
- Back up Supabase data regularly

---

## 8. Hostinger Deployment Plan Without VPS

Hostinger can host Node.js apps only if the selected plan supports **Node.js Web App hosting**. This is commonly available on Business Web Hosting or Cloud Hosting plans.

If the current Hostinger plan does not support Node.js Web App hosting, the backend cannot reliably run as a persistent Node process on shared hosting.

### Recommended Deployment Architecture

```txt
Browser
   |
   | HTTPS
   v
Hostinger Node.js/Web App
   |
   | API requests
   v
Node.js backend
   |
   | Supabase SDK
   v
Supabase Auth + Postgres + Storage
```

### Frontend Deployment

```txt
Browser
   |
   | static files
   v
Hostinger public_html or Hostinger Node.js frontend build
```

### Option A: Hostinger Plan Supports Node.js Web App Hosting

Use Hostinger for both frontend and backend.

Recommended settings:

- Node.js version: 20.x or 22.x
- Frontend build: Vite
- Backend framework: Express or Fastify
- Start command: `npm start`
- Install command: `npm install`
- Environment variables: configured in hPanel
- HTTPS: enabled

### Option B: Hostinger Plan Does Not Support Node.js

Use this architecture:

```txt
React frontend hosted on Hostinger
Node.js backend hosted on Supabase Edge Functions or another Node hosting provider
Supabase used for Auth, Database, and Storage
```

Possible backend hosting alternatives:

- Supabase Edge Functions
- Render
- Railway
- Fly.io
- Vercel
- Other Node.js hosting providers

### Option C: Upgrade Hostinger Plan

Upgrade to a Hostinger plan that supports Node.js Web App hosting.

---

## 9. Environment Variables

### Frontend

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Backend

```env
NODE_ENV=production
PORT=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
ALLOWED_ORIGINS=
JWT_SECRET=
```

### Storage Buckets

```env
AVATAR_BUCKET=avatars
RESUME_BUCKET=resumes
IMPORT_BUCKET=import-files
YEARBOOK_PHOTO_BUCKET=yearbook-photos
```

---

## 10. Recommended Project Folder Structure

```txt
NEMCO_DIGITAL_YEARBOOK/
  client/
    src/
      pages/
      components/
      hooks/
      lib/
      services/
    package.json
    vite.config.js

  server/
    src/
      app.js
      routes/
      controllers/
      services/
      middlewares/
      validators/
      utils/
    package.json
    .env.example

  supabase/
    migrations/
    seed/
```

---

## 11. Build Order

### Phase 1: Foundation

- Set up Supabase project
- Create database tables
- Enable Row Level Security
- Create admin seed process
- Add Supabase client to frontend
- Create Node.js backend skeleton

### Phase 2: Authentication and Roles

- Implement login/logout
- Add protected routes
- Add admin route guard
- Add user route guard
- Add role checking

### Phase 3: Admin Features

- Build admin dashboard
- Build user list page
- Add create/edit/deactivate user actions
- Add Excel import
- Add import preview
- Add import error report
- Add audit logs page

### Phase 4: User Profile

- Build editable profile page
- Add avatar upload
- Add profile preview
- Add yearbook visibility toggle
- Add admin approval flow

### Phase 5: Resume Builder

- Build resume form
- Add resume data saving
- Add resume preview
- Add resume templates
- Add PDF export

### Phase 6: Deployment

- Build frontend
- Configure backend
- Set Hostinger environment variables
- Connect to Supabase
- Test production login
- Test Excel import
- Test PDF export

### Phase 7: Security and Polish

- Test Row Level Security
- Validate file uploads
- Review audit logs
- Add backup process
- Add error pages
- Add loading states
- Improve mobile responsiveness

---

## 12. Current Gaps in the Existing Project

The current workspace needs the following:

- Supabase configuration
- Backend project
- Database migrations
- Authentication setup
- Role-based access control
- Admin dashboard
- Admin activity logs
- User management pages
- Excel bulk import
- Profile editing pages
- Resume builder
- Resume PDF export
- Supabase Storage integration
- Deployment configuration
- Environment variable setup
- Security policies
- Admin seed account process

---

## 13. Recommended Final Deployment Setup

The recommended setup is:

```txt
Hostinger:
  Frontend and Node.js backend, if the plan supports Node.js Web App hosting

Supabase:
  Authentication
  Database
  Storage
  Row Level Security
  Optional Edge Functions
```

If the Hostinger plan does not support Node.js Web App hosting:

```txt
Hostinger:
  Static React frontend

Supabase or external Node hosting:
  Backend API

Supabase:
  Auth, database, storage
```

This keeps the system deployable without requiring a VPS while still supporting a Node.js backend.
