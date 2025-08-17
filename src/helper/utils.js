export const getOtherUser = (chat, currentUser) => {
  if (chat.chatType === "self" && chat.users && currentUser) {
    return chat.users[0];
  }
  if (chat.chatType === "one_to_one" && chat.users && currentUser) {
    return chat.users.find((user) => user.id !== currentUser.id);
  }
  return null;
};

export const cloudFrontUrl = import.meta.env.VITE_CLOUD_FRONT_URL;
