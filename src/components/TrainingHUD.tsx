import { motion } from 'framer-motion';
import { EvaluatorResult } from '@/types/exercises';
import { exerciseIcons } from '@/assets/iconMap';
import { uiIcons } from '@/assets/iconMap';

interface TrainingHUDProps {
  exerciseName: string;
  exerciseId: string;
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
  exerciseId,
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
  const barColors = { red: 'from-red-500 to-red-600', yellow: 'from-orange-400 to-orange-500', green: 'from-green-400 to-emerald-500' };
  const glowClasses = { red: 'glow-red', yellow: 'glow-orange', green: 'glow-green' };
  const dotColors = { red: 'bg-destructive', yellow: 'bg-neon-orange', green: 'bg-secondary' };
  const iconSrc = exerciseIcons[exerciseId];

  return (
    <div className="absolute inset-x-0 top-0 z-20 pointer-events-none">
      <div className="p-4 pointer-events-auto">
        {/* Top info row */}
        <div className="flex items-center justify-between mb-3">
          <div className="card-3d-elevated px-3 py-2 flex items-center gap-2">
            {iconSrc && <img src={iconSrc} alt="" width={24} height={24} className="object-contain" />}
            <span className="font-display text-sm font-bold text-foreground">{exerciseName}</span>
          </div>
          <div className="flex gap-2">
            {combo > 1 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="card-3d-elevated px-3 py-2 glow-pink flex items-center gap-1.5"
              >
                <img src={uiIcons.streakFire} alt="" width={18} height={18} className="object-contain" />
                <span className="font-display text-sm font-bold text-neon-pink">{combo}x</span>
              </motion.div>
            )}
            <div className="card-3d-elevated px-3 py-2 flex items-center gap-1.5">
              <img src={uiIcons.xpBolt} alt="" width={18} height={18} className="object-contain" />
              <span className="font-display text-sm font-bold text-secondary">{xp}</span>
            </div>
          </div>
        </div>

        {/* 3D Progress bar */}
        <div className="card-3d-inset p-1 rounded-full">
          <div className="h-2 rounded-full overflow-hidden bg-transparent">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${barColors[stateColor]}`}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
              style={{ boxShadow: `0 0 12px hsl(${stateColor === 'green' ? '160 75% 42%' : stateColor === 'yellow' ? '25 95% 55%' : '350 85% 55%'} / 0.5)` }}
            />
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground font-display">
            TEKRAR {rep}/{totalReps}
          </span>
          <div className={`card-3d-elevated px-4 py-2 ${timeLeft <= 3 ? 'glow-red beat-pulse' : ''}`}>
            <span className="font-display text-3xl font-bold text-foreground">
              {Math.ceil(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* Corrective hint */}
      {evaluation?.correctiveHintTr && !isPaused && (
        <motion.div
          key={evaluation.correctiveHintTr}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-2"
        >
          <div className={`card-3d-elevated px-4 py-3 text-center ${glowClasses[stateColor]}`}>
            <p className="text-sm font-display font-bold text-foreground">{evaluation.correctiveHintTr}</p>
          </div>
        </motion.div>
      )}

      {/* State dot */}
      <div className="flex justify-center mt-3">
        <div className={`w-3 h-3 rounded-full ${dotColors[stateColor]} ${stateColor === 'green' ? 'beat-pulse' : ''}`}
          style={{ boxShadow: `0 0 12px hsl(${stateColor === 'green' ? '160 75% 42%' : stateColor === 'yellow' ? '25 95% 55%' : '350 85% 55%'} / 0.5)` }}
        />
      </div>

      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/85 backdrop-blur-lg pointer-events-auto">
          <div className="text-center card-3d-elevated p-8 glow-red">
            <p className="font-display text-3xl font-bold text-foreground">DURAKLADI</p>
            <p className="text-muted-foreground mt-3 text-sm">Devam etmek icin dokun</p>
          </div>
        </div>
      )}
    </div>
  );
}
