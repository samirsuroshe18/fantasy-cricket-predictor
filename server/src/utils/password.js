import ApiError from './ApiError.js';

const MIN_LENGTH = 8;
// bcrypt looks at the first 72 bytes only; a longer one would be cut without notice
const MAX_LENGTH = 72;

// a new password as typed; it is never trimmed
const readPassword = (value) => {
    if (typeof value !== 'string' || value.length < MIN_LENGTH) {
        throw new ApiError(400, `Password must be at least ${MIN_LENGTH} characters`);
    }

    if (Buffer.byteLength(value) > MAX_LENGTH) {
        throw new ApiError(400, `Password must be at most ${MAX_LENGTH} characters`);
    }

    return value;
};

export { readPassword }
