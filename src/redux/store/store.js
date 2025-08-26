import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import userReducer from "../features/Auth/User.js";
import chatReducer from "../features/Chat/Chat.js";

// Configure persistence for user slice
const userPersistConfig = {
  key: "user",
  storage,
  whitelist: ["user", "isAuthenticated"],
};

const persistedUserReducer = persistReducer(userPersistConfig, userReducer);
const persistChatReducer = persistReducer(
  {
    key: "chat",
    storage,
  },
  chatReducer
);

export const store = configureStore({
  reducer: {
    user: persistedUserReducer,
    chat: persistChatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export default store;
