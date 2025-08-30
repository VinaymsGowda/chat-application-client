import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getMessagesByChatId } from "../../services/chatServices";
import { cloudFrontUrl, getOtherUser } from "../../helper/utils";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "../../redux/features/Auth/User";
import {
  setSelectedChat,
  selectSelectedChat,
  fetchChats,
} from "../../redux/features/Chat/Chat";
import defaultProfile from "../../assets/default-profile.png";
import groupProfile from "../../assets/group-profile.png";
import { ArrowLeft, Info, Phone, Video } from "lucide-react";
import Message from "../../components/chatPageItems/Message";
import MessageInput from "../../components/chatPageItems/MessageInput";
import { sendMessageService } from "../../services/messageService";
import { useSocket } from "../../context/SocketContext";

import { useMedia } from "../../context/MediaProvider";
import { useToast } from "../../context/ToastContext";

function Chat() {
  const locationState = useLocation().state;
  const isNewChat = locationState?.isNewChat;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatNotFound, setChatNotFound] = useState(false);
  const dispatch = useDispatch();
  const selectedChat = useSelector(selectSelectedChat);
  const { id } = useParams();
  const navigate = useNavigate();

  const currentUser = useSelector(selectUser);
  const { socket } = useSocket();
  const { showToast } = useToast();
  const {
    openMediaDevices,
    callState,
    setCallState,
    setPeerDetails,
    makeCall,
  } = useMedia();

  const getMessagesOfSelectedChat = async () => {
    try {
      setLoading(true);
      setChatNotFound(false);
      if (id && !isNewChat) {
        const response = await getMessagesByChatId(id);
        if (response.status === 200) {
          dispatch(setSelectedChat(response.data.chat));
          setMessages(response.data.messages || []);
        } else {
          setChatNotFound(true);
          setMessages([]);
          dispatch(setSelectedChat(null));
        }
      } else {
        setMessages([]);
      }
    } catch (error) {
      if (error.response && error.response?.status === 404) {
        setChatNotFound(true);
        setMessages([]);
        dispatch(setSelectedChat(null));
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const handleMessageReceived = (newMessage) => {
      if (id && id === newMessage.chatId) {
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    socket?.on("message-received", handleMessageReceived);

    // Cleanup to prevent multiple listeners
    return () => {
      socket?.off("message-received", handleMessageReceived);
    };
  }, [id, isNewChat]);

  const handleAudioCall = async () => {
    if (callState !== "idle") {
      showToast({
        title: "Please end ongoing call to start a new call",
        type: "warning",
      });
      return;
    }
    setPeerDetails(getOtherUser(selectedChat, currentUser));
    const stream = await openMediaDevices({ audio: true });

    const offer = await makeCall();
    setCallState("calling");
    socket.emit("initiate-call", selectedChat, "audio", offer, currentUser);
  };

  const handleVideoCall = async () => {
    if (callState !== "idle") {
      showToast({
        title: "Please end ongoing call to start a new call",
        type: "warning",
      });
      return;
    }
    setPeerDetails(getOtherUser(selectedChat, currentUser));
    const stream = await openMediaDevices({
      video: {
        width: 375,
        height: 350,
      },
      audio: true,
    });

    const offer = await makeCall();
    setCallState("calling");
    socket.emit("initiate-call", selectedChat, "video", offer, currentUser);
  };

  useEffect(() => {
    if (!isNewChat && id) {
      getMessagesOfSelectedChat();
      socket?.emit("join-chat-room", id);
    } else {
      setMessages([]);
      setChatNotFound(false);
      setLoading(false);
    }
  }, [id, socket]);

  const getChatMeta = () => {
    if (!selectedChat) return { title: "", avatar: null };
    if (selectedChat?.chatType === "group") {
      return {
        title: selectedChat.groupName || "Group selectedChat",
        avatar: selectedChat.groupProfile
          ? `${cloudFrontUrl}/${selectedChat.groupProfile}`
          : groupProfile,
      };
    } else {
      const otherUser = getOtherUser(selectedChat, currentUser);
      return {
        title: otherUser?.name || "selectedChat",
        avatar: otherUser?.profileURL
          ? `${cloudFrontUrl}/${otherUser.profileURL}`
          : defaultProfile,
      };
    }
  };
  const { title, avatar } = getChatMeta();

  const isGroup = selectedChat?.chatType === "group";
  const groupMembers = isGroup ? selectedChat.users : [];
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (message, messageType, selectedFile = null) => {
    const data = {
      content: message,
      type: messageType,
      chatId: selectedChat.id,
    };
    if (isNewChat) {
      delete data.chatId;
      const otherUser = getOtherUser(selectedChat, currentUser);
      data.receiverId = otherUser.id;
    }
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (selectedFile) {
      formData.append("file", selectedFile);
    }
    const response = await sendMessageService(formData);
    if (response.status === 201) {
      const newMessage = response.data.data;
      setMessages((prev) => {
        return [...prev, newMessage];
      });
      if (isNewChat) {
        // Refresh the chat list after sending a new message
        dispatch(fetchChats(""));
        socket.emit("new-chat", selectedChat.users);
        navigate(`/chat/${newMessage.chatId}`);
      }
      let chatId = newMessage.chatId;
      socket?.emit("new-message", chatId, newMessage);
    }
  };
  const handleBackClick = () => {
    dispatch(setSelectedChat(null));
    setChatNotFound(false);
    setLoading(false);
    navigate("/chat");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat information...</p>
        </div>
      </div>
    );
  }

  if (chatNotFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Chat Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The chat you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 border-b bg-white flex items-center gap-4 min-w-0 shadow-sm">
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft />
        </button>
        <img
          src={avatar}
          alt={title}
          className="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-sm"
          onError={(e) => {
            e.target.src = isGroup ? groupProfile : defaultProfile;
          }}
        />
        <div className="flex-grow min-w-0">
          <h3 className="font-semibold text-lg text-gray-900 truncate">
            {title} {selectedChat?.chatType === "self" && " (You)"}
          </h3>
          {isGroup ? (
            <p className="text-xs text-gray-500 truncate">
              {groupMembers.length} participants
            </p>
          ) : null}
        </div>
        <div className="flex space-x-2 flex-shrink-0">
          {selectedChat && selectedChat.chatType == "one_to_one" && (
            <>
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition"
                onClick={handleAudioCall}
              >
                <Phone size={18} className="text-gray-600" />
              </button>
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition"
                onClick={handleVideoCall}
              >
                <Video size={18} className="text-gray-600" />
              </button>
            </>
          )}
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition"
            onClick={() => {
              if (isGroup) {
                navigate(`/chat/${id}/info`);
              } else {
                const user = getOtherUser(selectedChat, currentUser);
                navigate(`/chat/user/${user.id}/info`);
              }
            }}
          >
            <Info size={18} className="text-gray-600" />
          </button>
        </div>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
        {!messages || messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="bg-gray-100 rounded-full p-4 mb-4">
              <Info size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No messages yet</p>
            <p className="text-sm text-gray-400">
              {isGroup
                ? "Start the conversation in this group"
                : "Start a conversation"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isCurrentUser = message.senderId === currentUser?.id;
              const sender = selectedChat?.users?.find(
                (user) => user.id === message.senderId
              );
              return (
                <Message
                  key={message.id}
                  message={message}
                  isCurrentUser={isCurrentUser}
                  sender={sender}
                  isGroup={isGroup}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      {/* Message Input */}
      <div className=" border-t bg-white">
        <MessageInput sendMessage={sendMessage} />
      </div>
    </div>
  );
}

export default Chat;
