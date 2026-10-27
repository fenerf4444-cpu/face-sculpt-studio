import { FaceMetrics } from './face-detection';
import { EvaluatorResult, CalibrationData } from '@/types/exercises';

type Evaluator = (metrics: FaceMetrics, holdTime: number, calibration?: CalibrationData | null) => EvaluatorResult;

function makeResult(
  isDetected: boolean,
  accuracy: number,
  holdProgress: number,
  hint: string | null,
  hintTr: string | null,
  confidence: number,
  raw: Record<string, number>,
  color: 'red' | 'yellow' | 'green'
): EvaluatorResult {
  return {
    isDetected,
    accuracyScore: Math.round(accuracy * 100) / 100,
    holdProgress,
    correctiveHint: hint,
    correctiveHintTr: hintTr,
    confidence,
    rawMetrics: raw,
    uiStateColor: color,
  };
}

const HOLD_DURATION = 30; // 30 seconds per set

// ============ LION FACE ============
// Mouth wide open (MAR high) + eyes wide + optionally surprised expression
export const lionFaceEvaluator: Evaluator = (m, holdTime) => {
  const mouthOk = m.mouthOpenness > 0.55;
  const eyesOk = (m.leftEyeOpenness + m.rightEyeOpenness) / 2 > 0.65;
  const surprised = m.expressionSurprised > 0.2;
  const isDetected = mouthOk && eyesOk;

  const mouthScore = Math.min(1, m.mouthOpenness / 0.8) * 35;
  const eyeScore = Math.min(1, ((m.leftEyeOpenness + m.rightEyeOpenness) / 2) / 0.8) * 20;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 20;
  const symScore = m.symmetryScore * 15;
  const expressionBonus = surprised ? 10 : m.expressionSurprised * 10;
  const accuracy = (mouthScore + eyeScore + holdScore + symScore + expressionBonus) / 100;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!mouthOk && !eyesOk) { hint = 'Open mouth wide and widen eyes'; hintTr = 'Agzini kocaman ac ve gozlerini buyut'; }
  else if (!mouthOk) { hint = 'Open mouth wider'; hintTr = 'Agzini daha fazla ac'; }
  else if (!eyesOk) { hint = 'Widen your eyes more'; hintTr = 'Gozlerini daha fazla ac'; }
  else if (m.symmetryScore < 0.7) { hint = 'Keep face symmetrical'; hintTr = 'Yuzunu simetrik tut'; }

  const color = isDetected ? (accuracy > 0.65 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.85 : 0.3,
    { mouthOpenness: m.mouthOpenness, eyeOpen: (m.leftEyeOpenness + m.rightEyeOpenness) / 2, surprised: m.expressionSurprised }, color);
};

// ============ FISH FACE (cheek suck-in) ============
// Cheeks sucked in -> mouth corners pulled toward center, lower cheeks slimmer,
// lips pushed into a small vertical "fish" shape. Measured relative to neutral face.
export const fishFaceEvaluator: Evaluator = (m, holdTime) => {
  const hollowOk = m.cheekHollow > 0.35;
  const lipsShape = m.lipProtrusion > 0.12 || m.cheekHollow > 0.6;
  const mouthClosedEnough = m.mouthOpenness < 0.45;
  const isDetected = hollowOk && lipsShape && mouthClosedEnough;

  const hollowScore = Math.min(1, m.cheekHollow / 0.7) * 40;
  const lipScore = Math.min(1, m.lipProtrusion / 0.4) * 15;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 20;
  const symScore = m.symmetryScore * 15;
  const stabilityBonus = Math.abs(m.headYaw) < 0.15 ? 10 : 5;
  const accuracy = Math.max(0, Math.min(1, (hollowScore + lipScore + holdScore + symScore + stabilityBonus) / 100));

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!mouthClosedEnough) { hint = 'Close your mouth, lips together'; hintTr = 'Agzini kapat, dudaklar birlesik'; }
  else if (!hollowOk) { hint = 'Suck cheeks in between your teeth'; hintTr = 'Yanaklarini dislerinin arasina dogru iceri cek'; }
  else if (!lipsShape) { hint = 'Push lips into a fish shape'; hintTr = 'Dudaklarini balik agzi gibi one it'; }
  else if (Math.abs(m.headYaw) > 0.2) { hint = 'Face the camera straight'; hintTr = 'Kameraya duz bak'; }

  const color = isDetected ? (accuracy > 0.6 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.8 : 0.3,
    { cheekHollow: m.cheekHollow, lipProtrusion: m.lipProtrusion, mouthWidth: m.mouthWidth }, color);
};

