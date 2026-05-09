import type { ImprovementItem, Resource } from '../../shared/types';
import { stableId, unique } from './textUtils';

export function buildRecommendations(topic: string, weakConcepts: string[], resources: Resource[]) {
  const concepts = unique(weakConcepts).filter(Boolean).slice(0, 5);
  const focus = concepts.length ? concepts : resources.flatMap((resource) => resource.keyConcepts).slice(0, 3);
  return focus.map((concept) => `Revise ${concept} in the context of ${topic}`).concat([
    `Watch a beginner-friendly video lesson about ${topic}`,
    `Practice one short answer explaining ${topic} in your own words`,
    `Review the highest-ranked reading resource and write three key points`
  ]).slice(0, 6);
}

export function buildImprovementPlan(topic: string, weakConcepts: string[], resources: Resource[]): ImprovementItem[] {
  const recommendations = buildRecommendations(topic, weakConcepts, resources);
  return recommendations.map((text, index) => ({
    id: stableId('improve', `${topic}-${text}-${index}`),
    text,
    completed: false,
    category: index === 1 ? 'watch' : index === 2 ? 'practice' : index === 3 ? 'read' : 'revise'
  }));
}

export function nextReadings(resources: Resource[], weakConcepts: string[]) {
  const weak = weakConcepts.join(' ').toLowerCase();
  return resources
    .map((resource) => ({ resource, score: resource.relevanceScore + resource.credibilityScore + resource.keyConcepts.filter((concept) => weak.includes(concept.toLowerCase())).length * 10 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ resource }) => resource);
}
