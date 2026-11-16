import type { EvaluatorResult } from '@/types/exercises';

interface TrainingHUDProps {
  exerciseName: string; exerciseId: string; timeLeft: number; totalTime: number;
  rep: number; totalReps: number; evaluation: EvaluatorResult | null;
  combo: number; xp: number; isPaused: boolean;
}

export function TrainingHUD({ exerciseName, timeLeft, totalTime, rep, totalReps, evaluation, xp, isPaused }: TrainingHUDProps) {
  return <div className="camera-toolbar">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0"><h2 className="text-sm font-bold break-words">{exerciseName}</h2><p className="text-xs text-muted-foreground mt-1">Set {rep}/{totalReps} · {xp} XP{isPaused ? ' · Duraklatıldı' : ''}</p></div>
      <p className="text-2xl font-bold tabular-nums shrink-0">{Math.max(0, Math.ceil(timeLeft))}<span className="text-xs font-normal text-muted-foreground ml-1">sn</span></p>
    </div>
    <progress className="camera-progress mt-2" max={totalTime} value={Math.max(0, totalTime - timeLeft)} aria-label="Set süresi" />
    {evaluation && <p className={`text-[11px] mt-1 ${evaluation.isDetected ? 'text-secondary' : 'text-muted-foreground'}`}>Hareket uyumu %{Math.round(evaluation.accuracyScore * 100)}</p>}
  </div>;
}