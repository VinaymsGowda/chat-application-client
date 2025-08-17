import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllChats } from "../../../services/chatServices";

// Async thunk for fetching chats
export const fetchChats = createAsyncThunk(
  "chat/fetchChats",
  async (searchQuery) => {
    try {
      const res = await getAllChats(searchQuery);
      if (res.status === 200) {
        return {
          chats: res.data.chats || [],
          otherUsers: res.data.otherUsers || [],
        };
      }
      throw new Error("Failed to fetch chats");
    } catch (err) {
      console.error("Failed to load chats:", err);
      throw err;
    }
  }
);

const initialState = {
  selectedChat: null,
  chats: [],
  otherUsers: [],
  searchQuery: "",
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setSelectedChat: (state, action) => {
      state.selectedChat = action.payload;
    },
    setChats: (state, action) => {
      state.chats = action.payload;
    },
    setOtherUsers: (state, action) => {
      state.otherUsers = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    clearChats: (state) => {
      state.chats = [];
      state.otherUsers = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload.chats;
        state.otherUsers = action.payload.otherUsers;
        state.error = null;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const {
  setSelectedChat,
  setChats,
  setOtherUsers,
  setSearchQuery,
  clearChats,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;

// Selectors
export const selectSelectedChat = (state) => state.chat.selectedChat;
export const selectChats = (state) => state.chat.chats;
export const selectOtherUsers = (state) => state.chat.otherUsers;
export const selectSearchQuery = (state) => state.chat.searchQuery;
export const selectChatsLoading = (state) => state.chat.loading;
export const selectChatsError = (state) => state.chat.error;
