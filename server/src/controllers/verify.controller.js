import { User } from '../models/user.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asynchandler.js';
import { endSessions } from '../utils/sessions.js';
import { readPassword } from '../utils/password.js';

const BAD_LINK = "This link is invalid or has expired";

// a token only matches when it is a non-empty string that has not expired
const findByToken = async (tokenField, expiryField, token) => {
    const user = typeof token === 'string' && token
        ? await User.findOne({ [tokenField]: token, [expiryField]: { $gt: new Date() } })
        : null;

    if (!user) {
        throw new ApiError(400, BAD_LINK);
    }

    return user;
};

const verifyEmail = asyncHandler(async (req, res) => {
    const user = await findByToken('verifyToken', 'verifyTokenExpiry', req.query.token);

    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiry = undefined;
    await user.save();

    return res.status(200).json(new ApiResponse(200, {}, "Email verified"));
});

// lets the page say that a link is no longer good before a password is typed
const checkResetToken = asyncHandler(async (req, res) => {
    await findByToken('forgotPasswordToken', 'forgotPasswordTokenExpiry', req.query.token);

    return res.status(200).json(new ApiResponse(200, {}, "Link is valid"));
});

const setNewPassword = asyncHandler(async (req, res) => {
    const password = readPassword(req.body.password);
    const user = await findByToken('forgotPasswordToken', 'forgotPasswordTokenExpiry', req.body.token);

    user.forgotPasswordToken = undefined;
    user.forgotPasswordTokenExpiry = undefined;
    user.password = password;
    // the link arrived at the address, which proves the address as well
    user.isVerified = true;
    await user.save();

    // anyone still logged in with the old password is signed out
    await endSessions(user._id);

    return res.status(200).json(new ApiResponse(200, {}, "Password updated. Log in with the new password."));
});

export { verifyEmail, checkResetToken, setNewPassword }
