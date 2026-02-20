# IB Bible + ATS Unified Project

A unified project combining the **IB Bible** (Elite-skills) landing page with the **ATS Resume Checker** app. Visitors see the landing page; logged-in users are redirected to the ATS dashboard.

## Overview

- **Connected landing page to ATS** – Single app flow: guests see IB Bible at `/`, logged-in users go to ATS dashboard at `/checker`
- **Restyled ATS** – Dark theme with gold accents to match the landing page branding
- **Auth integration** – JWT login/register, protected routes for checker, referrals, connections, chat, etc.

## Project Structure

```
├── Elite-skills/     # Client: Landing page + ATS app (React + Vite)
├── server/           # Backend: ATS API (Express + MongoDB)
├── package.json      # Root workspace config
└── README.md
```

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Environment setup

**Server** (`server/.env`):

```env
PORT=5000

# Local MongoDB (for testing)
MONGODB_URI=mongodb://localhost:27017/eliteskills

# Or use MongoDB Atlas for production
# MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbName>?retryWrites=true&w=majority

JWT_SECRET=your_long_random_secret
CLIENT_ORIGIN=http://localhost:3000
```

**Local MongoDB options:**
- **Docker**: `docker compose up -d` (uses the included `docker-compose.yml`)
- **MongoDB Community**: Install from [mongodb.com](https://www.mongodb.com/try/download/community)

**Client** (`Elite-skills/.env.local`):

```env
VITE_API_BASE=http://localhost:5000
GEMINI_API_KEY=your_gemini_api_key   # For IB Bible AI features
```

### 3. Run development

```bash
# Run both client and server
npm run dev

# Or run separately:
npm run dev:client   # Client on http://localhost:3000
npm run dev:server   # Server on http://localhost:5000
```

## User Flow

- **Unauthenticated**: Landing page (IB Bible) at `/`
- **Login/Register**: `/login`, `/register`
- **Logged in**: Redirected to `/checker` (ATS dashboard)
- **Get Access** button → `/login` when not logged in, `/checker` when logged in

## Features

- **Landing page**: IB Bible marketing content, AI simulation, strategy generator
- **ATS Checker**: Resume PDF upload, job description matching, ATS score, keyword analysis
- **Auth**: JWT-based login/register with MongoDB
- **Protected routes**: Referrals, requests, connections, chat, notifications, profile

## Tech Stack

- **Client**: React 19, Vite 6, React Router, Tailwind (landing), Socket.io (realtime)
- **Server**: Express, MongoDB (Mongoose), JWT, Socket.io
- **AI**: Gemini (IB Bible), PDF parsing (ATS)
