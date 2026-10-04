import { rateLimit } from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';
import { connectionOf, visitorOf } from '../utils/visitor.js';

const WINDOW_MS = 15 * 60 * 1000;
const TOO_MANY = "Too many attempts. Please try again in a few minutes.";

// The automated tests switch the limits on by setting ACCOUNT_RATE_LIMIT; otherwise
// they would get in the way of every test.
const skippedInTests = () => process.env.NODE_ENV === 'test' && !process.env.ACCOUNT_RATE_LIMIT;

const setting = (name, fallback) => () => Number(process.env[name]) || fallback;

const limiter = (limit, keyGenerator, { skip = skippedInTests, failuresOnly = false } = {}) => rateLimit({
    windowMs: WINDOW_MS,
    limit,
    keyGenerator,
    skip,
    // for logins: only attempts that were refused count
    skipSuccessfulRequests: failuresOnly,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    handler: (req, res, next) => next(new ApiError(429, TOO_MANY)),
});

const emailOf = (req) => (typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '');
const withoutEmail = (req) => skippedInTests() || !emailOf(req);

// The visitor's address is forwarded by the proxies in front of the server and can be
// made up by someone who calls the server directly. The address the request really
// arrived from cannot, so it has a limit of its own, and it comes first: made-up
// visitors are refused before anything is remembered about them. Requests through the
// web app all arrive from the web app's host, so this limit is a wide one.
const byConnection = limiter(setting('ACCOUNT_CONNECTION_RATE_LIMIT', 600), (req) => `connection:${connectionOf(req)}`);
const byVisitor = limiter(setting('ACCOUNT_RATE_LIMIT', 30), visitorOf);

// Wrong passwords for one account. A visitor gets a few tries; so that guessing from
// one place cannot lock the owner out elsewhere, the count for the account as a whole
// is much wider. A login that succeeds is not counted at all.
const guessesByVisitor = limiter(setting('ACCOUNT_GUESS_RATE_LIMIT', 10), (req) => `guess:${emailOf(req)}:${visitorOf(req)}`, { skip: withoutEmail, failuresOnly: true });
const guessesByAccount = limiter(setting('ACCOUNT_EMAIL_RATE_LIMIT', 50), (req) => `account:${emailOf(req)}`, { skip: withoutEmail, failuresOnly: true });

// mail to one address: sign-up and password reset
const mailByAddress = limiter(setting('ACCOUNT_MAIL_RATE_LIMIT', 5), (req) => `mail:${emailOf(req)}`, { skip: withoutEmail });

const loginLimiter = [byConnection, byVisitor, guessesByVisitor, guessesByAccount];

// sign-up and password reset send a mail to the address they are given
const mailLimiter = [byConnection, byVisitor, mailByAddress];

// the demo login and the links from emails have no address to count by
const visitorLimiter = [byConnection, byVisitor];

// a new verification link: counted for the account, wherever the requests come from.
// Use after verifyJwt.
const resendLimiter = [byConnection, limiter(setting('RESEND_RATE_LIMIT', 5), (req) => `resend:${req.user?._id}`)];

// Everything a logged-in user changes; reading is not limited. The demo account is
// shared by every visitor, so its limit is kept per visitor: one visitor cannot use up
// the allowance of the others. Use after verifyJwt.
const writeLimiter = limiter(
    setting('WRITE_RATE_LIMIT', 120),
    (req) => `write:${req.user?._id}:${req.user?.isDemo ? visitorOf(req) : ''}`,
    { skip: (req) => skippedInTests() || req.method === 'GET' }
);

// Matches and squads are open to everyone. Through the web app every request arrives
// from the web app's host, so the limit by connection is a very wide one.
const publicLimiter = [
    limiter(setting('PUBLIC_CONNECTION_RATE_LIMIT', 6000), (req) => `public-connection:${connectionOf(req)}`),
    limiter(setting('PUBLIC_RATE_LIMIT', 120), (req) => `public:${visitorOf(req)}`),
];

export { loginLimiter, mailLimiter, visitorLimiter, resendLimiter, writeLimiter, publicLimiter }
