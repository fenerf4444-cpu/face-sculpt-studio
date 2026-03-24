import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uiIcons, exerciseIcons } from '@/assets/iconMap';
import { EXERCISES } from '@/data/exercises';
import { ExerciseDefinition } from '@/types/exercises';

interface Program {
  id: string;
  name: string;
  desc: string;
  days: number;
  progress: number;
  gradient: string;
  free: boolean;
  exerciseIds: string[];
}

const programs: Program[] = [
  { id: 'starter', name: '7 Gunluk Baslangic', desc: 'Temel hareketleri ogren', days: 7, progress: 3, gradient: 'from-emerald-500 to-teal-600', free: true, exerciseIds: ['lion-face', 'big-smile', 'brow-raise', 'o-mouth', 'fish-face'] },
  { id: 'slim', name: '14 Gun Slim Face', desc: 'Yuz hatlarini belirginlestir', days: 14, progress: 0, gradient: 'from-orange-500 to-red-500', free: true, exerciseIds: ['fish-face', 'jaw-lift', 'cheek-puff', 'lip-protrusion'] },
  { id: 'jawline', name: 'Jawline Focus', desc: 'Cene hatti odakli program', days: 10, progress: 0, gradient: 'from-blue-500 to-indigo-600', free: true, exerciseIds: ['jaw-lift', 'lion-face', 'o-mouth', 'cheek-puff'] },
  { id: 'eye-lift', name: 'Eye Lift Routine', desc: 'Goz cevresi guclendirme', days: 7, progress: 0, gradient: 'from-purple-500 to-pink-500', free: true, exerciseIds: ['surprise-eyes', 'brow-raise', 'wink-left'] },
  { id: 'cheek', name: 'Cheek Energy', desc: 'Yanak kaslarini aktive et', days: 7, progress: 0, gradient: 'from-pink-500 to-rose-500', free: true, exerciseIds: ['cheek-puff', 'fish-face', 'big-smile'] },
  { id: 'recovery', name: 'Recovery & Relax', desc: 'Yuz gevsetme ve rahatlama', days: 5, progress: 0, gradient: 'from-teal-400 to-cyan-500', free: true, exerciseIds: ['lip-protrusion', 'o-mouth', 'brow-raise'] },
];

