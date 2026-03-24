import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { EXERCISES } from '@/data/exercises';
import { ExerciseCard } from '@/components/ExerciseCard';
import { ExerciseDefinition, ExerciseZone } from '@/types/exercises';

const zones: { id: ExerciseZone | 'all'; label: string; emoji: string }[] = [
  { id: 'all', label: 'Tümü', emoji: '✨' },
  { id: 'forehead', label: 'Alın', emoji: '🧠' },
  { id: 'eyes', label: 'Gözler', emoji: '👁' },
  { id: 'cheeks', label: 'Yanaklar', emoji: '🍑' },
  { id: 'lips', label: 'Dudaklar', emoji: '👄' },
  { id: 'jaw', label: 'Çene', emoji: '💎' },
  { id: 'neck', label: 'Boyun', emoji: '🦢' },
];

export function LearnScreen() {
  const [selectedZone, setSelectedZone] = useState<ExerciseZone | 'all'>('all');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDefinition | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = EXERCISES.filter(e => {
    if (selectedZone !== 'all' && e.zone !== selectedZone) return false;
    if (searchQuery && !e.nameTr.toLowerCase().includes(searchQuery.toLowerCase()) && !e.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (selectedExercise) {
    return (
      <div className="p-4 pb-20 space-y-4">
        <button onClick={() => setSelectedExercise(null)} className="text-sm text-muted-foreground">← Geri</button>
        <div className="glass-card p-6">
          <div className="text-center mb-6">
            <span className="text-5xl">{selectedExercise.icon}</span>
            <h2 className="font-display text-xl font-black text-foreground mt-3">{selectedExercise.nameTr}</h2>
            <p className="text-sm text-muted-foreground mt-1">{selectedExercise.name}</p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-display text-xs font-bold text-primary mb-1">NE İŞE YARAR</h3>
              <p className="text-sm text-muted-foreground">{selectedExercise.descriptionTr}</p>
            </div>
            <div>
              <h3 className="font-display text-xs font-bold text-secondary mb-1">NASIL YAPILIR</h3>
              <p className="text-sm text-muted-foreground">{selectedExercise.howToTr}</p>
            </div>
            <div>
              <h3 className="font-display text-xs font-bold text-neon-orange mb-1">SIK HATALAR</h3>
              <ul className="space-y-1">
                {selectedExercise.commonMistakesTr.map((m, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {m}</li>
                ))}
              </ul>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>⏱ {selectedExercise.holdDurationSec}s tutma</span>
              <span>🔄 {selectedExercise.reps} tekrar</span>
              <span>📍 {selectedExercise.zone}</span>
            </div>
          </div>

          <button className="w-full mt-6 py-3 rounded-xl gradient-primary font-display text-sm font-bold text-primary-foreground neon-glow-red">
            ŞİMDİ DENE 🔥
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="text-center pt-4">
        <h1 className="font-display text-2xl font-black text-gradient-energy">ÖĞREN</h1>
        <p className="text-muted-foreground text-sm mt-1">Hareket kütüphanesi</p>
      </div>

      {/* Search */}
      <div className="glass-card flex items-center gap-2 px-3 py-2">
        <Search size={16} className="text-muted-foreground" />
        <input
          type="text"
          placeholder="Hareket ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
      </div>

      {/* Zone filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {zones.map(zone => (
          <button
            key={zone.id}
            onClick={() => setSelectedZone(zone.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedZone === zone.id
                ? 'gradient-primary text-primary-foreground neon-glow-red'
                : 'glass-card text-muted-foreground'
            }`}
          >
            <span>{zone.emoji}</span>
            {zone.label}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="space-y-2">
        {filtered.map((ex, i) => (
          <motion.div
            key={ex.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <ExerciseCard exercise={ex} onClick={() => setSelectedExercise(ex)} />
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">Hareket bulunamadı</p>
        )}
      </div>
    </div>
  );
}
