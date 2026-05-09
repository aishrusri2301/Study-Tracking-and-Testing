export type Board = 'CBSE' | 'ICSE' | 'State Board' | 'IB' | 'IGCSE' | string;
export type QuestionType = 'mcq' | 'short';

export interface LearningProfile {
  grade: string;
  subject: string;
  board: Board;
  topic: string;
  difficulty?: 'gentle' | 'balanced' | 'challenge';
  studentId?: string;
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
  keyConcepts: string[];
  imageUrl?: string;
  searchQuery: string;
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
  resourceIds: string[];
  rubric?: string[];
}

export interface QuestionEvaluation {
  id: string;
  score: number;
  maxScore: number;
  feedback: string;
  matchedConcepts: string[];
  missingConcepts: string[];
}

export interface QuizResult {
  attemptId?: string;
  overallScore: number;
  totalMarks: number;
  earnedMarks: number;
  letterGrade: string;
  mastery: number;
  conceptMastery: { concept: string; mastery: number }[];
  strengths: string[];
  weakAreas: string[];
  recommendations: string[];
  readings: Resource[];
  improvementPlan: ImprovementItem[];
  evaluations?: QuestionEvaluation[];
}

export interface ImprovementItem {
  id: string;
  text: string;
  completed: boolean;
  category: 'revise' | 'practice' | 'watch' | 'read' | 'challenge';
}

export interface AnalyticsSnapshot {
  reportCard: { subject: string; score: number; grade: string; trend: number }[];
  dailyProgress: { day: string; minutes: number; accuracy: number; quizzes: number }[];
  weeklyTrends: { week: string; mastery: number; attempts: number }[];
  masteryHeatmap: { topic: string; subject: string; mastery: number }[];
  accuracy: number;
  averageResponseTime: number;
  recentQuizzes: { topic: string; subject: string; score: number; date: string }[];
  streak: number;
  badges: string[];
  strongestSubjects: string[];
  weakestSubjects: string[];
  weakTopics: string[];
  totalQuizzes: number;
}
