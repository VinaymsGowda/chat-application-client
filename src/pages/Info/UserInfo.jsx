import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchUserById } from "../../services/userService";
import defaultProfile from "../../assets/default-profile.png";
import { ArrowLeft } from "lucide-react";
import { cloudFrontUrl } from "../../helper/utils";

function UserInfo() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getUserInfo = async () => {
    try {
      setLoading(true);
      if (userId) {
        const response = await fetchUserById(userId);
        if (response.status === 200) {
          setUser(response.data.user);
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserInfo();
  }, [userId]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            User Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The user you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft />
            Back
          </button>
        </div>
      </div>

      {/* User Info Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Profile Header */}
          <div className="bg-white px-6 py-8 border-b border-gray-200">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <img
                  src={
                    user?.profileURL
                      ? `${cloudFrontUrl}/${user.profileURL}`
                      : defaultProfile
                  }
                  alt={`${user.name}'s profile`}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                  onError={(e) => {
                    e.target.src = defaultProfile;
                  }}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {user.name}
                </h1>
                <p className="text-gray-600 text-lg">{user.email}</p>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Full Name
                  </h3>
                  <p className="mt-1 text-lg text-gray-900">{user.name}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Email Address
                  </h3>
                  <p className="mt-1 text-lg text-gray-900">{user.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Member Since
                  </h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserInfo;
