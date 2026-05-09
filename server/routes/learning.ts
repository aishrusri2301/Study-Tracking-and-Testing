import { Router } from 'express';
import { z } from 'zod';
import { buildRecommendations, findResources, generateQuiz, gradeShortAnswer } from '../services/aiService';
import type { QuizQuestion } from '../../shared/types';

export const learningRouter = Router();

const profileSchema = z.object({
  grade: z.string().min(1),
  subject: z.string().min(1),
  board: z.string().min(1),
  topic: z.string().min(2),
  difficulty: z.enum(['gentle', 'balanced', 'challenge']).optional()
});

learningRouter.post('/resources', async (req, res) => {
  const profile = profileSchema.parse(req.body);
  const resources = await findResources(profile);
  res.json({ resources });
});

learningRouter.post('/quiz', async (req, res) => {
  const profile = profileSchema.parse(req.body.profile);
  const resources = await findResources(profile);
  const questions = await generateQuiz(profile, resources);
  res.json({ questions, resources });
});

learningRouter.post('/grade', async (req, res) => {
  const answers = req.body.answers as Record<string, string>;
  const questions = req.body.questions as QuizQuestion[];
  let earned = 0;
  const details = questions.map((question) => {
    const answer = answers[question.id] || '';
    if (question.type === 'mcq') {
      const correct = answer === question.correctAnswer;
      earned += correct ? 100 : 0;
      return { id: question.id, score: correct ? 100 : 0, feedback: correct ? 'Correct! 🎉' : question.explanation };
    }
    const graded = gradeShortAnswer(answer, question);
    earned += graded.score;
    return { id: question.id, ...graded };
  });
  const overallScore = Math.round(earned / Math.max(questions.length, 1));
  const weakAreas = details.filter((d) => d.score < 70).map((d) => questions.find((q) => q.id === d.id)?.concepts[0] || 'revision');
  const strengths = details.filter((d) => d.score >= 80).slice(0, 4).map((d) => questions.find((q) => q.id === d.id)?.concepts[0] || 'clear thinking');
  res.json({
    details,
    result: {
      overallScore,
      letterGrade: overallScore >= 90 ? 'A+' : overallScore >= 80 ? 'A' : overallScore >= 70 ? 'B' : overallScore >= 60 ? 'C' : 'Keep Growing',
      mastery: overallScore,
      strengths: strengths.length ? strengths : ['positive effort', 'quiz completion'],
      weakAreas: [...new Set(weakAreas)].slice(0, 4),
      recommendations: buildRecommendations(req.body.topic || 'this topic', weakAreas),
      readings: req.body.resources || [],
      improvementPlan: buildRecommendations(req.body.topic || 'this topic', weakAreas).map((text, index) => ({ id: `imp-${index}`, text, completed: false, category: index === 1 ? 'practice' : index === 2 ? 'watch' : 'revise' }))
    }
  });
});

learningRouter.post('/buddy', async (req, res) => {
  const { message, topic } = req.body;
  res.json({ reply: `You’re doing wonderfully! For ${topic}, think of it like a tiny story: what goes in, what changes, and what comes out. Hint for your question: "${message}" — look for the key vocabulary and draw a quick picture if you feel stuck. 🌈` });
});
