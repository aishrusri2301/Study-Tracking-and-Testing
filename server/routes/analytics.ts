import { Router } from 'express';
import { getUserId } from '../middleware/auth';
import { buildAnalytics } from '../services/analyticsService';
import { readStore } from '../services/store';

export const analyticsRouter = Router();

analyticsRouter.get('/', async (req, res, next) => {
  try {
    res.json(await buildAnalytics(getUserId(req)));
  } catch (error) {
    next(error);
  }
});

analyticsRouter.get('/parent-summary', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const analytics = await buildAnalytics(userId);
    const store = await readStore();
    const recentPlans = store.improvementPlans.filter((plan) => plan.userId === userId).slice(-1)[0];
    res.json({
      summary: analytics.totalQuizzes
        ? `The learner has completed ${analytics.totalQuizzes} quizzes with ${analytics.accuracy}% average accuracy. Strongest subjects: ${analytics.strongestSubjects.join(', ') || 'not enough data yet'}. Focus areas: ${analytics.weakTopics.join(', ') || 'keep practicing new topics'}.`
        : 'No quiz attempts have been completed yet. Start a topic quiz to generate a parent progress summary.',
      wins: analytics.badges,
      nextSteps: recentPlans?.items.map((item) => item.text) || [],
      analytics
    });
  } catch (error) {
    next(error);
  }
});
