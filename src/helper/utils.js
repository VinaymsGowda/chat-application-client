export const getOtherUser = (chat, currentUser) => {
  if (chat.chatType === "self" && chat.users && currentUser) {
    return chat.users[0];
  }
  if (chat.chatType === "one_to_one" && chat.users && currentUser) {
    return chat.users.find((user) => user.id !== currentUser.id);
  }
  return null;
};
