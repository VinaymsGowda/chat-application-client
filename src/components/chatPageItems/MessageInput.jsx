import React, { useState, useRef } from "react";
import { Send, Image, Smile, Paperclip, X } from "lucide-react";

const MessageInput = ({ sendMessage }) => {
  // Placeholder sendMessage function

  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() === "" && !imagePreview) return;
    if (imagePreview) {
      sendMessage(message || "Sent an image", true, imagePreview);
      setImagePreview(null);
    } else {
      sendMessage(message);
    }
    setMessage("");
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImagePreview = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-4 border-t border-gray-200">
      {/* Image preview */}
      {imagePreview && (
        <div className="relative inline-block mb-2">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-20 h-20 object-cover rounded-md"
          />
          <button
            onClick={clearImagePreview}
            className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center">
        <div className="flex-shrink-0 mr-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Image size={20} className="text-gray-500" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="flex-grow relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
          />
        </div>
        <button
          type="submit"
          className="ml-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors flex-shrink-0"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
