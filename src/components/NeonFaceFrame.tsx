import { useEffect, useRef } from 'react';
import { getObjectCoverTransform, sizeCanvasToParent } from '@/lib/canvas-utils';

interface NeonFaceFrameProps {
  landmarks: { x: number; y: number }[] | null;
  videoSize: { w: number; h: number };
  isCorrect: boolean;
  isDetected: boolean;
}

export function NeonFaceFrame({ landmarks, videoSize, isCorrect, isDetected }: NeonFaceFrameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowPhase = useRef(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const size = sizeCanvasToParent(canvas);
      if (!size) { animRef.current = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, size.w, size.h);

      if (!landmarks || landmarks.length < 68 || !isDetected) {
        // No face: pulsing scanning frame
        glowPhase.current += 0.03;
        const pulse = 0.3 + 0.3 * Math.sin(glowPhase.current);
        const cx = size.w / 2;
        const cy = size.h * 0.42;
        const rx = size.w * 0.28;
        const ry = size.h * 0.3;

        ctx.strokeStyle = `hsla(0, 85%, 55%, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        const bLen = 18;
        ctx.strokeStyle = `hsla(0, 85%, 60%, ${pulse + 0.2})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(cx - rx, cy - ry + bLen); ctx.lineTo(cx - rx, cy - ry); ctx.lineTo(cx - rx + bLen, cy - ry); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + rx - bLen, cy - ry); ctx.lineTo(cx + rx, cy - ry); ctx.lineTo(cx + rx, cy - ry + bLen); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - rx, cy + ry - bLen); ctx.lineTo(cx - rx, cy + ry); ctx.lineTo(cx - rx + bLen, cy + ry); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + rx - bLen, cy + ry); ctx.lineTo(cx + rx, cy + ry); ctx.lineTo(cx + rx, cy + ry - bLen); ctx.stroke();

        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const tx = getObjectCoverTransform(videoSize.w, videoSize.h, size.w, size.h, true);

      // Bounding box from jaw + brow landmarks
      const allPts: { x: number; y: number }[] = [];
      for (let i = 0; i <= 26; i++) allPts.push(tx(landmarks[i]));

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of allPts) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }

      const padX = (maxX - minX) * 0.2;
      const padY = (maxY - minY) * 0.25;
      minX -= padX; maxX += padX;
      minY -= padY * 1.2; maxY += padY * 0.6;

      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const rx = (maxX - minX) / 2;
      const ry = (maxY - minY) / 2;

      glowPhase.current += 0.035;
      const pulse = 0.6 + 0.3 * Math.sin(glowPhase.current);
      const breathe = 0.5 + 0.5 * Math.sin(glowPhase.current * 0.7);

      const hue = isCorrect ? 160 : 0;
      const sat = isCorrect ? '75%' : '85%';
      const light = isCorrect ? '50%' : '55%';
      const color = `hsl(${hue}, ${sat}, ${light})`;

      // Scan line
      const scanY = cy - ry + ((glowPhase.current * 40) % (ry * 2));
      ctx.strokeStyle = `hsla(${hue}, ${sat}, ${light}, 0.12)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.8, scanY);
      ctx.lineTo(cx + rx * 0.8, scanY);
      ctx.stroke();

      // Outer glow ellipse
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.strokeStyle = `hsla(${hue}, ${sat}, ${light}, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Dashed mid ring
      ctx.shadowBlur = 8;
      ctx.strokeStyle = `hsla(${hue}, ${sat}, ${light}, ${pulse * 0.4})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 1.06, ry * 1.06, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner ring
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `hsla(${hue}, ${sat}, ${light}, ${pulse * 0.2})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.93, ry * 0.93, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Corner brackets
      const bLen = 18;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;

      const bx1 = minX, by1 = minY, bx2 = maxX, by2 = maxY;
      ctx.beginPath(); ctx.moveTo(bx1, by1 + bLen); ctx.lineTo(bx1, by1); ctx.lineTo(bx1 + bLen, by1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx2 - bLen, by1); ctx.lineTo(bx2, by1); ctx.lineTo(bx2, by1 + bLen); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx1, by2 - bLen); ctx.lineTo(bx1, by2); ctx.lineTo(bx1 + bLen, by2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx2 - bLen, by2); ctx.lineTo(bx2, by2); ctx.lineTo(bx2, by2 - bLen); ctx.stroke();

      // Nose crosshair
      const nose = tx(landmarks[30]);
      ctx.strokeStyle = `hsla(${hue}, ${sat}, ${light}, ${breathe * 0.4})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 4;
      const ch = 5;
      ctx.beginPath(); ctx.moveTo(nose.x - ch, nose.y); ctx.lineTo(nose.x + ch, nose.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(nose.x, nose.y - ch); ctx.lineTo(nose.x, nose.y + ch); ctx.stroke();

      ctx.shadowBlur = 0;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [landmarks, videoSize, isCorrect, isDetected]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
    />
  );
}
