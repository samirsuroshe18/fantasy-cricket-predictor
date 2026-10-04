import { createSlice } from "@reduxjs/toolkit";

// the short message at the corner of the screen: { id, type: "success" | "error", message }
const toastSlice = createSlice({
    name: "toast",
    initialState: { current: null },
    reducers: {
        shown: (state, action) => {
            state.current = action.payload;
        },
        // only the message that is still on screen is taken away
        dismissed: (state, action) => {
            if (!action.payload || state.current?.id === action.payload) {
                state.current = null;
            }
        },
    },
});

export const { shown, dismissed } = toastSlice.actions;
export default toastSlice.reducer;
