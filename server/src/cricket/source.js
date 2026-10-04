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
// a refusal that is about the key or its allowance, not about what was asked for
const ABOUT_THE_KEY = /block|limit|exceed|hits|apikey|api key|subscri/i;

let restingUntil = 0;
// the day on which the budget was found used up, and for which reserve: nothing with
// that reserve or a larger one is tried again that day
let spent = { day: '', reserve: Infinity };

// Why the source was not asked, or did not answer: "no-key", "budget", "resting",
// "failed" (the source as a whole) or "refused" (this one request).
class SourceError extends Error {
    constructor(reason) {
        super(`The cricket source is not available (${reason})`);
        this.reason = reason;
    }
}

const hasKey = () => Boolean(process.env.CRICKET_API_KEY);

// the free plan allows 100 requests a day; the server stops a little before it
const budget = () => Number(process.env.CRICKET_DAILY_BUDGET) || 90;

const today = () => new Date().toISOString().slice(0, 10);

// leaves the source alone for the given time
const restSource = (ms = REST_MS) => {
    restingUntil = Date.now() + ms;
};

// forgets that the source was resting or the budget used up
const resetSource = () => {
    restingUntil = 0;
    spent = { day: '', reserve: Infinity };
};

// Whether a request with this reserve could be made now, as far as this server
// remembers. Costs nothing: it lets a caller skip work that would be refused anyway.
const canAsk = ({ reserve = 0 } = {}) =>
    hasKey() && Date.now() >= restingUntil && !(spent.day === today() && reserve >= spent.reserve);

// Asks the source and returns the data of its answer. reserve keeps a part of the
// day's budget back from this request, for requests that matter more.
const ask = async (path, params = {}, { reserve = 0 } = {}) => {
    if (!hasKey()) throw new SourceError('no-key');
    if (Date.now() < restingUntil) throw new SourceError('resting');

    const allowed = budget() - reserve;
    if (allowed <= 0 || await take(BUDGET_KEY, allowed) === null) {
        spent = { day: today(), reserve: spent.day === today() ? Math.min(spent.reserve, reserve) : reserve };
        throw new SourceError('budget');
    }

    let refused = false;
    try {
        const url = new URL(`${BASE_URL}/${path}`);
        url.search = new URLSearchParams({ apikey: process.env.CRICKET_API_KEY, offset: '0', ...params }).toString();

        const response = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
        if (response.status === 404) {
            refused = true;
            throw new Error('has no such thing');
        }
        if (!response.ok) throw new Error(`answered ${response.status}`);

        const body = await response.json();
        if (body?.status !== 'success') {
            refused = body?.status === 'failure' && typeof body.reason === 'string' && !ABOUT_THE_KEY.test(body.reason);
            throw new Error('refused the request');
        }

        return body.data;
    } catch (error) {
        // a refusal of one thing says nothing about the rest; any other failure does
        if (!refused) restSource();
        // the message of a failed request can carry its address, and the address the key
        console.log(`Cricket source, ${path}: ${error.name === 'Error' ? error.message : error.name}`);
        throw new SourceError(refused ? 'refused' : 'failed');
    }
};

export { ask, canAsk, hasKey, restSource, resetSource, SourceError }
