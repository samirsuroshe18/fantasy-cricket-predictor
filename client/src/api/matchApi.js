import api, { unwrap } from './client.js';

// { matches, live: { available, asOf, note } }
export const getMatches = async () => unwrap(await api.get('/matches')).data;

// { match, squads, note }
export const getMatch = async (id) => unwrap(await api.get(`/matches/${encodeURIComponent(id)}`)).data;
