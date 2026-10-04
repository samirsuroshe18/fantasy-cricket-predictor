// The rules of a fantasy team, the best team the rules allow, and the check of a team
// someone made. See docs/design.md, section 6.

const TEAM_SIZE = 11;
const SIDE_MAX = 7;
const BENCH_SIZE = 5;

// in the order a team is listed
const ROLES = [
    { key: 'wk', plural: 'wicket-keepers', min: 1, max: 4 },
    { key: 'bat', plural: 'batters', min: 3, max: 6 },
    { key: 'ar', plural: 'all-rounders', min: 1, max: 4 },
    { key: 'bowl', plural: 'bowlers', min: 3, max: 6 },
];

// scores have one decimal; sums are made in tenths, so they are exact
const tenthsOf = (player) => (Number.isFinite(player.score) && player.score > 0 ? Math.round(player.score * 10) : 0);

// the best first; between equal scores the name decides, then the id
const byScore = (a, b) => tenthsOf(b) - tenthsOf(a) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);

const roleIndex = (player) => Math.max(ROLES.findIndex((role) => role.key === player.role), 0);

// Whatever the best team is, the players it takes of one role from one side are the
// best of that role on that side. So it is enough to try every way of dividing the
// eleven places over the roles and the two sides, which are a few tens of thousands.
const bestEleven = (squads) => {
    const all = squads.flatMap((squad) => squad.players);

    if (all.length < TEAM_SIZE) {
        return { problem: 'The squads have fewer than 11 players, so a team cannot be made yet.' };
    }

    for (const role of ROLES) {
        const listed = all.filter((player) => player.role === role.key).length;
        if (listed < role.min) {
            return { problem: `The squads list ${listed ? `only ${listed}` : 'no'} ${role.plural}; a team needs at least ${role.min}.` };
        }
    }

    const sides = [0, 1].map((side) => squads[side]?.players || []);
    // groups[side][role]: the players, best first, and the sum of the first n of them
    const groups = sides.map((players) => ROLES.map((role) => {
        const sorted = players.filter((player) => player.role === role.key).sort(byScore);
        const sums = [0];
        sorted.forEach((player) => sums.push(sums[sums.length - 1] + tenthsOf(player)));
        return { sorted, sums };
    }));

    let best = null;
    // counts[role] = [from the first side, from the second side]
    const counts = ROLES.map(() => [0, 0]);

    const place = (index, taken, fromFirst, sum) => {
        if (index === ROLES.length) {
            const fromSecond = taken - fromFirst;
            if (taken === TEAM_SIZE && fromFirst <= SIDE_MAX && fromSecond <= SIDE_MAX && (!best || sum > best.sum)) {
                best = { sum, counts: counts.map((pair) => [...pair]) };
            }
            return;
        }

        const role = ROLES[index];
        const [first, second] = [groups[0][index], groups[1][index]];

        for (let a = 0; a <= Math.min(role.max, first.sorted.length); a += 1) {
            for (let b = 0; b <= Math.min(role.max - a, second.sorted.length); b += 1) {
                if (a + b < role.min || taken + a + b > TEAM_SIZE) continue;
                counts[index] = [a, b];
                place(index + 1, taken + a + b, fromFirst + a, sum + first.sums[a] + second.sums[b]);
            }
        }
    };

    place(0, 0, 0, 0);

    if (!best) {
        return { problem: 'A team cannot be made from these squads: at most 7 players may come from one side.' };
    }

    const players = best.counts
        .flatMap(([a, b], index) => [...groups[0][index].sorted.slice(0, a), ...groups[1][index].sorted.slice(0, b)].sort(byScore));
    const chosen = new Set(players.map((player) => player.id));
    const ranked = [...players].sort(byScore);

    return {
        players,
        captainId: ranked[0].id,
        viceCaptainId: ranked[1].id,
        total: best.sum / 10,
        bench: all.filter((player) => !chosen.has(player.id)).sort(byScore).slice(0, BENCH_SIZE),
    };
};

// What is wrong with a team someone made, or null when it keeps to every rule.
// team: { playerIds, captainId, viceCaptainId }
const checkTeam = (team, squads) => {
    const ids = team?.playerIds;

    if (!Array.isArray(ids) || ids.length !== TEAM_SIZE) return 'A team has 11 players';

    const known = new Map(squads.flatMap((squad) => squad.players).map((player) => [player.id, player]));
    if (ids.some((id) => typeof id !== 'string' || !known.has(id))) return 'Every player must be in the squads of this match';
    if (new Set(ids).size !== TEAM_SIZE) return 'A player can be picked only once';

    const players = ids.map((id) => known.get(id));

    for (const role of ROLES) {
        const count = players.filter((player) => roleIndex(player) === ROLES.indexOf(role)).length;
        if (count < role.min || count > role.max) return `A team needs ${role.min} to ${role.max} ${role.plural}`;
    }

    for (const squad of squads) {
        if (players.filter((player) => player.team === squad.team).length > SIDE_MAX) return 'A team can have at most 7 players of one side';
    }

    if (typeof team.captainId !== 'string' || !ids.includes(team.captainId)) return 'The captain must be one of the eleven';
    if (typeof team.viceCaptainId !== 'string' || !ids.includes(team.viceCaptainId)) return 'The vice-captain must be one of the eleven';
    if (team.captainId === team.viceCaptainId) return 'The captain and the vice-captain must be two different players';

    return null;
};

// the eleven's players in the order a team is listed, from ids in any order
const inTeamOrder = (players) => [...players].sort((a, b) => roleIndex(a) - roleIndex(b) || byScore(a, b));

export { bestEleven, checkTeam, inTeamOrder, ROLES, TEAM_SIZE, SIDE_MAX }
