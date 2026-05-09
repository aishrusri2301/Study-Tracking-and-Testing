import OpenAI from 'openai';
import type { LearningProfile, QuestionEvaluation, QuizQuestion, QuizResult, Resource } from '../../shared/types';
import { buildImprovementPlan, buildRecommendations, nextReadings } from './recommendationEngine';
import { letterGrade, normalizeText, stableId, unique } from './textUtils';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function gradeQuiz(input: { profile: LearningProfile; questions: QuizQuestion[]; answers: Record<string, string>; resources: Resource[] }): Promise<QuizResult> {
  const evaluations: QuestionEvaluation[] = [];
  for (const question of input.questions) {
    if (question.type === 'mcq') evaluations.push(gradeMcq(question, input.answers[question.id] || ''));
    else evaluations.push(await gradeShortAnswer(question, input.answers[question.id] || '', input.profile));
  }
  const earnedMarks = evaluations.reduce((sum, item) => sum + item.score, 0);
  const totalMarks = evaluations.reduce((sum, item) => sum + item.maxScore, 0) || 1;
  const overallScore = Math.round((earnedMarks / totalMarks) * 100);
  const conceptMastery = conceptScores(input.questions, evaluations);
  const weakAreas = conceptMastery.filter((item) => item.mastery < 70).map((item) => item.concept).slice(0, 6);
  const strengths = conceptMastery.filter((item) => item.mastery >= 75).map((item) => item.concept).slice(0, 6);
  const improvementPlan = buildImprovementPlan(input.profile.topic, weakAreas, input.resources);
  return {
    overallScore,
    totalMarks,
    earnedMarks,
    letterGrade: letterGrade(overallScore),
    mastery: Math.round(conceptMastery.reduce((sum, item) => sum + item.mastery, 0) / Math.max(conceptMastery.length, 1)) || overallScore,
    conceptMastery,
    strengths,
    weakAreas,
    recommendations: buildRecommendations(input.profile.topic, weakAreas, input.resources),
    readings: nextReadings(input.resources, weakAreas),
    improvementPlan,
    evaluations
  };
}

function gradeMcq(question: QuizQuestion, answer: string): QuestionEvaluation {
  const correct = normalizeText(answer) === normalizeText(question.correctAnswer);
  return {
    id: question.id,
    score: correct ? 1 : 0,
    maxScore: 1,
    feedback: correct ? 'Correct — great job connecting the concept!' : `Not quite. ${question.explanation}`,
    matchedConcepts: correct ? question.concepts : [],
    missingConcepts: correct ? [] : question.concepts
  };
}

async function gradeShortAnswer(question: QuizQuestion, answer: string, profile: LearningProfile): Promise<QuestionEvaluation> {
  if (openai && answer.trim()) {
    const ai = await gradeShortWithAI(question, answer, profile);
    if (ai) return ai;
  }
  const normalizedAnswer = normalizeText(answer);
  const matchedConcepts = question.concepts.filter((concept) => normalizeText(concept).split(' ').some((word) => normalizedAnswer.includes(word)));
  const rubricMatches = (question.rubric || []).filter((rubric) => normalizeText(rubric).split(' ').some((word) => word.length > 4 && normalizedAnswer.includes(word)));
  const conceptScore = matchedConcepts.length / Math.max(question.concepts.length, 1);
  const rubricScore = rubricMatches.length / Math.max(question.rubric?.length || 1, 1);
  const lengthBonus = answer.trim().split(/\s+/).length >= 12 ? 0.15 : 0;
  const score = Math.min(4, Math.round((conceptScore * 0.7 + rubricScore * 0.2 + lengthBonus) * 4));
  return {
    id: question.id,
    score,
    maxScore: 4,
    feedback: score >= 3 ? 'Good answer — your wording is different but the key ideas are present.' : `Add more of these expected ideas: ${question.concepts.filter((concept) => !matchedConcepts.includes(concept)).join(', ')}.`,
    matchedConcepts,
    missingConcepts: question.concepts.filter((concept) => !matchedConcepts.includes(concept))
  };
}

async function gradeShortWithAI(question: QuizQuestion, answer: string, profile: LearningProfile) {
  try {
    const completion = await openai!.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Grade short school answers by semantic correctness, not exact wording. Return valid JSON only.' },
        { role: 'user', content: `Grade ${profile.grade} ${profile.subject} answer for topic ${profile.topic}. Question: ${question.prompt}. Expected concepts: ${question.concepts.join(', ')}. Rubric: ${(question.rubric || []).join(' | ')}. Student answer: ${answer}. Return {"score":0-4,"feedback":"","matchedConcepts":[],"missingConcepts":[]}.` }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });
    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}') as Omit<QuestionEvaluation, 'id' | 'maxScore'>;
    return { id: question.id, score: Math.max(0, Math.min(4, Math.round(parsed.score || 0))), maxScore: 4, feedback: parsed.feedback || '', matchedConcepts: parsed.matchedConcepts || [], missingConcepts: parsed.missingConcepts || [] };
  } catch {
    return undefined;
  }
}

function conceptScores(questions: QuizQuestion[], evaluations: QuestionEvaluation[]) {
  const buckets = new Map<string, { earned: number; total: number }>();
  questions.forEach((question) => {
    const evaluation = evaluations.find((item) => item.id === question.id);
    question.concepts.forEach((concept) => {
      const current = buckets.get(concept) || { earned: 0, total: 0 };
      current.earned += evaluation?.score || 0;
      current.total += evaluation?.maxScore || 1;
      buckets.set(concept, current);
    });
  });
  return unique([...buckets.entries()].map(([concept, value]) => ({ concept, mastery: Math.round((value.earned / Math.max(value.total, 1)) * 100) }))).sort((a, b) => a.mastery - b.mastery);
}
