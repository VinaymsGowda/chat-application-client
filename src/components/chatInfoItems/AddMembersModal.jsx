import React, { useState } from "react";
import defaultProfile from "../../assets/default-profile.png";
import { cloudFrontUrl } from "../../helper/utils";

function AddMembersModal({
  users = [],
  selectedUsers = [],
  toggleUserSelection,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered users based on search query
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 max-h-[70vh] overflow-y-auto border border-gray-200 rounded-lg divide-y">
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search Users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* No users found message */}
      {filteredUsers.length === 0 && (
        <div className="text-center text-gray-500">User not found</div>
      )}

      {/* Users List */}
      {filteredUsers.map((user) => {
        const isSelected = selectedUsers.some((u) => u.id === user.id);

        return (
          <div
            key={user.id}
            onClick={() => toggleUserSelection(user)}
            className={`p-3 flex items-center cursor-pointer hover:bg-gray-50 ${
              isSelected ? "bg-indigo-50" : ""
            }`}
          >
            {/* Checkbox for non-group members */}
            {!user.isPresentInGroup && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}}
                className="h-4 w-4 text-indigo-600 rounded mr-3"
              />
            )}

            {/* Profile Picture */}
            <img
              src={
                user?.profileURL
                  ? `${cloudFrontUrl}/${user.profileURL}`
                  : defaultProfile
              }
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover mr-3"
            />

            {/* User Info */}
            <div className="flex-1">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
              {user.isPresentInGroup && (
                <p className="text-xs text-gray-400 mt-1">Already in group</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AddMembersModal;
