import { bestEleven, checkTeam } from '../src/prediction/eleven.js';
import { sampleMatch } from '../src/cricket/sample.js';
import { withScores } from '../src/prediction/scores.js';

const TEAMS = ['Alpha', 'Beta'];
const ROLES = ['wk', 'bat', 'ar', 'bowl'];
const MIN = { wk: 1, bat: 3, ar: 1, bowl: 3 };
const MAX = { wk: 4, bat: 6, ar: 4, bowl: 6 };

const p = (id, team, role, score, name = `Player ${id}`) => ({ id, name, team: TEAMS[team], role, score });
const squadsOf = (players) => TEAMS.map((team) => ({ team, players: players.filter((player) => player.team === team) }));

// a plain squad: 2 keepers, 4 batters, 2 all-rounders, 4 bowlers for each side
const plain = (scoreOf = (index) => 50 + index) => {
    const players = [];
    let index = 0;
    for (const team of [0, 1]) {
        for (const [role, count] of [['wk', 2], ['bat', 4], ['ar', 2], ['bowl', 4]]) {
            for (let n = 0; n < count; n += 1) {
                players.push(p(`${TEAMS[team][0]}${role}${n}`, team, role, scoreOf(index)));
                index += 1;
            }
        }
    }
    return players;
};

const tenths = (players) => players.reduce((sum, player) => sum + Math.round(player.score * 10), 0);

const isValid = (players) => {
    if (players.length !== 11 || new Set(players.map((player) => player.id)).size !== 11) return false;
    const count = (test) => players.filter(test).length;
    return ROLES.every((role) => count((player) => player.role === role) >= MIN[role] && count((player) => player.role === role) <= MAX[role])
        && TEAMS.every((team) => count((player) => player.team === team) <= 7);
};

// every way to pick 11, the slow and certain way
const bruteForce = (players) => {
    let best = -1;
    const pick = (start, chosen) => {
        if (chosen.length === 11) {
            if (isValid(chosen)) best = Math.max(best, tenths(chosen));
            return;
        }
        if (players.length - start < 11 - chosen.length) return;
        for (let index = start; index < players.length; index += 1) {
            chosen.push(players[index]);
            pick(index + 1, chosen);
            chosen.pop();
        }
    };
    pick(0, []);
    return best;
};

// the same numbers at every run
const random = (seed) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
};

