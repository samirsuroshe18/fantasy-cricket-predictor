import { GoogleGenAI } from '@google/genai';

const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
// a user waits for this answer; without a limit a stalled request would hold them
const TIMEOUT_MS = 30000;

let client;

// whether this server has a key to ask with
const assistantReady = () => Boolean(process.env.GEMINI_API_KEY);

// created on first use, so the key is only needed when an explanation is actually asked for
const getClient = () => {
    client = client || new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    return client;
};

// Asks the language model for an answer that follows the given JSON schema and
// returns it parsed. A call that fails throws. A call that came back with something
// that is not JSON (a blocked or empty answer) returns null: the model was asked.
const generateJson = async (prompt, schema) => {
    const response = await getClient().models.generateContent({
        model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseJsonSchema: schema,
            temperature: 0.3,
            httpOptions: { timeout: TIMEOUT_MS },
        },
    });

    try {
        return JSON.parse(response.text);
    } catch (error) {
        return null;
    }
};

export { generateJson, assistantReady }
