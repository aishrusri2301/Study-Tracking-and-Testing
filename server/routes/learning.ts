import { Router } from 'express';
import { z } from 'zod';

import type { QuizQuestion, Resource } from '../../shared/types';

import { getUserId } from '../middleware/auth';
import { buildAnalytics } from '../services/analyticsService';
import { gradeQuiz } from '../services/gradingService';
import { generateQuiz } from '../services/quizService';
import { gatherResources } from '../services/resourceService';
import { saveAttempt, saveResources } from '../services/store';

export const learningRouter = Router();

const profileSchema = z.object({
  grade: z.string().min(1),
  subject: z.string().min(1),
  board: z.string().min(1),
  topic: z.string().min(2),
  difficulty: z
    .enum(['gentle', 'balanced', 'challenge'])
    .optional(),
  studentId: z.string().optional(),
});

learningRouter.post(
  '/resources',
  async (req, res, next) => {
    try {
      const profile = profileSchema.parse(req.body);

      const userId = getUserId(req);

      const resources = await gatherResources(profile);

      await saveResources(userId, profile, resources);

      return res.json({
        resources,
        searchQuery: resources[0]?.searchQuery,
      });
    } catch (error) {
      next(error);
    }
  }
);

learningRouter.post(
  '/quiz',
  async (req, res, next) => {
    try {
      const profile = profileSchema.parse(
        req.body.profile
      );

      const userId = getUserId(req);

      const resources = await gatherResources(profile);

      const questions = await generateQuiz(
        profile,
        resources
      );

      await saveResources(userId, profile, resources);

      return res.json({
        questions,
        resources,
        searchQuery: resources[0]?.searchQuery,
      });
    } catch (error) {
      next(error);
    }
  }
);

learningRouter.post(
  '/grade',
  async (req, res, next) => {
    try {
      const profile = profileSchema.parse(
        req.body.profile
      );

      const userId = getUserId(req);

      const answers = z
        .record(z.string())
        .parse(req.body.answers || {});

      const questions = z
        .array(z.any())
        .parse(req.body.questions) as QuizQuestion[];

      const resources = z
        .array(z.any())
        .parse(req.body.resources || []) as Resource[];

      const result = await gradeQuiz({
        profile,
        questions,
        answers,
        resources,
      });

      const attempt = await saveAttempt(
        {
          userId,
          profile,
          questions,
          answers,
          evaluations: result.evaluations || [],
          resources,
          score: result.overallScore,
          mastery: result.mastery,
          averageResponseTime: Number(
            req.body.averageResponseTime || 0
          ),
        },
        result.improvementPlan
      );

      return res.json({
        result: {
          ...result,
          attemptId: attempt.id,
        },

        analytics: await buildAnalytics(userId),
      });
    } catch (error) {
      next(error);
    }
  }
);

learningRouter.post('/buddy', async (req, res) => {
  const profile = profileSchema
    .partial()
    .parse(req.body.profile || {});

  const message = String(req.body.message || '');

  const topic =
    profile.topic ||
    req.body.topic ||
    'your current topic';

  return res.json({
    reply: `Let’s make ${topic} easier. First find the main idea in your question, then connect it to one keyword from your resources. If you share your answer, I can help you improve it step by step. Your question was: “${message.slice(
      0,
      180
    )}”.`,
  });
});