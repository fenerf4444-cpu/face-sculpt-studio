import { motion } from 'framer-motion';
import { SessionScore } from '@/types/exercises';
import { Trophy, Target, Timer, Zap, Flame, Star } from 'lucide-react';

interface SessionSummaryProps {
  score: SessionScore;
  onClose: () => void;
  coachMessage?: string;
}

export function SessionSummary({ score, onClose, coachMessage }: SessionSummaryProps) {
  const statItems = [
    { icon: Target, label: 'Doğruluk', value: `%${Math.round(score.accuracy)}`, color: 'text-secondary' },
    { icon: Timer, label: 'Tutuş Skoru', value: `${score.holdScore}`, color: 'text-neon-orange' },
    { icon: Zap, label: 'Ritim', value: `${score.rhythmScore}`, color: 'text-neon-pink' },
    { icon: Star, label: 'Simetri', value: `${score.symmetryScore}`, color: 'text-blue-400' },
    { icon: Flame, label: 'Combo Bonus', value: `+${score.comboBonus}`, color: 'text-neon-red' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl p-4"
    >
      <div className="glass-card p-6 max-w-sm w-full neon-glow-red">
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
            <Trophy className="w-12 h-12 text-neon-orange mx-auto mb-3" />
          </motion.div>
          <h2 className="font-display text-2xl font-black text-foreground">SEANS TAMAM!</h2>
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="font-display text-4xl font-black text-gradient-primary">{score.totalScore}</span>
            <span className="text-muted-foreground text-sm">puan</span>
          </div>
          <div className="glass-card px-4 py-1.5 inline-block mt-2 neon-glow-green">
            <span className="font-display text-sm font-bold text-secondary">⚡ {score.xp} XP</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {statItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="glass-card p-3 text-center"
              >
                <Icon size={16} className={`${item.color} mx-auto mb-1`} />
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
                <p className={`font-display text-lg font-bold ${item.color}`}>{item.value}</p>
              </motion.div>
            );
          })}
        </div>

        {coachMessage && (
          <div className="glass-card p-3 mb-4 border-primary/30">
            <p className="text-xs text-muted-foreground mb-1">🤖 AI Koç</p>
            <p className="text-sm text-foreground">{coachMessage}</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl gradient-primary font-display text-sm font-bold text-primary-foreground neon-glow-red transition-transform active:scale-95"
        >
          DEVAM ET
        </button>
      </div>
    </motion.div>
  );
}
