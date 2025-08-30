import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useMedia } from "../../context/MediaProvider";
import {
  Grid3X3,
  Mic,
  Minimize2,
  MoreHorizontal,
  Presentation,
  ScreenShare,
  ScreenShareIcon,
  Video,
} from "lucide-react";
import { cloudFrontUrl } from "../../helper/utils";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/features/Auth/User";
import defaultProfile from "../../assets/default-profile.png";

const OngoingCallOverlay = ({ calleeName, onEndCall }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  return ReactDOM.createPortal(
    <div
      className={`fixed ${
        isMinimized
          ? "bottom-5 right-5 w-fit h-28 z-50 px-3"
          : "inset-0 w-full h-full z-50 px-2 space-y-4"
      } bg-gray-900 text-white shadow-xl rounded-xl flex flex-col`}
      style={{ pointerEvents: "auto" }}
    >
      {/* Header with minimize/maximize button */}
      <div className="flex justify-between items-center pt-2 rounded-t-xl">
        <span>{isMinimized ? "Call" : `Ongoing Call with ${calleeName}`}</span>
      </div>

      {isMinimized && (
        <ControlBar
          handleEndCall={onEndCall}
          isMinimized={isMinimized}
          setIsMinimized={setIsMinimized}
          videoEnabled={videoEnabled}
          setVideoEnabled={setVideoEnabled}
          micEnabled={micEnabled}
          setMicEnabled={setMicEnabled}
          screenSharing={screenSharing}
          setScreenSharing={setScreenSharing}
        />
      )}

      {!isMinimized && (
        <MainContent
          isMinimized={isMinimized}
          setIsMinimized={setIsMinimized}
          handleEndCall={onEndCall}
          videoEnabled={videoEnabled}
          setVideoEnabled={setVideoEnabled}
          micEnabled={micEnabled}
          setMicEnabled={setMicEnabled}
          screenSharing={screenSharing}
          setScreenSharing={setScreenSharing}
        />
      )}
    </div>,
    document.body
  );
};

