import asyncHandler from '../utils/asynchandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import bcrypt from 'bcrypt';
import { SESSION_DAYS, User } from '../models/user.model.js';
import mailSender from '../utils/mailSender.js';
import { endSessions } from '../utils/sessions.js';
import { DEMO_EMAIL, isDemoEmail } from '../utils/demo.js';
import { readPassword } from '../utils/password.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX = 80;
const EMAIL_MAX = 254;
const DUPLICATE_KEY = 11000;
const DAY_MS = 24 * 60 * 60 * 1000;
const LINK_LIFETIME_MS = 10 * 60 * 1000;
const RESEND_WAIT_MS = 60 * 1000;

// The hash of no password anyone has. A login for an address without an account is
// checked against it, so it takes as long to refuse as a wrong password does.
const NO_ACCOUNT_HASH = bcrypt.hashSync('no account has this password', 10);

// the cookie must only require https in production, otherwise it is dropped on http://localhost
const cookieOptions = () => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
});

// Text from a body, trimmed. Anything but text is refused, so nothing but plain
// values ever reaches a query.
const readText = (value, label) => {
    if (value === undefined || value === null) return '';

    if (typeof value !== 'string') {
        throw new ApiError(400, `${label} must be text`);
    }

    return value.trim();
};

const readEmail = (value) => readText(value, 'Email').toLowerCase();

// logs the user in on this browser: a token in an httpOnly cookie that lasts as long as the token
const startSession = async (res, userId) => {
    const user = await User.findById(userId);

    res.cookie('accessToken', user.generateAccessToken(), { ...cookieOptions(), maxAge: SESSION_DAYS * DAY_MS });

    return user;
};

const registerUser = asyncHandler(async (req, res) => {
    const name = readText(req.body.name, 'Name');
    const email = readEmail(req.body.email);

    if (!name || !email || !req.body.password) {
        throw new ApiError(400, "Name, email and password are required");
    }

    if (name.length > NAME_MAX) {
        throw new ApiError(400, `Name must be at most ${NAME_MAX} characters`);
    }

    if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) {
        throw new ApiError(400, "Enter a valid email address");
    }

    const password = readPassword(req.body.password);

    // addresses of the demo are made by the server only
    if (isDemoEmail(email)) {
        throw new ApiError(400, "This address cannot be used to sign up");
    }

    if (await User.exists({ email })) {
        throw new ApiError(409, 'An account with this email already exists');
    }

    let user;
    try {
        // nothing but these three fields is ever taken from a sign-up
        user = await User.create({ name, email, password });
    } catch (error) {
        // two sign-ups can pass the check above at the same moment; the unique index decides
        if (error.code === DUPLICATE_KEY) {
            throw new ApiError(409, 'An account with this email already exists');
        }
        throw error;
    }

    const sent = await mailSender(email, user._id, "VERIFY");

    const message = sent
        ? "Account created. Check your email for the verification link."
        : "Account created, but the verification email could not be sent. Log in and send it again.";

    return res.status(201).json(new ApiResponse(201, {}, message));
});

const loginUser = asyncHandler(async (req, res) => {
    const email = readEmail(req.body.email);
    const password = readText(req.body.password, 'Password');

    if (!email || !req.body.password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });

    // the same answer, after the same work, for an unknown email and a wrong password,
    // so accounts cannot be probed
    const correct = user
        ? await user.isPasswordCorrect(req.body.password)
        : await bcrypt.compare(req.body.password, NO_ACCOUNT_HASH).then(() => false);

    if (!correct) {
        throw new ApiError(401, "Invalid email or password");
    }

    // an account whose address is not verified yet may log in; it is told to verify
    // and cannot predict or save a team until it has
    const loggedIn = await startSession(res, user._id);

    return res.status(200).json(new ApiResponse(200, { user: loggedIn }, "Logged in"));
});

// the demo account is open to everyone, so it needs no password
const demoLogin = asyncHandler(async (req, res) => {
    const demo = await User.findOne({ email: DEMO_EMAIL, isDemo: true });

    if (!demo) {
        throw new ApiError(503, "The demo account is not available right now");
    }

    const loggedIn = await startSession(res, demo._id);

    return res.status(200).json(new ApiResponse(200, { user: loggedIn }, "Logged in to the demo"));
});

const logoutUser = asyncHandler(async (req, res) => {
    // the demo account is used by many visitors at once; one of them leaving must not
    // sign out the others, so only this browser's cookies are cleared
    if (!req.user.isDemo) {
        await endSessions(req.user._id);
    }

    return res.status(200)
        .clearCookie("accessToken", cookieOptions())
        .json(new ApiResponse(200, {}, "Logged out"));
});

const getMe = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, { user: req.user }, "Current user")
    );
});

const resendVerification = asyncHandler(async (req, res) => {
    if (req.user.isVerified) {
        throw new ApiError(400, "Your email is already verified");
    }

    // a link that was sent less than a minute ago is still on its way
    const user = await User.findById(req.user._id);
    const sentAt = user.verifyTokenExpiry ? user.verifyTokenExpiry.getTime() - LINK_LIFETIME_MS : 0;

    if (Date.now() - sentAt < RESEND_WAIT_MS) {
        throw new ApiError(429, "A link was sent a moment ago. Check your inbox, or try again in a minute.");
    }

    const sent = await mailSender(req.user.email, req.user._id, "VERIFY");

    if (!sent) {
        throw new ApiError(502, "The verification email could not be sent. Please try again later.");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Verification link sent. It is valid for 10 minutes.")
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
    const email = readEmail(req.body.email);

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });

    // the demo account has no mailbox, and its password must stay the published one
    if (user && !user.isDemo) {
        await mailSender(email, user._id, "RESET");
    }

    // the same answer either way, so the form cannot be used to find registered addresses
    return res.status(200).json(
        new ApiResponse(200, {}, "If an account exists for this address, a reset link has been sent")
    );
});

const changePassword = asyncHandler(async (req, res) => {
    const current = readText(req.body.currentPassword, 'Current password');
    const user = await User.findById(req.user._id);

    if (!current || !(await user.isPasswordCorrect(req.body.currentPassword))) {
        throw new ApiError(400, "The current password is not correct");
    }

    user.password = readPassword(req.body.newPassword);
    await user.save();

    // every other browser is signed out; this one gets a fresh session
    await endSessions(user._id);
    await startSession(res, user._id);

    return res.status(200).json(new ApiResponse(200, {}, "Password changed"));
});

export {
    registerUser,
    loginUser,
    demoLogin,
    logoutUser,
    getMe,
    resendVerification,
    forgotPassword,
    changePassword,
}
