import { inTeamOrder } from './eleven.js';

const playersOf = (squads, playerIds) => {
    const known = new Map(squads.flatMap((squad) => squad.players).map((player) => [player.id, player]));
    return inTeamOrder(playerIds.map((id) => known.get(id)).filter(Boolean));
};

// scores have one decimal; the sum is made in tenths, so it is exact
const totalOf = (players) => players.reduce((sum, player) => sum + Math.round((Number(player.score) || 0) * 10), 0) / 10;

// What is stored of a team that passed the check: the eleven as ids, and what the
// list of teams shows of it. team: { playerIds, captainId, viceCaptainId }
const elevenFields = (squads, team) => {
    const players = playersOf(squads, team.playerIds);
    const nameOf = (id) => players.find((player) => player.id === id)?.name || '';

    return {
        playerIds: players.map((player) => player.id),
        captainId: team.captainId,
        viceCaptainId: team.viceCaptainId,
        captain: nameOf(team.captainId),
        viceCaptain: nameOf(team.viceCaptainId),
        total: totalOf(players),
    };
};

// whether two teams are the same players with the same captain and vice-captain
const sameTeam = (a, b) =>
    a.captainId === b.captainId && a.viceCaptainId === b.viceCaptainId
    && [...a.playerIds].sort().join(',') === [...b.playerIds].sort().join(',');

export { playersOf, totalOf, elevenFields, sameTeam }