export function ProgramsScreen() {
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [activeProgram, setActiveProgram] = useState<string>('starter');
  const [activeDayMap, setActiveDayMap] = useState<Record<string, number>>({ starter: 3 });

  const activeProg = programs.find(p => p.id === activeProgram);

  const getExercisesForProgram = (prog: Program): ExerciseDefinition[] => {
    return prog.exerciseIds.map(id => EXERCISES.find(e => e.id === id)).filter(Boolean) as ExerciseDefinition[];
  };

  if (selectedProgram) {
    const exercises = getExercisesForProgram(selectedProgram);
    const currentDay = activeDayMap[selectedProgram.id] || 0;
    const isActive = activeProgram === selectedProgram.id;

    return (
      <div className="p-4 pb-24 space-y-4">
        <button onClick={() => setSelectedProgram(null)} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-display">← Geri</button>

        <div className={`card-3d-elevated p-6 ${isActive ? 'glow-green' : ''}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedProgram.gradient} flex items-center justify-center shrink-0`}
              style={{ boxShadow: '0 4px 15px -3px hsl(0 0% 0% / 0.4), inset 0 1px 0 0 hsl(0 0% 100% / 0.2)' }}>
              <span className="font-display text-2xl font-bold text-primary-foreground">{selectedProgram.days}</span>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">{selectedProgram.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedProgram.desc}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="card-3d-inset p-0.5 rounded-full mb-3">
            <div className={`h-2 rounded-full bg-gradient-to-r ${selectedProgram.gradient}`} style={{ width: `${(currentDay / selectedProgram.days) * 100}%` }} />
          </div>
          <p className="text-xs text-muted-foreground text-center mb-4">Gun {currentDay} / {selectedProgram.days}</p>

          {!isActive ? (
            <button
              onClick={() => {
                setActiveProgram(selectedProgram.id);
                setActiveDayMap(prev => ({ ...prev, [selectedProgram.id]: prev[selectedProgram.id] || 1 }));
              }}
              className="w-full py-3 btn-3d-primary text-primary-foreground text-sm"
            >
              BU PROGRAMI BASLAT
            </button>
          ) : (
            <button
              onClick={() => {
                setActiveDayMap(prev => ({
                  ...prev,
                  [selectedProgram.id]: Math.min((prev[selectedProgram.id] || 0) + 1, selectedProgram.days)
                }));
              }}
              className="w-full py-3 btn-3d-success text-secondary-foreground text-sm"
            >
              GUN {Math.min(currentDay + 1, selectedProgram.days)} ANTRENMANINI BASLAT
            </button>
          )}
        </div>

        {/* Day breakdown */}
        <div className="card-3d p-4">
          <h3 className="font-display text-sm font-bold text-foreground mb-3">GUNLUK PLAN</h3>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: selectedProgram.days }, (_, i) => (
              <div key={i} className={`aspect-square rounded-xl flex items-center justify-center text-xs font-display font-bold ${
                i < currentDay ? 'btn-3d-success text-secondary-foreground' :
                i === currentDay ? 'btn-3d-primary text-primary-foreground beat-pulse' :
                'card-3d-inset text-muted-foreground'
              }`}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Exercises in program */}
        <div className="card-3d p-4">
          <h3 className="font-display text-sm font-bold text-foreground mb-3">HAREKETLER ({exercises.length})</h3>
          <div className="space-y-2">
            {exercises.map((ex) => {
              const ic = exerciseIcons[ex.id];
              return (
                <div key={ex.id} className="card-3d-inset p-3 flex items-center gap-3">
                  {ic ? <img src={ic} alt={ex.nameTr} width={36} height={36} className="object-contain" /> :
                    <div className="w-9 h-9 rounded-lg card-3d flex items-center justify-center"><span className="text-xs text-muted-foreground">{ex.name[0]}</span></div>}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-bold text-foreground truncate">{ex.nameTr}</p>
                    <p className="text-[10px] text-muted-foreground">{ex.holdDurationSec}s x {ex.reps} set</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-5">
      <div className="text-center pt-6">
        <h1 className="font-display text-4xl font-bold text-gradient-cool tracking-tight">PROGRAMLAR</h1>
        <p className="text-muted-foreground text-sm mt-1">Hedefe yonelik antrenman programlari</p>
      </div>

      {/* Active program highlight */}
      {activeProg && (
        <div className="card-3d-elevated p-5 glow-green">
          <div className="flex items-center gap-4">
            <img src={uiIcons.target} alt="" width={44} height={44} className="float-3d" />
            <div className="flex-1">
              <p className="text-[10px] font-display font-bold text-secondary">AKTIF PROGRAM</p>
              <h3 className="font-display text-lg font-bold text-foreground">{activeProg.name}</h3>
              <p className="text-xs text-muted-foreground">Gun {activeDayMap[activeProg.id] || 0} / {activeProg.days}</p>
              <div className="card-3d-inset p-0.5 rounded-full mt-2">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${((activeDayMap[activeProg.id] || 0) / activeProg.days) * 100}%`, boxShadow: '0 0 8px hsl(160 75% 42% / 0.4)' }} />
              </div>
            </div>
          </div>
          <button onClick={() => setSelectedProgram(activeProg)} className="w-full mt-4 py-3 btn-3d-success text-secondary-foreground text-sm">DEVAM ET</button>
        </div>
      )}

      {/* Program list */}
      <div className="space-y-3">
        {programs.map((prog, i) => (
          <motion.button
            key={prog.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedProgram(prog)}
            className="w-full card-3d p-4 flex items-center gap-4 text-left group transition-all"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${prog.gradient} flex items-center justify-center shrink-0`}
              style={{ boxShadow: '0 4px 15px -3px hsl(0 0% 0% / 0.4), inset 0 1px 0 0 hsl(0 0% 100% / 0.2)' }}>
              <span className="font-display text-xl font-bold text-primary-foreground">{prog.days}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-bold text-foreground truncate">{prog.name}</h3>
                {activeProgram === prog.id && (
                  <div className="card-3d-inset px-1.5 py-0.5 rounded">
                    <span className="text-[9px] font-display font-bold text-secondary">AKTIF</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{prog.desc}</p>
              {(activeDayMap[prog.id] || 0) > 0 && (
                <div className="card-3d-inset p-0.5 rounded-full mt-1.5 w-24">
                  <div className={`h-1 rounded-full bg-gradient-to-r ${prog.gradient}`} style={{ width: `${((activeDayMap[prog.id] || 0) / prog.days) * 100}%` }} />
                </div>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg card-3d-inset flex items-center justify-center shrink-0">
              <span className="text-muted-foreground text-xs">›</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
