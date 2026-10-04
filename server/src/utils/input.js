import ApiError from './ApiError.js';

const DEFAULT_MAX = 200;

// Text from a form or a JSON body, trimmed. A number is accepted as text; anything
// else (an object, a list, a boolean) is refused, so nothing but plain values reaches a query.
const readText = (value, label, { max = DEFAULT_MAX, required = false } = {}) => {
    const missing = value === undefined || value === null || value === '';

    if (!missing && typeof value !== 'string' && typeof value !== 'number') {
        throw new ApiError(400, `${label} must be text`);
    }

    const text = missing ? '' : String(value).trim();

    if (!text && required) {
        throw new ApiError(400, `${label} is required`);
    }

    if (text.length > max) {
        throw new ApiError(400, `${label} must be at most ${max} characters`);
    }

    return text;
};

// a choice from a fixed list; an empty value means "not given"
const readChoice = (value, label, choices, { required = false } = {}) => {
    const text = readText(value, label, { required });

    if (text && !choices.includes(text)) {
        throw new ApiError(400, `${label} must be one of: ${choices.join(', ')}`);
    }

    return text || undefined;
};

// a checkbox: JSON sends true, a multipart form sends "true"
const readBoolean = (value) => value === true || value === 'true';

export { readText, readChoice, readBoolean }
