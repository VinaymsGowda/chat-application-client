// High-quality video constraints for optimal camera quality
export const HIGH_QUALITY_VIDEO_CONSTRAINTS = {
  width: { ideal: 1920, min: 1280 },
  height: { ideal: 1080, min: 720 },
  frameRate: { ideal: 30, max: 60 },
  facingMode: "user", // Prefer front-facing camera
  aspectRatio: { ideal: 16 / 9 },
};

// High-quality audio constraints
export const HIGH_QUALITY_AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 2,
  sampleRate: 48000,
  sampleSize: 16,
};

// Default media controls state
export const DEFAULT_MEDIA_CONTROLS = {
  camera: false,
  microphone: false,
  screenShare: false,
};

// WebRTC ICE servers configuration
export const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
