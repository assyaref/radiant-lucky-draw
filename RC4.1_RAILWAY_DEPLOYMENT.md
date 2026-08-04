# RC4.1 — Railway Backend Deployment Refactor (Nixpacks)

> **Status:** Ready for deployment
> **Scope:** Backend deployment infrastructure only — no application logic changed.

---

## 1. Files Modified

| File | Action | Purpose |
|------|--------|---------|
| `Dockerfile` → `Dockerfile.backup` | Renamed | Disables Docker-based deployment so Railway uses Nixpacks |
| `server/railway.json` | Created | Railway Nixpacks build + deploy configuration |
| `server/package.json` | Modified | Added `postinstall` script to run `prisma generate` during install |

### No changes made to:
- Authentication
- DrawEngine
- Queue Engine
- Socket.IO
- Prisma schema
- API routes
- Frontend UI / React application
- Business logic
- Database models

---

## 2. Why Docker Was Disabled

The repository previously contained a root `Dockerfile` performing a **multi-stage build** (frontend + backend).

Railway automatically detects a `Dockerfile` at the repository root and attempts to build using Docker. This caused the build to fail because:

- The frontend stage installed **production-only** dependencies (`npm ci --omit=dev`)
- The build then executed `tsc` (TypeScript compiler)
- `tsc` is a **devDependency** and was not installed
- Result: `sh: tsc: not found`

By renaming `Dockerfile` → `Dockerfile.backup`, Railway no longer detects a Dockerfile and falls back to its native **Nixpacks** builder, which correctly handles Node.js projects.

> The `Dockerfile.backup` is preserved (not deleted) for reference / rollback.

---

## 3. Railway Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel (Frontend)                    │
│              React + Vite SPA (already deployed)            │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / CORS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Railway (Backend)                       │
│              Node.js + Express + Socket.IO                  │
│              Builder: Nixpacks                              │
│              Start: npm start → node dist/index.js          │
└──────────────────────────┬──────────────────────────────────┘
                           │ Prisma (DATABASE_URL)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Railway (PostgreSQL)                     │
│                    Managed database service                 │
└─────────────────────────────────────────────────────────────┘
```

### Build pipeline (Nixpacks)
1. Detect Node.js project from `server/package.json`
2. Install dependencies (`npm install`)
3. `postinstall` runs → `prisma generate` (generates Prisma Client)
4. `npm run build` → `tsc` compiles TypeScript → `dist/`
5. Deploy starts via `npm start` → `node dist/index.js`

---

## 4. Required Environment Variables

Set these in the Railway backend service **Variables** tab:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string from Railway DB service |
| `JWT_SECRET` | ✅ Yes | JWT access-token signing secret |
| `JWT_REFRESH_SECRET` | ✅ Yes | JWT refresh-token signing secret |
| `NODE_ENV` | ✅ Yes | Set to `production` |
| `PORT` | ⚠️ Recommended | Railway injects `PORT` automatically; app defaults to `3001` |
| `CORS_ORIGIN` | ⚠️ Recommended | Frontend origin, e.g. `https://your-app.vercel.app` |
| `COOKIE_SECURE` | ⚠️ Recommended | Set to `true` in production (HTTPS) |
| `COOKIE_SAME_SITE` | Optional | `lax` (default) or `none` if cross-site cookies needed |

> **Note:** `NODE_ENV=production` is fully supported. The app's `env.ts` validates required variables and exits with a clear error if `DATABASE_URL`, `JWT_SECRET`, or `JWT_REFRESH_SECRET` are missing in production.

---

## 5. Required Railway Services

| Service | Type | Purpose |
|---------|------|---------|
| **Backend API** | Node.js (Nixpacks) | Express + Socket.IO server |
| **PostgreSQL** | Database | Managed Postgres instance for Prisma |

### Backend service settings
- **Root Directory:** `server/`
- **Builder:** Nixpacks (via `server/railway.json`)
- **Start Command:** `npm start`
- **Restart Policy:** `ON_FAILURE` (max 10 retries)

---

## 6. Deployment Order

1. **Create PostgreSQL service** on Railway → copy the `DATABASE_URL` connection string.
2. **Create Backend service** on Railway → point to the `server/` directory.
3. **Set environment variables** on the backend service (see §4).
4. **Run migrations** against the Railway database:
   ```bash
   cd server
   npx prisma migrate deploy
   ```
   (or run via Railway shell / a one-off command)
5. **Deploy** the backend service (Railway auto-builds with Nixpacks).
6. **Verify** the health endpoint responds.
7. **Update frontend** `CORS_ORIGIN` / API base URL on Vercel to point to the Railway backend URL.

---

## 7. Verification Checklist

- [ ] `Dockerfile` renamed to `Dockerfile.backup` (not deleted)
- [ ] `server/railway.json` exists with `builder: NIXPACKS`
- [ ] `server/package.json` has `build`, `start`, `dev` scripts
- [ ] `server/package.json` has `postinstall: prisma generate`
- [ ] `npm run build` passes with **no TypeScript errors**
- [ ] `npm start` launches the production server (`node dist/index.js`)
- [ ] `NODE_ENV=production` is supported (env validation active)
- [ ] `prisma generate` runs during install (postinstall)
- [ ] `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` set on Railway
- [ ] Railway uses Nixpacks (no Docker build)
- [ ] Health endpoint `/api/health` returns 200
- [ ] Frontend (Vercel) points to Railway backend URL

---

## 8. Verification Result

- **Build:** `npm run build` → ✅ passes, no TypeScript errors
- **Start:** `npm start` → ✅ launches `node dist/index.js`
- **Prisma:** `prisma generate` runs via `postinstall` → ✅
- **Deployment readiness:** ✅ Ready for Railway Nixpacks deployment
