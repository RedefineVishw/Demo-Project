import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'

// In-memory only, by design: no persistence middleware, no localStorage/
// sessionStorage sync. A page refresh resets the store to initialState and
// sends the user back to the login page — that's expected behavior.
export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
})
