import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uiIcons, exerciseIcons } from '@/assets/iconMap';
import { EXERCISES } from '@/data/exercises';
import { ExerciseDefinition, EvaluatorResult } from '@/types/exercises';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { CompatibilityCheck } from '@/components/CompatibilityCheck';
import { TrainingHUD } from '@/components/TrainingHUD';
import { EVALUATOR_MAP } from '@/lib/evaluators';

interface Program {
  id: string;
  name: string;
  desc: string;
  days: number;
  progress: number;
  gradient: string;
  exerciseIds: string[];
}

const programs: Program[] = [
  { id: 'starter', name: '7 Gunluk Baslangic', desc: 'Temel hareketleri ogren', days: 7, progress: 3, gradient: 'from-emerald-500 to-teal-600', exerciseIds: ['lion-face', 'big-smile', 'brow-raise', 'o-mouth', 'fish-face'] },
  { id: 'slim', name: '14 Gun Slim Face', desc: 'Yuz hatlarini belirginlestir', days: 14, progress: 0, gradient: 'from-orange-500 to-red-500', exerciseIds: ['fish-face', 'jaw-lift', 'cheek-puff', 'lip-protrusion'] },
  { id: 'jawline', name: 'Jawline Focus', desc: 'Cene hatti odakli program', days: 10, progress: 0, gradient: 'from-blue-500 to-indigo-600', exerciseIds: ['jaw-lift', 'lion-face', 'o-mouth', 'cheek-puff'] },
  { id: 'eye-lift', name: 'Eye Lift Routine', desc: 'Goz cevresi guclendirme', days: 7, progress: 0, gradient: 'from-purple-500 to-pink-500', exerciseIds: ['surprise-eyes', 'brow-raise', 'wink-left'] },
  { id: 'lip-track', name: 'Dudak Takip', desc: 'Dudak hareketleri ve kalem tutma', days: 7, progress: 0, gradient: 'from-pink-500 to-rose-500', exerciseIds: ['lip-slide', 'pencil-hold', 'lip-protrusion', 'fish-face'] },
  { id: 'recovery', name: 'Recovery & Relax', desc: 'Yuz gevsetme ve rahatlama', days: 5, progress: 0, gradient: 'from-teal-400 to-cyan-500', exerciseIds: ['lip-protrusion', 'o-mouth', 'brow-raise'] },
];

type ProgramPhase = 'list' | 'detail' | 'preparing' | 'training' | 'done';

