import request from 'supertest';
import app from '../src/app.js';
import { createUser } from './helpers.js';

const login = (email, address, connection = '198.51.100.9') => request(app).post('/api/v1/users/login')
    // the host's proxy adds the address the request really came from at the end
    .set('X-Forwarded-For', `${address}, ${connection}`)
    .send({ email, password: 'wrong-password' });

afterEach(() => {
    delete process.env.ACCOUNT_RATE_LIMIT;
    delete process.env.ACCOUNT_EMAIL_RATE_LIMIT;
    delete process.env.ACCOUNT_CONNECTION_RATE_LIMIT;
});

test('a visitor gets a limited number of login attempts', async () => {
    process.env.ACCOUNT_RATE_LIMIT = '3';

    const statuses = [];
    for (let attempt = 0; attempt < 5; attempt += 1) {
        statuses.push((await login(`someone${attempt}@test.dev`, '203.0.113.20')).status);
    }

    expect(statuses).toEqual([401, 401, 401, 429, 429]);
    expect((await login('other@test.dev', '203.0.113.21')).status).toBe(401);
});

test('one account cannot be tried from many made-up addresses', async () => {
    process.env.ACCOUNT_RATE_LIMIT = '100';
    process.env.ACCOUNT_EMAIL_RATE_LIMIT = '3';
    const user = await createUser();

    const statuses = [];
    for (let attempt = 0; attempt < 5; attempt += 1) {
        statuses.push((await login(user.email, `203.0.113.${30 + attempt}`)).status);
    }

    expect(statuses).toEqual([401, 401, 401, 429, 429]);
    const res = await login(user.email, '203.0.113.99');
    expect(res.body.message).toBe('Too many attempts. Please try again in a few minutes.');
});

test('many made-up visitors from one caller are capped by the address they really come from', async () => {
    process.env.ACCOUNT_RATE_LIMIT = '100';
    process.env.ACCOUNT_CONNECTION_RATE_LIMIT = '4';

    const statuses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
        statuses.push((await login(`person${attempt}@test.dev`, `203.0.113.${40 + attempt}`, '198.51.100.77')).status);
    }

    expect(statuses).toEqual([401, 401, 401, 401, 429, 429]);
});
