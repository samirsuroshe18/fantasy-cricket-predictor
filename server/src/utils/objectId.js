const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

// ids arrive from URLs; anything but a 24-character hex string never reaches a query
const isValidObjectId = (value) => typeof value === 'string' && OBJECT_ID_PATTERN.test(value);

export { isValidObjectId }
