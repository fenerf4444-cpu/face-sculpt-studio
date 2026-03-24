export type ExerciseZone = 'forehead' | 'eyes' | 'cheeks' | 'lips' | 'jaw' | 'neck';
export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseCategory = 'auto' | 'hand-assisted' | 'guided';

export interface ExerciseDefinition {
  id: string;
  name: string;
  nameTr: string;
  zone: ExerciseZone;
  difficulty: ExerciseDifficulty;
  category: ExerciseCategory;
  description: string;
  descriptionTr: string;
  howTo: string;
  howToTr: string;
  commonMistakes: string[];
  commonMistakesTr: string[];
  holdDurationSec: number;
  reps: number;
  icon: string;
}

export interface EvaluatorResult {
  isDetected: boolean;
  accuracyScore: number;
  holdProgress: number;
  correctiveHint: string | null;
  correctiveHintTr: string | null;
  confidence: number;
  rawMetrics: Record<string, number>;
  uiStateColor: 'red' | 'yellow' | 'green';
}

export interface SessionScore {
  totalScore: number;
  xp: number;
  accuracy: number;
  holdScore: number;
  symmetryScore: number;
  rhythmScore: number;
  consistencyBonus: number;
  comboBonus: number;
  streakBonus: number;
}

export interface ExerciseResult {
  exerciseId: string;
  accuracyScore: number;
  holdSeconds: number;
  rhythmScore: number;
  symmetryScore: number;
  correctionCount: number;
  completed: boolean;
}

export type CameraStatus = 'checking' | 'ready' | 'no-camera' | 'no-permission' | 'error';
export type LightStatus = 'checking' | 'good' | 'low' | 'too-dark';
export type FaceStatus = 'searching' | 'detected' | 'too-close' | 'too-far' | 'not-found' | 'unstable';
export type TrackingConfidence = 'high' | 'medium' | 'low' | 'none';

export interface CompatibilityState {
  camera: CameraStatus;
  light: LightStatus;
  face: FaceStatus;
  tracking: TrackingConfidence;
  allReady: boolean;
}

export interface CalibrationData {
  neutral: Record<string, number> | null;
  smile: Record<string, number> | null;
  blink: Record<string, number> | null;
  mouthOpen: Record<string, number> | null;
  browRaise: Record<string, number> | null;
  cheekPuff: Record<string, number> | null;
  completed: boolean;
}

export type GameMode = 'quick-play' | 'guided-training' | 'gymfiesta' | 'chopstick' | 'mimic-lab' | 'zone-play';

export interface TrainingSession {
  id: string;
  mode: GameMode;
  exercises: ExerciseDefinition[];
  currentIndex: number;
  results: ExerciseResult[];
  startedAt: number;
  isPaused: boolean;
  isComplete: boolean;
}