describe('the suggested eleven', () => {
    test('is a valid team with the best player as captain and the next as vice-captain', () => {
        const { match, squads } = sampleMatch('sample-t20-1');
        const eleven = bestEleven(withScores(squads, match.format));

        expect(isValid(eleven.players)).toBe(true);
        const scores = eleven.players.map((player) => player.score).sort((a, b) => b - a);
        expect(eleven.players.find((player) => player.id === eleven.captainId).score).toBe(scores[0]);
        expect(eleven.players.find((player) => player.id === eleven.viceCaptainId).score).toBe(scores[1]);
        expect(eleven.captainId).not.toBe(eleven.viceCaptainId);
        expect(eleven.total).toBe(tenths(eleven.players) / 10);
    });

    test('lists its players by role, the best first, and the five best players left out', () => {
        const { match, squads } = sampleMatch('sample-odi-1');
        const scored = withScores(squads, match.format);
        const eleven = bestEleven(scored);

        const order = eleven.players.map((player) => ROLES.indexOf(player.role) * 1000 - player.score);
        expect(order).toEqual([...order].sort((a, b) => a - b));

        const chosen = new Set(eleven.players.map((player) => player.id));
        const left = scored.flatMap((squad) => squad.players).filter((player) => !chosen.has(player.id)).sort((a, b) => b.score - a.score);
        expect(eleven.bench.map((player) => player.id)).toEqual(left.slice(0, 5).map((player) => player.id));
    });

    test('no valid team has a higher sum: checked against every possible team', () => {
        const next = random(20250112);

        for (let trial = 0; trial < 40; trial += 1) {
            const players = [];
            for (const team of [0, 1]) {
                const size = 6 + Math.floor(next() * 3);
                for (let n = 0; n < size; n += 1) {
                    const role = n < 4 ? ROLES[n] : ROLES[Math.floor(next() * 4)];
                    // few different scores, so equal sums happen
                    players.push(p(`${team}-${n}`, team, role, Math.round(next() * 12) * 5 + 20));
                }
            }

            const expected = bruteForce(players);
            const eleven = bestEleven(squadsOf(players));

            if (expected < 0) {
                expect(eleven.problem).toEqual(expect.any(String));
            } else {
                expect(isValid(eleven.players)).toBe(true);
                expect(tenths(eleven.players)).toBe(expected);
            }
        }
    });

    test('takes at most 7 from one side, however good that side is', () => {
        const players = plain((index) => (index < 12 ? 90 - index : 30 - index));
        const eleven = bestEleven(squadsOf(players));

        expect(eleven.players.filter((player) => player.team === 'Alpha')).toHaveLength(7);
        expect(tenths(eleven.players)).toBe(bruteForce(players));
    });

    test('takes at most 4 wicket-keepers and at least 3 bowlers, however the scores lie', () => {
        const players = [
            ...[0, 1, 2].map((n) => p(`awk${n}`, 0, 'wk', 95 - n)), ...[0, 1, 2].map((n) => p(`bwk${n}`, 1, 'wk', 94 - n)),
            ...[0, 1, 2].map((n) => p(`abat${n}`, 0, 'bat', 60 - n)), ...[0, 1, 2].map((n) => p(`bbat${n}`, 1, 'bat', 59 - n)),
            p('aar', 0, 'ar', 50), p('bar', 1, 'ar', 49),
            ...[0, 1, 2].map((n) => p(`abowl${n}`, 0, 'bowl', 10 - n)), ...[0, 1, 2].map((n) => p(`bbowl${n}`, 1, 'bowl', 9 - n)),
        ];
        const eleven = bestEleven(squadsOf(players));
        const count = (role) => eleven.players.filter((player) => player.role === role).length;

        expect([count('wk'), count('bat'), count('ar'), count('bowl')]).toEqual([4, 3, 1, 3]);
    });

    test('is the same team whatever order the squads list their players in', () => {
        const players = plain(() => 50);
        const first = bestEleven(squadsOf(players));
        const second = bestEleven(squadsOf([...players].reverse()));

        expect(second.players.map((player) => player.id)).toEqual(first.players.map((player) => player.id));
        expect([second.captainId, second.viceCaptainId]).toEqual([first.captainId, first.viceCaptainId]);
    });

    test('between players of the same score the name decides', () => {
        const players = plain(() => 50).map((player, index) => ({ ...player, name: `Name ${String(99 - index).padStart(2, '0')}` }));
        const eleven = bestEleven(squadsOf(players));

        // of the equal players of one role on one side, those taken are the first by name
        for (const team of TEAMS) {
            for (const role of ROLES) {
                const group = players.filter((player) => player.role === role && player.team === team).sort((a, b) => a.name.localeCompare(b.name));
                const taken = eleven.players.filter((player) => player.role === role && player.team === team).map((player) => player.id);

                expect(taken).toEqual(group.slice(0, taken.length).map((player) => player.id));
            }
        }
        const best = [...eleven.players].sort((a, b) => a.name.localeCompare(b.name));
        expect([eleven.captainId, eleven.viceCaptainId]).toEqual([best[0].id, best[1].id]);
    });

    test('a score that is not a number counts as none', () => {
        const players = plain().map((player, index) => (index % 5 === 0 ? { ...player, score: [NaN, undefined, 'high', Infinity, -3][(index / 5) % 5] } : player));
        const eleven = bestEleven(squadsOf(players));

        expect(isValid(eleven.players)).toBe(true);
        expect(Number.isFinite(eleven.total)).toBe(true);
    });
});

describe('squads from which no team can be made', () => {
    test('say which rule cannot be met', () => {
        const players = plain();
        const without = (role) => squadsOf(players.filter((player) => player.role !== role));

        expect(bestEleven(without('wk'))).toEqual({ problem: 'The squads list no wicket-keepers; a team needs at least 1.' });
        expect(bestEleven(without('ar'))).toEqual({ problem: 'The squads list no all-rounders; a team needs at least 1.' });
        expect(bestEleven(squadsOf(players.filter((player) => player.role !== 'bowl' || player.id === 'Abowl0' || player.id === 'Bbowl0'))))
            .toEqual({ problem: 'The squads list only 2 bowlers; a team needs at least 3.' });
        expect(bestEleven(squadsOf(players.slice(0, 10)))).toEqual({ problem: 'The squads have fewer than 11 players, so a team cannot be made yet.' });
        expect(bestEleven(squadsOf([]))).toEqual({ problem: 'The squads have fewer than 11 players, so a team cannot be made yet.' });
    });

    test('one side alone cannot make a team', () => {
        const players = plain().filter((player) => player.team === 'Alpha' || player.id === 'Bbat0');

        expect(bestEleven(squadsOf(players))).toEqual({ problem: 'A team cannot be made from these squads: at most 7 players may come from one side.' });
    });
});

