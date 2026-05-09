import OpenAI from 'openai';
import type { LearningProfile, QuizQuestion, Resource } from '../../shared/types';
import { sampleQuestions, sampleResources } from '../../src/data/sampleData';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function findResources(profile: LearningProfile): Promise<Resource[]> {
  const topic = profile.topic.toLowerCase();
  const ranked = sampleResources.map((resource) => ({
    ...resource,
    title: resource.title.replace(/Photosynthesis/gi, profile.topic),
    summary: resource.summary.replace(/photosynthesis/gi, topic).replace(/plants/g, profile.subject.toLowerCase() === 'science' ? 'plants' : 'learners'),
    relevanceScore: Math.min(99, resource.relevanceScore + (profile.board === 'CBSE' ? 2 : 0))
  }));
  return ranked.sort((a, b) => b.relevanceScore + b.childFriendlyScore + b.credibilityScore - (a.relevanceScore + a.childFriendlyScore + a.credibilityScore));
}

export async function generateQuiz(profile: LearningProfile, resources: Resource[]): Promise<QuizQuestion[]> {
  if (!openai) return adaptQuestions(profile);
  const prompt = `Create exactly 5 MCQs and 5 short-answer questions for grade ${profile.grade}, ${profile.board}, ${profile.subject}, topic ${profile.topic}. Use these resources: ${resources.map((r) => r.title).join(', ')}. Return JSON array matching {id,type,prompt,options,correctAnswer,explanation,concepts,difficulty}.`;
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [{ role: 'system', content: 'You create safe, child-friendly school quizzes. Return valid JSON only.' }, { role: 'user', content: prompt }],
    temperature: 0.4,
    response_format: { type: 'json_object' }
  });
  const parsed = JSON.parse(completion.choices[0]?.message?.content || '{"questions":[]}') as { questions?: QuizQuestion[] };
  return parsed.questions?.length ? parsed.questions : adaptQuestions(profile);
}

export function gradeShortAnswer(answer: string, question: QuizQuestion) {
  const normalized = answer.toLowerCase();
  const matched = question.concepts.filter((concept) => normalized.includes(concept.toLowerCase()));
  const score = Math.round((matched.length / Math.max(question.concepts.length, 1)) * 100);
  return {
    score,
    feedback: score > 75 ? 'Great concept coverage! 🌟' : score > 45 ? 'Nice start. Add more key ideas to make it stronger.' : 'Try mentioning the main ingredients and result in your answer.',
    matchedConcepts: matched,
    missingConcepts: question.concepts.filter((concept) => !matched.includes(concept))
  };
}

export function buildRecommendations(topic: string, weakAreas: string[]) {
  const focus = weakAreas.length ? weakAreas : ['chapter summary', 'key vocabulary'];
  return [
    `Revise the ${topic} definition using Explain Like I’m 10 mode`,
    `Practice diagram labeling for ${focus[0]}`,
    `Watch one beginner video and pause after each example`,
    `Solve 5 more mixed questions on ${topic}`,
    'Review mistakes with Study Buddy before the next quiz'
  ];
}

function adaptQuestions(profile: LearningProfile): QuizQuestion[] {
  return sampleQuestions.map((question) => ({
    ...question,
    prompt: question.prompt.replace(/photosynthesis/gi, profile.topic).replace(/plants/gi, profile.subject.toLowerCase() === 'science' ? 'plants' : profile.topic),
    difficulty: profile.difficulty === 'challenge' ? question.difficulty + 1 : question.difficulty
  }));
}
