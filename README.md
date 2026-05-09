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

## Backend Architecture

```text
server/
├── index.ts                       # Express app and error handler
├── middleware/auth.ts             # JWT helpers and optional anonymous student mode
├── routes/
│   ├── auth.ts                    # Persistent register/login
│   ├── learning.ts                # Resource, quiz, grading, and buddy workflows
│   └── analytics.ts               # Student and parent progress data
└── services/
    ├── analyticsService.ts        # Dynamic dashboard/report-card aggregation
    ├── gradingService.ts          # MCQ + semantic short-answer grading
    ├── quizService.ts             # AI/fallback quiz generation from resources
    ├── recommendationEngine.ts    # Improvement plans and readings
    ├── resourceService.ts         # Public resource search, summaries, ranking
    ├── store.ts                   # JSON persistence layer
    └── textUtils.ts               # Keywords, scoring helpers, stable IDs
```

## Database Model

The Prisma schema includes production-ready tables for:

- `User`
- `TopicStudied`
- `SubjectPerformance`
- `GeneratedQuiz`
- `QuizAttempt`
- `AiEvaluation`
- `ResourceHistory`
- `ImprovementPlan`
- `FavoriteResource`

For local dependency-light persistence, the current API writes to `server/data/store.json` via `server/services/store.ts`. The JSON store mirrors the schema concepts and can be swapped for Prisma repositories later.

## API Routes

- `GET /api/health` — API health check.
- `POST /api/auth/register` — create a persistent student/parent account.
- `POST /api/auth/login` — authenticate a saved account.
- `POST /api/learning/resources` — build a dynamic search query and return ranked resources.
- `POST /api/learning/quiz` — gather resources and generate 5 MCQs + 5 short-answer questions.
- `POST /api/learning/grade` — grade answers, save the attempt, generate report and update analytics.
- `POST /api/learning/buddy` — contextual Study Buddy response.
- `GET /api/analytics` — saved student dashboard snapshot.
- `GET /api/analytics/parent-summary` — parent-facing summary and next steps.

## Dynamic Workflow

1. Student submits grade, board, subject, topic, and difficulty.
2. `resourceService` creates a search query such as `CBSE Grade 7 Science cell structure beginner explanation`.
3. The service fetches public summaries and builds targeted educational links.
4. The service extracts key concepts, summarizes for grade level, and ranks resources.
5. `quizService` generates 10 questions from the returned resource text and concepts.
6. `gradingService` grades MCQs exactly and short answers semantically.
7. `recommendationEngine` creates next readings and checklist improvements from weak concepts.
8. `store` persists attempts, resource history, topic mastery, and plans.
9. `analyticsService` rebuilds dashboard charts from saved history.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create environment file:

   ```bash
   cp .env.example .env
   ```

3. Start the full-stack development app:

   ```bash
   npm run dev
   ```

4. Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Environment Variables

```bash
VITE_API_URL=http://localhost:4000/api
PORT=4000
DATABASE_URL="file:./dev.db"
JSON_STORE_PATH="server/data/store.json"
JWT_SECRET="replace-with-a-long-random-secret"
OPENAI_API_KEY="optional-enable-real-ai-generation"
OPENAI_MODEL="gpt-4o-mini"
```

`OPENAI_API_KEY` is optional. When present, StudySpark uses AI for resource summarization, quiz generation, and short-answer grading. Without it, StudySpark still behaves dynamically by using public resource text, extracted concepts, and semantic scoring.

## Deployment

### Frontend

Deploy the Vite app to Vercel, Netlify, Cloudflare Pages, or any static host:

```bash
npm run build
```

Set `VITE_API_URL` to the deployed API URL.

### Backend

Deploy the Express API to Render, Fly.io, Railway, Heroku, or a container platform. For production, replace the JSON store with Prisma repositories backed by PostgreSQL and set `DATABASE_URL` accordingly.

Recommended production variables:

```bash
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/studyspark
JWT_SECRET=long-random-secret
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```
