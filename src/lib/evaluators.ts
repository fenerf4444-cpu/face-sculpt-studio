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

export const lionFaceEvaluator: Evaluator = (m, holdTime) => {
  const mouthOk = m.mouthOpenness > 0.6;
  const eyesOk = m.leftEyeOpenness > 0.7 && m.rightEyeOpenness > 0.7;
  const isDetected = mouthOk && eyesOk;
  const accuracy = (Math.min(m.mouthOpenness, 1) * 0.5 + Math.min((m.leftEyeOpenness + m.rightEyeOpenness) / 2, 1) * 0.3 + m.symmetryScore * 0.2);
  
  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!mouthOk) { hint = 'Open your mouth wider'; hintTr = 'Ağzını daha fazla aç'; }
  else if (!eyesOk) { hint = 'Widen your eyes more'; hintTr = 'Gözlerini daha fazla aç'; }

  const color = isDetected ? (accuracy > 0.7 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / 8, 1), hint, hintTr, isDetected ? 0.85 : 0.3, { mouthOpenness: m.mouthOpenness, eyeOpen: (m.leftEyeOpenness + m.rightEyeOpenness) / 2 }, color);
};

export const fishFaceEvaluator: Evaluator = (m, holdTime) => {
  const lipsOk = m.lipProtrusion > 0.3;
  const mouthNarrow = m.mouthWidth < 0.35;
  const isDetected = lipsOk && mouthNarrow;
  const accuracy = (m.lipProtrusion * 0.4 + (1 - m.mouthWidth) * 0.3 + m.symmetryScore * 0.3);

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!lipsOk) { hint = 'Pucker your lips more'; hintTr = 'Dudaklarını daha fazla büz'; }
  else if (!mouthNarrow) { hint = 'Pull cheeks in more'; hintTr = 'Yanaklarını daha fazla içeri çek'; }

  const color = isDetected ? (accuracy > 0.6 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / 8, 1), hint, hintTr, isDetected ? 0.8 : 0.3, { lipProtrusion: m.lipProtrusion, mouthWidth: m.mouthWidth }, color);
};

export const bigSmileEvaluator: Evaluator = (m, holdTime) => {
  const isDetected = m.smileScore > 0.5;
  const accuracy = m.smileScore * 0.5 + m.mouthWidth * 0.3 + m.symmetryScore * 0.2;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!isDetected) { hint = 'Smile wider!'; hintTr = 'Daha geniş gülümse!'; }

  const color = isDetected ? (accuracy > 0.65 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / 6, 1), hint, hintTr, isDetected ? 0.85 : 0.3, { smileScore: m.smileScore, mouthWidth: m.mouthWidth }, color);
};

export const surpriseEyesEvaluator: Evaluator = (m, holdTime) => {
  const eyesWide = (m.leftEyeOpenness + m.rightEyeOpenness) / 2 > 0.7;
  const browsUp = (m.browRaiseLeft + m.browRaiseRight) / 2 > 0.5;
  const isDetected = eyesWide && browsUp;
  const accuracy = ((m.leftEyeOpenness + m.rightEyeOpenness) / 2) * 0.4 + ((m.browRaiseLeft + m.browRaiseRight) / 2) * 0.4 + m.symmetryScore * 0.2;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!eyesWide) { hint = 'Open eyes wider'; hintTr = 'Gözlerini daha fazla aç'; }
  else if (!browsUp) { hint = 'Raise your eyebrows'; hintTr = 'Kaşlarını kaldır'; }

  const color = isDetected ? (accuracy > 0.65 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / 6, 1), hint, hintTr, isDetected ? 0.8 : 0.3, { eyeOpenness: (m.leftEyeOpenness + m.rightEyeOpenness) / 2, browRaise: (m.browRaiseLeft + m.browRaiseRight) / 2 }, color);
};

export const oMouthEvaluator: Evaluator = (m, holdTime) => {
  const mouthOpen = m.mouthOpenness > 0.3;
  const mouthRound = m.mouthWidth < 0.4;
  const isDetected = mouthOpen && mouthRound;
  const accuracy = m.mouthOpenness * 0.35 + (1 - m.mouthWidth) * 0.35 + m.symmetryScore * 0.3;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!mouthOpen) { hint = 'Open mouth more'; hintTr = 'Ağzını daha fazla aç'; }
  else if (!mouthRound) { hint = 'Make lips rounder'; hintTr = 'Dudaklarını daha yuvarlak yap'; }

  const color = isDetected ? (accuracy > 0.6 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / 6, 1), hint, hintTr, isDetected ? 0.8 : 0.3, { mouthOpenness: m.mouthOpenness, mouthWidth: m.mouthWidth }, color);
};

