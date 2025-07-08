import React, { useEffect, useState } from "react";
import defaultProfile from "../../assets/default-profile.png";
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
  onRenameGroup,
  onChatWithUser,
}) {
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [leaveGroupModal, setLeaveGroupModal] = useState(false);

  const [viewAll, setViewAll] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);

  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [newGroupName, setNewGroupName] = useState(chatName);

  const isGroupAdmin =
    isGroup &&
    currentUser &&
    selectedChat &&
    selectedChat.groupAdminId === currentUser.id;

  const handleGroupNameSave = () => {
    if (newGroupName.trim() && newGroupName !== chatName) {
      if (typeof onRenameGroup === "function") {
        onRenameGroup({
          groupName: newGroupName,
        });
      }
    }
    setIsEditingGroupName(false);
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
  }, [selectedChat, chatName]);

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
    <div className="p-4">
      <button
        onClick={onBackClick}
        className="mr-2 p-1 rounded hover:bg-gray-100 flex-shrink-0 cursor-pointer"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="flex flex-col items-center gap-1.5 mb-4 px-4">
        {/* Profile image */}
        <img
          src={profileURL || defaultProfile}
          alt={chatName || "Profile"}
          className="w-24 h-24 rounded-full object-cover border border-gray-200 mb-2"
          onError={(e) => {
            e.target.src = defaultProfile;
          }}
        />

        {/* Group name with rename UI */}
        {isGroup && isEditingGroupName ? (
          <div className="flex items-center gap-4 w-full">
            <input
              className="text-lg font-semibold mb-2 border rounded-lg px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-300"
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
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">
              {chatName}
            </h2>
            {isGroupAdmin && (
              <button
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                onClick={() => setIsEditingGroupName(true)}
                title="Rename group"
                type="button"
              >
                <Pencil size={18} className="text-gray-600" />
              </button>
            )}
          </div>
        )}

        {/* Group members list */}
        {isGroup && (
          <GroupMembersSection
            currentUser={currentUser}
            groupMembers={groupMembers}
            selectedChat={selectedChat}
            setShowAddMembersModal={setShowAddMembersModal}
            handleRemoveUser={handleRemoveUser}
            onChatWithUser={onChatWithUser}
          />
        )}
      </div>
      {isGroup && (
        <div className="flex justify-end mx-5">
          <button
            className="px-4 py-2 text-sm font-medium bg-destructive text-white cursor-pointer rounded-md"
            onClick={() => setLeaveGroupModal(true)}
          >
            Leave group
          </button>
        </div>
      )}
      {!isGroup && userDetails && (
        <div className="bg-white rounded-lg shadow-md p-6 w-full flex flex-col items-start space-y-4 mx-2">
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
          {/* Cancel Button */}
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 cursor-pointer"
            onClick={() => setShowAddMembersModal(false)}
          >
            Cancel
          </button>

          {/* Add Button */}
          <button
            className={`px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
              selectedUsers.length === 0
                ? "bg-gray-300 cursor-not-allowed" // Disabled state
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
            onClick={handleAddMembersSubmit}
            disabled={selectedUsers.length === 0} // Disable if no users selected
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
              className="px-4 py-2 text-sm font-medium bg-destructive text-white cursor-pointer rounded-md"
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
