import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  addMembersToGroupChat,
  getChatInfo,
  getChatOfSelectedUser,
  getMembersToAddGroupChatList,
  leaveGroupChat,
  removeMemberFromGroupChat,
  updateChatById,
} from "../../services/chatServices";
import groupProfile from "../../assets/group-profile.png";
import { ArrowLeft, Users, Edit2, Camera } from "lucide-react";
import GroupMembersSection from "../../components/chatInfoItems/GroupMembersSection";
import { isAxiosError } from "axios";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "../../redux/features/Auth/User";
import { fetchChats, setSelectedChat } from "../../redux/features/Chat/Chat";
import { cloudFrontUrl } from "../../helper/utils";
import { useToast } from "../../context/ToastContext";
import DialogWrapper from "../../wrappers/DialogWrapper";
import AddMembersModal from "../../components/chatInfoItems/AddMembersModal";
import { useSocket } from "../../context/SocketContext";

function ChatInfo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [chat, setChat] = useState(null);
  const [chatUsers, setChatUsers] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const currentUser = useSelector(selectUser);
  const { showToast } = useToast();
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [leaveGroupModal, setLeaveGroupModal] = useState(false);
  const [removeUserModal, setRemoveUserModal] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState("");
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [selectedProfileFile, setSelectedProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const { socket } = useSocket();
  useEffect(() => {
    if (showAddMembersModal) {
      getUsersForAddMembersModal();
    } else {
      setUsers([]);
    }
  }, [showAddMembersModal]);

  const handleChatUpdate = async (data) => {
    try {
      if (chat && currentUser.id === chat.groupAdminId) {
        const response = await updateChatById(chat?.id, data);
        if (response.status === 200) {
          showToast({
            title: "Chat updated successfully",
            type: "success",
          });
          dispatch(fetchChats(""));
        }

        await getChatInfoData(); // Refresh chat info
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

  const handleGroupNameEdit = () => {
    setIsEditingName(true);
    setEditedGroupName(chat.groupName || "");
  };

  const handleGroupNameSave = async () => {
    if (editedGroupName.trim() === "") {
      showToast({
        title: "Group name cannot be empty",
        type: "warning",
      });
      return;
    }

    if (editedGroupName.trim() === chat.groupName) {
      setIsEditingName(false);
      return;
    }
    const formData = new FormData();
    formData.append(
      "data",
      JSON.stringify({ groupName: editedGroupName.trim() })
    );

    await handleChatUpdate(formData);
    setIsEditingName(false);
  };

  const handleGroupNameCancel = () => {
    setIsEditingName(false);
    setEditedGroupName(chat.groupName || "");
  };

  const handleProfileFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        showToast({
          title: "File size too large",
          description: "Please select a file smaller than 5MB",
          type: "warning",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        showToast({
          title: "Invalid file type",
          description: "Please select an image file",
          type: "warning",
        });
        return;
      }

      setSelectedProfileFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setProfilePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    if (!selectedProfileFile) {
      showToast({
        title: "No file selected",
        type: "warning",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("groupProfile", selectedProfileFile);

      await handleChatUpdate(formData);
      setShowProfileEditModal(false);
      setSelectedProfileFile(null);
      setProfilePreview(null);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleProfileEditCancel = () => {
    setShowProfileEditModal(false);
    setSelectedProfileFile(null);
    setProfilePreview(null);
  };
  const getUsersForAddMembersModal = async () => {
    try {
      if (chat) {
        const response = await getMembersToAddGroupChatList(chat.id);
        if (response.status === 200) {
          setUsers(response.data.data);
        }
      }
    } catch (error) {
      console.log("Failed to get new users", error);
    }
  };
  const handleRemoveUser = async (userId) => {
    try {
      if (currentUser.id === chat.groupAdminId) {
        const response = await removeMemberFromGroupChat(chat.id, userId);

        if (response.status === 200) {
          await getChatInfoData();
          socket.emit("user-removed-from-group", userId, chat.id);
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

  const confirmRemoveUser = (user) => {
    setUserToRemove(user);
    setRemoveUserModal(true);
  };

  const executeRemoveUser = async () => {
    if (userToRemove) {
      await handleRemoveUser(userToRemove.id);
      setRemoveUserModal(false);
      setUserToRemove(null);
    }
  };

  const getChatWithUser = async (selectedUser) => {
    try {
      const userId = selectedUser.id;
      const response = await getChatOfSelectedUser(userId);
      if (response.status === 200) {
        const chat = response.data.chat;

        const chatBody = {
          ...chat,
          users: [currentUser, selectedUser],
          latestMessage: response.data.latestMessage || null,
        };
        dispatch(setSelectedChat(chatBody));
        navigate(`/chat/${chatBody.id}`, {
          isNewChat: false,
        });
      }
    } catch (error) {
      if (isAxiosError(error) && error.response.status === 404) {
        const chatBody = {
          // This line was removed from the new_code, so it's removed here.
          id: "new-chat",
          chatType: selectedUser.id === currentUser.id ? "self" : "one_to_one",
          groupName: null,
          groupProfile: null,
          latestMessage: null,
          users:
            selectedUser.id === currentUser.id
              ? [currentUser]
              : [currentUser, selectedUser],
        };
        dispatch(setSelectedChat(chatBody));
        navigate("/chat/new-chat", {
          state: {
            isNewChat: true,
          },
        });
      }
    }
  };
  const getChatInfoData = async () => {
    try {
      setLoading(true);
      if (id) {
        const response = await getChatInfo(id);
        if (response.status === 200) {
          setChat(response.data.chat);
          setChatUsers(response.data.users);
        }
      }
    } catch (error) {
      console.error("Failed to fetch chat info:", error);
      setChat(null);
      setChatUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getChatInfoData();
  }, [id]);

  useEffect(() => {
    if (chat) {
      setEditedGroupName(chat.groupName || "");
    }
  }, [chat]);

  const handleBackClick = () => {
    navigate(`/chat/${id}`);
  };

  const toggleUserSelection = (user) => {
    if (user.isPresentInGroup) return;
    if (selectedUsers.includes(user)) {
      setSelectedUsers(selectedUsers.filter((item) => item.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleAddNewMembers = async () => {
    try {
      if (chat && selectedUsers.length > 0) {
        const selectedUsersWithIds = selectedUsers.map((item) => item.id);

        const response = await addMembersToGroupChat(
          chat.id,
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

          setChatUsers((prev) => {
            return [...prev, ...newUsers];
          });
          showToast({
            title: "Members Added",
            description: "Added member(s) successfully!",
          });
          setShowAddMembersModal(false);
          setSelectedUsers([]);
          socket.emit("new-chat", newUsers);
        }
      }
    } catch (error) {
      console.log("Error adding new users", error);
    }
  };

  const handleLeaveGroupChat = async () => {
    try {
      if (chat) {
        const response = await leaveGroupChat(chat.id);
        if (response.status === 200) {
          setLeaveGroupModal(false);
          navigate("/chat");
        }
      } else {
        console.log("Invalid chat");
      }
    } catch (error) {
      console.log("Error ", error);
    }
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

  if (!chat) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Chat Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The chat you're looking for doesn't exist or you don't have access
            to it.
          </p>
          <button
            onClick={handleBackClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray">
      {/* Header with Back Button */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        </div>
      </div>

      {/* Chat Info Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Chat Header */}
          <div className="bg-white px-6 py-8 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="relative flex-shrink-0">
                <img
                  src={`${cloudFrontUrl}/${chat.groupProfile}` || groupProfile}
                  alt={`${chat.groupName || "Chat"} profile`}
                  className="w-24 h-24 rounded-full border-4 border-blue-200 shadow-lg object-cover"
                  onError={(e) => {
                    e.target.src = groupProfile;
                  }}
                />
                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2">
                  <Users size={16} />
                </div>
                {/* Profile Edit Button for Admin */}
                {currentUser.id === chat.groupAdminId && (
                  <button
                    onClick={() => setShowProfileEditModal(true)}
                    className="absolute -bottom-2 -left-2 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors cursor-pointer"
                    title="Edit group profile"
                  >
                    <Camera size={16} />
                  </button>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={editedGroupName}
                        onChange={(e) => setEditedGroupName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleGroupNameSave();
                          } else if (e.key === "Escape") {
                            handleGroupNameCancel();
                          }
                        }}
                        className="w-full text-2xl sm:text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600"
                        placeholder="Enter group name"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={handleGroupNameSave}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleGroupNameCancel}
                        className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
                      {chat.groupName || "Unnamed Chat"}
                    </h1>
                    {currentUser.id === chat.groupAdminId && (
                      <button
                        onClick={handleGroupNameEdit}
                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer flex-shrink-0"
                        title="Edit group name"
                      >
                        <Edit2 size={20} />
                      </button>
                    )}
                  </div>
                )}
                <p className="text-gray-600 text-lg mt-2">Group Chat</p>
              </div>
            </div>
          </div>

          <GroupMembersSection
            groupMembers={chatUsers}
            selectedChat={chat}
            setShowAddMembersModal={setShowAddMembersModal}
            handleRemoveUser={confirmRemoveUser}
            onChatWithUser={getChatWithUser}
          />
        </div>
        <div className="flex justify-end mb-4">
          <button
            className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white cursor-pointer rounded-md shadow"
            onClick={() => setLeaveGroupModal(true)}
          >
            Leave group
          </button>
        </div>
      </div>
      <DialogWrapper
        open={showAddMembersModal}
        onOpenChange={setShowAddMembersModal}
        title={"Add Members"}
      >
        <AddMembersModal
          users={users}
          selectedUsers={selectedUsers}
          toggleUserSelection={toggleUserSelection}
        />
        <div className="flex justify-end gap-4 mt-2">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer"
            onClick={() => setShowAddMembersModal(false)}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
              selectedUsers.length === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
            onClick={handleAddNewMembers}
            disabled={selectedUsers.length === 0}
          >
            Add
          </button>
        </div>
      </DialogWrapper>

      <DialogWrapper
        open={leaveGroupModal}
        onOpenChange={setLeaveGroupModal}
        title={"Leave Group"}
      >
        <div className="flex flex-col gap-4 flex-wrap">
          <div>
            <p>Are you sure you want to leave this group?</p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-800 cursor-pointer rounded-md"
              onClick={() => setLeaveGroupModal(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white cursor-pointer rounded-md"
              onClick={async () => {
                handleLeaveGroupChat();
              }}
            >
              Leave group
            </button>
          </div>
        </div>
      </DialogWrapper>

      {/* Remove User Confirmation Modal */}
      <DialogWrapper
        open={removeUserModal}
        onOpenChange={setRemoveUserModal}
        title={"Remove Member"}
      >
        <div className="flex flex-col gap-4 flex-wrap">
          <div>
            <p>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-gray-900">
                {userToRemove?.name}
              </span>{" "}
              from this group?
            </p>
            <p className="text-sm text-gray-600 mt-2">
              This action cannot be undone. The user will be removed from the
              group immediately.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-800 cursor-pointer rounded-md hover:bg-gray-300 transition-colors"
              onClick={() => {
                setRemoveUserModal(false);
                setUserToRemove(null);
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white cursor-pointer rounded-md transition-colors"
              onClick={executeRemoveUser}
            >
              Remove Member
            </button>
          </div>
        </div>
      </DialogWrapper>

      {/* Profile Edit Modal */}
      <DialogWrapper
        open={showProfileEditModal}
        onOpenChange={setShowProfileEditModal}
        title={"Edit Group Profile"}
      >
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <div className="relative inline-block">
              <img
                src={
                  profilePreview ||
                  `${cloudFrontUrl}/${chat.groupProfile}` ||
                  groupProfile
                }
                alt="Group profile preview"
                className="w-32 h-32 rounded-full border-4 border-blue-200 shadow-lg object-cover"
                onError={(e) => {
                  e.target.src = groupProfile;
                }}
              />
              <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 transition-colors cursor-pointer">
                <Camera size={20} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileFileSelect}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              Click the camera icon to select a new profile picture
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: JPG, PNG, GIF (Max size: 5MB)
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-800 cursor-pointer rounded-md hover:bg-gray-300 transition-colors"
              onClick={handleProfileEditCancel}
            >
              Cancel
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                selectedProfileFile
                  ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
              onClick={handleProfileUpdate}
              disabled={!selectedProfileFile}
            >
              Update Profile
            </button>
          </div>
        </div>
      </DialogWrapper>
    </div>
  );
}

export default ChatInfo;
