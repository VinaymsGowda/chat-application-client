import { useState } from "react";
import ReactDOM from "react-dom";
import { useMedia } from "../../context/MediaProvider";
import { Minimize2, Video, Mic, ScreenShareIcon } from "lucide-react";
import { cloudFrontUrl } from "../../helper/utils";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/features/Auth/User";
import defaultProfile from "../../assets/default-profile.png";

const OngoingCallOverlay = ({ calleeName, onEndCall }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const {
    attachLocalStream,
    attachRemoteStream,
    isRemoteVideoEnabled,
    localMediaControls,
    remoteMediaControls,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,
    peerDetails,
  } = useMedia();

  const currentUser = useSelector(selectUser);

  return ReactDOM.createPortal(
    <div
      className={`fixed ${
        isMinimized
          ? "bottom-5 right-5 w-fit h-28 z-50 px-3"
          : "inset-0 w-full h-full z-50 px-2 space-y-4"
      } bg-gray-900 text-white shadow-xl rounded-xl flex flex-col`}
      style={{ pointerEvents: "auto" }}
    >
      {/* Header */}
      <div className="flex justify-between items-center pt-2 rounded-t-xl">
        <span>{isMinimized ? "Call" : `Ongoing Call with ${calleeName}`}</span>
      </div>

      {isMinimized && (
        <div className="flex items-center gap-2 justify-center">
          {/* Media Controls */}
          <button
            onClick={toggleCamera}
            className={`p-2 rounded transition-colors ${
              localMediaControls.camera
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-700 hover:bg-red-800"
            }`}
            title={
              localMediaControls.camera ? "Turn off camera" : "Turn on camera"
            }
          >
            <Video className="w-4 h-4" />
          </button>

          <button
            onClick={toggleMicrophone}
            className={`p-2 rounded transition-colors ${
              localMediaControls.microphone
                ? "bg-gray-600 hover:bg-gray-700"
                : "bg-red-700 hover:bg-red-800"
            }`}
            title={localMediaControls.microphone ? "Mute" : "Unmute"}
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-2 rounded transition-colors ${
              localMediaControls.screenShare
                ? "bg-blue-700 hover:bg-blue-800"
                : "bg-gray-700 hover:bg-gray-800"
            }`}
            title={
              localMediaControls.screenShare ? "Stop sharing" : "Share screen"
            }
          >
            <ScreenShareIcon className="w-4 h-4" />
          </button>

          {/* Leave button */}
          <button
            onClick={onEndCall}
            className="bg-red-600 hover:bg-red-700 px-4 py-1 rounded text-sm font-medium transition-colors"
          >
            Leave
          </button>

          {/* Expand button */}
          <button
            onClick={() => setIsMinimized(false)}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Expand call window"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {!isMinimized && (
        <div className="flex-1 min-h-0">
          <div className="grid grid-cols-[1fr_16rem] gap-2 h-full w-full">
            {/* Remote video section */}
            <div className="bg-black rounded-lg overflow-hidden relative">
              {/* Always render video element for audio playback, but conditionally show video */}
              <video
                disablePictureInPicture
                ref={(el) => attachRemoteStream(el)}
                autoPlay
                playsInline
                className={`w-full h-full ${
                  remoteMediaControls.screenShare
                    ? "object-contain"
                    : "object-cover"
                }`}
                style={{
                  display:
                    remoteMediaControls.camera ||
                    remoteMediaControls.screenShare
                      ? "block"
                      : "none",
                }}
              >
                <track kind="captions" />
              </video>

              {/* Show profile image when video is not active */}
              {!remoteMediaControls.camera &&
                !remoteMediaControls.screenShare && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                        <img
                          className="w-full h-full object-cover"
                          src={
                            peerDetails?.profileURL
                              ? `${cloudFrontUrl}/${peerDetails.profileURL}`
                              : defaultProfile
                          }
                          alt={
                            peerDetails?.name ||
                            calleeName ||
                            "Remote participant"
                          }
                        />
                      </div>
                      <p className="text-gray-300">
                        {peerDetails?.name ||
                          calleeName ||
                          "Remote participant"}
                      </p>
                    </div>
                  </div>
                )}

              {/* Remote media status indicators */}
              <div className="absolute top-4 left-4 flex gap-2">
                {!remoteMediaControls.microphone && (
                  <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                    Muted
                  </span>
                )}
                {remoteMediaControls.screenShare && (
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <ScreenShareIcon className="w-3 h-3" />
                    Screen Sharing
                  </span>
                )}
              </div>
            </div>

            {/* Sidebar (local video + controls) */}
            <div className="grid grid-rows-[auto_1fr] h-full bg-gray-800 rounded-lg p-4 overflow-hidden">
              {/* Controls */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <button
                  onClick={toggleCamera}
                  className={`p-2 rounded transition-colors ${
                    localMediaControls.camera
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-700 hover:bg-red-800"
                  }`}
                  title={
                    localMediaControls.camera
                      ? "Turn off camera"
                      : "Turn on camera"
                  }
                >
                  <Video className="w-5 h-5" />
                </button>

                <button
                  onClick={toggleMicrophone}
                  className={`p-2 rounded transition-colors ${
                    localMediaControls.microphone
                      ? "bg-gray-600 hover:bg-gray-700"
                      : "bg-red-700 hover:bg-red-800"
                  }`}
                  title={localMediaControls.microphone ? "Mute" : "Unmute"}
                >
                  <Mic className="w-5 h-5" />
                </button>

                <button
                  onClick={toggleScreenShare}
                  className={`p-2 rounded transition-colors ${
                    localMediaControls.screenShare
                      ? "bg-blue-700 hover:bg-blue-800"
                      : "bg-gray-700 hover:bg-gray-800"
                  }`}
                  title={
                    localMediaControls.screenShare
                      ? "Stop sharing"
                      : "Share screen"
                  }
                >
                  <ScreenShareIcon className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-2 hover:bg-gray-700 rounded transition-colors"
                  title="Minimize call window"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>

                <button
                  className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-sm font-medium transition-colors"
                  onClick={onEndCall}
                >
                  Leave
                </button>
              </div>

              {/* Local Preview */}
              <div className="self-end w-full aspect-video rounded-lg overflow-hidden border-2 border-green-500 shadow-lg relative">
                {localMediaControls.camera || localMediaControls.screenShare ? (
                  <video
                    disablePictureInPicture
                    ref={(el) => attachLocalStream(el)}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full ${
                      localMediaControls.screenShare
                        ? "object-contain"
                        : "object-cover"
                    }`}
                  >
                    <track kind="captions" />
                  </video>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-700">
                    <img
                      className="w-16 h-16 rounded-full object-cover"
                      src={
                        currentUser.profileURL
                          ? `${cloudFrontUrl}/${currentUser.profileURL}`
                          : defaultProfile
                      }
                      alt={currentUser.name}
                    />
                  </div>
                )}

                {/* Local screen sharing indicator */}
                {localMediaControls.screenShare && (
                  <div className="absolute bottom-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    <ScreenShareIcon className="w-3 h-3" />
                    You're sharing
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default OngoingCallOverlay;
