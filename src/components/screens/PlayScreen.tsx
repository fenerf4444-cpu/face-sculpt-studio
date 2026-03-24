import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { EXERCISES, QUICK_PLAY_EXERCISES, GYMFIESTA_EXERCISES } from '@/data/exercises';
import { ExerciseCard } from '@/components/ExerciseCard';
import { ExerciseDefinition, GameMode, SessionScore, EvaluatorResult } from '@/types/exercises';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { CompatibilityCheck } from '@/components/CompatibilityCheck';
import { TrainingHUD } from '@/components/TrainingHUD';
import { SessionSummary } from '@/components/SessionSummary';
import { EVALUATOR_MAP } from '@/lib/evaluators';
import { uiIcons, exerciseIcons } from '@/assets/iconMap';

type PlayPhase = 'menu' | 'preparing' | 'training' | 'summary';

export function PlayScreen() {
  const [phase, setPhase] = useState<PlayPhase>('menu');
  const [selectedMode, setSelectedMode] = useState<GameMode>('quick-play');
  const [activeExercises, setActiveExercises] = useState<ExerciseDefinition[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentRep, setCurrentRep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [holdTime, setHoldTime] = useState(0);
  const [evaluation, setEvaluation] = useState<EvaluatorResult | null>(null);
  const [combo, setCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [sessionScore, setSessionScore] = useState<SessionScore | null>(null);
  const [dailyQuest] = useState({ target: 3, completed: 1 });

  const { videoRef, compatibility, startCamera, stopCamera, startDetection } = useFaceDetection();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const modes = [
    { id: 'quick-play' as GameMode, name: 'Hizli Oyun', desc: '5 hareket, hizli seans', icon: uiIcons.gamepad, exercises: QUICK_PLAY_EXERCISES, glow: 'glow-red' },
    { id: 'guided-training' as GameMode, name: 'Rehberli Antrenman', desc: 'Tum hareketler, detayli yonlendirme', icon: uiIcons.target, exercises: EXERCISES, glow: 'glow-green' },
    { id: 'gymfiesta' as GameMode, name: 'GymFiesta Challenge', desc: '4 aksiyonlu yogun challenge', icon: uiIcons.streakFire, exercises: GYMFIESTA_EXERCISES, glow: 'glow-orange' },
  ];

  const startMode = useCallback(async (mode: GameMode) => {
    const modeConfig = modes.find(m => m.id === mode);
    if (!modeConfig) return;
    setSelectedMode(mode);
    setActiveExercises(modeConfig.exercises);
    setPhase('preparing');
    setCurrentIdx(0);
    setCurrentRep(1);
    setCombo(0);
    setXp(0);
    setCompletedIds(new Set());
    await startCamera();
    startDetection();
  }, [startCamera, startDetection]);

  const startTraining = useCallback(() => {
    if (!compatibility.allReady) return;
    setPhase('training');
    const ex = activeExercises[0];
    if (ex) { setTimeLeft(ex.holdDurationSec); setHoldTime(0); }
  }, [compatibility.allReady, activeExercises]);

  useEffect(() => {
    if (phase !== 'training' || isPaused || activeExercises.length === 0) return;
    const ex = activeExercises[currentIdx];
    if (!ex) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          const completed = currentRep >= ex.reps;
          if (completed) {
            setCompletedIds(p => new Set(p).add(ex.id));
            setCombo(p => p + 1);
            setXp(p => p + Math.round((evaluation?.accuracyScore || 0.5) * 50));
            const nextIdx = currentIdx + 1;
            if (nextIdx >= activeExercises.length) {
              clearInterval(timerRef.current!);
              setSessionScore({
                totalScore: xp + Math.round((evaluation?.accuracyScore || 0.5) * 100),
                xp: xp + 50, accuracy: (evaluation?.accuracyScore || 0.5) * 100,
                holdScore: 75, symmetryScore: 80, rhythmScore: 70,
                consistencyBonus: combo > 3 ? 20 : 0, comboBonus: combo * 5, streakBonus: 10,
              });
              setPhase('summary');
              return 0;
            }
            setCurrentIdx(nextIdx); setCurrentRep(1); setHoldTime(0);
            return activeExercises[nextIdx].holdDurationSec;
          } else {
            setCurrentRep(p => p + 1); setHoldTime(0);
            return ex.holdDurationSec;
          }
        }
        setHoldTime(h => h + 0.1);
        return prev - 0.1;
      });

      const evaluator = EVALUATOR_MAP[ex.id];
      if (evaluator) {
        const dm = {
          mouthOpenness: 0.3 + Math.random() * 0.5, mouthWidth: 0.3 + Math.random() * 0.2,
          smileScore: 0.4 + Math.random() * 0.4, leftEyeOpenness: 0.5 + Math.random() * 0.3,
          rightEyeOpenness: 0.5 + Math.random() * 0.3, browRaiseLeft: 0.3 + Math.random() * 0.4,
          browRaiseRight: 0.3 + Math.random() * 0.4, headPitch: (Math.random() - 0.5) * 0.4,
          headYaw: (Math.random() - 0.5) * 0.3, headRoll: 0, lipProtrusion: 0.2 + Math.random() * 0.5,
          cheekPuffEstimate: 0.2 + Math.random() * 0.4, jawForward: Math.random() * 0.3,
          faceWidth: 200, faceHeight: 250, symmetryScore: 0.8 + Math.random() * 0.2,
        };
        setEvaluation(evaluator(dm, holdTime));
      }
    }, 100);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, isPaused, currentIdx, currentRep, activeExercises, holdTime, combo, xp, evaluation?.accuracyScore]);

  const endSession = useCallback(() => {
    stopCamera(); setPhase('menu'); setSessionScore(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [stopCamera]);

  if (phase === 'summary' && sessionScore) {
    return <SessionSummary score={sessionScore} onClose={endSession} coachMessage="Bugyn jawline hareketlerinde daha stabildin. Yarin simetri hareketlerine odaklanalim." />;
  }

  if (phase === 'training') {
    const ex = activeExercises[currentIdx];
    return (
      <div className="relative h-[calc(100vh-4rem)] bg-background">
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, hsl(240 10% 4% / 0.8) 0%, transparent 40%, hsl(240 10% 4% / 0.6) 100%)'
          }} />
        </div>
        <TrainingHUD exerciseName={ex?.nameTr || ''} exerciseId={ex?.id || ''} timeLeft={timeLeft} totalTime={ex?.holdDurationSec || 8} rep={currentRep} totalReps={ex?.reps || 3} evaluation={evaluation} combo={combo} xp={xp} isPaused={isPaused} />
        
        <div className="absolute right-2 top-36 bottom-28 z-10 w-[60px] flex flex-col gap-2 overflow-y-auto">
          {activeExercises.map((e, i) => {
            const ic = exerciseIcons[e.id];
            return (
              <div key={e.id} className={`p-1.5 text-center transition-all ${i === currentIdx ? 'card-3d-elevated glow-red' : completedIds.has(e.id) ? 'card-3d glow-green' : 'card-3d-inset'}`}>
                {ic ? <img src={ic} alt={e.nameTr} width={32} height={32} className="mx-auto object-contain" loading="lazy" /> : <span className="text-sm font-display text-muted-foreground">{e.name[0]}</span>}
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-4 inset-x-4 z-10 flex gap-3">
          <button onClick={() => setIsPaused(!isPaused)} className="flex-1 card-3d-elevated py-3 font-display text-sm font-bold text-foreground active:scale-95 transition-transform">
            {isPaused ? 'DEVAM' : 'DURAKLAT'}
          </button>
          <button onClick={endSession} className="card-3d-elevated px-5 py-3 font-display text-sm font-bold text-destructive active:scale-95 transition-transform">CIK</button>
        </div>
      </div>
    );
  }

  if (phase === 'preparing') {
    return (
      <div className="relative h-[calc(100vh-4rem)] bg-background">
        <div className="absolute inset-0">
          <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1] opacity-30" playsInline muted />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-6">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">HAZIRLIK KONTROLU</h2>
          <div className="w-full max-w-sm mb-8">
            <CompatibilityCheck state={compatibility} />
          </div>
          {compatibility.allReady ? (
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.95 }} onClick={startTraining} className="w-52 py-4 btn-3d-primary text-lg text-primary-foreground glow-red">BASLA!</motion.button>
          ) : (
            <p className="text-muted-foreground text-sm">Tum kontroller tamamlanana kadar bekle...</p>
          )}
          <button onClick={endSession} className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">Geri don</button>
        </div>
      </div>
    );
  }

  // Menu
  return (
    <div className="p-4 pb-24 space-y-6">
      {/* Header */}
      <div className="text-center pt-6">
        <h1 className="font-display text-4xl font-bold text-gradient-primary tracking-tight">OYNA</h1>
        <p className="text-muted-foreground text-sm mt-1">Kamerani ac, antrenmanina basla</p>
      </div>

      {/* Daily Quest Card */}
      <div className="card-3d-elevated p-4 glow-red shimmer">
        <div className="flex items-center gap-3">
          <img src={uiIcons.streakFire} alt="Streak" width={40} height={40} className="float-3d" />
          <div className="flex-1">
            <p className="font-display text-sm font-bold text-foreground">GUNLUK GOREV</p>
            <p className="text-xs text-muted-foreground">{dailyQuest.completed}/{dailyQuest.target} seans tamamla</p>
            <div className="card-3d-inset p-0.5 rounded-full mt-2">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-red-500 to-orange-400" style={{ width: `${(dailyQuest.completed / dailyQuest.target) * 100}%`, boxShadow: '0 0 8px hsl(350 85% 55% / 0.4)' }} />
            </div>
          </div>
          <div className="card-3d-inset px-3 py-1.5 rounded-xl">
            <span className="font-display text-xs font-bold text-neon-orange">+50 XP</span>
          </div>
        </div>
      </div>

      {/* Mode cards */}
      <div className="space-y-3">
        {modes.map((mode, i) => (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => startMode(mode.id)}
            className={`w-full card-3d-elevated p-5 flex items-center gap-4 text-left group transition-all hover:${mode.glow}`}
          >
            <div className="relative w-14 h-14 shrink-0">
              <img src={mode.icon} alt={mode.name} width={56} height={56} className="w-full h-full object-contain group-hover:float-3d transition-transform" loading="lazy" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-bold text-foreground">{mode.name}</h3>
              <p className="text-xs text-muted-foreground">{mode.desc}</p>
              <div className="card-3d-inset inline-block px-2 py-0.5 mt-1.5 rounded-lg">
                <span className="text-[10px] font-display text-muted-foreground">{mode.exercises.length} hareket</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg card-3d flex items-center justify-center">
              <span className="text-muted-foreground text-sm">›</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Exercise list */}
      <div>
        <h2 className="font-display text-lg font-bold text-foreground mb-3">HAREKETLER</h2>
        <div className="space-y-2.5">
          {EXERCISES.slice(0, 4).map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} />
          ))}
        </div>
      </div>
    </div>
  );
}
