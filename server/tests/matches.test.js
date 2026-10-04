import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { restSource } from '../src/cricket/source.js';

const matches = '/api/v1/matches';

afterEach(() => {
    delete process.env.CRICKET_API_KEY;
    delete process.env.ACCOUNT_RATE_LIMIT;
    delete process.env.PUBLIC_RATE_LIMIT;
    delete global.fetch;
});

describe('the list of matches', () => {
    test('is open to everyone and says where it is from', async () => {
        const res = await request(app).get(matches);

        expect(res.status).toBe(200);
        expect(res.body.data.matches.map((match) => match.id)).toEqual(['sample-t20-1', 'sample-t20-2', 'sample-odi-1']);
        expect(res.body.data.matches[0]).toEqual({
            id: 'sample-t20-1',
            name: 'Mumbai Mariners vs Chennai Chargers, Sample Premier League',
            format: 't20',
            startsAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:00:00\.000Z$/),
            venue: 'Harbour Stadium, Mumbai',
            teams: [{ name: 'Mumbai Mariners', shortName: 'MUM', logo: '' }, { name: 'Chennai Chargers', shortName: 'CHE', logo: '' }],
            isSample: true,
        });
        expect(res.body.data.live).toEqual({ available: false, asOf: null, note: 'Live matches are not set up on this server. These are sample matches.' });
    });

    test('never shows the key of the cricket source', async () => {
        process.env.CRICKET_API_KEY = 'a-secret-key';
        restSource(0);
        global.fetch = jest.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }));
        const log = jest.spyOn(console, 'log').mockImplementation(() => {});

        const res = await request(app).get(matches);

        expect(res.status).toBe(200);
        expect(JSON.stringify(res.body)).not.toContain('a-secret-key');
        log.mockRestore();
    });
});

describe('one match', () => {
    test('comes with both squads, and every player with a score', async () => {
        const res = await request(app).get(`${matches}/sample-t20-1`);

        expect(res.status).toBe(200);
        const { match, squads, note } = res.body.data;
        expect([match.id, note]).toEqual(['sample-t20-1', '']);
        expect(squads.map((squad) => [squad.team, squad.players.length])).toEqual([['Mumbai Mariners', 15], ['Chennai Chargers', 15]]);

        // Rohan Deshpande: batting 60 x 34.2/40 + 40 x 138.9/160 = 51.3 + 34.725 = 86.0;
        // bowling (60 x (6/14)/1.5 + 40 x (10-8.9)/4) x 1 = 17.14 + 11 = 28.1; 0.9 x 86.025 + 0.1 x 28.14 = 80.2
        expect(squads[0].players[2]).toEqual({
            id: 'sample-mum-03', name: 'Rohan Deshpande', team: 'Mumbai Mariners', role: 'bat',
            battingStyle: 'Right Handed Bat', bowlingStyle: 'Right-arm offbreak', country: 'India', image: '',
            figures: { batting: { innings: 201, runs: 6010, average: 34.2, strikeRate: 138.9 }, bowling: { innings: 14, wickets: 6, economy: 8.9 } },
            figuresLoaded: true,
            score: 80.2, battingScore: 86, bowlingScore: 28.1, hasFigures: true,
        });
        // a player without figures
        expect(squads[0].players[14]).toMatchObject({ name: 'Zaid Khan', figures: null, score: 35, hasFigures: false });
    });

    test('a match that does not exist is not found', async () => {
        for (const id of ['sample-t20-9', 'nothing', '..%2F..%2Fusers', 'x'.repeat(200)]) {
            const res = await request(app).get(`${matches}/${id}`);

            expect([res.status, res.body.message, res.body.data]).toEqual([404, 'Match not found', null]);
        }
    });
});

describe('the limit of what is open to everyone', () => {
    test('a visitor can read only so often in a while', async () => {
        process.env.ACCOUNT_RATE_LIMIT = '100';
        process.env.PUBLIC_RATE_LIMIT = '3';
        const read = (address) => request(app).get(matches).set('X-Forwarded-For', `${address}, 198.51.100.80`);

        const statuses = [];
        for (let attempt = 0; attempt < 5; attempt += 1) {
            statuses.push((await read('203.0.113.90')).status);
        }

        expect(statuses).toEqual([200, 200, 200, 429, 429]);
        expect((await read('203.0.113.91')).status).toBe(200);
    });
});
