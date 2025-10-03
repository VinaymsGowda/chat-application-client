/**
 * MediaController - Centralized media control manager using command pattern
 * Eliminates code duplication and provides consistent error handling for media operations
 */

class MediaController {
  constructor(mediaContext, toastContext) {
    this.mediaContext = mediaContext;
    this.showToast = toastContext?.showToast || (() => {});

    // Bind methods to preserve context
    this.toggleCamera = this.toggleCamera.bind(this);
    this.toggleMicrophone = this.toggleMicrophone.bind(this);
    this.toggleScreenShare = this.toggleScreenShare.bind(this);
  }

  /**
   * Toggle camera on/off with proper error handling
   * Supports call upgrade from audio to video when camera is enabled
   */
  async toggleCamera() {
    try {
      if (!this.mediaContext.localStream?.current) {
        throw new Error("No local media stream available");
      }

      const currentCameraState = this.mediaContext.localMediaControls.camera;
      const newCameraState = !currentCameraState;

      // Use the enhanced MediaProvider method
      await this.mediaContext.toggleCamera();

      // Only show success toast for simple toggle (not call upgrade)
      // Call upgrade success is handled by MediaProvider
      if (this.mediaContext.callType === "video" || !newCameraState) {
        this.showToast({
          title: `Camera ${newCameraState ? "enabled" : "disabled"}`,
          type: "success",
        });
      }

      return newCameraState;
    } catch (error) {
      console.error("Error toggling camera:", error);

      let errorMessage = "Failed to toggle camera";

      if (error.name === "NotAllowedError") {
        errorMessage = "Camera access denied. Please allow camera permissions.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "No camera device found.";
      } else if (error.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application.";
      }

      this.showToast({
        title: errorMessage,
        type: "error",
      });

      throw error;
    }
  }

  /**
   * Toggle microphone mute/unmute with proper error handling
   */
  async toggleMicrophone() {
    try {
      if (!this.mediaContext.localStream?.current) {
        throw new Error("No local media stream available");
      }

      const currentMicState = this.mediaContext.localMediaControls.microphone;
      const newMicState = !currentMicState;

      // Use the enhanced MediaProvider method
      await this.mediaContext.toggleMicrophone();

      this.showToast({
        title: `Microphone ${newMicState ? "unmuted" : "muted"}`,
        type: "success",
      });

      return newMicState;
    } catch (error) {
      console.error("Error toggling microphone:", error);

      let errorMessage = "Failed to toggle microphone";

      if (error.name === "NotAllowedError") {
        errorMessage =
          "Microphone access denied. Please allow microphone permissions.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "No microphone device found.";
      }

      this.showToast({
        title: errorMessage,
        type: "error",
      });

      throw error;
    }
  }

  /**
   * Toggle screen sharing with comprehensive error handling
   */
  async toggleScreenShare() {
    try {
      const currentScreenShareState =
        this.mediaContext.localMediaControls.screenShare;
      const newScreenShareState = !currentScreenShareState;

      // Use the enhanced MediaProvider method
      await this.mediaContext.toggleScreenShare();

      this.showToast({
        title: `Screen sharing ${newScreenShareState ? "started" : "stopped"}`,
        type: "success",
      });

      return newScreenShareState;
    } catch (error) {
      console.error("Error toggling screen share:", error);

      let errorMessage = "Failed to toggle screen sharing";

      if (error.name === "NotAllowedError") {
        errorMessage = "Screen sharing permission denied.";
      } else if (error.name === "NotSupportedError") {
        errorMessage = "Screen sharing is not supported in this browser.";
      } else if (error.name === "AbortError") {
        errorMessage = "Screen sharing was cancelled.";
      }

      this.showToast({
        title: errorMessage,
        type: "error",
      });

      throw error;
    }
  }

  /**
   * Get current media control states
   */
  getMediaStates() {
    return {
      camera: this.mediaContext.localMediaControls.camera,
      microphone: this.mediaContext.localMediaControls.microphone,
      screenShare: this.mediaContext.localMediaControls.screenShare,
    };
  }

  /**
   * Check if local video is available and enabled
   */
  isLocalVideoAvailable() {
    const { localStream, localMediaControls } = this.mediaContext;

    return (
      localMediaControls.camera &&
      localStream?.current &&
      localStream.current.active &&
      localStream.current.getVideoTracks().some((track) => track.enabled)
    );
  }

  /**
   * Check if local audio is available and enabled
   */
  isLocalAudioAvailable() {
    const { localStream, localMediaControls } = this.mediaContext;

    return (
      localMediaControls.microphone &&
      localStream?.current &&
      localStream.current.active &&
      localStream.current.getAudioTracks().some((track) => track.enabled)
    );
  }

  /**
   * Validate media device availability before operations
   */
  async validateMediaDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const hasCamera = devices.some((device) => device.kind === "videoinput");
      const hasMicrophone = devices.some(
        (device) => device.kind === "audioinput"
      );

      return {
        camera: hasCamera,
        microphone: hasMicrophone,
        screenShare: "getDisplayMedia" in navigator.mediaDevices,
      };
    } catch (error) {
      console.error("Error validating media devices:", error);
      return {
        camera: false,
        microphone: false,
        screenShare: false,
      };
    }
  }

  /**
   * Handle media device errors with user-friendly messages
   */
  handleMediaError(error, operation) {
    console.error(`Media error during ${operation}:`, error);

    const errorMessages = {
      NotAllowedError: `Permission denied for ${operation}. Please allow access in your browser settings.`,
      NotFoundError: `No device found for ${operation}. Please check your device connections.`,
      NotReadableError: `Device is busy or unavailable for ${operation}. Please close other applications using the device.`,
      OverconstrainedError: `Device constraints not supported for ${operation}. Please try with different settings.`,
      SecurityError: `Security error during ${operation}. Please ensure you're using HTTPS.`,
      AbortError: `${operation} was cancelled by the user.`,
      NotSupportedError: `${operation} is not supported in this browser.`,
    };

    const message =
      errorMessages[error.name] ||
      `An unexpected error occurred during ${operation}.`;

    this.showToast({
      title: message,
      type: "error",
    });

    return message;
  }
}

export default MediaController;
