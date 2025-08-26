import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import Conversations from "../pages/Chat/Conversations";
import ChatInfo from "../pages/Chat/ChatInfo";
import Chat from "../pages/Chat/Chat";
import { createGroupChat, getAllChats } from "../services/chatServices";
import Sidebar from "../components/chatPageItems/Sidebar";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "../redux/features/Auth/User";
import {
  fetchChats,
  selectSelectedChat,
  setSelectedChat,
} from "../redux/features/Chat/Chat";
import UserInfo from "../pages/Info/UserInfo";
import { searchUsers } from "../services/userService";
import CreateGroupModal from "../components/chatPageItems/CreateGroupModal";
import { useToast } from "../context/ToastContext";

function ChatNavigation() {
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [createGroupUserSearch, setCreateGroupUserSearch] = useState("");
  const [createGroupErrorMessage, setCreateGroupErrorMessage] = useState("");
  const [users, setUsers] = useState([]);

  const dispatch = useDispatch();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation(); // 👈 to detect current route
  const { socket } = useSocket();
  const selectedChat = useSelector(selectSelectedChat);
  const currentUser = useSelector(selectUser);

  // Fetch chats on mount
  useEffect(() => {
    dispatch(fetchChats(""));
  }, [dispatch]);

  // Socket listeners
  useEffect(() => {
    const handleNewChatReceived = () => {
      dispatch(fetchChats(""));
    };

    const handleRemovedFromGroup = (chatId) => {
      dispatch(fetchChats(""));
      if (selectedChat && selectedChat.id === chatId) {
        dispatch(setSelectedChat(null));
        navigate("/chat");
      }
    };

    socket.on("new-chat-received", handleNewChatReceived);
    socket.on("removed-from-group", handleRemovedFromGroup);

    return () => {
      socket.off("new-chat-received", handleNewChatReceived);
      socket.off("removed-from-group", handleRemovedFromGroup);
    };
  }, [dispatch, socket, selectedChat, navigate]);

  // Fetch users when modal opens
  useEffect(() => {
    if (isCreateGroupModalOpen) {
      getUsersForGroupChat();
    }
  }, [isCreateGroupModalOpen, createGroupUserSearch]);

  const getUsersForGroupChat = async () => {
    try {
      const response = await searchUsers(createGroupUserSearch);
      if (response.status === 200) {
        setUsers(response?.data?.data || []);
      }
    } catch (error) {
      console.log("Error occurred");
      setUsers([]);
      setCreateGroupErrorMessage("");
    }
  };

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
        const chat = response.data.chat;
        dispatch(fetchChats(""));
        setIsCreateGroupModalOpen(false);
        socket.emit("new-chat", selectedUsers);

        navigate(`/chat/${chat.id}`, {
          state: { isNewChat: false },
        });
        showToast({
          title: "Group Created",
          description: "Created group successfully!",
        });
      }
    } catch (error) {}
  };

  // 👇 Logic to hide/show sidebar vs content on small devices
  const isChatListPage = location.pathname === "/chat";

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div
        className={`
          border-r border-gray-200 
          ${isChatListPage ? "block" : "hidden"} 
          md:block
          w-full md:w-[30vw]
        `}
      >
        <Sidebar setIsCreateGroupModalOpen={setIsCreateGroupModalOpen} />
      </div>

      {/* Main content */}
      <div
        className={`
          flex-1 overflow-y-auto
          ${isChatListPage ? "hidden" : "block"}
          md:block
        `}
      >
        <Routes>
          <Route path="/" element={<Conversations />} />
          <Route path="/:id" element={<Chat />} />
          <Route path="/:id/info" element={<ChatInfo />} />
          <Route path="/user/:userId/info" element={<UserInfo />} />
        </Routes>
      </div>
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

export default ChatNavigation;
