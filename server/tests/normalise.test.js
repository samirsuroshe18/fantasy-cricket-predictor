import { roleOf, toFigures, toMatch, toSquads } from '../src/cricket/normalise.js';

const NOW = Date.parse('2026-03-01T10:00:00Z');

const rawMatch = (changes = {}) => ({
    id: '0b12f428-98ab-4009-831d-493d325bc555',
    name: 'India vs Australia, 2nd T20I',
    matchType: 't20',
    status: 'Match not started',
    venue: 'Wankhede Stadium, Mumbai',
    date: '2026-03-03',
    dateTimeGMT: '2026-03-03T13:30:00',
    teams: ['India', 'Australia'],
    teamInfo: [
        { name: 'Australia', shortname: 'AUS', img: 'https://g.cricapi.com/iapi/a.png' },
        { name: 'India', shortname: 'IND', img: 'https://g.cricapi.com/iapi/i.png' },
    ],
    matchStarted: false,
    matchEnded: false,
    ...changes,
});

describe('a match', () => {
    test('is read with its teams in the order of the fixture and a UTC start time', () => {
        expect(toMatch(rawMatch(), NOW)).toEqual({
            id: '0b12f428-98ab-4009-831d-493d325bc555',
            name: 'India vs Australia, 2nd T20I',
            format: 't20',
            startsAt: '2026-03-03T13:30:00.000Z',
            venue: 'Wankhede Stadium, Mumbai',
            teams: [
                { name: 'India', shortName: 'IND', logo: 'https://g.cricapi.com/iapi/i.png' },
                { name: 'Australia', shortName: 'AUS', logo: 'https://g.cricapi.com/iapi/a.png' },
            ],
            isSample: false,
        });
    });

    test('an ODI is kept; a test match and an unknown kind are not listed', () => {
        expect(toMatch(rawMatch({ matchType: 'ODI' }), NOW).format).toBe('odi');
        expect(toMatch(rawMatch({ matchType: 'test' }), NOW)).toBeNull();
        expect(toMatch(rawMatch({ matchType: undefined }), NOW)).toBeNull();
        expect(toMatch(rawMatch({ matchType: { $ne: 1 } }), NOW)).toBeNull();
    });

    test('a match that has started, is over, or is more than 7 days away is not listed', () => {
        expect(toMatch(rawMatch({ matchStarted: true }), NOW)).toBeNull();
        expect(toMatch(rawMatch({ matchEnded: true }), NOW)).toBeNull();
        expect(toMatch(rawMatch({ dateTimeGMT: '2026-03-01T09:59:00' }), NOW)).toBeNull();
        expect(toMatch(rawMatch({ dateTimeGMT: '2026-03-08T10:00:01' }), NOW)).toBeNull();
        expect(toMatch(rawMatch({ dateTimeGMT: '2026-03-08T09:59:00' }), NOW)).not.toBeNull();
    });

    test('a match without an id, a readable time or two teams is not listed', () => {
        expect(toMatch(rawMatch({ id: '' }), NOW)).toBeNull();
        expect(toMatch(rawMatch({ id: 42 }), NOW)).toBeNull();
        expect(toMatch(rawMatch({ id: '../../players' }), NOW)).toBeNull();
        expect(toMatch(rawMatch({ dateTimeGMT: 'soon' }), NOW)).toBeNull();
        expect(toMatch(rawMatch({ dateTimeGMT: undefined }), NOW)).toBeNull();
        expect(toMatch(rawMatch({ teams: ['India'] }), NOW)).toBeNull();
        expect(toMatch(rawMatch({ teams: ['India', 'India'] }), NOW)).toBeNull();
        expect(toMatch(rawMatch({ teams: ['India', 'Tbc'] }), NOW)).toBeNull();
        expect(toMatch(rawMatch({ teams: 'India vs Australia' }), NOW)).toBeNull();
        expect(toMatch(null, NOW)).toBeNull();
        expect(toMatch('match', NOW)).toBeNull();
    });

    test('missing team details get a short name made from the name, and no logo', () => {
        const match = toMatch(rawMatch({ teamInfo: undefined, teams: ['Royal Challengers Bengaluru', 'Nepal'] }), NOW);

        expect(match.teams).toEqual([
            { name: 'Royal Challengers Bengaluru', shortName: 'RCB', logo: '' },
            { name: 'Nepal', shortName: 'NEP', logo: '' },
        ]);
    });

    test('a logo that is not an https address is dropped, and long texts are cut', () => {
        const match = toMatch(rawMatch({
            name: 'x'.repeat(500),
            teamInfo: [{ name: 'India', shortname: 'IND', img: 'javascript:alert(1)' }, { name: 'Australia', shortname: 'A'.repeat(40), img: 'http://plain.example/a.png' }],
        }), NOW);

        expect(match.name).toHaveLength(120);
        expect(match.teams.map((team) => team.logo)).toEqual(['', '']);
        expect(match.teams[1].shortName).toHaveLength(6);
    });
});

