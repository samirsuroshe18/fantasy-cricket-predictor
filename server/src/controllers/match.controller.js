import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { getMatch, listMatches } from '../cricket/index.js';
import { withScores } from '../prediction/scores.js';

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

export { getMatches, getOneMatch }
