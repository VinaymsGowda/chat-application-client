import React, { useState, useRef } from "react";
import { Send, Image, Smile, Paperclip, X } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const MessageInput = ({ sendMessage }) => {
  // Placeholder sendMessage function

  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 5MB

  // Utility to get file type from extension
  const getFileType = (file) => {
    if (!file) return "text";
    const ext = file.name.split(".").pop().toLowerCase();
    if (["jpeg", "jpg", "png", "gif", "svg"].includes(ext)) return "image";
    if (["mp4"].includes(ext)) return "video";
    if (["mp3"].includes(ext)) return "audio";
    if (["pdf"].includes(ext)) return "pdf";
    if (["doc", "docx"].includes(ext)) return "word";
    return "other";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim() === "" && !selectedFile) return;

    const fileType = getFileType(selectedFile);
    await sendMessage(message, fileType, selectedFile);
    setImagePreview(null);
    setSelectedFile(null);
    clearFile();
    setMessage("");
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      console.log("Inside");

      if (file.size > MAX_FILE_SIZE) {
        showToast({
          type: "warning",
          title: "File size cannot exceed 5MB.",
        });
        clearFile();
        return;
      }

      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null); // No preview for non-images
      }
    }
  };

  const clearFile = () => {
    setImagePreview(null);
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-4 border-t border-gray-200">
      {/* File/Image preview */}
      {selectedFile && (
        <div className="relative inline-block mb-2">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-md"
            />
          ) : (
            <div className="flex items-center bg-gray-100 rounded-md p-2">
              <Paperclip size={18} className="text-gray-500 mr-2" />
              <div>
                <div className="font-medium text-gray-800 text-sm">
                  {selectedFile.name}
                </div>
                <div className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
          )}
          <button
            onClick={clearFile}
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
