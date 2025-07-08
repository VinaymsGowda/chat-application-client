import React from "react";

function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Profile Page
          </h1>
          <p className="text-gray-600 mb-6">
            This is a dummy profile page. Profile functionality will be
            implemented here.
          </p>
          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-500">
              Profile settings, user information, and account management will be
              added here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
