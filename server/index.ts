import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { analyticsRouter } from './routes/analytics';
import { authRouter } from './routes/auth';
import { learningRouter } from './routes/learning';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'StudySpark API' }));
app.use('/api/auth', authRouter);
app.use('/api/learning', learningRouter);
app.use('/api/analytics', analyticsRouter);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`StudySpark API listening on ${port}`));
