import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EXERCISES, QUICK_PLAY_EXERCISES, GYMFIESTA_EXERCISES, LIP_TRACKING_EXERCISES } from '@/data/exercises';
import { Button } from '@/components/ui/button';
import { Camera, Pause, Play, X } from 'lucide-react';
import { PersonalSessionBuilder } from '@/components/PersonalSessionBuilder';
import type { TrainingRequest } from '@/lib/training-request';
import { WellnessHome } from '@/components/WellnessHome';
import { ExerciseDefinition, GameMode, SessionScore, EvaluatorResult, CalibrationData } from '@/types/exercises';
import { FaceMetrics } from '@/lib/face-detection';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { CompatibilityCheck } from '@/components/CompatibilityCheck';
import { TrainingHUD } from '@/components/TrainingHUD';
import { SessionSummary } from '@/components/SessionSummary';
import { FaceLandmarkOverlay } from '@/components/FaceLandmarkOverlay';
import { NeonFaceFrame } from '@/components/NeonFaceFrame';
import { EVALUATOR_MAP } from '@/lib/evaluators';
import { uiIcons, exerciseIcons } from '@/assets/iconMap';
import { speakCountdown, speakExerciseStart, speakRest, speakCorrectiveHint, speakEncouragement, speakSessionEnd, cancelSpeech } from '@/lib/voice-guidance';
import { saveSession, loadSessions, getTodaySessionCount } from '@/lib/session-store';

type PlayPhase = 'menu' | 'detail' | 'preparing' | 'calibrating' | 'training' | 'summary';

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

