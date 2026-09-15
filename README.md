# InternSetu — Academia-Industry Collaboration Platform

Full-stack MERN app: Node.js/Express/MongoDB backend, React (Vite) + Tailwind frontend.

## Prerequisites

- Node.js 18+ and npm
- A MongoDB database — either:
  - **MongoDB Atlas** (free tier, cloud-hosted, easiest for beginners): https://www.mongodb.com/cloud/atlas/register
  - or a local MongoDB install: https://www.mongodb.com/try/download/community

## 1. Backend setup

```bash
cd backend
npm install
```

Copy the example env file and fill in real values:

```bash
cp .env.example .env
```

Edit `.env`:

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/internsetu
JWT_SECRET=replace_this_with_a_long_random_secret_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
GROK_API_KEY=your_grok_api_key_here
```

- `MONGO_URI` — from Atlas: Database > Connect > Drivers, copy the connection string, swap in your DB user's username/password, and add `/internsetu` before the `?` as the database name.
- `JWT_SECRET` — any long random string. Quick way to generate one:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- `GEMINI_API_KEY` — get one free at https://aistudio.google.com/apikey (needed for the AI features: resume analysis, skill-gap suggestions, chat, mock-interview feedback).
- `GROK_API_KEY` — optional fallback provider, from https://console.x.ai/. The app works fine with only Gemini configured.

Run the backend:

```bash
npm run dev
```

You should see `✅ MongoDB Connected` and `🚀 InternSetu API server running on port 5000`.
Sanity check: open http://localhost:5000/api/health — it should return a JSON success message.

## 2. Frontend setup

Open a **new terminal** (leave the backend running):

```bash
cd frontend
npm install
cp .env.example .env
```

`.env` should contain:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

Run the frontend:

```bash
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## 3. Try it out

1. Go to `/auth`, register a **student** account — this creates a `User` + an empty `StudentProfile`.
2. Register a second account as **industry** (needs a company name) in a different browser/incognito tab, and post an opportunity.
3. Register a third as **educator** (needs an institution name) and create a course.
4. Log back in as the student to browse opportunities/courses and try the AI Mock Interview at `/mock-interview`.

## Project structure

```
backend/
  config/db.js              MongoDB connection
  models/                   User, StudentProfile, StudentProgress, Opportunity, Course
  middleware/auth.js        JWT verification + role-based access control
  controllers/              auth, student, industry, educator, ai
  routes/                   one router per controller, mounted in server.js
  server.js                 Express app entrypoint

frontend/
  src/services/api.js       Axios instance + grouped API calls (authAPI, studentAPI, industryAPI, educatorAPI, aiAPI)
  src/context/AuthContext.jsx  Login/register/logout state, persisted to localStorage
  src/components/           ProtectedRoute, Navbar
  src/pages/                AuthPage, StudentDashboard, IndustryDashboard, EducatorDashboard,
                             GenericDashboard (admin fallback), MockInterview
  src/App.jsx                Route table
```

## Notes / known limitations

- `aiController.js` calls the Gemini and Grok HTTP APIs directly with `fetch` — double-check the endpoint/payload shape against current provider docs before relying on it in production; APIs do change.
- There's no seed script — the database starts empty. Post at least one opportunity and one course (as industry/educator) before testing the student dashboard's "recommended opportunities" and course list.
- `GenericDashboard` is what `admin` accounts land on — there's no dedicated admin UI or `adminController` yet.
- CORS is locked to `CLIENT_URL` in `.env` — update it if you deploy the frontend somewhere other than `localhost:5173`.
