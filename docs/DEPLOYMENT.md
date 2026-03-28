# Deployment Guide

Step-by-step instructions to deploy the ELD Trip Planner. Both frontend and backend deploy to a single **Vercel** project (free).

---

## Overview

```
  Browser ──> Vercel
               ├── /api/*   → Django serverless function  (@vercel/python)
               └── /*       → React static files          (@vercel/static-build)
```

- **Frontend**: Vercel builds the React app and serves it from its CDN.
- **Backend**: Django runs as a serverless function via `api/index.py`. Same origin as the frontend — no CORS needed.
- **No database** — all computation is stateless.

---

## Prerequisites

- A **GitHub** account with this repo pushed
- A **Vercel** account (sign up at vercel.com — free with GitHub)
- Your **ORS API key** (from openrouteservice.org)

---

## Step 1: Push to GitHub

If you haven't already:

```bash
cd auto-project

# Initialize git (if not done)
git init
git add -A
git commit -m "Initial commit"

# Create a GitHub repo (via github.com or gh CLI)
gh repo create eld-trip-planner --private --source=. --push
# OR manually:
git remote add origin https://github.com/YOUR_USERNAME/eld-trip-planner.git
git push -u origin main
```

Make sure `.env` is NOT committed (it's in `.gitignore`).

---

## Step 2: Deploy on Vercel

### 2a. Import Project

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** > **"Project"**
3. Import your GitHub repo
4. Configure:

| Setting | Value |
|---------|-------|
| **Root Directory** | `.` (project root — NOT `frontend/`) |
| **Framework Preset** | Other |

Leave Build Command and Output Directory blank — `vercel.json` handles everything.

### 2b. Set Environment Variables

Add these under **Environment Variables** (Production + Preview):

| Key | Value | Notes |
|-----|-------|-------|
| `DJANGO_SECRET_KEY` | `<random>` | Generate: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | `False` | Must be false in production |
| `ORS_API_KEY` | Your OpenRouteService API key | Required for accurate routing |
| `VITE_API_URL` | *(leave empty)* | Empty = same-origin requests (correct for unified deployment) |

**Not needed**: `CORS_ALLOWED_ORIGINS` (same-origin, no CORS), `VERCEL` (set automatically by Vercel).

### 2c. Deploy

Click **"Deploy"**. Vercel will:
1. Build the React frontend (`npm run build` in `frontend/`)
2. Bundle the Django serverless function (`api/index.py` + `requirements.txt`)

### 2d. Verify

1. Open your Vercel URL in the browser
2. Enter a trip (e.g., Dallas, TX → Oklahoma City, OK → Amarillo, TX)
3. Click **Plan Trip**
4. Verify:
   - Route map loads with markers and colored legs
   - ELD logs generate with correct duty status segments
   - PDF export works

Open browser DevTools → Network tab and confirm API calls go to the same origin (no cross-origin requests).

---

## Troubleshooting

### Build fails: "No Output Directory"
- Make sure **Root Directory** is set to `.` (project root), not `frontend/`
- Make sure **Framework Preset** is set to "Other"

### API returns 500 error
- Check Vercel Function Logs (Dashboard > your project > Functions tab)
- Make sure `ORS_API_KEY` and `DJANGO_SECRET_KEY` are set in environment variables
- Make sure `DEBUG` is set to `False`

### Frontend loads but API calls fail
- Open browser DevTools > Network tab
- Requests should go to `/api/...` on the same domain
- If `VITE_API_URL` is set to a non-empty value, requests go cross-origin — clear it and redeploy

### Routing timeout
- Vercel free tier has a 10-second function timeout
- Most trip plans complete in 2-5 seconds
- If external APIs (Nominatim, ORS) are slow, the request may timeout
- Upgrade to Vercel Pro for 60-second timeouts if needed

### Static file errors in function logs
- The `VERCEL` environment variable is set automatically — it triggers Django to use `StaticFilesStorage` instead of WhiteNoise's manifest storage
- This is expected; Django does not serve static files on Vercel (the CDN does)

---

## Custom Domain (Optional)

1. Vercel Dashboard > your project > **Settings** > **Domains**
2. Add your domain, follow DNS instructions
3. Both frontend and API are served from the same domain — no additional configuration needed

---

## Alternative: Split Deployment (Vercel + Render)

If you prefer to run the backend separately (e.g., for longer timeouts or persistent connections):

1. Deploy backend on **Render** as a Web Service:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - Start Command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
   - Env vars: `DJANGO_SECRET_KEY`, `DEBUG=False`, `ORS_API_KEY`, `CORS_ALLOWED_ORIGINS=https://your-app.vercel.app`

2. Deploy frontend on **Vercel** separately:
   - Root Directory: `frontend`
   - Framework: Vite
   - Env var: `VITE_API_URL=https://your-render-service.onrender.com`

> **Note**: Render free tier spins down after 15 min of inactivity (30-60s cold start on first request).

---

## Environment Variables Summary

### Unified Vercel Deployment

| Variable | Required | Description |
|----------|----------|-------------|
| `DJANGO_SECRET_KEY` | Yes | Random secret key for Django |
| `DEBUG` | Yes | Must be `False` in production |
| `ORS_API_KEY` | Yes | OpenRouteService API key |
| `VITE_API_URL` | No | Leave empty for same-origin (default) |
