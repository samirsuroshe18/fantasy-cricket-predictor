import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../src/utils/demo.js';
import { createUser, loggedIn, loginAgent, PASSWORD } from './helpers.js';

const users = '/api/v1/users';
const verify = '/api/v1/verify';

const register = (body) => request(app).post(`${users}/register`).send(body);
const good = { name: 'Asha Rao', email: 'Asha@Example.com', password: 'long-enough' };
const demoUser = () => createUser({ email: DEMO_EMAIL, password: DEMO_PASSWORD, isDemo: true, name: 'Demo' });

describe('the server', () => {
    test('health answers ok', async () => {
        const res = await request(app).get('/api/v1/health');
        expect(res.body).toEqual({ statusCode: 200, data: { status: 'ok' }, message: 'OK', success: true });
    });

    test('an unknown route is a 404 in the common shape', async () => {
        const res = await request(app).get('/api/v1/nope');
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ statusCode: 404, data: null, message: 'Route not found', success: false });
    });

    test('a body that is not JSON is refused, not a server error', async () => {
        const res = await request(app).post(`${users}/login`).set('content-type', 'application/json').send('{broken');
        expect(res.status).toBe(400);
    });
});

describe('signing up', () => {
    test('creates an unverified account and a verification link', async () => {
        const res = await register(good);

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Account created. Check your email for the verification link.');
        const user = await User.findOne({ email: 'asha@example.com' });
        expect(user).toMatchObject({ name: 'Asha Rao', isVerified: false, isDemo: false });
        expect(user.password).not.toBe(good.password);
        expect(user.verifyToken).toMatch(/^[0-9a-f]{64}$/);
        expect(res.headers['set-cookie']).toBeUndefined();
    });

    test('needs a name, a real-looking address and a password of 8 characters', async () => {
        expect((await register({ ...good, name: '' })).body.message).toBe('Name, email and password are required');
        expect((await register({ ...good, email: 'not-an-address' })).body.message).toBe('Enter a valid email address');
        expect((await register({ ...good, password: 'short' })).body.message).toBe('Password must be at least 8 characters');
        expect((await register({ ...good, password: { $gt: '' } })).status).toBe(400);
        expect((await register({ ...good, name: { $gt: '' } })).status).toBe(400);
        expect((await register({ ...good, email: { $gt: '' } })).status).toBe(400);
        expect((await register({ ...good, name: 'n'.repeat(81) })).status).toBe(400);
        expect(await User.countDocuments()).toBe(0);
    });

    test('an address can have one account, whatever its letter case', async () => {
        await register(good);

        const res = await register({ ...good, email: 'ASHA@example.com' });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe('An account with this email already exists');
    });

    test('the demo domain is refused', async () => {
        const res = await register({ ...good, email: 'someone@Fantasy.demo' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('This address cannot be used to sign up');
    });

    test('flags a sign-up cannot set are ignored', async () => {
        await register({ ...good, isVerified: true, isDemo: true, tokenVersion: 9 });

        expect(await User.findOne()).toMatchObject({ isVerified: false, isDemo: false, tokenVersion: 0 });
    });
});

describe('logging in', () => {
    test('gives httpOnly cookies and the user without secrets', async () => {
        const user = await createUser();

        const res = await request(app).post(`${users}/login`).send({ email: user.email.toUpperCase(), password: PASSWORD });

        expect(res.status).toBe(200);
        for (const cookie of res.headers['set-cookie']) {
            expect(cookie).toMatch(/HttpOnly/);
            expect(cookie).toMatch(/SameSite=Lax/);
        }
        expect(res.body.data.user).toMatchObject({ email: user.email, isVerified: true });
        for (const secret of ['password', 'tokenVersion', 'verifyToken', 'forgotPasswordToken']) {
            expect(res.body.data.user).not.toHaveProperty(secret);
        }
    });

    test('an unknown address and a wrong password get the same answer', async () => {
        const user = await createUser();

        const wrong = await request(app).post(`${users}/login`).send({ email: user.email, password: 'wrong-password' });
        const unknown = await request(app).post(`${users}/login`).send({ email: 'nobody@test.dev', password: PASSWORD });

        expect([wrong.status, wrong.body.message]).toEqual([401, 'Invalid email or password']);
        expect([unknown.status, unknown.body.message]).toEqual([401, 'Invalid email or password']);
    });

    test('needs both fields as text', async () => {
        const user = await createUser();

        expect((await request(app).post(`${users}/login`).send({ email: user.email })).body.message).toBe('Email and password are required');
        expect((await request(app).post(`${users}/login`).send({ email: { $ne: '' }, password: { $ne: '' } })).status).toBe(400);
        expect((await request(app).post(`${users}/login`).send({ email: user.email, password: { $ne: '' } })).status).toBe(400);
    });

    test('an unverified account can log in and is told it is unverified', async () => {
        const user = await createUser({ isVerified: false });

        const res = await request(app).post(`${users}/login`).send({ email: user.email, password: PASSWORD });

        expect(res.status).toBe(200);
        expect(res.body.data.user.isVerified).toBe(false);
    });
});

describe('the session', () => {
    test('me answers the logged-in user, and 401 without a login', async () => {
        const { user, agent } = await loggedIn();

        expect((await agent.get(`${users}/me`)).body.data.user.email).toBe(user.email);
        const res = await request(app).get(`${users}/me`);
        expect([res.status, res.body.message]).toEqual([401, 'Log in to continue']);
    });

    test('a token that was tampered with is refused', async () => {
        const res = await request(app).get(`${users}/me`).set('Cookie', 'accessToken=not.a.token');

        expect([res.status, res.body.message]).toEqual([401, 'Your session has ended. Log in again.']);
    });

    test('logout ends every session of the account', async () => {
        const user = await createUser();
        const laptop = await loginAgent(user);
        const phone = await loginAgent(user);

        const res = await laptop.post(`${users}/logout`);

        expect(res.status).toBe(200);
        expect((await laptop.get(`${users}/me`)).status).toBe(401);
        expect((await phone.get(`${users}/me`)).status).toBe(401);
    });

    test('logout needs a login', async () => {
        expect((await request(app).post(`${users}/logout`)).status).toBe(401);
    });
});

describe('verifying the address', () => {
    test('the link verifies the account once', async () => {
        await register(good);
        const { verifyToken } = await User.findOne();

        const first = await request(app).get(`${verify}/verify-email`).query({ token: verifyToken });
        const second = await request(app).get(`${verify}/verify-email`).query({ token: verifyToken });

        expect([first.status, first.body.message]).toEqual([200, 'Email verified']);
        expect((await User.findOne()).isVerified).toBe(true);
        expect([second.status, second.body.message]).toEqual([400, 'This link is invalid or has expired']);
    });

    test('an expired, missing or made-up token is refused', async () => {
        await register(good);
        await User.updateOne({}, { verifyTokenExpiry: new Date(Date.now() - 1000) });
        const { verifyToken } = await User.findOne();

        for (const query of [{ token: verifyToken }, {}, { token: '' }, { 'token[$ne]': 'x' }, { token: 'f'.repeat(64) }]) {
            const res = await request(app).get(`${verify}/verify-email`).query(query);
            expect(res.status).toBe(400);
        }
        expect((await User.findOne()).isVerified).toBe(false);
    });

    test('a logged-in user asks for a new link', async () => {
        const { user, agent } = await loggedIn({ isVerified: false });

        const res = await agent.post(`${users}/resend-verification`);

        expect([res.status, res.body.message]).toEqual([200, 'Verification link sent. It is valid for 10 minutes.']);
        expect((await User.findById(user._id)).verifyToken).toMatch(/^[0-9a-f]{64}$/);
    });

    test('a verified user needs no link, and a visitor cannot ask for one', async () => {
        const { agent } = await loggedIn();

        const res = await agent.post(`${users}/resend-verification`);

        expect([res.status, res.body.message]).toEqual([400, 'Your email is already verified']);
        expect((await request(app).post(`${users}/resend-verification`)).status).toBe(401);
    });
});

describe('a forgotten password', () => {
    const SAME = 'If an account exists for this address, a reset link has been sent';

    test('the answer is the same whether or not the address has an account', async () => {
        const user = await createUser();

        const known = await request(app).post(`${users}/forgot-password`).send({ email: user.email });
        const unknown = await request(app).post(`${users}/forgot-password`).send({ email: 'nobody@test.dev' });

        expect([known.status, known.body.message]).toEqual([200, SAME]);
        expect([unknown.status, unknown.body.message]).toEqual([200, SAME]);
        expect((await User.findById(user._id)).forgotPasswordToken).toMatch(/^[0-9a-f]{64}$/);
    });

    test('the link sets a new password and ends the old sessions', async () => {
        const { user, agent } = await loggedIn();
        await request(app).post(`${users}/forgot-password`).send({ email: user.email });
        const { forgotPasswordToken: token } = await User.findById(user._id);

        expect((await request(app).get(`${verify}/reset-password`).query({ token })).status).toBe(200);
        const res = await request(app).post(`${verify}/reset-password`).send({ token, password: 'a-new-password' });

        expect([res.status, res.body.message]).toEqual([200, 'Password updated. Log in with the new password.']);
        expect((await agent.get(`${users}/me`)).status).toBe(401);
        expect((await request(app).post(`${users}/login`).send({ email: user.email, password: PASSWORD })).status).toBe(401);
        expect((await request(app).post(`${users}/login`).send({ email: user.email, password: 'a-new-password' })).status).toBe(200);
        // the link works once
        expect((await request(app).post(`${verify}/reset-password`).send({ token, password: 'another-password' })).status).toBe(400);
    });

    test('a short password or a bad token changes nothing', async () => {
        const user = await createUser();
        await request(app).post(`${users}/forgot-password`).send({ email: user.email });
        const { forgotPasswordToken: token } = await User.findById(user._id);

        expect((await request(app).post(`${verify}/reset-password`).send({ token, password: 'short' })).body.message).toBe('Password must be at least 8 characters');
        for (const bad of ['f'.repeat(64), '', { $ne: 'x' }, undefined]) {
            const res = await request(app).post(`${verify}/reset-password`).send({ token: bad, password: 'a-new-password' });
            expect([res.status, res.body.message]).toEqual([400, 'This link is invalid or has expired']);
        }
        expect((await request(app).get(`${verify}/reset-password`).query({ token: 'nope' })).status).toBe(400);
        expect((await request(app).post(`${users}/login`).send({ email: user.email, password: PASSWORD })).status).toBe(200);
    });

    test('resetting the password also proves the address', async () => {
        const user = await createUser({ isVerified: false });
        await request(app).post(`${users}/forgot-password`).send({ email: user.email });
        const { forgotPasswordToken: token } = await User.findById(user._id);

        await request(app).post(`${verify}/reset-password`).send({ token, password: 'a-new-password' });

        expect((await User.findById(user._id)).isVerified).toBe(true);
    });
});

describe('changing the password', () => {
    test('needs the current password; this browser stays logged in, the others do not', async () => {
        const user = await createUser();
        const here = await loginAgent(user);
        const elsewhere = await loginAgent(user);

        const wrong = await here.post(`${users}/change-password`).send({ currentPassword: 'not-it', newPassword: 'a-new-password' });
        const short = await here.post(`${users}/change-password`).send({ currentPassword: PASSWORD, newPassword: 'short' });
        const done = await here.post(`${users}/change-password`).send({ currentPassword: PASSWORD, newPassword: 'a-new-password' });

        expect([wrong.status, wrong.body.message]).toEqual([400, 'The current password is not correct']);
        expect(short.body.message).toBe('Password must be at least 8 characters');
        expect([done.status, done.body.message]).toEqual([200, 'Password changed']);
        expect((await here.get(`${users}/me`)).status).toBe(200);
        expect((await elsewhere.get(`${users}/me`)).status).toBe(401);
        expect((await request(app).post(`${users}/login`).send({ email: user.email, password: 'a-new-password' })).status).toBe(200);
    });
});

describe('the demo account', () => {
    test('is entered with one request and no password', async () => {
        await demoUser();
        const agent = request.agent(app);

        const res = await agent.post(`${users}/demo-login`);

        expect(res.status).toBe(200);
        expect(res.body.data.user).toMatchObject({ email: DEMO_EMAIL, isDemo: true });
        expect((await agent.get(`${users}/me`)).status).toBe(200);
    });

    test('says so when it has not been set up', async () => {
        const res = await request(app).post(`${users}/demo-login`);

        expect([res.status, res.body.message]).toEqual([503, 'The demo account is not available right now']);
    });

    test('one visitor leaving does not sign the others out', async () => {
        await demoUser();
        const first = request.agent(app);
        const second = request.agent(app);
        await first.post(`${users}/demo-login`);
        await second.post(`${users}/demo-login`);

        await first.post(`${users}/logout`);

        expect((await first.get(`${users}/me`)).status).toBe(401);
        expect((await second.get(`${users}/me`)).status).toBe(200);
    });

    test('keeps its password: no change, no reset link, no new verification', async () => {
        const demo = await demoUser();
        const agent = request.agent(app);
        await agent.post(`${users}/demo-login`);

        const change = await agent.post(`${users}/change-password`).send({ currentPassword: DEMO_PASSWORD, newPassword: 'a-new-password' });
        await request(app).post(`${users}/forgot-password`).send({ email: DEMO_EMAIL });
        const resend = await agent.post(`${users}/resend-verification`);

        expect([change.status, change.body.message]).toEqual([403, 'The demo account cannot do this']);
        expect(resend.status).toBe(403);
        expect((await User.findById(demo._id)).forgotPasswordToken).toBeUndefined();
        expect((await request(app).post(`${users}/login`).send({ email: DEMO_EMAIL, password: DEMO_PASSWORD })).status).toBe(200);
    });
});
