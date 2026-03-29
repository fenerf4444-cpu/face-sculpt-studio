import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EXERCISES, QUICK_PLAY_EXERCISES, GYMFIESTA_EXERCISES, LIP_TRACKING_EXERCISES } from '@/data/exercises';
import { ExerciseCard } from '@/components/ExerciseCard';
import { ExerciseDefinition, GameMode, SessionScore, EvaluatorResult } from '@/types/exercises';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { CompatibilityCheck } from '@/components/CompatibilityCheck';
import { TrainingHUD } from '@/components/TrainingHUD';
import { SessionSummary } from '@/components/SessionSummary';
import { FaceLandmarkOverlay } from '@/components/FaceLandmarkOverlay';
import { NeonFaceFrame } from '@/components/NeonFaceFrame';
import { EVALUATOR_MAP } from '@/lib/evaluators';
import { uiIcons, exerciseIcons } from '@/assets/iconMap';
import { speakCountdown, speakExerciseStart, speakRest, speakCorrectiveHint, speakEncouragement, speakSessionEnd, cancelSpeech } from '@/lib/voice-guidance';

type PlayPhase = 'menu' | 'detail' | 'preparing' | 'training' | 'summary';

const MODES = [
  { id: 'quick-play' as GameMode, name: 'Hizli Antrenman', desc: '5 hareket, 3 set x 20 sn', icon: uiIcons.faceTraining, exercises: QUICK_PLAY_EXERCISES, glow: 'glow-red' },
  { id: 'guided-training' as GameMode, name: 'Rehberli Antrenman', desc: 'Tum hareketler, 3 set x 20 sn', icon: uiIcons.programFace, exercises: EXERCISES, glow: 'glow-green' },
  { id: 'gymfiesta' as GameMode, name: 'Yogun Challenge', desc: '4 aksiyon, yogun challenge', icon: uiIcons.streakFire, exercises: GYMFIESTA_EXERCISES, glow: 'glow-orange' },
  { id: 'zone-play' as GameMode, name: 'Dudak Takip Programi', desc: 'Topu takip et, dudak egzersizleri', icon: uiIcons.learnFace, exercises: LIP_TRACKING_EXERCISES, glow: 'glow-pink' },
];

// Rhythmic tick sound using Web Audio API
function playTick() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch {}
}

function playCountdown(num: number) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = num <= 3 ? 660 : 440;
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

