import OpenAI from 'openai';
import type { LearningProfile, Resource } from '../../shared/types';
import { gradeBand, keywords, sentenceSplit, stableId, unique } from './textUtils';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

interface WikipediaSummary {
  title?: string;
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
  thumbnail?: { source?: string };
}

interface DuckDuckGoResponse {
  AbstractText?: string;
  AbstractURL?: string;
  Heading?: string;
  RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Name?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> }>;
}

export function buildSearchQuery(profile: LearningProfile, intent = 'beginner explanation') {
  return `${profile.board} Grade ${profile.grade} ${profile.subject} ${profile.topic} ${intent}`.replace(/\s+/g, ' ').trim();
}

export async function gatherResources(profile: LearningProfile): Promise<Resource[]> {
  const query = buildSearchQuery(profile);
  const [wiki, duck] = await Promise.allSettled([fetchWikipedia(profile), fetchDuckDuckGo(query)]);
  const resources: Resource[] = [];
  const wikiSummary = wiki.status === 'fulfilled' ? wiki.value : undefined;
  if (wikiSummary?.extract) {
    const concepts = deriveConcepts(profile, wikiSummary.extract);
    resources.push(toResource({
      profile,
      type: 'explanation',
      provider: 'Wikipedia',
      title: wikiSummary.title || profile.topic,
      url: wikiSummary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(profile.topic)}`,
      summary: await summarizeForChild(profile, wikiSummary.extract),
      sourceText: wikiSummary.extract,
      imageUrl: wikiSummary.thumbnail?.source,
      concepts,
      credibility: 88
    }));
    if (wikiSummary.thumbnail?.source) {
      resources.push(toResource({
        profile,
        type: 'diagram',
        provider: 'Wikimedia',
        title: `${profile.topic} visual reference`,
        url: wikiSummary.content_urls?.desktop?.page || wikiSummary.thumbnail.source,
        summary: `A visual reference connected to ${profile.topic}, useful for labeling, recall, and quick revision.`,
        sourceText: wikiSummary.extract,
        imageUrl: wikiSummary.thumbnail.source,
        concepts,
        credibility: 86
      }));
    }
  }

  const duckData = duck.status === 'fulfilled' ? duck.value : undefined;
  if (duckData?.AbstractText) {
    resources.push(toResource({
      profile,
      type: 'reading',
      provider: 'DuckDuckGo educational summary',
      title: duckData.Heading || `${profile.topic} overview`,
      url: duckData.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      summary: await summarizeForChild(profile, duckData.AbstractText),
      sourceText: duckData.AbstractText,
      concepts: deriveConcepts(profile, duckData.AbstractText),
      credibility: 82
    }));
  }

  flattenRelatedTopics(duckData).slice(0, 3).forEach((topic, index) => {
    const summary = topic.Text || `${profile.topic} supporting reading`;
    resources.push(toResource({
      profile,
      type: index === 0 ? 'notes' : 'reading',
      provider: 'Public web index',
      title: summary.split(' - ')[0].slice(0, 90),
      url: topic.FirstURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      summary,
      sourceText: summary,
      concepts: deriveConcepts(profile, summary),
      credibility: 74
    }));
  });

  resources.push(...dynamicSearchResources(profile));
  const uniqueResources = dedupe(resources).map((resource) => ({ ...resource, relevanceScore: scoreRelevance(resource, profile) }));
  return uniqueResources.sort((a, b) => totalScore(b) - totalScore(a)).slice(0, 9);
}

export function combinedResourceText(resources: Resource[]) {
  return resources.map((resource) => `${resource.title}. ${resource.summary}. ${resource.keyConcepts.join(', ')}`).join('\n');
}

async function fetchWikipedia(profile: LearningProfile): Promise<WikipediaSummary | undefined> {
  const search = await fetch(`https://en.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(profile.topic)}&limit=1`, { headers: { 'User-Agent': 'StudySparkLearningCompanion/1.0' } });
  if (!search.ok) return undefined;
  const searchData = await search.json() as { pages?: Array<{ title: string; key: string }> };
  const page = searchData.pages?.[0];
  if (!page) return undefined;
  const summary = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.key || page.title)}`, { headers: { 'User-Agent': 'StudySparkLearningCompanion/1.0' } });
  if (!summary.ok) return undefined;
  return summary.json() as Promise<WikipediaSummary>;
}

async function fetchDuckDuckGo(query: string): Promise<DuckDuckGoResponse | undefined> {
  const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
  if (!response.ok) return undefined;
  return response.json() as Promise<DuckDuckGoResponse>;
}

async function summarizeForChild(profile: LearningProfile, text: string) {
  const sentences = sentenceSplit(text).slice(0, 4).join(' ');
  if (!openai) return sentences || text.slice(0, 420);
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Summarize educational content for school children. Be accurate, concise, safe, and grade appropriate.' },
      { role: 'user', content: `Grade: ${profile.grade}\nBoard: ${profile.board}\nSubject: ${profile.subject}\nTopic: ${profile.topic}\nText: ${text.slice(0, 3500)}\nReturn a 3 sentence beginner-friendly summary.` }
    ],
    temperature: 0.2
  });
  return completion.choices[0]?.message?.content?.trim() || sentences;
}

function dynamicSearchResources(profile: LearningProfile): Resource[] {
  const base = buildSearchQuery(profile);
  const encoded = encodeURIComponent(base);
  const topicEncoded = encodeURIComponent(`${profile.topic} ${profile.subject}`);
  const grade = gradeBand(profile.grade);
  return [
    toResource({ profile, type: 'video', provider: 'YouTube Education Search', title: `${profile.topic} educational videos`, url: `https://www.youtube.com/results?search_query=${encoded}+lesson`, summary: `Video lessons matching ${profile.board} Grade ${profile.grade} ${profile.subject}: ${profile.topic}.`, sourceText: base, concepts: deriveConcepts(profile, base), credibility: 76 }),
    toResource({ profile, type: 'practice', provider: 'Khan Academy Search', title: `${profile.topic} practice and worked examples`, url: `https://www.khanacademy.org/search?page_search_query=${topicEncoded}`, summary: `Practice search for worked examples and exercises connected to ${profile.topic}.`, sourceText: base, concepts: deriveConcepts(profile, base), credibility: 90 }),
    toResource({ profile, type: 'notes', provider: `${profile.board} syllabus search`, title: `${profile.board} Grade ${profile.grade} ${profile.subject} notes for ${profile.topic}`, url: `https://www.google.com/search?q=${encoded}+notes+open+educational+resources`, summary: `Board-aligned notes search for ${profile.topic}, filtered by ${grade} difficulty and public educational resources.`, sourceText: base, concepts: deriveConcepts(profile, base), credibility: 78 }),
    toResource({ profile, type: 'diagram', provider: 'Open image search', title: `${profile.topic} diagrams and visual aids`, url: `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(profile.topic)}&title=Special:MediaSearch&type=image`, summary: `Open-license visual references for diagrams, timelines, charts, or concept maps related to ${profile.topic}.`, sourceText: base, concepts: deriveConcepts(profile, base), credibility: 80 })
  ];
}

