import React, { useEffect, useState } from "react";
import defaultProfile from "../../assets/default-profile.png";
import groupProfile from "../../assets/group-profile.png";
import { ArrowLeft, MessageCircle, Pencil, UserPlus } from "lucide-react";
import DialogWrapper from "../../wrappers/DialogWrapper";
import { getMembersToAddGroupChatList } from "../../services/chatServices";
import AddMembersModal from "./AddMembersModal";
import GroupMembersSection from "./GroupMembersSection";
import { getOtherUser } from "../../helper/utils";

function ChatInfoWindow({
  chatName,
  profileURL,
  isGroup,
  groupMembers,
  currentUser,
  selectedChat,

  onBackClick,
  handleLeaveGroup,
  handleAddNewMembers,
  handleRemoveUser,
  handleChatUpdate,
  onChatWithUser,
}) {
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [leaveGroupModal, setLeaveGroupModal] = useState(false);

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);

  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [newGroupName, setNewGroupName] = useState(chatName);
  // Group profile photo edit states
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [groupPhotoFile, setGroupPhotoFile] = useState(null);
  const [groupPhotoPreview, setGroupPhotoPreview] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const isGroupAdmin =
    isGroup &&
    currentUser &&
    selectedChat &&
    selectedChat.groupAdminId === currentUser.id;

  // Handle group name save
  const handleGroupNameSave = async () => {
    if (newGroupName.trim() && newGroupName !== chatName) {
      const formData = new FormData();

      formData.append("data", JSON.stringify({ groupName: newGroupName }));
      await handleChatUpdate(formData);
    }
    setIsEditingGroupName(false);
  };

  // Handle group profile photo change
  const handleGroupPhotoChange = (e) => {
    const file = e.target.files[0];
    setGroupPhotoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setGroupPhotoPreview(null);
    }
  };

  // Save new group photo
  const handleGroupPhotoSave = async () => {
    if (!groupPhotoFile) return;
    setPhotoLoading(true);
    try {
      const formData = new FormData();
      formData.append("groupProfile", groupPhotoFile);
      await handleChatUpdate(formData);

      setIsEditingPhoto(false);
      setGroupPhotoFile(null);
      setGroupPhotoPreview(null);
    } finally {
      setPhotoLoading(false);
    }
  };

  const toggleUserSelection = (user) => {
    if (selectedUsers.includes(user)) {
      setSelectedUsers(selectedUsers.filter((item) => item.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const getUsersForAddMembersModal = async () => {
    try {
      if (selectedChat) {
        const response = await getMembersToAddGroupChatList(selectedChat.id);
        if (response.status === 200) {
          setUsers(response.data.data);
          console.log("Users ", response.data.data);
        }
      } else {
        console.log("no chat selected");
      }
    } catch (error) {
      console.log("Failed to get new users", error);
    }
  };

  useEffect(() => {
    setIsEditingGroupName(false);
    setNewGroupName(chatName);
    setIsEditingPhoto(false);
    setGroupPhotoFile(null);
    setGroupPhotoPreview(null);
  }, [selectedChat, chatName, profileURL]);

  useEffect(() => {
    if (showAddMembersModal) {
      getUsersForAddMembersModal();
    } else {
      setUsers([]);
    }
  }, [showAddMembersModal]);

  const handleAddMembersSubmit = async () => {
    await handleAddNewMembers(selectedUsers);
    setShowAddMembersModal(false);
    setSelectedUsers([]);
  };

  const userDetails = getOtherUser(selectedChat, currentUser);
  return (
    <div className="p-4 bg-white shadow-xl h-full w-full overflow-y-auto">
      <button
        onClick={onBackClick}
        className="mb-4 p-2 rounded-full hover:bg-indigo-100 transition flex items-center"
      >
        <ArrowLeft size={22} className="text-indigo-500" />
        <span className="ml-2 text-indigo-700 font-medium">Back</span>
      </button>
      <div className="flex flex-col items-center gap-3 mb-6 relative w-full">
        {/* Profile image with edit overlay for group admin */}
        <div className="relative group w-32 h-32 mb-2">
          <img
            src={groupPhotoPreview || profileURL}
            alt={chatName || "Profile"}
            className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200 shadow-lg transition-all duration-200 group-hover:brightness-90"
            onError={(e) => {
              e.target.src = isGroup ? groupProfile : defaultProfile;
            }}
          />
          {isGroup && isGroupAdmin && !isEditingPhoto && (
            <button
              className="absolute bottom-2 right-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 shadow-md border-2 border-white transition-all opacity-90 group-hover:opacity-100"
              onClick={() => setIsEditingPhoto(true)}
              title="Edit group photo"
              type="button"
            >
              <Pencil size={20} />
            </button>
          )}
          {isEditingPhoto && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-full z-10">
              <input
                id="groupPhotoUpload"
                type="file"
                accept="image/*"
                onChange={handleGroupPhotoChange}
                className="hidden"
              />
              <label
                htmlFor="groupPhotoUpload"
                className="bg-white text-indigo-600 px-3 py-1 rounded-lg cursor-pointer font-medium mb-2 shadow"
              >
                Choose Photo
              </label>
              <div className="flex gap-2 mt-2">
                <button
                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
                  onClick={handleGroupPhotoSave}
                  disabled={!groupPhotoFile || photoLoading}
                  type="button"
                >
                  {photoLoading ? "Saving..." : "Save"}
                </button>
                <button
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                  onClick={() => {
                    setIsEditingPhoto(false);
                    setGroupPhotoFile(null);
                    setGroupPhotoPreview(null);
                  }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Group name with rename UI */}
        {isGroup && isEditingGroupName ? (
          <div className="flex items-center gap-4 w-full justify-center">
            <input
              className="text-xl font-semibold border rounded-lg px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-center"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              autoFocus
            />
            <button
              className="text-white bg-indigo-600 hover:bg-indigo-700 font-medium px-4 py-2 rounded-lg transition-colors"
              onClick={handleGroupNameSave}
              type="button"
            >
              Save
            </button>
            <button
              className="text-gray-500 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
              onClick={() => {
                setIsEditingGroupName(false);
                setNewGroupName(chatName);
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 justify-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-1 text-center">
              {chatName}
            </h2>
            {isGroupAdmin && (
              <button
                className="p-2 hover:bg-indigo-100 rounded-full transition-all"
                onClick={() => setIsEditingGroupName(true)}
                title="Rename group"
                type="button"
              >
                <Pencil size={20} className="text-indigo-600" />
              </button>
            )}
          </div>
        )}
        {/* Group members list */}
        {isGroup && (
          <div className="w-full mt-4 px-0">
            <GroupMembersSection
              currentUser={currentUser}
              groupMembers={groupMembers}
              selectedChat={selectedChat}
              setShowAddMembersModal={setShowAddMembersModal}
              handleRemoveUser={handleRemoveUser}
              onChatWithUser={onChatWithUser}
              isGroupAdmin={isGroupAdmin}
            />
          </div>
        )}
      </div>
      {isGroup && (
        <div className="flex justify-end mb-4">
          <button
            className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white cursor-pointer rounded-md shadow"
            onClick={() => setLeaveGroupModal(true)}
          >
            Leave group
          </button>
        </div>
      )}
      {!isGroup && userDetails && (
        <div className="bg-white rounded-lg shadow-md p-6 w-full flex flex-col items-start space-y-4">
          <div className="flex flex-col space-y-2">
            <span className="text-sm text-gray-500 uppercase tracking-wider">
              User name
            </span>
            <h1 className="text-2xl font-semibold text-gray-800">
              {userDetails.name} {currentUser.id === userDetails.id && " (You)"}
            </h1>
          </div>
          <p className="text-gray-600 text-base">{userDetails.email}</p>
        </div>
      )}
      {/* Add Members Modal */}
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
            onClick={handleAddMembersSubmit}
            disabled={selectedUsers.length === 0}
          >
            Add
          </button>
        </div>
      </DialogWrapper>
      {/* Leave Group Modal */}
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
                handleLeaveGroup();
                setLeaveGroupModal(false);
              }}
            >
              Leave group
            </button>
          </div>
        </div>
      </DialogWrapper>
    </div>
  );
}

export default ChatInfoWindow;
