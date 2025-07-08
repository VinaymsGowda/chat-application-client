import axiosInstance from "./Interceptor";

export const getAllChats = async (searchQuery) => {
  const response = await axiosInstance.get("/api/chat", {
    params: { searchQuery: searchQuery },
  });
  return response;
};

export const searchChatsOfUser = async (searchQuery) => {
  const response = await axiosInstance.get("/api/chat/search-chat", {
    params: {
      query: searchQuery,
    },
  });
  return response;
};

export const getMessagesByChatId = async (chatId) => {
  const response = await axiosInstance.get(`/api/message/${chatId}`);
  return response;
};

export const createGroupChat = async (data) => {
  const response = await axiosInstance.post("/api/chat/group-chat", data);
  return response;
};

export const leaveGroupChat = async (chatId) => {
  const response = await axiosInstance.delete(`/api/chat/group-chat/${chatId}`);
  return response;
};

export const getMembersToAddGroupChatList = async (chatId) => {
  const response = await axiosInstance.get(
    `/api/chat/group-chat/new-users-list/${chatId}`
  );
  return response;
};

export const addMembersToGroupChat = async (chatId, userIds) => {
  const response = await axiosInstance.post(
    `/api/chat/group-chat/add-users/${chatId}`,
    userIds
  );
  return response;
};

export const removeMemberFromGroupChat = async (chatId, userId) => {
  const response = await axiosInstance.delete(
    `/api/chat/group-chat/remove-user/${chatId}/${userId}`
  );
  return response;
};

export const updateChatById = async (chatId, data) => {
  const response = await axiosInstance.patch(
    `/api/chat/group-chat/${chatId}`,
    data
  );
  return response;
};

export const getChatOfSelectedUser = async (userId) => {
  const response = await axiosInstance.get(`/api/chat/user/${userId}`);
  return response;
};
