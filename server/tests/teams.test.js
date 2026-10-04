import { jest } from '@jest/globals';

// the language model is never really asked in tests
const generateJson = jest.fn();
const assistantReady = jest.fn(() => true);
jest.unstable_mockModule('../src/prediction/gemini.js', () => ({ generateJson, assistantReady }));

const request = (await import('supertest')).default;
const { default: app } = await import('../src/app.js');
const { Team } = await import('../src/models/team.model.js');
const { User } = await import('../src/models/user.model.js');
const { Usage } = await import('../src/models/usage.model.js');
const { rebuildDemo, startDemo } = await import('../src/scripts/demoData.js');
const { DEMO_EMAIL } = await import('../src/utils/demo.js');
const { forgetFailures } = await import('../src/prediction/explanation.js');
const { createUser, loggedIn, PASSWORD } = await import('./helpers.js');

const MATCH = 'sample-t20-1';
const prediction = (id = MATCH) => `/api/v1/matches/${id}/prediction`;
const teams = '/api/v1/teams';

const TEXT = { summary: 'A balanced side.', captaincy: 'The best scorer leads.', nearMisses: [] };

beforeEach(() => {
    generateJson.mockReset();
    assistantReady.mockReset();
    assistantReady.mockReturnValue(true);
    generateJson.mockResolvedValue(TEXT);
    forgetFailures();
});

const SETTINGS = ['DAILY_PREDICTION_LIMIT', 'DEMO_CONNECTION_PREDICTION_LIMIT', 'MAX_TEAMS', 'MAX_DEMO_TEAMS', 'ACCOUNT_RATE_LIMIT', 'WRITE_RATE_LIMIT', 'WRITE_CONNECTION_RATE_LIMIT'];
afterEach(() => {
    SETTINGS.forEach((name) => delete process.env[name]);
    jest.restoreAllMocks();
});

const predicted = async (agent, id = MATCH) => (await agent.post(prediction(id))).body.data;
const bodyOf = (data, changes = {}) => ({
    matchId: data.match.id, name: 'My first team', playerIds: data.players.map((player) => player.id),
    captainId: data.captainId, viceCaptainId: data.viceCaptainId, ...changes,
});
const saved = async (agent, changes = {}, id = MATCH) => {
    // the prediction first: two requests of one agent are not started at the same time
    const data = await predicted(agent, id);
    const res = await agent.post(teams).send(bodyOf(data, changes));
    if (res.status !== 201) throw new Error(`save failed: ${res.status} ${res.body.message}`);
    return res.body.data.team;
};
const demoAgent = async () => {
    const agent = request.agent(app);
    await agent.post('/api/v1/users/demo-login');
    return agent;
};

