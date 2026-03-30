import { useRef, useEffect } from 'react';
import { getObjectCoverTransform, sizeCanvasToParent } from '@/lib/canvas-utils';

interface FaceLandmarkOverlayProps {
  landmarks: { x: number; y: number }[] | null;
  videoSize: { w: number; h: number };
  activeZone?: string;
  isDetected?: boolean;
}

const ZONES: Record<string, { indices: number[][]; color: string }> = {
  jaw: {
    indices: [[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]],
    color: 'hsl(160, 75%, 50%)',
  },
  lips: {
    indices: [[48,49,50,51,52,53,54,55,56,57,58,59,48], [60,61,62,63,64,65,66,67,60]],
    color: 'hsl(350, 85%, 60%)',
  },
  eyes: {
    indices: [[36,37,38,39,40,41,36], [42,43,44,45,46,47,42]],
    color: 'hsl(185, 80%, 55%)',
  },
  forehead: {
    indices: [[17,18,19,20,21], [22,23,24,25,26]],
    color: 'hsl(25, 95%, 60%)',
  },
  cheeks: {
    indices: [[1,2,3,4,5,48], [11,12,13,14,15,54]],
    color: 'hsl(330, 85%, 60%)',
  },
  nose: {
    indices: [[27,28,29,30], [31,32,33,34,35]],
    color: 'hsl(45, 90%, 60%)',
  },
};

export function FaceLandmarkOverlay({ landmarks, videoSize, activeZone, isDetected }: FaceLandmarkOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = sizeCanvasToParent(canvas);
    if (!size) return;
    ctx.clearRect(0, 0, size.w, size.h);

    if (!landmarks || landmarks.length < 68) return;

    const tx = getObjectCoverTransform(videoSize.w, videoSize.h, size.w, size.h, true);

    // Draw all landmark points
    ctx.fillStyle = isDetected ? 'rgba(0, 255, 150, 0.4)' : 'rgba(255, 80, 80, 0.4)';
    for (const pt of landmarks) {
      const { x, y } = tx(pt);
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw zone contours
    for (const [zoneName, zone] of Object.entries(ZONES)) {
      const isActive = activeZone === zoneName;
      const baseAlpha = isActive ? 0.9 : 0.2;
      const lineWidth = isActive ? 2.5 : 0.8;

      ctx.strokeStyle = zone.color;
      ctx.globalAlpha = baseAlpha;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      for (const idxGroup of zone.indices) {
        if (idxGroup.length < 2) continue;
        ctx.beginPath();
        const first = tx(landmarks[idxGroup[0]]);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < idxGroup.length; i++) {
          const p = tx(landmarks[idxGroup[i]]);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      if (isActive) {
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = zone.color;
        for (const idxGroup of zone.indices) {
          if (idxGroup.length < 3) continue;
          ctx.beginPath();
          const first = tx(landmarks[idxGroup[0]]);
          ctx.moveTo(first.x, first.y);
          for (let i = 1; i < idxGroup.length; i++) {
            const p = tx(landmarks[idxGroup[i]]);
            ctx.lineTo(p.x, p.y);
          }
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    ctx.globalAlpha = 1;
  }, [landmarks, videoSize, activeZone, isDetected]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
}
