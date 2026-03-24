import { forwardRef } from 'react';
import { ExerciseDefinition } from '@/types/exercises';
import { motion } from 'framer-motion';
import { exerciseIcons } from '@/assets/iconMap';

interface ExerciseCardProps {
  exercise: ExerciseDefinition;
  isActive?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
}

const zoneLabelColors: Record<string, string> = {
  forehead: 'text-neon-pink',
  eyes: 'text-neon-cyan',
  cheeks: 'text-neon-orange',
  lips: 'text-neon-red',
  jaw: 'text-neon-green',
  neck: 'text-accent',
};

const zoneLabels: Record<string, string> = {
  forehead: 'Alin',
  eyes: 'Gozler',
  cheeks: 'Yanaklar',
  lips: 'Dudaklar',
  jaw: 'Cene',
  neck: 'Boyun',
};

export const ExerciseCard = forwardRef<HTMLDivElement, ExerciseCardProps>(
  ({ exercise, isActive, isCompleted, onClick }, ref) => {
    const iconSrc = exerciseIcons[exercise.id];

    return (
      <motion.div
        ref={ref}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`cursor-pointer transition-all ${
          isActive ? 'card-3d-elevated glow-red pulse-ring' : isCompleted ? 'card-3d glow-green' : 'card-3d'
        }`}
      >
        <div className="p-4 flex items-center gap-4">
          <div className="relative w-14 h-14 shrink-0">
            {iconSrc ? (
              <img
                src={iconSrc}
                alt={exercise.nameTr}
                width={56}
                height={56}
                loading="lazy"
                className={`w-full h-full object-contain ${isActive ? 'float-3d' : ''}`}
              />
            ) : (
              <div className="w-full h-full rounded-xl card-3d-inset flex items-center justify-center">
                <span className="font-display text-lg font-bold text-muted-foreground">{exercise.name[0]}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display text-base font-bold text-foreground truncate">
                {exercise.nameTr}
              </h3>
              {isCompleted && (
                <div className="w-5 h-5 rounded-full btn-3d-success flex items-center justify-center">
                  <span className="text-[10px] text-secondary-foreground">OK</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
              {exercise.descriptionTr}
            </p>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-display font-bold ${zoneLabelColors[exercise.zone]}`}>
                {zoneLabels[exercise.zone] || exercise.zone}
              </span>
              <div className="card-3d-inset px-2 py-0.5">
                <span className="text-[9px] font-body text-muted-foreground">
                  {exercise.holdDurationSec}s x {exercise.reps}
                </span>
              </div>
              <span className={`text-[9px] font-display font-bold ${
                exercise.difficulty === 'beginner' ? 'text-secondary' : exercise.difficulty === 'intermediate' ? 'text-neon-orange' : 'text-neon-red'
              }`}>
                {exercise.difficulty === 'beginner' ? 'KOLAY' : exercise.difficulty === 'intermediate' ? 'ORTA' : 'ZOR'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

ExerciseCard.displayName = 'ExerciseCard';
