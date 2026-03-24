import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Zap, Target, Flame, Clock, ChevronRight } from 'lucide-react';
import { EXERCISES, QUICK_PLAY_EXERCISES, GYMFIESTA_EXERCISES } from '@/data/exercises';
import { ExerciseCard } from '@/components/ExerciseCard';
import { ExerciseDefinition, GameMode, SessionScore, EvaluatorResult } from '@/types/exercises';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { CompatibilityCheck } from '@/components/CompatibilityCheck';
import { TrainingHUD } from '@/components/TrainingHUD';
import { SessionSummary } from '@/components/SessionSummary';
import { EVALUATOR_MAP } from '@/lib/evaluators';
import { computeFaceMetrics } from '@/lib/face-detection';

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

  const { videoRef, compatibility, startCamera, stopCamera, startDetection } = useFaceDetection();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const modes = [
    { id: 'quick-play' as GameMode, name: 'Hızlı Oyun', desc: '5 hareket, hızlı seans', icon: Zap, exercises: QUICK_PLAY_EXERCISES },
    { id: 'guided-training' as GameMode, name: 'Rehberli Antrenman', desc: 'Tüm hareketler, detaylı yönlendirme', icon: Target, exercises: EXERCISES },
    { id: 'gymfiesta' as GameMode, name: 'GymFiesta Challenge', desc: '4 aksiyonlu yoğun challenge', icon: Flame, exercises: GYMFIESTA_EXERCISES },
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
    if (ex) {
      setTimeLeft(ex.holdDurationSec);
      setHoldTime(0);
    }
  }, [compatibility.allReady, activeExercises]);

  useEffect(() => {
    if (phase !== 'training' || isPaused || activeExercises.length === 0) return;

    const ex = activeExercises[currentIdx];
    if (!ex) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          // Rep complete
          const completed = currentRep >= ex.reps;
          if (completed) {
            setCompletedIds(prev => new Set(prev).add(ex.id));
            setCombo(prev => prev + 1);
            setXp(prev => prev + Math.round((evaluation?.accuracyScore || 0.5) * 50));

            const nextIdx = currentIdx + 1;
            if (nextIdx >= activeExercises.length) {
              // Session complete
              clearInterval(timerRef.current!);
              const score: SessionScore = {
                totalScore: xp + Math.round((evaluation?.accuracyScore || 0.5) * 100),
                xp: xp + 50,
                accuracy: (evaluation?.accuracyScore || 0.5) * 100,
                holdScore: 75,
                symmetryScore: 80,
                rhythmScore: 70,
                consistencyBonus: combo > 3 ? 20 : 0,
                comboBonus: combo * 5,
                streakBonus: 10,
              };
              setSessionScore(score);
              setPhase('summary');
              return 0;
            }

            setCurrentIdx(nextIdx);
            setCurrentRep(1);
            setHoldTime(0);
            return activeExercises[nextIdx].holdDurationSec;
          } else {
            setCurrentRep(prev => prev + 1);
            setHoldTime(0);
            return ex.holdDurationSec;
          }
        }
        setHoldTime(h => h + 0.1);
        return prev - 0.1;
      });

      // Run evaluator
      const evaluator = EVALUATOR_MAP[ex.id];
      if (evaluator) {
        // In production, get real metrics from face detection
        // For demo, use simulated metrics
        const demoMetrics = {
          mouthOpenness: 0.3 + Math.random() * 0.5,
          mouthWidth: 0.3 + Math.random() * 0.2,
          smileScore: 0.4 + Math.random() * 0.4,
          leftEyeOpenness: 0.5 + Math.random() * 0.3,
          rightEyeOpenness: 0.5 + Math.random() * 0.3,
          browRaiseLeft: 0.3 + Math.random() * 0.4,
          browRaiseRight: 0.3 + Math.random() * 0.4,
          headPitch: (Math.random() - 0.5) * 0.4,
          headYaw: (Math.random() - 0.5) * 0.3,
          headRoll: 0,
          lipProtrusion: 0.2 + Math.random() * 0.5,
          cheekPuffEstimate: 0.2 + Math.random() * 0.4,
          jawForward: Math.random() * 0.3,
          faceWidth: 200,
          faceHeight: 250,
          symmetryScore: 0.8 + Math.random() * 0.2,
        };
        setEvaluation(evaluator(demoMetrics, holdTime));
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, isPaused, currentIdx, currentRep, activeExercises, holdTime, combo, xp, evaluation?.accuracyScore]);

  const endSession = useCallback(() => {
    stopCamera();
    setPhase('menu');
    setSessionScore(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [stopCamera]);

  if (phase === 'summary' && sessionScore) {
    return (
      <SessionSummary
        score={sessionScore}
        onClose={endSession}
        coachMessage="Bugün yüz kaslarını iyi çalıştırdın! Yarın simetri hareketlerine odaklanalım. 💪"
      />
    );
  }

  if (phase === 'training') {
    const ex = activeExercises[currentIdx];
    return (
      <div className="relative h-[calc(100vh-4rem)] bg-background">
        {/* Camera feed placeholder */}
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover scale-x-[-1]"
            playsInline
            muted
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/60" />
        </div>

        <TrainingHUD
          exerciseName={ex?.nameTr || ''}
          timeLeft={timeLeft}
          totalTime={ex?.holdDurationSec || 8}
          rep={currentRep}
          totalReps={ex?.reps || 3}
          evaluation={evaluation}
          combo={combo}
          xp={xp}
          isPaused={isPaused}
        />

        {/* Side exercise list */}
        <div className="absolute right-2 top-32 bottom-24 z-10 w-16 flex flex-col gap-1 overflow-y-auto">
          {activeExercises.map((e, i) => (
            <div
              key={e.id}
              className={`glass-card p-1.5 text-center transition-all ${
                i === currentIdx ? 'neon-glow-red border-primary/50' : completedIds.has(e.id) ? 'border-secondary/50' : ''
              }`}
            >
              <span className="text-lg">{e.icon}</span>
              <p className="text-[8px] text-muted-foreground truncate">{e.nameTr}</p>
            </div>
          ))}
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-4 inset-x-4 z-10 flex gap-3">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex-1 glass-card py-3 font-display text-xs font-bold text-foreground"
          >
            {isPaused ? '▶ DEVAM' : '⏸ DURAKLAT'}
          </button>
          <button
            onClick={endSession}
            className="glass-card px-4 py-3 font-display text-xs font-bold text-destructive"
          >
            ✕ ÇIK
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'preparing') {
    return (
      <div className="relative h-[calc(100vh-4rem)] bg-background">
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            className="w-full h-full object-cover scale-x-[-1] opacity-40"
            playsInline
            muted
          />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-6">
          <h2 className="font-display text-xl font-black text-foreground mb-6">HAZIRLIK KONTROLÜ</h2>
          <div className="w-full max-w-sm mb-8">
            <CompatibilityCheck state={compatibility} />
          </div>
          {compatibility.allReady ? (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={startTraining}
              className="w-48 py-4 rounded-2xl gradient-primary font-display text-lg font-black text-primary-foreground neon-glow-red"
            >
              BAŞLA! 🔥
            </motion.button>
          ) : (
            <p className="text-muted-foreground text-sm">Tüm kontroller tamamlanana kadar bekle...</p>
          )}
          <button onClick={endSession} className="mt-4 text-sm text-muted-foreground">Geri dön</button>
        </div>
      </div>
    );
  }

  // Menu phase
  return (
    <div className="p-4 pb-20 space-y-6">
      <div className="text-center pt-4">
        <h1 className="font-display text-2xl font-black text-gradient-primary">OYNA</h1>
        <p className="text-muted-foreground text-sm mt-1">Kameranı aç, antrenmanına başla</p>
      </div>

      {/* Mode cards */}
      <div className="space-y-3">
        {modes.map((mode, i) => {
          const Icon = mode.icon;
          return (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => startMode(mode.id)}
              className="w-full glass-card p-4 flex items-center gap-4 text-left group hover:border-primary/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center neon-glow-red group-hover:beat-pulse">
                <Icon className="text-primary-foreground" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-sm font-bold text-foreground">{mode.name}</h3>
                <p className="text-xs text-muted-foreground">{mode.desc}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{mode.exercises.length} hareket</p>
              </div>
              <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </motion.button>
          );
        })}
      </div>

      {/* Quick access exercises */}
      <div>
        <h2 className="font-display text-sm font-bold text-foreground mb-3">HAREKETLER</h2>
        <div className="grid grid-cols-1 gap-2">
          {EXERCISES.slice(0, 4).map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} />
          ))}
        </div>
      </div>
    </div>
  );
}