describe('checking a team someone made', () => {
    const players = plain();
    const squads = squadsOf(players);
    const good = bestEleven(squads);
    const ids = good.players.map((player) => player.id);
    const team = (changes = {}) => ({ playerIds: ids, captainId: good.captainId, viceCaptainId: good.viceCaptainId, ...changes });
    const others = players.filter((player) => !ids.includes(player.id));
    const swap = (out, into) => ids.map((id) => (id === out ? into : id));

    test('a valid team passes', () => {
        expect(checkTeam(team(), squads)).toBeNull();
    });

    test('it has 11 different players of the squads', () => {
        expect(checkTeam(team({ playerIds: ids.slice(0, 10) }), squads)).toBe('A team has 11 players');
        expect(checkTeam(team({ playerIds: [...ids, others[0].id] }), squads)).toBe('A team has 11 players');
        expect(checkTeam(team({ playerIds: [...ids.slice(0, 10), ids[0]] }), squads)).toBe('A player can be picked only once');
        expect(checkTeam(team({ playerIds: [...ids.slice(0, 10), 'someone-else'] }), squads)).toBe('Every player must be in the squads of this match');
        expect(checkTeam(team({ playerIds: [...ids.slice(0, 10), { $ne: 1 }] }), squads)).toBe('Every player must be in the squads of this match');
        expect(checkTeam(team({ playerIds: 'all of them' }), squads)).toBe('A team has 11 players');
        expect(checkTeam(team({ playerIds: undefined }), squads)).toBe('A team has 11 players');
        expect(checkTeam(null, squads)).toBe('A team has 11 players');
    });

    // [wicket-keepers, batters, all-rounders, bowlers], eleven in all; the first role that is wrong is named
    test.each([
        [[0, 4, 3, 4], 'A team needs 1 to 4 wicket-keepers'],
        [[5, 3, 1, 2], 'A team needs 1 to 4 wicket-keepers'],
        [[2, 2, 3, 4], 'A team needs 3 to 6 batters'],
        [[1, 7, 1, 2], 'A team needs 3 to 6 batters'],
        [[2, 4, 0, 5], 'A team needs 1 to 4 all-rounders'],
        [[1, 3, 5, 2], 'A team needs 1 to 4 all-rounders'],
        [[2, 4, 3, 2], 'A team needs 3 to 6 bowlers'],
        [[1, 3, 1, 6], null],
        [[4, 3, 1, 3], null],
        [[1, 6, 1, 3], null],
        [[1, 3, 4, 3], null],
    ])('a team of %j: %s', (numbers, message) => {
        // a large pool of every role on both sides, taken from the sides in turn
        const pool = ROLES.flatMap((kind) => Array.from({ length: 10 }, (_, n) => p(`${kind}${n}`, n % 2, kind, 50)));
        const chosen = ROLES.flatMap((kind, index) => pool.filter((player) => player.role === kind).slice(0, numbers[index]));
        const playerIds = chosen.map((player) => player.id);

        expect(chosen).toHaveLength(11);
        expect(TEAMS.every((side) => chosen.filter((player) => player.team === side).length <= 7)).toBe(true);
        expect(checkTeam({ playerIds, captainId: playerIds[0], viceCaptainId: playerIds[1] }, squadsOf(pool))).toBe(message);
    });

    test('it has at most 7 players of one side', () => {
        const pool = [0, 1].flatMap((side) => ROLES.flatMap((kind) => Array.from({ length: 5 }, (_, n) => p(`${side}${kind}${n}`, side, kind, 50))));
        const alpha = (kind, number) => pool.filter((player) => player.team === 'Alpha' && player.role === kind).slice(0, number);
        const chosen = [...alpha('wk', 1), ...alpha('bat', 3), ...alpha('ar', 1), ...alpha('bowl', 3), ...pool.filter((player) => player.team === 'Beta' && player.role === 'bat').slice(0, 3)];
        const playerIds = chosen.map((player) => player.id);

        expect(chosen.filter((player) => player.team === 'Alpha')).toHaveLength(8);
        expect(checkTeam({ playerIds, captainId: playerIds[0], viceCaptainId: playerIds[1] }, squadsOf(pool))).toBe('A team can have at most 7 players of one side');
    });

    test('its captain and vice-captain are two different players of the eleven', () => {
        expect(checkTeam(team({ captainId: others[0].id }), squads)).toBe('The captain must be one of the eleven');
        expect(checkTeam(team({ captainId: undefined }), squads)).toBe('The captain must be one of the eleven');
        expect(checkTeam(team({ viceCaptainId: 'nobody' }), squads)).toBe('The vice-captain must be one of the eleven');
        expect(checkTeam(team({ viceCaptainId: good.captainId }), squads)).toBe('The captain and the vice-captain must be two different players');
        expect(checkTeam(team({ captainId: ['x'] }), squads)).toBe('The captain must be one of the eleven');
    });

    test('a swap within the rules passes', () => {
        const out = good.players.find((player) => player.role === 'bat');
        const into = others.find((player) => player.role === 'bat' && player.team === out.team);
        const playerIds = swap(out.id, into.id);
        const captainId = playerIds.find((id) => id !== good.viceCaptainId);

        expect(checkTeam({ playerIds, captainId, viceCaptainId: good.viceCaptainId === out.id ? playerIds.find((id) => id !== captainId) : good.viceCaptainId }, squads)).toBeNull();
    });
});
