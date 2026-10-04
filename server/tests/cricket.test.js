import { jest } from '@jest/globals';
import { Cache } from '../src/models/cache.model.js';
import { Usage } from '../src/models/usage.model.js';
import { ask, resetSource, restSource } from '../src/cricket/source.js';
import { cached } from '../src/cricket/cache.js';
import { getMatch, listMatches } from '../src/cricket/index.js';
import { sampleMatch, sampleMatches } from '../src/cricket/sample.js';

const HOUR = 60 * 60 * 1000;
const soon = (hours) => new Date(Date.now() + hours * HOUR).toISOString().slice(0, 19);

const LIVE_ID = '11111111-aaaa-4bbb-8ccc-000000000001';

const fixture = (changes = {}) => ({
    id: LIVE_ID, dateTimeGMT: soon(5), matchType: 't20', status: 'Match not started', ms: 'fixture',
    t1: 'Sydney Thunder [SYT]', t2: 'Perth Scorchers [PRS]', t1img: 'https://g.cricapi.com/a.webp', t2img: 'https://g.cricapi.com/b.webp',
    series: 'Big Bash League', ...changes,
});

const squadPlayer = (id, role) => ({ id, name: `Player ${id}`, role, battingStyle: 'Right Handed Bat', bowlingStyle: '', country: 'Australia', playerImg: '' });
const SQUADS = [
    { teamName: 'Sydney Thunder', players: [squadPlayer('s1', 'WK-Batsman'), squadPlayer('s2', 'Bowler'), squadPlayer('s3', 'Batsman')] },
    { teamName: 'Perth Scorchers', players: [squadPlayer('p1', 'Batting Allrounder'), squadPlayer('p2', 'Bowler')] },
];

const playerInfo = (id) => ({
    id, name: `Player ${id}`,
    stats: [
        { fn: 'batting', matchtype: 't20', stat: 'inn', value: '50' }, { fn: 'batting', matchtype: 't20', stat: 'runs', value: '1200' },
        { fn: 'batting', matchtype: 't20', stat: 'avg', value: '30' }, { fn: 'batting', matchtype: 't20', stat: 'sr', value: '140' },
    ],
});

const answer = (data) => ({ ok: true, status: 200, json: async () => ({ status: 'success', data, info: { hitsToday: 1, hitsLimit: 100 } }) });

// what the source answers, by the part of the address after /v1/
let answers;
let calls;

const pathsCalled = () => calls.map((url) => url.pathname.replace('/v1/', ''));

beforeEach(() => {
    process.env.CRICKET_API_KEY = 'test-key';
    calls = [];
    answers = {
        cricScore: () => answer([fixture()]),
        match_squad: () => answer(SQUADS),
        players_info: (url) => answer(playerInfo(url.searchParams.get('id'))),
    };
    global.fetch = jest.fn(async (address) => {
        const url = new URL(address);
        calls.push(url);
        return answers[url.pathname.replace('/v1/', '')](url);
    });
    resetSource();
});

afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.CRICKET_API_KEY;
    delete process.env.CRICKET_DAILY_BUDGET;
    delete global.fetch;
});

const used = async () => (await Usage.findOne({ key: 'cricket' }))?.count || 0;
const age = (key, ms) => Cache.updateOne({ key }, { $set: { freshUntil: new Date(Date.now() - ms) } });

