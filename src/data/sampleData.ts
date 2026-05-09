import type { AnalyticsSnapshot, LearningProfile, QuizQuestion, Resource } from '../../shared/types';

export const pastelSubjects = [
  { name: 'Science', color: '#b7f7d4', icon: '🧪' },
  { name: 'Math', color: '#c9dcff', icon: '🧮' },
  { name: 'English', color: '#ffd6e8', icon: '📚' },
  { name: 'Social Studies', color: '#ffe7ad', icon: '🌏' }
];

export const sampleProfile: LearningProfile = {
  grade: '6',
  subject: 'Science',
  board: 'CBSE',
  topic: 'Photosynthesis',
  difficulty: 'balanced'
};

export const sampleResources: Resource[] = [
  {
    id: 'r1',
    title: 'Photosynthesis explained with a leaf kitchen analogy',
    type: 'explanation',
    provider: 'StudySpark Curated Notes',
    url: 'https://www.khanacademy.org/science/biology/photosynthesis-in-plants',
    summary: 'A friendly explanation of how plants use sunlight, carbon dioxide, and water to make glucose and oxygen.',
    childFriendlyScore: 96,
    relevanceScore: 94,
    credibilityScore: 92,
    difficulty: 'beginner',
    tags: ['chlorophyll', 'sunlight', 'glucose']
  },
  {
    id: 'r2',
    title: 'Labeled photosynthesis diagram practice',
    type: 'diagram',
    provider: 'NCERT-style Visual Lab',
    url: 'https://ncert.nic.in/textbook.php',
    summary: 'A simple diagram showing sunlight, water, carbon dioxide, oxygen, and food movement through a plant.',
    childFriendlyScore: 93,
    relevanceScore: 98,
    credibilityScore: 95,
    difficulty: 'beginner',
    tags: ['diagram', 'labeling', 'leaf']
  },
  {
    id: 'r3',
    title: 'Beginner video: how plants make food',
    type: 'video',
    provider: 'Educational Video Pick',
    url: 'https://www.youtube.com/education',
    summary: 'Short visual lesson with animations and a quick recap quiz at the end.',
    childFriendlyScore: 91,
    relevanceScore: 89,
    credibilityScore: 86,
    difficulty: 'beginner',
    tags: ['video', 'animation', 'recap']
  },
  {
    id: 'r4',
    title: 'Five practice questions on photosynthesis',
    type: 'practice',
    provider: 'StudySpark Practice Bank',
    url: '#practice',
    summary: 'Gentle practice covering definition, raw materials, products, and why leaves are green.',
    childFriendlyScore: 97,
    relevanceScore: 93,
    credibilityScore: 90,
    difficulty: 'intermediate',
    tags: ['practice', 'quiz', 'revision']
  }
];

export const sampleQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    type: 'mcq',
    prompt: 'Which part of a plant usually contains the most chlorophyll?',
    options: ['Roots', 'Leaves', 'Flowers', 'Seeds'],
    correctAnswer: 'Leaves',
    explanation: 'Leaves are green because they contain chlorophyll, which helps capture sunlight.',
    concepts: ['chlorophyll', 'leaves'],
    difficulty: 1
  },
  {
    id: 'q2',
    type: 'mcq',
    prompt: 'What gas do plants take in for photosynthesis?',
    options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'],
    correctAnswer: 'Carbon dioxide',
    explanation: 'Plants take in carbon dioxide from the air and release oxygen.',
    concepts: ['carbon dioxide'],
    difficulty: 1
  },
  {
    id: 'q3',
    type: 'mcq',
    prompt: 'What is the food made by plants during photosynthesis?',
    options: ['Protein', 'Glucose', 'Salt', 'Chalk'],
    correctAnswer: 'Glucose',
    explanation: 'The simple sugar glucose stores energy for the plant.',
    concepts: ['glucose'],
    difficulty: 2
  },
  {
    id: 'q4',
    type: 'mcq',
    prompt: 'Which energy source powers photosynthesis?',
    options: ['Moonlight', 'Sunlight', 'Sound', 'Wind'],
    correctAnswer: 'Sunlight',
    explanation: 'Sunlight gives plants the energy needed to make food.',
    concepts: ['sunlight'],
    difficulty: 1
  },
  {
    id: 'q5',
    type: 'mcq',
    prompt: 'Which gas is released by plants during photosynthesis?',
    options: ['Oxygen', 'Carbon dioxide', 'Smoke', 'Hydrogen'],
    correctAnswer: 'Oxygen',
    explanation: 'Oxygen is released as a useful product of photosynthesis.',
    concepts: ['oxygen'],
    difficulty: 1
  },
  ...['Define photosynthesis in your own words.', 'Why are leaves called food factories?', 'Name two raw materials needed by plants.', 'Explain why sunlight is important for photosynthesis.', 'How does photosynthesis help animals and humans?'].map((prompt, index) => ({
    id: `s${index + 1}`,
    type: 'short' as const,
    prompt,
    correctAnswer: 'Plants use sunlight, carbon dioxide, and water with chlorophyll to make glucose and release oxygen.',
    explanation: 'A strong answer mentions sunlight, raw materials, food/glucose, and oxygen.',
    concepts: ['sunlight', 'carbon dioxide', 'water', 'glucose', 'oxygen'],
    difficulty: index < 2 ? 1 : 2
  }))
];

export const analytics: AnalyticsSnapshot = {
  reportCard: [
    { subject: 'Science', score: 88, grade: 'A', trend: 6 },
    { subject: 'Math', score: 81, grade: 'B+', trend: 4 },
    { subject: 'English', score: 93, grade: 'A+', trend: 2 },
    { subject: 'Social Studies', score: 76, grade: 'B', trend: -1 }
  ],
  dailyProgress: [
    { day: 'Mon', minutes: 18, accuracy: 74 },
    { day: 'Tue', minutes: 26, accuracy: 82 },
    { day: 'Wed', minutes: 20, accuracy: 79 },
    { day: 'Thu', minutes: 34, accuracy: 88 },
    { day: 'Fri', minutes: 29, accuracy: 91 },
    { day: 'Sat', minutes: 41, accuracy: 93 }
  ],
  weeklyTrends: [
    { week: 'W1', mastery: 62 },
    { week: 'W2', mastery: 69 },
    { week: 'W3', mastery: 78 },
    { week: 'W4', mastery: 86 }
  ],
  masteryHeatmap: [
    { subject: 'Science', topic: 'Photosynthesis', mastery: 88 },
    { subject: 'Science', topic: 'Respiration', mastery: 72 },
    { subject: 'Math', topic: 'Fractions', mastery: 81 },
    { subject: 'Math', topic: 'Decimals', mastery: 67 },
    { subject: 'English', topic: 'Tenses', mastery: 92 },
    { subject: 'Social Studies', topic: 'Maps', mastery: 74 }
  ],
  accuracy: 86,
  averageResponseTime: 42,
  recentQuizzes: [
    { topic: 'Photosynthesis', subject: 'Science', score: 88, date: 'Today' },
    { topic: 'Fractions', subject: 'Math', score: 80, date: 'Yesterday' },
    { topic: 'Tenses', subject: 'English', score: 94, date: '2 days ago' }
  ],
  streak: 9,
  badges: ['Curious Koala', 'Diagram Hero', '7-Day Spark']
};
