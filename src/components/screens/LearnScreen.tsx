import { useState } from 'react';
import { motion } from 'framer-motion';
import { EXERCISES } from '@/data/exercises';
import { ExerciseCard } from '@/components/ExerciseCard';
import { ExerciseDefinition, ExerciseZone } from '@/types/exercises';
import { exerciseIcons } from '@/assets/iconMap';

const zones: { id: ExerciseZone | 'all'; label: string }[] = [
  { id: 'all', label: 'Tumu' },
  { id: 'forehead', label: 'Alin' },
  { id: 'eyes', label: 'Gozler' },
  { id: 'cheeks', label: 'Yanaklar' },
  { id: 'lips', label: 'Dudaklar' },
  { id: 'jaw', label: 'Cene' },
  { id: 'neck', label: 'Boyun' },
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
    const iconSrc = exerciseIcons[selectedExercise.id];
    return (
      <div className="p-4 pb-24 space-y-4">
        <button onClick={() => setSelectedExercise(null)} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-display">← Geri</button>
        <div className="card-3d-elevated p-6 glow-red">
          <div className="text-center mb-6">
            {iconSrc && <img src={iconSrc} alt={selectedExercise.nameTr} width={80} height={80} className="mx-auto float-3d" />}
            <h2 className="font-display text-2xl font-bold text-foreground mt-4">{selectedExercise.nameTr}</h2>
            <p className="text-sm text-muted-foreground mt-1">{selectedExercise.name}</p>
          </div>

          <div className="space-y-5">
            <div className="card-3d p-4">
              <h3 className="font-display text-xs font-bold text-primary mb-2">NE ISE YARAR</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedExercise.descriptionTr}</p>
            </div>
            <div className="card-3d p-4">
              <h3 className="font-display text-xs font-bold text-secondary mb-2">NASIL YAPILIR</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedExercise.howToTr}</p>
            </div>
            <div className="card-3d p-4">
              <h3 className="font-display text-xs font-bold text-neon-orange mb-2">SIK HATALAR</h3>
              <ul className="space-y-1.5">
                {selectedExercise.commonMistakesTr.map((m, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-orange mt-1.5 shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-3">
              <div className="card-3d-inset flex-1 p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-display">SURE</p>
                <p className="font-display text-lg font-bold text-foreground">{selectedExercise.holdDurationSec}s</p>
              </div>
              <div className="card-3d-inset flex-1 p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-display">TEKRAR</p>
                <p className="font-display text-lg font-bold text-foreground">{selectedExercise.reps}x</p>
              </div>
              <div className="card-3d-inset flex-1 p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-display">BOLGE</p>
                <p className="font-display text-lg font-bold text-foreground capitalize">{selectedExercise.zone}</p>
              </div>
            </div>
          </div>
          <button className="w-full mt-6 py-3.5 btn-3d-primary text-primary-foreground text-base">SIMDI DENE</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-5">
      <div className="text-center pt-6">
        <h1 className="font-display text-4xl font-bold text-gradient-energy tracking-tight">OGREN</h1>
        <p className="text-muted-foreground text-sm mt-1">Hareket kutuphanesi</p>
      </div>

      {/* Search */}
      <div className="card-3d-inset flex items-center gap-3 px-4 py-3">
        <span className="text-muted-foreground text-sm">⌕</span>
        <input
          type="text"
          placeholder="Hareket ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
        />
      </div>

      {/* Zone filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {zones.map(zone => (
          <button
            key={zone.id}
            onClick={() => setSelectedZone(zone.id)}
            className={`px-4 py-2 rounded-xl text-xs font-display font-bold whitespace-nowrap transition-all ${
              selectedZone === zone.id ? 'btn-3d-primary text-primary-foreground' : 'card-3d text-muted-foreground hover:text-foreground'
            }`}
          >
            {zone.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      <div className="space-y-2.5">
        {filtered.map((ex, i) => (
          <motion.div key={ex.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <ExerciseCard exercise={ex} onClick={() => setSelectedExercise(ex)} />
          </motion.div>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8 card-3d p-6">Hareket bulunamadi</p>}
      </div>
    </div>
  );
}
