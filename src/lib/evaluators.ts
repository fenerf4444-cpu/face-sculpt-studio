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

// ============ FISH FACE ============
// Lips puckered (protrusion high) + mouth narrow + cheeks pulled in
export const fishFaceEvaluator: Evaluator = (m, holdTime) => {
  const lipsOk = m.lipProtrusion > 0.25;
  const mouthNarrow = m.mouthWidth < 0.38;
  const isDetected = lipsOk && mouthNarrow;

  const lipScore = Math.min(1, m.lipProtrusion / 0.6) * 35;
  const narrowScore = Math.min(1, (0.45 - m.mouthWidth) / 0.2) * 20;
  const holdScore = Math.min(1, holdTime / HOLD_DURATION) * 20;
  const symScore = m.symmetryScore * 15;
  const stabilityBonus = Math.abs(m.headYaw) < 0.15 ? 10 : 5;
  const accuracy = Math.max(0, Math.min(1, (lipScore + narrowScore + holdScore + symScore + stabilityBonus) / 100));

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!lipsOk) { hint = 'Pucker lips more forward'; hintTr = 'Dudaklarini daha fazla one uzat'; }
  else if (!mouthNarrow) { hint = 'Pull cheeks in more'; hintTr = 'Yanaklarini daha fazla iceri cek'; }

  const color = isDetected ? (accuracy > 0.6 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / HOLD_DURATION, 1), hint, hintTr, isDetected ? 0.8 : 0.3,
    { lipProtrusion: m.lipProtrusion, mouthWidth: m.mouthWidth }, color);
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

export const EVALUATOR_MAP: Record<string, Evaluator> = {
  'lion-face': lionFaceEvaluator,
  'fish-face': fishFaceEvaluator,
  'big-smile': bigSmileEvaluator,
  'surprise-eyes': surpriseEyesEvaluator,
  'o-mouth': oMouthEvaluator,
  'cheek-puff': cheekPuffEvaluator,
  'jaw-lift': jawLiftEvaluator,
  'brow-raise': browRaiseEvaluator,
  'wink-left': winkLeftEvaluator,
  'lip-protrusion': lipProtrusionEvaluator,
  'lip-slide': lipSlideEvaluator,
  'pencil-hold': pencilHoldEvaluator,
};
