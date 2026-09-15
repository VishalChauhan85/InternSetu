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

## Security Model & Admin Bootstrap

- **Public registration** (`POST /api/auth/register`) can only ever create a `student` account. The backend hardcodes `role: 'student'` and ignores any `role`/`companyName`/`institutionName` sent by the client — there is no role selector in the UI either.
- **Educator and Industry accounts** are provisioned only by an authenticated Admin, via the Admin Dashboard (`POST /api/auth/admin/create-user`, protected by `protect` + `authorize('admin')`).
- **The first Admin account** is created once per environment via `POST /api/auth/seed-admin`. This route is protected by a shared secret (not JWT, since no admin exists yet) — set `ADMIN_SEED_SECRET` in your Render environment, then call it once:

  ```bash
  curl -X POST https://your-backend.onrender.com/api/auth/seed-admin \
    -H "x-seed-secret: <your ADMIN_SEED_SECRET value>"
  ```

  This creates `admin@internsetu.com` / `SuperSecretPassword123!` if no admin exists yet. **Log in immediately and treat that password as compromised on day one** — there's no forced-password-change flow in this scaffold, so rotate it manually via your database or add a "change password" endpoint before real use.

- Every other route group (`/api/student`, `/api/industry`, `/api/educator`) is scoped by both `protect` (valid JWT) and `authorize(<role>)` (correct role) middleware, matching the resource to the account type.

## Deployment Notes

- **Backend (Render):** Deploy from `/backend`. Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (comma-separated list — include your Vercel production URL), and `ADMIN_SEED_SECRET`. CORS also auto-allows any `*.vercel.app` origin so PR preview deployments work without extra config.
- **Frontend (Vercel):** Deploy from `/frontend`. Set `VITE_API_BASE_URL` to your Render backend's `/api` URL (e.g. `https://internsetu-backend.onrender.com/api`). The Axios layer in `services/api.js` will still function correctly even if this is accidentally set without the `/api` suffix — it self-corrects via a request interceptor, but it's best to set it correctly.
- Never commit `.env` files — only the provided `.env.example` files are included in this archive.

## Core Features

- JWT-based authentication with 4 roles: Student, Industry, Educator, Admin
- Student profile management with auto-calculated profile completeness
- Student dashboard with stats, recommended opportunities (skill-matched), and recent activity
- Opportunity listing, filtering, and application flow
- **Industry dashboard**: post opportunities, view own postings, review applicants, update applicant status (shortlisted/rejected/selected)
- **Educator dashboard**: view student cohort with progress stats, create/publish courses
- **AI Mock Interview**: chat-based interview practice with an AI recruiter persona, plus a scored evaluation (communication, role knowledge, confidence) with strengths/improvement feedback
- AI controller with placeholder Gemini + Grok integrations (resume analysis, skill-gap suggestions, chat, interview evaluation) with automatic provider fallback
- Protected routing on the frontend, role-aware dashboard routing
- Professional Tailwind design system: `bg-slate-50` backgrounds, `indigo-900` primary accents, no dark mode / no "AI-glow" styling

## API Route Map

```
/api/auth        register (student-only), login, me, logout,
                  seed-admin (secret-protected), admin/create-user (admin-only)
/api/student      profile, dashboard, opportunities, progress, courses  (role: student)
/api/industry     opportunities (CRUD), applicants, applicant status    (role: industry)
/api/educator     students, courses (CRUD)                              (role: educator)
/api/ai           resume-analysis, skill-gap, chat, mock-interview/evaluate
```

## Notes on the Educator "student cohort" query

`educatorController.listStudents` currently scopes students by matching
`StudentProfile.institution` against the logged-in educator's
`User.institutionName`. This is a simple starting point — if you want stricter
cohort assignment (e.g. an explicit `educator` reference on `StudentProfile`,
or a many-to-many `Cohort` model), swap the query in that controller; the
frontend `EducatorDashboard.jsx` doesn't need to change since it just
consumes `GET /api/educator/students`.

## Next Steps (not yet implemented — scaffolded for extension)

- Admin: user & content moderation panel
- Course content player (modules/lessons UI) for students
- Persisting mock interview transcripts/scores to a history collection
- Real-time notifications for status changes (shortlisted/selected)