// ============ BIG SMILE ============
// High smile score + wide mouth + happy expression
export const bigSmileEvaluator: Evaluator = (m, holdTime) => {
  const smileOk = m.smileScore > 0.45;
  const mouthWide = m.mouthWidth > 0.35;
  const isDetected = smileOk;

  const smilePoints = Math.min(1, m.smileScore / 0.8) * 35;
  const widthPoints = Math.min(1, m.mouthWidth / 0.5) * 15;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 20;
  const symScore = m.symmetryScore * 15;
  const happyBonus = Math.min(1, m.expressionHappy / 0.6) * 15;
  const accuracy = (smilePoints + widthPoints + holdScore + symScore + happyBonus) / 100;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!smileOk) { hint = 'Smile wider, show teeth!'; hintTr = 'Daha genis gulumsle, dislerini goster!'; }
  else if (!mouthWide) { hint = 'Stretch smile wider'; hintTr = 'Gulumse daha genis olsun'; }

  const color = isDetected ? (accuracy > 0.6 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.85 : 0.3,
    { smileScore: m.smileScore, mouthWidth: m.mouthWidth, happy: m.expressionHappy }, color);
};

// ============ SURPRISE EYES ============
// Eyes wide + brows raised + surprised expression
export const surpriseEyesEvaluator: Evaluator = (m, holdTime) => {
  const avgEye = (m.leftEyeOpenness + m.rightEyeOpenness) / 2;
  const avgBrow = (m.browRaiseLeft + m.browRaiseRight) / 2;
  const eyesWide = avgEye > 0.6;
  const browsUp = avgBrow > 0.45;
  const isDetected = eyesWide && browsUp;

  const eyeScore = Math.min(1, avgEye / 0.8) * 30;
  const browScore = Math.min(1, avgBrow / 0.7) * 25;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 20;
  const symScore = m.symmetryScore * 10;
  const surpriseBonus = Math.min(1, m.expressionSurprised / 0.5) * 15;
  const accuracy = (eyeScore + browScore + holdScore + symScore + surpriseBonus) / 100;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!eyesWide && !browsUp) { hint = 'Open eyes wide and raise brows'; hintTr = 'Gozlerini ac ve kaslarini kaldir'; }
  else if (!eyesWide) { hint = 'Open eyes wider'; hintTr = 'Gozlerini daha fazla ac'; }
  else if (!browsUp) { hint = 'Raise eyebrows higher'; hintTr = 'Kaslarini daha yukari kaldir'; }

  const color = isDetected ? (accuracy > 0.6 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.8 : 0.3,
    { eyeOpenness: avgEye, browRaise: avgBrow, surprised: m.expressionSurprised }, color);
};

// ============ O MOUTH ============
// Mouth open in round shape (moderate openness + narrow width)
export const oMouthEvaluator: Evaluator = (m, holdTime) => {
  const mouthOpen = m.mouthOpenness > 0.3;
  const mouthRound = m.mouthWidth < 0.38;
  const isDetected = mouthOpen && mouthRound;

  const openScore = Math.min(1, m.mouthOpenness / 0.6) * 30;
  const roundScore = Math.min(1, (0.45 - m.mouthWidth) / 0.2) * 25;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 20;
  const symScore = m.symmetryScore * 15;
  const stabilityBonus = Math.abs(m.headRoll) < 0.1 ? 10 : 5;
  const accuracy = Math.max(0, Math.min(1, (openScore + roundScore + holdScore + symScore + stabilityBonus) / 100));

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!mouthOpen) { hint = 'Open mouth more'; hintTr = 'Agzini daha fazla ac'; }
  else if (!mouthRound) { hint = 'Make a rounder O shape'; hintTr = 'Daha yuvarlak bir O yap'; }

  const color = isDetected ? (accuracy > 0.6 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.8 : 0.3,
    { mouthOpenness: m.mouthOpenness, mouthWidth: m.mouthWidth }, color);
};

