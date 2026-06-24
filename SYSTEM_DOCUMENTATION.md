# NEMCO Digital Yearbook - System Documentation

## Overview

NEMCO Digital Yearbook is a full-stack web application for schools to create and publish interactive digital yearbooks. The signature feature is a 3D flipbook that renders student profiles with realistic page-flip animations. Students can build profiles, create resumes, and share memories through photo albums.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, TailwindCSS 4, shadcn/ui, Lucide icons |
| Backend | Node.js 20+, Express 4, Multer, Zod |
| Database | Supabase (PostgreSQL) with Row Level Security |
| Auth | Supabase Auth (JWT, email/password) |
| Storage | Supabase Storage (avatars, PDFs, photos) |
| 3D/Animation | Three.js 0.184, react-pageflip, CSS 3D transforms |
| PDF | pdfjs-dist, jspdf, puppeteer |
| Excel | xlsx (bulk import/export) |
| QR Codes | qrcode.react |
| Deployment | Vercel (rewrites, serverless functions) |

---

## Project Structure

```
NEMCO_DIGITAL_YEARBOOK/
├── client/                          # Frontend (React SPA)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/               # Admin pages (7 pages)
│   │   │   └── student/             # Student pages (8 pages)
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   ├── student/
│   │   │   ├── resume/
│   │   │   ├── profile/
│   │   │   ├── flipbook/
│   │   │   ├── layout/
│   │   │   └── ui/                  # shadcn/ui components
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   └── AuthProvider.jsx
│   │   ├── services/                # Client-side API services
│   │   ├── hooks/                   # Custom React hooks
│   │   └── lib/                     # Utilities, supabase client
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                          # Backend (Express.js)
│   ├── src/
│   │   ├── routes/                  # API route definitions
│   │   ├── controllers/             # Request handlers
│   │   ├── services/                # Business logic layer
│   │   ├── middlewares/             # Auth, rate limiting, error handling
│   │   ├── validators/              # Zod schemas
│   │   ├── config/                  # Supabase config, env
│   │   ├── seeds/                   # Database seed scripts
│   │   ├── app.js                   # Express app setup
│   │   └── server.js                # Server entry point
│   ├── .env
│   └── package.json
├── supabase/
│   ├── migrations/                  # 11 SQL migration files
│   └── seed/
│       └── sample_users.sql
├── vercel.json                      # Vercel deployment config
└── package.json                     # Root monorepo package
```

---

## Features

### Student Features

- **Authentication**: Login with Student ID + password
- **Profile Management**: Upload avatar, fill bio, quotes, academic info, social links
- **3D Flipbook**: Interactive yearbook with page-flip animations, search, zoom, fullscreen, thumbnails
- **Resume Builder**: Create structured resumes with templates (Simple, Modern, Classic)
- **Resume PDF Generation**: Server-side PDF generation via Puppeteer
- **Memories/Albums**: Event-based photo/video albums with favorites and tagging
- **Public Profiles**: Shareable profile URLs at `/u/:identifier`
- **QR Code Generation**: Generate QR codes linking to profile pages

### Admin Features

- **Dashboard**: Stats overview (users, approvals, resumes, imports)
- **User Management**: Activate/deactivate, approve/reject profiles
- **Bulk Import**: Import users from Excel (.xlsx) with error tracking
- **Yearbook Management**: Sections, profiles, PDF pages, settings
- **Memories Management**: Create/manage albums and media items
- **Resume Management**: View and manage student resumes
- **Activity Logs**: Audit trail of all system actions

---

## Pages

### Student Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | LoginPage | Student login |
| `/` | Yearbook3DPage | 3D flipbook viewer (default) |
| `/profile` | ProfilePage | Profile editor |
| `/resume` | ResumeBuilderPage | Resume builder |
| `/memories` | MyMemoriesPage | Memories/albums view |
| `/u/:identifier` | PublicProfilePage | Public profile |
| `/flipbook` | FlipbookPage | Flipbook viewer |
| `/library` | LibraryPage | Library page |

### Admin Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin` | AdminDashboard | Dashboard with stats |
| `/admin/import` | ImportUsersPage | Bulk user import |
| `/admin/users` | ManageUsersPage | User management |
| `/admin/resumes` | ResumeManagementPage | Resume management |
| `/admin/yearbook` | YearbookManagementPage | Yearbook content |
| `/admin/memories` | MemoriesManagementPage | Memories management |
| `/admin/logs` | ActivityLogsPage | Audit logs |

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (student info, bio, quote, avatar, social links, skills) |
| `resumes` | Student resumes (template, data JSONB, visibility) |
| `resume_templates` | Resume templates (name, slug, default sections) |
| `resume_sections` | Template sections (field type, required, config) |

### Yearbook Tables

| Table | Purpose |
|-------|---------|
| `flipbook_settings` | Yearbook configuration (key-value) |
| `flipbook_sections` | Yearbook sections (name, sort order) |
| `flipbook_profiles` | Profile placement in yearbook |
| `flipbook_pdf_pages` | Uploaded PDFs for flipbook |
| `flipbook_pdf_page_renderings` | Cached PDF page renders |

### Memories Tables

| Table | Purpose |
|-------|---------|
| `memory_albums` | Photo/video albums with visibility rules |
| `memory_items` | Individual media items with student tagging |
| `student_favorites` | Student favorite items |

### System Tables

| Table | Purpose |
|-------|---------|
| `audit_logs` | Audit trail (action, entity, old/new data, IP) |
| `import_batches` | Bulk import tracking |
| `import_errors` | Import error details |
| `avatar_uploads` | Avatar upload history |

### Storage Buckets

