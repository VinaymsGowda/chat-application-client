import { Phone, Video } from "lucide-react";
import { useMedia } from "../../context/MediaProvider";
import { useSocket } from "../../context/SocketContext";
import { useToast } from "../../context/ToastContext";
import { getOtherUser } from "../../helper/utils";

const CallInitiationButtons = ({ selectedChat, currentUser }) => {
  const { callState, initiateAudioCall, initiateVideoCall } = useMedia();
  const { socket } = useSocket();
  const { showToast } = useToast();

  const handleAudioCall = async () => {
    if (callState !== "idle") {
      showToast({
        title: "Please end ongoing call to start a new call",
        type: "warning",
      });
      return;
    }

    try {
      const otherUser = getOtherUser(selectedChat, currentUser);
      const offer = await initiateAudioCall(otherUser);
      socket.emit("initiate-call", selectedChat, "audio", offer, currentUser);
    } catch (error) {
      console.error("Failed to initiate audio call:", error);
      showToast({
        title:
          "Failed to start audio call. Please check your microphone permissions.",
        type: "error",
      });
    }
  };

  const handleVideoCall = async () => {
    if (callState !== "idle") {
      showToast({
        title: "Please end ongoing call to start a new call",
        type: "warning",
      });
      return;
    }

    try {
      const otherUser = getOtherUser(selectedChat, currentUser);
      const offer = await initiateVideoCall(otherUser);
      socket.emit("initiate-call", selectedChat, "video", offer, currentUser);
    } catch (error) {
      console.error("Failed to initiate video call:", error);
      showToast({
        title:
          "Failed to start video call. Please check your camera and microphone permissions.",
        type: "error",
      });
    }
  };

  // Only show call buttons for one-to-one chats
  if (!selectedChat || selectedChat.chatType !== "one_to_one") {
    return null;
  }

  const isCallInProgress = callState !== "idle";

  return (
    <>
      <button
        className={`p-2 rounded-full transition ${
          !isCallInProgress
            ? "hover:bg-gray-100 text-gray-600"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
        onClick={handleAudioCall}
        disabled={isCallInProgress}
        title={!isCallInProgress ? "Start audio call" : "Call in progress"}
        aria-label="Start audio call"
      >
        <Phone size={18} />
      </button>
      <button
        className={`p-2 rounded-full transition ${
          !isCallInProgress
            ? "hover:bg-gray-100 text-gray-600"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
        onClick={handleVideoCall}
        disabled={isCallInProgress}
        title={!isCallInProgress ? "Start video call" : "Call in progress"}
        aria-label="Start video call"
      >
        <Video size={18} />
      </button>
    </>
  );
};

export default CallInitiationButtons;
