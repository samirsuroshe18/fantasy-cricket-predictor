import { createSlice } from "@reduxjs/toolkit";

// status: "checking" until the server has said who is logged in, then "in" or "out"
const initialState = {
    status: "checking",
    user: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loggedIn: (state, action) => {
            state.status = "in";
            state.user = action.payload;
        },
        loggedOut: (state) => {
            state.status = "out";
            state.user = null;
        },
    },
});

export const { loggedIn, loggedOut } = authSlice.actions;
export default authSlice.reducer;
