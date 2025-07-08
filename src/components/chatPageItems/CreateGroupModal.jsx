import React, { useEffect, useState } from "react";
import defaultProfile from "../../assets/default-profile.png";

function CreateGroupModal({
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

    handleCreateGroupChat(groupName, selectedUsers);
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
    <div>
      {" "}
      {createGroupErrorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {createGroupErrorMessage}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="groupName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Group name
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

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add participants
          </label>

          <div className="mb-2">
            <input
              type="search"
              placeholder="Search users..."
              value={createGroupUserSearch}
              onChange={(e) => setCreateGroupUserSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y">
            {users.length === 0 && "User not found"}
            {users.map((user) => {
              const isSelected = selectedUsers.some((u) => u.id === user.id);
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

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
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
    </div>
  );
}

export default CreateGroupModal;
