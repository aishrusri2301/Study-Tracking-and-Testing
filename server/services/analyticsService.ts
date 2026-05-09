import type { AnalyticsSnapshot } from '../../shared/types';
import { readStore } from './store';
import { letterGrade } from './textUtils';

export async function buildAnalytics(userId: string): Promise<AnalyticsSnapshot> {
  const store = await readStore();
  const attempts = store.quizAttempts.filter((attempt) => attempt.userId === userId || userId === 'anonymous-student');
  const topics = store.topicsStudied.filter((topic) => topic.userId === userId || userId === 'anonymous-student');
  const bySubject = group(attempts, (attempt) => attempt.profile.subject);
  const reportCard = [...bySubject.entries()].map(([subject, items]) => {
    const score = average(items.map((item) => item.score));
    const previous = average(items.slice(0, Math.max(1, items.length - 1)).map((item) => item.score));
    return { subject, score, grade: letterGrade(score), trend: score - previous };
  }).sort((a, b) => b.score - a.score);
  const dailyProgress = lastDays(7).map((date) => {
    const items = attempts.filter((attempt) => attempt.createdAt.slice(0, 10) === date.iso);
    return { day: date.label, minutes: items.length * 8 + Math.round(items.reduce((sum, item) => sum + item.questions.length, 0) * 0.8), accuracy: average(items.map((item) => item.score)), quizzes: items.length };
  });
  const weeklyTrends = lastWeeks(6).map((week) => {
    const items = attempts.filter((attempt) => attempt.createdAt >= week.start.toISOString() && attempt.createdAt <= week.end.toISOString());
    return { week: week.label, mastery: average(items.map((item) => item.mastery)), attempts: items.length };
  });
  const masteryHeatmap = topics.map((topic) => ({ topic: topic.topic, subject: topic.subject, mastery: topic.mastery })).sort((a, b) => a.mastery - b.mastery).slice(0, 24);
  const accuracy = average(attempts.map((attempt) => attempt.score));
  const strongestSubjects = reportCard.slice(0, 2).map((item) => item.subject);
  const weakestSubjects = [...reportCard].sort((a, b) => a.score - b.score).slice(0, 2).map((item) => item.subject);
  return {
    reportCard,
    dailyProgress,
    weeklyTrends,
    masteryHeatmap,
    accuracy,
    averageResponseTime: average(attempts.map((attempt) => attempt.averageResponseTime)),
    recentQuizzes: attempts.slice(-8).reverse().map((attempt) => ({ topic: attempt.profile.topic, subject: attempt.profile.subject, score: attempt.score, date: attempt.createdAt.slice(0, 10) })),
    streak: calculateStreak(attempts.map((attempt) => attempt.createdAt.slice(0, 10))),
    badges: buildBadges(attempts.length, accuracy, calculateStreak(attempts.map((attempt) => attempt.createdAt.slice(0, 10)))),
    strongestSubjects,
    weakestSubjects,
    weakTopics: masteryHeatmap.filter((topic) => topic.mastery < 70).map((topic) => topic.topic).slice(0, 6),
    totalQuizzes: attempts.length
  };
}

function average(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return 0;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
}

function group<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, T[]>();
  items.forEach((item) => map.set(key(item), [...(map.get(key(item)) || []), item]));
  return map;
}

function lastDays(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (count - index - 1));
    return { iso: date.toISOString().slice(0, 10), label: date.toLocaleDateString('en', { weekday: 'short' }) };
  });
}

function lastWeeks(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const end = new Date();
    end.setDate(end.getDate() - ((count - index - 1) * 7));
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    return { start, end, label: `W${index + 1}` };
  });
}

function calculateStreak(days: string[]) {
  const set = new Set(days);
  let streak = 0;
  const cursor = new Date();
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function buildBadges(total: number, accuracy: number, streak: number) {
  return [
    total >= 1 ? 'First Quiz Finished' : '',
    total >= 5 ? 'Practice Builder' : '',
    accuracy >= 80 ? 'Accuracy Star' : '',
    streak >= 3 ? 'Streak Spark' : ''
  ].filter(Boolean);
}