describe('a prediction', () => {
    test('needs a login and a verified address', async () => {
        const anonymous = await request(app).post(prediction());
        const { agent } = await loggedIn({ isVerified: false });
        const unverified = await agent.post(prediction());

        expect([anonymous.status, anonymous.body.message]).toEqual([401, 'Log in to continue']);
        expect([unverified.status, unverified.body.message]).toEqual([403, 'Verify your email to do this']);
        expect(generateJson).not.toHaveBeenCalled();
    });

    test('is the best eleven with captain, vice-captain, players left out and the explanation', async () => {
        const { agent } = await loggedIn();

        const res = await agent.post(prediction());

        expect(res.status).toBe(200);
        const { match, players, captainId, viceCaptainId, total, bench, explanation, remaining, note } = res.body.data;
        expect(match.id).toBe(MATCH);
        expect(players).toHaveLength(11);
        expect(players[0]).toEqual(expect.objectContaining({ id: expect.any(String), name: expect.any(String), team: expect.any(String), role: 'wk', score: expect.any(Number) }));
        expect(players.map((player) => player.id)).toContain(captainId);
        expect(players.map((player) => player.id)).toContain(viceCaptainId);
        expect(total).toBeCloseTo(players.reduce((sum, player) => sum + player.score, 0), 5);
        expect(bench).toHaveLength(5);
        expect(explanation).toEqual(TEXT);
        expect([remaining, note]).toEqual([19, '']);
    });

    test('asking again gives the same team and text without asking the model again', async () => {
        const { agent } = await loggedIn();
        const other = await loggedIn();

        const first = await predicted(agent);
        const second = await predicted(other.agent);

        expect(second.players).toEqual(first.players);
        expect(second.explanation).toEqual(first.explanation);
        expect(generateJson).toHaveBeenCalledTimes(1);
    });

    test('comes without text when the model fails', async () => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        generateJson.mockRejectedValue(new Error('down'));
        const { agent } = await loggedIn();

        const res = await agent.post(prediction());

        expect(res.status).toBe(200);
        expect(res.body.data.players).toHaveLength(11);
        expect(res.body.data.explanation).toBeNull();
    });

    test('a user gets a limited number a day; another user is not affected', async () => {
        process.env.DAILY_PREDICTION_LIMIT = '2';
        const { agent } = await loggedIn();
        const other = await loggedIn();

        const statuses = [];
        for (let attempt = 0; attempt < 3; attempt += 1) statuses.push((await agent.post(prediction())).status);
        const refused = await agent.post(prediction());

        expect(statuses).toEqual([200, 200, 429]);
        expect(refused.body.message).toBe("You have used today's predictions. Please come back tomorrow.");
        expect((await other.agent.post(prediction())).status).toBe(200);
    });

    test('visitors of the demo account each have their own allowance', async () => {
        await rebuildDemo();
        process.env.DAILY_PREDICTION_LIMIT = '1';
        const agent = await demoAgent();
        const ask = (address) => agent.post(prediction()).set('X-Forwarded-For', `${address}, 198.51.100.60`);

        expect((await ask('203.0.113.10')).status).toBe(200);
        expect((await ask('203.0.113.10')).status).toBe(429);
        expect((await ask('203.0.113.11')).status).toBe(200);
    });

    test('made-up visitors of the demo account from one caller are capped by the address they really come from', async () => {
        await rebuildDemo();
        process.env.DAILY_PREDICTION_LIMIT = '1';
        process.env.DEMO_CONNECTION_PREDICTION_LIMIT = '3';
        const agent = await demoAgent();
        const ask = (address, connection = '198.51.100.61') => agent.post(prediction()).set('X-Forwarded-For', `${address}, ${connection}`);

        const statuses = [];
        for (let attempt = 0; attempt < 5; attempt += 1) statuses.push((await ask(`203.0.113.${20 + attempt}`)).status);

        expect(statuses).toEqual([200, 200, 200, 429, 429]);
        // nothing is remembered about the visitors that were refused
        expect(await Usage.countDocuments({ key: /^predict:demo:/ })).toBe(3);
        expect((await ask('203.0.113.40', '198.51.100.62')).status).toBe(200);
    });

    test('changes from one caller are limited by the address they really come from, whatever visitor they claim to be', async () => {
        await rebuildDemo();
        process.env.ACCOUNT_RATE_LIMIT = '100';
        process.env.WRITE_CONNECTION_RATE_LIMIT = '2';
        const agent = await demoAgent();

        const statuses = [];
        for (let attempt = 0; attempt < 4; attempt += 1) {
            statuses.push((await agent.post(prediction()).set('X-Forwarded-For', `203.0.113.${50 + attempt}, 198.51.100.63`)).status);
        }
        const reading = await agent.get(teams).set('X-Forwarded-For', '203.0.113.60, 198.51.100.63');

        expect(statuses).toEqual([200, 200, 429, 429]);
        // reading is not limited
        expect(reading.status).toBe(200);
    });

    test('a match that does not exist is not found, and does not count', async () => {
        const { user, agent } = await loggedIn();

        const res = await agent.post(prediction('sample-t20-9'));

        expect([res.status, res.body.message]).toEqual([404, 'Match not found']);
        expect(await Usage.findOne({ key: `predict:${user._id}` })).toBeNull();
    });
});

