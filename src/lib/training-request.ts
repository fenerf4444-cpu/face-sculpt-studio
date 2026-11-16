import type { ExerciseDefinition } from '@/types/exercises';

export interface TrainingRequest {
  title: string;
  exercises: ExerciseDefinition[];
  coachingTips?: Record<string, string>;
  personalized?: boolean;
}