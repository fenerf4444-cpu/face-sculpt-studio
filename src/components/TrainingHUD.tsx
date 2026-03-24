import { motion } from 'framer-motion';
import { EvaluatorResult } from '@/types/exercises';

interface TrainingHUDProps {
  exerciseName: string;
  timeLeft: number;
  totalTime: number;
  rep: number;
  totalReps: number;
  evaluation: EvaluatorResult | null;
  combo: number;
  xp: number;
  isPaused: boolean;
}

export function TrainingHUD({
  exerciseName,
  timeLeft,
  totalTime,
  rep,
  totalReps,
  evaluation,
  combo,
  xp,
  isPaused,
}: TrainingHUDProps) {
  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const stateColor = evaluation?.uiStateColor || 'red';
  const colorMap = { red: 'bg-destructive', yellow: 'bg-neon-orange', green: 'bg-secondary' };
  const glowMap = { red: 'neon-glow-red', yellow: '', green: 'neon-glow-green' };

  return (
    <div className="absolute inset-x-0 top-0 z-20 pointer-events-none">
      {/* Top bar */}
      <div className="p-4 pointer-events-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="glass-card px-3 py-1.5">
            <span className="font-display text-xs font-bold text-foreground">{exerciseName}</span>
          </div>
          <div className="flex gap-2">
            {combo > 1 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="glass-card px-3 py-1.5 neon-glow-pink"
              >
                <span className="font-display text-xs font-bold text-neon-pink">🔥 {combo}x</span>
              </motion.div>
            )}
            <div className="glass-card px-3 py-1.5">
              <span className="font-display text-xs font-bold text-secondary">⚡ {xp} XP</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${colorMap[stateColor]}`}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Timer + Rep */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            Tekrar {rep}/{totalReps}
          </span>
          <span className={`font-display text-2xl font-black ${
            timeLeft <= 3 ? 'text-neon-red beat-pulse' : 'text-foreground'
          }`}>
            {Math.ceil(timeLeft)}
          </span>
        </div>
      </div>

      {/* Corrective hint */}
      {evaluation?.correctiveHintTr && !isPaused && (
        <motion.div
          key={evaluation.correctiveHintTr}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4"
        >
          <div className={`glass-card px-4 py-2 text-center ${glowMap[stateColor]}`}>
            <p className="text-sm font-semibold text-foreground">{evaluation.correctiveHintTr}</p>
          </div>
        </motion.div>
      )}

      {/* State indicator */}
      <div className="flex justify-center mt-3">
        <div className={`w-3 h-3 rounded-full ${colorMap[stateColor]} ${stateColor === 'green' ? 'beat-pulse' : ''}`} />
      </div>

      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-auto">
          <div className="text-center">
            <p className="font-display text-2xl font-black text-foreground">DURAKLADI</p>
            <p className="text-muted-foreground mt-2">Devam etmek için dokun</p>
          </div>
        </div>
      )}
    </div>
  );
}
