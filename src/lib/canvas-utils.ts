/**
 * Computes the transform needed to map video coordinates to canvas coordinates
 * when the video uses object-cover (which crops the video to fill the container).
 */
export function getObjectCoverTransform(
  videoW: number,
  videoH: number,
  containerW: number,
  containerH: number,
  mirror = true,
) {
  const videoAspect = videoW / videoH;
  const containerAspect = containerW / containerH;

  let scale: number;
  let offsetX = 0;
  let offsetY = 0;

  if (containerAspect > videoAspect) {
    // Container is wider — video is scaled by width, cropped top/bottom
    scale = containerW / videoW;
    offsetY = (containerH - videoH * scale) / 2;
  } else {
    // Container is taller — video is scaled by height, cropped left/right
    scale = containerH / videoH;
    offsetX = (containerW - videoW * scale) / 2;
  }

  return (p: { x: number; y: number }) => ({
    x: mirror
      ? containerW - (p.x * scale + offsetX)
      : p.x * scale + offsetX,
    y: p.y * scale + offsetY,
  });
}

/**
 * Sets canvas to match its parent's actual pixel dimensions (for retina).
 * Returns the display size.
 */
export function sizeCanvasToParent(canvas: HTMLCanvasElement): { w: number; h: number } | null {
  const rect = canvas.parentElement?.getBoundingClientRect();
  if (!rect) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  const ctx = canvas.getContext('2d');
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { w: rect.width, h: rect.height };
}
