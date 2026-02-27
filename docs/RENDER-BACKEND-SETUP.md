# Backend Setup on Render – Step-by-Step Guide

Deploy the Elite Skills API (Express + MongoDB) to Render. Use this guide with a **new account**.

---

## Prerequisites

- GitHub account
- MongoDB Atlas cluster (free tier at [mongodb.com/atlas](https://www.mongodb.com/atlas))
- Your Vercel frontend URL (e.g. `https://eliteskills.vercel.app`)

---

## 1. Create a Render Account

1. Go to [render.com](https://render.com)
2. Click **Get Started**
3. Sign up with **GitHub** (recommended)
4. Authorize Render to access your GitHub repos

---

## 2. Create a New Web Service

1. In the Render dashboard, click **New +** → **Web Service**
2. Connect your repo:
   - If not connected: **Connect account** → choose **GitHub** → select **Elite-Skills/Elite-Skills**
   - Select the repository
3. Click **Connect**

---

## 3. Configure the Service

| Setting | Value |
|--------|-------|
| **Name** | `elite-skills-api` (or any name) |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

---

## 4. Add Environment Variables

Click **Advanced** → **Add Environment Variable**. Add:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random string (e.g. 32+ chars) |
| `CLIENT_ORIGIN` | Your Vercel URL, e.g. `https://eliteskills.vercel.app` |

**MongoDB Atlas:**
- Atlas → **Database** → **Connect** → **Connect your application**
- Copy the connection string
- Replace `<password>` with your DB user password
- Replace `<dbname>` with `eliteskills` (or your DB name)

**JWT_SECRET:**
- Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Or use any long random string

**CLIENT_ORIGIN:**
- Your frontend URL (no trailing slash)
- For multiple origins: `https://eliteskills.vercel.app,https://eliteskills-git-main-xxx.vercel.app`

---

## 5. Deploy

1. Click **Create Web Service**
2. Render will build and deploy (first deploy ~2–5 min)
3. When ready, copy the service URL (e.g. `https://elite-skills-api.onrender.com`)

---

## 6. Update Your Frontend

In **Vercel** → your project → **Settings** → **Environment Variables**:

- Set `VITE_API_BASE` = your Render URL (e.g. `https://elite-skills-api.onrender.com`)
- Redeploy the frontend

---

## 7. CORS (if needed)

If you add more frontend URLs later, update `CLIENT_ORIGIN` in Render:

- **Dashboard** → your service → **Environment** → edit `CLIENT_ORIGIN`
- Use comma-separated: `https://eliteskills.vercel.app,https://other.vercel.app`
- Save → Render will redeploy

---

## Free Tier Notes

- Services spin down after ~15 min of no traffic
- First request after spin-down can take 30–60 seconds
- 750 free hours/month for web services

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Check **Root Directory** is `server` |
| 503 on first request | Normal after spin-down; wait for cold start |
| CORS errors | Ensure `CLIENT_ORIGIN` matches your frontend URL exactly |
| MongoDB connection fails | Check Atlas IP whitelist (add `0.0.0.0/0` for Render) |
