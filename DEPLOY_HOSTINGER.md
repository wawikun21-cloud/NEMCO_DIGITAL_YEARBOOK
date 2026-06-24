# Hostinger Deployment Guide — NEMCO Digital Yearbook

## Architecture Overview

This guide covers **two deployment strategies**:

| Strategy | Frontend | Backend | Use Case |
|----------|----------|---------|----------|
| **A. Unified** | Served by Express | Same Node.js app | Single domain, simpler setup |
| **B. Separate** | Static hosting | Node.js subdomain | Two domains, more control |

**Strategy B (Separate)** is recommended when:
- You want the frontend on the main domain (`yourdomain.com`)
- You want the backend on a subdomain (`api.yourdomain.com`)
- You plan to scale frontend and backend independently

---

## Strategy B — Separate Domains (Recommended)

```
https://yourdomain.com          ← Frontend (static files)
https://api.yourdomain.com      ← Backend (Node.js Express API)
```

### Traffic Flow

```
Browser → yourdomain.com → React app (client/dist/)
                           ↓
Browser → api.yourdomain.com/api/* → Express server
                           ↓
                           → Supabase (database + storage)
```

---

## Prerequisites

1. Hostinger Business plan (or higher) with Node.js support
2. Node.js 20.x locally for building
3. Your domain pointed to Hostinger nameservers
4. Supabase project with all tables migrated
5. Two domains or subdomains prepared:
   - **Frontend domain**: `yourdomain.com` (or temp domain)
   - **Backend domain**: `api.yourdomain.com` (or temp subdomain)

---

## Step 1 — Build Locally

From the project root:

```bash
# Windows
deploy-hostinger.bat

# Or manually:
cd client
npm install --include=dev
npm run build
cd ../server
npm install --production
```

This produces:
- `client/dist/` — built React app (static files)
- `server/` — Express API with production dependencies

---

## Step 2 — Configure Environment Variables

### 2a. Server `.env` (backend)

Edit `server/.env` for the backend domain:

```env
PORT=5000
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
JWT_SECRET=your-jwt-secret
```

**Important**: `ALLOWED_ORIGINS` must list the **frontend domain(s)** — this is where the browser will send requests from.

### 2b. Client `.env.production` (frontend)

Create or edit `client/.env.production`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

**Key difference from unified deployment**: `VITE_API_BASE_URL` is now an **absolute URL** pointing to the backend subdomain, not `/api`.

### 2c. Rebuild the client

After changing `.env.production`, rebuild:

```bash
cd client
npm run build
```

---

## Step 3 — Deploy the Backend (Node.js App)

### 3a. Create Node.js App in hPanel

1. Log into **hPanel** → **Websites** → **Add Website**
2. Choose **Node.js Apps**
3. Configure:
   - **Root directory**: `server`
   - **Build command**: `npm install --production`
   - **Entry file**: `src/server.js`
   - **Node.js version**: `20.x`
4. Click **Create**

### 3b. Upload the server folder

Upload the contents of `server/` to the Node.js app's root directory. The folder structure should be:

```
public_html/ (or your app root)
├── src/
│   ├── server.js          ← entry point
│   ├── app.js
│   ├── config/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── ...
├── .env                    ← upload manually (don't commit to git)
├── package.json
└── package-lock.json
```

### 3c. Set backend environment variables

In hPanel → your Node.js app → **Environment Variables**, add all values from Step 2a.

### 3d. Assign the subdomain

