import { Router } from 'express';
import { analytics } from '../../src/data/sampleData';

export const analyticsRouter = Router();
analyticsRouter.get('/', (_req, res) => res.json(analytics));
analyticsRouter.get('/parent-summary', (_req, res) => res.json({
  learner: 'Mia',
  summary: 'Mia is on a 9-day improvement streak and is strongest in English and Science. Fractions and map skills need short daily practice.',
  wins: ['Completed 3 quizzes this week', 'Improved Science mastery by 6%', 'Earned Diagram Hero badge'],
  nextSteps: ['Read one science note together', 'Practice 10 minutes of fractions', 'Print the weekly report card']
}));