// ============ CHEEK PUFF ============
// Cheek area expanded + lips closed + stable head
export const cheekPuffEvaluator: Evaluator = (m, holdTime) => {
  const puffed = m.cheekPuffEstimate > 0.2;
  const lipsClosed = m.mouthOpenness < 0.15;
  const isDetected = puffed && lipsClosed;

  const puffScore = Math.min(1, m.cheekPuffEstimate / 0.5) * 35;
  const closedScore = Math.min(1, (0.2 - m.mouthOpenness) / 0.15) * 20;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 20;
  const symScore = m.symmetryScore * 15;
  const stabilityBonus = Math.abs(m.headYaw) < 0.1 && Math.abs(m.headPitch) < 0.1 ? 10 : 5;
  const accuracy = Math.max(0, Math.min(1, (puffScore + closedScore + holdScore + symScore + stabilityBonus) / 100));

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!lipsClosed) { hint = 'Close your lips tightly'; hintTr = 'Dudaklarini sikica kapat'; }
  else if (!puffed) { hint = 'Puff cheeks out more with air'; hintTr = 'Yanaklarini hava ile daha fazla sisir'; }

  const color = isDetected ? (accuracy > 0.55 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.75 : 0.3,
    { cheekPuff: m.cheekPuffEstimate, mouthOpenness: m.mouthOpenness }, color);
};

// ============ JAW LIFT ============
// Head tilted back (chin up) + jaw engaged
export const jawLiftEvaluator: Evaluator = (m, holdTime) => {
  const chinUp = m.headPitch < -0.12;
  const isDetected = chinUp;

  const pitchScore = Math.min(1, Math.abs(m.headPitch) / 0.3) * 35;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 20;
  const symScore = m.symmetryScore * 15;
  const yawStable = (1 - Math.min(1, Math.abs(m.headYaw) / 0.2)) * 15;
  const jawScore = m.jawForward * 15;
  const accuracy = (pitchScore + holdScore + symScore + yawStable + jawScore) / 100;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!chinUp) { hint = 'Tilt chin up more'; hintTr = 'Ceneni daha yukari kaldir'; }
  else if (Math.abs(m.headYaw) > 0.15) { hint = 'Keep head straight'; hintTr = 'Basini duz tut'; }

  const color = isDetected ? (accuracy > 0.6 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.8 : 0.3,
    { headPitch: m.headPitch, headYaw: m.headYaw, jawForward: m.jawForward }, color);
};

// ============ BROW RAISE ============
// Both brows raised high + eyes open
export const browRaiseEvaluator: Evaluator = (m, holdTime) => {
  const avgBrow = (m.browRaiseLeft + m.browRaiseRight) / 2;
  const raised = avgBrow > 0.45;
  const isDetected = raised;

  const browScore = Math.min(1, avgBrow / 0.7) * 35;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 20;
  const symDiff = Math.abs(m.browRaiseLeft - m.browRaiseRight);
  const browSym = (1 - Math.min(1, symDiff / 0.3)) * 15;
  const mouthRelaxed = m.mouthOpenness < 0.15 ? 15 : 10;
  const surpriseBonus = m.expressionSurprised * 15;
  const accuracy = (browScore + holdScore + browSym + mouthRelaxed + surpriseBonus) / 100;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!raised) { hint = 'Raise eyebrows higher'; hintTr = 'Kaslarini daha yukari kaldir'; }
  else if (symDiff > 0.2) { hint = 'Raise both brows evenly'; hintTr = 'Iki kasi da esit kaldir'; }
  else if (m.mouthOpenness > 0.15) { hint = 'Keep mouth relaxed'; hintTr = 'Agzini rahat birak'; }

  const color = isDetected ? (accuracy > 0.6 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.85 : 0.3,
    { browRaise: avgBrow, browSymmetry: 1 - symDiff }, color);
};

