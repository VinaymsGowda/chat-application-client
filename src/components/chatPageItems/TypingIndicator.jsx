import React from "react";

/**
 * Generic typing indicator — works for any user (human or AI).
 * @param {{ userName: string }} props
 */
const TypingIndicator = ({ userName }) => {
  return (
    <div className="flex items-center gap-2 px-2 py-1 text-sm text-gray-500">
      <div className="flex items-center gap-1 bg-gray-200 rounded-2xl px-3 py-2 shadow-sm">
        <span className="mr-1 font-medium text-gray-600">{userName}</span>
        <span className="flex gap-1 items-center">
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </span>
      </div>
    </div>
  );
};

export default TypingIndicator;
