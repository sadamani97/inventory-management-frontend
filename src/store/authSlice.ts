import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type AuthUser = {
  firstname: string;
  lastname: string;
  email: string;
};

export type AuthState = {
  user: AuthUser | null;
  token?: string;
  message?: string;
  error?: string;
};

const initialState: AuthState = {
  user: null,
  token: undefined,
  message: undefined,
  error: undefined,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthUser(state, action: PayloadAction<{ user: AuthUser; token?: string; message?: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.message = action.payload.message;
      state.error = undefined;
    },
    setAuthError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.message = undefined;
    },
    clearAuth(state) {
      state.user = null;
      state.token = undefined;
      state.message = undefined;
      state.error = undefined;
    },
  },
});

export const { setAuthUser, setAuthError, clearAuth } = authSlice.actions;
export default authSlice.reducer;