describe('a role', () => {
    test('is one of four, whatever way the source writes it', () => {
        expect(roleOf('WK-Batsman')).toBe('wk');
        expect(roleOf('Wicketkeeper')).toBe('wk');
        expect(roleOf('Batting Allrounder')).toBe('ar');
        expect(roleOf('Bowling Allrounder')).toBe('ar');
        expect(roleOf('All-Rounder')).toBe('ar');
        expect(roleOf('Bowler')).toBe('bowl');
        expect(roleOf('Batsman')).toBe('bat');
        expect(roleOf('Batter')).toBe('bat');
    });

    test('a role the source does not give is a batter', () => {
        expect(roleOf('--')).toBe('bat');
        expect(roleOf('')).toBe('bat');
        expect(roleOf(undefined)).toBe('bat');
        expect(roleOf({ role: 'Bowler' })).toBe('bat');
    });
});

const MATCH = toMatch(rawMatch(), NOW);

const rawPlayer = (id, name, role, extra = {}) => ({
    id, name, role, battingStyle: 'Right Handed Bat', bowlingStyle: 'Right-arm offbreak', country: 'India',
    playerImg: 'https://h.cricapi.com/img/players/x.jpg', ...extra,
});

describe('the squads', () => {
    const raw = [
        { teamName: 'Australia', shortname: 'AUS', players: [rawPlayer('a1', 'Travis Head', 'Batsman', { country: 'Australia' })] },
        { teamName: 'India', shortname: 'IND', players: [rawPlayer('i1', 'Rishabh Pant', 'WK-Batsman'), rawPlayer('i2', 'Jasprit Bumrah', 'Bowler')] },
    ];

    test('are given in the order of the match, each player with a team and a role', () => {
        const squads = toSquads(raw, MATCH);

        expect(squads.map((squad) => [squad.team, squad.players.length])).toEqual([['India', 2], ['Australia', 1]]);
        expect(squads[0].players[0]).toEqual({
            id: 'i1', name: 'Rishabh Pant', team: 'India', role: 'wk', battingStyle: 'Right Handed Bat',
            bowlingStyle: 'Right-arm offbreak', country: 'India', image: 'https://h.cricapi.com/img/players/x.jpg',
        });
    });

    test('a team the source left out has an empty squad', () => {
        expect(toSquads([raw[1]], MATCH).map((squad) => squad.players.length)).toEqual([2, 0]);
        expect(toSquads(undefined, MATCH).map((squad) => squad.players.length)).toEqual([0, 0]);
        expect(toSquads('none', MATCH).map((squad) => squad.players.length)).toEqual([0, 0]);
    });

    test('a team of another match is ignored', () => {
        const squads = toSquads([...raw, { teamName: 'England', players: [rawPlayer('e1', 'Joe Root', 'Batsman')] }], MATCH);

        expect(squads.flatMap((squad) => squad.players).map((player) => player.id)).toEqual(['i1', 'i2', 'a1']);
    });

    test('a player without an id or a name, and a player listed twice, are dropped', () => {
        const squads = toSquads([
            { teamName: 'India', players: [rawPlayer('i1', 'Rishabh Pant', 'WK-Batsman'), rawPlayer('i1', 'Rishabh Pant', 'WK-Batsman'), rawPlayer('', 'Nobody', 'Bowler'), rawPlayer('i3', '', 'Bowler'), null, 'x', rawPlayer({ a: 1 }, 'Odd', 'Bowler')] },
            { teamName: 'Australia', players: [rawPlayer('i1', 'Rishabh Pant', 'WK-Batsman'), rawPlayer('a1', 'Travis Head', 'Batsman')] },
        ], MATCH);

        expect(squads.map((squad) => squad.players.map((player) => player.id))).toEqual([['i1'], ['a1']]);
    });

    test('a squad is at most 30 players, and odd details are emptied', () => {
        const many = Array.from({ length: 45 }, (_, index) => rawPlayer(`p${index}`, `Player ${index}`, 'Bowler', { battingStyle: 7, bowlingStyle: null, country: ['x'], playerImg: 'not a link' }));
        const squads = toSquads([{ teamName: 'India', players: many }], MATCH);

        expect(squads[0].players).toHaveLength(30);
        expect(squads[0].players[0]).toMatchObject({ battingStyle: '', bowlingStyle: '', country: '', image: '' });
    });

    test('the source\'s placeholder picture is not kept', () => {
        const squads = toSquads([{ teamName: 'India', players: [rawPlayer('i1', 'Rishabh Pant', 'WK-Batsman', { playerImg: 'https://h.cricapi.com/img/icon512.png' })] }], MATCH);

        expect(squads[0].players[0].image).toBe('');
    });
});