// ============ WINK LEFT ============
// Left eye closed + right eye open + optional smile
export const winkLeftEvaluator: Evaluator = (m, holdTime) => {
  const leftClosed = m.leftEyeOpenness < 0.25;
  const rightOpen = m.rightEyeOpenness > 0.45;
  const isDetected = leftClosed && rightOpen;

  const closeScore = Math.min(1, (0.3 - m.leftEyeOpenness) / 0.25) * 30;
  const openScore = Math.min(1, m.rightEyeOpenness / 0.7) * 25;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 20;
  const smileBonus = m.smileScore > 0.3 ? 15 : m.smileScore * 15;
  const stabilityBonus = Math.abs(m.headRoll) < 0.1 ? 10 : 5;
  const accuracy = Math.max(0, Math.min(1, (closeScore + openScore + holdScore + smileBonus + stabilityBonus) / 100));

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!leftClosed && !rightOpen) { hint = 'Close left eye, keep right open'; hintTr = 'Sol gozunu kapat, sagi acik tut'; }
  else if (!leftClosed) { hint = 'Close left eye more'; hintTr = 'Sol gozunu daha fazla kapat'; }
  else if (!rightOpen) { hint = 'Keep right eye open'; hintTr = 'Sag gozunu acik tut'; }

  const color = isDetected ? (accuracy > 0.55 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.8 : 0.3,
    { leftEye: m.leftEyeOpenness, rightEye: m.rightEyeOpenness }, color);
};

// ============ LIP PROTRUSION ============
// Lips pushed forward (duck face) + mouth not wide open
export const lipProtrusionEvaluator: Evaluator = (m, holdTime) => {
  const protruded = m.lipProtrusion > 0.3;
  const mouthClosed = m.mouthOpenness < 0.2;
  const isDetected = protruded && mouthClosed;

  const lipScore = Math.min(1, m.lipProtrusion / 0.6) * 35;
  const closedScore = mouthClosed ? 20 : 10;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 20;
  const symScore = m.symmetryScore * 15;
  const stabilityBonus = Math.abs(m.headYaw) < 0.1 ? 10 : 5;
  const accuracy = (lipScore + closedScore + holdScore + symScore + stabilityBonus) / 100;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!protruded) { hint = 'Push lips forward more'; hintTr = 'Dudaklarini daha one uzat'; }
  else if (!mouthClosed) { hint = 'Keep mouth closed while pushing'; hintTr = 'Uzatirken agzini kapali tut'; }

  const color = isDetected ? (accuracy > 0.6 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.8 : 0.3,
    { lipProtrusion: m.lipProtrusion, mouthOpenness: m.mouthOpenness }, color);
};

// ============ LIP SLIDE ============
// Lips moving left/right - detected by mouth asymmetry changing
export const lipSlideEvaluator: Evaluator = (m, holdTime) => {
  // Lip slide is detected by mouth width changes and asymmetry
  const mouthActive = m.mouthWidth > 0.25;
  const lipMoving = m.lipProtrusion > 0.1 || Math.abs(m.headYaw) > 0.05;
  const isDetected = mouthActive && lipMoving;

  const slideScore = Math.min(1, (m.mouthWidth / 0.4)) * 30;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 25;
  const symScore = m.symmetryScore * 10;
  const jawStable = Math.abs(m.headPitch) < 0.15 ? 20 : 10;
  const lipActivity = Math.min(1, m.lipProtrusion / 0.3) * 15;
  const accuracy = Math.max(0, Math.min(1, (slideScore + holdScore + symScore + jawStable + lipActivity) / 100));

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!mouthActive) { hint = 'Move your lips more'; hintTr = 'Dudaklarini daha fazla hareket ettir'; }
  else if (!lipMoving) { hint = 'Slide lips left and right'; hintTr = 'Dudaklarini saga sola kaydir'; }

  const color = isDetected ? (accuracy > 0.5 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.7 : 0.3,
    { mouthWidth: m.mouthWidth, lipProtrusion: m.lipProtrusion }, color);
};

