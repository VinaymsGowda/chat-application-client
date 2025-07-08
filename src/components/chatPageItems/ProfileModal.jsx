import React from "react";
import defaultProfile from "../../assets/default-profile.png";
import { Pencil } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

function ProfileModal({
  editUser,
  setEditUser,
  handleProfileSave,
  handleProfileClose,
}) {
  const handleProfileChange = (e) => {
    setEditUser({ ...editUser, [e.target.name]: e.target.value });
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleProfileSave();
      }}
    >
      <div className="flex flex-col items-center mb-4">
        <img
          src={editUser.profileURL || defaultProfile}
          alt={editUser.name || "Profile"}
          className="w-20 h-20 rounded-full object-cover border border-gray-200 mb-2"
          onError={(e) => {
            e.target.src = defaultProfile;
          }}
        />
        <div className="text-gray-700 font-semibold text-lg">
          {editUser.name}
        </div>
        <div className="text-gray-500 text-sm">{editUser.email}</div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <div className="relative">
          <input
            type="text"
            name="name"
            value={editUser.name || ""}
            onChange={handleProfileChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Pencil size={16} className="absolute right-3 top-3 text-gray-400" />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={editUser.email || ""}
          onChange={handleProfileChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled
        />
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Dialog.Close asChild>
          <button
            type="button"
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
            onClick={handleProfileClose}
          >
            Cancel
          </button>
        </Dialog.Close>
        <button
          type="submit"
          className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Save
        </button>
      </div>
    </form>
  );
}

export default ProfileModal;
