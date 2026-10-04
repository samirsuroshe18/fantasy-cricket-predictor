// Matches, squads and figures as the rest of the server uses them: from the cache
// where it can, from the source where it must, and from the sample matches always.
import { ask, canAsk, hasKey } from './source.js';
import { cached, keptOf } from './cache.js';
import { isId, toFigures, toMatch, toSquads } from './normalise.js';
import { isSampleId, sampleMatch, sampleMatches } from './sample.js';

const HOUR_MS = 60 * 60 * 1000;
const LIST_LIFETIME_MS = HOUR_MS;
// The source charges ten of the day's requests for the squads of a match, so they are
// kept long, and asked for only when they are likely to be there: squads are announced
// shortly before a match.
const SQUAD_COST = 10;
const SQUAD_LIFETIME_MS = 24 * HOUR_MS;
// an incomplete answer is asked for again sooner
const NO_SQUAD_LIFETIME_MS = 6 * HOUR_MS;
const SQUADS_FROM_MS = 72 * HOUR_MS;
const TOO_EARLY = 'Squads are announced closer to the match. They are shown here from three days before its start.';
const FIGURES_LIFETIME_MS = 14 * 24 * HOUR_MS;
// a player the source would not give figures of is not asked for again for this long
const REFUSED_LIFETIME_MS = 6 * HOUR_MS;
const FAILED_LIFETIME_MS = HOUR_MS;

const LIVE_MAX = 40;
// Every player's figures are a request of their own. This many of the day's requests
// are kept back from them, and a few from squads, so the list can always be fetched.
const FIGURES_RESERVE = 15;
const SQUAD_RESERVE = 5;
// figures are fetched a few at a time, and not for longer than a visitor will wait
const FIGURES_AT_ONCE = 6;
const FIGURES_DEADLINE_MS = 12000;

const NOT_SET_UP = 'Live matches are not set up on this server. These are sample matches.';
const NOT_LOADED = 'Live matches cannot be loaded right now. These are sample matches.';
const NOT_REFRESHED = 'Live matches could not be refreshed. This list is from earlier.';

const loadList = async () => {
    const data = await ask('cricScore');
    const now = Date.now();
    const seen = new Set();

    return (Array.isArray(data) ? data : [])
        .map((entry) => toMatch(entry, now))
        // a match is listed once, and never under the id of a sample match
        .filter((match) => match && !isSampleId(match.id) && !seen.has(match.id) && seen.add(match.id))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.id.localeCompare(b.id))
        .slice(0, LIVE_MAX);
};

// Answers { matches, live: { available, asOf, note } }: the live matches that are
// still to come, then the sample matches.
const listMatches = async (now = Date.now()) => {
    const samples = sampleMatches(now);

    if (!hasKey()) {
        return { matches: samples, live: { available: false, asOf: null, note: NOT_SET_UP } };
    }

    try {
        const { value, fetchedAt, stale } = await cached('matches', LIST_LIFETIME_MS, loadList);
        const upcoming = value.filter((match) => Date.parse(match.startsAt) > now);

        return {
            matches: [...upcoming, ...samples],
            live: { available: true, asOf: fetchedAt, note: stale ? NOT_REFRESHED : '' },
        };
    } catch (error) {
        return { matches: samples, live: { available: false, asOf: null, note: NOT_LOADED } };
    }
};

// runs the tasks a few at a time, for as long as goOn says so; the rest are left out
const inTurns = async (tasks, atOnce, goOn) => {
    let next = 0;

    const worker = async () => {
        while (next < tasks.length && goOn()) {
            const task = tasks[next];
            next += 1;
            await task();
        }
    };

    await Promise.all(Array.from({ length: Math.min(atOnce, tasks.length) }, worker));
};

const figuresKey = (playerId) => `player:${playerId}`;