function deriveConcepts(profile: LearningProfile, text: string) {
  return unique([...keywords(`${profile.topic} ${profile.subject} ${text}`, 10), profile.topic.toLowerCase()]).slice(0, 8);
}

function toResource(input: { profile: LearningProfile; type: Resource['type']; provider: string; title: string; url: string; summary: string; sourceText: string; concepts: string[]; credibility: number; imageUrl?: string }): Resource {
  const difficulty = gradeBand(input.profile.grade) as Resource['difficulty'];
  const friendliness = difficulty === 'beginner' ? 92 : difficulty === 'intermediate' ? 84 : 76;
  return {
    id: stableId('resource', `${input.provider}-${input.url}-${input.profile.topic}`),
    title: input.title,
    type: input.type,
    provider: input.provider,
    url: input.url,
    summary: input.summary,
    childFriendlyScore: friendliness,
    relevanceScore: 70,
    credibilityScore: input.credibility,
    difficulty,
    tags: input.concepts.slice(0, 5),
    keyConcepts: input.concepts,
    imageUrl: input.imageUrl,
    searchQuery: buildSearchQuery(input.profile)
  };
}

function flattenRelatedTopics(data?: DuckDuckGoResponse) {
  return (data?.RelatedTopics || []).flatMap((item) => item.Topics?.length ? item.Topics : [item]).filter((item): item is { Text?: string; FirstURL?: string } => Boolean(item.Text || item.FirstURL));
}

function scoreRelevance(resource: Resource, profile: LearningProfile) {
  const haystack = `${resource.title} ${resource.summary} ${resource.tags.join(' ')}`.toLowerCase();
  const topicTerms = keywords(`${profile.topic} ${profile.subject} ${profile.board}`, 8);
  const matches = topicTerms.filter((term) => haystack.includes(term)).length;
  return Math.min(99, 62 + matches * 7 + (resource.provider.toLowerCase().includes('khan') ? 6 : 0) + (resource.provider.toLowerCase().includes('wikipedia') ? 5 : 0));
}

function totalScore(resource: Resource) {
  return resource.relevanceScore * 0.45 + resource.childFriendlyScore * 0.25 + resource.credibilityScore * 0.3;
}

function dedupe(resources: Resource[]) {
  const seen = new Set<string>();
  return resources.filter((resource) => {
    const key = `${resource.provider}-${resource.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