| Bucket | Access | Limit | File Types |
|--------|--------|-------|------------|
| `avatars` | Public | 2MB | Images |
| `flipbook-pdfs` | Public | 50MB | PDF |
| `resume-photos` | Public | 5MB | Images |
| `import-files` | Private | - | Excel |
| `yearbook-photos` | Public | - | Images |

---

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with student ID + password |
| POST | `/api/auth/change-password` | Change password |

### Profiles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profiles/me` | Get current user profile |
| GET | `/api/profiles/public/:identifier` | Public profile |
| PATCH | `/api/profiles/me` | Update own profile |
| POST | `/api/profiles/submit` | Submit profile for approval |
| POST | `/api/profiles/me/avatar` | Upload avatar |
| GET | `/api/profiles/me/avatar/history` | Avatar history |
| POST | `/api/profiles/me/qrcode/generate` | Generate QR code |

### Resume

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resume-templates` | List templates |
| GET | `/api/resume-templates/:slug` | Template detail |
| GET | `/api/my/resumes` | List own resumes |
| GET | `/api/my/resumes/:id` | Get resume |
| POST | `/api/my/resumes` | Create resume |
| PATCH | `/api/my/resumes/:id` | Update resume |
| DELETE | `/api/my/resumes/:id` | Delete resume |
| POST | `/api/my/resumes/:id/photo` | Upload resume photo |
| POST | `/api/generate-resume-pdf` | Generate PDF |

### Yearbook

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/yearbook/flipbook` | Get flipbook data |
| GET/PATCH | `/api/yearbook/settings` | Yearbook settings |
| GET/POST/PATCH/DELETE | `/api/yearbook/profiles` | Yearbook profiles |
| POST | `/api/yearbook/reorder` | Reorder profiles |
| GET/POST/PATCH/DELETE | `/api/yearbook/sections` | Yearbook sections |
| GET/POST/PATCH/DELETE | `/api/yearbook/pdf-pages` | PDF pages |
| POST | `/api/yearbook/pdf-pages/reorder` | Reorder PDF pages |

### Memories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memories/student/albums` | Student albums |
| GET | `/api/memories/student/albums/:id` | Album detail |
| GET | `/api/memories/student/favorites` | Student favorites |
| POST | `/api/memories/student/favorites/:itemId` | Toggle favorite |
| GET/POST/PATCH/DELETE | `/api/memories/admin/albums` | Admin album CRUD |
| POST | `/api/memories/admin/items` | Create item |
| POST | `/api/memories/admin/items/bulk` | Bulk create items |
| PATCH/DELETE | `/api/memories/admin/items/:itemId` | Update/delete item |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET/POST/PATCH/DELETE | `/api/admin/users` | User management |
| GET | `/api/admin/logs` | Audit logs |
| GET | `/api/admin/resumes` | Resume management |
| GET | `/api/admin/yearbook` | Yearbook management |
| POST | `/api/admin/upload/pdf` | Upload PDF |
| DELETE | `/api/admin/upload/pdf` | Delete PDF |
| POST | `/api/admin/import/users` | Bulk import users |
| GET | `/api/admin/import/batches` | List import batches |
| GET | `/api/admin/import/batches/:id` | Batch details |
| GET | `/api/admin/import/batches/:id/errors` | Batch errors |

### Utility

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

---

## Authentication Flow

1. Student enters Student ID (normalized to 7 digits with zero-padding)
2. Server looks up `profiles` table by `student_number`
3. Retrieves associated `email` from profile
4. Calls `supabaseAdmin.auth.signInWithPassword({ email, password })`
5. Returns `{ user, session, profile }` to client
6. Client stores profile in `sessionStorage`

### Middleware

- `authenticate` - Verifies Bearer token, attaches user+profile to request
- `requireAuth` - Alternative auth with debug logging
- `requireAdmin` - Auth + admin role check

---

## 3D Flipbook System

The flipbook is the core feature, combining multiple rendering techniques:

### Rendering Pipeline

1. PDF pages are uploaded by admins via the yearbook management interface
2. `pdfjs-dist` extracts page counts and renders pages to canvas as JPEG images
3. Rendered images are cached in `flipbook_pdf_page_renderings` table
4. Client displays pages using CSS 3D transforms with `perspective: 3000px`

### Animation

- CSS `transform: rotateY()` with cubic-bezier easing
- Page edge shading gradients for depth
- Spine shadows during flip
- Backface visibility handling

### Audio

- Web Audio API generates synthesized flip sounds
- Noise buffer processed through bandpass filter

### Performance

- Lazy PDF rendering (only nearby pages)
- Pre-rendering cache system
- Thumbnail strip with lazy loading

---

## Deployment

Configured for Vercel deployment:

- SPA routing: all non-API paths serve `index.html`
- API rewrites route `/api/*` to Express handler
- Serverless function for PDF generation (1GB memory, 30s timeout)
- Cache headers for static assets

### Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | Environment (development/production) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `ALLOWED_ORIGINS` | CORS allowed origins |
| `JWT_SECRET` | JWT signing secret |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase project

### Installation

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### Database Setup

1. Create a Supabase project
2. Run migrations in `supabase/migrations/` in order
3. Create storage buckets (avatars, flipbook-pdfs, resume-photos, import-files)
4. Configure RLS policies

### Running Locally

```bash
# Start server (port 5000)
cd server && npm run dev

# Start client (port 5173)
cd client && npm run dev
```

The client proxies `/api` requests to `http://localhost:5000`.

---

## Security

- Row Level Security (RLS) on all database tables
- JWT token validation on every protected request
- Profile status checks (active/inactive)
- File upload size limits and type restrictions
- Admin-only access for management endpoints
- Audit logging for all data modifications
- CORS configuration for allowed origins