export function PlayScreen({ initialRequest, onRequestConsumed, onCameraActive }: { initialRequest?: TrainingRequest | null; onRequestConsumed?: () => void; onCameraActive?: (active: boolean) => void } = {}) {
  const [personalizing, setPersonalizing] = useState(false);
  const [customRequest, setCustomRequest] = useState<TrainingRequest | null>(null);
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
  const [sessionsToday, setSessionsToday] = useState(() => getTodaySessionCount(loadSessions()));
  const DAILY_TARGET = 3;
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [modelError, setModelError] = useState<string | null>(null);
  const [detailExercises, setDetailExercises] = useState<ExerciseDefinition[]>([]);
  const [detailModeName, setDetailModeName] = useState('');
  const [difficulty, setDifficulty] = useState<'normal' | 'hard'>('normal');
  const [ballX, setBallX] = useState(50);
  const lastTickSec = useRef(-1);

  const { attachVideo, metrics, landmarks, videoSize, compatibility, modelsReady, startCamera, stopCamera, startDetection } = useFaceDetection();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionAccuracies = useRef<number[]>([]);
  const symmetrySamples = useRef<number[]>([]);
  const calibrationRef = useRef<CalibrationData | null>(null);
  const calibSamples = useRef<FaceMetrics[]>([]);
  const [calibTimeLeft, setCalibTimeLeft] = useState(3);
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

  const holdDuration = customRequest?.personalized ? 30 : difficulty === 'hard' ? 30 : 20;

  useEffect(() => {
    if (!initialRequest) return;
    setCustomRequest(initialRequest);
    setDetailExercises(initialRequest.exercises);
    setDetailModeName(initialRequest.title);
    setSelectedMode('guided-training');
    setPhase('detail');
    onRequestConsumed?.();
  }, [initialRequest, onRequestConsumed]);

  useEffect(() => {
    onCameraActive?.(['preparing', 'calibrating', 'training'].includes(phase));
    return () => onCameraActive?.(false);
  }, [phase, onCameraActive]);

  const compatibilityRef = useRef(compatibility);
  useEffect(() => { compatibilityRef.current = compatibility; }, [compatibility]);
  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden && phase === 'training') { setIsPaused(true); cancelSpeech(); } };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, [phase]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // Show exercise detail before starting camera
  const showModeDetail = useCallback((mode: GameMode) => {
    const modeConfig = MODES.find(m => m.id === mode);
    if (!modeConfig) return;
    setCustomRequest(null);
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
    setIsPaused(false);
    setEvaluation(null);
    evaluationRef.current = null;
    calibrationRef.current = null;
    setCombo(0);
    setXp(0);
    setCompletedIds(new Set());
    setModelError(null);
    sessionAccuracies.current = [];
    symmetrySamples.current = [];
    try {
      const ok = await startCamera();
      if (ok) startDetection();
    } catch {
      setModelError('Kamera baslatma hatasi');
    }
  }, [detailExercises, holdDuration, startCamera, startDetection]);

  // Enter calibration phase: capture the user's neutral face for 3 seconds
  // so detection thresholds adapt to their personal anatomy.
  const startTraining = useCallback(() => {
    if (!compatibility.allReady) return;
    calibSamples.current = [];
    setCalibTimeLeft(3);
    setPhase('calibrating');
  }, [compatibility.allReady]);

  // Calibration capture loop
  useEffect(() => {
    if (phase !== 'calibrating') return;
    let start = performance.now();
    const iv = setInterval(() => {
      const m = metricsRef.current;
      if (!m || !compatibilityRef.current.allReady) { start = performance.now(); calibSamples.current = []; setCalibTimeLeft(3); return; }
      calibSamples.current.push(m);
      const left = Math.max(0, 3 - (performance.now() - start) / 1000);
      setCalibTimeLeft(left);
      if (left <= 0) {
        clearInterval(iv);
        const samples = calibSamples.current;
        let neutral: Record<string, number> | null = null;
        if (samples.length > 5) {
          const avg = (k: keyof FaceMetrics) =>
            samples.reduce((a, s) => a + (s[k] as number), 0) / samples.length;
          neutral = {
            mouthOpenness: avg('mouthOpenness'),
            leftEyeOpenness: avg('leftEyeOpenness'),
            rightEyeOpenness: avg('rightEyeOpenness'),
            browRaiseLeft: avg('browRaiseLeft'),
            browRaiseRight: avg('browRaiseRight'),
            lipProtrusion: avg('lipProtrusion'),
            mouthWidth: avg('mouthWidth'),
            cheekWidthRatio: avg('cheekWidthRatio'),
            lipRatio: avg('lipRatio'),
            cheekHollow: avg('cheekHollow'),
          };
        }
        calibrationRef.current = {
          neutral, smile: null, blink: null, mouthOpen: null,
          browRaise: null, cheekPuff: null, completed: !!neutral,
        };
        setPhase('training');
        setTimeLeft(holdDuration);
        setHoldTime(0);
        holdTimeRef.current = 0;
        setIsResting(false);
        lastTickSec.current = -1;
        const ex = activeExercises[0];
        if (ex) speakExerciseStart(ex.nameTr, 1, ex.reps);
      }
    }, 100);
    return () => clearInterval(iv);
  }, [phase, holdDuration, activeExercises]);

  // Lip slide ball animation
  useEffect(() => {
    if (phase !== 'training' || isResting || isPaused) return;
    const ex = activeExercises[currentIdx];
    if (ex?.id !== 'lip-slide') return;
    const interval = setInterval(() => {
      setBallX(() => {
        const t = Date.now() / 1000;
        return 20 + 60 * ((Math.sin(t * 1.5) + 1) / 2);
      });
    }, 50);
    return () => clearInterval(interval);
  }, [phase, isResting, isPaused, currentIdx, activeExercises]);

   // Main training loop - real elapsed time based countdown
  useEffect(() => {
    if (phase !== 'training' || isPaused || activeExercises.length === 0) return;

    if (isResting) {
      let lastRestTime = performance.now();
      const nextEx = currentSet < (activeExercises[currentIdx]?.reps || 3)
        ? activeExercises[currentIdx] : activeExercises[currentIdx + 1];
      speakRest(nextEx?.nameTr);
      timerRef.current = setInterval(() => {
        const now = performance.now();
        const delta = (now - lastRestTime) / 1000;
        lastRestTime = now;

        setRestTimeLeft(prev => {
          const next = prev - delta;
          if (next <= 0) {
            setIsResting(false);
            setTimeLeft(holdDuration);
            setHoldTime(0);
            holdTimeRef.current = 0;
            lastTickSec.current = -1;
            return 0;
          }
          return next;
        });
      }, 50);
      return () => clearTimer();
    }

    const ex = activeExercises[currentIdx];
    if (!ex) return;

    let lastTime = performance.now();
    timerRef.current = setInterval(() => {
      const now = performance.now();
      const delta = Math.min(0.2, (now - lastTime) / 1000);
      lastTime = now;

      const currentMetrics = metricsRef.current;
      if (currentMetrics && compatibilityRef.current.allReady) {
        symmetrySamples.current.push(currentMetrics.symmetryScore);
        if (symmetrySamples.current.length > 3000) symmetrySamples.current.shift();
        const evaluator = EVALUATOR_MAP[ex.id];
        if (evaluator) {
          const ht = holdTimeRef.current;
          const result = evaluator(currentMetrics, ht, calibrationRef.current);
          setEvaluation(result);
          evaluationRef.current = result;

          if (result.isDetected) {
            holdTimeRef.current += delta;
            setHoldTime(holdTimeRef.current);
            if (Math.floor(ht) !== Math.floor(holdTimeRef.current) && Math.floor(holdTimeRef.current) > 0) {
              playTick();
            }
            if (holdTimeRef.current > 0 && now - lastEncouragementTime.current > 7000) {
              lastEncouragementTime.current = now;
              speakEncouragement();
            }
          } else {
            if (now - lastVoiceHintTime.current > 3500 && result.correctiveHintTr) {
              lastVoiceHintTime.current = now;
              speakCorrectiveHint(result.correctiveHintTr);
            }
          }
        }
      } else { setEvaluation(null); evaluationRef.current = null; }

      setTimeLeft(prev => {
        const next = prev - delta;
        const sec = Math.ceil(next);
        if (sec !== lastTickSec.current && sec > 0) {
          lastTickSec.current = sec;
          if (sec <= 10) {
            playCountdown(sec);
            speakCountdown(sec);
          } else if (sec % 5 === 0) {
            playTick();
          }
        }

        if (next <= 0) {
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
              // Persist real session data
              const zoneSeconds: Record<string, number> = {};
              for (const e of activeExercises) {
                zoneSeconds[e.zone] = (zoneSeconds[e.zone] || 0) + e.reps * holdDuration;
              }
              const symSamples = symmetrySamples.current;
              const avgSym = symSamples.length > 0
                ? symSamples.reduce((a, b) => a + b, 0) / symSamples.length : 0;
              saveSession({
                date: new Date().toISOString(),
                mode: selectedMode,
                modeName: detailModeName || selectedMode,
                score: xpRef.current + Math.round(avgAcc * 100),
                xp: xpRef.current + 50,
                accuracy: Math.round(avgAcc * 100),
                durationSec: activeExercises.reduce((a, e) => a + e.reps * holdDuration, 0),
                symmetry: Math.round(avgSym * 100),
                zoneSeconds,
                exercisesCompleted: completedIds.size + 1,
                bestCombo: comboRef.current + 1,
              });
              setSessionsToday(getTodaySessionCount(loadSessions()));
              setSessionScore({
                totalScore: xpRef.current + Math.round(avgAcc * 100),
                xp: xpRef.current + 50,
                accuracy: avgAcc * 100,
                holdScore: Math.round(avgAcc * 100),
                symmetryScore: Math.round(avgSym * 100),
                rhythmScore: 0,
                consistencyBonus: comboRef.current > 3 ? 20 : 0,
                comboBonus: comboRef.current * 5,
                streakBonus: 10,
              });
              stopCamera();
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
          }

          setCurrentSet(currentSet + 1);
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

  if (phase === 'training' || phase === 'calibrating' || phase === 'preparing') {
    const ex = activeExercises[currentIdx];
    const training = phase === 'training';
    const calibrating = phase === 'calibrating';
    const cameraHint = compatibility.face === 'too-close' ? 'Yüzünü biraz uzaklaştır.' : compatibility.face === 'too-far' ? 'Kameraya biraz yaklaş.' : compatibility.light === 'too-dark' ? 'Önden aydınlık bir yere geç.' : 'Yüzünü kadraja getir, kameraya düz bak.';
    const tip = customRequest?.coachingTips?.[ex?.id || ''];
    return <div className="camera-session">
      {training && !isResting ? <TrainingHUD exerciseName={ex?.nameTr || ''} exerciseId={ex?.id || ''} timeLeft={timeLeft} totalTime={holdDuration} rep={currentSet} totalReps={ex?.reps || 3} evaluation={evaluation} combo={combo} xp={xp} isPaused={isPaused} /> :
        <header className="camera-toolbar flex justify-between gap-3 items-center"><div><h2 className="text-sm">{isResting ? 'Nefes al, yüzünü gevşet' : calibrating ? 'Yüz ölçümü' : 'Kamera hazırlığı'}</h2><p className="text-xs text-muted-foreground mt-1">{isResting ? `Sonraki: ${ex?.nameTr} · Set ${currentSet}` : calibrating ? 'Nötr yüz ifadesiyle düz bak' : detailModeName}</p></div>{(isResting || calibrating) && <span className="text-2xl font-bold tabular-nums">{Math.ceil(isResting ? restTimeLeft : calibTimeLeft)}</span>}</header>}
      <div className="camera-viewport" aria-label="Yüz takip kamerası">
        <video ref={attachVideo} className="w-full h-full object-cover scale-x-[-1]" playsInline muted autoPlay />
        <FaceLandmarkOverlay landmarks={landmarks} videoSize={videoSize} activeZone={training ? ex?.zone : undefined} isDetected={training ? evaluation?.isDetected : !!metrics} />
        {training && <NeonFaceFrame landmarks={landmarks} videoSize={videoSize} isCorrect={!!evaluation?.isDetected} isDetected={!!metrics} />}
      </div>
      <footer className="camera-coaching space-y-2">
        {training && ex?.id === 'lip-slide' && !isResting && <div className="relative h-5" aria-label="Dudak hareketi hedefi"><div className="camera-target absolute" style={{ left: `${ballX}%` }} /></div>}
        <p className="camera-guidance" role="status">{isPaused ? 'Antrenman duraklatıldı.' : isResting ? 'Nefesini tutma. Bir sonraki sete rahat başlayacağız.' : !modelsReady ? 'Yüz takip sistemi yükleniyor…' : !compatibility.allReady ? cameraHint : calibrating ? 'Ölçüm boyunca yüzünü rahat bırak.' : training ? evaluation?.correctiveHintTr || tip || ex?.howToTr : 'Kamera hazır. Başlangıç ölçümünü yapabilirsin.'}</p>
        {ex?.category !== 'auto' && training && <p className="text-[10px] text-muted-foreground">El konumu ve basınç kamera ile doğrulanmaz.</p>}
        {phase === 'preparing' && compatibility.camera !== 'ready' && <p className="text-xs text-destructive">{compatibility.camera === 'no-permission' ? 'Kamera izni gerekli.' : compatibility.camera === 'no-camera' ? 'Kamera bulunamadı.' : 'Kamera hazırlanıyor.'}</p>}
        <div className="flex gap-2">
          {training ? <Button className="flex-1" variant="outline" onClick={() => { setIsPaused(!isPaused); cancelSpeech(); }}>{isPaused ? <Play /> : <Pause />}{isPaused ? 'Devam' : 'Duraklat'}</Button> : !calibrating ? <Button className="flex-1" disabled={!compatibility.allReady || !modelsReady} onClick={startTraining}><Camera /> Başla</Button> : <progress className="camera-progress flex-1 self-center" max={3} value={3 - calibTimeLeft} aria-label="Yüz ölçümü" />}
          <Button variant="ghost" size="icon" title="Antrenmanı kapat" aria-label="Antrenmanı kapat" onClick={endSession}><X /></Button>
        </div>
      </footer>
    </div>;
  }

  // Exercise detail screen before camera
  if (phase === 'detail') {
    return (
      <div className="p-4 pb-24 space-y-4">
        <button onClick={() => setPhase('menu')} className="text-sm text-muted-foreground hover:text-foreground transition-colors font-display">← Geri</button>
        <h2 className="font-display text-2xl font-bold text-foreground text-center">{detailModeName}</h2>
        <p className="text-xs text-muted-foreground text-center">{detailExercises.length} hareket x 3 set x {holdDuration} sn</p>

        {/* Difficulty toggle */}
        {customRequest?.personalized && <p className="text-xs text-muted-foreground">Kişisel seans · 3 set × 30 saniye · Ağrı olursa bırak.</p>}
        <div className={`flex gap-2 justify-center ${customRequest?.personalized ? 'hidden' : ''}`}>
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
                {customRequest?.coachingTips?.[ex.id] && <p className="text-xs text-primary mt-2">{customRequest.coachingTips[ex.id]}</p>}
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

  if (personalizing) return <PersonalSessionBuilder onClose={() => setPersonalizing(false)} onStart={request => { setCustomRequest(request); setSelectedMode('guided-training'); setDetailExercises(request.exercises); setDetailModeName(request.title); setPersonalizing(false); setPhase('detail'); }} />;
  return <WellnessHome onStart={showModeDetail} sessionsToday={sessionsToday} onPersonalize={() => setPersonalizing(true)} />;
}
