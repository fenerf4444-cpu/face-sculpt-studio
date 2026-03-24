// Face landmark indices for key features (MediaPipe Face Mesh 468 landmarks)
// We use a simplified approach with face-api.js style 68 landmarks for web

export interface FaceLandmarks {
  jawOutline: { x: number; y: number }[];     // 0-16
  leftEyebrow: { x: number; y: number }[];    // 17-21
  rightEyebrow: { x: number; y: number }[];   // 22-26
  noseBridge: { x: number; y: number }[];      // 27-30
  noseTip: { x: number; y: number }[];         // 31-35
  leftEye: { x: number; y: number }[];         // 36-41
  rightEye: { x: number; y: number }[];        // 42-47
  outerLips: { x: number; y: number }[];       // 48-59
  innerLips: { x: number; y: number }[];       // 60-67
  all: { x: number; y: number }[];
}

export interface FaceMetrics {
  mouthOpenness: number;        // 0-1 how open mouth is
  mouthWidth: number;           // normalized
  smileScore: number;           // 0-1
  leftEyeOpenness: number;      // 0-1
  rightEyeOpenness: number;     // 0-1
  browRaiseLeft: number;        // 0-1
  browRaiseRight: number;       // 0-1
  headPitch: number;            // up/down angle
  headYaw: number;              // left/right angle
  headRoll: number;             // tilt angle
  lipProtrusion: number;        // 0-1
  cheekPuffEstimate: number;    // 0-1 estimated from face width change
  jawForward: number;           // 0-1
  faceWidth: number;            // normalized face width
  faceHeight: number;           // normalized face height
  symmetryScore: number;        // 0-1
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function computeFaceMetrics(landmarks: { x: number; y: number }[]): FaceMetrics {
  if (landmarks.length < 68) {
    return getDefaultMetrics();
  }

  // Face dimensions for normalization
  const faceWidth = distance(landmarks[0], landmarks[16]);
  const faceHeight = distance(landmarks[8], midpoint(landmarks[19], landmarks[24]));

  // Mouth openness: vertical distance between inner lips / face height
  const mouthTop = landmarks[62];
  const mouthBottom = landmarks[66];
  const mouthOpenness = Math.min(1, (distance(mouthTop, mouthBottom) / faceHeight) * 5);

  // Mouth width
  const mouthLeft = landmarks[48];
  const mouthRight = landmarks[54];
  const mouthWidth = distance(mouthLeft, mouthRight) / faceWidth;

  // Smile score: mouth corners up relative to mouth center
  const mouthCenter = midpoint(landmarks[62], landmarks[66]);
  const leftCornerLift = (mouthCenter.y - landmarks[48].y) / faceHeight;
  const rightCornerLift = (mouthCenter.y - landmarks[54].y) / faceHeight;
  const smileScore = Math.min(1, Math.max(0, (leftCornerLift + rightCornerLift) * 8));

  // Eye openness
  const leftEyeTop = landmarks[37];
  const leftEyeBottom = landmarks[41];
  const leftEyeWidth = distance(landmarks[36], landmarks[39]);
  const leftEyeHeight = distance(leftEyeTop, leftEyeBottom);
  const leftEyeOpenness = Math.min(1, (leftEyeHeight / leftEyeWidth) * 3);

  const rightEyeTop = landmarks[43];
  const rightEyeBottom = landmarks[47];
  const rightEyeWidth = distance(landmarks[42], landmarks[45]);
  const rightEyeHeight = distance(rightEyeTop, rightEyeBottom);
  const rightEyeOpenness = Math.min(1, (rightEyeHeight / rightEyeWidth) * 3);

  // Brow raise: distance from brow to eye
  const leftBrowCenter = landmarks[19];
  const leftEyeCenter = midpoint(landmarks[37], landmarks[41]);
  const browRaiseLeft = Math.min(1, (distance(leftBrowCenter, leftEyeCenter) / faceHeight) * 5);

  const rightBrowCenter = landmarks[24];
  const rightEyeCenter = midpoint(landmarks[43], landmarks[47]);
  const browRaiseRight = Math.min(1, (distance(rightBrowCenter, rightEyeCenter) / faceHeight) * 5);

  // Head pose estimation (simplified)
  const noseTip = landmarks[30];
  const faceCenterX = (landmarks[0].x + landmarks[16].x) / 2;
  const headYaw = ((noseTip.x - faceCenterX) / faceWidth) * 2;

  const faceCenterY = (landmarks[8].y + midpoint(landmarks[19], landmarks[24]).y) / 2;
  const headPitch = ((noseTip.y - faceCenterY) / faceHeight) * 2;

  const leftEarLobe = landmarks[0];
  const rightEarLobe = landmarks[16];
  const headRoll = Math.atan2(rightEarLobe.y - leftEarLobe.y, rightEarLobe.x - leftEarLobe.x);

  // Lip protrusion estimate: lips forward = lips closer to nose relative to chin
  const chinPoint = landmarks[8];
  const lipCenter = midpoint(landmarks[51], landmarks[57]);
  const lipProtrusion = Math.min(1, Math.max(0, 1 - (distance(lipCenter, noseTip) / distance(chinPoint, noseTip))));

  // Cheek puff estimate: face width change at cheek level
  const cheekLeft = landmarks[3];
  const cheekRight = landmarks[13];
  const cheekWidth = distance(cheekLeft, cheekRight);
  const cheekPuffEstimate = Math.min(1, Math.max(0, (cheekWidth / faceWidth - 0.7) * 3));

  // Jaw forward estimate
  const jawForward = Math.min(1, Math.max(0, headPitch * -1));

  // Symmetry score
  const leftFaceWidth = distance(landmarks[0], noseTip);
  const rightFaceWidth = distance(landmarks[16], noseTip);
  const widthRatio = Math.min(leftFaceWidth, rightFaceWidth) / Math.max(leftFaceWidth, rightFaceWidth);
  const symmetryScore = widthRatio;

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
  };
}

function getDefaultMetrics(): FaceMetrics {
  return {
    mouthOpenness: 0,
    mouthWidth: 0,
    smileScore: 0,
    leftEyeOpenness: 0.5,
    rightEyeOpenness: 0.5,
    browRaiseLeft: 0.3,
    browRaiseRight: 0.3,
    headPitch: 0,
    headYaw: 0,
    headRoll: 0,
    lipProtrusion: 0,
    cheekPuffEstimate: 0,
    jawForward: 0,
    faceWidth: 0,
    faceHeight: 0,
    symmetryScore: 1,
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
