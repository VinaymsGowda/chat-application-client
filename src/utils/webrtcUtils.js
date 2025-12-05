import { ICE_SERVERS } from "../constants/mediaConstraints";

/**
 * Creates a new RTCPeerConnection with standard configuration
 */
export const createPeerConnection = (
  configuration = { iceServers: ICE_SERVERS }
) => {
  return new RTCPeerConnection(configuration);
};

/**
 * Sets up ICE candidate handler for peer connection
 */
export const setupIceCandidateHandler = (
  peerConnection,
  socket,
  peerDetails
) => {
  peerConnection.onicecandidate = (e) => {
    const message = {
      type: "candidate",
      candidate: null,
      to: peerDetails,
    };
    if (e.candidate) {
      message.candidate = e.candidate.candidate;
      message.sdpMid = e.candidate.sdpMid;
      message.sdpMLineIndex = e.candidate.sdpMLineIndex;
    }
    socket.emit("ice-candidate", message);
  };
};

/**
 * Sets up track handler for peer connection
 */
export const setupTrackHandler = (peerConnection, callbacks) => {
  const { onRemoteStream, onRemoteMediaControlsUpdate, onRemoteVideoEnabled } =
    callbacks;

  peerConnection.ontrack = (e) => {
    const stream = e.streams[0];

    if (onRemoteStream) {
      onRemoteStream(stream);
    }

    // Check if remote has any enabled video and audio tracks
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    const hasEnabledVideo =
      videoTracks.length > 0 && videoTracks.some((track) => track.enabled);
    const hasEnabledAudio =
      audioTracks.length > 0 && audioTracks.some((track) => track.enabled);

    if (onRemoteMediaControlsUpdate) {
      onRemoteMediaControlsUpdate({
        camera: hasEnabledVideo,
        microphone: hasEnabledAudio,
      });
    }

    if (onRemoteVideoEnabled) {
      onRemoteVideoEnabled(hasEnabledVideo);
    }
  };
};

/**
 * Triggers WebRTC renegotiation by creating and sending a new offer
 */
export const triggerRenegotiation = async (
  peerConnection,
  socket,
  peerDetails,
  reason = "media change"
) => {
  if (!peerConnection || !socket || !peerDetails) {
    console.warn("Cannot trigger renegotiation: missing required parameters");
    return;
  }

  try {
    console.log(`Triggering renegotiation: ${reason}`);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const targetId = peerDetails.id || peerDetails;
    socket.emit("renegotiation-offer", {
      to: targetId,
      offer: offer,
    });
  } catch (error) {
    console.error(`Error during renegotiation (${reason}):`, error);
    throw error;
  }
};

/**
 * Replaces a track in the peer connection
 */
export const replaceTrackInPeerConnection = async (
  peerConnection,
  trackKind,
  newTrack,
  shouldRenegotiate = false,
  socket = null,
  peerDetails = null
) => {
  if (!peerConnection) {
    throw new Error("Peer connection is required");
  }

  const senders = peerConnection.getSenders();
  const sender = senders.find((s) => s.track?.kind === trackKind);

  if (sender) {
    await sender.replaceTrack(newTrack);

    if (shouldRenegotiate && socket && peerDetails) {
      await triggerRenegotiation(
        peerConnection,
        socket,
        peerDetails,
        `${trackKind} track replaced`
      );
    }
    return true;
  }

  return false;
};

/**
 * Adds a track to the peer connection
 */
export const addTrackToPeerConnection = (
  peerConnection,
  track,
  stream,
  shouldRenegotiate = false,
  socket = null,
  peerDetails = null
) => {
  if (!peerConnection || !track) {
    return false;
  }

  peerConnection.addTrack(track, stream);

  if (shouldRenegotiate && socket && peerDetails) {
    triggerRenegotiation(
      peerConnection,
      socket,
      peerDetails,
      `new ${track.kind} track added`
    ).catch((err) => {
      console.error("Error triggering renegotiation after adding track:", err);
    });
  }

  return true;
};

/**
 * Cleans up a peer connection properly
 */
export const cleanupPeerConnection = (peerConnection) => {
  if (!peerConnection) return;

  try {
    // Close all senders
    const senders = peerConnection.getSenders();
    senders.forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });

    // Close all receivers
    const receivers = peerConnection.getReceivers();
    receivers.forEach((receiver) => {
      if (receiver.track) {
        receiver.track.stop();
      }
    });

    // Close the peer connection
    peerConnection.close();
  } catch (err) {
    console.error("Error cleaning up peer connection:", err);
  }
};
