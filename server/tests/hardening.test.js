import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Usage } from '../src/models/usage.model.js';
import { visitorOf } from '../src/utils/visitor.js';
import mailSender from '../src/utils/mailSender.js';
import { createUser, loggedIn, PASSWORD } from './helpers.js';

const users = '/api/v1/users';

const SETTINGS = ['ACCOUNT_RATE_LIMIT', 'ACCOUNT_EMAIL_RATE_LIMIT', 'RESEND_RATE_LIMIT', 'DAILY_MAIL_LIMIT'];
afterEach(() => {
    SETTINGS.forEach((name) => delete process.env[name]);
});

describe('the session', () => {
    test('one cookie, httpOnly, that lasts as long as the login does', async () => {
        const user = await createUser();

        const res = await request(app).post(`${users}/login`).send({ email: user.email, password: PASSWORD });

        const cookies = res.headers['set-cookie'];
        expect(cookies).toHaveLength(1);
        expect(cookies[0]).toMatch(/^accessToken=/);
        expect(cookies[0]).toMatch(/HttpOnly/);
        expect(cookies[0]).toMatch(/SameSite=Lax/);
        expect(cookies[0]).toMatch(/Max-Age=604800/);
        expect(cookies[0]).not.toMatch(/Secure/);
        expect(res.headers['x-powered-by']).toBeUndefined();
    });

    test('answers are not kept by a browser or a host', async () => {
        const res = await request(app).get('/api/v1/health');

        expect([res.status, res.headers['cache-control']]).toEqual([200, 'no-store']);
    });

    test('an unknown route and a broken body answer in the usual shape', async () => {
        const missing = await request(app).get('/api/v1/nothing-here');
        const broken = await request(app).post(`${users}/login`).set('Content-Type', 'application/json').send('{"email":');

        expect(missing.body).toEqual({ statusCode: 404, data: null, message: 'Route not found', success: false });
        expect(broken.body).toEqual({ statusCode: 400, data: null, message: 'The request could not be read', success: false });
    });
});

describe('who a visitor is', () => {
    const req = (forwarded) => ({ headers: { 'x-forwarded-for': forwarded }, ip: '198.51.100.9' });

    test('an IPv6 visitor is the network they are on, not one of its countless addresses', () => {
        const first = visitorOf(req('2001:db8:aaaa:bbbb:1:2:3:4'));

        expect(visitorOf(req('2001:db8:aaaa:bbbb:ffff:eeee:dddd:cccc'))).toBe(first);
        expect(visitorOf(req('2001:db8:aaaa:bbbb::1'))).toBe(first);
        expect(visitorOf(req('2001:db8:aaaa:cccc::1'))).not.toBe(first);
        expect(visitorOf(req('203.0.113.7'))).toBe('203.0.113.7');
        expect(visitorOf(req('made up'))).toBe('198.51.100.9');
    });
});

describe('logging in and the limits', () => {
    const login = (email, password, address) => request(app).post(`${users}/login`)
        .set('X-Forwarded-For', `${address}, 198.51.100.50`).send({ email, password });

    test('a visitor who logs in correctly is never slowed down by it', async () => {
        process.env.ACCOUNT_RATE_LIMIT = '100';
        process.env.ACCOUNT_EMAIL_RATE_LIMIT = '3';
        const user = await createUser();

        for (let attempt = 0; attempt < 6; attempt += 1) {
            expect((await login(user.email, PASSWORD, '203.0.113.60')).status).toBe(200);
        }
    });

    test('someone guessing an account\'s password from one place does not lock its owner out', async () => {
        process.env.ACCOUNT_RATE_LIMIT = '100';
        const user = await createUser();

        const guesses = [];
        for (let attempt = 0; attempt < 12; attempt += 1) {
            guesses.push((await login(user.email, 'a-wrong-guess', '203.0.113.61')).status);
        }

        // ten wrong tries from one visitor, then that visitor is refused for this account
        expect(guesses.slice(0, 10).every((status) => status === 401)).toBe(true);
        expect(guesses.slice(10)).toEqual([429, 429]);
        // the owner, somewhere else, still gets in
        expect((await login(user.email, PASSWORD, '203.0.113.62')).status).toBe(200);
    });
});

describe('verification mails', () => {
    test('a second link cannot be asked for within a minute', async () => {
        const { user, agent } = await loggedIn({ isVerified: false });

        expect((await agent.post(`${users}/resend-verification`)).status).toBe(200);
        const again = await agent.post(`${users}/resend-verification`);

        expect([again.status, again.body.message]).toEqual([429, 'A link was sent a moment ago. Check your inbox, or try again in a minute.']);

        // a minute later it works again
        await User.updateOne({ _id: user._id }, { verifyTokenExpiry: new Date(Date.now() + 9 * 60 * 1000 - 5000) });
        expect((await agent.post(`${users}/resend-verification`)).status).toBe(200);
    });

    test('an account can ask for only so many links, wherever the requests come from', async () => {
        process.env.ACCOUNT_RATE_LIMIT = '100';
        process.env.RESEND_RATE_LIMIT = '2';
        const { user, agent } = await loggedIn({ isVerified: false });
        const resend = async (address) => {
            await User.updateOne({ _id: user._id }, { $unset: { verifyTokenExpiry: 1 } });
            return (await agent.post(`${users}/resend-verification`).set('X-Forwarded-For', `${address}, 198.51.100.51`)).status;
        };

        expect([await resend('203.0.113.70'), await resend('203.0.113.71'), await resend('203.0.113.72')]).toEqual([200, 200, 429]);
    });
});

describe('the mail the site may send in a day', () => {
    test('once the day\'s allowance is used, no more mail is attempted', async () => {
        process.env.DAILY_MAIL_LIMIT = '2';
        const user = await createUser({ isVerified: false });

        expect(await mailSender(user.email, user._id, 'VERIFY')).toBeTruthy();
        expect(await mailSender(user.email, user._id, 'VERIFY')).toBeTruthy();
        expect(await mailSender(user.email, user._id, 'VERIFY')).toBeUndefined();
        expect((await Usage.findOne({ key: 'mail' })).count).toBe(2);
    });

    test('a sign-up that could not be mailed says so', async () => {
        process.env.DAILY_MAIL_LIMIT = '1';
        await request(app).post(`${users}/register`).send({ name: 'First', email: 'first@example.com', password: 'long-enough' });

        const res = await request(app).post(`${users}/register`).send({ name: 'Second', email: 'second@example.com', password: 'long-enough' });

        expect([res.status, res.body.message]).toEqual([201, 'Account created, but the verification email could not be sent. Log in and send it again.']);
    });
});
