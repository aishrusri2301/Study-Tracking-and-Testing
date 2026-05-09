# StudySpark — AI Learning Companion

StudySpark is a production-style full-stack web app for school students. It combines a pastel React dashboard, AI-assisted resource curation, adaptive quiz generation, semantic grading, improvement checklists, student analytics, parent summaries, and a friendly study buddy chatbot.

## Features

- Student onboarding for grade/class, board, subject, and topic.
- Resource recommendation cards for explanations, notes, videos, diagrams, practice, and reading links.
- AI-ready quiz generation: 5 MCQs and 5 short-answer questions.
- Instant MCQ evaluation and concept-based short-answer grading.
- Results page with score, grade, mastery, strengths, weak areas, readings, and an interactive checklist plan.
- Analytics dashboard with report card, daily progress, weekly trends, topic mastery heatmap, accuracy, response time, recent quizzes, streaks, badges, and recommendations.
- Parent dashboard with printable progress summary.
- Explain Like I’m 10 mode, voice reading, favorite resources, dark mode, rewards, badges, and daily challenge UI.
- Study Buddy chatbot for hints, simplified explanations, mistakes, and encouragement.

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Framer Motion, Recharts, Lucide icons.
- Backend: Express, TypeScript, Zod, JWT auth, OpenAI-compatible AI service with deterministic fallback data.
- Database schema: Prisma with SQLite by default; can be switched to PostgreSQL for production.

## Folder Structure

```text
.
├── prisma/schema.prisma          # Database schema
├── server/                       # Express API
│   ├── index.ts
│   ├── middleware/auth.ts
│   ├── routes/{auth,learning,analytics}.ts
│   └── services/aiService.ts
├── shared/types.ts               # Shared API/domain types
├── src/
│   ├── data/sampleData.ts        # Realistic demo data and fallback content
│   ├── main.tsx                  # React app and screens
│   └── styles/app.css            # Pastel responsive UI
├── .env.example
└── package.json
```

## API Routes

- `GET /api/health` — API health check.
- `POST /api/auth/login` — demo student/parent login.
- `POST /api/auth/register` — demo registration.
- `POST /api/learning/resources` — rank resources by profile.
- `POST /api/learning/quiz` — gather resources and generate 10 questions.
- `POST /api/learning/grade` — evaluate MCQs and semantic short answers.
- `POST /api/learning/buddy` — study buddy response.
- `GET /api/analytics` — student analytics snapshot.
- `GET /api/analytics/parent-summary` — parent summary.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create environment file:

   ```bash
   cp .env.example .env
   ```

3. Generate Prisma client and run migrations when database persistence is needed:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. Start the full stack app:

   ```bash
   npm run dev
   ```

5. Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Environment Variables

See `.env.example` for all values. `OPENAI_API_KEY` is optional; without it, the app uses high-quality deterministic sample generation so the experience remains fully functional locally.

## Deployment

### Frontend

Deploy the Vite app to Vercel, Netlify, Cloudflare Pages, or any static host:

```bash
npm run build
```

Set `VITE_API_URL` to your deployed API URL.

### Backend

Deploy the Express API to Render, Fly.io, Railway, Heroku, or a container platform. Use PostgreSQL in production by changing the Prisma datasource provider and `DATABASE_URL`.

Recommended production environment variables:

```bash
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/studyspark
JWT_SECRET=long-random-secret
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

## Notes on Safety and Personalization

The AI service is designed to request child-friendly language, syllabus relevance, safe encouragement, and grade-appropriate difficulty. The fallback grader compares key concepts instead of exact wording, and the architecture keeps AI workflows isolated in `server/services/aiService.ts` for future moderation, provider swapping, and audit logging.
