# Deployment Guide

Step-by-step instructions to deploy the ELD Trip Planner. Frontend on **Vercel** (free), backend on **Render** (free).

---

## Overview

```
  Browser ──> Vercel (React static)
         └──> Render (Django API)    ← same browser; `VITE_API_URL` points here
```

- **Frontend**: Vercel serves the built React app. The build **must** include `VITE_API_URL` so the browser calls your Render backend directly (CORS on Django allows your Vercel origin).
- **Backend**: Render runs Django with Gunicorn. No database needed (all computation, no persistence).

---

## Prerequisites

- A **GitHub** account with this repo pushed
- A **Vercel** account (sign up at vercel.com — free with GitHub)
- A **Render** account (sign up at render.com — free with GitHub)
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

## Step 2: Deploy Backend on Render

### 2a. Create a Web Service

1. Go to [render.com/dashboard](https://dashboard.render.com)
2. Click **"New +"** > **"Web Service"**
3. Connect your GitHub repo
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `eld-trip-planner-api` |
| **Region** | Pick closest to your users |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt && python manage.py collectstatic --noinput` |
| **Start Command** | `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT` |
| **Instance Type** | Free |

### 2b. Set Environment Variables

In the Render dashboard, go to your service > **Environment** tab. Add these:

| Key | Value |
|-----|-------|
| `DJANGO_SECRET_KEY` | Generate one: run `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | `False` |
| `ORS_API_KEY` | Your OpenRouteService API key |
| `CORS_ALLOWED_ORIGINS` | `https://your-app-name.vercel.app` (fill in after Step 3) |
| `PYTHON_VERSION` | `3.11.6` |

### 2c. Deploy

Click **"Create Web Service"**. Render will build and deploy. Wait for it to show "Live".

Note your backend URL — it will look like: `https://eld-trip-planner-api.onrender.com`

### 2d. Test the Backend

Visit `https://eld-trip-planner-api.onrender.com/api/locations/search?q=Dallas` in your browser. You should see a JSON array of location suggestions.

> **Note**: Render free tier spins down after 15 minutes of inactivity. First request after sleep takes ~30-60 seconds to cold-start. This is normal for the free tier.

---

## Step 3: Deploy Frontend on Vercel

### 3a. Import Project

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** > **"Project"**
3. Import your GitHub repo
4. Configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` (auto-detected) |
| **Output Directory** | `dist` (auto-detected) |

### 3b. Environment variable (required)

Add this under **Environment Variables** for the Vercel project (Production — and Preview if you use it):

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your Render backend origin from Step 2c (e.g. `https://eld-trip-planner-api.onrender.com`), **no trailing slash** |

Vite inlines this at **build** time. If it is missing, `npm run build` fails on purpose so you never deploy a frontend that calls `/api` on Vercel (which would return HTML instead of JSON).

### 3c. Deploy

Click **"Deploy"**. Vercel will build and deploy in ~1 minute.

Your frontend URL will look like: `https://your-app-name.vercel.app`

### 3d. Update Backend CORS

The browser calls Render from your Vercel page origin, so Django must allow that origin.

Go to **Render** > your service > **Environment** and set:

```
CORS_ALLOWED_ORIGINS=https://your-app-name.vercel.app
```

Render will auto-redeploy with the new CORS setting.

---

## Step 4: Verify End-to-End

1. Open your Vercel URL in the browser
2. Enter a trip (e.g., Dallas, TX → Oklahoma City, OK → Amarillo, TX)
3. Click **Plan Trip**
4. Verify:
   - Route map loads with markers
   - ELD logs generate with correct data
   - PDF export works

> If the first request is slow (~30 sec), that's the Render free-tier cold start. Subsequent requests will be fast.

---

## Troubleshooting

### "Network Error" or CORS error in browser console
- Check that `CORS_ALLOWED_ORIGINS` on Render exactly matches your Vercel URL (no trailing slash)
- Check that `VITE_API_URL` on Vercel exactly matches your Render URL (no trailing slash)

### Backend returns 500 error
- Check Render logs (Dashboard > your service > Logs)
- Make sure `ORS_API_KEY` is set
- Make sure `DJANGO_SECRET_KEY` is set

### Frontend loads but API calls fail
- Open browser DevTools > Network tab
- Check that requests go to your Render URL, not `localhost`
- If still going to localhost, make sure `VITE_API_URL` is set and you **redeployed** after setting it

### Routing timeout
- Without `ORS_API_KEY`, the backend uses haversine estimates (faster but less accurate)
- With the key, OpenRouteService should respond within 5 seconds

---

## Custom Domain (Optional)

### Vercel (Frontend)
1. Vercel Dashboard > your project > **Settings** > **Domains**
2. Add your domain, follow DNS instructions

### Render (Backend)
1. Render Dashboard > your service > **Settings** > **Custom Domains**
2. Add your API subdomain (e.g., `api.yourdomain.com`)
3. Update `VITE_API_URL` on Vercel to match

---

## Environment Variables Summary

### Backend (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `DJANGO_SECRET_KEY` | Yes | Random secret key for Django |
| `DEBUG` | Yes | Must be `False` in production |
| `ORS_API_KEY` | Yes | OpenRouteService API key |
| `CORS_ALLOWED_ORIGINS` | Yes | Frontend URL (comma-separated if multiple) |
| `PYTHON_VERSION` | No | Python version (default: 3.11) |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend URL (e.g., `https://eld-trip-planner-api.onrender.com`) |
