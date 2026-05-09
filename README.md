# StudySpark — Dynamic AI Learning Companion

StudySpark is a full-stack AI-powered learning companion for school students. The app dynamically responds to the student's grade/class, education board, subject, and exact topic by searching public educational sources, summarizing resources, generating a fresh quiz, grading answers semantically, and updating persistent progress analytics.

## What Changed From a Static Demo

- Resource cards are generated from the entered topic using live public sources and dynamic search links.
- Quizzes are generated from gathered resource summaries and concepts rather than fixed sample questions.
- Short answers are evaluated by semantic concept matching, with optional OpenAI grading when an API key is configured.
- Quiz attempts, resources, topic mastery, improvement plans, and analytics are persisted in a local JSON store and modeled in the Prisma schema.
- Dashboard charts are generated from saved attempts instead of static dashboard data.

## Features

- Student onboarding for grade/class, board, subject, difficulty, and topic.
- Dynamic resource discovery from Wikipedia, DuckDuckGo public summaries, Wikimedia, YouTube Education search, Khan Academy search, and board-specific open resource searches.
- Resource ranking by topic relevance, board/grade fit, child-friendliness, and source credibility.
- AI-ready summarization and quiz generation through `OPENAI_API_KEY`, with deterministic dynamic fallbacks based on fetched resources.
- 5 MCQs and 5 short-answer questions for each topic.
- MCQ auto-grading and short-answer semantic grading with partial credit.
- Personalized report cards including total marks, percentage, letter grade, concept mastery, strengths, weaknesses, recommended readings, and checklist improvement plans.
- Persistent analytics for subject averages, topic mastery, daily activity, weekly improvement, recent quizzes, accuracy, streaks, badges, weak topics, strongest subjects, and weakest subjects.
- Study Buddy chatbot endpoint that answers in the context of the current topic.
- Pastel responsive UI with rounded cards, loading states, voice reading, favorites, dark mode, printable reports, and accessible form controls.

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Framer Motion, Recharts, Lucide icons.
- Backend: Express, TypeScript, Zod, JWT auth, OpenAI-compatible AI service.
- Database schema: Prisma with SQLite by default; PostgreSQL-ready for production.

## Backend Architecture

```text
server/
├── index.ts
├── middleware/auth.ts
├── routes/
│   ├── auth.ts
│   ├── learning.ts
│   └── analytics.ts
└── services/
    ├── analyticsService.ts
    ├── gradingService.ts
    ├── quizService.ts
    ├── recommendationEngine.ts
    ├── resourceService.ts
    ├── store.ts
    └── textUtils.ts
```

## Database Model

The Prisma schema includes:

- User
- TopicStudied
- SubjectPerformance
- GeneratedQuiz
- QuizAttempt
- AiEvaluation
- ResourceHistory
- ImprovementPlan
- FavoriteResource

The app currently persists data using:

```text
server/data/store.json
```

through `server/services/store.ts`.

## API Routes

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/learning/resources`
- `POST /api/learning/quiz`
- `POST /api/learning/grade`
- `POST /api/learning/buddy`
- `GET /api/analytics`
- `GET /api/analytics/parent-summary`

## Dynamic Workflow

1. Student submits grade, board, subject, topic, and difficulty.
2. `resourceService` creates a dynamic educational search query.
3. Public educational resources are fetched and ranked.
4. Key concepts are extracted and summarized.
5. `quizService` generates 5 MCQs and 5 short-answer questions.
6. `gradingService` evaluates answers semantically.
7. `recommendationEngine` creates personalized improvement plans.
8. Attempts and mastery are persisted.
9. `analyticsService` rebuilds dashboards from saved history.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Generate Prisma client and migrations if needed:

```bash
npm run db:generate
npm run db:migrate
```

4. Start the app:

```bash
npm run dev
```

5. Open:

```text
http://localhost:5173
```

## Environment Variables

```bash
VITE_API_URL=http://localhost:4000/api
PORT=4000
DATABASE_URL="file:./dev.db"
JSON_STORE_PATH="server/data/store.json"
JWT_SECRET="replace-with-a-long-random-secret"
OPENAI_API_KEY="optional-enable-real-ai-generation"
OPENAI_MODEL="gpt-4o-mini"
RESOURCE_SEARCH_PROVIDER="curated"
```

`OPENAI_API_KEY` is optional. Without it, the app still dynamically generates quizzes and grading using fetched educational resources and semantic scoring.

## Deployment

### Frontend

```bash
npm run build
```

Deploy to:
- Vercel
- Netlify
- Cloudflare Pages

Set:

```bash
VITE_API_URL=<your-backend-url>
```

### Backend

Deploy to:
- Render
- Railway
- Fly.io
- Heroku

Recommended production variables:

```bash
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/studyspark
JWT_SECRET=long-random-secret
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

## Notes on Safety and Personalization

The AI system is designed to:
- use child-friendly explanations
- adapt difficulty by grade
- provide safe encouragement
- evaluate concepts instead of exact wording
- keep services modular for future AI provider upgrades