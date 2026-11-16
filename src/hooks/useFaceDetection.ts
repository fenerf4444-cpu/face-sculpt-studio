import { useState, useCallback, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { FaceMetrics, computeFaceMetrics, estimateLightLevel } from '@/lib/face-detection';
import { loadMediaPipe, detectMediaPipe, refineWithBlendshapes } from '@/lib/mediapipe-engine';
import { CompatibilityState, FaceStatus, LightStatus, CameraStatus, TrackingConfidence } from '@/types/exercises';

let modelsLoaded = false;
let modelsLoading = false;

async function loadModels() {
  if (modelsLoaded || modelsLoading) return;
  modelsLoading = true;
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
  modelsLoading = false;
}

function smoothNumber(prev: number, next: number, alpha: number) {
  return prev + (next - prev) * alpha;
}

function smoothLandmarks(
  prev: { x: number; y: number }[] | null,
  next: { x: number; y: number }[],
  alpha: number,
) {
  if (!prev || prev.length !== next.length) return next;
  return next.map((point, index) => ({
    x: smoothNumber(prev[index].x, point.x, alpha),
    y: smoothNumber(prev[index].y, point.y, alpha),
  }));
}

function smoothMetrics(prev: FaceMetrics | null, next: FaceMetrics, alpha: number): FaceMetrics {
  if (!prev) return next;

  return {
    mouthOpenness: smoothNumber(prev.mouthOpenness, next.mouthOpenness, alpha),
    mouthWidth: smoothNumber(prev.mouthWidth, next.mouthWidth, alpha),
    smileScore: smoothNumber(prev.smileScore, next.smileScore, alpha),
    leftEyeOpenness: smoothNumber(prev.leftEyeOpenness, next.leftEyeOpenness, alpha),
    rightEyeOpenness: smoothNumber(prev.rightEyeOpenness, next.rightEyeOpenness, alpha),
    browRaiseLeft: smoothNumber(prev.browRaiseLeft, next.browRaiseLeft, alpha),
    browRaiseRight: smoothNumber(prev.browRaiseRight, next.browRaiseRight, alpha),
    headPitch: smoothNumber(prev.headPitch, next.headPitch, alpha),
    headYaw: smoothNumber(prev.headYaw, next.headYaw, alpha),
    headRoll: smoothNumber(prev.headRoll, next.headRoll, alpha),
    lipProtrusion: smoothNumber(prev.lipProtrusion, next.lipProtrusion, alpha),
    cheekPuffEstimate: smoothNumber(prev.cheekPuffEstimate, next.cheekPuffEstimate, alpha),
    jawForward: smoothNumber(prev.jawForward, next.jawForward, alpha),
    faceWidth: smoothNumber(prev.faceWidth, next.faceWidth, alpha),
    faceHeight: smoothNumber(prev.faceHeight, next.faceHeight, alpha),
    symmetryScore: smoothNumber(prev.symmetryScore, next.symmetryScore, alpha),
    expressionHappy: smoothNumber(prev.expressionHappy, next.expressionHappy, alpha),
    expressionSurprised: smoothNumber(prev.expressionSurprised, next.expressionSurprised, alpha),
    expressionAngry: smoothNumber(prev.expressionAngry, next.expressionAngry, alpha),
    expressionNeutral: smoothNumber(prev.expressionNeutral, next.expressionNeutral, alpha),
    cheekWidthRatio: smoothNumber(prev.cheekWidthRatio, next.cheekWidthRatio, alpha),
    lipRatio: smoothNumber(prev.lipRatio, next.lipRatio, alpha),
    cheekHollow: smoothNumber(prev.cheekHollow, next.cheekHollow, alpha),
  };
}

export function useFaceDetection() {
  const [metrics, setMetrics] = useState<FaceMetrics | null>(null);
  const [landmarks, setLandmarks] = useState<{ x: number; y: number }[] | null>(null);
  const [videoSize, setVideoSize] = useState<{ w: number; h: number }>({ w: 640, h: 480 });
  const [compatibility, setCompatibility] = useState<CompatibilityState>({
    camera: 'checking',
    light: 'checking',
    face: 'searching',
    tracking: 'none',
    allReady: false,
  });
  const [isDetecting, setIsDetecting] = useState(false);
  const [modelsReady, setModelsReady] = useState(modelsLoaded);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const detectingRef = useRef(false);
  const smoothedLandmarksRef = useRef<{ x: number; y: number }[] | null>(null);
  const smoothedMetricsRef = useRef<FaceMetrics | null>(null);
  const missedFramesRef = useRef(0);

  const updateCompatibility = useCallback((updates: Partial<CompatibilityState>) => {
    setCompatibility(prev => {
      const next = { ...prev, ...updates };
      next.allReady =
        next.camera === 'ready' &&
        (next.light === 'good' || next.light === 'low') &&
        next.face === 'detected' &&
        (next.tracking === 'high' || next.tracking === 'medium');
      return next;
    });
  }, []);

  useEffect(() => {
    // Prefer MediaPipe (478-point mesh + blendshapes); face-api.js is the fallback
    loadMediaPipe().then(mp => {
      if (mp) setModelsReady(true);
      else loadModels().then(() => setModelsReady(true));
    });
  }, []);

  const startCamera = useCallback(async () => {
    try {
      // Mobile-optimized: prefer lower resolution for performance
      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: isMobile ? 640 : 1280 },
          height: { ideal: isMobile ? 480 : 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        updateCompatibility({ camera: 'ready' as CameraStatus });
        return true;
      }

      return false;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        updateCompatibility({ camera: 'no-permission' as CameraStatus });
      } else if (err.name === 'NotFoundError') {
        updateCompatibility({ camera: 'no-camera' as CameraStatus });
      } else {
        updateCompatibility({ camera: 'error' as CameraStatus });
      }
      return false;
    }
  }, [updateCompatibility]);

  const stopCamera = useCallback(() => {
    detectingRef.current = false;
    smoothedLandmarksRef.current = null;
    smoothedMetricsRef.current = null;
    missedFramesRef.current = 0;

    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setMetrics(null);
    setLandmarks(null);
    setIsDetecting(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  const startDetection = useCallback(() => {
    if (!videoRef.current || !modelsReady) return;
    detectingRef.current = true;
    setIsDetecting(true);

    const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 });
    const SMOOTH_ALPHA = 0.45;
    let lastDetectTime = 0;
    const DETECT_INTERVAL = 33;

    const detect = async (timestamp: number) => {
      if (!detectingRef.current || !videoRef.current || videoRef.current.readyState < 2) {
        if (detectingRef.current) animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      const lightLevel = estimateLightLevel(videoRef.current);
      let lightStatus: LightStatus = 'good';
      if (lightLevel < 0.15) lightStatus = 'too-dark';
      else if (lightLevel < 0.3) lightStatus = 'low';
      updateCompatibility({ light: lightStatus });

      if (timestamp - lastDetectTime >= DETECT_INTERVAL) {
        lastDetectTime = timestamp;

        const mp = detectMediaPipe(videoRef.current);
        if (mp !== undefined) {
          if (mp) {
            missedFramesRef.current = 0;
            const raw = refineWithBlendshapes(computeFaceMetrics(mp.points68), mp.blend);
            const pts = smoothLandmarks(smoothedLandmarksRef.current, mp.points68, 0.6);
            const met = smoothMetrics(smoothedMetricsRef.current, raw, 0.55);
            smoothedLandmarksRef.current = pts; smoothedMetricsRef.current = met;
            setMetrics(met); setLandmarks(pts);
            const vw = videoRef.current.videoWidth || 640;
            setVideoSize({ w: vw, h: videoRef.current.videoHeight || 480 });
            const ratio = mp.box.width / vw;
            const faceStatus: FaceStatus = ratio > 0.8 ? 'too-close' : ratio < 0.14 ? 'too-far' : 'detected';
            updateCompatibility({ face: faceStatus, tracking: 'high' });
          } else {
            missedFramesRef.current += 1;
            if (missedFramesRef.current < 8) updateCompatibility({ face: 'unstable', tracking: 'low' });
            else {
              smoothedLandmarksRef.current = null; smoothedMetricsRef.current = null;
              setMetrics(null); setLandmarks(null);
              updateCompatibility({ face: 'not-found', tracking: 'none' });
            }
          }
        } else try {
          const result = await faceapi
            .detectSingleFace(videoRef.current, options)
            .withFaceLandmarks()
            .withFaceExpressions();

          if (result) {
            missedFramesRef.current = 0;

            const rawPoints = result.landmarks.positions.map(point => ({ x: point.x, y: point.y }));
            const expressionObj: Record<string, number> = {};
            for (const [key, value] of Object.entries(result.expressions)) {
              expressionObj[key] = value as number;
            }

            const rawMetrics = computeFaceMetrics(rawPoints, expressionObj);
            const stablePoints = smoothLandmarks(smoothedLandmarksRef.current, rawPoints, SMOOTH_ALPHA);
            const stableMetrics = smoothMetrics(smoothedMetricsRef.current, rawMetrics, SMOOTH_ALPHA);

            smoothedLandmarksRef.current = stablePoints;
            smoothedMetricsRef.current = stableMetrics;

            setMetrics(stableMetrics);
            setLandmarks(stablePoints);
            setVideoSize({
              w: videoRef.current.videoWidth || 640,
              h: videoRef.current.videoHeight || 480,
            });

            const box = result.detection.box;
            const videoWidth = videoRef.current.videoWidth || 640;
            const faceRatio = box.width / videoWidth;

            let faceStatus: FaceStatus = 'detected';
            if (faceRatio > 0.72) faceStatus = 'too-close';
            else if (faceRatio < 0.12) faceStatus = 'too-far';

            const score = result.detection.score;
            let tracking: TrackingConfidence = 'high';
            if (score < 0.45) tracking = 'low';
            else if (score < 0.65) tracking = 'medium';

            updateCompatibility({ face: faceStatus, tracking });
          } else {
            missedFramesRef.current += 1;

            if (missedFramesRef.current < 6) {
              updateCompatibility({ face: 'unstable' as FaceStatus, tracking: 'low' as TrackingConfidence });
            } else {
              smoothedLandmarksRef.current = null;
              smoothedMetricsRef.current = null;
              setMetrics(null);
              setLandmarks(null);
              updateCompatibility({ face: 'not-found' as FaceStatus, tracking: 'none' as TrackingConfidence });
            }
          }
        } catch {
          updateCompatibility({ face: 'unstable' as FaceStatus, tracking: 'low' as TrackingConfidence });
        }
      }

      if (detectingRef.current) {
        animFrameRef.current = requestAnimationFrame(detect);
      }
    };

    animFrameRef.current = requestAnimationFrame(detect);
  }, [modelsReady, updateCompatibility]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    metrics,
    landmarks,
    videoSize,
    compatibility,
    isDetecting,
    modelsReady,
    startCamera,
    stopCamera,
    startDetection,
    updateCompatibility,
  };
}
