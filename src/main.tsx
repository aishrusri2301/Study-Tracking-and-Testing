import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatePresence, motion } from 'framer-motion';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BookOpen, Bot, CheckCircle2, Download, Heart, Moon, PlayCircle, Printer, Sparkles, Star, Sun, Trophy, Volume2 } from 'lucide-react';
import type { ImprovementItem, LearningProfile, QuizQuestion, QuizResult, Resource } from '../shared/types';
import { analytics, pastelSubjects, sampleProfile, sampleQuestions, sampleResources } from './data/sampleData';
import './styles/app.css';

const apiUrl = import.meta.env.VITE_API_URL || '/api';

type Screen = 'landing' | 'onboarding' | 'topic' | 'resources' | 'quiz' | 'results' | 'dashboard' | 'parent' | 'settings';

function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [dark, setDark] = useState(false);
  const [profile, setProfile] = useState<LearningProfile>(sampleProfile);
  const [resources, setResources] = useState<Resource[]>(sampleResources);
  const [questions, setQuestions] = useState<QuizQuestion[]>(sampleQuestions);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [checklist, setChecklist] = useState<ImprovementItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>(['r2']);
  const [buddyMessages, setBuddyMessages] = useState([{ from: 'buddy', text: 'Hi! I’m Spark, your study buddy. Ask me for hints, simpler explanations, or mistake help. ✨' }]);

  async function generateLearningPath() {
    setScreen('resources');
    try {
      const response = await fetch(`${apiUrl}/learning/quiz`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile }) });
      const data = await response.json();
      setResources(data.resources || sampleResources);
      setQuestions(data.questions || sampleQuestions);
    } catch {
      setResources(sampleResources);
      setQuestions(sampleQuestions);
    }
  }

  async function submitQuiz() {
    try {
      const response = await fetch(`${apiUrl}/learning/grade`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers, questions, resources, topic: profile.topic }) });
      const data = await response.json();
      setResult(data.result);
      setChecklist(data.result.improvementPlan);
    } catch {
      const fallback = {
        overallScore: 84,
        letterGrade: 'A',
        mastery: 84,
        strengths: ['definition', 'sunlight role', 'oxygen release'],
        weakAreas: ['diagram labels', 'raw materials'],
        recommendations: ['Revise the definition', 'Practice diagram labeling', 'Watch a beginner video', 'Solve 5 more questions'],
        readings: resources,
        improvementPlan: ['Revise photosynthesis definition', 'Practice diagram labeling', 'Watch beginner video', 'Review chapter summary again'].map((text, index) => ({ id: `c${index}`, text, completed: false, category: 'revise' as const }))
      };
      setResult(fallback);
      setChecklist(fallback.improvementPlan);
    }
    setScreen('results');
  }

  function speak(text: string) {
    if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  async function askBuddy(message: string) {
    setBuddyMessages((items) => [...items, { from: 'student', text: message }]);
    try {
      const response = await fetch(`${apiUrl}/learning/buddy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, topic: profile.topic }) });
      const data = await response.json();
      setBuddyMessages((items) => [...items, { from: 'buddy', text: data.reply }]);
    } catch {
      setBuddyMessages((items) => [...items, { from: 'buddy', text: `Try breaking ${profile.topic} into tiny steps. You’ve got this! 🌟` }]);
    }
  }

  return <div className={dark ? 'app dark' : 'app'}>
    <Nav screen={screen} setScreen={setScreen} dark={dark} setDark={setDark} />
    <AnimatePresence mode="wait">
      <motion.main key={screen} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
        {screen === 'landing' && <Landing start={() => setScreen('onboarding')} />}
        {screen === 'onboarding' && <Onboarding profile={profile} setProfile={setProfile} next={() => setScreen('topic')} />}
        {screen === 'topic' && <TopicInput profile={profile} setProfile={setProfile} generate={generateLearningPath} />}
        {screen === 'resources' && <Resources profile={profile} resources={resources} favorites={favorites} setFavorites={setFavorites} speak={speak} start={() => setScreen('quiz')} />}
        {screen === 'quiz' && <Quiz questions={questions} answers={answers} setAnswers={setAnswers} submit={submitQuiz} />}
        {screen === 'results' && result && <Results result={result} checklist={checklist} setChecklist={setChecklist} goDashboard={() => setScreen('dashboard')} />}
        {screen === 'dashboard' && <Dashboard />}
        {screen === 'parent' && <ParentDashboard />}
        {screen === 'settings' && <Settings dark={dark} setDark={setDark} />}
      </motion.main>
    </AnimatePresence>
    <StudyBuddy messages={buddyMessages} ask={askBuddy} />
  </div>;
}

function Nav({ screen, setScreen, dark, setDark }: { screen: Screen; setScreen: (s: Screen) => void; dark: boolean; setDark: (v: boolean) => void }) {
  const items: Screen[] = ['landing', 'topic', 'dashboard', 'parent', 'settings'];
  return <header className="nav"><button className="brand" onClick={() => setScreen('landing')}><Sparkles /> StudySpark</button><nav>{items.map((item) => <button className={screen === item ? 'active' : ''} onClick={() => setScreen(item)} key={item}>{item}</button>)}</nav><button className="icon-btn" aria-label="Toggle dark mode" onClick={() => setDark(!dark)}>{dark ? <Sun /> : <Moon />}</button></header>;
}

function Landing({ start }: { start: () => void }) {
  return <section className="hero"><div><p className="eyebrow">AI-powered learning companion</p><h1>Learn tricky topics with a cheerful buddy, smart quizzes, and parent-friendly progress.</h1><p className="hero-copy">StudySpark curates child-friendly resources, generates adaptive practice, grades ideas semantically, and turns mistakes into a playful improvement plan.</p><div className="hero-actions"><button className="primary" onClick={start}>Start learning <PlayCircle /></button><button className="secondary" onClick={() => window.print()}><Printer /> Printable report</button></div></div><div className="mascot-card"><div className="mascot">🦊</div><h2>Today’s challenge</h2><p>Master photosynthesis and earn the Leaf Legend badge.</p><Progress value={72} /></div></section>;
}

function Onboarding({ profile, setProfile, next }: { profile: LearningProfile; setProfile: (p: LearningProfile) => void; next: () => void }) {
  return <section className="panel narrow"><h2>Tell us about your class</h2><div className="grid two"><Field label="Grade/Class" value={profile.grade} onChange={(grade) => setProfile({ ...profile, grade })} /><Select label="Education Board" value={profile.board} options={['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE']} onChange={(board) => setProfile({ ...profile, board })} /><Select label="Subject" value={profile.subject} options={['Science', 'Math', 'English', 'Social Studies']} onChange={(subject) => setProfile({ ...profile, subject })} /><Select label="Starting difficulty" value={profile.difficulty || 'balanced'} options={['gentle', 'balanced', 'challenge']} onChange={(difficulty) => setProfile({ ...profile, difficulty: difficulty as LearningProfile['difficulty'] })} /></div><button className="primary" onClick={next}>Continue</button></section>;
}

function TopicInput({ profile, setProfile, generate }: { profile: LearningProfile; setProfile: (p: LearningProfile) => void; generate: () => void }) {
  return <section className="topic-layout"><div className="panel"><h2>What shall we learn today?</h2><Field label="Topic" value={profile.topic} onChange={(topic) => setProfile({ ...profile, topic })} /><div className="chips">{['Photosynthesis', 'Fractions', 'Tenses', 'Maps', 'Electricity'].map((topic) => <button onClick={() => setProfile({ ...profile, topic })} key={topic}>{topic}</button>)}</div><button className="primary" onClick={generate}>Find resources + make quiz <Sparkles /></button></div><div className="panel eli10"><h3>Explain Like I’m 10 mode</h3><p>Every topic can be simplified into tiny steps, examples, diagrams, and friendly hints.</p></div></section>;
}

function Resources({ profile, resources, favorites, setFavorites, speak, start }: { profile: LearningProfile; resources: Resource[]; favorites: string[]; setFavorites: (ids: string[]) => void; speak: (t: string) => void; start: () => void }) {
  return <section><SectionTitle title={`${profile.topic} resources`} subtitle="Ranked for syllabus fit, child-friendliness, difficulty, and credibility." /><div className="resource-grid">{resources.map((resource) => <article className="resource-card" key={resource.id}><div className="resource-top"><span>{resource.type}</span><button className="icon-btn" onClick={() => setFavorites(favorites.includes(resource.id) ? favorites.filter((id) => id !== resource.id) : [...favorites, resource.id])}><Heart fill={favorites.includes(resource.id) ? '#ff7aaa' : 'none'} /></button></div><h3>{resource.title}</h3><p>{resource.summary}</p><div className="score-row"><Badge label={`Relevance ${resource.relevanceScore}%`} /><Badge label={resource.difficulty} /><Badge label={resource.provider} /></div><div className="card-actions"><a href={resource.url} target="_blank">Open resource</a><button onClick={() => speak(resource.summary)}><Volume2 /> Read aloud</button></div></article>)}</div><button className="primary floating-action" onClick={start}>Start adaptive quiz</button></section>;
}

function Quiz({ questions, answers, setAnswers, submit }: { questions: QuizQuestion[]; answers: Record<string, string>; setAnswers: (a: Record<string, string>) => void; submit: () => void }) {
  const answered = Object.keys(answers).filter((id) => answers[id]).length;
  return <section><SectionTitle title="Adaptive quiz" subtitle="MCQs grade instantly. Short answers are checked for concepts, not exact wording." /><Progress value={Math.round((answered / questions.length) * 100)} /><div className="quiz-list">{questions.map((q, index) => <article className="question-card" key={q.id}><span className="question-number">Question {index + 1}</span><h3>{q.prompt}</h3>{q.type === 'mcq' ? <div className="options">{q.options?.map((option) => <button className={answers[q.id] === option ? 'selected' : ''} onClick={() => setAnswers({ ...answers, [q.id]: option })} key={option}>{option}{answers[q.id] === option && option === q.correctAnswer ? ' ✅' : ''}</button>)}</div> : <textarea rows={4} placeholder="Type your answer in your own words..." value={answers[q.id] || ''} onChange={(event) => setAnswers({ ...answers, [q.id]: event.target.value })} />}</article>)}</div><button className="primary floating-action" onClick={submit}>Submit quiz</button></section>;
}

function Results({ result, checklist, setChecklist, goDashboard }: { result: QuizResult; checklist: ImprovementItem[]; setChecklist: (items: ImprovementItem[]) => void; goDashboard: () => void }) {
  return <section><SectionTitle title="Your learning report" subtitle="Mistakes are clues. Here is your next best path." /><div className="results-grid"><div className="score-card"><Trophy /><h2>{result.overallScore}%</h2><p>Grade {result.letterGrade} · {result.mastery}% mastery</p><Progress value={result.mastery} /></div><InfoList title="Strengths" items={result.strengths} /><InfoList title="Weak areas" items={result.weakAreas} /><InfoList title="Recommendations" items={result.recommendations} /></div><div className="panel"><h2>Checklist improvement plan</h2>{checklist.map((item) => <label className="check-row" key={item.id}><input type="checkbox" checked={item.completed} onChange={() => setChecklist(checklist.map((current) => current.id === item.id ? { ...current, completed: !current.completed } : current))} /><span>{item.text}</span></label>)}<button className="secondary" onClick={goDashboard}><Download /> View dashboard</button></div></section>;
}

function Dashboard() {
  return <section><SectionTitle title="Student analytics dashboard" subtitle="Live report card, progress trends, mastery heatmap, streaks, and recommendations." /><div className="dashboard-grid"><Metric title="Accuracy" value={`${analytics.accuracy}%`} icon={<CheckCircle2 />} /><Metric title="Avg response" value={`${analytics.averageResponseTime}s`} icon={<Star />} /><Metric title="Streak" value={`${analytics.streak} days`} icon={<Trophy />} /><div className="panel chart"><h3>Daily progress</h3><ResponsiveContainer width="100%" height={210}><AreaChart data={analytics.dailyProgress}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis /><Tooltip /><Area dataKey="minutes" stroke="#8f7cf6" fill="#d8d0ff" /><Area dataKey="accuracy" stroke="#55caa0" fill="#c7f7df" /></AreaChart></ResponsiveContainer></div><div className="panel chart"><h3>Weekly improvement</h3><ResponsiveContainer width="100%" height={210}><LineChart data={analytics.weeklyTrends}><XAxis dataKey="week" /><YAxis /><Tooltip /><Line dataKey="mastery" stroke="#ff9cc8" strokeWidth={4} /></LineChart></ResponsiveContainer></div><div className="panel chart"><h3>Report card</h3><ResponsiveContainer width="100%" height={210}><BarChart data={analytics.reportCard}><XAxis dataKey="subject" /><YAxis /><Tooltip /><Bar dataKey="score">{analytics.reportCard.map((_, i) => <Cell key={i} fill={pastelSubjects[i]?.color || '#ddd'} />)}</Bar></BarChart></ResponsiveContainer></div><div className="panel heatmap"><h3>Topic mastery heatmap</h3>{analytics.masteryHeatmap.map((item) => <div className="heat" key={item.topic}><span>{item.subject}: {item.topic}</span><Progress value={item.mastery} /></div>)}</div><div className="panel"><h3>Recent quizzes</h3>{analytics.recentQuizzes.map((quiz) => <p className="recent" key={quiz.topic}>{quiz.subject} · {quiz.topic}<strong>{quiz.score}%</strong></p>)}</div></div></section>;
}

function ParentDashboard() {
  return <section className="panel"><h2>Parent progress summary</h2><p>Mia is on a 9-day improvement streak and is strongest in English and Science. Fractions and map skills need short daily practice.</p><div className="grid three"><InfoList title="Wins" items={['Completed 3 quizzes this week', 'Science mastery +6%', 'Earned Diagram Hero badge']} /><InfoList title="Next steps" items={['Read one note together', 'Practice fractions for 10 minutes', 'Print weekly report card']} /><InfoList title="Badges" items={analytics.badges} /></div><button className="secondary" onClick={() => window.print()}><Printer /> Print report card</button></section>;
}

function Settings({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  return <section className="panel narrow"><h2>Profile & accessibility</h2><label className="check-row"><input type="checkbox" checked={dark} onChange={() => setDark(!dark)} /> Dark mode</label><label className="check-row"><input type="checkbox" defaultChecked /> Voice reading enabled</label><label className="check-row"><input type="checkbox" defaultChecked /> Friendly encouragement</label><label className="check-row"><input type="checkbox" /> Reduce motion</label></section>;
}

function StudyBuddy({ messages, ask }: { messages: { from: string; text: string }[]; ask: (m: string) => void }) {
  const [open, setOpen] = useState(false); const [text, setText] = useState('');
  return <div className={open ? 'buddy open' : 'buddy'}><button className="buddy-toggle" onClick={() => setOpen(!open)}><Bot /> Study Buddy</button>{open && <div className="buddy-panel"><div className="messages">{messages.map((m, i) => <p className={m.from} key={i}>{m.text}</p>)}</div><form onSubmit={(e) => { e.preventDefault(); if (text.trim()) { ask(text); setText(''); } }}><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask for a hint..." /><button>Send</button></form></div>}</div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { return <label className="field"><span>{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
function Select({ label, value, options, onChange }: { label: string; value?: string; options: string[]; onChange: (v: string) => void }) { return <label className="field"><span>{label}</span><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o}>{o}</option>)}</select></label>; }
function Progress({ value }: { value: number }) { return <div className="progress" aria-label={`Progress ${value}%`}><span style={{ width: `${value}%` }} /></div>; }
function Badge({ label }: { label: string }) { return <span className="badge">{label}</span>; }
function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div className="section-title"><h1>{title}</h1><p>{subtitle}</p></div>; }
function InfoList({ title, items }: { title: string; items: string[] }) { return <div className="panel mini"><h3>{title}</h3>{items.map((item) => <p key={item}>• {item}</p>)}</div>; }
function Metric({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) { return <div className="metric">{icon}<span>{title}</span><strong>{value}</strong></div>; }

createRoot(document.getElementById('root')!).render(<App />);
