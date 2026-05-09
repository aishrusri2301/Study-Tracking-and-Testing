export type Board = 'CBSE' | 'ICSE' | 'State Board' | 'IB' | 'IGCSE';
export type QuestionType = 'mcq' | 'short';

export interface LearningProfile {
  grade: string;
  subject: string;
  board: Board | string;
  topic: string;
  difficulty?: 'gentle' | 'balanced' | 'challenge';
}

export interface Resource {
  id: string;
  title: string;
  type: 'explanation' | 'notes' | 'video' | 'diagram' | 'practice' | 'reading';
  provider: string;
  url: string;
  summary: string;
  childFriendlyScore: number;
  relevanceScore: number;
  credibilityScore: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  concepts: string[];
  difficulty: number;
}

export interface QuizResult {
  overallScore: number;
  letterGrade: string;
  mastery: number;
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
  readings: Resource[];
  improvementPlan: ImprovementItem[];
}

export interface ImprovementItem {
  id: string;
  text: string;
  completed: boolean;
  category: 'revise' | 'practice' | 'watch' | 'read' | 'challenge';
}

export interface AnalyticsSnapshot {
  reportCard: { subject: string; score: number; grade: string; trend: number }[];
  dailyProgress: { day: string; minutes: number; accuracy: number }[];
  weeklyTrends: { week: string; mastery: number }[];
  masteryHeatmap: { topic: string; subject: string; mastery: number }[];
  accuracy: number;
  averageResponseTime: number;
  recentQuizzes: { topic: string; subject: string; score: number; date: string }[];
  streak: number;
  badges: string[];
}
