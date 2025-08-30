import axiosInstance from "./Interceptor";

export const createUser = async (userData) => {
  const response = await axiosInstance.post("/api/auth/signup", userData);
  return response;
};

export const handleGooogleAuth = async (userData) => {
  const response = await axiosInstance.post("/api/auth/google-auth", userData);
  return response;
};

export const searchUsers = async (query, isGroup = false) => {
  const response = await axiosInstance.get("/api/users/", {
    params: {
      query: query,
      isGroup: isGroup,
    },
  });
  return response;
};

export const fetchUserByAuthProviderId = async (authProviderId) => {
  const response = await axiosInstance.get(`/api/auth/${authProviderId}`);
  return response;
};

export const updateUser = async (data, id) => {
  const response = await axiosInstance.patch(`/api/users/${id}`, data);
  return response;
};

export const fetchUserById = async (id) => {
  const response = await axiosInstance.get(`/api/users/${id}`);
  return response;
};
