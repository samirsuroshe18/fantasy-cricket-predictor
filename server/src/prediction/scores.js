// A player's score, from 0 to 100, worked out from career figures alone. What each
// number is measured against is in docs/design.md, section 5.

const MEASURES = {
    t20: { average: 40, strikeRate: 160, wickets: 1.5, economyBest: 6, economyWorst: 10 },
    odi: { average: 50, strikeRate: 100, wickets: 1.8, economyBest: 4, economyWorst: 7 },
};

// figures from fewer innings than this count for proportionally less
const FULL_INNINGS = 10;
// a player the source has no figures of: below a regular, above a tail-ender
const WITHOUT_FIGURES = 35;

const clamp = (value) => Math.min(Math.max(value, 0), 1);
// anything that is not a usable number counts as none
const amount = (value) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0);
const oneDecimal = (value) => Math.round(value * 10) / 10;

const battingScore = (figures, measure) => {
    const innings = amount(figures?.innings);
    if (!innings) return 0;

    const quality = 60 * clamp(amount(figures.average) / measure.average) + 40 * clamp(amount(figures.strikeRate) / measure.strikeRate);
    return quality * clamp(innings / FULL_INNINGS);
};

const bowlingScore = (figures, measure) => {
    const innings = amount(figures?.innings);
    if (!innings) return 0;

    const economy = amount(figures.economy);
    // an economy of nothing is one the source did not give, not a perfect one
    const thrift = economy ? clamp((measure.economyWorst - economy) / (measure.economyWorst - measure.economyBest)) : 0;
    const quality = 60 * clamp(amount(figures.wickets) / innings / measure.wickets) + 40 * thrift;
    return quality * clamp(innings / FULL_INNINGS);
};

// how much of each part counts for a role
const WEIGHTS = {
    wk: { batting: 0.9, bowling: 0.1 },
    bat: { batting: 0.9, bowling: 0.1 },
    ar: { batting: 0.6, bowling: 0.6 },
    bowl: { batting: 0.15, bowling: 0.85 },
};

// player: { role, figures }. Answers { batting, bowling, score, hasFigures }.
const scoreOf = (player, format) => {
    const measure = Object.hasOwn(MEASURES, format) ? MEASURES[format] : MEASURES.t20;
    const weight = Object.hasOwn(WEIGHTS, player.role) ? WEIGHTS[player.role] : WEIGHTS.bat;
    const hasFigures = amount(player.figures?.batting?.innings) > 0 || amount(player.figures?.bowling?.innings) > 0;

    if (!hasFigures) {
        return { batting: 0, bowling: 0, score: WITHOUT_FIGURES, hasFigures: false };
    }

    const batting = battingScore(player.figures.batting, measure);
    const bowling = bowlingScore(player.figures.bowling, measure);

    return {
        batting: oneDecimal(batting),
        bowling: oneDecimal(bowling),
        score: oneDecimal(Math.min(weight.batting * batting + weight.bowling * bowling, 100)),
        hasFigures: true,
    };
};

// the squads with every player's score: score, battingScore, bowlingScore, hasFigures
const withScores = (squads, format) => squads.map((squad) => ({
    team: squad.team,
    players: squad.players.map((player) => {
        const { batting, bowling, score, hasFigures } = scoreOf(player, format);
        return { ...player, score, battingScore: batting, bowlingScore: bowling, hasFigures };
    }),
}));

export { scoreOf, withScores, WITHOUT_FIGURES }
