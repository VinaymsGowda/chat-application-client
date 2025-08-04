import React, { useEffect, useState } from "react";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Search,
  Plus,
  UserPlus,
  Users,
  MoreVertical,
  LogOut,
  User,
  Pencil,
} from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import { clearUser, setUser } from "../../redux/features/Auth/User";
import defaultProfile from "../../assets/default-profile.png";
import groupProfile from "../../assets/group-profile.png";
import { useNavigate } from "react-router-dom";
import { getOtherUser } from "../../helper/utils";
import DialogWrapper from "../../wrappers/DialogWrapper";
import ProfileModal from "./profileModal";
import { updateUser } from "../../services/userService";

const Sidebar = ({
  chats,
  otherUsers = [],
  handleChatSelection,
  selectedChat,
  searchQuery,
  setSearchQuery,
  onStartChat,
  setIsCreateGroupModalOpen,
}) => {
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.user);
  const cloudFrontUrl = import.meta.env.VITE_CLOUD_FRONT_URL;

  const handleLogout = () => {
    dispatch(clearUser());
  };

  const handleProfileOpen = () => {
    setEditUser(currentUser);
    setIsProfileOpen(true);
  };

  const handleProfileClose = () => {
    setIsProfileOpen(false);
  };

  const handleProfileSave = async () => {
    try {
      const updatePayload = {
        name: editUser.name,
      };
      const response = await updateUser(updatePayload);

      if (response.status === 200) {
        dispatch(setUser(response?.data?.data));
      }
    } catch (error) {
      console.log("Error occurred", error);
    } finally {
      setIsProfileOpen(false);
    }
  };

  return (
    <div className="w-full h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between w-full">
        <h2 className="text-lg font-bold text-gray-800 flex-1">Chats</h2>
        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={() => setIsCreateGroupModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 cursor-pointer"
            title="Create a group"
          >
            <Users size={20} />
            Create Group
          </button>
          {/* 3-dots Dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Menu"
              >
                <MoreVertical size={22} className="text-gray-600" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content className="z-50 min-w-[160px] bg-white border border-gray-200 rounded-md shadow-lg py-2 mt-2">
              <DropdownMenu.Item
                onSelect={handleProfileOpen}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer text-sm"
              >
                <User size={16} className="text-gray-500" />
                <span>Profile</span>
                <Pencil size={14} className="ml-auto text-gray-400" />
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
              <DropdownMenu.Item
                onSelect={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-gray-100 cursor-pointer text-sm"
              >
                <LogOut size={16} className="text-red-500" />
                <span>Logout</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </div>

      <div className="p-4">
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="search"
            placeholder={
              isUserSearchOpen ? "Search users..." : "Search chats..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="overflow-y-auto flex-grow">
        {chats.length === 0 && otherUsers.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-gray-500 mb-4">No chats found</p>
          </div>
        ) : (
          <>
            {chats.length > 0 && (
              <ul>
                {chats.map((chat) => {
                  const otherUser = getOtherUser(chat, currentUser);

                  const isGroup = chat.chatType === "group";

                  return (
                    <li
                      key={chat.id}
                      onClick={() => handleChatSelection(chat)}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                        selectedChat?.id === chat.id
                          ? "bg-indigo-50 border-l-4 border-l-indigo-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-center">
                        {/* Avatar */}
                        <div className="relative">
                          <img
                            src={
                              isGroup
                                ? chat.groupProfile
                                  ? `${cloudFrontUrl}/${chat.groupProfile}`
                                  : groupProfile
                                : otherUser?.profileURL || defaultProfile
                            }
                            alt={isGroup ? chat.groupName : otherUser?.name}
                            className="w-12 h-12 rounded-full object-cover mr-3"
                            onError={(e) => {
                              e.target.src = isGroup
                                ? groupProfile
                                : defaultProfile;
                            }}
                          />
                        </div>

                        {/* Chat info */}
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium truncate">
                              {isGroup ? chat.groupName : otherUser?.name}
                              {chat.chatType === "self" && " (You)"}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {chat.latestMessage
                                ? new Date(
                                    chat.latestMessage.createdAt
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : isGroup
                                ? `${chat.users?.length || 0} members`
                                : ""}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {chat.latestMessage
                              ? chat.latestMessage.content
                              : isGroup
                              ? "Group chat"
                              : otherUser?.email}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {/* Other Users Section */}
            {otherUsers.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-gray-500 mb-2 px-4 uppercase tracking-wide">
                  Other Users - Chat with them
                </h3>
                <ul>
                  {otherUsers.map((user) => (
                    <li
                      key={user.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartChat && onStartChat(user);
                      }}
                      className="flex items-center px-4 py-2 hover:bg-gray-50 border-b border-gray-100"
                    >
                      <img
                        src={user.profileURL || defaultProfile}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover mr-3"
                        onError={(e) => {
                          e.target.src = defaultProfile;
                        }}
                      />
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium truncate">
                            {user.name} {user.id === currentUser.id && " (You)"}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 truncate">
                          {user.email}
                        </span>
                      </div>
                      <button className="ml-2 px-2 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600">
                        Chat
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* Profile Modal (unchanged) */}
      <DialogWrapper
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        title={"Profile"}
      >
        <ProfileModal
          currentUser={currentUser}
          editUser={editUser}
          handleProfileSave={handleProfileSave}
          setEditUser={setEditUser}
          handleProfileClose={handleProfileClose}
        />
      </DialogWrapper>
    </div>
  );
};

export default Sidebar;