describe('saving a team', () => {
    test('needs a login and a verified address', async () => {
        const { agent } = await loggedIn({ isVerified: false });

        expect((await request(app).post(teams).send({})).status).toBe(401);
        expect((await request(app).get(teams)).status).toBe(401);
        expect((await agent.post(teams).send({})).status).toBe(403);
    });

    test('keeps the match, the squads as they were, the eleven and the explanation', async () => {
        const { user, agent } = await loggedIn();
        const data = await predicted(agent);

        const res = await agent.post(teams).send(bodyOf(data, { name: '  Weekend team  ' }));

        expect(res.status).toBe(201);
        const { team } = res.body.data;
        expect(team).toMatchObject({
            name: 'Weekend team', isEdited: false, captainId: data.captainId, viceCaptainId: data.viceCaptainId,
            total: data.total, explanation: TEXT, match: { id: MATCH, format: 't20', isSample: true },
        });
        expect(team.players).toEqual(data.players);
        expect(team.squads.map((squad) => squad.players.length)).toEqual([15, 15]);
        expect((await Team.findById(team._id)).user.toString()).toBe(user._id.toString());
    });

    test('a team that is not the suggested one is marked as edited and has no explanation', async () => {
        const { agent } = await loggedIn();
        const data = await predicted(agent);

        const team = (await agent.post(teams).send(bodyOf(data, { captainId: data.viceCaptainId, viceCaptainId: data.captainId }))).body.data.team;

        expect([team.isEdited, team.explanation]).toEqual([true, null]);
    });

    test('only ids are taken from the request: names and scores are the server\'s own', async () => {
        const { agent } = await loggedIn();
        const data = await predicted(agent);

        const res = await agent.post(teams).send({
            ...bodyOf(data), total: 9999, isEdited: false, isDemo: true, user: '000000000000000000000000',
            explanation: { summary: 'Made up' }, players: [{ id: 'x', name: 'Made Up', score: 100 }], squads: [], match: { name: 'Made up' },
        });

        expect(res.status).toBe(201);
        const { team } = res.body.data;
        expect(team.total).toBe(data.total);
        expect(team.players).toEqual(data.players);
        expect(team.match.name).toBe(data.match.name);
        expect(team.explanation).toEqual(TEXT);
        expect((await Team.findById(team._id)).isDemo).toBe(false);
    });

    test.each([
        ['no name', { name: '   ' }, 'Name is required'],
        ['a long name', { name: 'n'.repeat(61) }, 'Name must be at most 60 characters'],
        ['a name that is not text', { name: { $gt: '' } }, 'Name must be text'],
        ['ten players', (data) => ({ playerIds: data.players.slice(0, 10).map((player) => player.id) }), 'A team has 11 players'],
        ['a player twice', (data) => ({ playerIds: [...data.players.slice(0, 10).map((player) => player.id), data.players[0].id] }), 'A player can be picked only once'],
        ['a player of another match', (data) => ({ playerIds: [...data.players.slice(0, 10).map((player) => player.id), 'sample-del-01'] }), 'Every player must be in the squads of this match'],
        ['a captain outside the team', (data) => ({ captainId: data.bench[0].id }), 'The captain must be one of the eleven'],
        ['one player as both', (data) => ({ viceCaptainId: data.captainId }), 'The captain and the vice-captain must be two different players'],
    ])('%s is refused', async (_, changes, message) => {
        const { agent } = await loggedIn();
        const data = await predicted(agent);

        const res = await agent.post(teams).send(bodyOf(data, typeof changes === 'function' ? changes(data) : changes));

        expect([res.status, res.body.message]).toEqual([400, message]);
        expect(await Team.countDocuments()).toBe(0);
    });

    test('a team that breaks the number of a role is refused', async () => {
        const { agent } = await loggedIn();
        const data = await predicted(agent);
        const match = (await request(app).get(`/api/v1/matches/${MATCH}`)).body.data;
        const all = match.squads.flatMap((squad) => squad.players);
        // every bowler out, batters and keepers in
        const bowlers = data.players.filter((player) => player.role === 'bowl');
        const spare = all.filter((player) => player.role !== 'bowl' && !data.players.some((chosen) => chosen.id === player.id));
        const playerIds = data.players.map((player) => (player.role === 'bowl' ? spare[bowlers.indexOf(player)].id : player.id));

        const res = await agent.post(teams).send(bodyOf(data, { playerIds }));

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/^A team (needs|can have)/);
    });

    test('a match that does not exist is not found', async () => {
        const { agent } = await loggedIn();
        const data = await predicted(agent);

        for (const matchId of ['sample-t20-9', undefined, { $ne: '' }, 42]) {
            const res = await agent.post(teams).send(bodyOf(data, { matchId }));
            expect([res.status, res.body.message]).toEqual([404, 'Match not found']);
        }
    });

    test('an account holds a limited number of teams, and saves that arrive together get exactly the places that are left', async () => {
        process.env.MAX_TEAMS = '3';
        await Team.init();
        const user = await createUser();
        // one listening server, so requests can really be under way together
        const server = app.listen(0);
        try {
            const agent = request.agent(server);
            await agent.post('/api/v1/users/login').send({ email: user.email, password: PASSWORD });
            const data = await predicted(agent);
            const save = (n) => agent.post(teams).send(bodyOf(data, { name: `Team ${n}` }));
            const held = () => Team.countDocuments({ user: user._id });

            // two held, one place left, three saves together: one gets it
            await save(1);
            await save(2);
            const lastPlace = await Promise.all([save(3), save(4), save(5)]);
            expect(lastPlace.map((res) => res.status).sort()).toEqual([201, 409, 409]);
            expect(await held()).toBe(3);

            // none held, five saves together: three get a place
            await Team.deleteMany({ user: user._id });
            const fromEmpty = await Promise.all([1, 2, 3, 4, 5].map(save));
            expect(fromEmpty.filter((res) => res.status === 201)).toHaveLength(3);
            expect(await held()).toBe(3);

            const late = await save(6);
            expect([late.status, late.body.message]).toEqual([409, 'You can save at most 3 teams. Delete one to save another.']);

            // a place that was given up can be taken again
            const first = (await agent.get(teams)).body.data.teams[0];
            await agent.delete(`${teams}/${first._id}`);
            expect((await save(7)).status).toBe(201);
            expect(await held()).toBe(3);
        } finally {
            await new Promise((resolve) => server.close(resolve));
        }
    });
});

