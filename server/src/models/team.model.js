import mongoose, { Schema } from "mongoose";

// A team a user saved. It carries the match and both squads as they were when it was
// saved, so it can be shown and edited after the match has left the list.
const teamSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60,
    },

    // { id, name, format, startsAt, venue, teams, isSample }
    match: {
        type: Schema.Types.Mixed,
        required: true,
    },

    // [{ team, players }], every player with figures and score
    squads: {
        type: [Schema.Types.Mixed],
        required: true,
    },

    // the eleven, as ids of players of the squads
    playerIds: {
        type: [String],
        required: true,
    },

    captainId: {
        type: String,
        required: true,
    },

    viceCaptainId: {
        type: String,
        required: true,
    },

    // kept for the list of teams, which is read without the squads
    captain: String,
    viceCaptain: String,
    total: Number,

    // { summary, captaincy, nearMisses } of the suggested team; an edited team has none
    explanation: {
        type: Schema.Types.Mixed,
        default: null,
    },

    isEdited: {
        type: Boolean,
        default: false,
    },

    // made by the demo account
    isDemo: {
        type: Boolean,
        default: false,
    },

    // The place this team takes among its user's teams, from 0 up to the most a user
    // may hold. No two teams of a user have the same place, which is what keeps saves
    // that arrive together from passing the limit.
    slot: {
        type: Number,
        required: true,
        min: 0,
    },
}, { timestamps: true, minimize: false });

teamSchema.index({ user: 1, slot: 1 }, { unique: true });

export const Team = mongoose.model("Team", teamSchema);
