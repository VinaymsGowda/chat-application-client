import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import defaultProfile from "../../assets/default-profile.png";

const Message = ({ message, isCurrentUser, sender, isGroup }) => {
  const cloudFrontUrl = import.meta.env.VITE_CLOUD_FRONT_URL;
  const attachmentUrl = `${cloudFrontUrl}/${message.imagePath}`;

  const profileImg = sender?.profileURL
    ? `${cloudFrontUrl}/${sender.profileURL}`
    : defaultProfile;

  const MarkdownContent = ({ content }) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />,
        a: ({ node, ...props }) => (
          <a
            className="text-blue-400 hover:underline break-all"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),
        code: ({ node, inline, ...props }) =>
          inline ? (
            <code
              className="bg-black/20 px-1 rounded font-mono text-xs"
              {...props}
            />
          ) : (
            <pre className="bg-black/20 p-2 rounded my-2 overflow-x-auto">
              <code className="font-mono text-xs" {...props} />
            </pre>
          ),
        ul: ({ node, ...props }) => (
          <ul className="list-disc ml-4 mb-1" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal ml-4 mb-1" {...props} />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote
            className="border-l-4 border-gray-400 pl-2 italic my-1"
            {...props}
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );

  const renderMessageContent = () => {
    switch (message.type) {
      case "text":
        return <MarkdownContent content={message.content} />;
      case "image":
        return (
          <>
            <img
              src={attachmentUrl}
              alt={message.imageOriginalName}
              className="max-w-md rounded mb-2"
            />
            <MarkdownContent content={message.content} />
          </>
        );
      case "video":
        return (
          <>
            <video
              controls
              className="max-w-md rounded mb-2"
              src={attachmentUrl}
            >
              Your browser does not support the video tag.
            </video>
            <MarkdownContent content={message.content} />
          </>
        );
      case "audio":
        return (
          <>
            <audio controls className="max-w-md mb-2" src={attachmentUrl}>
              Your browser does not support the audio element.
            </audio>
            <MarkdownContent content={message.content} />
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
              className="flex items-center mb-2 text-inherit hover:opacity-80 transition-opacity"
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
            <MarkdownContent content={message.content} />
          </>
        );
      default:
        return (
          <>
            <a
              href={attachmentUrl}
              download={message.imageOriginalName}
              className="flex items-center mb-2 text-inherit hover:opacity-80 transition-opacity"
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
            <MarkdownContent content={message.content} />
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
        className={`px-4 py-2 rounded-lg shadow text-sm max-w-[85%] md:max-w-[70%] ${
          isCurrentUser ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-900"
        }`}
      >
        {renderMessageContent()}
        <div
          className={`text-[10px] mt-1 text-right ${
            isCurrentUser ? "text-indigo-200" : "text-gray-500"
          }`}
        >
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