describe('saved teams', () => {
    test('are listed newest first, without their squads', async () => {
        const { agent } = await loggedIn();
        const first = await saved(agent, { name: 'First' });
        const second = await saved(agent, { name: 'Second' }, 'sample-odi-1');

        const res = await agent.get(teams);

        expect(res.status).toBe(200);
        expect(res.body.data.teams.map((team) => team.name)).toEqual(['Second', 'First']);
        expect(res.body.data.teams[1]).toEqual({
            _id: first._id, name: 'First', match: first.match, total: first.total, isEdited: false,
            captain: first.players.find((player) => player.id === first.captainId).name,
            viceCaptain: first.players.find((player) => player.id === first.viceCaptainId).name,
            createdAt: first.createdAt, updatedAt: first.updatedAt,
        });
        expect(res.body.data.limit).toBe(50);
        expect(second.match.format).toBe('odi');
    });

    test('belong to their owner: for anyone else they do not exist', async () => {
        const owner = await loggedIn();
        const other = await loggedIn();
        const team = await saved(owner.agent);

        const responses = [
            await other.agent.get(`${teams}/${team._id}`),
            await other.agent.put(`${teams}/${team._id}`).send({ name: 'Mine now' }),
            await other.agent.delete(`${teams}/${team._id}`),
        ];

        expect(responses.map((res) => [res.status, res.body.message])).toEqual(Array(3).fill([404, 'Team not found']));
        expect((await other.agent.get(teams)).body.data.teams).toEqual([]);
        expect((await Team.findById(team._id)).name).toBe('My first team');
        expect((await owner.agent.get(`${teams}/not-an-id`)).status).toBe(404);
    });

    test('can be opened with everything needed to edit them', async () => {
        const { agent } = await loggedIn();
        const team = await saved(agent);

        const res = await agent.get(`${teams}/${team._id}`);

        expect(res.status).toBe(200);
        expect(res.body.data.team).toEqual(team);
    });

    test('can be renamed without losing the explanation', async () => {
        const { agent } = await loggedIn();
        const team = await saved(agent);

        const res = await agent.put(`${teams}/${team._id}`).send({ name: 'Renamed' });

        expect(res.status).toBe(200);
        expect(res.body.data.team).toMatchObject({ name: 'Renamed', isEdited: false, explanation: TEXT, total: team.total });
    });

    test('a changed captain or player marks the team as edited, drops the explanation and gives the new total', async () => {
        const { agent } = await loggedIn();
        const team = await saved(agent);
        const all = team.squads.flatMap((squad) => squad.players);
        const out = team.players.filter((player) => player.role === 'bat').at(-1);
        const into = all.find((player) => player.role === 'bat' && player.team === out.team && !team.players.some((chosen) => chosen.id === player.id));
        const playerIds = team.players.map((player) => (player.id === out.id ? into.id : player.id));
        const captainId = playerIds.find((id) => id !== out.id && id !== team.viceCaptainId && id !== team.captainId) || playerIds[0];

        const res = await agent.put(`${teams}/${team._id}`).send({ playerIds, captainId, viceCaptainId: team.viceCaptainId === out.id ? playerIds.find((id) => id !== captainId) : team.viceCaptainId });

        expect(res.status).toBe(200);
        const changed = res.body.data.team;
        expect([changed.isEdited, changed.explanation, changed.captainId]).toEqual([true, null, captainId]);
        expect(changed.players.map((player) => player.id)).toContain(into.id);
        expect(changed.total).toBeCloseTo(team.total - out.score + into.score, 5);
        expect(changed.name).toBe(team.name);
    });

    test('an edit that breaks a rule is refused and changes nothing', async () => {
        const { agent } = await loggedIn();
        const team = await saved(agent);

        const responses = [
            await agent.put(`${teams}/${team._id}`).send({ captainId: team.viceCaptainId }),
            await agent.put(`${teams}/${team._id}`).send({ playerIds: team.players.slice(0, 10).map((player) => player.id) }),
            await agent.put(`${teams}/${team._id}`).send({ playerIds: [...team.players.slice(0, 10).map((player) => player.id), 'sample-del-01'] }),
            await agent.put(`${teams}/${team._id}`).send({ name: '' }),
            await agent.put(`${teams}/${team._id}`).send({}),
        ];

        expect(responses.map((res) => [res.status, res.body.message])).toEqual([
            [400, 'The captain and the vice-captain must be two different players'],
            [400, 'A team has 11 players'],
            [400, 'Every player must be in the squads of this match'],
            [400, 'Name is required'],
            [400, 'Nothing to change'],
        ]);
        expect((await agent.get(`${teams}/${team._id}`)).body.data.team).toEqual(team);
    });

    test('can be deleted', async () => {
        const { agent } = await loggedIn();
        const team = await saved(agent);

        const res = await agent.delete(`${teams}/${team._id}`);

        expect([res.status, res.body.message]).toEqual([200, 'Team deleted']);
        expect(await Team.countDocuments()).toBe(0);
        expect((await agent.delete(`${teams}/${team._id}`)).status).toBe(404);
    });
});

