import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { getMatch, listMatches } from '../cricket/index.js';
import { withScores } from '../prediction/scores.js';
import { bestEleven } from '../prediction/eleven.js';
import { explain } from '../prediction/explanation.js';
import { giveBack, take } from '../utils/dailyLimit.js';
import { visitorOf } from '../utils/visitor.js';

const predictionsADay = () => Number(process.env.DAILY_PREDICTION_LIMIT) || 20;

// the demo account is shared by every visitor, so its allowance is kept per visitor
const allowanceKey = (req) => (req.user.isDemo ? `predict:demo:${visitorOf(req)}` : `predict:${req.user._id}`);

const getMatches = asyncHandler(async (req, res) => {
    const { matches, live } = await listMatches();

    return res.status(200).json(new ApiResponse(200, { matches, live }, "Upcoming matches"));
});

const getOneMatch = asyncHandler(async (req, res) => {
    const found = await getMatch(req.params.id);

    if (!found) {
        throw new ApiError(404, "Match not found");
    }

    return res.status(200).json(new ApiResponse(200, {
        match: found.match,
        squads: withScores(found.squads, found.match.format),
        note: found.note,
    }, "Match"));
});

// The best valid eleven of a match, with the explanation when there is one.
const predict = asyncHandler(async (req, res) => {
    const found = await getMatch(req.params.id);

    if (!found) {
        throw new ApiError(404, "Match not found");
    }

    const key = allowanceKey(req);
    const remaining = await take(key, predictionsADay());

    if (remaining === null) {
        throw new ApiError(429, "You have used today's predictions. Please come back tomorrow.");
    }

    const eleven = bestEleven(withScores(found.squads, found.match.format));

    if (eleven.problem) {
        // nothing was predicted, so nothing is counted
        await giveBack(key).catch(() => {});
        throw new ApiError(422, eleven.problem);
    }

    return res.status(200).json(new ApiResponse(200, {
        match: found.match,
        players: eleven.players,
        captainId: eleven.captainId,
        viceCaptainId: eleven.viceCaptainId,
        total: eleven.total,
        bench: eleven.bench,
        explanation: await explain(found.match, eleven),
        remaining,
        note: found.note,
    }, "Suggested team"));
});

export { getMatches, getOneMatch, predict }
