import React, { useEffect, useState } from "react";
import defaultProfile from "../../assets/default-profile.png";
import { Pencil } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { cloudFrontUrl } from "../../helper/utils";

function ProfileModal({
  editUser,
  setEditUser,
  handleProfileSave,
  handleProfileClose,
}) {
  const [pendingName, setPendingName] = useState(editUser?.name || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);

  useEffect(() => {
    return () => {
      if (previewSrc) URL.revokeObjectURL(previewSrc);
    };
  }, [previewSrc]);

  const onPickProfile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    setPreviewSrc(url);
  };

  const onSaveProfile = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("profileURL", selectedFile);

    await handleProfileSave(formData);

    if (previewSrc) URL.revokeObjectURL(previewSrc);
    setPreviewSrc(null);
    setSelectedFile(null);
  };

  const onCancelProfile = () => {
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    setPreviewSrc(null);
    setSelectedFile(null);
    handleProfileClose();
  };

  const onSaveName = async () => {
    setEditUser((prev) => ({ ...prev, name: pendingName }));
    const formData = new FormData();
    formData.append(
      "data",
      JSON.stringify({
        name: pendingName,
      })
    );
    await handleProfileSave(formData);
  };

  const onCancelName = () => {
    setPendingName(editUser?.name || "");
    handleProfileClose();
  };

  const imageSrc =
    previewSrc ||
    (editUser?.profileURL
      ? `${cloudFrontUrl}/${editUser.profileURL}`
      : defaultProfile);

  return (
    <div className="space-y-6">
      {/* Profile Picture Section */}
      <div className="flex flex-col items-center">
        <div className="relative group">
          <img
            src={imageSrc}
            alt={editUser?.name || "Profile"}
            className="w-24 h-24 rounded-full object-cover border border-gray-200 shadow-sm"
            onError={(e) => {
              e.currentTarget.src = defaultProfile;
            }}
          />
          {/* Hover overlay on avatar */}
          <label
            htmlFor="profile-upload"
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            Change
          </label>
        </div>
        <input
          id="profile-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickProfile}
        />

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            onClick={onCancelProfile}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
            onClick={onSaveProfile}
            disabled={!selectedFile}
          >
            Save
          </button>
        </div>
      </div>

      {/* Name Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <div className="relative">
          <input
            type="text"
            name="name"
            value={pendingName}
            onChange={(e) => setPendingName(e.target.value)}
            className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Pencil size={16} className="absolute right-3 top-3 text-gray-400" />
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            onClick={onCancelName}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
            onClick={onSaveName}
            disabled={pendingName.trim() === (editUser?.name || "").trim()}
          >
            Save
          </button>
        </div>
      </div>

      {/* Email Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={editUser?.email || ""}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
          disabled
        />
      </div>

      {/* Close Modal Footer */}
      <div className="flex justify-end pt-2">
        <Dialog.Close asChild>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Close
          </button>
        </Dialog.Close>
      </div>
    </div>
  );
}

export default ProfileModal;
