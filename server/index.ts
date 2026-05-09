import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { ZodError } from 'zod';
import { analyticsRouter } from './routes/analytics';
import { authRouter } from './routes/auth';
import { learningRouter } from './routes/learning';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'StudySpark API' }));
app.use('/api/auth', authRouter);
app.use('/api/learning', learningRouter);
app.use('/api/analytics', analyticsRouter);
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) return res.status(400).json({ error: 'Invalid request', details: error.flatten() });
  console.error(error);
  res.status(500).json({ error: 'Unable to complete the learning workflow right now' });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`StudySpark API listening on ${port}`));
