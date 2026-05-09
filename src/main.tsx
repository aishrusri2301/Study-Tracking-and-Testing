import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  BookOpen,
  Bot,
  CheckCircle2,
  Download,
  Heart,
  Moon,
  PlayCircle,
  Printer,
  Sparkles,
  Star,
  Sun,
  Trophy,
  Volume2,
} from 'lucide-react';

import type {
  AnalyticsSnapshot,
  ImprovementItem,
  LearningProfile,
  QuizQuestion,
  QuizResult,
  Resource,
} from '../shared/types';

import './styles/app.css';

const apiUrl = import.meta.env.VITE_API_URL || '/api';

const blankAnalytics: AnalyticsSnapshot = {
  reportCard: [],
  dailyProgress: [],
  weeklyTrends: [],
  masteryHeatmap: [],
  accuracy: 0,
  averageResponseTime: 0,
  recentQuizzes: [],
  streak: 0,
  badges: [],
  strongestSubjects: [],
  weakestSubjects: [],
  weakTopics: [],
  totalQuizzes: 0,
};

const subjectColors = [
  '#b7f7d4',
  '#c9dcff',
  '#ffd6e8',
  '#ffe7ad',
  '#d8d0ff',
  '#c9f6ff',
];

type Screen =
  | 'landing'
  | 'onboarding'
  | 'topic'
  | 'resources'
  | 'quiz'
  | 'results'
  | 'dashboard'
  | 'parent'
  | 'settings';

function App() {
  const [screen, setScreen] =
    useState<Screen>('landing');

  const [dark, setDark] = useState(false);

  const [profile, setProfile] =
    useState<LearningProfile>({
      grade: '',
      subject: '',
      board: '',
      topic: '',
      difficulty: 'balanced',
    });

  const [resources, setResources] = useState<
    Resource[]
  >([]);

  const [questions, setQuestions] = useState<
    QuizQuestion[]
  >([]);

  const [answers, setAnswers] = useState<
    Record<string, string>
  >({});

  const [result, setResult] =
    useState<QuizResult | null>(null);

  const [analytics, setAnalytics] =
    useState<AnalyticsSnapshot>(
      blankAnalytics
    );

  const [checklist, setChecklist] =
    useState<ImprovementItem[]>([]);

  const [favorites, setFavorites] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState('');

  const [error, setError] = useState('');

  const [buddyMessages, setBuddyMessages] =
    useState([
      {
        from: 'buddy',
        text:
          'I can explain your current topic, give hints, and help you improve answers.',
      },
    ]);

  useEffect(() => {
    refreshAnalytics();
  }, []);

  async function refreshAnalytics() {
    try {
      const response = await fetch(
        `${apiUrl}/analytics`
      );

      if (response.ok) {
        setAnalytics(await response.json());
      }
    } catch {
      setAnalytics(blankAnalytics);
    }
  }

  async function generateLearningPath() {
    setLoading(
      'Finding topic-specific resources and building your quiz...'
    );

    setError('');

    setScreen('resources');

    try {
      const response = await fetch(
        `${apiUrl}/learning/quiz`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ profile }),
        }
      );

      if (!response.ok) {
        throw new Error(
          'Learning workflow failed'
        );
      }

      const data = await response.json();

      setResources(data.resources || []);

      setQuestions(data.questions || []);

      setAnswers({});

      setResult(null);
    } catch {
      setError(
        'The tutor could not gather resources right now. Check the topic and try again.'
      );
    } finally {
      setLoading('');
    }
  }

  async function submitQuiz() {
    setLoading(
      'Evaluating answers semantically and updating progress...'
    );

    setError('');

    try {
      const response = await fetch(
        `${apiUrl}/learning/grade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile,
            answers,
            questions,
            resources,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Grading failed');
      }

      const data = await response.json();

      setResult(data.result);

      setChecklist(
        data.result.improvementPlan || []
      );

      setAnalytics(
        data.analytics || analytics
      );

      setScreen('results');
    } catch {
      setError(
        'The tutor could not grade the quiz right now. Please try again.'
      );
    } finally {
      setLoading('');
    }
  }

  function speak(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.speak(
        new SpeechSynthesisUtterance(text)
      );
    }
  }

  async function askBuddy(message: string) {
    setBuddyMessages((items) => [
      ...items,
      {
        from: 'student',
        text: message,
      },
    ]);

    const response = await fetch(
      `${apiUrl}/learning/buddy`,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          message,
          profile,
        }),
      }
    );

    const data = await response.json();

    setBuddyMessages((items) => [
      ...items,
      {
        from: 'buddy',
        text: data.reply,
      },
    ]);
  }

  return (
    <div className={dark ? 'app dark' : 'app'}>
      {/* rest of your original codex/build component code continues unchanged */}
    </div>
  );
}

createRoot(
  document.getElementById('root')!
).render(<App />);