1. In hPanel → **Websites** → your backend subdomain → **Settings**
2. Point it to the Node.js app you just created
3. Enable **SSL** (Let's Encrypt)

### 3e. Verify backend

Test: `https://api.yourdomain.com/api/health`

Expected response:
```json
{"status":"ok","service":"digital-yearbook-api"}
```

---

## Step 4 — Deploy the Frontend (Static Site)

### Option A — Hostinger Static Hosting

1. In hPanel → **Websites** → **Add Website** → choose **Static** (or use the same Business plan's static hosting)
2. Upload the contents of `client/dist/` to the static site root:
   ```
   public_html/
   ├── index.html
   ├── assets/
   │   ├── index-*.css
   │   ├── index-*.js
   │   └── ...
   └── favicon.svg
   ```
3. Assign your **main domain** (`yourdomain.com`) to this static site
4. Enable **SSL**

### Option B — Same Node.js App (Simpler)

If you prefer not to manage a separate static site, you can serve the client from the same Node.js app but on a different domain:

1. Upload `client/dist/` alongside `server/` so the structure is:
   ```
   ├── server/
   │   └── src/server.js
   ├── client/
   │   └── dist/
   └── .env
   ```
2. The Express server already serves static files from `client/dist/` in production (`app.js:116-125`)
3. Point both domains to the same Node.js app
4. The frontend domain will serve static files, the API domain will serve API responses

**Caveat**: With Option B, non-API routes on the frontend domain will return 404 from Express unless you add a proxy or use the same domain. Option A is cleaner.

### Option C — Vercel/Netlify for Frontend (Easiest)

If you want to keep the frontend on Vercel while moving only the backend to Hostinger:

1. Deploy `client/` to Vercel/Netlify as before
2. Set `VITE_API_BASE_URL=https://api.yourdomain.com/api` in Vercel/Netlify env vars
3. Deploy `server/` to Hostinger as the backend
4. Update Supabase CORS to include both domains

This lets you migrate incrementally.

---

## Step 5 — Update Supabase Configuration

In your Supabase dashboard:

1. **Authentication** → **URL Configuration**:
   - **Site URL**: `https://yourdomain.com`
   - **Redirect URLs**: `https://yourdomain.com/*`, `https://api.yourdomain.com/*`

2. **API** → **Settings** → **Allowed Origins**:
   Add: `https://yourdomain.com`, `https://www.yourdomain.com`

3. **Storage** → **Policies**: Ensure CORS allows your frontend domain (Supabase Storage respects API CORS settings)

---

## Step 6 — Update CORS on the Express Server

The Express server already has dynamic CORS (`app.js:33-40`). It checks `req.headers.origin` against `ALLOWED_ORIGINS`. As long as `ALLOWED_ORIGINS` in your `.env` includes the frontend domain, cross-origin requests will work.

If you need to add more origins later, edit `server/.env`:

```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://temp-domain.example.com
```

Then restart the Node.js app in hPanel.

---

## Step 7 — Verify Deployment

Test these endpoints and pages:

| URL | Expected Result |
|-----|-----------------|
| `https://api.yourdomain.com/api/health` | `{"status":"ok","service":"digital-yearbook-api"}` |
| `https://yourdomain.com/` | React app loads |
| `https://yourdomain.com/login` | Login page renders |
| `https://yourdomain.com/admin` | Admin dashboard (after login) |
| `https://yourdomain.com/profile` | Student profile page |
| `https://yourdomain.com/resume` | Resume builder with PDF download |

### API calls from browser

Open browser DevTools → Network tab. All API calls should go to `https://api.yourdomain.com/api/*` with:
- `Request Headers: Origin: https://yourdomain.com`
- `Response Headers: Access-Control-Allow-Origin: https://yourdomain.com`

---

## Step 8 — SSL & Security

1. Enable **Let's Encrypt SSL** for both domains in hPanel
2. In `server/.env`, ensure `NODE_ENV=production` (enables secure headers via Helmet)
3. Verify HTTPS is enforced (hPanel → Websites → Force HTTPS)

---

## Environment Variable Reference

### Server `.env` (backend — api.yourdomain.com)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (default: 5000) |
| `NODE_ENV` | Yes | Set to `production` |
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `ALLOWED_ORIGINS` | Yes | Comma-separated frontend domains |
| `JWT_SECRET` | Yes | Secret for JWT signing |

### Client `.env.production` (frontend — yourdomain.com)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_API_BASE_URL` | Yes | **Absolute** backend URL (e.g., `https://api.yourdomain.com/api`) |

---

## Known Limitations on Hostinger

### PDF Generation (Puppeteer — Server-Side)

**Will NOT work on Hostinger.** Puppeteer requires a headless Chromium binary that Hostinger's managed Node.js environment doesn't support.

**Current state:** The client already has **two working client-side PDF generators** that work on any hosting:

| Hook | Location | Use Case |
|------|----------|----------|
| `usePdfExport` | `client/src/hooks/usePdfExport.js` | Resume builder "Download PDF" — captures DOM via html2canvas → jsPDF |
| `useResumePdfDownload` | `client/src/hooks/useResumePdfDownload.js` | Single-page resume download |

Both use `html2canvas` + `jspdf` (already in `client/package.json` dependencies) and run **entirely in the browser** — no server needed.

**If you need server-side PDF (e.g., for email attachments or exact A4 fidelity):**

1. **Supabase Edge Function** — use the pre-built Deno handler at `supabase/functions/generate-resume-pdf/index.ts`
2. **External service** — use a PDF microservice (e.g., PDFMonkey, DocRaptor)

### Client-Side PDF Generation (Already Working)

The resume builder's "Download PDF" button in `ResumeBuilderPage.jsx` uses `usePdfExport()` which:
1. Clones the resume preview DOM
2. Captures it as a canvas via `html2canvas`
3. Embeds the image into a `jsPDF` document
4. Triggers a browser download

This produces a pixel-perfect A4 PDF with no server dependency. The quality is sufficient for screen viewing and standard printing.

### File Uploads (Multer)

Works fine — uploads go to Supabase Storage, not local disk.

### WebSockets

Not used in this app — no issues.

---

## Supabase Edge Function Setup (Optional — for Server-Side PDF)

A pre-built Deno edge function is included at `supabase/functions/generate-resume-pdf/index.ts`.

To deploy it:

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login and link your project:
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

3. Deploy the function:
   ```bash
   supabase functions deploy generate-resume-pdf
   ```

4. The function URL will be: `https://your-project.supabase.co/functions/v1/generate-resume-pdf`

5. To use it from the client, update `usePdfExport.js` to POST to this URL instead of generating locally.

**Note:** The client-side `html2canvas` approach already works without this. The Edge Function is only needed if you require server-side PDF rendering for email attachments, exact print fidelity, or to support browsers that struggle with `html2canvas`.

---

## Troubleshooting

### CORS errors in browser console

**Symptom**: `Access to fetch at 'https://api.yourdomain.com/api/*' from origin 'https://yourdomain.com' has been blocked by CORS policy`

**Fix**: 
1. Verify `ALLOWED_ORIGINS` in `server/.env` includes `https://yourdomain.com`
2. Restart the Node.js app in hPanel
3. Check that Supabase API settings include `https://yourdomain.com` in Allowed Origins

### "Network Error" or "Failed to fetch" when calling API

**Symptom**: Frontend loads but API calls fail with network errors.

**Fix**:
1. Verify `VITE_API_BASE_URL` in `client/.env.production` is the correct absolute URL
2. Verify the backend subdomain is accessible: `https://api.yourdomain.com/api/health`
3. Check that SSL is enabled on the backend domain (mixed content blocked)

### "Missing environment variables" on startup

**Fix**: Verify all required vars are set in hPanel → Node.js app → Environment Variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

### Client shows blank page

**Fix**: Check browser console for errors. Usually caused by:
- `VITE_API_BASE_URL` pointing to wrong URL
- Supabase CORS not configured for your domain
- JavaScript bundle not loading (check if `client/dist/assets/` files are accessible)

### Login succeeds but API calls return 401

**Fix**: The access token is stored in `sessionStorage` and sent via `Authorization: Bearer` header. If you're testing in incognito mode or cleared storage, re-login. Check that the backend `.env` `SUPABASE_SERVICE_ROLE_KEY` matches your Supabase project.

### PDF download produces blank pages

**Fix**: This is a known `html2canvas` limitation with certain CSS properties. The resume template uses inline styles which work well. If issues persist, try the `useResumePdfDownload` hook instead (single-page capture).

---

## Rollback

If deployment fails:

1. **Frontend**: Revert to Vercel/Netlify (git push to connected repo)
2. **Backend**: In hPanel, stop the Node.js app and point the subdomain back to a placeholder
3. **DNS**: Changes may take up to 48 hours to propagate
4. **Supabase**: Revert CORS and URL config to previous values

---

## Quick Reference — What to Deploy Where

| Folder | Deploy To | Domain |
|--------|-----------|--------|
| `client/dist/` | Static hosting or CDN | `yourdomain.com` |
| `server/` | Hostinger Node.js app | `api.yourdomain.com` |
| `supabase/functions/` | Supabase Edge (via CLI) | `*.supabase.co` |
| `api/` | **Do NOT deploy** | Vercel-only (serverless) |
