import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Team } from '../models/team.model.js';
import { getMatch } from '../cricket/index.js';
import { withScores } from '../prediction/scores.js';
import { bestEleven, checkTeam } from '../prediction/eleven.js';
import { keptExplanation } from '../prediction/explanation.js';
import { elevenFields, playersOf, sameTeam } from '../prediction/snapshot.js';
import { readText } from '../utils/input.js';
import { isValidObjectId } from '../utils/objectId.js';

const NAME_MAX = 60;
const LIST_FIELDS = 'name match total captain viceCaptain isEdited createdAt updatedAt';

// the demo account is shared, so it holds fewer
const maxTeams = (user) => (user.isDemo
    ? Number(process.env.MAX_DEMO_TEAMS) || 20
    : Number(process.env.MAX_TEAMS) || 50);

const tooMany = (max) => new ApiError(409, `You can save at most ${max} teams. Delete one to save another.`);

const DUPLICATE_KEY = 11000;
const PLACE_ATTEMPTS = 10;

// Saves the team in the lowest free place of its user. When another save took that
// place in the same moment, the unique index refuses this one and the next free place
// is tried; when no place is free, the limit is reached.
const createInFreePlace = async (user, fields) => {
    const max = maxTeams(user);

    for (let attempt = 0; attempt < PLACE_ATTEMPTS; attempt += 1) {
        const taken = new Set((await Team.find({ user: user._id }).select('slot').lean()).map((team) => team.slot));

        if (taken.size >= max) {
            throw tooMany(max);
        }

        let slot = 0;
        while (taken.has(slot)) slot += 1;

        try {
            return await Team.create({ ...fields, user: user._id, slot });
        } catch (error) {
            if (error.code !== DUPLICATE_KEY) throw error;
        }
    }

    throw new ApiError(409, "Several teams are being saved at once. Please try again.");
};

// the team as a client gets it: with the eleven as players, in the order a team is listed
const present = (team) => ({
    _id: team._id,
    name: team.name,
    match: team.match,
    squads: team.squads,
    players: playersOf(team.squads, team.playerIds),
    captainId: team.captainId,
    viceCaptainId: team.viceCaptainId,
    total: team.total,
    explanation: team.explanation,
    isEdited: team.isEdited,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
});

// a team of this user, or 404: someone else's team is answered like one that does not exist
const findOwn = async (req) => {
    const team = isValidObjectId(req.params.id)
        ? await Team.findOne({ _id: req.params.id, user: req.user._id })
        : null;

    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    return team;
};

const listTeams = asyncHandler(async (req, res) => {
    const teams = await Team.find({ user: req.user._id }).select(LIST_FIELDS).sort({ createdAt: -1, _id: -1 }).lean();

    return res.status(200).json(new ApiResponse(200, { teams, limit: maxTeams(req.user) }, "Saved teams"));
});

const createTeam = asyncHandler(async (req, res) => {
    const name = readText(req.body.name, 'Name', { max: NAME_MAX, required: true });

    const found = await getMatch(req.body.matchId);
    if (!found) {
        throw new ApiError(404, "Match not found");
    }

    // only ids are taken from the request; names, roles and scores are the server's own
    const squads = withScores(found.squads, found.match.format);
    const team = { playerIds: req.body.playerIds, captainId: req.body.captainId, viceCaptainId: req.body.viceCaptainId };

    const problem = checkTeam(team, squads);
    if (problem) {
        throw new ApiError(400, problem);
    }

    // refused before any more work is done; the place itself is taken when the team is saved
    const max = maxTeams(req.user);
    if (await Team.countDocuments({ user: req.user._id }) >= max) {
        throw tooMany(max);
    }

    // the suggested team keeps the explanation that was written for it
    const suggested = bestEleven(squads);
    const isSuggested = !suggested.problem && sameTeam(team, { ...suggested, playerIds: suggested.players.map((player) => player.id) });

    const created = await createInFreePlace(req.user, {
        name,
        match: found.match,
        squads,
        ...elevenFields(squads, team),
        explanation: isSuggested ? await keptExplanation(found.match, suggested) : null,
        isEdited: !isSuggested,
        isDemo: Boolean(req.user.isDemo),
    });

    return res.status(201).json(new ApiResponse(201, { team: present(created) }, "Team saved"));
});

const getTeam = asyncHandler(async (req, res) => {
    const team = await findOwn(req);

    return res.status(200).json(new ApiResponse(200, { team: present(team) }, "Team"));
});

// A new name, a changed eleven, or both. The eleven is checked against the squads the
// team was saved with.
const updateTeam = asyncHandler(async (req, res) => {
    const team = await findOwn(req);
    const { body } = req;

    const renames = body.name !== undefined;
    const changesEleven = ['playerIds', 'captainId', 'viceCaptainId'].some((field) => body[field] !== undefined);

    if (!renames && !changesEleven) {
        throw new ApiError(400, "Nothing to change");
    }

    if (renames) {
        team.name = readText(body.name, 'Name', { max: NAME_MAX, required: true });
    }

    if (changesEleven) {
        const wanted = {
            playerIds: body.playerIds === undefined ? team.playerIds : body.playerIds,
            captainId: body.captainId === undefined ? team.captainId : body.captainId,
            viceCaptainId: body.viceCaptainId === undefined ? team.viceCaptainId : body.viceCaptainId,
        };

        const problem = checkTeam(wanted, team.squads);
        if (problem) {
            throw new ApiError(400, problem);
        }

        if (!sameTeam(wanted, team)) {
            team.set(elevenFields(team.squads, wanted));
            team.isEdited = true;
            team.explanation = null;
        }
    }

    await team.save();

    return res.status(200).json(new ApiResponse(200, { team: present(team) }, "Team updated"));
});

const deleteTeam = asyncHandler(async (req, res) => {
    const team = await findOwn(req);
    await Team.deleteOne({ _id: team._id, user: req.user._id });

    return res.status(200).json(new ApiResponse(200, {}, "Team deleted"));
});

export { listTeams, createTeam, getTeam, updateTeam, deleteTeam }
