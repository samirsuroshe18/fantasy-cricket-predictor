// The only code that calls the cricket source (cricketdata.org). Every request is
// counted against the day's budget before it is made.
import { take } from '../utils/dailyLimit.js';

const BASE_URL = 'https://api.cricapi.com/v1';
const BUDGET_KEY = 'cricket';
// a visitor waits for this answer
const TIMEOUT_MS = 8000;
// after a failure the source is left alone for a while: it counts failed requests
// too, and blocks a key that keeps asking
const REST_MS = 5 * 60 * 1000;

let restingUntil = 0;

// why the source was not asked, or did not answer: "no-key", "budget", "resting" or "failed"
class SourceError extends Error {
    constructor(reason) {
        super(`The cricket source is not available (${reason})`);
        this.reason = reason;
    }
}

const hasKey = () => Boolean(process.env.CRICKET_API_KEY);

// the free plan allows 100 requests a day; the server stops a little before it
const budget = () => Number(process.env.CRICKET_DAILY_BUDGET) || 90;

// leaves the source alone for the given time
const restSource = (ms = REST_MS) => {
    restingUntil = Date.now() + ms;
};

// Asks the source and returns the data of its answer. reserve keeps a part of the
// day's budget back from this request, for requests that matter more.
const ask = async (path, params = {}, { reserve = 0 } = {}) => {
    if (!hasKey()) throw new SourceError('no-key');
    if (Date.now() < restingUntil) throw new SourceError('resting');

    const allowed = budget() - reserve;
    if (allowed <= 0 || await take(BUDGET_KEY, allowed) === null) {
        throw new SourceError('budget');
    }

    try {
        const url = new URL(`${BASE_URL}/${path}`);
        url.search = new URLSearchParams({ apikey: process.env.CRICKET_API_KEY, offset: '0', ...params }).toString();

        const response = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
        if (!response.ok) throw new Error(`answered ${response.status}`);

        const body = await response.json();
        if (body?.status !== 'success') throw new Error('refused the request');

        return body.data;
    } catch (error) {
        restSource();
        // the message of a failed request can carry its address, and the address the key
        console.log(`Cricket source, ${path}: ${error.name === 'Error' ? error.message : error.name}`);
        throw new SourceError('failed');
    }
};

export { ask, hasKey, restSource, SourceError }
