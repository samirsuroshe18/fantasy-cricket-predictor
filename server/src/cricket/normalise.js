// Turns the answers of the cricket source into the app's own shapes. The source is
// another party's service: every value is checked, and whatever cannot be read is left
// out instead of being passed on.

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const FORMATS = ['t20', 'odi'];
// ids go into addresses of the source and of this server
const ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/;
// names the source uses for a team that is not known yet
const UNDECIDED = ['tbc', 'tba', 'tbd'];
const SQUAD_MAX = 30;
// the picture the source gives a player it has no picture of
const PLACEHOLDER_IMAGE = 'icon512';

const text = (value, max) => (typeof value === 'string' ? [...value.trim()].slice(0, max).join('') : '');

const isId = (value) => typeof value === 'string' && ID_PATTERN.test(value);

// only pictures served over https are shown
const link = (value) => {
    const address = text(value, 300);
    return /^https:\/\/[^\s"'<>]+$/.test(address) ? address : '';
};

// "Royal Challengers Bengaluru" is RCB, "Nepal" is NEP
const shortNameOf = (name) => {
    const words = name.split(/\s+/).filter(Boolean);
    const short = words.length > 1 ? words.map((word) => word[0]).join('') : name.slice(0, 3);
    return short.toUpperCase().slice(0, 6);
};

// the source gives times in UTC without saying so
const startOf = (value) => {
    const written = text(value, 40);
    if (!written) return NaN;
    return Date.parse(/(Z|[+-]\d{2}:?\d{2})$/.test(written) ? written : `${written}Z`);
};

// A match as the app lists it, or null when it is not one to list: not a T20 or an
// ODI, already started, more than a week away, or not readable.
const toMatch = (raw, now = Date.now()) => {
    if (!raw || typeof raw !== 'object' || !isId(raw.id)) return null;

    const format = text(raw.matchType, 10).toLowerCase();
    if (!FORMATS.includes(format)) return null;

    if (raw.matchStarted === true || raw.matchEnded === true) return null;

    const start = startOf(raw.dateTimeGMT);
    if (!Number.isFinite(start) || start <= now || start > now + WEEK_MS) return null;

    if (!Array.isArray(raw.teams) || raw.teams.length !== 2) return null;
    const names = raw.teams.map((name) => text(name, 60));
    if (names.some((name) => !name || UNDECIDED.includes(name.toLowerCase()))) return null;
    if (names[0].toLowerCase() === names[1].toLowerCase()) return null;

    const details = Array.isArray(raw.teamInfo) ? raw.teamInfo.filter((team) => team && typeof team === 'object') : [];
    const teams = names.map((name) => {
        const detail = details.find((team) => text(team.name, 60).toLowerCase() === name.toLowerCase()) || {};
        return { name, shortName: text(detail.shortname, 6).toUpperCase() || shortNameOf(name), logo: link(detail.img) };
    });

    return {
        id: raw.id,
        name: text(raw.name, 120) || `${names[0]} vs ${names[1]}`,
        format,
        startsAt: new Date(start).toISOString(),
        venue: text(raw.venue, 120),
        teams,
        isSample: false,
    };
};

// wicket-keeper, all-rounder, bowler or batter; a role the source does not give is a batter
const roleOf = (value) => {
    const role = text(value, 40).toLowerCase();

    if (role.includes('wk') || role.includes('keeper')) return 'wk';
    if (/all[\s-]?round/.test(role)) return 'ar';
    if (role.includes('bowl')) return 'bowl';
    return 'bat';
};

// The two squads of a match, in the order of its teams. A team the source left out
// has no players; a player is listed once.
const toSquads = (raw, match) => {
    const listed = Array.isArray(raw) ? raw.filter((squad) => squad && typeof squad === 'object') : [];
    const seen = new Set();

    return match.teams.map((team) => {
        const squad = listed.find((entry) => text(entry.teamName, 60).toLowerCase() === team.name.toLowerCase());
        const players = [];

        for (const player of Array.isArray(squad?.players) ? squad.players : []) {
            if (players.length >= SQUAD_MAX) break;
            if (!player || typeof player !== 'object' || !isId(player.id) || seen.has(player.id)) continue;

            const name = text(player.name, 60);
            if (!name) continue;

            seen.add(player.id);
            const image = link(player.playerImg);
            players.push({
                id: player.id,
                name,
                team: team.name,
                role: roleOf(player.role),
                battingStyle: text(player.battingStyle, 60),
                bowlingStyle: text(player.bowlingStyle, 60),
                country: text(player.country, 60),
                image: image.includes(PLACEHOLDER_IMAGE) ? '' : image,
            });
        }

        return { team: team.name, players };
    });
};

// which of the source's kinds of match count for a format, best first
const KINDS = { t20: ['t20', 't20i', 'ipl'], odi: ['odi'] };

// A number the source wrote as text. One that is missing, negative or not a number is
// 0; one beyond what cricket allows is cut to the most it can be.
const number = (value, max) => {
    const read = typeof value === 'number' ? value : (typeof value === 'string' && value.trim() ? Number(value.trim()) : NaN);
    return Number.isFinite(read) && read > 0 ? Math.min(read, max) : 0;
};

// The career figures of a player for a format, or null when the source has none.
const toFigures = (raw, format) => {
    const stats = Array.isArray(raw?.stats) ? raw.stats : [];
    // kind of match → "batting inn" → value
    const byKind = new Map();

    for (const entry of stats) {
        if (!entry || typeof entry !== 'object') continue;
        const kind = text(entry.matchtype, 10).toLowerCase();
        const part = text(entry.fn, 10).toLowerCase();
        const name = text(entry.stat, 10).toLowerCase();
        if (!kind || !part || !name) continue;

        if (!byKind.has(kind)) byKind.set(kind, new Map());
        byKind.get(kind).set(`${part} ${name}`, entry.value);
    }

    for (const kind of KINDS[format] || []) {
        const values = byKind.get(kind);
        if (!values) continue;

        const read = (key, max) => number(values.get(key), max);
        const battingInnings = Math.floor(read('batting inn', 5000));
        const bowlingInnings = Math.floor(read('bowling inn', 5000));

        const batting = battingInnings > 0
            ? { innings: battingInnings, runs: Math.floor(read('batting runs', 100000)), average: read('batting avg', 500), strikeRate: read('batting sr', 600) }
            : null;
        const bowling = bowlingInnings > 0
            ? { innings: bowlingInnings, wickets: Math.floor(read('bowling wkts', 5000)), economy: read('bowling econ', 36) }
            : null;

        if (batting || bowling) return { batting, bowling };
    }

    return null;
};

export { toMatch, toSquads, toFigures, roleOf, isId }
