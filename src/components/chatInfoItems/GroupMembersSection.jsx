import React, { useState, useEffect } from "react";
import defaultProfile from "../../assets/default-profile.png";
import { UserPlus, UserMinus } from "lucide-react";
import { MessageCircle } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/features/Auth/User";
import { cloudFrontUrl } from "../../helper/utils";

const GroupMembersSection = ({
  groupMembers,

  selectedChat,
  setShowAddMembersModal,
  handleRemoveUser,
  onChatWithUser,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMembers, setFilteredMembers] = useState(groupMembers);
  const [viewAll, setViewAll] = useState(false);
  const { showToast } = useToast();
  const currentUser = useSelector(selectUser);
  const isGroupAdmin =
    currentUser && selectedChat && selectedChat.groupAdminId === currentUser.id;

  // Filter the group members based on the search query
  useEffect(() => {
    if (searchQuery === "") {
      setFilteredMembers(groupMembers);
    } else {
      setFilteredMembers(
        groupMembers.filter((member) =>
          member.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, groupMembers]);

  // Determine the visible members based on "View All" state
  const visibleMembers = searchQuery
    ? filteredMembers // Show all filtered members if there's a search query
    : viewAll
    ? filteredMembers // Show all if "View All" is toggled
    : filteredMembers.slice(0, 5); // Default to showing 5 members if no search
  return (
    <div className="w-full   shadow-sm p-4 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          Group Members{" "}
          <span className="font-normal text-gray-400">
            ({filteredMembers.length})
          </span>
        </h3>
        {isGroupAdmin && (
          <button
            className="flex items-center cursor-pointer gap-1 px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition"
            onClick={() => {
              if (!isGroupAdmin) {
                showToast({
                  type: "warning",
                  title: "Only group admins can add new members",
                });
                return;
              }
              setShowAddMembersModal(true);
            }}
          >
            <UserPlus size={16} /> Add Members
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search Members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Member List */}
      <ul className="max-h-64 overflow-y-auto pr-1">
        {visibleMembers.map((member, idx) => (
          <React.Fragment key={member.id}>
            <li className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg transition group">
              <div className="flex items-center gap-3">
                <img
                  src={
                    member?.profileURL
                      ? `${cloudFrontUrl}/${member.profileURL}`
                      : defaultProfile
                  }
                  alt={member.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  onError={(e) => {
                    e.target.src = defaultProfile;
                  }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      {member.name}
                      {currentUser.id === member.id && (
                        <span className="text-xs text-gray-400 ml-1">
                          (You)
                        </span>
                      )}
                    </p>
                    {selectedChat.groupAdminId === member.id && (
                      <span className="text-[10px] px-2 py-0.5 bg-yellow-300 text-yellow-900 rounded-full font-bold border border-yellow-400">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
              </div>
              {/* Chat and Remove buttons */}
              <div className="flex items-center gap-2">
                <button
                  className="ml-2 px-2 py-1 cursor-pointer text-xs font-medium bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition flex items-center gap-1"
                  title="Chat with user"
                  onClick={() => onChatWithUser && onChatWithUser(member)}
                >
                  <MessageCircle size={16} className="text-indigo-500" /> Chat
                </button>
                {selectedChat.groupAdminId === currentUser.id &&
                  member.id !== selectedChat.groupAdminId && (
                    <button
                      className="ml-2 px-2 py-1 cursor-pointer text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 transition flex items-center gap-1"
                      title="Remove user"
                      onClick={() => {
                        if (!isGroupAdmin) {
                          showToast({
                            type: "warning",
                            title: "Only group admins can add new members",
                          });
                          return;
                        }
                        handleRemoveUser(member);
                      }}
                    >
                      <UserMinus size={14} className="text-red-500" /> Remove
                    </button>
                  )}
              </div>
            </li>
            {idx !== visibleMembers.length - 1 && (
              <hr className="border-t border-gray-100 mx-2" />
            )}
          </React.Fragment>
        ))}
      </ul>

      {/* View More / View Less */}

      {!searchQuery && (
        <div className="flex justify-center mt-2">
          <button
            onClick={() => setViewAll(!viewAll)}
            className="text-xs text-blue-600 hover:underline focus:outline-none transition-all cursor-pointer"
          >
            {viewAll ? "View less" : `View all (${filteredMembers.length})`}
          </button>
        </div>
      )}
    </div>
  );
};

export default GroupMembersSection;
