# InternSetu — Academia-Industry Collaboration Platform

A full-stack MERN application connecting students, industry partners, and educators.

## Tech Stack
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT, Bcryptjs
- **Frontend:** React (Vite), Tailwind CSS, Axios, React Router

## Project Structure

```
internsetu/
├── backend/
│   ├── config/db.js
│   ├── models/            # User, StudentProfile, StudentProgress, Opportunity, Course
│   ├── controllers/       # auth, student, ai
│   ├── routes/            # auth, student, ai
│   ├── middleware/auth.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── services/api.js
    │   ├── context/AuthContext.jsx
    │   ├── components/    # Navbar, ProtectedRoute
    │   ├── pages/          # AuthPage, StudentDashboard, GenericDashboard
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── .env.example
```

## Setup Instructions

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and set MONGO_URI, JWT_SECRET, CLIENT_URL, and (optionally) GEMINI_API_KEY / GROK_API_KEY
npm run dev
```

The API will run on `http://localhost:5000` by default. Health check: `GET /api/health`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL to your backend's /api URL
npm run dev
```

The app will run on `http://localhost:5173` by default.

## Deployment Notes

- **Backend:** Deploy to Render / Railway / an EC2 instance. Point `MONGO_URI` at a MongoDB Atlas cluster. Set `CLIENT_URL` to your deployed frontend's exact origin (CORS depends on this matching precisely).
- **Frontend:** Deploy to Vercel / Netlify. Set `VITE_API_BASE_URL` to your deployed backend's `/api` URL (e.g. `https://your-api.onrender.com/api`).
- Never commit `.env` files — only the provided `.env.example` files are included in this archive.

## Core Features (Chunk 1–4 scope)

- JWT-based authentication with 4 roles: Student, Industry, Educator, Admin
- Student profile management with auto-calculated profile completeness
- Student dashboard with stats, recommended opportunities (skill-matched), and recent activity
- Opportunity listing, filtering, and application flow
- Course listing scaffold
- AI controller with placeholder Gemini + Grok integrations (resume analysis, skill-gap suggestions, chat) with automatic provider fallback
- Protected routing on the frontend, role-aware dashboard routing
- Professional Tailwind design system: `bg-slate-50` backgrounds, `indigo-900` primary accents, no dark mode / no "AI-glow" styling

## Next Steps (not yet implemented — scaffolded for extension)

- Industry: opportunity posting & applicant review UI
- Educator: mentee progress tracking UI
- Admin: user & content moderation panel
- AI Assistant chat widget wired to `aiAPI.chat`
- Course content player (modules/lessons UI)
