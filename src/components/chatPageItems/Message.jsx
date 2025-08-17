import React from "react";
import defaultProfile from "../../assets/default-profile.png";

const Message = ({ message, isCurrentUser, sender, isGroup }) => {
  const cloudFrontUrl = import.meta.env.VITE_CLOUD_FRONT_URL;
  const attachmentUrl = `${cloudFrontUrl}/${message.imagePath}`;

  const profileImg = sender?.profileURL
    ? `${cloudFrontUrl}/${sender.profileURL}`
    : defaultProfile;
  const renderMessageContent = () => {
    switch (message.type) {
      case "text":
        return <span>{message.content}</span>;
      case "image":
        return (
          <>
            <img
              src={attachmentUrl}
              alt={message.imageOriginalName}
              className="max-w-md rounded"
            />
            <span>{message.content}</span>
          </>
        );
      case "video":
        return (
          <>
            <video controls className="max-w-md rounded" src={attachmentUrl}>
              Your browser does not support the video tag.
            </video>
            <span>{message.content}</span>
          </>
        );
      case "audio":
        return (
          <>
            <audio controls className="max-w-md mb-2" src={attachmentUrl}>
              Your browser does not support the audio element.
            </audio>
            <span>{message.content}</span>
          </>
        );
      case "pdf":
      case "doc":
      case "docx":
        return (
          <>
            <a
              href={attachmentUrl}
              download={message.imageOriginalName}
              className="flex items-center "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 mr-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16v-8m0 8l-3-3m3 3l3-3m-9 5a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-3.586a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 0010.586 2H6a2 2 0 00-2 2v14z"
                />
              </svg>
              Download {message.imageOriginalName}
            </a>
            <span>{message.content}</span>
          </>
        );
      default:
        return (
          <>
            <a
              href={attachmentUrl}
              download={message.imageOriginalName}
              className="flex items-center "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 mr-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16v-8m0 8l-3-3m3 3l3-3m-9 5a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-3.586a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 0010.586 2H6a2 2 0 00-2 2v14z"
                />
              </svg>
              Download {message.imageOriginalName}
            </a>
            <span>{message.content}</span>
          </>
        );
    }
  };

  return (
    <div
      className={`flex mb-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}
    >
      {!isCurrentUser && isGroup && (
        <img
          src={profileImg}
          alt={sender?.name}
          className="w-8 h-8 rounded-full object-cover mr-2"
          onError={(e) => {
            e.target.src = defaultProfile;
          }}
        />
      )}
      <div
        className={`px-4 py-2 rounded-lg shadow text-sm ${
          isCurrentUser
            ? "bg-indigo-600 text-white"
            : "bg-gray-200 text-gray-900"
        }`}
      >
        {renderMessageContent()}
        <div className="text-xs text-gray-400 mt-1 text-right">
          {isGroup && !isCurrentUser && (
            <span>{sender ? sender.name : "User left"} · </span>
          )}
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
};

export default Message;