// ============ PENCIL HOLD ============
// Upper lip pressed up toward nose - lips tight, mouth closed
export const pencilHoldEvaluator: Evaluator = (m, holdTime) => {
  const lipsTight = m.mouthOpenness < 0.1;
  const lipUp = m.lipProtrusion > 0.15;
  const isDetected = lipsTight && lipUp;

  const tightScore = Math.min(1, (0.15 - m.mouthOpenness) / 0.1) * 30;
  const lipScore = Math.min(1, m.lipProtrusion / 0.4) * 25;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 20;
  const symScore = m.symmetryScore * 15;
  const stabilityBonus = Math.abs(m.headYaw) < 0.1 ? 10 : 5;
  const accuracy = Math.max(0, Math.min(1, (tightScore + lipScore + holdScore + symScore + stabilityBonus) / 100));

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!lipsTight) { hint = 'Close lips tighter'; hintTr = 'Dudaklarini daha siki kapat'; }
  else if (!lipUp) { hint = 'Push upper lip toward nose'; hintTr = 'Ust dudagini burnuna dogru it'; }

  const color = isDetected ? (accuracy > 0.55 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.75 : 0.3,
    { mouthOpenness: m.mouthOpenness, lipProtrusion: m.lipProtrusion }, color);
};

// ============ EYE TEMPLE LIFT (hand-assisted) ============
export const eyeTempleLiftEvaluator: Evaluator = (m, holdTime) => {
  const eyesWide = (m.leftEyeOpenness + m.rightEyeOpenness) / 2 > 0.55;
  const browsUp = (m.browRaiseLeft + m.browRaiseRight) / 2 > 0.35;
  const isDetected = eyesWide;

  const eyeScore = Math.min(1, ((m.leftEyeOpenness + m.rightEyeOpenness) / 2) / 0.8) * 30;
  const browScore = Math.min(1, ((m.browRaiseLeft + m.browRaiseRight) / 2) / 0.6) * 25;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 20;
  const symScore = m.symmetryScore * 15;
  const stabilityBonus = Math.abs(m.headRoll) < 0.1 ? 10 : 5;
  const accuracy = (eyeScore + browScore + holdScore + symScore + stabilityBonus) / 100;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!eyesWide) { hint = 'Open eyes wider'; hintTr = 'Gozlerini daha fazla ac'; }
  else if (!browsUp) { hint = 'Lift brows while pressing temples'; hintTr = 'Sakaklara basarken kaslarini kaldir'; }

  const color = isDetected ? (accuracy > 0.6 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.8 : 0.3,
    { eyeOpen: (m.leftEyeOpenness + m.rightEyeOpenness) / 2, browRaise: (m.browRaiseLeft + m.browRaiseRight) / 2 }, color);
};

// ============ SMILE LIFT (hand-assisted) ============
export const smileLiftEvaluator: Evaluator = (m, holdTime) => {
  const smileOk = m.smileScore > 0.4;
  const isDetected = smileOk;

  const smilePoints = Math.min(1, m.smileScore / 0.8) * 35;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 20;
  const symScore = m.symmetryScore * 20;
  const cheekBonus = Math.min(1, m.mouthWidth / 0.45) * 15;
  const stabilityBonus = Math.abs(m.headYaw) < 0.1 ? 10 : 5;
  const accuracy = (smilePoints + holdScore + symScore + cheekBonus + stabilityBonus) / 100;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!smileOk) { hint = 'Smile and push corners up with fingers'; hintTr = 'Gulumsle ve parmaklarinla agiz kenarlarini yukari it'; }

  const color = isDetected ? (accuracy > 0.6 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.8 : 0.3,
    { smileScore: m.smileScore, mouthWidth: m.mouthWidth }, color);
};

