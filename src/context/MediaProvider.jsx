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
  const { showToast } = useToast();
  const [isRemoteVideoEnabled, setIsRemoteVideoEnabled] = useState(false);
  let localStream = useRef(null);
  let screenStream = useRef(null);
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
        let sender = peerConnection.current
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(videoTrack);
        } else {
          // If no video sender exists, add the track
          peerConnection.current.addTrack(videoTrack, displayStream);
        }
      }

      // Update local video element
      if (localVideo.current) localVideo.current.srcObject = displayStream;
      // Listen for stop event to revert
      displayStream.getVideoTracks()[0].onended = stopScreenShare;
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
      // Revert to camera stream
      if (peerConnection.current && localStream.current) {
        const sender = peerConnection.current
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(localStream.current.getVideoTracks()[0]);
        }
      }
      if (localVideo.current && localStream.current)
        localVideo.current.srcObject = localStream.current;
    }
  };

  let localVideo = useRef(null);
  let remoteVideo = useRef(null);
  let remoteStream = useRef(null);

  const { socket } = useSocket();

  useEffect(() => {
    if (callState === "idle") {
      setIncomingCallData(null);
      stopMediaDevices();
      stopScreenShare();
      peerConnection.current = null; // reset
    }
    console.log("Call state change", callState);
  }, [callState]);
  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-answered", handleCallAnswered);
    socket.on("found-ice-candidate", handleRemoteCandidate);
    socket.on("user-busy", handleUserBusy);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-answered", handleCallAnswered);
      socket.off("found-ice-candidate", handleRemoteCandidate);
      socket.off("user-busy", handleUserBusy);
    };
  }, [socket]);

  const handleUserBusy = () => {
    showToast({
      title: "The user is busy on another call,Call again later",
      type: "warning",
    });
    setCallState("idle");
  };

  const handleCallAnswered = async (data) => {
    setCallState("ongoing");
    console.log("Answer received", data);

    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(data.offer)
    );
  };

  const handleIncomingCall = (type, data) => {
    if (callState == "idle") {
      setPeerDetails(data.from);
      setIncomingCallData({ type, ...data }); // keep offer + from etc.
      setCallState("incoming");
    } else {
      console.log("user not idle");

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
      console.log("Candidate data", candidateData);

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
      console.log("Found candidate at caller", e);

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
      console.log("Track change ", e);
      const stream = e.streams[0];
      remoteStream.current = stream;
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = stream;
      }
      const hasVideo =
        stream.getVideoTracks().length > 0 &&
        stream.getVideoTracks().some((track) => track.enabled);
      setIsRemoteVideoEnabled(hasVideo);
    };
    localStream.current
      .getTracks()
      .forEach((track) =>
        peerConnection.current.addTrack(track, localStream.current)
      );

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    return offer;
  }

  async function createAnswer(offer) {
    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    peerConnection.current = new RTCPeerConnection(configuration);

    peerConnection.current.onicecandidate = (e) => {
      console.log("Found candidate at receiver", e);

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
      const updateRemoteVideoEnabled = () => {
        const hasEnabledVideo =
          videoTracks.length > 0 && videoTracks.some((track) => track.enabled);
        setIsRemoteVideoEnabled(hasEnabledVideo);
      };
      // Initial check
      updateRemoteVideoEnabled();
      // Listen for remote disabling/enabling their video
      videoTracks.forEach((track) => {
        track.onmute = updateRemoteVideoEnabled;
        track.onunmute = updateRemoteVideoEnabled;
        track.onended = updateRemoteVideoEnabled;
        track.onchange = updateRemoteVideoEnabled; // Some browsers support onchange
      });
    };

    localStream.current
      .getTracks()
      .forEach((track) =>
        peerConnection.current.addTrack(track, localStream.current)
      );

    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);
    return answer;
  }

  return (
    <MediaContext.Provider
      value={{
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
      }}
    >
      {children}
    </MediaContext.Provider>
  );
};

export const useMedia = () => useContext(MediaContext);
