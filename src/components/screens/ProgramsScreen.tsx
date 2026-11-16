import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uiIcons, exerciseIcons } from '@/assets/iconMap';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { EXERCISES } from '@/data/exercises';
import { ExerciseDefinition, EvaluatorResult } from '@/types/exercises';
import { FaceMetrics } from '@/lib/face-detection';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { CompatibilityCheck } from '@/components/CompatibilityCheck';
import { TrainingHUD } from '@/components/TrainingHUD';
import { EVALUATOR_MAP } from '@/lib/evaluators';
import { saveSession, getProgramProgress, setProgramDay, getActiveProgramId, setActiveProgramId } from '@/lib/session-store';

interface Program {
  id: string;
  name: string;
  desc: string;
  days: number;
  gradient: string;
  exerciseIds: string[];
}

const programs: Program[] = [
  { id: 'starter', name: '7 günlük başlangıç', desc: 'Temel hareketler ve ifade kontrolü', days: 7, gradient: 'from-emerald-500 to-teal-600', exerciseIds: ['lion-face', 'big-smile', 'brow-raise', 'o-mouth', 'fish-face'] },
  { id: 'slim', name: 'Yanak rutini', desc: 'Yanak kasları ve hareket farkındalığı', days: 14, gradient: 'from-orange-500 to-red-500', exerciseIds: ['fish-face', 'jaw-lift', 'cheek-puff', 'lip-protrusion'] },
  { id: 'jawline', name: 'Çene odağı', desc: 'Kontrollü çene hareketleri', days: 10, gradient: 'from-blue-500 to-indigo-600', exerciseIds: ['jaw-lift', 'lion-face', 'o-mouth', 'cheek-puff'] },
  { id: 'eye-lift', name: 'Göz çevresi rutini', desc: 'Nazik göz çevresi hareketleri', days: 7, gradient: 'from-purple-500 to-pink-500', exerciseIds: ['surprise-eyes', 'brow-raise', 'wink-left', 'eye-temple-lift', 'under-eye-press'] },
  { id: 'lip-track', name: 'Dudak takibi', desc: 'Dudak hareketleri ve kalem tutma', days: 7, gradient: 'from-pink-500 to-rose-500', exerciseIds: ['lip-slide', 'pencil-hold', 'lip-protrusion', 'fish-face'] },
  { id: 'hand-assisted', name: 'El destekli yüz yogası', desc: 'Parmaklarla desteklenen yuz egzersizleri', days: 7, gradient: 'from-amber-500 to-yellow-500', exerciseIds: ['eye-temple-lift', 'smile-lift', 'nose-bridge-press', 'wide-smile-stretch', 'under-eye-press', 'forehead-smooth', 'jaw-side-stretch'] },
  { id: 'full-face', name: 'Tüm yüz programı', desc: 'Tum bolgeler icin kapsamli antrenman', days: 14, gradient: 'from-violet-500 to-fuchsia-500', exerciseIds: ['forehead-smooth', 'eye-temple-lift', 'smile-lift', 'wide-smile-stretch', 'jaw-side-stretch', 'lion-face', 'cheek-puff'] },
  { id: 'recovery', name: 'Gevşe & rahatla', desc: 'Yavaş, nazik yüz hareketleri', days: 5, gradient: 'from-teal-400 to-cyan-500', exerciseIds: ['nose-bridge-press', 'under-eye-press', 'forehead-smooth', 'lip-protrusion', 'o-mouth'] },
];

type ProgramPhase = 'list' | 'detail' | 'preparing' | 'training' | 'done';

