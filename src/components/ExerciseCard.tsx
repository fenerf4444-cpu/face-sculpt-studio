import { ExerciseDefinition } from '@/types/exercises';
import { motion } from 'framer-motion';

interface ExerciseCardProps {
  exercise: ExerciseDefinition;
  isActive?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
}

const zoneBadgeColors: Record<string, string> = {
  forehead: 'bg-neon-pink/20 text-neon-pink',
  eyes: 'bg-blue-500/20 text-blue-400',
  cheeks: 'bg-neon-orange/20 text-neon-orange',
  lips: 'bg-neon-red/20 text-neon-red',
  jaw: 'bg-neon-green/20 text-neon-green',
  neck: 'bg-purple-500/20 text-purple-400',
};

const difficultyColors: Record<string, string> = {
  beginner: 'text-secondary',
  intermediate: 'text-neon-orange',
  advanced: 'text-neon-red',
};

export function ExerciseCard({ exercise, isActive, isCompleted, onClick }: ExerciseCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`glass-card p-4 cursor-pointer transition-all ${
        isActive ? 'neon-glow-red border-primary/50' : ''
      } ${isCompleted ? 'neon-glow-green border-secondary/50' : ''} ${
        isActive ? 'pulse-ring' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{exercise.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-sm font-bold text-foreground truncate">
              {exercise.nameTr}
            </h3>
            {isCompleted && <span className="text-secondary text-xs">✅</span>}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {exercise.descriptionTr}
          </p>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${zoneBadgeColors[exercise.zone] || ''}`}>
              {exercise.zone}
            </span>
            <span className={`text-[10px] font-medium ${difficultyColors[exercise.difficulty]}`}>
              {exercise.difficulty === 'beginner' ? 'Başlangıç' : exercise.difficulty === 'intermediate' ? 'Orta' : 'İleri'}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {exercise.holdDurationSec}s × {exercise.reps}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