describe('the demo account', () => {
    test('starts with three saved teams of the sample matches, each a valid team', async () => {
        const { teams: count } = await rebuildDemo();
        const agent = await demoAgent();

        const list = (await agent.get(teams)).body.data;

        expect(count).toBe(3);
        expect(list.limit).toBe(20);
        expect(list.teams.map((team) => team.match.id).sort()).toEqual(['sample-odi-1', 'sample-t20-1', 'sample-t20-2']);
        expect(list.teams.some((team) => team.isEdited)).toBe(true);

        for (const entry of list.teams) {
            const { team } = (await agent.get(`${teams}/${entry._id}`)).body.data;
            expect(team.players).toHaveLength(11);
            expect(team.total).toBeCloseTo(team.players.reduce((sum, player) => sum + player.score, 0), 5);
            // saving the same team again is accepted: it keeps to the rules
            const again = await agent.post(teams).send({ matchId: team.match.id, name: 'Copy', playerIds: team.players.map((player) => player.id), captainId: team.captainId, viceCaptainId: team.viceCaptainId });
            expect(again.status).toBe(201);
        }
        expect(generateJson).not.toHaveBeenCalled();
    });

    test('a rebuild undoes what visitors did, keeps them logged in, and leaves real users alone', async () => {
        await rebuildDemo();
        const agent = await demoAgent();
        const real = await loggedIn();
        const mine = await saved(real.agent);
        await saved(agent, { name: 'A visitor was here' });
        const first = (await agent.get(teams)).body.data.teams;
        await agent.delete(`${teams}/${first.at(-1)._id}`);

        await rebuildDemo();

        const after = (await agent.get(teams)).body;
        expect(after.statusCode).toBe(200);
        expect(after.data.teams).toHaveLength(3);
        expect(after.data.teams.some((team) => team.name === 'A visitor was here')).toBe(false);
        expect((await real.agent.get(`${teams}/${mine._id}`)).status).toBe(200);
        expect(await User.countDocuments({ email: DEMO_EMAIL })).toBe(1);
    });

    test('holds fewer teams than a real account', async () => {
        await rebuildDemo();
        process.env.MAX_DEMO_TEAMS = '4';
        const agent = await demoAgent();

        await saved(agent, { name: 'Fourth' });
        const data = await predicted(agent);
        const res = await agent.post(teams).send(bodyOf(data, { name: 'Fifth' }));

        expect([res.status, res.body.message]).toEqual([409, 'You can save at most 4 teams. Delete one to save another.']);
    });

    test('a rebuild that cannot finish is reported, not thrown, at the start of the server', async () => {
        const log = jest.spyOn(console, 'log').mockImplementation(() => {});

        expect(await startDemo(async () => { throw new Error('no database'); })).toBe(false);
        expect(await startDemo()).toBe(true);
        // the places of the demo's teams are taken in order, so a visitor's team gets the next one
        expect((await Team.find({ isDemo: true }).sort({ slot: 1 })).map((team) => team.slot)).toEqual([0, 1, 2]);
        expect(log.mock.calls.flat().join(' ')).toContain('no database');
    });

    test('a user cannot change someone else\'s team through the demo either', async () => {
        await rebuildDemo();
        const owner = await createUser();
        const agent = await demoAgent();
        const demoTeam = (await agent.get(teams)).body.data.teams[0];

        expect((await Team.findById(demoTeam._id)).user.toString()).not.toBe(owner._id.toString());
        expect((await Team.findById(demoTeam._id)).isDemo).toBe(true);
    });
});
