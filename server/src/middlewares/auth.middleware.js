import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asynchandler.js";
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js";

const verifyJwt = asyncHandler(async (req, _, next) => {
    const token = req.cookies?.accessToken;

    if (!token) {
        throw new ApiError(401, "Log in to continue");
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Your session has ended. Log in again.");
    }

    const user = await User.findById(decodedToken?._id).select("-password");

    // logout and a password change raise the version, which ends every older session
    if (!user || decodedToken.tokenVersion !== user.tokenVersion) {
        throw new ApiError(401, "Your session has ended. Log in again.");
    }

    req.user = user;
    next();
})

// use after verifyJwt: writing needs an address that was verified
const requireVerified = (req, _, next) =>
    req.user.isVerified ? next() : next(new ApiError(403, "Verify your email to do this"));

// use after verifyJwt: the demo account is shared, so some things are closed to it
const notDemo = (req, _, next) =>
    req.user.isDemo ? next(new ApiError(403, "The demo account cannot do this")) : next();

export { verifyJwt, requireVerified, notDemo };
