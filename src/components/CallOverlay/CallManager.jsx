import IncomingCallOverlay from "./IncomingCallOverlay";
import OngoingCallOverlay from "./OngoingCallOverlay";
import CallingOverlay from "./CallingOverlay";
import { useMedia } from "../../context/MediaProvider";

import { useSocket } from "../../context/SocketContext";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/features/Auth/User";

const CallManager = () => {
  const {
    callState,
    setCallState,
    openMediaDevices,
    createAnswer,
    peerDetails,
    endCall,
  } = useMedia();
  const { socket } = useSocket();
  const { incomingCallData, setIncomingCallData } = useMedia();
  const currentUser = useSelector(selectUser);

  const handleAcceptCall = async (callData) => {
    if (!callData) {
      console.error("No call data provided");
      return;
    }

    if (!callData.offer) {
      console.error("No offer in call data:", callData);
      setCallState("idle");
      return;
    }

    try {
      if (callData.type === "audio") {
        const stream = await openMediaDevices({ audio: true });
        if (stream && stream.active) {
          const answer = await createAnswer(callData.offer);
          socket.emit("send-answer", {
            to: callData.from.id,
            offer: answer,
            callee: currentUser,
          });
          setCallState("ongoing");
        }
      }

      if (callData.type === "video") {
        const stream = await openMediaDevices({
          video: { width: 375, height: 350 },
          audio: true,
        });
        if (stream && stream.active) {
          const answer = await createAnswer(callData.offer);
          socket.emit("send-answer", {
            to: callData.from.id,
            offer: answer,
            callee: currentUser,
          });
          setCallState("ongoing");
        }
      }
    } catch (error) {
      console.error("Error accepting call:", error);
      setCallState("idle");
      // You might want to show a toast notification h
    }
  };
  return (
    <>
      {callState === "incoming" && (
        <IncomingCallOverlay
          callerName={peerDetails?.name}
          onAccept={() => handleAcceptCall(incomingCallData)}
          onReject={endCall}
        />
      )}

      {callState === "ongoing" && (
        <OngoingCallOverlay
          calleeName={peerDetails?.name}
          onEndCall={endCall}
        />
      )}

      {callState === "calling" && (
        <CallingOverlay calleeName={peerDetails?.name} onCancel={endCall} />
      )}
    </>
  );
};

export default CallManager;