export function PlayScreen() {
  const [phase, setPhase] = useState<PlayPhase>('menu');
  const [selectedMode, setSelectedMode] = useState<GameMode>('quick-play');
  const [activeExercises, setActiveExercises] = useState<ExerciseDefinition[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [holdTime, setHoldTime] = useState(0);
  const [evaluation, setEvaluation] = useState<EvaluatorResult | null>(null);
  const [combo, setCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [sessionScore, setSessionScore] = useState<SessionScore | null>(null);
  const [dailyQuest] = useState({ target: 3, completed: 1 });
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [modelError, setModelError] = useState<string | null>(null);
  const [detailExercises, setDetailExercises] = useState<ExerciseDefinition[]>([]);
  const [detailModeName, setDetailModeName] = useState('');
  const [difficulty, setDifficulty] = useState<'normal' | 'hard'>('normal');
  const [ballX, setBallX] = useState(50);
  const lastTickSec = useRef(-1);

  const { videoRef, metrics, landmarks, videoSize, compatibility, modelsReady, startCamera, stopCamera, startDetection } = useFaceDetection();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionAccuracies = useRef<number[]>([]);
  const lastVoiceHintTime = useRef(0);
  const lastEncouragementTime = useRef(0);

  // Refs to avoid effect dependency issues (timer restart bug)
  const metricsRef = useRef(metrics);
  const holdTimeRef = useRef(0);
  const comboRef = useRef(0);
  const xpRef = useRef(0);
  const evaluationRef = useRef<EvaluatorResult | null>(null);

  useEffect(() => { metricsRef.current = metrics; }, [metrics]);
  useEffect(() => { holdTimeRef.current = holdTime; }, [holdTime]);
  useEffect(() => { comboRef.current = combo; }, [combo]);
  useEffect(() => { xpRef.current = xp; }, [xp]);

  const holdDuration = difficulty === 'hard' ? 30 : 20;

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // Show exercise detail before starting camera
  const showModeDetail = useCallback((mode: GameMode) => {
    const modeConfig = MODES.find(m => m.id === mode);
    if (!modeConfig) return;
    setSelectedMode(mode);
    setDetailExercises(modeConfig.exercises);
    setDetailModeName(modeConfig.name);
    setPhase('detail');
  }, []);

  const startMode = useCallback(async () => {
    setActiveExercises(detailExercises.map(e => ({ ...e, holdDurationSec: holdDuration })));
    setPhase('preparing');
    setCurrentIdx(0);
    setCurrentSet(1);
    setCombo(0);
    setXp(0);
    setCompletedIds(new Set());
    setModelError(null);
    sessionAccuracies.current = [];
    try {
      const ok = await startCamera();
      if (ok) startDetection();
    } catch {
      setModelError('Kamera baslatma hatasi');
    }
  }, [detailExercises, holdDuration, startCamera, startDetection]);

  const startTraining = useCallback(() => {
    if (!compatibility.allReady) return;
    setPhase('training');
    setTimeLeft(holdDuration);
    setHoldTime(0);
    setIsResting(false);
    lastTickSec.current = -1;
    const ex = detailExercises[0];
    if (ex) speakExerciseStart(ex.nameTr, 1, ex.reps);
  }, [compatibility.allReady, holdDuration, detailExercises]);

  // Lip slide ball animation
  useEffect(() => {
    if (phase !== 'training' || isResting || isPaused) return;
    const ex = activeExercises[currentIdx];
    if (ex?.id !== 'lip-slide') return;
    const interval = setInterval(() => {
      setBallX(prev => {
        const t = Date.now() / 1000;
        return 20 + 60 * ((Math.sin(t * 1.5) + 1) / 2);
      });
    }, 50);
    return () => clearInterval(interval);
  }, [phase, isResting, isPaused, currentIdx, activeExercises]);

   // Main training loop - uses refs to avoid constant restarts
  useEffect(() => {
    if (phase !== 'training' || isPaused || activeExercises.length === 0) return;

    if (isResting) {
      const nextEx = currentSet < (activeExercises[currentIdx]?.reps || 3)
        ? activeExercises[currentIdx] : activeExercises[currentIdx + 1];
      speakRest(nextEx?.nameTr);
      timerRef.current = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 0.1) {
            setIsResting(false);
            setTimeLeft(holdDuration);
            setHoldTime(0);
            holdTimeRef.current = 0;
            lastTickSec.current = -1;
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
      return () => clearTimer();
    }

    const ex = activeExercises[currentIdx];
    if (!ex) return;

    timerRef.current = setInterval(() => {
      const currentMetrics = metricsRef.current;
      if (currentMetrics) {
        const evaluator = EVALUATOR_MAP[ex.id];
        if (evaluator) {
          const ht = holdTimeRef.current;
          const result = evaluator(currentMetrics, ht);
          setEvaluation(result);
          evaluationRef.current = result;
          if (result.isDetected) {
            holdTimeRef.current += 0.1;
            setHoldTime(holdTimeRef.current);
            const now = Date.now();
            if (ht > 0 && ht % 8 < 0.15 && now - lastEncouragementTime.current > 7000) {
              lastEncouragementTime.current = now;
              speakEncouragement();
            }
          } else {
            const now = Date.now();
            if (now - lastVoiceHintTime.current > 4000 && result.correctiveHintTr) {
              lastVoiceHintTime.current = now;
              speakCorrectiveHint(result.correctiveHintTr);
            }
          }
        }
      }

      setTimeLeft(prev => {
        const sec = Math.ceil(prev);
        if (sec !== lastTickSec.current && sec > 0) {
          lastTickSec.current = sec;
          if (sec <= 5) { playCountdown(sec); speakCountdown(sec); }
          else if (sec % 5 === 0) playTick();
        }

        if (prev <= 0.1) {
          const accuracy = evaluationRef.current?.accuracyScore || 0;
          sessionAccuracies.current.push(accuracy);
          setXp(p => { xpRef.current = p + Math.round(accuracy * 30); return xpRef.current; });

          if (currentSet >= ex.reps) {
            setCompletedIds(p => new Set(p).add(ex.id));
            setCombo(p => { comboRef.current = p + 1; return comboRef.current; });
            setXp(p => { xpRef.current = p + 25; return xpRef.current; });

            const nextIdx = currentIdx + 1;
            if (nextIdx >= activeExercises.length) {
              clearTimer();
              speakSessionEnd();
              const avgAcc = sessionAccuracies.current.length > 0
                ? sessionAccuracies.current.reduce((a, b) => a + b, 0) / sessionAccuracies.current.length : 0.5;
              setSessionScore({
                totalScore: xpRef.current + Math.round(avgAcc * 100),
                xp: xpRef.current + 50, accuracy: avgAcc * 100, holdScore: 75,
                symmetryScore: 80, rhythmScore: 70,
                consistencyBonus: comboRef.current > 3 ? 20 : 0, comboBonus: comboRef.current * 5, streakBonus: 10,
              });
              setPhase('summary');
              return 0;
            }
            setCurrentIdx(nextIdx);
            setCurrentSet(1);
            setHoldTime(0);
            holdTimeRef.current = 0;
            setIsResting(true);
            setRestTimeLeft(5);
            speakExerciseStart(activeExercises[nextIdx].nameTr, 1, activeExercises[nextIdx].reps);
            return 0;
          } else {
            const nextSet = currentSet + 1;
            setCurrentSet(nextSet);
            setHoldTime(0);
            holdTimeRef.current = 0;
            setIsResting(true);
            setRestTimeLeft(3);
            return 0;
          }
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearTimer();
  }, [phase, isPaused, currentIdx, currentSet, activeExercises, isResting, clearTimer, holdDuration]);

  const endSession = useCallback(() => {
    clearTimer();
    stopCamera();
    cancelSpeech();
    setPhase('menu');
    setSessionScore(null);
    setEvaluation(null);
  }, [stopCamera, clearTimer]);

  if (phase === 'summary' && sessionScore) {
    return <SessionSummary score={sessionScore} onClose={endSession} coachMessage="Harika antrenman! Tutarliligini korumaya devam et." />;
  }

  if (phase === 'training') {
    const ex = activeExercises[currentIdx];
    const isLipSlide = ex?.id === 'lip-slide';
    // Determine active zone for coloring
    const zoneColorMap: Record<string, string> = {
      lips: 'hsl(350 85% 55% / 0.3)',
      cheeks: 'hsl(330 85% 58% / 0.3)',
      eyes: 'hsl(185 80% 50% / 0.3)',
      forehead: 'hsl(25 95% 55% / 0.3)',
      jaw: 'hsl(160 75% 42% / 0.3)',
      neck: 'hsl(270 60% 55% / 0.3)',
    };
    const zoneGlow = zoneColorMap[ex?.zone || ''] || 'transparent';

    return (
      <div className="relative h-[calc(100vh-4rem)] bg-background">
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted autoPlay />
          {/* Face landmark overlay */}
          <FaceLandmarkOverlay
            landmarks={landmarks}
            videoSize={videoSize}
            activeZone={ex?.zone}
            isDetected={evaluation?.isDetected}
          />
          <NeonFaceFrame
            landmarks={landmarks}
            videoSize={videoSize}
            isCorrect={evaluation?.isDetected && (evaluation?.accuracyScore || 0) > 0.4}
            isDetected={!!evaluation?.isDetected}
          />
          {/* Zone highlight overlay - edges only, not center */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `radial-gradient(ellipse 50% 60% at 50% 45%, transparent 40%, ${zoneGlow} 100%)`
          }} />
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(to top, hsl(240 10% 4% / 0.7) 0%, transparent 25%, transparent 75%, hsl(240 10% 4% / 0.5) 100%)'
          }} />
        </div>

        {/* Lip slide ball */}
        {isLipSlide && !isResting && (
          <motion.div
            className="absolute z-20 pointer-events-none"
            style={{ left: `${ballX}%`, top: '55%', transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-10 h-10 rounded-full glow-pink" style={{
              background: 'radial-gradient(circle, hsl(330 85% 65%), hsl(350 85% 50%))',
              boxShadow: '0 0 20px hsl(330 85% 58% / 0.6)'
            }} />
          </motion.div>
        )}

        <AnimatePresence>
          {isResting ? (
            <motion.div key="rest" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 z-30 flex items-center justify-center">
              <div className="text-center card-3d-elevated p-8 glow-green">
                <p className="font-display text-lg text-muted-foreground mb-2">NEFES AL</p>
                <p className="font-display text-5xl font-bold text-foreground">{Math.ceil(restTimeLeft)}</p>
                <p className="text-sm text-muted-foreground mt-3">
                  {currentSet < (ex?.reps || 3) ? `Sonraki set: ${currentSet + 1}/${ex?.reps || 3}` : `Sonraki: ${activeExercises[currentIdx + 1]?.nameTr || ''}`}
                </p>
              </div>
            </motion.div>
          ) : (
            <TrainingHUD
              exerciseName={ex?.nameTr || ''}
              exerciseId={ex?.id || ''}
              timeLeft={timeLeft}
              totalTime={holdDuration}
              rep={currentSet}
              totalReps={ex?.reps || 3}
              evaluation={evaluation}
              combo={combo}
              xp={xp}
              isPaused={isPaused}
            />
          )}
        </AnimatePresence>

        {/* Exercise sidebar - bottom right, small */}
        <div className="absolute right-2 bottom-20 z-10 flex gap-1.5">
          {activeExercises.map((e, i) => (
            <div key={e.id} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-display font-bold transition-all ${
              i === currentIdx ? 'btn-3d-primary text-primary-foreground' :
              completedIds.has(e.id) ? 'card-3d glow-green text-secondary' :
              'card-3d-inset text-muted-foreground'
            }`}>{i + 1}</div>
          ))}
        </div>

        {/* Live metrics - small, bottom left */}
        {metrics && !isResting && (
          <div className="absolute left-2 bottom-20 z-10 card-3d-inset p-1.5 text-[8px] font-mono text-muted-foreground opacity-50 leading-tight">
            <div>A:{(metrics.mouthOpenness * 100).toFixed(0)}%</div>
            <div>G:{(metrics.smileScore * 100).toFixed(0)}%</div>
            <div>S:{(metrics.symmetryScore * 100).toFixed(0)}%</div>
          </div>
        )}

        <div className="absolute bottom-3 inset-x-3 z-10 flex gap-2">
          <button onClick={() => setIsPaused(!isPaused)} className="flex-1 card-3d-elevated py-2.5 font-display text-xs font-bold text-foreground active:scale-95 transition-transform">
            {isPaused ? 'DEVAM' : 'DURAKLAT'}
          </button>
          <button onClick={endSession} className="card-3d-elevated px-4 py-2.5 font-display text-xs font-bold text-destructive active:scale-95 transition-transform">CIK</button>
        </div>
      </div>
    );
  }

  if (phase === 'preparing') {
    return (
      <div className="relative h-[calc(100vh-4rem)] bg-background">
        <div className="absolute inset-0">
          <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1] opacity-30" playsInline muted autoPlay />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-6">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">HAZIRLIK KONTROLU</h2>
          {!modelsReady && (
            <div className="card-3d-elevated px-6 py-3 mb-4 glow-orange">
              <p className="text-sm font-display text-neon-orange">Yuz algilama modeli yukleniyor...</p>
            </div>
          )}
          {modelError && (
            <div className="card-3d-elevated px-6 py-3 mb-4 glow-red">
              <p className="text-sm font-display text-destructive">{modelError}</p>
            </div>
          )}
          <div className="w-full max-w-sm mb-8">
            <CompatibilityCheck state={compatibility} />
          </div>
          <p className="text-xs text-muted-foreground mb-4 text-center max-w-xs">
            Her hareket {holdDuration} saniye x 3 set. Setler arasi 3 sn dinlenme.
          </p>
          {compatibility.allReady ? (
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.95 }}
              onClick={startTraining} className="w-52 py-4 btn-3d-primary text-lg text-primary-foreground glow-red">
              BASLA!
            </motion.button>
          ) : (
            <p className="text-muted-foreground text-sm">Kontroller tamamlaniyor...</p>
          )}
          <button onClick={endSession} className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">Geri don</button>
        </div>
      </div>
    );
  }

  // Exercise detail screen before camera
  if (phase === 'detail') {
    return (
      <div className="p-4 pb-24 space-y-4">
        <button onClick={() => setPhase('menu')} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-display">← Geri</button>
        <h2 className="font-display text-2xl font-bold text-foreground text-center">{detailModeName}</h2>
        <p className="text-xs text-muted-foreground text-center">{detailExercises.length} hareket x 3 set x {holdDuration} sn</p>

        {/* Difficulty toggle */}
        <div className="flex gap-2 justify-center">
          <button onClick={() => setDifficulty('normal')}
            className={`px-4 py-2 rounded-xl font-display text-xs font-bold transition-all ${difficulty === 'normal' ? 'btn-3d-primary text-primary-foreground' : 'card-3d text-muted-foreground'}`}>
            NORMAL (20 sn)
          </button>
          <button onClick={() => setDifficulty('hard')}
            className={`px-4 py-2 rounded-xl font-display text-xs font-bold transition-all ${difficulty === 'hard' ? 'btn-3d-primary text-primary-foreground' : 'card-3d text-muted-foreground'}`}>
            ZOR (30 sn)
          </button>
        </div>

        <div className="space-y-3">
          {detailExercises.map((ex, i) => {
            const ic = exerciseIcons[ex.id];
            return (
              <motion.div key={ex.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card-3d p-4">
                <div className="flex items-center gap-3 mb-2">
                  {ic ? <img src={ic} alt={ex.nameTr} width={40} height={40} className="object-contain" /> :
                    <div className="w-10 h-10 rounded-lg card-3d-inset flex items-center justify-center"><span className="text-sm text-muted-foreground font-display">{i + 1}</span></div>}
                  <div className="flex-1">
                    <h3 className="font-display text-sm font-bold text-foreground">{ex.nameTr}</h3>
                    <p className="text-[10px] text-muted-foreground">{holdDuration}s x {ex.reps} set | {ex.zone}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{ex.howToTr}</p>
                {ex.commonMistakesTr.length > 0 && (
                  <div className="mt-2 card-3d-inset p-2">
                    <p className="text-[9px] text-destructive font-display">Dikkat: {ex.commonMistakesTr[0]}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.button whileTap={{ scale: 0.95 }} onClick={startMode}
          className="w-full py-4 btn-3d-primary text-lg text-primary-foreground glow-red font-display">
          KAMERAYI AC VE BASLA
        </motion.button>
      </div>
    );
  }

  // Menu
  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="text-center pt-6">
        <h1 className="font-display text-4xl font-bold text-gradient-primary tracking-tight">OYNA</h1>
        <p className="text-muted-foreground text-sm mt-1">Kamerani ac, antrenmanina basla</p>
      </div>

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

      <div className="space-y-3">
        {MODES.map((mode, i) => (
          <motion.button key={mode.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => showModeDetail(mode.id)}
            className={`w-full card-3d-elevated p-5 flex items-center gap-4 text-left group transition-all`}>
            <div className="relative w-14 h-14 shrink-0">
              <img src={mode.icon} alt={mode.name} width={56} height={56} className="w-full h-full object-contain" loading="lazy" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-bold text-foreground">{mode.name}</h3>
              <p className="text-xs text-muted-foreground">{mode.desc}</p>
              <div className="card-3d-inset inline-block px-2 py-0.5 mt-1.5 rounded-lg">
                <span className="text-[10px] font-display text-muted-foreground">{mode.exercises.length} hareket x 3 set</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg card-3d flex items-center justify-center">
              <span className="text-muted-foreground text-sm">›</span>
            </div>
          </motion.button>
        ))}
      </div>

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
