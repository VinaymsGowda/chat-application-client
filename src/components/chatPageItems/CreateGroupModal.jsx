import React, { useEffect, useState } from "react";
import defaultProfile from "../../assets/default-profile.png";
import * as Dialog from "@radix-ui/react-dialog";

function CreateGroupModal({
  open,
  onOpenChange,
  createGroupErrorMessage,
  setCreateGroupErrorMessage,
  handleCreateGroupChat,
  users,
  onClose,
  createGroupUserSearch,
  setCreateGroupUserSearch,
}) {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupProfile, setGroupProfile] = useState(null);
  const [groupProfilePreview, setGroupProfilePreview] = useState(null);

  const handleGroupProfileChange = (e) => {
    const file = e.target.files[0];
    setGroupProfile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setGroupProfilePreview(null);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!groupName.trim()) {
      setCreateGroupErrorMessage("Please enter a group name");
      return;
    }

    if (selectedUsers.length < 1) {
      setCreateGroupErrorMessage("Please select at least one user");
      return;
    }

    handleCreateGroupChat(groupName, selectedUsers, groupProfile);
  };

  useEffect(() => {
    console.log("Selected users ", selectedUsers);
  }, [selectedUsers]);

  const toggleUserSelection = (user) => {
    if (selectedUsers.includes(user)) {
      setSelectedUsers(selectedUsers.filter((item) => item.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50 px-2" />
        <Dialog.Content className="fixed z-50 w-full max-w-[80%] bg-white p-4 md:p-8 rounded-lg shadow-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-bold mb-6 flex items-center gap-2">
            Create Group Chat
          </Dialog.Title>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left half: group name, profile, error, preview */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col gap-4"
            >
              {createGroupErrorMessage && (
                <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {createGroupErrorMessage}
                </div>
              )}
              <div>
                <label
                  htmlFor="groupName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Group Name
                </label>
                <input
                  type="text"
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Profile Photo (optional)
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <img
                      src={groupProfilePreview || defaultProfile}
                      alt="Group Profile Preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-indigo-300 shadow-sm"
                    />
                    <label
                      htmlFor="groupProfileUpload"
                      className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-1 cursor-pointer shadow-md border-2 border-white"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2a2.828 2.828 0 11-4-4 2.828 2.828 0 014 4z"
                        />
                      </svg>
                      <input
                        id="groupProfileUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleGroupProfileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <span className="text-xs text-gray-500">
                    JPG, PNG, or GIF. Max 2MB.
                  </span>
                </div>
                {groupProfile && (
                  <span className="text-xs text-green-600 mt-1 block">
                    {groupProfile.name}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Create group
                </button>
              </div>
            </form>
            {/* Right half: user search and list */}
            <div className="flex-1 flex flex-col gap-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Participants
              </label>
              <input
                type="search"
                placeholder="Search users..."
                value={createGroupUserSearch}
                onChange={(e) => setCreateGroupUserSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
              />
              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg divide-y">
                {users.length === 0 && (
                  <div className="p-3 text-gray-500">User not found</div>
                )}
                {users.map((user) => {
                  const isSelected = selectedUsers.some(
                    (u) => u.id === user.id
                  );
                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleUserSelection(user)}
                      className={`p-3 flex items-center cursor-pointer hover:bg-gray-50 ${
                        isSelected ? "bg-indigo-50" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="h-4 w-4 text-indigo-600 rounded mr-3"
                      />
                      <img
                        src={user?.profileURL || defaultProfile}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover mr-3"
                      />
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default CreateGroupModal;
