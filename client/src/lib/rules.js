// The rules of a team, for showing what is wrong while a team is being changed.
// The server checks every team again when it is saved.

export const TEAM_SIZE = 11;
export const SIDE_MAX = 7;

export const ROLE_RULES = [
  { key: 'wk', plural: 'wicket-keepers', short: 'WK', min: 1, max: 4 },
  { key: 'bat', plural: 'batters', short: 'BAT', min: 3, max: 6 },
  { key: 'ar', plural: 'all-rounders', short: 'AR', min: 1, max: 4 },
  { key: 'bowl', plural: 'bowlers', short: 'BOWL', min: 3, max: 6 },
];

// the players of the squads with these ids
export const chosenOf = (squads, playerIds) => {
  const picked = new Set(playerIds);
  return squads.flatMap((squad) => squad.players).filter((player) => picked.has(player.id));
};

// what is wrong with the team, or '' when it keeps to every rule
export const problemOf = (squads, { playerIds, captainId, viceCaptainId }) => {
  const players = chosenOf(squads, playerIds);

  if (players.length !== TEAM_SIZE) {
    return `A team has 11 players: ${players.length < TEAM_SIZE ? `pick ${TEAM_SIZE - players.length} more` : `take ${players.length - TEAM_SIZE} out`}`;
  }

  for (const role of ROLE_RULES) {
    const count = players.filter((player) => player.role === role.key).length;
    if (count < role.min || count > role.max) return `A team needs ${role.min} to ${role.max} ${role.plural}`;
  }

  for (const squad of squads) {
    if (players.filter((player) => player.team === squad.team).length > SIDE_MAX) return 'A team can have at most 7 players of one side';
  }

  if (!playerIds.includes(captainId)) return 'Choose a captain';
  if (!playerIds.includes(viceCaptainId)) return 'Choose a vice-captain';
  if (captainId === viceCaptainId) return 'The captain and the vice-captain must be two different players';

  return '';
};

// scores have one decimal; the sum is made in tenths, so it is exact
export const totalOf = (players) => players.reduce((sum, player) => sum + Math.round((Number(player.score) || 0) * 10), 0) / 10;
