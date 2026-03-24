import { useState, useCallback, useRef, useEffect } from 'react';
import { FaceMetrics, computeFaceMetrics, estimateLightLevel } from '@/lib/face-detection';
import { CompatibilityState, FaceStatus, LightStatus, CameraStatus, TrackingConfidence } from '@/types/exercises';

// We use a canvas-based approach. In production, integrate face-api.js or MediaPipe.
// This hook provides the interface; actual detection logic is pluggable.

export function useFaceDetection() {
  const [metrics, setMetrics] = useState<FaceMetrics | null>(null);
  const [compatibility, setCompatibility] = useState<CompatibilityState>({
    camera: 'checking',
    light: 'checking',
    face: 'searching',
    tracking: 'none',
    allReady: false,
  });
  const [isDetecting, setIsDetecting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const landmarksRef = useRef<{ x: number; y: number }[]>([]);

  const updateCompatibility = useCallback((updates: Partial<CompatibilityState>) => {
    setCompatibility(prev => {
      const next = { ...prev, ...updates };
      next.allReady = next.camera === 'ready' && next.light === 'good' && next.face === 'detected' && (next.tracking === 'high' || next.tracking === 'medium');
      return next;
    });
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
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsDetecting(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  // Simulated face detection loop (in production, replace with face-api.js / MediaPipe)
  const startDetection = useCallback(() => {
    if (!videoRef.current) return;
    setIsDetecting(true);

    const detect = () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      // Light check
      const lightLevel = estimateLightLevel(videoRef.current);
      let lightStatus: LightStatus = 'good';
      if (lightLevel < 0.15) lightStatus = 'too-dark';
      else if (lightLevel < 0.3) lightStatus = 'low';
      updateCompatibility({ light: lightStatus });

      // Simulate face detection with synthetic landmarks
      // In production: use face-api.js detectSingleFace().withFaceLandmarks()
      const hasFace = lightLevel > 0.15;
      if (hasFace) {
        // Generate synthetic 68 landmarks for demo
        const w = videoRef.current.videoWidth || 640;
        const h = videoRef.current.videoHeight || 480;
        const cx = w / 2, cy = h / 2;
        const faceW = w * 0.4, faceH = h * 0.5;

        const syntheticLandmarks: { x: number; y: number }[] = [];
        // Jaw: 0-16
        for (let i = 0; i <= 16; i++) {
          const angle = Math.PI * 0.15 + (Math.PI * 0.7 * i / 16);
          syntheticLandmarks.push({
            x: cx + Math.cos(angle) * faceW / 2,
            y: cy + Math.sin(angle) * faceH / 2 * 0.8,
          });
        }
        // Brows, nose, eyes, mouth approximations to reach 68 points
        for (let i = 17; i < 68; i++) {
          const row = Math.floor((i - 17) / 10);
          const col = (i - 17) % 10;
          syntheticLandmarks.push({
            x: cx - faceW * 0.3 + col * (faceW * 0.06) + (Math.random() - 0.5) * 4,
            y: cy - faceH * 0.3 + row * (faceH * 0.1) + (Math.random() - 0.5) * 4,
          });
        }

        landmarksRef.current = syntheticLandmarks;
        const faceMetrics = computeFaceMetrics(syntheticLandmarks);
        setMetrics(faceMetrics);
        updateCompatibility({
          face: 'detected' as FaceStatus,
          tracking: 'high' as TrackingConfidence,
        });
      } else {
        setMetrics(null);
        updateCompatibility({
          face: 'not-found' as FaceStatus,
          tracking: 'none' as TrackingConfidence,
        });
      }

      animFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  }, [updateCompatibility]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    metrics,
    compatibility,
    isDetecting,
    startCamera,
    stopCamera,
    startDetection,
    updateCompatibility,
  };
}