export const cheekPuffEvaluator: Evaluator = (m, holdTime) => {
  const puffed = m.cheekPuffEstimate > 0.3;
  const lipsClosed = m.mouthOpenness < 0.2;
  const isDetected = puffed && lipsClosed;
  const accuracy = m.cheekPuffEstimate * 0.4 + (1 - m.mouthOpenness) * 0.3 + m.symmetryScore * 0.3;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!puffed) { hint = 'Puff cheeks more'; hintTr = 'Yanaklarını daha fazla şişir'; }
  else if (!lipsClosed) { hint = 'Keep lips closed'; hintTr = 'Dudaklarını kapalı tut'; }

  const color = isDetected ? (accuracy > 0.6 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / 8, 1), hint, hintTr, isDetected ? 0.75 : 0.3, { cheekPuff: m.cheekPuffEstimate, mouthOpenness: m.mouthOpenness }, color);
};

export const jawLiftEvaluator: Evaluator = (m, holdTime) => {
  const chinUp = m.headPitch < -0.15;
  const isDetected = chinUp;
  const accuracy = Math.min(1, Math.abs(m.headPitch) * 2) * 0.5 + m.symmetryScore * 0.3 + (1 - Math.abs(m.headYaw)) * 0.2;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!chinUp) { hint = 'Tilt chin up more'; hintTr = 'Çeneni daha yukarı kaldır'; }

  const color = isDetected ? (accuracy > 0.6 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / 8, 1), hint, hintTr, isDetected ? 0.8 : 0.3, { headPitch: m.headPitch }, color);
};

export const browRaiseEvaluator: Evaluator = (m, holdTime) => {
  const raised = (m.browRaiseLeft + m.browRaiseRight) / 2 > 0.5;
  const isDetected = raised;
  const accuracy = ((m.browRaiseLeft + m.browRaiseRight) / 2) * 0.5 + m.symmetryScore * 0.3 + (1 - m.mouthOpenness) * 0.2;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!raised) { hint = 'Raise eyebrows higher'; hintTr = 'Kaşlarını daha yukarı kaldır'; }

  const color = isDetected ? (accuracy > 0.6 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / 6, 1), hint, hintTr, isDetected ? 0.85 : 0.3, { browRaise: (m.browRaiseLeft + m.browRaiseRight) / 2 }, color);
};

export const winkLeftEvaluator: Evaluator = (m, holdTime) => {
  const leftClosed = m.leftEyeOpenness < 0.3;
  const rightOpen = m.rightEyeOpenness > 0.5;
  const isDetected = leftClosed && rightOpen;
  const accuracy = (1 - m.leftEyeOpenness) * 0.35 + m.rightEyeOpenness * 0.35 + m.symmetryScore * 0.1 + (m.smileScore > 0.3 ? 0.2 : 0);

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!leftClosed) { hint = 'Close left eye more'; hintTr = 'Sol gözünü daha fazla kapat'; }
  else if (!rightOpen) { hint = 'Keep right eye open'; hintTr = 'Sağ gözünü açık tut'; }

  const color = isDetected ? (accuracy > 0.6 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / 4, 1), hint, hintTr, isDetected ? 0.8 : 0.3, { leftEye: m.leftEyeOpenness, rightEye: m.rightEyeOpenness }, color);
};

export const lipProtrusionEvaluator: Evaluator = (m, holdTime) => {
  const protruded = m.lipProtrusion > 0.4;
  const isDetected = protruded;
  const accuracy = m.lipProtrusion * 0.5 + (1 - m.mouthOpenness) * 0.3 + m.symmetryScore * 0.2;

  let hint: string | null = null;
  let hintTr: string | null = null;
  if (!protruded) { hint = 'Push lips forward more'; hintTr = 'Dudaklarını daha öne uzat'; }

  const color = isDetected ? (accuracy > 0.6 ? 'green' : 'yellow') : 'red';
  return makeResult(isDetected, accuracy, Math.min(holdTime / 6, 1), hint, hintTr, isDetected ? 0.8 : 0.3, { lipProtrusion: m.lipProtrusion }, color);
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
};
