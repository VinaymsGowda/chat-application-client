import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useSocket } from "./SocketContext";
import { useToast } from "./ToastContext";
import {
  HIGH_QUALITY_VIDEO_CONSTRAINTS,
  HIGH_QUALITY_AUDIO_CONSTRAINTS,
  DEFAULT_MEDIA_CONTROLS,
  ICE_SERVERS,
} from "../constants/mediaConstraints";
import {
  createPeerConnection,
  setupIceCandidateHandler,
  setupTrackHandler,
  triggerRenegotiation,
  replaceTrackInPeerConnection,
  addTrackToPeerConnection,
  cleanupPeerConnection,
} from "../utils/webrtcUtils";
import {
  stopAndRemoveTrack,
  getTrackFromStream,
  updateRemoteMediaControlsFromStream,
  cleanupStream,
  cleanupStreamRef,
  getMediaErrorMessage,
} from "../utils/mediaTrackUtils";

const MediaContext = createContext(null);

export const MediaProvider = ({ children }) => {
  const [error, setError] = useState(null);
  const [callState, setCallState] = useState("idle"); // "idle" | "incoming" | "ongoing" | "calling"
  const callStateRef = useRef(callState); // Ref to track current callState
  const [peerDetails, setPeerDetails] = useState(null);
  const peerDetailsRef = useRef(peerDetails); // Ref to track current peerDetails
  const [incomingCallData, setIncomingCallData] = useState(null);
  const peerConnection = useRef(null);

  // Keep refs in sync with state
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    peerDetailsRef.current = peerDetails;
  }, [peerDetails]);
  const toastContext = useToast();
  const showToast = toastContext?.showToast || (() => {});
  const [isRemoteVideoEnabled, setIsRemoteVideoEnabled] = useState(false);
  let localStream = useRef(null);
  let screenStream = useRef(null);

  // Enhanced state management for call types and media controls
  const [callType, setCallType] = useState(null); // 'audio' | 'video' | null
  const [localMediaControls, setLocalMediaControls] = useState({
    ...DEFAULT_MEDIA_CONTROLS,
    microphone: true, // Default to unmuted when starting a call
  });
  const [remoteMediaControls, setRemoteMediaControls] = useState(
    DEFAULT_MEDIA_CONTROLS
  );
  const [isCallUpgraded, setIsCallUpgraded] = useState(false);

  // Call timeout management
  const callTimeoutRef = useRef(null);

  // Start call timeout (15 seconds)
  const startCallTimeout = (peerDetails) => {
    // Clear any existing timeout
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
    }

    callTimeoutRef.current = setTimeout(() => {
      // Notify callee about timeout
      if (socket && peerDetails) {
        socket.emit("call-timeout", {
          to: peerDetails,
          from: socket.id,
        });
      }

      showToast({
        title: "User is not receiving your call",
        type: "warning",
      });
      endCall();
    }, 10000); // 15 seconds
  };

  // Clear call timeout
  const clearCallTimeout = () => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  };
  // Start screen sharing
  const startScreenShare = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      screenStream.current = displayStream;

      // Replace video track in peer connection if ongoing
      if (peerConnection.current) {
        const videoTrack = displayStream.getVideoTracks()[0];
        const senders = peerConnection.current.getSenders();

        // Find existing video sender or add new track
        const videoSender = senders.find((s) => s.track?.kind === "video");

        if (videoSender) {
          // Replace the video track with screen share track
          await replaceTrackInPeerConnection(
            peerConnection.current,
            "video",
            videoTrack,
            callState === "ongoing",
            socket,
            peerDetails
          );
        } else {
          // No video sender exists, add new video track for screen sharing
          addTrackToPeerConnection(
            peerConnection.current,
            videoTrack,
            displayStream,
            callState === "ongoing",
            socket,
            peerDetails
          );
        }
      }

      // Keep local video element showing camera stream (not screen share)
      // The screen share is sent to remote peer, but local preview should show camera
      if (localVideo.current && localStream.current) {
        localVideo.current.srcObject = localStream.current;
      }

      // Listen for stop event to revert
      displayStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
        // Update the screen share state when user stops sharing via browser UI
        setLocalMediaControls((prev) => ({
          ...prev,
          screenShare: false,
        }));
        // Notify remote peer
        if (socket && peerDetails) {
          socket.emit("media-control-change", {
            to: peerDetails,
            controlType: "screenShare",
            enabled: false,
          });
        }
      };

      return displayStream;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Stop screen sharing and revert to camera
  const stopScreenShare = async () => {
    if (screenStream.current) {
      cleanupStream(screenStream.current);
      screenStream.current = null;

      // Revert to camera stream if camera was enabled, otherwise remove video track
      if (peerConnection.current) {
        const sender = peerConnection.current
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");

        if (sender) {
          if (localMediaControls.camera && localStream.current) {
            // Revert to camera if camera is enabled
            const videoTrack = localStream.current.getVideoTracks()[0];
            if (videoTrack) {
              await replaceTrackInPeerConnection(
                peerConnection.current,
                "video",
                videoTrack,
                callState === "ongoing",
                socket,
                peerDetails
              );
            }
          } else {
            // Remove video track if camera is disabled
            await replaceTrackInPeerConnection(
              peerConnection.current,
              "video",
              null,
              callState === "ongoing",
              socket,
              peerDetails
            );
          }
        }
      }

      // Update local video element
      if (localVideo.current) {
        if (localMediaControls.camera && localStream.current) {
          localVideo.current.srcObject = localStream.current;
        } else {
          localVideo.current.srcObject = null;
        }
      }
    }
  };

  let localVideo = useRef(null);
  let remoteVideo = useRef(null);
  let remoteStream = useRef(null);

  const socketContext = useSocket();
  const socket = socketContext?.socket;

  useEffect(() => {
    if (callState === "idle") {
      // Clear any active call timeout when returning to idle
      clearCallTimeout();

      setIncomingCallData(null);
      stopMediaDevices();
      stopScreenShare();
      peerConnection.current = null; // reset

      // Reset enhanced state
      setCallType(null);
      setLocalMediaControls({
        ...DEFAULT_MEDIA_CONTROLS,
        microphone: true, // Reset to unmuted for next call
      });
      setRemoteMediaControls(DEFAULT_MEDIA_CONTROLS);
      setIsCallUpgraded(false);
    }
  }, [callState]);

  // Handle renegotiation offer (when remote peer upgrades to video)
  // Defined before useEffect to avoid closure issues
  const handleRenegotiationOffer = async (data) => {
    console.log("handleRenegotiationOffer called with data:", data);

    // Access current state values using refs to avoid stale closures
    const currentCallState = callStateRef.current;
    const currentPeerConnection = peerConnection.current;
    const currentPeerDetails = peerDetailsRef.current;

    console.log("Current callState (from ref):", currentCallState);
    console.log("peerConnection exists:", !!currentPeerConnection);
    console.log("peerDetails:", currentPeerDetails);

    // Allow renegotiation if peer connection exists
    // The peer connection being active is the source of truth, not callState
    if (!currentPeerConnection) {
      console.error("Cannot handle renegotiation: no active peer connection", {
        hasPeerConnection: false,
        callState: currentCallState,
      });
      return;
    }

    // Log warning if callState is unexpected, but proceed anyway
    // Peer connection existence is the real indicator of an active call
    if (currentCallState !== "ongoing" && currentCallState !== "calling") {
      console.warn(
        "Renegotiation received - call state is '" +
          currentCallState +
          "' but peer connection exists, proceeding with renegotiation",
        {
          callState: currentCallState,
          hasPeerConnection: true,
        }
      );
    } else {
      console.log(
        "Renegotiation received - call state is valid:",
        currentCallState
      );
    }

    try {
      const offer = data.offer;
      if (!offer || !offer.type || !offer.sdp) {
        console.error("Invalid renegotiation offer:", offer);
        return;
      }

      console.log("Received renegotiation offer, creating answer");
      // Set the remote description with the new offer
      await currentPeerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      // Create and send answer
      const answer = await currentPeerConnection.createAnswer();
      await currentPeerConnection.setLocalDescription(answer);

      // Send answer back to remote peer
      if (socket && currentPeerDetails) {
        const targetId = currentPeerDetails.id || currentPeerDetails;
        console.log("Sending renegotiation answer to:", targetId);
        socket.emit("renegotiation-answer", {
          to: targetId,
          answer: answer,
        });
      } else {
        console.error("Cannot send answer: socket or peerDetails missing", {
          socket: !!socket,
          peerDetails: currentPeerDetails,
        });
      }
    } catch (err) {
      console.error("Error handling renegotiation offer:", err);
      setError(err);
      showToast({
        title: "Error upgrading call. Please try again.",
        type: "error",
      });
    }
  };

  // Handle renegotiation answer (response to our renegotiation offer)
  // Defined before useEffect to avoid closure issues
  const handleRenegotiationAnswer = async (data) => {
    console.log("handleRenegotiationAnswer called with data:", data);

    // Access current state values using refs to avoid stale closures
    const currentCallState = callStateRef.current;
    const currentPeerConnection = peerConnection.current;

    console.log("Current callState (from ref):", currentCallState);
    console.log("peerConnection exists:", !!currentPeerConnection);

    if (!currentPeerConnection) {
      console.error(
        "Cannot handle renegotiation answer: no active peer connection",
        {
          hasPeerConnection: false,
          callState: currentCallState,
        }
      );
      return;
    }

    if (currentCallState !== "ongoing" && currentCallState !== "calling") {
      console.warn(
        "Renegotiation answer received but call state is not ongoing/calling, proceeding anyway",
        {
          callState: currentCallState,
        }
      );
    }

    try {
      const answer = data.answer;
      if (!answer || !answer.type || !answer.sdp) {
        console.error("Invalid renegotiation answer:", answer);
        return;
      }

      console.log("Received renegotiation answer, setting remote description");
      // Set the remote description with the answer
      await currentPeerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
      console.log("Renegotiation completed successfully!");
    } catch (err) {
      console.error("Error handling renegotiation answer:", err);
      setError(err);
      showToast({
        title: "Error completing call upgrade. Please try again.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-answered", handleCallAnswered);
    socket.on("found-ice-candidate", handleRemoteCandidate);
    socket.on("user-busy", handleUserBusy);
    socket.on("media-control-change", handleMediaControlChange);
    socket.on("call-ended", handleCallEnded);
    socket.on("participant-disconnected", handleParticipantDisconnected);
    socket.on("call-timeout", handleCallTimeout);
    socket.on("renegotiation-offer", handleRenegotiationOffer);
    socket.on("renegotiation-answer", handleRenegotiationAnswer);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-answered", handleCallAnswered);
      socket.off("found-ice-candidate", handleRemoteCandidate);
      socket.off("user-busy", handleUserBusy);
      socket.off("media-control-change", handleMediaControlChange);
      socket.off("call-ended", handleCallEnded);
      socket.off("participant-disconnected", handleParticipantDisconnected);
      socket.off("call-timeout", handleCallTimeout);
      socket.off("renegotiation-offer", handleRenegotiationOffer);
      socket.off("renegotiation-answer", handleRenegotiationAnswer);
    };
  }, [socket]);

  const handleUserBusy = () => {
    // Clear call timeout since call was rejected (user busy)
    clearCallTimeout();

    showToast({
      title: "The user is busy on another call,Call again later",
      type: "warning",
    });
    setCallState("idle");
  };

  const handleCallAnswered = async (data) => {
    setCallState("ongoing");

    // Clear call timeout since call was answered
    clearCallTimeout();

    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(data.offer)
    );
  };

  const handleMediaControlChange = (data) => {
    const { controlType, enabled } = data;

    setRemoteMediaControls((prev) => ({
      ...prev,
      [controlType]: enabled,
    }));

    // Update isRemoteVideoEnabled for backward compatibility
    if (controlType === "camera") {
      setIsRemoteVideoEnabled(enabled);
    }
  };

  const handleCallEnded = async (data) => {
    // Show notification that remote participant left
    showToast({
      title: "Call ended by remote participant",
      type: "info",
    });

    // Clean up local resources without notifying remote (they already left)
    try {
      // Clean up all media streams
      cleanupStreamRef(localStream);
      cleanupStreamRef(screenStream);
      cleanupStreamRef(remoteStream);

      // Close WebRTC peer connection
      cleanupPeerConnection(peerConnection.current);
      peerConnection.current = null;

      // Reset all state to idle
      setCallState("idle");
      setPeerDetails(null);
      setCallType(null);
      setLocalMediaControls({
        ...DEFAULT_MEDIA_CONTROLS,
        microphone: true,
      });
      setRemoteMediaControls(DEFAULT_MEDIA_CONTROLS);
      setIsCallUpgraded(false);
      setIsRemoteVideoEnabled(false);
      setIncomingCallData(null);

      // Clear video elements
      if (localVideo.current) {
        localVideo.current.srcObject = null;
      }
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = null;
      }
    } catch (err) {
      console.error("Error during call cleanup:", err);
      setError(err);

      // Force reset state even if cleanup fails
      setCallState("idle");
      setPeerDetails(null);
      setCallType(null);
    }
  };

  const handleIncomingCall = (type, data) => {
    if (callState == "idle") {
      setPeerDetails(data.from);
      setIncomingCallData({ type, ...data }); // keep offer + from etc.
      setCallState("incoming");

      // Set call type from incoming call data
      console.log("data.type:", type);
      if (type) {
        setCallType(type);
      }
    } else {
      socket.emit("user-busy-event", {
        to: data.from,
      });
    }
  };

  // helpers to let UI attach DOM elements when they mount
  const attachLocalStream = (el) => {
    if (!el) return;
    localVideo.current = el;
    if (localStream.current) el.srcObject = localStream.current;
  };

  const attachRemoteStream = (el) => {
    if (!el) return;
    remoteVideo.current = el;
    // Only set srcObject if remoteStream.current is a valid MediaStream
    if (remoteStream.current instanceof MediaStream) {
      el.srcObject = remoteStream.current;
    } else {
      el.srcObject = null;
    }
  };

  const handleRemoteCandidate = async (data) => {
    if (!peerConnection.current) {
      console.error("no peerconnection");
      return;
    }
    if (!data.candidate) {
      await peerConnection.current.addIceCandidate(null);
    } else {
      const { from, ...candidateData } = data;

      await peerConnection.current.addIceCandidate(
        new RTCIceCandidate(candidateData)
      );
    }
  };

  const openMediaDevices = async (constraints) => {
    if (localStream.current) return localStream.current;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);

      localStream.current = newStream;

      if (localVideo.current) localVideo.current.srcObject = newStream;

      return newStream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      setError(err);
      throw err;
    }
  };

  const stopMediaDevices = () => {
    cleanupStreamRef(localStream);
  };

  async function makeCall() {
    // Create peer connection
    peerConnection.current = createPeerConnection();

    // Setup ICE candidate handler
    setupIceCandidateHandler(peerConnection.current, socket, peerDetails);

    // Setup track handler
    setupTrackHandler(peerConnection.current, {
      onRemoteStream: (stream) => {
        remoteStream.current = stream;
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = stream;
        }
      },
      onRemoteMediaControlsUpdate: (controls) => {
        setRemoteMediaControls((prev) => ({ ...prev, ...controls }));
      },
      onRemoteVideoEnabled: (enabled) => {
        setIsRemoteVideoEnabled(enabled);
      },
    });

    // Add tracks to peer connection
    const audioTrack = getTrackFromStream(localStream.current, "audio");
    const videoTrack = getTrackFromStream(localStream.current, "video");

    if (audioTrack) {
      peerConnection.current.addTrack(audioTrack, localStream.current);
    }

    if (videoTrack) {
      peerConnection.current.addTrack(videoTrack, localStream.current);
    }

    // Create and set local offer
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    return offer;
  }

  async function createAnswer(offer) {
    // Validate offer parameter
    if (!offer) {
      console.error("createAnswer called with null/undefined offer");
      throw new Error("Invalid offer: offer is null or undefined");
    }

    if (typeof offer !== "object") {
      console.error("Offer is not an object:", typeof offer, offer);
      throw new Error(`Invalid offer: expected object, got ${typeof offer}`);
    }

    if (!offer.type || !offer.sdp) {
      console.error("Offer missing required properties:", {
        hasType: !!offer.type,
        hasSdp: !!offer.sdp,
        offer,
      });
      throw new Error("Invalid offer: missing required properties (type, sdp)");
    }

    // Create peer connection
    peerConnection.current = createPeerConnection();

    // Setup ICE candidate handler
    setupIceCandidateHandler(peerConnection.current, socket, peerDetails);

    // Setup track handler
    setupTrackHandler(peerConnection.current, {
      onRemoteStream: (stream) => {
        remoteStream.current = stream;
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = stream;
        }
      },
      onRemoteMediaControlsUpdate: (controls) => {
        setRemoteMediaControls((prev) => ({ ...prev, ...controls }));
      },
      onRemoteVideoEnabled: (enabled) => {
        setIsRemoteVideoEnabled(enabled);
      },
    });

    // Set initial local media controls based on call type

    const constraints =
      callType === "video"
        ? {
            audio: HIGH_QUALITY_AUDIO_CONSTRAINTS,
            video: HIGH_QUALITY_VIDEO_CONSTRAINTS,
          }
        : {
            audio: HIGH_QUALITY_AUDIO_CONSTRAINTS,
            video: false,
          };

    await openMediaDevices(constraints);

    setLocalMediaControls({
      camera: callType === "video",
      microphone: true,
      screenShare: false,
    });

    // Always add both audio and video senders for future replaceTrack operations
    const audioTrack = localStream.current.getAudioTracks()[0];
    const videoTrack = localStream.current.getVideoTracks()[0];

    // Add audio track (should always exist)
    if (audioTrack) {
      peerConnection.current.addTrack(audioTrack, localStream.current);
    }

    // Add video track only if it exists
    if (videoTrack) {
      peerConnection.current.addTrack(videoTrack, localStream.current);
    }

    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);
    return answer;
  }

  // Enhanced call initiation methods
  const initiateAudioCall = async (user) => {
    try {
      setCallType("audio");
      setPeerDetails(user);
      setCallState("calling");

      // Open audio-only media devices
      await openMediaDevices({
        audio: HIGH_QUALITY_AUDIO_CONSTRAINTS,
        video: false,
      });
      setLocalMediaControls((prev) => ({
        ...prev,
        camera: false,
        microphone: true,
        screenShare: false,
      }));

      const offer = await makeCall();

      // Start 15-second timeout for call answer
      startCallTimeout(user);

      return offer;
    } catch (err) {
      console.error("Error initiating audio call:", err);
      setError(err);
      setCallState("idle");
      throw err;
    }
  };

  const initiateVideoCall = async (user) => {
    try {
      setCallType("video");
      setPeerDetails(user);
      setCallState("calling");

      // Open video and audio media devices
      await openMediaDevices({
        audio: HIGH_QUALITY_AUDIO_CONSTRAINTS,
        video: HIGH_QUALITY_VIDEO_CONSTRAINTS,
      });
      setLocalMediaControls((prev) => ({
        ...prev,
        camera: true,
        microphone: true,
        screenShare: false,
      }));

      const offer = await makeCall();

      // Start 15-second timeout for call answer
      startCallTimeout(user);

      return offer;
    } catch (err) {
      console.error("Error initiating video call:", err);
      setError(err);
      setCallState("idle");
      throw err;
    }
  };

  // Helper function to disable camera
  const disableCamera = async (videoTrack) => {
    // Disable and stop the video track to turn off camera light
    stopAndRemoveTrack(localStream.current, videoTrack);

    // Replace video track in peer connection with null
    await replaceTrackInPeerConnection(
      peerConnection.current,
      "video",
      null,
      callState === "ongoing",
      socket,
      peerDetails
    );

    // Update local video element
    if (localVideo.current) {
      localVideo.current.srcObject = null;
    }

    // Get a new audio-only stream to ensure camera hardware is released
    try {
      const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
        audio: HIGH_QUALITY_AUDIO_CONSTRAINTS,
        video: false,
      });

      // Stop old audio track if it exists
      const oldAudioTrack = getTrackFromStream(localStream.current, "audio");
      if (oldAudioTrack) {
        oldAudioTrack.stop();
      }

      // Update local stream with new audio-only stream
      localStream.current = audioOnlyStream;

      // Update peer connection audio track
      if (peerConnection.current) {
        const newAudioTrack = getTrackFromStream(audioOnlyStream, "audio");
        if (newAudioTrack) {
          await replaceTrackInPeerConnection(
            peerConnection.current,
            "audio",
            newAudioTrack,
            false, // Don't renegotiate again
            null,
            null
          );
        }
      }
    } catch (err) {
      console.error(
        "Error getting audio-only stream after disabling camera:",
        err
      );
      // Continue anyway - audio should still work
    }
  };

  // Helper function to enable camera (upgrade from audio to video)
  const enableCamera = async () => {
    // Use high-quality video constraints when upgrading to video
    const videoConstraints = {
      audio: HIGH_QUALITY_AUDIO_CONSTRAINTS,
      video: HIGH_QUALITY_VIDEO_CONSTRAINTS,
    };
    const newStream = await navigator.mediaDevices.getUserMedia(
      videoConstraints
    );

    // Get the new tracks
    const newVideoTrack = getTrackFromStream(newStream, "video");
    const newAudioTrack = getTrackFromStream(newStream, "audio");

    // Stop old tracks
    if (localStream.current) {
      cleanupStream(localStream.current);
    }

    // Update local stream
    localStream.current = newStream;

    // Update local video element
    if (localVideo.current) {
      localVideo.current.srcObject = newStream;
    }

    // Update peer connection tracks if call is ongoing
    if (peerConnection.current) {
      const senders = peerConnection.current.getSenders();

      // Replace audio track
      if (newAudioTrack) {
        await replaceTrackInPeerConnection(
          peerConnection.current,
          "audio",
          newAudioTrack,
          false, // Don't renegotiate for audio replacement
          null,
          null
        );
      }

      // Find existing video sender or add new track
      const videoSender = senders.find(
        (sender) => sender.track?.kind === "video"
      );

      if (videoSender) {
        // Replace existing video track
        await replaceTrackInPeerConnection(
          peerConnection.current,
          "video",
          newVideoTrack,
          callState === "ongoing",
          socket,
          peerDetails
        );
      } else {
        // No video sender exists (audio call), add new video track
        addTrackToPeerConnection(
          peerConnection.current,
          newVideoTrack,
          newStream,
          callState === "ongoing",
          socket,
          peerDetails
        );
      }
    }

    // Mark as upgraded if it was an audio call
    if (callType === "audio") {
      setCallType("video");
      setIsCallUpgraded(true);
      showToast({
        title: "Call upgraded to video",
        type: "success",
      });
    }
  };

  // Helper function to disable microphone
  const disableMicrophone = async (audioTrack) => {
    // Disable and stop the audio track to stop transmission
    stopAndRemoveTrack(localStream.current, audioTrack);

    // Replace audio track in peer connection with null
    await replaceTrackInPeerConnection(
      peerConnection.current,
      "audio",
      null,
      callState === "ongoing",
      socket,
      peerDetails
    );
  };

  // Helper function to enable microphone
  const enableMicrophone = async () => {
    // Get a new audio stream
    const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
      audio: HIGH_QUALITY_AUDIO_CONSTRAINTS,
      video: false,
    });

    const newAudioTrack = getTrackFromStream(audioOnlyStream, "audio");

    // Add to local stream
    if (localStream.current) {
      localStream.current.addTrack(newAudioTrack);
    } else {
      localStream.current = audioOnlyStream;
    }

    // Add to peer connection
    if (peerConnection.current) {
      const senders = peerConnection.current.getSenders();
      const audioSender = senders.find(
        (sender) => sender.track?.kind === "audio"
      );

      if (audioSender) {
        await replaceTrackInPeerConnection(
          peerConnection.current,
          "audio",
          newAudioTrack,
          callState === "ongoing",
          socket,
          peerDetails
        );
      } else {
        addTrackToPeerConnection(
          peerConnection.current,
          newAudioTrack,
          localStream.current,
          callState === "ongoing",
          socket,
          peerDetails
        );
      }
    }
  };

  // Enhanced media control methods
  const toggleCamera = async () => {
    try {
      if (!localStream.current) return;

      const newCameraState = !localMediaControls.camera;
      const videoTrack = getTrackFromStream(localStream.current, "video");

      if (videoTrack) {
        if (newCameraState) {
          // Re-enable existing video track
          videoTrack.enabled = true;
        } else {
          // Disable camera
          await disableCamera(videoTrack);
        }
      } else if (newCameraState) {
        // Need to add video track - upgrade call from audio to video
        await enableCamera();
      }

      setLocalMediaControls((prev) => ({
        ...prev,
        camera: newCameraState,
      }));

      // Notify remote peer of camera state change
      if (socket && peerDetails) {
        socket.emit("media-control-change", {
          to: peerDetails,
          controlType: "camera",
          enabled: newCameraState,
        });
      }
    } catch (err) {
      console.error("Error toggling camera:", err);
      setError(err);

      // Provide user-friendly error handling
      const errorMessage = getMediaErrorMessage(err, "camera");
      showToast(errorMessage);
    }
  };

  const toggleMicrophone = async () => {
    try {
      if (!localStream.current) return;

      const audioTrack = getTrackFromStream(localStream.current, "audio");
      const newMicrophoneState = !localMediaControls.microphone;

      if (audioTrack) {
        if (newMicrophoneState) {
          // Re-enable existing audio track
          audioTrack.enabled = true;
        } else {
          // Disable microphone
          await disableMicrophone(audioTrack);
        }
      } else if (newMicrophoneState) {
        // No audio track exists, get a new one
        await enableMicrophone();
      }

      setLocalMediaControls((prev) => ({
        ...prev,
        microphone: newMicrophoneState,
      }));

      // Notify remote peer of microphone state change
      if (socket && peerDetails) {
        socket.emit("media-control-change", {
          to: peerDetails,
          controlType: "microphone",
          enabled: newMicrophoneState,
        });
      }
    } catch (err) {
      console.error("Error toggling microphone:", err);
      setError(err);
      const errorMessage = getMediaErrorMessage(err, "microphone");
      showToast(errorMessage);
    }
  };

  const toggleScreenShare = async () => {
    try {
      const newScreenShareState = !localMediaControls.screenShare;

      if (newScreenShareState) {
        await startScreenShare();
      } else {
        await stopScreenShare();
      }

      setLocalMediaControls((prev) => ({
        ...prev,
        screenShare: newScreenShareState,
      }));

      // Notify remote peer of screen share state change
      if (socket && peerDetails) {
        socket.emit("media-control-change", {
          to: peerDetails,
          controlType: "screenShare",
          enabled: newScreenShareState,
        });
      }
    } catch (err) {
      console.error("Error toggling screen share:", err);
      setError(err);
    }
  };

  const upgradeToVideo = async () => {
    if (callType !== "audio") return;

    try {
      await toggleCamera();
      setIsCallUpgraded(true);
    } catch (err) {
      console.error("Error upgrading to video:", err);
      setError(err);
    }
  };

  // Enhanced call termination method
  const endCall = async () => {
    try {
      // Clear any active call timeout
      clearCallTimeout();

      // Notify remote participant before terminating
      if (socket && peerDetails) {
        socket.emit("call-ended", {
          to: peerDetails.id || peerDetails,
          from: socket.id,
        });
      }

      // Clean up all media streams
      cleanupStreamRef(localStream);
      cleanupStreamRef(screenStream);
      cleanupStreamRef(remoteStream);

      // Close WebRTC peer connection
      cleanupPeerConnection(peerConnection.current);
      peerConnection.current = null;

      // Reset all state to idle
      setCallState("idle");
      setPeerDetails(null);
      setCallType(null);
      setLocalMediaControls({
        ...DEFAULT_MEDIA_CONTROLS,
        microphone: true,
      });
      setRemoteMediaControls(DEFAULT_MEDIA_CONTROLS);
      setIsCallUpgraded(false);
      setIsRemoteVideoEnabled(false);
      setIncomingCallData(null);

      // Clear video elements
      if (localVideo.current) {
        localVideo.current.srcObject = null;
      }
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = null;
      }
    } catch (err) {
      console.error("Error ending call:", err);
      setError(err);

      // Force reset state even if cleanup fails
      setCallState("idle");
      setPeerDetails(null);
      setCallType(null);
    }
  };

  const handleParticipantDisconnected = async (data) => {
    // Only handle if we're currently in a call and the disconnected user is our peer
    if (callState === "ongoing" && peerDetails && data.userId) {
      // Show notification that remote participant disconnected
      showToast({
        title: "Call ended - participant disconnected",
        type: "warning",
      });

      // Clean up call without notifying the disconnected user
      await handleCallEnded(data);
    }
  };

  const handleCallTimeout = async (data) => {
    setCallState("idle");
  };

  return (
    <MediaContext.Provider
      value={{
        // Existing values
        openMediaDevices,
        error,
        callState,
        setCallState,
        peerDetails,
        setPeerDetails,
        localStream,
        screenStream,
        makeCall,
        createAnswer,
        localVideo,
        remoteVideo,
        remoteStream,
        attachLocalStream,
        attachRemoteStream,
        incomingCallData,
        setIncomingCallData,
        startScreenShare,
        stopScreenShare,
        isRemoteVideoEnabled,

        // Enhanced state management
        callType,
        setCallType,
        localMediaControls,
        setLocalMediaControls,
        remoteMediaControls,
        setRemoteMediaControls,
        isCallUpgraded,
        setIsCallUpgraded,

        // Enhanced methods
        initiateAudioCall,
        initiateVideoCall,
        toggleCamera,
        toggleMicrophone,
        toggleScreenShare,
        upgradeToVideo,
        endCall,
      }}
    >
      {children}
    </MediaContext.Provider>
  );
};

export const useMedia = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error("useMedia must be used within a MediaProvider");
  }
  return context;
};
