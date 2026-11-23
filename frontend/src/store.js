
import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./services/apiSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

// Clear cached API data when authentication changes
let previousToken = localStorage.getItem("token");

const syncAuthCache = () => {
  const currentToken = localStorage.getItem("token");

  if (currentToken !== previousToken) {
    previousToken = currentToken;

    store.dispatch(
      apiSlice.util.resetApiState()
    );
  }
};

// Login, registration, Discord callback, and logout
window.addEventListener(
  "gameportal-auth-change",
  syncAuthCache
);

// Synchronize accounts across browser tabs
window.addEventListener(
  "storage",
  (event) => {
    if (event.key === "token" || event.key === null) {
      syncAuthCache();
    }
  }
);