function ControlBar({
  handleEndCall,
  isMinimized,
  setIsMinimized,
  videoEnabled,
  setVideoEnabled,
  micEnabled,
  setMicEnabled,
  screenSharing,
  setScreenSharing,
}) {
  const { localStream, startScreenShare, stopScreenShare } = useMedia();

  // Toggle video
  const handleToggleVideo = () => {
    if (localStream.current) {
      localStream.current.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  // Toggle mic
  const handleToggleMic = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach((track) => {
        track.enabled = !micEnabled;
      });
      setMicEnabled(!micEnabled);
    }
  };

  // Toggle screen share
  const handleToggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        await startScreenShare();
        setScreenSharing(true);
      } catch (e) {}
    } else {
      await stopScreenShare();
      setScreenSharing(false);
    }
  };

  return (
    <div>
      <div className={` flex items-center gap-2 justify-center `}>
        {/* Video toggle */}
        <button
          className={`p-2 hover:bg-gray-700 rounded transition-colors flex flex-col items-center ${
            videoEnabled ? "" : "bg-gray-700"
          }`}
          title="Toggle Video"
          onClick={handleToggleVideo}
        >
          <Video className="w-4 h-4" />
          <span className="text-xs mt-1">
            {videoEnabled ? "Video" : "Video Off"}
          </span>
        </button>
        {/* Mic toggle */}
        <button
          className={`p-2 hover:bg-gray-700 rounded transition-colors flex flex-col items-center ${
            micEnabled ? "" : "bg-gray-700"
          }`}
          title="Toggle Mic"
          onClick={handleToggleMic}
        >
          <Mic className="w-4 h-4" />
          <span className="text-xs mt-1">{micEnabled ? "Mic" : "Mic Off"}</span>
        </button>
        {/* Screen share toggle */}
        <button
          className={`p-2 hover:bg-gray-700 rounded transition-colors flex flex-col items-center ${
            screenSharing ? "bg-blue-700" : ""
          }`}
          title="Toggle Screen Share"
          onClick={handleToggleScreenShare}
        >
          <ScreenShareIcon className="w-4 h-4" />
          <span className="text-xs mt-1">
            {screenSharing ? "Stop Share" : "Share"}
          </span>
        </button>
        {/* Leave button */}
        <button
          onClick={handleEndCall}
          className="bg-red-600 hover:bg-red-700 px-4 py-1 rounded text-sm font-medium transition-colors"
        >
          Leave
        </button>
        {/* Exit fullscreen */}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="Exit fullscreen"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function MainContent({
  isMinimized,
  setIsMinimized,
  handleEndCall,
  videoEnabled,
  setVideoEnabled,
  micEnabled,
  setMicEnabled,
  screenSharing,
  setScreenSharing,
}) {
  const {
    attachLocalStream,
    attachRemoteStream,
    localStream,
    startScreenShare,
    stopScreenShare,
    peerDetails,
    isRemoteVideoEnabled,
  } = useMedia();

  useEffect(() => {
    console.log("is remote", isRemoteVideoEnabled);
  }, [isRemoteVideoEnabled]);
  // Toggle video
  const handleToggleVideo = () => {
    if (localStream.current) {
      localStream.current.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  // Toggle mic
  const handleToggleMic = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach((track) => {
        track.enabled = !micEnabled;
      });
      setMicEnabled(!micEnabled);
    }
  };

  // Toggle screen share
  const handleToggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        await startScreenShare();
        setScreenSharing(true);
      } catch (e) {}
    } else {
      await stopScreenShare();
      setScreenSharing(false);
    }
  };

  // Helper to check if local stream is available
  const isLocalVideoAvailable = () => {
    return (
      videoEnabled &&
      localStream.current &&
      localStream.current.active &&
      localStream.current.getVideoTracks().some((track) => track.enabled)
    );
  };

  const currentUser = useSelector(selectUser);
  return (
    <div className="flex-1 min-h-0">
      {/* ensures MainContent fits remaining layout space */}
      <div className="grid grid-cols-[1fr_16rem] gap-2 h-full w-full">
        {/* Remote video section */}
        <div className="bg-black rounded-lg overflow-hidden">
          {/* {isRemoteVideoEnabled ? ( */}
          <video
            disablePictureInPicture
            ref={(el) => attachRemoteStream(el)}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          ></video>
          {/* ) : (
            <img
              className="w-full h-full object-cover"
              src={
                peerDetails?.profileURL
                  ? `${cloudFrontUrl}/${peerDetails.profileURL}`
                  : defaultProfile
              }
              alt={peerDetails?.name}
            />
          )} */}
        </div>

        {/* Sidebar (local video + controls) */}
        <div className="grid grid-rows-[auto_1fr] h-full bg-gray-800 rounded-lg p-4 overflow-hidden">
          {/* Controls at the top */}
          <div className="flex items-center justify-end gap-2">
            <button
              className={`p-2 rounded hover:bg-gray-600 cursor-pointer ${
                videoEnabled ? "" : "bg-gray-700"
              }`}
              title="Toggle Video"
              onClick={handleToggleVideo}
            >
              <Video className="w-5 h-5" />
            </button>
            <button
              className={`p-2 rounded hover:bg-gray-600 cursor-pointer ${
                micEnabled ? "" : "bg-gray-700"
              }`}
              title="Toggle Mic"
              onClick={handleToggleMic}
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              className={`p-2 rounded hover:bg-gray-600 cursor-pointer ${
                screenSharing ? "bg-blue-700" : ""
              }`}
              title="Toggle Screen Share"
              onClick={handleToggleScreenShare}
            >
              <ScreenShareIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-gray-700 rounded transition-colors cursor-pointer"
              title="Exit fullscreen"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-sm"
              onClick={handleEndCall}
            >
              Leave
            </button>
          </div>

          {/* Local Preview pinned at bottom */}
          <div className="self-end w-full aspect-video rounded-lg overflow-hidden border-2 border-green-500 shadow-lg">
            {isLocalVideoAvailable() ? (
              <video
                disablePictureInPicture
                ref={(el) => attachLocalStream(el)}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              ></video>
            ) : (
              <img
                className="rounded-xl"
                src={
                  currentUser.profileURL
                    ? `${cloudFrontUrl}/${currentUser.profileURL}`
                    : defaultProfile
                }
                alt={currentUser.name}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OngoingCallOverlay;
