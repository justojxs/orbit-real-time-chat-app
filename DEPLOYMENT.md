# 🚀 Orbit Chat — Deployment Guide

This guide walks you through deploying the Orbit Chat application with:
- **Frontend (React/Vite)** → Vercel
- **Backend (Express/Socket.io)** → Render

---

## Prerequisites

You need accounts on these platforms (all free):
1. **GitHub** — [github.com](https://github.com) (you already have this)
2. **Vercel** — [vercel.com](https://vercel.com) (sign up with your GitHub account)
3. **Render** — [render.com](https://render.com) (sign up with your GitHub account)
4. **MongoDB Atlas** — [mongodb.com](https://mongodb.com) (you already have this — your `MONGO_URI`)

---

## PHASE 1: Push Your Code to GitHub

### Step 1.1 — Make sure `.env` files are NOT committed
Your `.gitignore` already blocks `.env` files. Verify by running:
```bash
git status
```
You should NOT see `server/.env` or `client/.env` in the list. If you do, run:
```bash
git rm --cached server/.env client/.env
```

### Step 1.2 — Commit and push everything
```bash
git add .
git commit -m "Prepare for dual deployment: Vercel (frontend) + Render (backend)"
git push origin main
```

---

## PHASE 2: Deploy the Backend on Render (Do This FIRST)

You deploy the backend first because you need its URL to configure the frontend.

### Step 2.1 — Create a new Web Service
1. Go to [render.com/dashboard](https://dashboard.render.com)
2. Click **"New +"** button (top right) → Select **"Web Service"**
3. Connect your GitHub account if prompted
4. Find and select your **`real-time-chat-app`** repository
5. Click **"Connect"**

### Step 2.2 — Configure the service
Fill in these fields EXACTLY:

| Field | Value |
|---|---|
| **Name** | `orbit-chat-backend` (or whatever you want) |
| **Region** | Choose the closest to you (e.g., Singapore for India) |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install --include=dev && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### Step 2.3 — Add Environment Variables
Scroll down to **"Environment Variables"** section and add these one by one:

| Key | Value |
|---|---|
| `MONGO_URI` | `mongodb+srv://ojas:ojas1625@ojas.8gcqsix.mongodb.net/?appName=Ojas` |
| `JWT_SECRET` | `thisismysecret` |
| `CLIENT_URL` | `https://your-vercel-url.vercel.app` ← **Leave this blank for now, we'll update it in Phase 4** |
| `NODE_ENV` | `production` |

> ⚠️ **Important**: Do NOT add `PORT`. Render automatically sets `PORT` for you.
> ⚠️ **Important**: Do NOT add `REDIS_URL`. The server works fine without it.

### Step 2.4 — Deploy
1. Click **"Create Web Service"**
2. Render will now:
   - Clone your repo
   - Run `npm install --include=dev && npm run build` in the `server/` folder
   - Run `npm start` (which runs `node dist/index.js`)
3. **Wait 3-5 minutes** for the build to finish
4. You'll see green text saying **"Your service is live 🎉"**
5. **Copy your Render URL** — it will look like:
   ```
   https://orbit-chat-backend.onrender.com
   ```
   You can find it at the top of the page under the service name.

### Step 2.5 — Test the backend
Open your Render URL in a browser. You should see:
```
API is running...
```
If you see this, your backend is deployed successfully! ✅

> **Note**: On Render's free tier, the server goes to sleep after 15 minutes of inactivity.
> The first request after sleeping takes ~30-60 seconds to wake up. This is normal.

---

## PHASE 3: Deploy the Frontend on Vercel

### Step 3.1 — Set up the project
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Find and **Import** your **`real-time-chat-app`** repository

### Step 3.2 — Configure the project
Fill in these fields:

| Field | Value |
|---|---|
| **Project Name** | `orbit-chat` (or whatever you want) |
| **Framework Preset** | `Vite` (Vercel usually auto-detects this) |
| **Root Directory** | Click **"Edit"** → type `client` → click **"Continue"** |
| **Build Command** | `npm run build` (should be auto-filled) |
| **Output Directory** | `dist` (should be auto-filled) |

### Step 3.3 — Add Environment Variables
Expand **"Environment Variables"** and add:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://orbit-chat-backend.onrender.com` ← **Paste your Render URL from Step 2.4** |

> ⚠️ **Important**: Make sure there is NO trailing slash `/` at the end of the URL.
> ✅ Correct: `https://orbit-chat-backend.onrender.com`
> ❌ Wrong: `https://orbit-chat-backend.onrender.com/`

### Step 3.4 — Deploy
1. Click **"Deploy"**
2. Vercel will:
   - Clone your repo
   - Go into the `client/` folder
   - Run `npm run build`
   - Deploy the static files to its CDN
3. **Wait 1-2 minutes** for the build
4. You'll see **"Congratulations!"** with a preview of your site
5. **Copy your Vercel URL** — it will look like:
   ```
   https://orbit-chat.vercel.app
   ```

---

## PHASE 4: Connect Them Together (CRITICAL!)

Right now, your backend doesn't know the frontend's URL, so CORS will block requests.

### Step 4.1 — Update Render's `CLIENT_URL`
1. Go back to [render.com/dashboard](https://dashboard.render.com)
2. Click on your **`orbit-chat-backend`** service
3. Go to **"Environment"** tab (left sidebar)
4. Find `CLIENT_URL` (which you left blank earlier)
5. Set its value to your Vercel URL:
   ```
   https://orbit-chat.vercel.app
   ```
6. Click **"Save Changes"**
7. Render will automatically **redeploy** with the updated variable (~2 minutes)

### Step 4.2 — Verify the connection
1. Open your Vercel URL in a browser: `https://orbit-chat.vercel.app`
2. You should see the Orbit landing page
3. Try logging in or signing up
4. If it works, congratulations! 🎉

---

## Troubleshooting

### "Network Error" or "CORS error" in browser console
- **Cause**: `CLIENT_URL` on Render doesn't match your Vercel URL
- **Fix**: Go to Render → Environment → make sure `CLIENT_URL` is EXACTLY your Vercel URL (no trailing slash)

### Login/Signup doesn't work but page loads
- **Cause**: `VITE_API_URL` on Vercel is wrong
- **Fix**: Go to Vercel → Settings → Environment Variables → verify `VITE_API_URL`
- After changing env vars on Vercel, you must **redeploy**: Go to Deployments → click "..." on the latest → "Redeploy"

### Backend shows "Build failed"
- **Cause**: Usually a TypeScript compilation error
- **Fix**: Check the Render build logs. Look for the error message. It should compile cleanly — we verified this locally.

### Socket.io / real-time messages not working
- **Cause**: The Socket.io connection URL might be wrong
- **Fix**: Make sure `VITE_API_URL` is set correctly on Vercel. The Zustand store uses this for the socket connection.

### Page loads but shows blank/white screen
- **Cause**: The Root Directory on Vercel might not be set to `client`
- **Fix**: Vercel → Settings → General → Root Directory should be `client`

### "Application Error" on Render
- **Cause**: Server crashed on startup
- **Fix**: Check Render logs. Common causes:
  - Missing environment variable (MONGO_URI, JWT_SECRET)
  - MongoDB Atlas needs to whitelist Render's IP → Go to Atlas → Network Access → Add `0.0.0.0/0` (allow from anywhere)

---

## MongoDB Atlas — Allow Render to Connect

Your MongoDB is on Atlas, which blocks connections by default. You MUST whitelist Render's IP.

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Select your project/cluster
3. Click **"Network Access"** (left sidebar)
4. Click **"Add IP Address"**
5. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
6. Click **"Confirm"**

> This is safe because your database is still protected by the username/password in your `MONGO_URI`.

---

## Summary — What Lives Where

```
┌─────────────────────────────────────────────────┐
│                    GITHUB                       │
│              (Your Source Code)                  │
│   real-time-chat-app/                           │
│   ├── client/    ──→──→──→──  VERCEL (Frontend) │
│   └── server/    ──→──→──→──  RENDER (Backend)  │
└─────────────────────────────────────────────────┘

User opens browser
        │
        ▼
   VERCEL (CDN)              RENDER (Server)
   orbit-chat.vercel.app     orbit-chat-backend.onrender.com
   ┌──────────────┐          ┌──────────────┐
   │  React App   │──REST──→ │  Express API │──→ MongoDB Atlas
   │  (Static)    │          │  + Socket.io │
   │              │←─WS────→ │  (Persistent)│
   └──────────────┘          └──────────────┘
```

---

## Updating Your App After Deployment

Whenever you make changes:
1. Commit and push to GitHub
2. **Both Vercel and Render auto-deploy** when they detect a new push to `main`
3. No manual action needed!
