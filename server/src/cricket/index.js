// Matches, squads and figures as the rest of the server uses them: from the cache
// where it can, from the source where it must, and from the sample matches always.
import { ask, hasKey } from './source.js';
import { cached, freshOf } from './cache.js';
import { isId, toFigures, toMatch, toSquads } from './normalise.js';
import { isSampleId, sampleMatch, sampleMatches } from './sample.js';

const HOUR_MS = 60 * 60 * 1000;
const LIST_LIFETIME_MS = HOUR_MS;
const SQUAD_LIFETIME_MS = 6 * HOUR_MS;
// squads are announced shortly before a match: an empty answer is asked for again sooner
const NO_SQUAD_LIFETIME_MS = HOUR_MS;
const FIGURES_LIFETIME_MS = 14 * 24 * HOUR_MS;

const LIVE_MAX = 40;
// Every player's figures are a request of their own. This many of the day's requests
// are kept back from them, so lists and squads can still be fetched.
const FIGURES_RESERVE = 15;
// figures are fetched a few at a time, and not for longer than a visitor will wait
const FIGURES_AT_ONCE = 6;
const FIGURES_DEADLINE_MS = 12000;

const NOT_SET_UP = 'Live matches are not set up on this server. These are sample matches.';
const NOT_LOADED = 'Live matches cannot be loaded right now. These are sample matches.';
const NOT_REFRESHED = 'Live matches could not be refreshed. This list is from earlier.';

const loadList = async () => {
    const data = await ask('cricScore');
    const now = Date.now();

    return (Array.isArray(data) ? data : [])
        .map((entry) => toMatch(entry, now))
        .filter(Boolean)
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

// runs the tasks a few at a time; tasks not started by the deadline are left out
const inTurns = async (tasks, atOnce, deadline) => {
    let next = 0;

    const worker = async () => {
        while (next < tasks.length && Date.now() < deadline) {
            const task = tasks[next];
            next += 1;
            await task();
        }
    };

    await Promise.all(Array.from({ length: Math.min(atOnce, tasks.length) }, worker));
};

const figuresKey = (playerId) => `player:${playerId}`;

// both formats are read from the one answer, so a player costs one request whatever the match
const loadFigures = async (playerId) => {
    const data = await ask('players_info', { id: playerId }, { reserve: FIGURES_RESERVE });
    return { t20: toFigures(data, 't20'), odi: toFigures(data, 'odi') };
};

// Gives every player their figures for the format. A player whose figures could not
// be fetched has figuresLoaded false. Answers how many those are.
const addFigures = async (squads, format) => {
    const players = squads.flatMap((squad) => squad.players);
    const kept = await freshOf(players.map((player) => figuresKey(player.id)));
    const found = new Map();

    const missing = players.filter((player) => !kept.has(figuresKey(player.id)));
    await inTurns(missing.map((player) => async () => {
        try {
            const { value } = await cached(figuresKey(player.id), FIGURES_LIFETIME_MS, () => loadFigures(player.id));
            found.set(player.id, value);
        } catch (error) {
            // left without figures; the next visitor tries again
        }
    }), FIGURES_AT_ONCE, Date.now() + FIGURES_DEADLINE_MS);

    let notLoaded = 0;
    for (const player of players) {
        const figures = kept.get(figuresKey(player.id)) || found.get(player.id);
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

    let squads;
    try {
        const kept = await cached(
            `squad:${id}`,
            (value) => (value.some((squad) => squad.players.length) ? SQUAD_LIFETIME_MS : NO_SQUAD_LIFETIME_MS),
            async () => toSquads(await ask('match_squad', { id }), match)
        );
        // a copy: the figures are added to it
        squads = kept.value.map((squad) => ({ team: squad.team, players: squad.players.map((player) => ({ ...player })) }));
    } catch (error) {
        return { match, squads: toSquads([], match), note: 'The squads cannot be loaded right now.' };
    }

    const notLoaded = await addFigures(squads, match.format);
    const note = notLoaded
        ? `The figures of ${notLoaded} player${notLoaded === 1 ? '' : 's'} could not be loaded today, so they are scored as players without figures.`
        : '';

    return { match, squads, note };
};

export { listMatches, getMatch }