export function ProgramsScreen() {
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [activeProgram, setActiveProgram] = useState<string | null>(() => getActiveProgramId());
  const [activeDayMap, setActiveDayMap] = useState<Record<string, number>>(() => getProgramProgress());
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
  const { attachVideo, metrics, compatibility, modelsReady, startCamera, stopCamera, startDetection } = useFaceDetection();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickSec = useRef(-1);
  const metricsRef = useRef<FaceMetrics | null>(null);
  const holdTimeRef = useRef(0);
  const sessionAccuracies = useRef<number[]>([]);
  const symmetrySamples = useRef<number[]>([]);
  const evaluationRef = useRef<EvaluatorResult | null>(null);

  useEffect(() => { metricsRef.current = metrics; }, [metrics]);

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
    sessionAccuracies.current = [];
    symmetrySamples.current = [];
    setActiveProgramId(prog.id);
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
      let lastRestTime = performance.now();
      timerRef.current = setInterval(() => {
        const now = performance.now();
        const delta = (now - lastRestTime) / 1000;
        lastRestTime = now;

        setRestTimeLeft(prev => {
          const next = prev - delta;
          if (next <= 0) {
            setIsResting(false);
            setTimeLeft(20);
            setHoldTime(0);
            holdTimeRef.current = 0;
            return 0;
          }
          return next;
        });
      }, 50);
      return () => clearTimer();
    }

    const ex = exercises[currentIdx];
    if (!ex) return;

    let lastTime = performance.now();
    timerRef.current = setInterval(() => {
      const now = performance.now();
      const delta = Math.min(0.2, (now - lastTime) / 1000);
      lastTime = now;

      const currentMetrics = metricsRef.current;
      if (currentMetrics) {
        symmetrySamples.current.push(currentMetrics.symmetryScore);
        if (symmetrySamples.current.length > 3000) symmetrySamples.current.shift();
        const evaluator = EVALUATOR_MAP[ex.id];
        if (evaluator) {
          const result = evaluator(currentMetrics, holdTimeRef.current);
          setEvaluation(result);
          evaluationRef.current = result;
          if (result.isDetected) {
            holdTimeRef.current += delta;
            setHoldTime(holdTimeRef.current);
          }
        }
      }

      setTimeLeft(prev => {
        const next = prev - delta;
        if (next <= 0) {
          setXp(p => p + 25);
          if (evaluationRef.current) sessionAccuracies.current.push(evaluationRef.current.accuracyScore);
          if (currentSet >= (ex.reps || 3)) {
            setCompletedIds(p => new Set(p).add(ex.id));
            setCombo(p => p + 1);
            const nextIdx = currentIdx + 1;
            if (nextIdx >= exercises.length) {
              clearTimer();
              stopCamera();
              // Persist real session data
              const zoneSeconds: Record<string, number> = {};
              for (const e of exercises) {
                zoneSeconds[e.zone] = (zoneSeconds[e.zone] || 0) + (e.reps || 3) * 20;
              }
              const symSamples = symmetrySamples.current;
              const avgSym = symSamples.length > 0
                ? symSamples.reduce((a, b) => a + b, 0) / symSamples.length : 0;
              const finalXp = xp + exercises.length * 25;
              saveSession({
                date: new Date().toISOString(),
                mode: 'program',
                modeName: selectedProgram?.name || 'Program',
                score: finalXp,
                xp: finalXp,
                accuracy: sessionAccuracies.current.length > 0
                  ? Math.round((sessionAccuracies.current.reduce((a, b) => a + b, 0) / sessionAccuracies.current.length) * 100)
                  : 0,
                durationSec: exercises.reduce((a, e) => a + (e.reps || 3) * 20, 0),
                symmetry: Math.round(avgSym * 100),
                zoneSeconds,
                exercisesCompleted: exercises.length,
                bestCombo: combo + 1,
              });
              setPhase('done');
              return 0;
            }
            setCurrentIdx(nextIdx);
            setCurrentSet(1);
            setHoldTime(0);
            holdTimeRef.current = 0;
            setIsResting(true);
            setRestTimeLeft(5);
            return 0;
          }
          setCurrentSet(s => s + 1);
          setHoldTime(0);
          holdTimeRef.current = 0;
          setIsResting(true);
          setRestTimeLeft(3);
          return 0;
        }
        return next;
      });
    }, 50);
    return () => clearTimer();
  }, [phase, isPaused, currentIdx, currentSet, exercises, isResting, clearTimer, stopCamera]);

  const endSession = useCallback(() => {
    clearTimer();
    stopCamera();
    if (selectedProgram && phase === 'done') {
      const nextDay = Math.min((activeDayMap[selectedProgram.id] || 0) + 1, selectedProgram.days);
      setActiveDayMap(prev => ({ ...prev, [selectedProgram.id]: nextDay }));
      setProgramDay(selectedProgram.id, nextDay);
    }
    setPhase('list');
    setSelectedProgram(null);
  }, [clearTimer, stopCamera, selectedProgram, activeDayMap, phase]);

  // Keep all text outside the camera image.
  if (phase === 'training' || phase === 'preparing') {
    const ex = exercises[currentIdx];
    return <div className="camera-session">
      {phase === 'training' && !isResting ? <TrainingHUD exerciseName={ex?.nameTr || ''} exerciseId={ex?.id || ''} timeLeft={timeLeft} totalTime={20} rep={currentSet} totalReps={ex?.reps || 3} evaluation={evaluation} combo={combo} xp={xp} isPaused={isPaused} /> : <header className="camera-toolbar"><h2 className="text-sm">{isResting ? `Nefes al · ${Math.ceil(restTimeLeft)} sn` : selectedProgram?.name}</h2></header>}
      <div className="camera-viewport"><video ref={attachVideo} className="w-full h-full object-cover scale-x-[-1]" playsInline muted autoPlay /></div>
      <footer className="camera-coaching space-y-2">
        <p className="camera-guidance">{!modelsReady ? 'Yüz takip sistemi yükleniyor…' : !compatibility.allReady ? 'Yüzünü kadraja getir, önden ışık al.' : isResting ? 'Yüzünü gevşet, nefesini tutma.' : evaluation?.correctiveHintTr || ex?.howToTr}</p>
        <div className="flex gap-2">{phase === 'preparing' ? <Button disabled={!compatibility.allReady || !modelsReady} className="flex-1" onClick={beginTraining}>Başla</Button> : <Button variant="outline" className="flex-1" onClick={() => setIsPaused(!isPaused)}>{isPaused ? 'Devam' : 'Duraklat'}</Button>}<Button variant="ghost" onClick={endSession}>Kapat</Button></div>
      </footer>
    </div>;
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

  const activeProg = programs.find(p => p.id === activeProgram);
  return (
    <div className="app-screen space-y-6">
      <header><p className="text-xs text-muted-foreground mb-1">Her gün küçük bir adım</p><h1 className="font-bold">Programlar</h1></header>
      {activeProg && <section className="bg-muted p-5 rounded-2xl">
        <p className="text-xs text-primary mb-2">Devam ettiğin program</p>
        <h2 className="text-lg font-bold">{activeProg.name}</h2>
        <p className="text-xs text-muted-foreground mt-1">{activeDayMap[activeProg.id] || 0} / {activeProg.days} gün tamamlandı</p>
        <Button onClick={() => setSelectedProgram(activeProg)} className="mt-4 rounded-full">Devam et <ArrowUpRight /></Button>
      </section>}
      <div className="space-y-4">
        {programs.map(prog => <Button variant="ghost" key={prog.id} onClick={() => setSelectedProgram(prog)} className="wellness-program w-full h-auto p-5 text-left whitespace-normal justify-start items-start gap-4">
          <span className="shrink-0 flex flex-col items-center"><span className="text-4xl font-normal">{prog.days}</span><span className="text-[11px] text-muted-foreground mt-1">gün</span></span>
          <span className="flex-1 min-w-0"><span className="block text-base font-bold">{prog.name}</span><span className="block text-xs font-normal text-muted-foreground mt-2">{prog.desc}</span><span className="flex items-center gap-1.5 text-[10px] text-primary mt-4"><CalendarDays className="w-3 h-3" /> {prog.exerciseIds.length} hareket · Rehberli rutin</span></span>
          <ArrowUpRight className="text-primary" />
        </Button>)}
      </div>
    </div>
  );
}
