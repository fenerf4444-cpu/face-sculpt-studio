// Real face landmark analysis using face-api.js 68-point landmarks
// Combined with expression recognition for accurate face yoga evaluation

export interface FaceMetrics {
  mouthOpenness: number;        // 0-1
  mouthWidth: number;           // normalized ratio
  smileScore: number;           // 0-1 from expression model
  leftEyeOpenness: number;      // 0-1
  rightEyeOpenness: number;     // 0-1
  browRaiseLeft: number;        // 0-1
  browRaiseRight: number;       // 0-1
  headPitch: number;            // up/down estimate
  headYaw: number;              // left/right estimate
  headRoll: number;             // tilt angle
  lipProtrusion: number;        // 0-1
  cheekPuffEstimate: number;    // 0-1
  jawForward: number;           // 0-1
  faceWidth: number;
  faceHeight: number;
  symmetryScore: number;        // 0-1
  // Expression model outputs
  expressionHappy: number;
  expressionSurprised: number;
  expressionAngry: number;
  expressionNeutral: number;
  // Raw geometric ratios (used relative to the user's neutral calibration)
  cheekWidthRatio: number;      // lower-cheek width / face width
  lipRatio: number;             // lip height / lip width
  cheekHollow: number;          // 0-1, cheeks sucked in (relative to neutral when calibrated)
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// EAR (Eye Aspect Ratio) - standard for blink/eye openness detection
function eyeAspectRatio(eye: { x: number; y: number }[]) {
  if (eye.length < 6) return 0.3;
  const vertical1 = distance(eye[1], eye[5]);
  const vertical2 = distance(eye[2], eye[4]);
  const horizontal = distance(eye[0], eye[3]);
  return horizontal > 0 ? (vertical1 + vertical2) / (2 * horizontal) : 0.3;
}

// MAR (Mouth Aspect Ratio) - for mouth openness
function mouthAspectRatio(outerLips: { x: number; y: number }[], innerLips: { x: number; y: number }[]) {
  if (innerLips.length < 8) return 0;
  // Inner lip vertical distances
  const v1 = distance(innerLips[1], innerLips[7]);
  const v2 = distance(innerLips[2], innerLips[6]);
  const v3 = distance(innerLips[3], innerLips[5]);
  const h = distance(innerLips[0], innerLips[4]);
  return h > 0 ? (v1 + v2 + v3) / (3 * h) : 0;
}

export function computeFaceMetrics(
  landmarks: { x: number; y: number }[],
  expressions?: Record<string, number>
): FaceMetrics {
  if (landmarks.length < 68) return getDefaultMetrics();

  // Parse landmark groups (68-point standard)
  const jaw = landmarks.slice(0, 17);
  const leftBrow = landmarks.slice(17, 22);
  const rightBrow = landmarks.slice(22, 27);
  const noseBridge = landmarks.slice(27, 31);
  const noseTip = landmarks.slice(31, 36);
  const leftEye = landmarks.slice(36, 42);
  const rightEye = landmarks.slice(42, 48);
  const outerLips = landmarks.slice(48, 60);
  const innerLips = landmarks.slice(60, 68);

  // Face dimensions
  const faceWidth = distance(jaw[0], jaw[16]);
  const browCenter = midpoint(leftBrow[2], rightBrow[2]);
  const faceHeight = distance(jaw[8], browCenter);

  // --- MOUTH ---
  const mar = mouthAspectRatio(outerLips, innerLips);
  // Normalize: neutral MAR ~0.05-0.1, wide open ~0.7-1.0
  const mouthOpenness = Math.min(1, mar * 1.5);

  // Mouth width ratio (relative to face width)
  const mouthWidthPx = distance(outerLips[0], outerLips[6]);
  const mouthWidth = faceWidth > 0 ? mouthWidthPx / faceWidth : 0.3;

  // --- EYES ---
  const leftEAR = eyeAspectRatio(leftEye);
  const rightEAR = eyeAspectRatio(rightEye);
  // Normalize: closed ~0.05-0.1, neutral ~0.25-0.3, wide open ~0.4+
  const leftEyeOpenness = Math.min(1, Math.max(0, (leftEAR - 0.05) / 0.35));
  const rightEyeOpenness = Math.min(1, Math.max(0, (rightEAR - 0.05) / 0.35));

  // --- BROW RAISE ---
  const leftBrowCenter = leftBrow[2];
  const leftEyeCenter = midpoint(leftEye[1], leftEye[5]);
  const leftBrowDist = distance(leftBrowCenter, leftEyeCenter);
  const browRaiseLeft = Math.min(1, Math.max(0, (leftBrowDist / faceHeight - 0.06) / 0.08));

  const rightBrowCenter = rightBrow[2];
  const rightEyeCenter = midpoint(rightEye[1], rightEye[5]);
  const rightBrowDist = distance(rightBrowCenter, rightEyeCenter);
  const browRaiseRight = Math.min(1, Math.max(0, (rightBrowDist / faceHeight - 0.06) / 0.08));

  // --- HEAD POSE (geometric estimation) ---
  const nosePoint = noseBridge[3] || landmarks[30];
  const faceCenterX = (jaw[0].x + jaw[16].x) / 2;
  const headYaw = faceWidth > 0 ? ((nosePoint.x - faceCenterX) / (faceWidth * 0.5)) : 0;

  const faceCenterY = (jaw[8].y + browCenter.y) / 2;
  const headPitch = faceHeight > 0 ? ((nosePoint.y - faceCenterY) / (faceHeight * 0.5)) : 0;

  const headRoll = Math.atan2(jaw[16].y - jaw[0].y, jaw[16].x - jaw[0].x);

  // --- LIP PROTRUSION ---
  // When lips protrude, the outer lip area extends forward (mouth narrows + lips push out)
  const upperLipTop = outerLips[3]; // top center of upper lip
  const lowerLipBottom = outerLips[9]; // bottom center of lower lip
  const lipVertical = distance(upperLipTop, lowerLipBottom);
  const lipHorizontal = mouthWidthPx;
  // More vertical relative to horizontal = more protrusion
  const lipRatio = lipHorizontal > 0 ? lipVertical / lipHorizontal : 0;
  const lipProtrusion = Math.min(1, Math.max(0, (lipRatio - 0.3) / 0.5));

  // --- CHEEK PUFF ---
  // Cheek puff increases face width at mid-cheek level while mouth stays closed
  const cheekLeft = jaw[3];
  const cheekRight = jaw[13];
  const cheekWidth = distance(cheekLeft, cheekRight);
  const cheekRatio = faceWidth > 0 ? cheekWidth / faceWidth : 0.7;
  // Normal ~0.65-0.75, puffed ~0.8+
  const cheekPuffEstimate = Math.min(1, Math.max(0, (cheekRatio - 0.72) / 0.15));

  // --- JAW FORWARD ---
  const chinPoint = jaw[8];
  const noseBase = noseTip[0] || landmarks[31];
  const jawNoseAngle = faceHeight > 0 ? (chinPoint.y - noseBase.y) / faceHeight : 0.5;
  const jawForward = Math.min(1, Math.max(0, (jawNoseAngle - 0.3) / 0.3));

  // --- SYMMETRY ---
  const leftFaceDist = distance(jaw[0], nosePoint);
  const rightFaceDist = distance(jaw[16], nosePoint);
  const maxDist = Math.max(leftFaceDist, rightFaceDist);
  const symmetryScore = maxDist > 0 ? Math.min(leftFaceDist, rightFaceDist) / maxDist : 1;

  // --- SMILE ---
  // Combine geometric (mouth corners lift) with expression model
  const mouthCenter = midpoint(innerLips[0], innerLips[4]);
  const leftCornerLift = (mouthCenter.y - outerLips[0].y);
  const rightCornerLift = (mouthCenter.y - outerLips[6].y);
  const geometricSmile = Math.min(1, Math.max(0, ((leftCornerLift + rightCornerLift) / faceHeight) * 4));
  const expressionSmile = expressions?.happy || 0;
  const smileScore = Math.min(1, geometricSmile * 0.4 + expressionSmile * 0.6);

  return {
    mouthOpenness,
    mouthWidth,
    smileScore,
    leftEyeOpenness,
    rightEyeOpenness,
    browRaiseLeft,
    browRaiseRight,
    headPitch,
    headYaw,
    headRoll,
    lipProtrusion,
    cheekPuffEstimate,
    jawForward,
    faceWidth,
    faceHeight,
    symmetryScore,
    expressionHappy: expressions?.happy || 0,
    expressionSurprised: expressions?.surprised || 0,
    expressionAngry: expressions?.angry || 0,
    expressionNeutral: expressions?.neutral || 0,
    cheekWidthRatio: cheekRatio,
    lipRatio,
    // Uncalibrated estimate: narrow mouth + slimmer lower cheeks
    cheekHollow: Math.min(1, Math.max(0, (0.4 - mouthWidth) / 0.1 * 0.6 + (0.74 - cheekRatio) / 0.05 * 0.4)),
  };
}

function getDefaultMetrics(): FaceMetrics {
  return {
    mouthOpenness: 0, mouthWidth: 0.3, smileScore: 0,
    leftEyeOpenness: 0.5, rightEyeOpenness: 0.5,
    browRaiseLeft: 0.3, browRaiseRight: 0.3,
    headPitch: 0, headYaw: 0, headRoll: 0,
    lipProtrusion: 0, cheekPuffEstimate: 0, jawForward: 0,
    faceWidth: 0, faceHeight: 0, symmetryScore: 1,
    expressionHappy: 0, expressionSurprised: 0,
    expressionAngry: 0, expressionNeutral: 1,
    cheekWidthRatio: 0.72, lipRatio: 0.3, cheekHollow: 0,
  };
}

export function estimateLightLevel(videoElement: HTMLVideoElement): number {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0.5;
  ctx.drawImage(videoElement, 0, 0, 64, 64);
  const imageData = ctx.getImageData(0, 0, 64, 64);
  const data = imageData.data;
  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    totalBrightness += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
  }
  return totalBrightness / (data.length / 4) / 255;
}
