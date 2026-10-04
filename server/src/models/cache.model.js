import mongoose, { Schema } from "mongoose";

// What was fetched from the cricket source, kept so it is not asked for again. Kept
// in the database, so a restart of the server does not spend the day's requests twice.
const cacheSchema = new Schema({
    // for example "matches", "squad:<match id>", "player:<player id>"
    key: {
        type: String,
        required: true,
        unique: true,
    },

    value: Schema.Types.Mixed,

    fetchedAt: {
        type: Date,
        required: true,
    },

    // after this the value is fetched again; until that works, the old value is still used
    freshUntil: {
        type: Date,
        required: true,
    },

    // values nobody has asked for in a long time are removed by the database
    expiresAt: {
        type: Date,
        index: { expireAfterSeconds: 0 },
    },
}, { minimize: false });

export const Cache = mongoose.model("Cache", cacheSchema);
