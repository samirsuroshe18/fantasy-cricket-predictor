import { configureStore } from '@reduxjs/toolkit';
import authSlice from "../slices/authSlice.js";
import toastSlice from "../slices/toastSlice.js";

const store = configureStore({
    reducer: {
        auth: authSlice,
        toast: toastSlice,
    }
});

export default store;
