# Deployment Guide – Vercel (Frontend) + Railway (Backend)

The app has two parts: **Elite-skills** (React frontend) and **server** (Express API). Deploy the frontend to Vercel and the backend to Railway.

---

## 1. Deploy Backend (Railway)

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. **New Project** → **Deploy from GitHub repo** → select your repo.
3. Set **Root Directory** to `server`.
4. Add environment variables (Settings → Variables):
   - `MONGODB_URI` – MongoDB Atlas connection string
   - `JWT_SECRET` – long random string
   - `CLIENT_ORIGIN` – your Vercel URL (e.g. `https://your-app.vercel.app`)
5. Railway will auto-detect Node.js and run `npm run build` + `npm start`.
6. Copy the public URL (e.g. `https://your-api.up.railway.app`).

---

## 2. Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New** → **Project** → import your repo.
3. Configure (or use the root `vercel.json` which sets this automatically):
   - **Root Directory**: leave empty (use repo root)
   - **Build Command**: `npm run build -w Elite-skills`
   - **Output Directory**: `Elite-skills/dist`
4. Add environment variables:
   - `VITE_API_BASE` – your Railway API URL (e.g. `https://your-api.up.railway.app`)
   - `GEMINI_API_KEY` – for AI features (optional)
5. Deploy.

---

## 3. Update CORS

In Railway, ensure `CLIENT_ORIGIN` includes your Vercel URL. For multiple origins, use comma-separated values:
```
CLIENT_ORIGIN=https://your-app.vercel.app,https://your-app-preview.vercel.app
```

---

## Quick Reference

| Part   | Platform | Root Dir   |
|--------|----------|------------|
| Frontend | Vercel  | `Elite-skills` |
| Backend  | Railway | `server`     |
