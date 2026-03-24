import { motion } from 'framer-motion';
import { SessionScore } from '@/types/exercises';
import { uiIcons } from '@/assets/iconMap';

interface SessionSummaryProps {
  score: SessionScore;
  onClose: () => void;
  coachMessage?: string;
}

export function SessionSummary({ score, onClose, coachMessage }: SessionSummaryProps) {
  const statItems = [
    { label: 'Dogruluk', value: `%${Math.round(score.accuracy)}`, color: 'text-secondary', icon: uiIcons.target },
    { label: 'Tutus Skoru', value: `${score.holdScore}`, color: 'text-neon-orange', icon: uiIcons.streakFire },
    { label: 'Ritim', value: `${score.rhythmScore}`, color: 'text-neon-pink', icon: uiIcons.xpBolt },
    { label: 'Simetri', value: `${score.symmetryScore}`, color: 'text-neon-cyan', icon: uiIcons.chart },
    { label: 'Combo', value: `+${score.comboBonus}`, color: 'text-neon-red', icon: uiIcons.streakFire },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl p-4"
    >
      <div className="card-3d-elevated p-6 max-w-sm w-full glow-red">
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-block"
          >
            <img src={uiIcons.trophy} alt="Kupa" width={64} height={64} className="mx-auto float-3d" />
          </motion.div>
          <h2 className="font-display text-3xl font-bold text-foreground mt-3">SEANS TAMAM!</h2>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="font-display text-5xl font-bold text-gradient-primary">{score.totalScore}</span>
            <span className="text-muted-foreground text-sm">puan</span>
          </div>
          <div className="inline-flex items-center gap-2 card-3d-elevated px-4 py-2 mt-3 glow-green">
            <img src={uiIcons.xpBolt} alt="" width={20} height={20} />
            <span className="font-display text-base font-bold text-secondary">{score.xp} XP</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {statItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="card-3d-inset p-3 text-center"
            >
              <img src={item.icon} alt="" width={20} height={20} className="mx-auto mb-1.5 object-contain" loading="lazy" />
              <p className="text-[10px] text-muted-foreground font-display">{item.label}</p>
              <p className={`font-display text-xl font-bold ${item.color}`}>{item.value}</p>
            </motion.div>
          ))}
        </div>

        {coachMessage && (
          <div className="card-3d p-4 mb-5" style={{ borderColor: 'hsl(350 85% 55% / 0.2)' }}>
            <p className="text-[10px] text-muted-foreground font-display mb-1">AI KOC</p>
            <p className="text-sm text-foreground">{coachMessage}</p>
          </div>
        )}

        <button onClick={onClose} className="w-full py-3.5 btn-3d-primary text-primary-foreground text-base">
          DEVAM ET
        </button>
      </div>
    </motion.div>
  );
}