export function ProgramsScreen() {
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [activeProgram, setActiveProgram] = useState<string>('starter');
  const [activeDayMap, setActiveDayMap] = useState<Record<string, number>>({ starter: 3 });
  const [phase, setPhase] = useState<ProgramPhase>('list');

  // Training state
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timeLeft, setTimeLeft] = useState(20);
  const [holdTime, setHoldTime] = useState(0);
  const [evaluation, setEvaluation] = useState<EvaluatorResult | null>(null);
  const [combo, setCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickSec = useRef(-1);

  const { videoRef, metrics, compatibility, modelsReady, startCamera, stopCamera, startDetection } = useFaceDetection();

  const clearTimer = useCallback(() => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }, []);

  const getExercisesForProgram = (prog: Program): ExerciseDefinition[] => {
    return prog.exerciseIds.map(id => EXERCISES.find(e => e.id === id)).filter(Boolean) as ExerciseDefinition[];
  };

  const startProgramTraining = useCallback(async (prog: Program) => {
    const exs = getExercisesForProgram(prog);
    setExercises(exs);
    setCurrentIdx(0);
    setCurrentSet(1);
    setCombo(0);
    setXp(0);
    setCompletedIds(new Set());
    setPhase('preparing');
    try {
      const ok = await startCamera();
      if (ok) startDetection();
    } catch {}
  }, [startCamera, startDetection]);

  const beginTraining = useCallback(() => {
    if (!compatibility.allReady) return;
    setPhase('training');
    setTimeLeft(20);
    setHoldTime(0);
    setIsResting(false);
    lastTickSec.current = -1;
  }, [compatibility.allReady]);

  // Training loop
  useEffect(() => {
    if (phase !== 'training' || isPaused || exercises.length === 0) return;

    if (isResting) {
      timerRef.current = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 0.1) { setIsResting(false); setTimeLeft(20); setHoldTime(0); return 0; }
          return prev - 0.1;
        });
      }, 100);
      return () => clearTimer();
    }

    const ex = exercises[currentIdx];
    if (!ex) return;

    timerRef.current = setInterval(() => {
      if (metrics) {
        const evaluator = EVALUATOR_MAP[ex.id];
        if (evaluator) {
          const result = evaluator(metrics, holdTime);
          setEvaluation(result);
          if (result.isDetected) setHoldTime(h => h + 0.1);
        }
      }
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          setXp(p => p + 25);
          if (currentSet >= (ex.reps || 3)) {
            setCompletedIds(p => new Set(p).add(ex.id));
            setCombo(p => p + 1);
            const nextIdx = currentIdx + 1;
            if (nextIdx >= exercises.length) {
              clearTimer();
              stopCamera();
              setPhase('done');
              return 0;
            }
            setCurrentIdx(nextIdx);
            setCurrentSet(1);
            setIsResting(true);
            setRestTimeLeft(5);
            return 0;
          }
          setCurrentSet(s => s + 1);
          setIsResting(true);
          setRestTimeLeft(3);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearTimer();
  }, [phase, isPaused, currentIdx, currentSet, exercises, metrics, holdTime, isResting, clearTimer, stopCamera]);

  const endSession = useCallback(() => {
    clearTimer();
    stopCamera();
    if (selectedProgram) {
      setActiveDayMap(prev => ({
        ...prev,
        [selectedProgram.id]: Math.min((prev[selectedProgram.id] || 0) + 1, selectedProgram.days)
      }));
    }
    setPhase('list');
    setSelectedProgram(null);
  }, [clearTimer, stopCamera, selectedProgram]);

  // Training view
  if (phase === 'training') {
    const ex = exercises[currentIdx];
    return (
      <div className="relative h-[calc(100vh-4rem)] bg-background">
        <div className="absolute inset-0">
          <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted autoPlay />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(240 10% 4% / 0.7) 0%, transparent 30%, transparent 70%, hsl(240 10% 4% / 0.5) 100%)' }} />
        </div>
        <AnimatePresence>
          {isResting ? (
            <motion.div key="rest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center">
              <div className="text-center card-3d-elevated p-8 glow-green">
                <p className="font-display text-lg text-muted-foreground">NEFES AL</p>
                <p className="font-display text-5xl font-bold text-foreground">{Math.ceil(restTimeLeft)}</p>
              </div>
            </motion.div>
          ) : (
            <TrainingHUD exerciseName={ex?.nameTr || ''} exerciseId={ex?.id || ''} timeLeft={timeLeft} totalTime={20}
              rep={currentSet} totalReps={ex?.reps || 3} evaluation={evaluation} combo={combo} xp={xp} isPaused={isPaused} />
          )}
        </AnimatePresence>
        <div className="absolute bottom-3 inset-x-3 z-10 flex gap-2">
          <button onClick={() => setIsPaused(!isPaused)} className="flex-1 card-3d-elevated py-2.5 font-display text-xs font-bold text-foreground">{isPaused ? 'DEVAM' : 'DURAKLAT'}</button>
          <button onClick={endSession} className="card-3d-elevated px-4 py-2.5 font-display text-xs font-bold text-destructive">CIK</button>
        </div>
      </div>
    );
  }

  if (phase === 'preparing') {
    return (
      <div className="relative h-[calc(100vh-4rem)] bg-background">
        <div className="absolute inset-0"><video ref={videoRef} className="w-full h-full object-cover scale-x-[-1] opacity-30" playsInline muted autoPlay /></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-6">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">HAZIRLIK</h2>
          {!modelsReady && <div className="card-3d-elevated px-6 py-3 mb-4 glow-orange"><p className="text-sm font-display text-neon-orange">Model yukleniyor...</p></div>}
          <div className="w-full max-w-sm mb-8"><CompatibilityCheck state={compatibility} /></div>
          {compatibility.allReady ? (
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.95 }}
              onClick={beginTraining} className="w-52 py-4 btn-3d-primary text-lg text-primary-foreground glow-red">BASLA!</motion.button>
          ) : <p className="text-muted-foreground text-sm">Kontroller tamamlaniyor...</p>}
          <button onClick={endSession} className="mt-4 text-sm text-muted-foreground">Geri don</button>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="p-4 pb-24 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20">
          <img src={uiIcons.faceTraining} alt="" className="w-full h-full object-contain float-3d" />
        </motion.div>
        <h2 className="font-display text-2xl font-bold text-foreground">TEBRIKLER!</h2>
        <p className="text-muted-foreground text-sm text-center">Gun tamamlandi. +{xp} XP kazandin!</p>
        <button onClick={endSession} className="px-8 py-3 btn-3d-primary text-primary-foreground text-sm">TAMAM</button>
      </div>
    );
  }

  if (selectedProgram) {
    const exs = getExercisesForProgram(selectedProgram);
    const currentDay = activeDayMap[selectedProgram.id] || 0;
    const isActive = activeProgram === selectedProgram.id;

    return (
      <div className="p-4 pb-24 space-y-4">
        <button onClick={() => setSelectedProgram(null)} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-display">← Geri</button>
        <div className={`card-3d-elevated p-6 ${isActive ? 'glow-green' : ''}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedProgram.gradient} flex items-center justify-center shrink-0`}
              style={{ boxShadow: '0 4px 15px -3px hsl(0 0% 0% / 0.4)' }}>
              <span className="font-display text-2xl font-bold text-primary-foreground">{selectedProgram.days}</span>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">{selectedProgram.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedProgram.desc}</p>
            </div>
          </div>
          <div className="card-3d-inset p-0.5 rounded-full mb-3">
            <div className={`h-2 rounded-full bg-gradient-to-r ${selectedProgram.gradient}`} style={{ width: `${(currentDay / selectedProgram.days) * 100}%` }} />
          </div>
          <p className="text-xs text-muted-foreground text-center mb-4">Gun {currentDay} / {selectedProgram.days}</p>

          <button onClick={() => { setActiveProgram(selectedProgram.id); startProgramTraining(selectedProgram); }}
            className="w-full py-3 btn-3d-primary text-primary-foreground text-sm">
            KAMERAYI AC VE ANTRENMANA BASLA
          </button>
        </div>

        {/* Day grid */}
        <div className="card-3d p-4">
          <h3 className="font-display text-sm font-bold text-foreground mb-3">GUNLUK PLAN</h3>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: selectedProgram.days }, (_, i) => (
              <div key={i} className={`aspect-square rounded-xl flex items-center justify-center text-xs font-display font-bold ${
                i < currentDay ? 'btn-3d-success text-secondary-foreground' :
                i === currentDay ? 'btn-3d-primary text-primary-foreground beat-pulse' :
                'card-3d-inset text-muted-foreground'
              }`}>{i + 1}</div>
            ))}
          </div>
        </div>

        {/* Exercises */}
        <div className="card-3d p-4">
          <h3 className="font-display text-sm font-bold text-foreground mb-3">HAREKETLER ({exs.length})</h3>
          <div className="space-y-2">
            {exs.map((ex) => {
              const ic = exerciseIcons[ex.id];
              return (
                <div key={ex.id} className="card-3d-inset p-3 flex items-center gap-3">
                  {ic ? <img src={ic} alt={ex.nameTr} width={36} height={36} className="object-contain" /> :
                    <div className="w-9 h-9 rounded-lg card-3d flex items-center justify-center"><span className="text-xs text-muted-foreground">{ex.name[0]}</span></div>}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-bold text-foreground truncate">{ex.nameTr}</p>
                    <p className="text-[10px] text-muted-foreground">20s x {ex.reps} set | {ex.zone}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Program list
  const activeProg = programs.find(p => p.id === activeProgram);

  return (
    <div className="p-4 pb-24 space-y-5">
      <div className="text-center pt-6">
        <h1 className="font-display text-4xl font-bold text-gradient-cool tracking-tight">PROGRAMLAR</h1>
        <p className="text-muted-foreground text-sm mt-1">Hedefe yonelik antrenman programlari</p>
      </div>

      {activeProg && (
        <div className="card-3d-elevated p-5 glow-green">
          <div className="flex items-center gap-4">
            <img src={uiIcons.progressFace} alt="" width={44} height={44} className="float-3d" />
            <div className="flex-1">
              <p className="text-[10px] font-display font-bold text-secondary">AKTIF PROGRAM</p>
              <h3 className="font-display text-lg font-bold text-foreground">{activeProg.name}</h3>
              <p className="text-xs text-muted-foreground">Gun {activeDayMap[activeProg.id] || 0} / {activeProg.days}</p>
              <div className="card-3d-inset p-0.5 rounded-full mt-2">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                  style={{ width: `${((activeDayMap[activeProg.id] || 0) / activeProg.days) * 100}%`, boxShadow: '0 0 8px hsl(160 75% 42% / 0.4)' }} />
              </div>
            </div>
          </div>
          <button onClick={() => setSelectedProgram(activeProg)} className="w-full mt-4 py-3 btn-3d-success text-secondary-foreground text-sm">DEVAM ET</button>
        </div>
      )}

      <div className="space-y-3">
        {programs.map((prog, i) => (
          <motion.button key={prog.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.98 }} onClick={() => setSelectedProgram(prog)}
            className="w-full card-3d p-4 flex items-center gap-4 text-left group transition-all">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${prog.gradient} flex items-center justify-center shrink-0`}
              style={{ boxShadow: '0 4px 15px -3px hsl(0 0% 0% / 0.4)' }}>
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
