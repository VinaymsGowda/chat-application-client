// ChatPage.js
import React, { useEffect, useState } from "react";
import Sidebar from "../../components/chatPageItems/Sidebar";
import ChatWindow from "../../components/chatPageItems/ChatWindow";
import { createGroupChat, getAllChats } from "../../services/chatServices";

import { useSelector } from "react-redux";
import { selectUser } from "../../redux/features/Auth/User";
import { io } from "socket.io-client";
import { searchUsers } from "../../services/userService";
import CreateGroupModal from "../../components/chatPageItems/CreateGroupModal";
import { useToast } from "../../context/ToastContext";

// Define only ONCE, outside the component
const socket = io(import.meta.env.VITE_SERVER_URL, {
  autoConnect: false, // Optional but recommended for manual control
});
function ChatPage() {
  const [chats, setChats] = useState([]);
  const [otherUsers, setOtherUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const currentUser = useSelector(selectUser);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewChat, setIsNewChat] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [createGroupErrorMessage, setCreateGroupErrorMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [createGroupUserSearch, setCreateGroupUserSearch] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    socket.connect(); // 👈 Must connect first

    socket.on("connect", () => {
      // this will be used for notifications and adding new chats when received
      socket.emit("user-room", currentUser.id);
    });

    const handleNewChat = (newChat) => {
      setChats((prev) => [newChat, ...prev]);
    };

    socket.on("new-chat-received", handleNewChat);

    return () => {
      socket.off("new-chat-received", handleNewChat); // ✅ remove listener

      socket.disconnect();
    };
  }, []);

  const fetchChats = async () => {
    try {
      const res = await getAllChats(searchQuery);
      if (res.status === 200) {
        setChats(res.data.chats || []);
        setOtherUsers(res.data.otherUsers || []);
      }
    } catch (err) {
      console.error("Failed to load chats:", err);
    }
  };
  useEffect(() => {
    const interval = setTimeout(() => {
      fetchChats();
    }, 600);

    return () => {
      clearTimeout(interval);
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobileView && selectedChat) setShowMobileSidebar(false);
  }, [selectedChat, isMobileView]);

  const handleStartChat = (user) => {
    // initiate new chat with user

    setIsNewChat(true);

    setSelectedChat({
      id: "new-chat",
      chatType: user.id === currentUser.id ? "self" : "one_to_one",
      groupName: null,
      groupProfile: null,
      latestMessage: null,
      users: user.id === currentUser.id ? [currentUser] : [currentUser, user],
    });
  };

  const handleChatSelection = (chat) => {
    setIsNewChat(false);
    setSelectedChat(chat);
  };

  const addNewChat = (newChat) => {
    setChats((prev) => {
      return [newChat, ...prev];
    });
    if (newChat.chatType !== "self") {
      socket.emit("new-chat", newChat);
    }
  };

  const getUsersForGroupChat = async () => {
    try {
      const response = await searchUsers(createGroupUserSearch);
      if (response.status === 200) {
        setUsers(response?.data?.data || []);
      }
    } catch (error) {
      console.log("Error occurred");
      setUsers([]);
      setCreateGroupErrorMessage(error.messge);
    }
  };

  useEffect(() => {
    if (isCreateGroupModalOpen) {
      getUsersForGroupChat();
    }
  }, [isCreateGroupModalOpen, createGroupUserSearch]);

  const handleCreateGroupChat = async (
    groupName,
    selectedUsers,
    groupProfile
  ) => {
    try {
      selectedUsers.push(currentUser);

      const selectedUsersWithIds = selectedUsers.map((item) => item.id);

      const newGroupChatPayload = {
        groupName: groupName,
        userIds: selectedUsersWithIds,
      };

      const body = new FormData();

      body.append("data", JSON.stringify(newGroupChatPayload));

      if (groupProfile) {
        body.append("groupProfile", groupProfile);
      }

      const response = await createGroupChat(body);
      if (response.status === 201) {
        const newChat = {
          ...response.data.data,
          latestMessage: null,
          users: selectedUsers,
        };
        addNewChat(newChat);

        setIsCreateGroupModalOpen(false);
        showToast({
          title: "Group Created",
          description: "Created group successfully!",
        });
      }
    } catch (error) {}
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex flex-grow overflow-hidden">
        {isMobileView ? (
          showMobileSidebar || !selectedChat ? (
            <Sidebar
              chats={chats}
              otherUsers={otherUsers}
              handleChatSelection={handleChatSelection}
              selectedChat={selectedChat}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onStartChat={handleStartChat}
              setIsCreateGroupModalOpen={setIsCreateGroupModalOpen}
            />
          ) : (
            <div className="w-full h-full min-w-0">
              <ChatWindow
                selectedChat={selectedChat}
                currentUser={currentUser}
                onBackClick={() => {
                  setSelectedChat(null);
                  if (isMobileView) {
                    setShowMobileSidebar(true);
                  }
                }}
                isNewChat={isNewChat}
                isMobile={isMobileView}
                setIsNewChat={setIsNewChat}
                setSelectedChat={setSelectedChat}
                socket={socket}
                addNewChat={addNewChat}
                fetchChats={fetchChats}
              />
            </div>
          )
        ) : (
          <>
            <div className="w-2/5 h-full">
              <Sidebar
                chats={chats}
                otherUsers={otherUsers}
                handleChatSelection={handleChatSelection}
                selectedChat={selectedChat}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onStartChat={handleStartChat}
                setIsCreateGroupModalOpen={setIsCreateGroupModalOpen}
              />
            </div>
            <div className="flex-1 h-full">
              <ChatWindow
                selectedChat={selectedChat}
                currentUser={currentUser}
                onBackClick={() => {
                  setSelectedChat(null);
                  if (isMobileView) {
                    setShowMobileSidebar(true);
                  }
                }}
                isNewChat={isNewChat}
                isMobile={isMobileView}
                setIsNewChat={setIsNewChat}
                setSelectedChat={setSelectedChat}
                socket={socket}
                addNewChat={addNewChat}
                fetchChats={fetchChats}
              />
            </div>
          </>
        )}
      </div>

      {/* Create group modal */}

      <CreateGroupModal
        open={isCreateGroupModalOpen}
        onOpenChange={() => {
          setIsCreateGroupModalOpen(false);
          setCreateGroupErrorMessage("");
        }}
        createGroupErrorMessage={createGroupErrorMessage}
        handleCreateGroupChat={handleCreateGroupChat}
        setCreateGroupErrorMessage={setCreateGroupErrorMessage}
        users={users}
        onClose={() => setIsCreateGroupModalOpen(false)}
        createGroupUserSearch={createGroupUserSearch}
        setCreateGroupUserSearch={setCreateGroupUserSearch}
      />
    </div>
  );
}

export default ChatPage;
