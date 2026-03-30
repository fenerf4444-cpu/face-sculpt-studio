import { motion } from 'framer-motion';
import { EvaluatorResult } from '@/types/exercises';
import { exerciseIcons, uiIcons } from '@/assets/iconMap';

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
  exerciseName, exerciseId, timeLeft, totalTime,
  rep, totalReps, evaluation, combo, xp, isPaused,
}: TrainingHUDProps) {
  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const stateColor = evaluation?.uiStateColor || 'red';
  const barColors = { red: 'from-red-500 to-red-600', yellow: 'from-orange-400 to-orange-500', green: 'from-green-400 to-emerald-500' };
  const glowClasses = { red: 'glow-red', yellow: 'glow-orange', green: 'glow-green' };
  const iconSrc = exerciseIcons[exerciseId];
  const timeDisplay = Math.max(0, timeLeft).toFixed(1);

  return (
    <div className="absolute inset-x-0 top-0 z-20 pointer-events-none">
      <div className="p-3 pointer-events-auto">
        {/* Top row: name + XP */}
        <div className="flex items-center justify-between mb-2">
          <div className="card-3d-elevated px-2.5 py-1.5 flex items-center gap-1.5">
            {iconSrc && <img src={iconSrc} alt="" width={20} height={20} className="object-contain" />}
            <span className="font-display text-xs font-bold text-foreground">{exerciseName}</span>
          </div>
          <div className="flex gap-1.5">
            {combo > 1 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="card-3d-elevated px-2 py-1 glow-pink flex items-center gap-1">
                <img src={uiIcons.streakFire} alt="" width={14} height={14} className="object-contain" />
                <span className="font-display text-xs font-bold text-neon-pink">{combo}x</span>
              </motion.div>
            )}
            <div className="card-3d-elevated px-2 py-1 flex items-center gap-1">
              <img src={uiIcons.xpBolt} alt="" width={14} height={14} className="object-contain" />
              <span className="font-display text-xs font-bold text-secondary">{xp}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="card-3d-inset p-0.5 rounded-full">
          <div className="h-1.5 rounded-full overflow-hidden bg-transparent">
            <motion.div className={`h-full rounded-full bg-gradient-to-r ${barColors[stateColor]}`}
              animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>

        {/* Timer + Set */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-muted-foreground font-display">SET {rep}/{totalReps}</span>
          <div className={`card-3d-elevated px-3 py-1.5 ${timeLeft <= 5 ? 'glow-red beat-pulse' : ''}`}>
            <span className="font-display text-2xl font-bold text-foreground tabular-nums">{timeDisplay}</span>
            <span className="text-[10px] text-muted-foreground ml-0.5">sn</span>
          </div>
        </div>
      </div>

      {/* Corrective hint - bottom area, above accuracy */}
      {evaluation?.correctiveHintTr && !isPaused && (
        <motion.div key={evaluation.correctiveHintTr} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="fixed left-1/2 -translate-x-1/2 bottom-[7.5rem] z-30 pointer-events-none w-[85%] max-w-sm">
          <div className={`card-3d-elevated px-4 py-2.5 text-center ${glowClasses[stateColor]} backdrop-blur-sm`}>
            <p className="text-xs font-display font-bold text-foreground leading-tight">{evaluation.correctiveHintTr}</p>
          </div>
        </motion.div>
      )}

      {/* Accuracy - bottom center above buttons */}
      {evaluation && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-[4.5rem] z-30 pointer-events-none">
          <div className="card-3d-elevated px-4 py-2 flex items-center gap-2 backdrop-blur-sm">
            <div className={`w-2.5 h-2.5 rounded-full ${stateColor === 'green' ? 'bg-green-400 glow-green' : stateColor === 'yellow' ? 'bg-orange-400 glow-orange' : 'bg-red-400 glow-red'} animate-pulse`} />
            <span className="font-display text-sm font-bold text-foreground tabular-nums">%{Math.round(evaluation.accuracyScore * 100)}</span>
            <span className="text-[10px] text-muted-foreground font-display">{evaluation.isDetected ? 'Algilaniyor' : 'Yuz bulunamadi'}</span>
          </div>
        </div>
      )}

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
