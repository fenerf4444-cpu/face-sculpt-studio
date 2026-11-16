// MediaPipe Face Landmarker (478 points + 52 ARKit-style blendshapes).
// Maps the dense mesh onto the 68-point layout used by overlays/evaluators,
// and refines metrics with blendshape muscle activations.
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { FaceMetrics } from './face-detection';

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// 68-point (iBUG) equivalents in the MediaPipe 478 mesh
export const MP_TO_68 = [
  127, 234, 93, 132, 58, 172, 136, 150, 152, 379, 365, 397, 288, 361, 323, 454, 356,
  70, 63, 105, 66, 107, 336, 296, 334, 293, 300,
  168, 6, 197, 195, 98, 97, 2, 326, 327,
  33, 160, 158, 133, 153, 144, 362, 385, 387, 263, 373, 380,
  61, 40, 37, 0, 267, 270, 291, 321, 314, 17, 84, 91,
  78, 81, 13, 311, 308, 402, 14, 178,
];

let landmarker: FaceLandmarker | null = null;
let loading: Promise<FaceLandmarker | null> | null = null;

export function loadMediaPipe(): Promise<FaceLandmarker | null> {
  if (landmarker) return Promise.resolve(landmarker);
  if (loading) return loading;
  loading = (async () => {
    try {
      const fileset = await FilesetResolver.forVisionTasks(WASM);
      const opts = (delegate: 'GPU' | 'CPU') => ({
        baseOptions: { modelAssetPath: MODEL, delegate },
        runningMode: 'VIDEO' as const,
        numFaces: 1,
        outputFaceBlendshapes: true,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      try { landmarker = await FaceLandmarker.createFromOptions(fileset, opts('GPU')); }
      catch { landmarker = await FaceLandmarker.createFromOptions(fileset, opts('CPU')); }
      return landmarker;
    } catch (e) {
      console.warn('MediaPipe unavailable, falling back', e);
      return null;
    }
  })();
  return loading;
}

export interface MPFrame {
  points68: { x: number; y: number }[];
  blend: Record<string, number>;
  box: { width: number };
}

let lastTs = 0;
export function detectMediaPipe(video: HTMLVideoElement): MPFrame | null | undefined {
  if (!landmarker) return undefined;
  let ts = performance.now();
  if (ts <= lastTs) ts = lastTs + 1;
  lastTs = ts;
  const res = landmarker.detectForVideo(video, ts);
  const lm = res.faceLandmarks?.[0];
  if (!lm) return null;
  const w = video.videoWidth || 640, h = video.videoHeight || 480;
  const points68 = MP_TO_68.map(i => ({ x: lm[i].x * w, y: lm[i].y * h }));
  let minX = 1, maxX = 0;
  for (const p of lm) { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; }
  const blend: Record<string, number> = {};
  for (const c of res.faceBlendshapes?.[0]?.categories ?? []) blend[c.categoryName] = c.score;
  return { points68, blend, box: { width: (maxX - minX) * w } };
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/** Blend geometric metrics with muscle-level blendshape activations. */
export function refineWithBlendshapes(m: FaceMetrics, b: Record<string, number>): FaceMetrics {
  const g = (k: string) => b[k] ?? 0;
  const smile = (g('mouthSmileLeft') + g('mouthSmileRight')) / 2;
  const jaw = g('jawOpen');
  const pucker = Math.max(g('mouthPucker'), g('mouthFunnel'));
  const eyeWide = (g('eyeWideLeft') + g('eyeWideRight')) / 2;
  const browUp = Math.max(g('browInnerUp'), (g('browOuterUpLeft') + g('browOuterUpRight')) / 2);
  const surprised = clamp((jaw + eyeWide + browUp) / 2.2);
  const angry = (g('browDownLeft') + g('browDownRight')) / 2;
  return {
    ...m,
    mouthOpenness: clamp(Math.max(m.mouthOpenness * 0.4 + jaw * 0.6, jaw)),
    smileScore: clamp(smile * 0.75 + m.smileScore * 0.25),
    leftEyeOpenness: clamp(1 - g('eyeBlinkLeft') * 0.9 + g('eyeWideLeft') * 0.3) * 0.8,
    rightEyeOpenness: clamp(1 - g('eyeBlinkRight') * 0.9 + g('eyeWideRight') * 0.3) * 0.8,
    browRaiseLeft: clamp(Math.max(g('browOuterUpLeft'), g('browInnerUp')) * 0.7 + m.browRaiseLeft * 0.3),
    browRaiseRight: clamp(Math.max(g('browOuterUpRight'), g('browInnerUp')) * 0.7 + m.browRaiseRight * 0.3),
    lipProtrusion: clamp(pucker * 0.7 + m.lipProtrusion * 0.3),
    cheekPuffEstimate: clamp(Math.max(g('cheekPuff'), m.cheekPuffEstimate * 0.5)),
    jawForward: clamp(Math.max(m.jawForward, g('jawForward'))),
    cheekHollow: clamp(m.cheekHollow * 0.55 + pucker * (1 - jaw) * 0.45),
    expressionHappy: smile,
    expressionSurprised: surprised,
    expressionAngry: angry,
    expressionNeutral: clamp(1 - Math.max(smile, surprised, angry, pucker)),
  };
}
