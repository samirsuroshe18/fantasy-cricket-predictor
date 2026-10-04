import { Usage } from '../models/usage.model.js';

const KEPT_MS = 3 * 24 * 60 * 60 * 1000;
const DUPLICATE_KEY = 11000;

const today = () => new Date().toISOString().slice(0, 10);

// Takes one (or amount) from today's allowance of a key. Returns how many are left, or
// null when the allowance does not cover it. The check and the count are one step in
// the database, so requests that arrive together cannot pass the limit.
const take = async (key, limit, amount = 1) => {
    const day = today();

    try {
        const usage = await Usage.findOneAndUpdate(
            { key, day, count: { $lte: limit - amount } },
            { $inc: { count: amount }, $setOnInsert: { expiresAt: new Date(Date.now() + KEPT_MS) } },
            { upsert: true, new: true }
        );

        return limit - usage.count;
    } catch (error) {
        // The count is at the limit, so the filter matched nothing and the insert met the
        // existing record. Two first requests of a day can meet the same way; one retry
        // then finds the record.
        if (error.code !== DUPLICATE_KEY) throw error;

        const usage = await Usage.findOneAndUpdate(
            { key, day, count: { $lte: limit - amount } },
            { $inc: { count: amount } },
            { new: true }
        );

        return usage ? limit - usage.count : null;
    }
};

// returns one that was taken for something that did not happen after all
const giveBack = (key) =>
    Usage.updateOne({ key, day: today(), count: { $gt: 0 } }, { $inc: { count: -1 } });

// raises today's count of a key to the given number, when it is lower
const raiseTo = (key, count) =>
    Usage.updateOne({ key, day: today(), count: { $lt: count } }, { $set: { count } });

export { take, giveBack, raiseTo }
