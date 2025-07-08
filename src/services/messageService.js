import axiosInstance from "./Interceptor";

export const sendMessageService = async (data) => {
  const response = await axiosInstance.post("/api/message/send-message", data);
  return response;
};
