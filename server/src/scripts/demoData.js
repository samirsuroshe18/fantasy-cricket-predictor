// The demo account: a user with a saved team for each sample match, so a visitor has
// something to look at and to change. Only what belongs to the demo account is ever
// removed here.
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Team } from '../models/team.model.js';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../utils/demo.js';
import { sampleMatch } from '../cricket/sample.js';
import { withScores } from '../prediction/scores.js';
import { bestEleven } from '../prediction/eleven.js';
import { elevenFields } from '../prediction/snapshot.js';

// Oldest first. The second team has the captain and the vice-captain changed over,
// so there is an edited team to see.
const TEAMS = [
    { matchId: 'sample-odi-1', name: 'One-day cup: suggested eleven' },
    { matchId: 'sample-t20-2', name: 'Dynamos v Kings: my captain', swapCaptain: true },
    { matchId: 'sample-t20-1', name: 'Mariners v Chargers: suggested eleven' },
];

// The same account gets the same id at every rebuild, so a visitor who is logged in
// to the demo stays logged in when the server restarts.
const DEMO_ID = new mongoose.Types.ObjectId(crypto.createHash('md5').update(DEMO_EMAIL).digest('hex').slice(0, 24));

const MINUTE_MS = 60 * 1000;

const buildTeam = (plan, index) => {
    const { match, squads } = sampleMatch(plan.matchId);
    const scored = withScores(squads, match.format);
    const eleven = bestEleven(scored);
    const savedAt = new Date(Date.now() - (TEAMS.length - index) * MINUTE_MS);

    return {
        user: DEMO_ID,
        name: plan.name,
        match,
        squads: scored,
        ...elevenFields(scored, {
            playerIds: eleven.players.map((player) => player.id),
            captainId: plan.swapCaptain ? eleven.viceCaptainId : eleven.captainId,
            viceCaptainId: plan.swapCaptain ? eleven.captainId : eleven.viceCaptainId,
        }),
        explanation: null,
        isEdited: Boolean(plan.swapCaptain),
        isDemo: true,
        slot: index,
        createdAt: savedAt,
        updatedAt: savedAt,
    };
};

const removeDemo = async () => {
    await Team.deleteMany({ user: DEMO_ID });
    await User.deleteMany({ $or: [{ _id: DEMO_ID }, { email: DEMO_EMAIL }] });
};

// Builds the demo account from scratch. Safe to run at every start of the server.
const rebuildDemo = async () => {
    await removeDemo();

    // User.create runs the password hashing
    await User.create({ _id: DEMO_ID, name: 'Demo User', email: DEMO_EMAIL, password: DEMO_PASSWORD, isVerified: true, isDemo: true });
    // timestamps: false keeps the dates given above
    await Team.insertMany(TEAMS.map(buildTeam), { timestamps: false });

    return { teams: TEAMS.length };
};

// For the start of the server: a demo that cannot be built must not keep the server
// from starting, so the failure is reported and the server carries on.
const startDemo = async (rebuild = rebuildDemo) => {
    try {
        const { teams } = await rebuild();
        console.log(`Demo account rebuilt: ${teams} saved teams`);
        return true;
    } catch (error) {
        console.log(`The demo account could not be rebuilt: ${error.message}`);
        return false;
    }
};

export { rebuildDemo, startDemo }