// ============ NOSE BRIDGE PRESS (hand-assisted / guided) ============
export const noseBridgePressEvaluator: Evaluator = (m, holdTime) => {
  // Guided exercise - detect face stability and relaxation
  const faceRelaxed = m.mouthOpenness < 0.15 && (m.leftEyeOpenness + m.rightEyeOpenness) / 2 < 0.55;
  const stable = Math.abs(m.headYaw) < 0.12 && Math.abs(m.headPitch) < 0.12;
  const isDetected = stable;

  const relaxScore = faceRelaxed ? 30 : 15;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 25;
  const stabilityScore = stable ? 25 : 10;
  const symScore = m.symmetryScore * 20;
  const accuracy = (relaxScore + holdScore + stabilityScore + symScore) / 100;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!stable) { hint = 'Keep head still while pressing'; hintTr = 'Bastirilirken basini sabit tut'; }
  else if (!faceRelaxed) { hint = 'Relax your face, close eyes gently'; hintTr = 'Yuzunu rahat birak, gozlerini hafifce kapat'; }

  const color = isDetected ? (accuracy > 0.5 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.7 : 0.3,
    { headYaw: m.headYaw, headPitch: m.headPitch, mouthOpenness: m.mouthOpenness }, color);
};

// ============ WIDE SMILE STRETCH (hand-assisted) ============
export const wideSmileStretchEvaluator: Evaluator = (m, holdTime) => {
  const smileWide = m.smileScore > 0.5;
  const mouthWide = m.mouthWidth > 0.38;
  const isDetected = smileWide && mouthWide;

  const smilePoints = Math.min(1, m.smileScore / 0.85) * 30;
  const widthPoints = Math.min(1, m.mouthWidth / 0.5) * 25;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 20;
  const symScore = m.symmetryScore * 15;
  const happyBonus = Math.min(1, m.expressionHappy / 0.6) * 10;
  const accuracy = (smilePoints + widthPoints + holdScore + symScore + happyBonus) / 100;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!smileWide) { hint = 'Smile wider, show all teeth!'; hintTr = 'Daha genis gulumsle, tum dislerini goster!'; }
  else if (!mouthWide) { hint = 'Stretch cheeks outward with fingers'; hintTr = 'Parmaklarinla yanaklarini disari cek'; }

  const color = isDetected ? (accuracy > 0.6 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.85 : 0.3,
    { smileScore: m.smileScore, mouthWidth: m.mouthWidth, happy: m.expressionHappy }, color);
};

// ============ UNDER EYE PRESS (hand-assisted / guided) ============
export const underEyePressEvaluator: Evaluator = (m, holdTime) => {
  const eyesClosed = (m.leftEyeOpenness + m.rightEyeOpenness) / 2 < 0.3;
  const stable = Math.abs(m.headYaw) < 0.1;
  const isDetected = stable;

  const eyeScore = eyesClosed ? 30 : 15;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 25;
  const stabilityScore = stable ? 25 : 10;
  const symScore = m.symmetryScore * 20;
  const accuracy = (eyeScore + holdScore + stabilityScore + symScore) / 100;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!eyesClosed) { hint = 'Close eyes gently during massage'; hintTr = 'Masaj sirasinda gozlerini hafifce kapat'; }
  else if (!stable) { hint = 'Keep head still'; hintTr = 'Basini sabit tut'; }

  const color = isDetected ? (accuracy > 0.5 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.7 : 0.3,
    { eyeOpen: (m.leftEyeOpenness + m.rightEyeOpenness) / 2, headYaw: m.headYaw }, color);
};

// ============ FOREHEAD SMOOTH (hand-assisted) ============
export const foreheadSmoothEvaluator: Evaluator = (m, holdTime) => {
  const browsEngaged = (m.browRaiseLeft + m.browRaiseRight) / 2 > 0.3;
  const stable = Math.abs(m.headPitch) < 0.15;
  const isDetected = stable;

  const browScore = Math.min(1, ((m.browRaiseLeft + m.browRaiseRight) / 2) / 0.6) * 30;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 25;
  const stabilityScore = stable ? 20 : 10;
  const symScore = m.symmetryScore * 15;
  const relaxBonus = m.mouthOpenness < 0.1 ? 10 : 5;
  const accuracy = (browScore + holdScore + stabilityScore + symScore + relaxBonus) / 100;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!browsEngaged) { hint = 'Try to raise brows against your hands'; hintTr = 'Ellerine karsi kaslarini kaldirmaya calis'; }
  else if (!stable) { hint = 'Keep head level'; hintTr = 'Basini duz tut'; }

  const color = isDetected ? (accuracy > 0.5 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.75 : 0.3,
    { browRaise: (m.browRaiseLeft + m.browRaiseRight) / 2, headPitch: m.headPitch }, color);
};

