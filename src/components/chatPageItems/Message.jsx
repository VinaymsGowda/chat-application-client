import React from "react";
import defaultProfile from "../../assets/default-profile.png";

const Message = ({ message, isCurrentUser, sender, isGroup }) => {
  const profileImg = sender?.profileURL || defaultProfile;
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
        className={`max-w-xs px-4 py-2 rounded-lg shadow text-sm ${
          isCurrentUser
            ? "bg-indigo-600 text-white"
            : "bg-gray-200 text-gray-900"
        }`}
      >
        {message.type === "text" ? (
          <span>{message.content}</span>
        ) : message.type === "image" ? (
          <img
            src={message.content}
            alt="sent"
            className="max-w-full rounded"
          />
        ) : null}
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
