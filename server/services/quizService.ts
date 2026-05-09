import OpenAI from 'openai';
import type { LearningProfile, QuizQuestion, Resource } from '../../shared/types';
import { combinedResourceText } from './resourceService';
import { gradeBand, keywords, sentenceSplit, stableId, unique } from './textUtils';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function generateQuiz(profile: LearningProfile, resources: Resource[]): Promise<QuizQuestion[]> {
  if (openai) {
    const generated = await generateWithAI(profile, resources);
    if (generated.length === 10) return generated;
  }
  return generateFromResources(profile, resources);
}

async function generateWithAI(profile: LearningProfile, resources: Resource[]) {
  const completion = await openai!.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Create grade-appropriate quizzes from supplied resources. Return valid JSON only.' },
      { role: 'user', content: `Grade ${profile.grade}, board ${profile.board}, subject ${profile.subject}, topic ${profile.topic}. Generate exactly 5 MCQs and 5 short-answer questions based only on these resources. Difficulty should match grade band ${gradeBand(profile.grade)}. MCQs need 4 options, one correct answer, and explanation. Short answers need expected concepts and a marking rubric. JSON shape: {"questions":[{"id":"","type":"mcq|short","prompt":"","options":[],"correctAnswer":"","explanation":"","concepts":[],"difficulty":1,"resourceIds":[],"rubric":[]}]}. Resources: ${JSON.stringify(resources.map((r) => ({ id: r.id, title: r.title, summary: r.summary, concepts: r.keyConcepts })).slice(0, 8))}` }
    ],
    temperature: 0.35,
    response_format: { type: 'json_object' }
  });
  const parsed = JSON.parse(completion.choices[0]?.message?.content || '{"questions":[]}') as { questions?: QuizQuestion[] };
  return sanitizeQuestions(parsed.questions || [], resources);
}

function generateFromResources(profile: LearningProfile, resources: Resource[]) {
  const text = combinedResourceText(resources);
  const concepts = unique(resources.flatMap((resource) => resource.keyConcepts).concat(keywords(text, 16))).filter(Boolean).slice(0, 14);
  const sentences = sentenceSplit(text).slice(0, 16);
  const sourceIds = resources.slice(0, 4).map((resource) => resource.id);
  const level = gradeBand(profile.grade);
  const difficulty = level === 'beginner' ? 1 : level === 'intermediate' ? 2 : 3;
  const mcqs = Array.from({ length: 5 }, (_, index) => {
    const concept = concepts[index] || profile.topic;
    const sentence = sentences.find((item) => item.toLowerCase().includes(concept.toLowerCase())) || sentences[index] || `${profile.topic} is an important ${profile.subject} topic.`;
    const distractors = concepts.filter((item) => item !== concept).slice(index + 1, index + 4);
    while (distractors.length < 3) distractors.push(`${profile.subject} idea ${distractors.length + 1}`);
    const options = shuffle([concept, ...distractors.slice(0, 3)]).map((item) => titleCase(item));
    return {
      id: stableId('q', `${profile.topic}-mcq-${index}-${concept}`),
      type: 'mcq' as const,
      prompt: buildMcqPrompt(profile, concept, sentence, index),
      options,
      correctAnswer: titleCase(concept),
      explanation: sentence,
      concepts: [concept, ...keywords(sentence, 3)].slice(0, 4),
      difficulty,
      resourceIds: sourceIds,
      rubric: [`Identify ${concept}`, 'Connect the idea to the topic', 'Avoid unrelated choices']
    };
  });
  const shortQuestions = Array.from({ length: 5 }, (_, index) => {
    const conceptGroup = concepts.slice(index * 2, index * 2 + 4);
    const selected = conceptGroup.length ? conceptGroup : concepts.slice(0, 4);
    const sentence = sentences[index + 5] || sentences[index] || `${profile.topic} connects to ${selected.join(', ')}.`;
    return {
      id: stableId('q', `${profile.topic}-short-${index}-${selected.join('-')}`),
      type: 'short' as const,
      prompt: buildShortPrompt(profile, selected, index),
      correctAnswer: sentence,
      explanation: `A strong answer should mention ${selected.map(titleCase).join(', ')} and explain how it connects to ${profile.topic}.`,
      concepts: selected,
      difficulty: Math.min(4, difficulty + (index > 2 ? 1 : 0)),
      resourceIds: sourceIds,
      rubric: selected.map((concept) => `Mentions and correctly uses ${titleCase(concept)}`).concat(['Uses grade-appropriate explanation in own words'])
    };
  });
  return [...mcqs, ...shortQuestions];
}

function buildMcqPrompt(profile: LearningProfile, concept: string, sentence: string, index: number) {
  const stems = [
    `Which key idea is most closely connected to this ${profile.topic} resource sentence: “${sentence.slice(0, 140)}”?`,
    `For ${profile.board} Grade ${profile.grade} ${profile.subject}, which term best matches an important part of ${profile.topic}?`,
    `Which concept would help explain ${profile.topic} most accurately?`,
    `In the topic ${profile.topic}, what should a student remember from the resources?`,
    `Which option is a real concept from the gathered ${profile.subject} resources?`
  ];
  return stems[index] || `Which option best matches ${concept}?`;
}

function buildShortPrompt(profile: LearningProfile, concepts: string[], index: number) {
  const joined = concepts.slice(0, 3).map(titleCase).join(', ');
  const prompts = [
    `Explain ${profile.topic} in your own words using these ideas: ${joined}.`,
    `Why is ${titleCase(concepts[0] || profile.topic)} important when learning ${profile.topic}?`,
    `Write a short note on ${profile.topic} for a Grade ${profile.grade} student. Include ${joined}.`,
    `Describe one example, cause, step, or application related to ${profile.topic}. Use ${joined}.`,
    `What should you revise first if you are confused about ${profile.topic}? Mention ${joined}.`
  ];
  return prompts[index];
}

function sanitizeQuestions(questions: QuizQuestion[], resources: Resource[]) {
  return questions.slice(0, 10).map((question, index) => ({
    ...question,
    id: question.id || stableId('q', `${question.prompt}-${index}`),
    resourceIds: question.resourceIds?.length ? question.resourceIds : resources.slice(0, 3).map((resource) => resource.id),
    concepts: question.concepts?.length ? question.concepts : keywords(`${question.prompt} ${question.correctAnswer}`, 4),
    rubric: question.rubric?.length ? question.rubric : question.concepts?.map((concept) => `Correctly explains ${concept}`) || []
  }));
}

function titleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}
