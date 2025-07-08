import { createSlice } from "@reduxjs/toolkit";
import { REHYDRATE } from "redux-persist";

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearUser: (state) => {
      localStorage.removeItem("token");
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setUser,
  clearUser,

  setLoading,
  setError,
  clearError,
} = userSlice.actions;

// Selectors
export const selectUser = (state) => state?.user?.user || null;
export const selectIsAuthenticated = (state) => {
  const token = localStorage.getItem("token");

  return state?.user?.isAuthenticated && token ? true : false;
};
export const selectUserLoading = (state) => state?.user?.loading || false;
export const selectUserError = (state) => state?.user?.error || null;

export default userSlice.reducer;