const stat = (fn, matchtype, name, value) => ({ fn, matchtype, stat: name, value });

const info = (stats) => ({ id: 'i1', name: 'Rishabh Pant', stats });

describe('career figures', () => {
    const T20 = [
        stat('batting', 't20', ' m ', ' 180 '), stat('batting', 't20', ' inn ', ' 170 '), stat('batting', 't20', ' runs ', ' 4500 '),
        stat('batting', 't20', ' avg ', ' 31.25 '), stat('batting', 't20', ' sr ', ' 145.5 '),
        stat('bowling', 't20', ' inn ', ' 12 '), stat('bowling', 't20', ' wkts ', ' 9 '), stat('bowling', 't20', ' econ ', ' 8.4 '),
    ];

    test('are read for the format of the match, numbers written as text with spaces included', () => {
        expect(toFigures(info(T20), 't20')).toEqual({
            batting: { innings: 170, runs: 4500, average: 31.25, strikeRate: 145.5 },
            bowling: { innings: 12, wickets: 9, economy: 8.4 },
        });
    });

    test('for a T20 match: t20 figures first, then t20i, then ipl', () => {
        const only = (type) => info([stat('batting', type, 'inn', '20'), stat('batting', type, 'runs', '400'), stat('batting', type, 'avg', '25'), stat('batting', type, 'sr', '130')]);

        expect(toFigures(only('t20i'), 't20').batting.innings).toBe(20);
        expect(toFigures(only('ipl'), 't20').batting.innings).toBe(20);
        expect(toFigures(only('T20'), 't20').batting.innings).toBe(20);
        expect(toFigures(info([...only('ipl').stats, stat('batting', 't20i', 'inn', '7'), stat('batting', 't20i', 'avg', '9'), stat('batting', 't20i', 'sr', '99')]), 't20').batting.innings).toBe(7);
        expect(toFigures(only('odi'), 't20')).toBeNull();
    });

    test('for an ODI: odi figures only', () => {
        expect(toFigures(info(T20), 'odi')).toBeNull();
        expect(toFigures(info([stat('bowling', 'odi', 'inn', '50'), stat('bowling', 'odi', 'wkts', '80'), stat('bowling', 'odi', 'econ', '4.9')]), 'odi')).toEqual({
            batting: null,
            bowling: { innings: 50, wickets: 80, economy: 4.9 },
        });
    });

    test('a part without innings, or with a value that is not a number, is absent', () => {
        const figures = toFigures(info([
            stat('batting', 't20', 'inn', '40'), stat('batting', 't20', 'runs', '900'), stat('batting', 't20', 'avg', '-'), stat('batting', 't20', 'sr', '120'),
            stat('bowling', 't20', 'inn', '0'), stat('bowling', 't20', 'wkts', '0'), stat('bowling', 't20', 'econ', '-'),
        ]), 't20');

        // an average of "-" (never out) cannot be used, so the batting is read without one
        expect(figures).toEqual({ batting: { innings: 40, runs: 900, average: 0, strikeRate: 120 }, bowling: null });
    });

    test('negative, endless and absurd numbers never get through', () => {
        const figures = toFigures(info([
            stat('batting', 't20', 'inn', '25'), stat('batting', 't20', 'runs', '-5'), stat('batting', 't20', 'avg', 'Infinity'), stat('batting', 't20', 'sr', '1e999'),
            stat('bowling', 't20', 'inn', '10'), stat('bowling', 't20', 'wkts', 'NaN'), stat('bowling', 't20', 'econ', '99999'),
        ]), 't20');

        expect(figures.batting).toEqual({ innings: 25, runs: 0, average: 0, strikeRate: 0 });
        expect(figures.bowling).toEqual({ innings: 10, wickets: 0, economy: 36 });
        Object.values({ ...figures.batting, ...figures.bowling }).forEach((value) => expect(Number.isFinite(value)).toBe(true));
    });

    test('no figures at all, or an answer of another shape, is null', () => {
        expect(toFigures(info([]), 't20')).toBeNull();
        expect(toFigures(info(undefined), 't20')).toBeNull();
        expect(toFigures(info('stats'), 't20')).toBeNull();
        expect(toFigures(info([null, 4, { fn: 'batting' }, { fn: {}, matchtype: [], stat: 1, value: {} }]), 't20')).toBeNull();
        expect(toFigures(null, 't20')).toBeNull();
    });
});
