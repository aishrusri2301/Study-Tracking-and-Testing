import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ImprovementItem, LearningProfile, QuestionEvaluation, QuizQuestion, Resource } from '../../shared/types';
import { stableId } from './textUtils';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'student' | 'parent' | 'admin';
  grade?: string;
  board?: string;
  createdAt: string;
}

export interface QuizAttemptRecord {
  id: string;
  userId: string;
  profile: LearningProfile;
  questions: QuizQuestion[];
  answers: Record<string, string>;
  evaluations: QuestionEvaluation[];
  resources: Resource[];
  score: number;
  mastery: number;
  averageResponseTime: number;
  createdAt: string;
}

export interface TopicRecord {
  id: string;
  userId: string;
  subject: string;
  board: string;
  grade: string;
  topic: string;
  mastery: number;
  attempts: number;
  updatedAt: string;
}

export interface StoreShape {
  users: UserRecord[];
  quizAttempts: QuizAttemptRecord[];
  topicsStudied: TopicRecord[];
  resourceHistory: Array<{ id: string; userId: string; profile: LearningProfile; resources: Resource[]; createdAt: string }>;
  improvementPlans: Array<{ id: string; userId: string; attemptId: string; items: ImprovementItem[]; createdAt: string }>;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storePath = process.env.JSON_STORE_PATH || path.resolve(__dirname, '../data/store.json');
const emptyStore: StoreShape = { users: [], quizAttempts: [], topicsStudied: [], resourceHistory: [], improvementPlans: [] };

async function ensureStore() {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, JSON.stringify(emptyStore, null, 2));
  }
}

export async function readStore(): Promise<StoreShape> {
  await ensureStore();
  const raw = await fs.readFile(storePath, 'utf8');
  return { ...emptyStore, ...JSON.parse(raw) };
}

export async function writeStore(next: StoreShape) {
  await ensureStore();
  await fs.writeFile(storePath, JSON.stringify(next, null, 2));
}

export async function upsertUser(user: Omit<UserRecord, 'id' | 'createdAt'> & { id?: string }) {
  const store = await readStore();
  const existing = store.users.find((item) => item.email.toLowerCase() === user.email.toLowerCase());
  if (existing) return existing;
  const record: UserRecord = { ...user, id: user.id || stableId('user', user.email), createdAt: new Date().toISOString() };
  store.users.push(record);
  await writeStore(store);
  return record;
}

export async function findUserByEmail(email: string) {
  const store = await readStore();
  return store.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export async function saveResources(userId: string, profile: LearningProfile, resources: Resource[]) {
  const store = await readStore();
  store.resourceHistory.push({ id: stableId('resources', `${userId}-${profile.topic}-${Date.now()}`), userId, profile, resources, createdAt: new Date().toISOString() });
  await writeStore(store);
}

export async function saveAttempt(record: Omit<QuizAttemptRecord, 'id' | 'createdAt'>, improvementPlan: ImprovementItem[]) {
  const store = await readStore();
  const attempt: QuizAttemptRecord = { ...record, id: stableId('attempt', `${record.userId}-${record.profile.topic}-${Date.now()}`), createdAt: new Date().toISOString() };
  store.quizAttempts.push(attempt);
  const topicId = stableId('topic', `${record.userId}-${record.profile.subject}-${record.profile.topic}`);
  const existingTopic = store.topicsStudied.find((topic) => topic.id === topicId);
  if (existingTopic) {
    existingTopic.mastery = Math.round(((existingTopic.mastery * existingTopic.attempts) + record.mastery) / (existingTopic.attempts + 1));
    existingTopic.attempts += 1;
    existingTopic.updatedAt = attempt.createdAt;
  } else {
    store.topicsStudied.push({ id: topicId, userId: record.userId, subject: record.profile.subject, board: record.profile.board, grade: record.profile.grade, topic: record.profile.topic, mastery: record.mastery, attempts: 1, updatedAt: attempt.createdAt });
  }
  store.improvementPlans.push({ id: stableId('plan', attempt.id), userId: record.userId, attemptId: attempt.id, items: improvementPlan, createdAt: attempt.createdAt });
  await writeStore(store);
  return attempt;
}