describe('asking the source', () => {
    test('sends the key and the parameters, and gives back the data', async () => {
        const data = await ask('match_squad', { id: LIVE_ID });

        expect(data).toEqual(SQUADS);
        expect(calls[0].origin + calls[0].pathname).toBe('https://api.cricapi.com/v1/match_squad');
        expect(Object.fromEntries(calls[0].searchParams)).toEqual({ apikey: 'test-key', offset: '0', id: LIVE_ID });
        expect(await used()).toBe(1);
    });

    test('without a key nothing is asked', async () => {
        delete process.env.CRICKET_API_KEY;

        await expect(ask('cricScore')).rejects.toMatchObject({ reason: 'no-key' });
        expect(global.fetch).not.toHaveBeenCalled();
        expect(await used()).toBe(0);
    });

    test('the day\'s budget is never passed, and a request that failed counts as well', async () => {
        process.env.CRICKET_DAILY_BUDGET = '3';
        answers.match_squad = () => ({ ok: false, status: 500, json: async () => ({}) });

        await ask('cricScore');
        await expect(ask('match_squad', { id: LIVE_ID })).rejects.toMatchObject({ reason: 'failed' });
        restSource(0);
        await ask('cricScore');

        await expect(ask('cricScore')).rejects.toMatchObject({ reason: 'budget' });
        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(await used()).toBe(3);
    });

    test('requests that arrive together cannot pass the budget either', async () => {
        process.env.CRICKET_DAILY_BUDGET = '4';

        const results = await Promise.allSettled(Array.from({ length: 12 }, () => ask('cricScore')));

        expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(4);
        expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    test('a part of the budget can be kept back from a request', async () => {
        process.env.CRICKET_DAILY_BUDGET = '5';

        await ask('players_info', { id: 's1' }, { reserve: 3 });
        await ask('players_info', { id: 's2' }, { reserve: 3 });
        await expect(ask('players_info', { id: 's3' }, { reserve: 3 })).rejects.toMatchObject({ reason: 'budget' });
        await expect(ask('players_info', { id: 's3' }, { reserve: 9 })).rejects.toMatchObject({ reason: 'budget' });

        // what was kept back is there for the others
        await expect(ask('cricScore')).resolves.toBeDefined();
        expect(await used()).toBe(3);
    });

    test.each([
        ['an error status', () => ({ ok: false, status: 503, json: async () => ({}) })],
        ['a refusal', () => ({ ok: true, status: 200, json: async () => ({ status: 'failure', reason: 'Blocked for 15 minutes' }) })],
        ['a page instead of data', () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token <'); } })],
        ['no answer at all', () => { throw new TypeError('fetch failed'); }],
        ['an answer of another shape', () => ({ ok: true, status: 200, json: async () => 'success' })],
    ])('%s is a failure, and the source is left alone for a while after it', async (_, reply) => {
        answers.cricScore = reply;

        await expect(ask('cricScore')).rejects.toMatchObject({ reason: 'failed' });
        await expect(ask('cricScore')).rejects.toMatchObject({ reason: 'resting' });

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(await used()).toBe(1);
    });

    test('what it throws never carries the key', async () => {
        answers.cricScore = () => { throw new TypeError('fetch failed for https://api.cricapi.com/v1/cricScore?apikey=test-key'); };
        const log = jest.spyOn(console, 'log').mockImplementation(() => {});

        const error = await ask('cricScore').catch((thrown) => thrown);

        expect(`${error.message} ${JSON.stringify(log.mock.calls)}`).not.toContain('test-key');
        log.mockRestore();
    });
});

describe('the cache', () => {
    test('loads once, then answers from what it kept', async () => {
        const load = jest.fn(async () => ({ n: 1 }));

        const first = await cached('thing', HOUR, load);
        const second = await cached('thing', HOUR, load);

        expect(load).toHaveBeenCalledTimes(1);
        expect([first.value, first.stale, second.value, second.stale]).toEqual([{ n: 1 }, false, { n: 1 }, false]);
        expect(second.fetchedAt).toEqual(first.fetchedAt);
    });

    test('loads again when what it kept is too old', async () => {
        let n = 0;
        const load = jest.fn(async () => ({ n: n += 1 }));
        await cached('thing', HOUR, load);
        await age('thing', 1000);

        expect((await cached('thing', HOUR, load)).value).toEqual({ n: 2 });
    });

    test('many requests for the same thing at once load it once', async () => {
        const load = jest.fn(() => new Promise((resolve) => setTimeout(() => resolve('value'), 30)));

        const results = await Promise.all(Array.from({ length: 30 }, () => cached('thing', HOUR, load)));

        expect(load).toHaveBeenCalledTimes(1);
        expect(results.every((result) => result.value === 'value')).toBe(true);
    });

    test('when loading fails, what it kept is used, and marked as older', async () => {
        await cached('thing', HOUR, async () => 'kept');
        await age('thing', 1000);

        const result = await cached('thing', HOUR, async () => { throw new Error('down'); });

        expect([result.value, result.stale]).toEqual(['kept', true]);
        await expect(cached('other', HOUR, async () => { throw new Error('down'); })).rejects.toThrow('down');
    });

    test('how long a value is kept can depend on the value, and nothing can be kept too', async () => {
        await cached('empty', (value) => (value === null ? 0 : HOUR), async () => null);
        const load = jest.fn(async () => 'now there');

        expect((await cached('empty', HOUR, load)).value).toBe('now there');

        await cached('none', HOUR, async () => null);
        expect((await cached('none', HOUR, load)).value).toBeNull();
        expect(load).toHaveBeenCalledTimes(1);
    });
});

describe('the sample matches', () => {
    test('are two T20s and an ODI, always still to come', () => {
        for (const now of [Date.now(), Date.parse('2031-12-31T23:59:59Z')]) {
            const matches = sampleMatches(now);

            expect(matches.map((match) => match.format)).toEqual(['t20', 't20', 'odi']);
            expect(matches.every((match) => match.isSample && Date.parse(match.startsAt) > now && Date.parse(match.startsAt) < now + 7 * 24 * HOUR)).toBe(true);
        }
    });

    test('have two squads of fifteen from which a team can be made', () => {
        const ids = new Set();

        for (const { id } of sampleMatches()) {
            const { match, squads } = sampleMatch(id);
            expect(squads.map((squad) => squad.team)).toEqual(match.teams.map((team) => team.name));

            for (const squad of squads) {
                expect(squad.players).toHaveLength(15);
                const count = (role) => squad.players.filter((player) => player.role === role).length;
                expect([count('wk'), count('bat'), count('ar'), count('bowl')]).toEqual([2, 5, 3, 5]);
                squad.players.forEach((player) => {
                    expect(ids.has(player.id)).toBe(false);
                    ids.add(player.id);
                    expect(player.team).toBe(squad.team);
                    expect(player.figuresLoaded).toBe(true);
                });
            }
        }

        expect(ids.size).toBe(90);
        expect(sampleMatch('sample-t20-9')).toBeNull();
    });
});

describe('the list of matches', () => {
    test('without a key: the sample matches, and it says so', async () => {
        delete process.env.CRICKET_API_KEY;

        const { matches, live } = await listMatches();

        expect(matches.map((match) => match.id)).toEqual(['sample-t20-1', 'sample-t20-2', 'sample-odi-1']);
        expect(live).toEqual({ available: false, asOf: null, note: 'Live matches are not set up on this server. These are sample matches.' });
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('with a key: the live matches by start time, then the samples, from one request an hour', async () => {
        answers.cricScore = () => answer([
            fixture({ id: 'later-1', dateTimeGMT: soon(30) }), fixture(),
            fixture({ id: 'test-1', matchType: 'test' }), fixture({ id: 'live-1', ms: 'live' }), { junk: true }, null,
        ]);

        const first = await listMatches();
        const second = await listMatches();

        expect(first.matches.map((match) => match.id)).toEqual([LIVE_ID, 'later-1', 'sample-t20-1', 'sample-t20-2', 'sample-odi-1']);
        expect(first.live).toMatchObject({ available: true, note: '' });
        expect(second.matches).toEqual(first.matches);
        expect(pathsCalled()).toEqual(['cricScore']);
    });

    test('a match that has started since the list was fetched is no longer listed', async () => {
        await listMatches();

        const later = await listMatches(Date.now() + 6 * HOUR);

        expect(later.matches.some((match) => match.id === LIVE_ID)).toBe(false);
    });

    test('when the source fails, the last list is used and the page is told how old it is', async () => {
        await listMatches();
        await age('matches', 1000);
        answers.cricScore = () => ({ ok: false, status: 500, json: async () => ({}) });

        const { matches, live } = await listMatches();

        expect(matches[0].id).toBe(LIVE_ID);
        expect(live.available).toBe(true);
        expect(live.note).toBe('Live matches could not be refreshed. This list is from earlier.');
        expect(new Date(live.asOf).getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('when the source fails and nothing was kept: the samples, and it says so', async () => {
        answers.cricScore = () => ({ ok: false, status: 500, json: async () => ({}) });

        const { matches, live } = await listMatches();

        expect(matches).toHaveLength(3);
        expect(live).toEqual({ available: false, asOf: null, note: 'Live matches cannot be loaded right now. These are sample matches.' });
    });

    test('an answer that is not a list gives no live matches and does not break the page', async () => {
        answers.cricScore = () => answer({ not: 'a list' });

        const { matches } = await listMatches();

        expect(matches).toHaveLength(3);
    });

    test('at most 40 live matches are listed', async () => {
        answers.cricScore = () => answer(Array.from({ length: 70 }, (_, index) => fixture({ id: `m-${index}`, dateTimeGMT: soon(2 + index) })));

        const { matches } = await listMatches();

        expect(matches.filter((match) => !match.isSample)).toHaveLength(40);
    });
});

describe('one match', () => {
    test('a sample match costs nothing', async () => {
        const found = await getMatch('sample-odi-1');

        expect(found.match.format).toBe('odi');
        expect(found.squads[0].players).toHaveLength(15);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('a live match comes with its squads and each player\'s figures', async () => {
        const found = await getMatch(LIVE_ID);

        expect(found.match.id).toBe(LIVE_ID);
        expect(found.squads.map((squad) => squad.players.map((player) => player.id))).toEqual([['s1', 's2', 's3'], ['p1', 'p2']]);
        expect(found.squads[0].players[0]).toMatchObject({
            role: 'wk', figuresLoaded: true,
            figures: { batting: { innings: 50, runs: 1200, average: 30, strikeRate: 140 }, bowling: null },
        });
        expect(found.note).toBe('');
        expect(pathsCalled().sort()).toEqual(['cricScore', 'match_squad', 'players_info', 'players_info', 'players_info', 'players_info', 'players_info']);
    });

    test('opening it again asks for nothing', async () => {
        await getMatch(LIVE_ID);
        global.fetch.mockClear();

        await getMatch(LIVE_ID);

        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('many visitors opening it at once cause one request for each thing', async () => {
        await Promise.all(Array.from({ length: 25 }, () => getMatch(LIVE_ID)));

        expect(global.fetch).toHaveBeenCalledTimes(7);
    });

    test('an id that is not in the list is not asked for', async () => {
        expect(await getMatch('22222222-aaaa-4bbb-8ccc-000000000002')).toBeNull();
        expect(await getMatch('../players_info')).toBeNull();
        expect(await getMatch({ $ne: '' })).toBeNull();

        expect(pathsCalled().filter((path) => path !== 'cricScore')).toEqual([]);
    });

    test('a player the source has no figures of is kept as that, and not asked for again', async () => {
        answers.players_info = (url) => answer(url.searchParams.get('id') === 's2' ? { id: 's2', name: 'Player s2' } : playerInfo(url.searchParams.get('id')));

        const found = await getMatch(LIVE_ID);
        global.fetch.mockClear();
        await getMatch(LIVE_ID);

        expect(found.squads[0].players[1]).toMatchObject({ id: 's2', figures: null, figuresLoaded: true });
        expect(global.fetch).not.toHaveBeenCalled();
    });

    test('figures stop being fetched before the budget is used up, and the page is told', async () => {
        // the list (1), the squads (10) and two players' figures: 15 are kept back from figures
        process.env.CRICKET_DAILY_BUDGET = '28';

        const found = await getMatch(LIVE_ID);
        const players = found.squads.flatMap((squad) => squad.players);

        expect(players.filter((player) => player.figuresLoaded)).toHaveLength(2);
        expect(players.filter((player) => !player.figuresLoaded).every((player) => player.figures === null)).toBe(true);
        expect(found.note).toBe('The figures of 3 players could not be loaded, so they are scored as players without figures.');
        expect(await used()).toBe(13);
    });

    test('when the squads cannot be loaded the match is shown without them', async () => {
        answers.match_squad = () => ({ ok: false, status: 500, json: async () => ({}) });

        const found = await getMatch(LIVE_ID);

        expect(found.squads.map((squad) => squad.players)).toEqual([[], []]);
        expect(found.note).toBe('The squads cannot be loaded right now.');
    });

    test('squads that are not announced yet are asked for again after six hours, not after a day', async () => {
        answers.match_squad = () => answer([]);
        await getMatch(LIVE_ID);

        const kept = await Cache.findOne({ key: `squad:${LIVE_ID}` });

        expect(kept.freshUntil.getTime() - kept.fetchedAt.getTime()).toBe(6 * HOUR);
    });

    test('the squads are kept for a day and figures for fourteen days', async () => {
        await getMatch(LIVE_ID);

        const squad = await Cache.findOne({ key: `squad:${LIVE_ID}` });
        const figures = await Cache.findOne({ key: 'player:s1' });

        expect(squad.freshUntil.getTime() - squad.fetchedAt.getTime()).toBe(24 * HOUR);
        expect(figures.freshUntil.getTime() - figures.fetchedAt.getTime()).toBe(14 * 24 * HOUR);
    });
});

describe('after the review', () => {
    const refusal = (reason) => ({ ok: true, status: 200, json: async () => ({ status: 'failure', reason }) });
    const failing = () => ({ ok: false, status: 500, json: async () => ({}) });
    const idOf = (url) => url.searchParams.get('id');
    const playersAsked = () => calls.filter((url) => url.pathname.endsWith('players_info')).map(idOf);

    test('a refusal of one thing is not a failure of the source: it is not left alone after it', async () => {
        answers.players_info = () => refusal('ERR: player not found');

        await expect(ask('players_info', { id: 's1' })).rejects.toMatchObject({ reason: 'refused' });
        await expect(ask('cricScore')).resolves.toBeDefined();

        answers.players_info = () => ({ ok: false, status: 404, json: async () => ({}) });
        await expect(ask('players_info', { id: 's1' })).rejects.toMatchObject({ reason: 'refused' });
        await expect(ask('cricScore')).resolves.toBeDefined();
    });

    test('a player the source refuses is asked for once, and the other requests go on', async () => {
        answers.players_info = (url) => (idOf(url) === 's2' ? refusal('ERR: player not found') : answer(playerInfo(idOf(url))));

        const first = await getMatch(LIVE_ID);
        await getMatch(LIVE_ID);
        await getMatch(LIVE_ID);

        expect(playersAsked().filter((id) => id === 's2')).toHaveLength(1);
        expect(playersAsked()).toHaveLength(5);
        const players = first.squads.flatMap((squad) => squad.players);
        expect(players.find((player) => player.id === 's2')).toMatchObject({ figures: null, figuresLoaded: false });
        expect(players.filter((player) => player.figuresLoaded)).toHaveLength(4);
        expect(first.note).toBe('The figures of 1 player could not be loaded, so they are scored as players without figures.');
        // remembered for six hours
        const kept = await Cache.findOne({ key: 'player:s2' });
        expect(kept.freshUntil.getTime() - kept.fetchedAt.getTime()).toBe(6 * HOUR);
    });

    test('a player whose request failed is not asked for again for an hour', async () => {
        answers.players_info = (url) => (idOf(url) === 'p1' ? failing() : answer(playerInfo(idOf(url))));
        jest.spyOn(console, 'log').mockImplementation(() => {});
        await getMatch(LIVE_ID);
        const askedFirst = playersAsked().length;

        resetSource();
        await getMatch(LIVE_ID);
        resetSource();
        await getMatch(LIVE_ID);

        expect(playersAsked().filter((id) => id === 'p1')).toHaveLength(1);
        // whoever was skipped while the source was left alone is fetched on the next visit, once
        expect(askedFirst).toBeLessThanOrEqual(5);
        expect(playersAsked()).toHaveLength(5);
        const kept = await Cache.findOne({ key: 'player:p1' });
        expect(kept.freshUntil.getTime() - kept.fetchedAt.getTime()).toBe(HOUR);
    });

    test('once no more figures can be fetched today, a view costs no request and no count for any player', async () => {
        process.env.CRICKET_DAILY_BUDGET = '28';
        await getMatch(LIVE_ID);
        global.fetch.mockClear();
        const counts = jest.spyOn(Usage, 'findOneAndUpdate');
        const reads = jest.spyOn(Cache, 'findOne');

        const found = await getMatch(LIVE_ID);

        expect(global.fetch).not.toHaveBeenCalled();
        expect(counts).not.toHaveBeenCalled();
        // the list and the squads; the players' figures are read together
        expect(reads).toHaveBeenCalledTimes(2);
        expect(found.squads.flatMap((squad) => squad.players).filter((player) => player.figuresLoaded)).toHaveLength(2);
    });

    test('figures that are too old are still used while new ones cannot be fetched', async () => {
        await getMatch(LIVE_ID);
        await Cache.updateMany({ key: /^player:/ }, { $set: { freshUntil: new Date(Date.now() - 1000) } });
        answers.players_info = failing;
        jest.spyOn(console, 'log').mockImplementation(() => {});

        const found = await getMatch(LIVE_ID);

        const players = found.squads.flatMap((squad) => squad.players);
        expect(players.every((player) => player.figuresLoaded && player.figures.batting.innings === 50)).toBe(true);
        expect(found.note).toBe('');

        // the old figures are not lost by the attempt, and it is not repeated at every visit
        resetSource();
        const before = playersAsked().length;
        const again = await getMatch(LIVE_ID);
        const asked = playersAsked().slice(before - 1);
        resetSource();
        const third = await getMatch(LIVE_ID);

        expect([...again.squads, ...third.squads].flatMap((squad) => squad.players).every((player) => player.figures?.batting.innings === 50)).toBe(true);
        expect(new Set(asked).size).toBe(asked.length);
        expect(new Set(playersAsked().slice(before - 1)).size).toBe(playersAsked().length - before + 1);
    });

    test('squads cannot use up the requests the list needs', async () => {
        // 30 a day: the last 5 are kept for the list, and squads cost 10 each, so two can be fetched
        process.env.CRICKET_DAILY_BUDGET = '30';
        const ids = ['m-1', 'm-2', 'm-3'];
        answers.cricScore = () => answer(ids.map((id, index) => fixture({ id, dateTimeGMT: soon(5 + index) })));

        const [one, two, three] = [await getMatch('m-1'), await getMatch('m-2'), await getMatch('m-3')];

        expect([one, two].every((found) => found.squads[0].players.length === 3)).toBe(true);
        expect(three.squads.map((squad) => squad.players)).toEqual([[], []]);
        expect(three.note).toBe('The squads cannot be loaded right now.');
        expect(await used()).toBe(25);

        await age('matches', 1000);
        const { live } = await listMatches();
        expect(live.note).toBe('');
        expect(await used()).toBe(26);
    });

    test('squads of which one team is announced are asked for again after six hours', async () => {
        answers.match_squad = () => answer([SQUADS[0]]);
        await getMatch(LIVE_ID);

        const kept = await Cache.findOne({ key: `squad:${LIVE_ID}` });

        expect(kept.freshUntil.getTime() - kept.fetchedAt.getTime()).toBe(6 * HOUR);
    });

    test('a match the source lists twice, or under the id of a sample match, is listed once', async () => {
        answers.cricScore = () => answer([fixture(), fixture({ dateTimeGMT: soon(9) }), fixture({ id: 'sample-t20-1' })]);

        const { matches } = await listMatches();

        expect(matches.map((match) => match.id)).toEqual([LIVE_ID, 'sample-t20-1', 'sample-t20-2', 'sample-odi-1']);
        expect(matches[1].isSample).toBe(true);
    });
});

describe('what the source charges', () => {
    test('a request can cost more than one of the day\'s requests, and is refused when fewer are left', async () => {
        process.env.CRICKET_DAILY_BUDGET = '25';

        await ask('match_squad', { id: LIVE_ID }, { cost: 10 });
        await ask('match_squad', { id: LIVE_ID }, { cost: 10 });
        await expect(ask('match_squad', { id: LIVE_ID }, { cost: 10 })).rejects.toMatchObject({ reason: 'budget' });

        expect(await used()).toBe(20);
        expect(global.fetch).toHaveBeenCalledTimes(2);
        // a request that costs one still fits
        await expect(ask('cricScore')).resolves.toBeDefined();
        expect(await used()).toBe(21);
    });

    test('requests of ten that arrive together cannot pass the budget', async () => {
        process.env.CRICKET_DAILY_BUDGET = '35';

        const results = await Promise.allSettled(Array.from({ length: 8 }, () => ask('match_squad', { id: LIVE_ID }, { cost: 10 })));

        expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(3);
        expect(await used()).toBe(30);
    });

    test('the count follows what the source itself says was used today, when that is more', async () => {
        const told = (hitsToday) => () => ({ ok: true, status: 200, json: async () => ({ status: 'success', data: [fixture()], info: { hitsToday, hitsLimit: 100 } }) });

        answers.cricScore = told(40);
        await ask('cricScore');
        expect(await used()).toBe(40);

        // a lower number, or something that is not one, changes nothing
        answers.cricScore = told(7);
        await ask('cricScore');
        expect(await used()).toBe(41);
        answers.cricScore = told('many');
        await ask('cricScore');
        answers.cricScore = told(1e9);
        await ask('cricScore');
        expect(await used()).toBe(43);
    });

    test('opening a live match costs the list, ten for the squads and one for each player', async () => {
        await getMatch(LIVE_ID);

        expect(await used()).toBe(16);
    });

    test('squads are asked for within three days of the start only: earlier they are not announced', async () => {
        answers.cricScore = () => answer([fixture({ id: 'far-1', dateTimeGMT: soon(73) }), fixture({ id: 'near-1', dateTimeGMT: soon(71) })]);

        const far = await getMatch('far-1');
        const near = await getMatch('near-1');

        expect(far.squads.map((squad) => squad.players)).toEqual([[], []]);
        expect(far.note).toBe('Squads are announced closer to the match. They are shown here from three days before its start.');
        expect(near.squads[0].players).toHaveLength(3);
        expect(pathsCalled().filter((path) => path === 'match_squad')).toHaveLength(1);
    });
});
