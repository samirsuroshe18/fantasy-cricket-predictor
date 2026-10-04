import mongoose, { Schema } from "mongoose";

// How many times something was done on one day, for things that have a daily
// allowance. Kept in the database so a restart of the server does not start the count again.
const usageSchema = new Schema({
    // what is counted, for example "mail"
    key: {
        type: String,
        required: true,
    },

    // a UTC day, YYYY-MM-DD
    day: {
        type: String,
        required: true,
    },

    count: {
        type: Number,
        default: 0,
    },

    // old counts are removed by the database
    expiresAt: {
        type: Date,
        index: { expireAfterSeconds: 0 },
    },
});

usageSchema.index({ key: 1, day: 1 }, { unique: true });

export const Usage = mongoose.model("Usage", usageSchema);
