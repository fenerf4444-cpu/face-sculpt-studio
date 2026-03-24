import { motion } from 'framer-motion';
import { Flame, Target, Clock, TrendingUp, Zap, Award, BarChart3 } from 'lucide-react';

const stats = [
  { label: 'Günlük Streak', value: '3', icon: Flame, color: 'text-neon-orange' },
  { label: 'Toplam Seans', value: '12', icon: Target, color: 'text-primary' },
  { label: 'Toplam Süre', value: '48 dk', icon: Clock, color: 'text-secondary' },
  { label: 'Ort. Doğruluk', value: '%72', icon: TrendingUp, color: 'text-neon-pink' },
  { label: 'Toplam XP', value: '1,240', icon: Zap, color: 'text-neon-orange' },
  { label: 'En İyi Combo', value: '7x', icon: Award, color: 'text-neon-red' },
];

const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const weekActivity = [true, true, true, false, false, false, false]; // demo data

export function ProgressScreen() {
  return (
    <div className="p-4 pb-20 space-y-6">
      <div className="text-center pt-4">
        <h1 className="font-display text-2xl font-black text-gradient-energy">İLERLEME</h1>
        <p className="text-muted-foreground text-sm mt-1">Antrenman geçmişin ve gelişimin</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4 text-center"
            >
              <Icon size={20} className={`${stat.color} mx-auto mb-2`} />
              <p className={`font-display text-xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Weekly activity */}
      <div className="glass-card p-4">
        <h3 className="font-display text-xs font-bold text-foreground mb-3">BU HAFTA</h3>
        <div className="flex justify-between">
          {weekDays.map((day, i) => (
            <div key={day} className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                weekActivity[i] ? 'gradient-success neon-glow-green' : 'bg-muted'
              }`}>
                {weekActivity[i] && <span className="text-xs">✅</span>}
              </div>
              <span className="text-[10px] text-muted-foreground">{day}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">3/7 gün tamamlandı</p>
      </div>

      {/* Zone performance */}
      <div className="glass-card p-4">
        <h3 className="font-display text-xs font-bold text-foreground mb-3">BÖLGE PERFORMANSI</h3>
        {[
          { zone: 'Çene Hattı', score: 82, color: 'bg-secondary' },
          { zone: 'Yanaklar', score: 68, color: 'bg-neon-orange' },
          { zone: 'Dudaklar', score: 75, color: 'bg-neon-pink' },
          { zone: 'Gözler', score: 60, color: 'bg-blue-400' },
          { zone: 'Alın', score: 55, color: 'bg-neon-red' },
        ].map((item) => (
          <div key={item.zone} className="mb-3 last:mb-0">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{item.zone}</span>
              <span className="text-foreground font-medium">%{item.score}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${item.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${item.score}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* AI Coach */}
      <div className="glass-card p-4 border-primary/30 neon-glow-red">
        <h3 className="font-display text-xs font-bold text-primary mb-2">🤖 AI KOÇ ÖZETİ</h3>
        <p className="text-sm text-muted-foreground">
          Bugün jawline hareketlerinde daha stabildin. Cheek Puff'ta simetri biraz düştü, yarın bunu iyileştirebiliriz. Üç gündür ritmini koruyorsun, bu çok iyi! 💪
        </p>
      </div>
    </div>
  );
}