// ============ JAW SIDE STRETCH (hand-assisted) ============
export const jawSideStretchEvaluator: Evaluator = (m, holdTime) => {
  const jawMoved = Math.abs(m.headYaw) > 0.08 || m.cheekPuffEstimate > 0.15;
  const isDetected = jawMoved;

  const jawScore = Math.min(1, Math.abs(m.headYaw) / 0.2) * 25;
  const puffScore = Math.min(1, m.cheekPuffEstimate / 0.4) * 25;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 25;
  const symScore = (1 - m.symmetryScore) * 15; // asymmetry is expected here
  const stabilityBonus = Math.abs(m.headPitch) < 0.1 ? 10 : 5;
  const accuracy = Math.max(0, Math.min(1, (jawScore + puffScore + holdScore + symScore + stabilityBonus) / 100));

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!jawMoved) { hint = 'Push jaw to the side more'; hintTr = 'Ceneni daha fazla yana it'; }

  const color = isDetected ? (accuracy > 0.5 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.75 : 0.3,
    { headYaw: m.headYaw, cheekPuff: m.cheekPuffEstimate }, color);
};

// ============ PERSONAL CALIBRATION ============
// Adjusts normalized metrics relative to the user's measured neutral face,
// so detection thresholds fit each person's anatomy instead of generic averages.
function applyBaseline(m: FaceMetrics, cal?: CalibrationData | null): FaceMetrics {
  const n = cal?.neutral;
  if (!n) return m;
  const adj = (v: number, base: number, assumed: number) =>
    Math.min(1, Math.max(0, v - base + assumed));
  return {
    ...m,
    mouthOpenness: adj(m.mouthOpenness, n.mouthOpenness ?? 0.05, 0.05),
    leftEyeOpenness: adj(m.leftEyeOpenness, n.leftEyeOpenness ?? 0.3, 0.3),
    rightEyeOpenness: adj(m.rightEyeOpenness, n.rightEyeOpenness ?? 0.3, 0.3),
    browRaiseLeft: adj(m.browRaiseLeft, n.browRaiseLeft ?? 0.15, 0.15),
    browRaiseRight: adj(m.browRaiseRight, n.browRaiseRight ?? 0.15, 0.15),
    lipProtrusion: adj(m.lipProtrusion, n.lipProtrusion ?? 0, 0),
  };
}

function calibrated(ev: Evaluator): Evaluator {
  return (m, holdTime, cal) => ev(applyBaseline(m, cal), holdTime, cal);
}

export const EVALUATOR_MAP: Record<string, Evaluator> = {
  'lion-face': calibrated(lionFaceEvaluator),
  'fish-face': calibrated(fishFaceEvaluator),
  'big-smile': calibrated(bigSmileEvaluator),
  'surprise-eyes': calibrated(surpriseEyesEvaluator),
  'o-mouth': calibrated(oMouthEvaluator),
  'cheek-puff': calibrated(cheekPuffEvaluator),
  'jaw-lift': calibrated(jawLiftEvaluator),
  'brow-raise': calibrated(browRaiseEvaluator),
  'wink-left': calibrated(winkLeftEvaluator),
  'lip-protrusion': calibrated(lipProtrusionEvaluator),
  'lip-slide': calibrated(lipSlideEvaluator),
  'pencil-hold': calibrated(pencilHoldEvaluator),
  'eye-temple-lift': calibrated(eyeTempleLiftEvaluator),
  'smile-lift': calibrated(smileLiftEvaluator),
  'nose-bridge-press': calibrated(noseBridgePressEvaluator),
  'wide-smile-stretch': calibrated(wideSmileStretchEvaluator),
  'under-eye-press': calibrated(underEyePressEvaluator),
  'forehead-smooth': foreheadSmoothEvaluator,
  'jaw-side-stretch': jawSideStretchEvaluator,
};
