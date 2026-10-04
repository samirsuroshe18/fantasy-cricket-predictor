import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.ACCESS_TOKEN_SECRET = 'test-access';
process.env.FRONTEND_URL = 'http://localhost:5179';

let mongoServer;

// the database process can take a while to start on a busy machine
const STARTUP_TIMEOUT_MS = 120000;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: STARTUP_TIMEOUT_MS } });
    await mongoose.connect(mongoServer.getUri());
}, STARTUP_TIMEOUT_MS);

afterEach(async () => {
    const collections = Object.values(mongoose.connection.collections);
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});