// Both formats are read from the one answer, so a player costs one request whatever
// the match. A request the source refused or failed is remembered as that, so the same
// player is not asked for at every visit.
// old is what was kept before, when there are figures in it: they are kept on.
const loadFigures = async (playerId, old) => {
    try {
        const data = await ask('players_info', { id: playerId }, { reserve: FIGURES_RESERVE });
        return { t20: toFigures(data, 't20'), odi: toFigures(data, 'odi') };
    } catch (error) {
        if (error.reason !== 'refused' && error.reason !== 'failed') throw error;
        return old ? { t20: old.t20, odi: old.odi, notRefreshed: error.reason } : { notLoaded: error.reason };
    }
};

const figuresLifetime = (value) => {
    const problem = value.notLoaded || value.notRefreshed;

    if (problem === 'refused') return REFUSED_LIFETIME_MS;
    if (problem === 'failed') return FAILED_LIFETIME_MS;
    return FIGURES_LIFETIME_MS;
};

const hasFigures = (value) => Boolean(value) && !value.notLoaded;

// Gives every player their figures for the format. A player whose figures could not
// be fetched has figuresLoaded false. Answers how many those are.
const addFigures = async (squads, format) => {
    const players = squads.flatMap((squad) => squad.players);
    // one read for all of them; what is too old is still better than nothing
    const kept = await keptOf(players.map((player) => figuresKey(player.id)));
    const found = new Map();

    const wanted = players.filter((player) => !kept.get(figuresKey(player.id))?.fresh);
    const possible = () => canAsk({ reserve: FIGURES_RESERVE });

    if (wanted.length && possible()) {
        const deadline = Date.now() + FIGURES_DEADLINE_MS;

        await inTurns(wanted.map((player) => async () => {
            try {
                const old = kept.get(figuresKey(player.id))?.value;
                const { value } = await cached(figuresKey(player.id), figuresLifetime, () => loadFigures(player.id, hasFigures(old) ? old : null));
                found.set(player.id, value);
            } catch (error) {
                // left as it was; a later visitor tries again
            }
        }), FIGURES_AT_ONCE, () => Date.now() < deadline && possible());
    }

    let notLoaded = 0;
    for (const player of players) {
        const old = kept.get(figuresKey(player.id))?.value;
        const figures = [found.get(player.id), old].find(hasFigures);

        player.figuresLoaded = Boolean(figures);
        player.figures = figures?.[format] || null;
        if (!figures) notLoaded += 1;
    }

    return notLoaded;
};

// The match with its two squads, every player with figures, or null when there is no
// such match. Answers { match, squads, note }.
const getMatch = async (id, now = Date.now()) => {
    if (!isId(id)) return null;

    if (isSampleId(id)) {
        return { ...sampleMatch(id, now), note: '' };
    }

    // only matches of the list are fetched: an id a visitor made up costs nothing
    const match = (await listMatches(now)).matches.find((entry) => entry.id === id);
    if (!match) return null;

    if (Date.parse(match.startsAt) - now > SQUADS_FROM_MS) {
        return { match, squads: toSquads([], match), note: TOO_EARLY };
    }

    let squads;
    try {
        const kept = await cached(
            `squad:${id}`,
            (value) => (value.every((squad) => squad.players.length) ? SQUAD_LIFETIME_MS : NO_SQUAD_LIFETIME_MS),
            async () => toSquads(await ask('match_squad', { id }, { reserve: SQUAD_RESERVE, cost: SQUAD_COST }), match)
        );
        // a copy: the figures are added to it
        squads = kept.value.map((squad) => ({ team: squad.team, players: squad.players.map((player) => ({ ...player })) }));
    } catch (error) {
        return { match, squads: toSquads([], match), note: 'The squads cannot be loaded right now.' };
    }

    const notLoaded = await addFigures(squads, match.format);
    const note = notLoaded
        ? `The figures of ${notLoaded} player${notLoaded === 1 ? '' : 's'} could not be loaded, so they are scored as players without figures.`
        : '';

    return { match, squads, note };
};

export { listMatches, getMatch }
