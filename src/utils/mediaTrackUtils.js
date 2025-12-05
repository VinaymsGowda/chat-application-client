/**
 * Stops and removes a track from a stream
 */
export const stopAndRemoveTrack = (stream, track) => {
  if (!stream || !track) return;

  track.enabled = false;
  track.stop();
  stream.removeTrack(track);
};

/**
 * Gets a track of a specific kind from a stream
 */
export const getTrackFromStream = (stream, kind) => {
  if (!stream) return null;

  if (kind === "video") {
    return stream.getVideoTracks()[0] || null;
  } else if (kind === "audio") {
    return stream.getAudioTracks()[0] || null;
  }
  return null;
};

/**
 * Updates remote media controls based on stream tracks
 */
export const updateRemoteMediaControlsFromStream = (stream) => {
  if (!stream) {
    return { camera: false, microphone: false };
  }

  const videoTracks = stream.getVideoTracks();
  const audioTracks = stream.getAudioTracks();

  const hasEnabledVideo =
    videoTracks.length > 0 && videoTracks.some((track) => track.enabled);
  const hasEnabledAudio =
    audioTracks.length > 0 && audioTracks.some((track) => track.enabled);

  return {
    camera: hasEnabledVideo,
    microphone: hasEnabledAudio,
  };
};

/**
 * Cleans up a media stream by stopping all tracks
 */
export const cleanupStream = (stream) => {
  if (!stream) return;

  try {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  } catch (err) {
    console.error("Error cleaning up stream:", err);
  }
};

/**
 * Stops all tracks in a stream and sets the ref to null
 */
export const cleanupStreamRef = (streamRef) => {
  if (streamRef?.current) {
    cleanupStream(streamRef.current);
    streamRef.current = null;
  }
};

/**
 * Gets user-friendly error message for media device errors
 */
export const getMediaErrorMessage = (error, deviceType = "device") => {
  if (error.name === "NotAllowedError") {
    return {
      title: `${
        deviceType === "camera" ? "Camera" : "Microphone"
      } access denied. Please allow permissions.`,
      type: "error",
    };
  } else if (
    error.name === "NotFoundError" ||
    error.message?.includes("No camera device")
  ) {
    return {
      title: `No ${deviceType} device found. Please connect a ${deviceType} and try again.`,
      type: "error",
    };
  } else if (error.name === "NotReadableError") {
    return {
      title: `${
        deviceType === "camera" ? "Camera" : "Microphone"
      } is already in use by another application.`,
      type: "error",
    };
  } else {
    return {
      title: `Failed to access ${deviceType}. Please try again.`,
      type: "error",
    };
  }
};
