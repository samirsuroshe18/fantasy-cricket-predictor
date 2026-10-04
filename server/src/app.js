import express from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";
import ApiError from './utils/ApiError.js';
import ApiResponse from './utils/ApiResponse.js';
import userRouter from './routes/user.routes.js';
import verifyRouter from './routes/verify.routes.js';

const app = express();

// the server does not say what it is made with
app.disable('x-powered-by');

// behind the host's proxy the connection's own address is the proxy; this makes
// req.ip the address the proxy saw
app.set('trust proxy', 1);

// the web app reaches the server through its own address, so other origins are only
// allowed when one is named
app.use(cors({ origin: process.env.CORS_ORIGIN || false, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Answers are about one person's account and teams, or change during the day (a match
// starts, a squad is announced), so no browser or host keeps a copy.
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

app.get("/api/v1/health", (req, res) => {
    return res.status(200).json(new ApiResponse(200, { status: 'ok' }, "OK"));
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/verify", verifyRouter);

app.use((req, res, next) => {
    next(new ApiError(404, "Route not found"));
});

// Custom error handling
app.use((err, req, res, next) => {
    // a body that could not be read, or one that is too large, is the sender's mistake
    const isBodyError = err.type === 'entity.parse.failed' || err.type === 'entity.too.large';
    const isValidationError = err.name === 'ValidationError';
    const statusCode = err.statusCode || err.status || (isBodyError || isValidationError ? 400 : 500);
    // an unexpected failure can carry database or stack details, so only messages
    // written for the client (ApiError) are sent back
    const message = err instanceof ApiError
        ? err.message
        : (isBodyError ? "The request could not be read" : (statusCode >= 500 ? "Internal server error" : "The request is not valid"));

    if (statusCode >= 500) {
        console.log(err);
    }

    return res.status(statusCode).json({
        statusCode: statusCode,
        data: null,
        message: message,
        success: false
    });
})

export default app
