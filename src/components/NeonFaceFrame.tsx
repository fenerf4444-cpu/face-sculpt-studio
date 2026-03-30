import { useEffect, useRef } from 'react';

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
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!landmarks || landmarks.length < 68 || !isDetected) {
        // No face: draw pulsing red scanning frame
        glowPhase.current += 0.03;
        const pulse = 0.3 + 0.3 * Math.sin(glowPhase.current);
        const cx = canvas.width / 2;
        const cy = canvas.height * 0.42;
        const rx = canvas.width * 0.28;
        const ry = canvas.height * 0.3;

        ctx.strokeStyle = `hsla(0, 85%, 55%, ${pulse})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Corner brackets
        const bLen = 18;
        ctx.strokeStyle = `hsla(0, 85%, 60%, ${pulse + 0.2})`;
        ctx.lineWidth = 3;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(cx - rx, cy - ry + bLen); ctx.lineTo(cx - rx, cy - ry); ctx.lineTo(cx - rx + bLen, cy - ry);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(cx + rx - bLen, cy - ry); ctx.lineTo(cx + rx, cy - ry); ctx.lineTo(cx + rx, cy - ry + bLen);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(cx - rx, cy + ry - bLen); ctx.lineTo(cx - rx, cy + ry); ctx.lineTo(cx - rx + bLen, cy + ry);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(cx + rx - bLen, cy + ry); ctx.lineTo(cx + rx, cy + ry); ctx.lineTo(cx + rx, cy + ry - bLen);
        ctx.stroke();

        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const scaleX = canvas.width / videoSize.w;
      const scaleY = canvas.height / videoSize.h;
      const tx = (p: { x: number; y: number }) => ({
        x: canvas.width - p.x * scaleX,
        y: p.y * scaleY,
      });

      // Calculate face bounding box from jaw landmarks (0-16)
      const jawPts = [];
      for (let i = 0; i <= 16; i++) jawPts.push(tx(landmarks[i]));
      // Brow points for top
      const browPts = [];
      for (let i = 17; i <= 26; i++) browPts.push(tx(landmarks[i]));

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of [...jawPts, ...browPts]) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }

      // Add padding
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

      // Scanning lines effect - horizontal lines moving across face
      const scanY = cy - ry + ((glowPhase.current * 40) % (ry * 2));
      ctx.strokeStyle = `hsla(${hue}, ${sat}, ${light}, 0.15)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.8, scanY);
      ctx.lineTo(cx + rx * 0.8, scanY);
      ctx.stroke();

      // Outer glow ellipse with double layer
      ctx.shadowColor = color;
      ctx.shadowBlur = 24;
      ctx.strokeStyle = `hsla(${hue}, ${sat}, ${light}, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Mid ring
      ctx.shadowBlur = 12;
      ctx.strokeStyle = `hsla(${hue}, ${sat}, ${light}, ${pulse * 0.5})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 1.08, ry * 1.08, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Inner subtle glow
      ctx.strokeStyle = `hsla(${hue}, ${sat}, ${light}, ${pulse * 0.25})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.92, ry * 0.92, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Corner brackets with enhanced glow
      const bLen = 20;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;

      const bx1 = minX, by1 = minY, bx2 = maxX, by2 = maxY;
      // TL
      ctx.beginPath(); ctx.moveTo(bx1, by1 + bLen); ctx.lineTo(bx1, by1); ctx.lineTo(bx1 + bLen, by1); ctx.stroke();
      // TR
      ctx.beginPath(); ctx.moveTo(bx2 - bLen, by1); ctx.lineTo(bx2, by1); ctx.lineTo(bx2, by1 + bLen); ctx.stroke();
      // BL
      ctx.beginPath(); ctx.moveTo(bx1, by2 - bLen); ctx.lineTo(bx1, by2); ctx.lineTo(bx1 + bLen, by2); ctx.stroke();
      // BR
      ctx.beginPath(); ctx.moveTo(bx2 - bLen, by2); ctx.lineTo(bx2, by2); ctx.lineTo(bx2, by2 - bLen); ctx.stroke();

      // Crosshair at nose tip (landmark 30)
      const nose = tx(landmarks[30]);
      ctx.strokeStyle = `hsla(${hue}, ${sat}, ${light}, ${breathe * 0.5})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 6;
      const chSize = 6;
      ctx.beginPath(); ctx.moveTo(nose.x - chSize, nose.y); ctx.lineTo(nose.x + chSize, nose.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(nose.x, nose.y - chSize); ctx.lineTo(nose.x, nose.y + chSize); ctx.stroke();

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
