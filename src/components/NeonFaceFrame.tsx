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

      glowPhase.current += 0.04;
      const pulse = 0.6 + 0.3 * Math.sin(glowPhase.current);

      const hue = isCorrect ? 160 : 0;
      const sat = isCorrect ? '75%' : '85%';
      const light = isCorrect ? '50%' : '55%';
      const color = `hsl(${hue}, ${sat}, ${light})`;
      const glowColor = `hsla(${hue}, ${sat}, ${light}, ${pulse * 0.4})`;

      // Outer glow ellipse
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = `hsla(${hue}, ${sat}, ${light}, ${pulse})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner subtle glow
      ctx.strokeStyle = `hsla(${hue}, ${sat}, ${light}, ${pulse * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.95, ry * 0.95, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Corner brackets on bounding box
      const bLen = 16;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;

      const bx1 = minX, by1 = minY, bx2 = maxX, by2 = maxY;
      // TL
      ctx.beginPath(); ctx.moveTo(bx1, by1 + bLen); ctx.lineTo(bx1, by1); ctx.lineTo(bx1 + bLen, by1); ctx.stroke();
      // TR
      ctx.beginPath(); ctx.moveTo(bx2 - bLen, by1); ctx.lineTo(bx2, by1); ctx.lineTo(bx2, by1 + bLen); ctx.stroke();
      // BL
      ctx.beginPath(); ctx.moveTo(bx1, by2 - bLen); ctx.lineTo(bx1, by2); ctx.lineTo(bx1 + bLen, by2); ctx.stroke();
      // BR
      ctx.beginPath(); ctx.moveTo(bx2 - bLen, by2); ctx.lineTo(bx2, by2); ctx.lineTo(bx2, by2 - bLen); ctx.stroke();

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
