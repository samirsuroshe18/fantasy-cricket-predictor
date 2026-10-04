import { Cache } from '../models/cache.model.js';

// a value that was not fetched again in this long is removed
const KEPT_MS = 60 * 24 * 60 * 60 * 1000;

// what is being loaded right now, so visitors who ask for the same thing together
// cause one request
const loading = new Map();

const load = async (key, lifetime, loader) => {
    const value = await loader();
    const fetchedAt = new Date();
    const lifetimeMs = typeof lifetime === 'function' ? lifetime(value) : lifetime;

    try {
        await Cache.updateOne(
            { key },
            { $set: { value, fetchedAt, freshUntil: new Date(fetchedAt.getTime() + lifetimeMs), expiresAt: new Date(fetchedAt.getTime() + KEPT_MS) } },
            { upsert: true }
        );
    } catch (error) {
        // the value is good even when it could not be kept
        console.log(`Cache, ${key}: ${error.message}`);
    }

    return { value, fetchedAt, stale: false };
};

// The value kept under a key, loaded when there is none or it is too old. lifetime is
// in milliseconds, or a function of the value. When loading fails, the old value is
// used and marked stale; without one the failure is thrown.
// Answers { value, fetchedAt, stale }.
const cached = async (key, lifetime, loader) => {
    const kept = await Cache.findOne({ key }).lean();

    if (kept && kept.freshUntil > new Date()) {
        return { value: kept.value, fetchedAt: kept.fetchedAt, stale: false };
    }

    if (!loading.has(key)) {
        loading.set(key, load(key, lifetime, loader).finally(() => loading.delete(key)));
    }

    try {
        return await loading.get(key);
    } catch (error) {
        if (kept) return { value: kept.value, fetchedAt: kept.fetchedAt, stale: true };
        throw error;
    }
};

// what is kept under these keys, read together: a Map of key to { value, fresh }
const keptOf = async (keys) => {
    const now = new Date();
    const kept = await Cache.find({ key: { $in: keys } }).lean();
    return new Map(kept.map((entry) => [entry.key, { value: entry.value, fresh: entry.freshUntil > now }]));
};

export { cached, keptOf }
