import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useSocket } from "./SocketContext";
import { useToast } from "./ToastContext";

const MediaContext = createContext(null);

export const MediaProvider = ({ children }) => {
  const [error, setError] = useState(null);
  const [callState, setCallState] = useState("idle"); // "idle" | "incoming" | "ongoing" | "calling"
  const [peerDetails, setPeerDetails] = useState(null);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const peerConnection = useRef(null);
  const toastContext = useToast();
  const showToast = toastContext?.showToast || (() => {});
  const [isRemoteVideoEnabled, setIsRemoteVideoEnabled] = useState(false);
  let localStream = useRef(null);
  let screenStream = useRef(null);

  // Enhanced state management for call types and media controls
  const [callType, setCallType] = useState(null); // 'audio' | 'video' | null
  const [localMediaControls, setLocalMediaControls] = useState({
    camera: false,
    microphone: false, // Default to unmuted when starting a call
    screenShare: false,
  });
  const [remoteMediaControls, setRemoteMediaControls] = useState({
    camera: false,
    microphone: false,
    screenShare: false,
  });
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
          await videoSender.replaceTrack(videoTrack);
        } else {
          // No video sender exists, add new video track for screen sharing
          peerConnection.current.addTrack(videoTrack, displayStream);
        }
      }

      // Update local video element
      if (localVideo.current) localVideo.current.srcObject = displayStream;

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
      screenStream.current.getTracks().forEach((track) => track.stop());
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
              await sender.replaceTrack(videoTrack);
            }
          } else {
            // Remove video track if camera is disabled
            await sender.replaceTrack(null);
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
        camera: false,
        microphone: false, // Reset to unmuted for next call
        screenShare: false,
      });
      setRemoteMediaControls({
        camera: false,
        microphone: false,
        screenShare: false,
      });
      setIsCallUpgraded(false);
    }
  }, [callState]);
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

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-answered", handleCallAnswered);
      socket.off("found-ice-candidate", handleRemoteCandidate);
      socket.off("user-busy", handleUserBusy);
      socket.off("media-control-change", handleMediaControlChange);
      socket.off("call-ended", handleCallEnded);
      socket.off("participant-disconnected", handleParticipantDisconnected);
      socket.off("call-timeout", handleCallTimeout);
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
      // Clean up all media tracks
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => {
          track.stop();
        });
        localStream.current = null;
      }

      // Clean up screen sharing stream
      if (screenStream.current) {
        screenStream.current.getTracks().forEach((track) => {
          track.stop();
        });
        screenStream.current = null;
      }

      // Clean up remote stream
      if (remoteStream.current) {
        remoteStream.current.getTracks().forEach((track) => {
          track.stop();
        });
        remoteStream.current = null;
      }

      // Close WebRTC peer connection
      if (peerConnection.current) {
        // Close all senders
        const senders = peerConnection.current.getSenders();
        senders.forEach((sender) => {
          if (sender.track) {
            sender.track.stop();
          }
        });

        // Close all receivers
        const receivers = peerConnection.current.getReceivers();
        receivers.forEach((receiver) => {
          if (receiver.track) {
            receiver.track.stop();
          }
        });

        // Close the peer connection
        peerConnection.current.close();
        peerConnection.current = null;
      }

      // Reset all state to idle
      setCallState("idle");
      setPeerDetails(null);
      setCallType(null);
      setLocalMediaControls({
        camera: false,
        microphone: false,
        screenShare: false,
      });
      setRemoteMediaControls({
        camera: false,
        microphone: false,
        screenShare: false,
      });
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
      if (data.callType) {
        setCallType(data.callType);
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
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
  };

  async function makeCall() {
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    peerConnection.current = new RTCPeerConnection(configuration);

    // Listen for local ICE candidates on the local RTCPeerConnection

    peerConnection.current.onicecandidate = (e) => {
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

    peerConnection.current.ontrack = (e) => {
      const stream = e.streams[0];
      remoteStream.current = stream;
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = stream;
      }

      // Check if remote has any enabled video and audio tracks
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      const updateRemoteMediaControls = () => {
        const hasEnabledVideo =
          videoTracks.length > 0 && videoTracks.some((track) => track.enabled);
        const hasEnabledAudio =
          audioTracks.length > 0 && audioTracks.some((track) => track.enabled);

        setRemoteMediaControls((prev) => ({
          ...prev,
          camera: hasEnabledVideo,
          microphone: hasEnabledAudio,
        }));

        // Backward compatibility
        setIsRemoteVideoEnabled(hasEnabledVideo);
      };

      // Initial check
      updateRemoteMediaControls();

      // Listen for remote media track changes
      [...videoTracks, ...audioTracks].forEach((track) => {
        track.onmute = updateRemoteMediaControls;
        track.onunmute = updateRemoteMediaControls;
        track.onended = updateRemoteMediaControls;
        track.onchange = updateRemoteMediaControls;
      });
    };

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

    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    peerConnection.current = new RTCPeerConnection(configuration);

    peerConnection.current.onicecandidate = (e) => {
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

    peerConnection.current.ontrack = (e) => {
      const stream = e.streams[0];
      remoteStream.current = stream;
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = stream;
      }
      // Check if remote has any enabled video track
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      const updateRemoteMediaControls = () => {
        const hasEnabledVideo =
          videoTracks.length > 0 && videoTracks.some((track) => track.enabled);
        const hasEnabledAudio =
          audioTracks.length > 0 && audioTracks.some((track) => track.enabled);

        setRemoteMediaControls((prev) => ({
          ...prev,
          camera: hasEnabledVideo,
          microphone: hasEnabledAudio,
        }));

        // Backward compatibility
        setIsRemoteVideoEnabled(hasEnabledVideo);
      };

      // Initial check
      updateRemoteMediaControls();

      // Listen for remote media track changes
      [...videoTracks, ...audioTracks].forEach((track) => {
        track.onmute = updateRemoteMediaControls;
        track.onunmute = updateRemoteMediaControls;
        track.onended = updateRemoteMediaControls;
        track.onchange = updateRemoteMediaControls;
      });
    };

    // Set initial local media controls based on call type
    const constraints =
      callType === "video"
        ? { audio: true, video: true }
        : { audio: true, video: false };

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
      await openMediaDevices({ audio: true, video: false });
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
      await openMediaDevices({ audio: true, video: true });
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

  // Enhanced media control methods
  const toggleCamera = async () => {
    try {
      if (!localStream.current) return;

      const videoTrack = localStream.current.getVideoTracks()[0];
      const newCameraState = !localMediaControls.camera;

      if (videoTrack) {
        // Simply enable/disable existing video track
        videoTrack.enabled = newCameraState;
      } else if (newCameraState) {
        // Need to add video track - upgrade call from audio to video

        // Check if camera is available before attempting to access
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(
          (device) => device.kind === "videoinput"
        );

        if (!hasCamera) {
          throw new Error("No camera device found");
        }

        const videoConstraints = { video: true, audio: true };
        const newStream = await navigator.mediaDevices.getUserMedia(
          videoConstraints
        );

        // Get the new video track
        const newVideoTrack = newStream.getVideoTracks()[0];
        const newAudioTrack = newStream.getAudioTracks()[0];

        // Stop old tracks
        if (localStream.current) {
          localStream.current.getTracks().forEach((track) => track.stop());
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
          const audioSender = senders.find(
            (sender) => sender.track && sender.track.kind === "audio"
          );

          if (audioSender) {
            await audioSender.replaceTrack(newAudioTrack);
          }

          // Find existing video sender or add new track
          const videoSender = senders.find(
            (sender) => sender.track?.kind === "video"
          );

          if (videoSender) {
            // Replace existing video track
            await videoSender.replaceTrack(newVideoTrack);
          } else {
            // No video sender exists (audio call), add new video track
            peerConnection.current.addTrack(newVideoTrack, newStream);
          }
        }

        // Mark as upgraded if it was an audio call
        if (callType === "audio") {
          setCallType("video");
          setIsCallUpgraded(true);

          // Show success message for call upgrade
          showToast({
            title: "Call upgraded to video",
            type: "success",
          });
        }
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
      if (err.name === "NotAllowedError") {
        showToast({
          title: "Camera access denied. Please allow camera permissions.",
          type: "error",
        });
      } else if (
        err.name === "NotFoundError" ||
        err.message.includes("No camera device")
      ) {
        showToast({
          title:
            "No camera device found. Please connect a camera and try again.",
          type: "error",
        });
      } else if (err.name === "NotReadableError") {
        showToast({
          title: "Camera is already in use by another application.",
          type: "error",
        });
      } else {
        showToast({
          title: "Failed to toggle camera. Please try again.",
          type: "error",
        });
      }
    }
  };

  const toggleMicrophone = async () => {
    try {
      if (!localStream.current) return;

      const audioTrack = localStream.current.getAudioTracks()[0];
      const newMicrophoneState = !localMediaControls.microphone;

      if (audioTrack) {
        audioTrack.enabled = newMicrophoneState;
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

      // Clean up all media tracks
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => {
          track.stop();
        });
        localStream.current = null;
      }

      // Clean up screen sharing stream
      if (screenStream.current) {
        screenStream.current.getTracks().forEach((track) => {
          track.stop();
        });
        screenStream.current = null;
      }

      // Clean up remote stream
      if (remoteStream.current) {
        remoteStream.current.getTracks().forEach((track) => {
          track.stop();
        });
        remoteStream.current = null;
      }

      // Close WebRTC peer connection
      if (peerConnection.current) {
        // Close all senders
        const senders = peerConnection.current.getSenders();
        senders.forEach((sender) => {
          if (sender.track) {
            sender.track.stop();
          }
        });

        // Close all receivers
        const receivers = peerConnection.current.getReceivers();
        receivers.forEach((receiver) => {
          if (receiver.track) {
            receiver.track.stop();
          }
        });

        // Close the peer connection
        peerConnection.current.close();
        peerConnection.current = null;
      }

      // Reset all state to idle
      setCallState("idle");
      setPeerDetails(null);
      setCallType(null);
      setLocalMediaControls({
        camera: false,
        microphone: false,
        screenShare: false,
      });
      setRemoteMediaControls({
        camera: false,
        microphone: false,
        screenShare: false,
      });
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
