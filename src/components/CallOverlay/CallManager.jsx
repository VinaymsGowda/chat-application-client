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
  } = useMedia();
  const { socket } = useSocket();
  const { incomingCallData, setIncomingCallData } = useMedia();
  const currentUser = useSelector(selectUser);

  const handleAcceptCall = async (callData) => {
    if (!callData) return;

    if (callData.type === "audio") {
      const stream = await openMediaDevices({ audio: true });
      if (stream.active) {
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
      if (stream.active) {
        const answer = await createAnswer(callData.offer);
        socket.emit("send-answer", {
          to: callData.from.id,
          offer: answer,
          callee: currentUser,
        });
        setCallState("ongoing");
      }
    }
  };

  return (
    <>
      {callState === "incoming" && (
        <IncomingCallOverlay
          callerName={peerDetails?.name}
          onAccept={() => handleAcceptCall(incomingCallData)}
          onReject={() => setCallState("idle")}
        />
      )}

      {callState === "ongoing" && (
        <OngoingCallOverlay
          calleeName={peerDetails?.name}
          onEndCall={() => setCallState("idle")}
        />
      )}

      {callState === "calling" && (
        <CallingOverlay
          calleeName={peerDetails?.name}
          onCancel={() => setCallState("idle")}
        />
      )}
    </>
  );
};

export default CallManager;
