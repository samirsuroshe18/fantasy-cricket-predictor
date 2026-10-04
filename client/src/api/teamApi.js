import api, { unwrap } from './client.js';

// { match, players, captainId, viceCaptainId, total, bench, explanation, remaining, note }
export const predict = async (matchId) => unwrap(await api.post(`/matches/${encodeURIComponent(matchId)}/prediction`)).data;

// { teams, limit }
export const listTeams = async () => unwrap(await api.get('/teams')).data;

export const getTeam = async (id) => unwrap(await api.get(`/teams/${encodeURIComponent(id)}`)).data.team;

// team: { matchId, name, playerIds, captainId, viceCaptainId }
export const saveTeam = async (team) => unwrap(await api.post('/teams', team)).data.team;

// changes: { name } and/or { playerIds, captainId, viceCaptainId }
export const updateTeam = async (id, changes) => unwrap(await api.put(`/teams/${encodeURIComponent(id)}`, changes)).data.team;

export const deleteTeam = async (id) => unwrap(await api.delete(`/teams/${encodeURIComponent(id)}`));
