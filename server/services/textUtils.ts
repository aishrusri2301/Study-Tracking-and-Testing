import crypto from 'crypto';

const stopWords = new Set(['about','after','again','also','and','are','because','been','before','between','board','class','could','does','during','each','from','grade','have','into','learn','more','most','notes','other','over','such','than','that','the','their','them','then','there','these','this','through','topic','under','using','very','what','when','where','which','while','with','would','your']);

export function stableId(prefix: string, value: string) {
  return `${prefix}-${crypto.createHash('sha1').update(value).digest('hex').slice(0, 12)}`;
}

export function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function sentenceSplit(text: string) {
  return text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 35);
}

export function keywords(text: string, limit = 12) {
  const counts = new Map<string, number>();
  normalizeText(text).split(' ').filter((word) => word.length > 3 && !stopWords.has(word)).forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([word]) => word);
}

export function unique<T>(items: T[]) {
  return [...new Set(items)];
}

export function gradeBand(grade: string) {
  const numeric = Number.parseInt(grade.replace(/\D/g, ''), 10);
  if (!Number.isFinite(numeric) || numeric <= 5) return 'beginner';
  if (numeric <= 8) return 'intermediate';
  return 'advanced';
}

export function letterGrade(score: number) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'Keep Growing';
}

export function cosineLikeSimilarity(answer: string, concepts: string[]) {
  const words = new Set(normalizeText(answer).split(' ').filter(Boolean));
  if (!concepts.length) return 0;
  const matched = concepts.filter((concept) => normalizeText(concept).split(' ').some((word) => words.has(word)));
  return matched.length / concepts.length;
}
