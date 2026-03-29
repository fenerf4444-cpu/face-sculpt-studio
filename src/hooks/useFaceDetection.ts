import { useState, useCallback, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { FaceMetrics, computeFaceMetrics, estimateLightLevel } from '@/lib/face-detection';
import { CompatibilityState, FaceStatus, LightStatus, CameraStatus, TrackingConfidence } from '@/types/exercises';

let modelsLoaded = false;
let modelsLoading = false;

async function loadModels() {
  if (modelsLoaded || modelsLoading) return;
  modelsLoading = true;
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
  modelsLoading = false;
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

  const updateCompatibility = useCallback((updates: Partial<CompatibilityState>) => {
    setCompatibility(prev => {
      const next = { ...prev, ...updates };
      next.allReady = next.camera === 'ready' && next.light === 'good' && next.face === 'detected' && (next.tracking === 'high' || next.tracking === 'medium');
      return next;
    });
  }, []);

  // Pre-load models on mount
  useEffect(() => {
    loadModels().then(() => setModelsReady(true));
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
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
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsDetecting(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  const startDetection = useCallback(() => {
    if (!videoRef.current || !modelsReady) return;
    detectingRef.current = true;
    setIsDetecting(true);

    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.25 });

    let lastDetectTime = 0;
    const DETECT_INTERVAL = 50; // ~20fps for smoother tracking

    const detect = async (timestamp: number) => {
      if (!detectingRef.current || !videoRef.current || videoRef.current.readyState < 2) {
        if (detectingRef.current) animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      // Light check (cheap, every frame)
      const lightLevel = estimateLightLevel(videoRef.current);
      let lightStatus: LightStatus = 'good';
      if (lightLevel < 0.15) lightStatus = 'too-dark';
      else if (lightLevel < 0.3) lightStatus = 'low';
      updateCompatibility({ light: lightStatus });

      // Face detection (throttled)
      if (timestamp - lastDetectTime >= DETECT_INTERVAL) {
        lastDetectTime = timestamp;

        try {
          const result = await faceapi
            .detectSingleFace(videoRef.current, options)
            .withFaceLandmarks()
            .withFaceExpressions();

          if (result) {
            const landmarks = result.landmarks;
            const positions = landmarks.positions;
            const expressions = result.expressions;

            // Convert to our format
            const points = positions.map(p => ({ x: p.x, y: p.y }));
            const expressionObj: Record<string, number> = {};
            for (const [key, val] of Object.entries(expressions)) {
              expressionObj[key] = val as number;
            }
            const faceMetrics = computeFaceMetrics(points, expressionObj);

            setMetrics(faceMetrics);
            setLandmarks(points);
            setVideoSize({ w: videoRef.current.videoWidth || 640, h: videoRef.current.videoHeight || 480 });
            // Face distance check
            const box = result.detection.box;
            const videoWidth = videoRef.current.videoWidth || 640;
            const faceRatio = box.width / videoWidth;

            let faceStatus: FaceStatus = 'detected';
            if (faceRatio > 0.7) faceStatus = 'too-close';
            else if (faceRatio < 0.15) faceStatus = 'too-far';

            const score = result.detection.score;
            let tracking: TrackingConfidence = 'high';
            if (score < 0.5) tracking = 'low';
            else if (score < 0.7) tracking = 'medium';

            updateCompatibility({ face: faceStatus, tracking });
          } else {
            setMetrics(null);
            setLandmarks(null);
            updateCompatibility({ face: 'not-found' as FaceStatus, tracking: 'none' as TrackingConfidence });
          }
        } catch {
          // Detection error, skip frame
        }
      }

      if (detectingRef.current) {
        animFrameRef.current = requestAnimationFrame(detect);
      }
    };

    animFrameRef.current = requestAnimationFrame(detect);
  }, [modelsReady, updateCompatibility]);

  useEffect(() => {
    return () => { stopCamera(); };
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
