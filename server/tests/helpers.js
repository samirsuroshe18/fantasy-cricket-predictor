import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';

let counter = 0;

export const PASSWORD = 'secret-12';

// a verified user, unless told otherwise
export const createUser = async (overrides = {}) => {
    counter += 1;
    return User.create({
        name: 'Test User',
        email: `user${counter}@test.dev`,
        password: PASSWORD,
        isVerified: true,
        ...overrides,
    });
};

// returns a supertest agent that keeps the login cookies
export const loginAgent = async (user, password = PASSWORD) => {
    const agent = request.agent(app);
    const res = await agent.post('/api/v1/users/login').send({ email: user.email, password });
    if (res.status !== 200) {
        throw new Error(`Login failed: ${res.status} ${res.body.message}`);
    }
    return agent;
};

// a new verified user, already logged in
export const loggedIn = async (overrides = {}) => {
    const user = await createUser(overrides);
    return { user, agent: await loginAgent(user) };
};
