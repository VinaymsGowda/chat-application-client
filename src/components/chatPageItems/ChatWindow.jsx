import React, { useEffect, useRef, useState } from "react";
import { Info, Phone, Video, ArrowLeft } from "lucide-react";
import Message from "./Message";
import MessageInput from "./MessageInput";
import defaultProfile from "../../assets/default-profile.png";
import groupProfile from "../../assets/group-profile.png";
import {
  addMembersToGroupChat,
  getChatOfSelectedUser,
  getMessagesByChatId,
  leaveGroupChat,
  removeMemberFromGroupChat,
  updateChatById,
} from "../../services/chatServices";
import { sendMessageService } from "../../services/messageService";
import { getOtherUser } from "../../helper/utils";

import ChatInfoWindow from "./ChatInfoWindow";
import { useToast } from "../../context/ToastContext";
import { isAxiosError } from "axios";

const ChatWindow = ({
  selectedChat,
  setSelectedChat,
  currentUser,
  onBackClick,
  isMobile,
  isNewChat,
  setIsNewChat,
  socket,
  addNewChat,
  fetchChats,
}) => {
  const cloudFrontUrl = import.meta.env.VITE_CLOUD_FRONT_URL;

  if (!selectedChat) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-gray-50">
        <div className="text-center">
          <div className="mx-auto bg-gray-200 rounded-full h-24 w-24 flex items-center justify-center mb-4">
            <Info size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            No Chat selected
          </h3>
          <p className="text-gray-500 max-w-sm">
            Select a Chat or search users to start a new conversation.
          </p>
        </div>
      </div>
    );
  }
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [isShowInfo, setIsShowInfo] = useState(false);

  const getMessagesOfSelectedChat = async () => {
    try {
      if (selectedChat) {
        const response = await getMessagesByChatId(selectedChat.id);
        if (response.status === 200) {
          setMessages(response.data.messages || []);
        }
      } else {
        setMessages([]);
      }
    } catch (error) {
      if (error.response.status === 404) {
        setMessages([]);
      }
    }
  };

  useEffect(() => {
    const handleMessageReceived = (newMessage) => {
      if (!isNewChat && selectedChat && selectedChat.id === newMessage.chatId) {
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    socket.on("message-received", handleMessageReceived);

    return () => {
      socket.off("message-received", handleMessageReceived); // 👈 clean up listener
    };
  }, [selectedChat?.id, isNewChat]);

  useEffect(() => {
    if (!isNewChat && selectedChat) {
      socket.emit("join-chat-room", selectedChat.id);
      getMessagesOfSelectedChat();
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  // Get selectedChat title and avatar
  const getChatMeta = () => {
    if (!selectedChat) return { title: "", avatar: "" };
    if (selectedChat.chatType === "group") {
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
        avatar: otherUser?.profileURL || defaultProfile,
      };
    }
  };

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
        setIsNewChat(false);
        const newChat = {
          ...selectedChat,
          id: newMessage.chatId,
          latestMessage: newMessage,
        };
        setSelectedChat((prev) => ({
          ...prev,
          id: newMessage.chatId,
          latestMessage: newMessage,
        }));
        addNewChat(newChat);
      }
      let chatId = newMessage.chatId;
      socket.emit("new-message", chatId, newMessage);
    }
  };

  const handleLeaveGroupChat = async () => {
    try {
      if (selectedChat && selectedChat.chatType === "group") {
        const response = await leaveGroupChat(selectedChat.id);
        if (response.status === 200) {
          setSelectedChat(null);
          await fetchChats();
        }
      } else {
        console.log("Invalid chat");
      }
    } catch (error) {
      console.log("Error ", error);
    }
  };

  const { showToast } = useToast();

  const handleAddNewMembers = async (selectedUsers) => {
    try {
      if (selectedChat && selectedUsers.length > 0) {
        const selectedUsersWithIds = selectedUsers.map((item) => item.id);

        const response = await addMembersToGroupChat(
          selectedChat.id,
          selectedUsersWithIds
        );
        if (response.status === 201) {
          const newUsers = selectedUsers.map((item) => {
            return {
              id: item.id,
              name: item.name,
              email: item.email,
              profileURL: item.profileURL,
              authProviderId: item.authProviderId,
            };
          });
          setSelectedChat((prev) => {
            return {
              ...prev,
              users: [...prev.users, ...newUsers],
            };
          });
          showToast({
            title: "Members Added",
            description: "Added member(s) successfully!",
          });
        }
      } else {
        console.log("Chat is required");
      }
    } catch (error) {
      console.log("Error adding new users", error);
    }
  };

  const { title, avatar } = getChatMeta();
  const isGroup = selectedChat.chatType === "group";
  const groupMembers = isGroup ? selectedChat.users : [];

  const handleRemoveUser = async (userId) => {
    try {
      if (currentUser.id === selectedChat.groupAdminId) {
        const response = await removeMemberFromGroupChat(
          selectedChat.id,
          userId
        );

        if (response.status === 200) {
          const newMembers = groupMembers.filter((item) => item.id !== userId);

          setSelectedChat((prev) => {
            return {
              ...prev,
              users: newMembers,
            };
          });
          showToast({
            title: "User removed successsfully",
            type: "success",
          });
        }
      } else {
        showToast({
          title: "Only group admin can remove members",
          type: "warning",
        });
      }
    } catch (error) {
      console.log("Error occured while removing user");
    }
  };

  const handleChatUpdate = async (data) => {
    try {
      if (selectedChat && currentUser.id === selectedChat.groupAdminId) {
        const response = await updateChatById(selectedChat?.id, data);
        if (response.status === 200) {
          showToast({
            title: "Chat updated successfully",
            type: "success",
          });
        }
        const updatedData = response.data.data[0];
        await fetchChats();
        setSelectedChat((prev) => {
          return {
            ...prev,
            ...updatedData,
          };
        });
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || "Error occured while chat updation";

      showToast({
        title: errorMessage,
        type: "error",
      });
    }
  };

  const getChatWithUser = async (selectedUser) => {
    try {
      const userId = selectedUser.id;
      const response = await getChatOfSelectedUser(userId);
      if (response.status === 200) {
        console.log("Heyyy ");
        console.log("Response ", response.data);

        const chat = response.data.chat;

        const chatBody = {
          ...chat,
          users: [currentUser, selectedUser],
          latestMessage: response.data.latestMessage || null,
        };
        setSelectedChat(chatBody);
      }
    } catch (error) {
      if (isAxiosError(error) && error.response.status === 404) {
        console.log("error ", error);
        setSelectedChat({
          id: "new-chat",
          chatType: selectedUser.id === currentUser.id ? "self" : "one_to_one",
          groupName: null,
          groupProfile: null,
          latestMessage: null,
          users:
            selectedUser.id === currentUser.id
              ? [currentUser]
              : [currentUser, selectedUser],
        });

        setIsNewChat(true);
      }
    } finally {
      setIsShowInfo(false);
    }
  };

  return (
    <>
      {!isShowInfo ? (
        <div
          className={`h-full flex flex-col bg-white ${
            isMobile ? "w-full min-w-0" : ""
          }`}
        >
          {/* selectedChat header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center min-w-0">
            {isMobile && (
              <button
                onClick={onBackClick}
                className="mr-2 p-1 rounded hover:bg-gray-100 flex-shrink-0"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <img
              src={avatar}
              alt={title}
              className="w-10 h-10 rounded-full object-cover mr-3 flex-shrink-0"
              onError={(e) => {
                e.target.src = isGroup ? groupProfile : defaultProfile;
              }}
            />
            <div className="flex-grow min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {title} {selectedChat.chatType === "self" && " (You)"}
              </h3>
              {isGroup ? (
                <p className="text-xs text-gray-500 truncate">
                  {groupMembers.length} participants
                </p>
              ) : null}
            </div>
            <div className="flex space-x-2 flex-shrink-0">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Phone size={18} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Video size={18} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Info
                  size={18}
                  className="text-gray-600"
                  onClick={() => setIsShowInfo(true)}
                />
              </button>
            </div>
          </div>
          {/* Messages */}
          <div className="flex-grow overflow-y-auto p-4 bg-white min-w-0">
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
              <>
                {messages.map((message) => {
                  const isCurrentUser = message.senderId === currentUser?.id;
                  const sender = selectedChat.users?.find(
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
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Message input */}
          <MessageInput sendMessage={sendMessage} />
        </div>
      ) : (
        <ChatInfoWindow
          chatName={title}
          profileURL={avatar}
          isGroup={isGroup}
          groupMembers={groupMembers}
          currentUser={currentUser}
          selectedChat={selectedChat}
          onBackClick={() => setIsShowInfo(false)}
          handleLeaveGroup={handleLeaveGroupChat}
          handleAddNewMembers={handleAddNewMembers}
          handleRemoveUser={handleRemoveUser}
          handleChatUpdate={handleChatUpdate}
          onChatWithUser={getChatWithUser}
        />
      )}
    </>
  );
};

export default ChatWindow;
