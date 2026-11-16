import { EXERCISES } from '@/data/exercises';
import type { TrainingRequest } from './training-request';

export interface PersonalSession {
  title: string;
  summary: string;
  safetyNote: string;
  items: { exerciseId: string; rationale: string; coachingTip: string }[];
}

export function toTrainingRequest(session: PersonalSession): TrainingRequest {
  if (!session.items.length || session.items.length > 5) throw new Error('Seans 1–5 hareket içermeli.');
  const seen = new Set<string>();
  const exercises = session.items.map(item => {
    const exercise = EXERCISES.find(e => e.id === item.exerciseId && e.category === 'auto' && e.id !== 'pencil-hold');
    if (!exercise || seen.has(item.exerciseId)) throw new Error('Seanstaki hareketler doğrulanamadı.');
    seen.add(item.exerciseId);
    return { ...exercise, reps: 3, holdDurationSec: 30 };
  });
  return {
    title: session.title,
    exercises,
    personalized: true,
    coachingTips: Object.fromEntries(session.items.map(item => [item.exerciseId, item.coachingTip])),
  };
}