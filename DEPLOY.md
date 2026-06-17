# Deployment Guide

## Option A: Vercel (Recommended)

### Architecture
- **Client** (React/Vite) → Static files on Vercel CDN
- **API** (Express) → Vercel Serverless Functions (`api/index.js`)
- **Database/Auth** → Supabase (already cloud-hosted)

### Prerequisites
- A [Vercel](https://vercel.com) account
- This repo connected to Vercel (GitHub integration)
- Supabase project already set up

### Step-by-Step

#### 1. Push to GitHub
```bash
git add .
git commit -m "Add Vercel deployment config"
git push origin main
```

#### 2. Import project on Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Vercel auto-detects `vercel.json` — no framework preset needed

#### 3. Set environment variables
In Vercel dashboard → Project → Settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `SUPABASE_URL` | `https://zyncuihltvmbiskmjira.supabase.co` |
| `SUPABASE_ANON_KEY` | your-anon-key |
| `SUPABASE_SERVICE_ROLE_KEY` | your-service-role-key |
| `ALLOWED_ORIGINS` | your-vercel-url.vercel.app |
| `JWT_SECRET` | your-jwt-secret |

#### 4. Deploy
Click **Deploy**. Vercel will:
- Build the client (`cd client && npm run build`)
- Output static files from `client/dist`
- Set up serverless functions from `api/index.js`

#### 5. Verify
- Visit `https://your-project.vercel.app` — should load the login page
- Visit `https://your-project.vercel.app/api/health` — should return `{"status":"ok"}`

#### 6. Custom domain (optional)
In Vercel → Project → Settings → Domains, add your domain and update `ALLOWED_ORIGINS`.

### Vercel File Structure
```
repo root/
├── vercel.json          # Vercel config (build, rewrites, headers)
├── api/
│   └── index.js         # Serverless function entry (wraps Express app)
├── client/              # React/Vite frontend
│   ├── dist/            # Build output (served as static)
│   └── ...
└── server/              # Express API source
    └── src/
        ├── app.js
        ├── server.js    # Local dev entry (skips listen on Vercel)
        └── ...
```

---

## Option B: Hostinger (Business/Cloud)

## What to Upload

Upload the **contents** of the `deploy/` folder to your `public_html` via FTP/SFTP or Hostinger's File Manager.

Final structure on server:
```
public_html/
├── .htaccess
├── index.html
├── favicon.svg
├── icons.svg
├── Loginbackground.png
├── NEMCO-Logo.png
├── assets/
│   ├── index-B9F3iH6_.js
│   ├── index-xfF4ly6A.css
│   └── *.woff2 fonts
└── server/
    ├── .env
    ├── package.json
    └── src/
        ├── server.js
        ├── app.js
        ├── config/
        ├── controllers/
        ├── middlewares/
        ├── routes/
        ├── services/
        └── validators/
```

## Step-by-Step

### 1. Build client locally (already done)
```bash
cd client
npm run build
```

### 2. Upload files
Use Hostinger **File Manager** (in hPanel) or an FTP client (FileZilla):
- Upload everything from `deploy/` folder to `public_html/`
- Do NOT upload `node_modules` — Hostinger installs them for you
- Do NOT upload the root `package.json` — it's not needed on the server

### 3. Configure Node.js in hPanel
1. Go to **hPanel → Node.js** (under Advanced)
2. Click **Create Application**
3. Fill in:
   - **Node.js version**: 18.x or 20.x
   - **Application root**: `server`
   - **Application entry point**: `src/server.js`
   - **Application URL**: your domain (e.g., `https://yourdomain.com`)
   - **Run mode**: Production
4. Click **Create**

### 4. Install dependencies
In the Node.js manager, click **Run NPM Install**

### 5. Set environment variables
In the Node.js manager, set these variables:
```
NODE_ENV=production
PORT=5000
SUPABASE_URL=https://zyncuihltvmbiskmjira.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
JWT_SECRET=your-jwt-secret
```

### 6. Start the application
Click **Start** (or **Restart**) in the Node.js manager

### 7. Verify
- Visit `https://yourdomain.com` — should load the login page
- Visit `https://yourdomain.com/api/health` — should return `{"status":"ok"}`

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm: command found` in SSH | Don't use SSH for npm. Use hPanel Node.js manager instead |
| `Permission denied` for vite | You uploaded the root `package.json` which has a `build` script. Remove it. Only `server/package.json` should be on the server |
| Blank page | Make sure `client/dist/` files were uploaded to `public_html/` |
| CORS errors | Check `ALLOWED_ORIGINS` includes your exact domain |
| 500 errors | Check `server/.env` has correct Supabase credentials |
| API not responding | Make sure Node.js app is running in hPanel |
