import { scoreOf } from '../src/prediction/scores.js';

const batting = (innings, average, strikeRate) => ({ innings, runs: 0, average, strikeRate });
const bowling = (innings, wickets, economy) => ({ innings, wickets, economy });
const player = (role, figures) => ({ id: 'p', name: 'Player', role, figures });

describe('a T20 score', () => {
    test('a batter: 60 for the average against 40, 40 for the strike rate against 160', () => {
        // 60 x 30/40 + 40 x 140/160 = 45 + 35 = 80; a batter's score is 0.9 x 80
        expect(scoreOf(player('bat', { batting: batting(100, 30, 140), bowling: null }), 't20'))
            .toEqual({ batting: 80, bowling: 0, score: 72, hasFigures: true });
    });

    test('a wicket-keeper is scored as a batter', () => {
        expect(scoreOf(player('wk', { batting: batting(100, 30, 140), bowling: null }), 't20').score).toBe(72);
    });

    test('a bowler: 60 for wickets an innings against 1.5, 40 for the economy between 10 and 6', () => {
        // bowling: 60 x (60/50)/1.5 + 40 x (10-7)/4 = 48 + 30 = 78
        // batting: 60 x 10/40 + 40 x 100/160 = 15 + 25 = 40
        // 0.15 x 40 + 0.85 x 78 = 6 + 66.3
        expect(scoreOf(player('bowl', { batting: batting(20, 10, 100), bowling: bowling(50, 60, 7) }), 't20'))
            .toEqual({ batting: 40, bowling: 78, score: 72.3, hasFigures: true });
    });

    test('an all-rounder: 0.6 of both parts, at most 100', () => {
        expect(scoreOf(player('ar', { batting: batting(100, 30, 140), bowling: bowling(50, 60, 7) }), 't20').score).toBe(94.8);
        expect(scoreOf(player('ar', { batting: batting(100, 55, 190), bowling: bowling(80, 200, 5) }), 't20'))
            .toEqual({ batting: 100, bowling: 100, score: 100, hasFigures: true });
    });

    test('fewer than ten innings count for less', () => {
        // the best figures there are, from 5 innings: half
        expect(scoreOf(player('bat', { batting: batting(5, 40, 160), bowling: null }), 't20')).toMatchObject({ batting: 50, score: 45 });
        expect(scoreOf(player('bowl', { batting: null, bowling: bowling(1, 3, 6) }), 't20')).toMatchObject({ bowling: 10, score: 8.5 });
    });

    test('figures beyond the best count as the best, and an economy beyond the worst as nothing', () => {
        expect(scoreOf(player('bat', { batting: batting(300, 400, 500), bowling: null }), 't20').batting).toBe(100);
        // 60 x (15/30)/1.5 = 20, and nothing for an economy of 12
        expect(scoreOf(player('bowl', { batting: null, bowling: bowling(30, 15, 12) }), 't20').bowling).toBe(20);
    });

    test('an economy the source did not give earns nothing', () => {
        expect(scoreOf(player('bowl', { batting: null, bowling: bowling(30, 45, 0) }), 't20').bowling).toBe(60);
    });
});

describe('an ODI score', () => {
    test('measures against an average of 50, a strike rate of 100, 1.8 wickets and an economy between 7 and 4', () => {
        expect(scoreOf(player('bat', { batting: batting(10, 50, 100), bowling: null }), 'odi').batting).toBe(100);
        // 60 x 25/50 + 40 x 80/100 = 30 + 32
        expect(scoreOf(player('bat', { batting: batting(40, 25, 80), bowling: null }), 'odi').batting).toBe(62);
        // 60 x (45/50)/1.8 + 40 x (7-5.5)/3 = 30 + 20
        expect(scoreOf(player('bowl', { batting: null, bowling: bowling(50, 45, 5.5) }), 'odi').bowling).toBe(50);
    });
});

describe('a player without figures', () => {
    test('scores 35 and is marked', () => {
        const none = { batting: 0, bowling: 0, score: 35, hasFigures: false };

        expect(scoreOf(player('bat', null), 't20')).toEqual(none);
        expect(scoreOf(player('bowl', undefined), 'odi')).toEqual(none);
        expect(scoreOf(player('ar', { batting: null, bowling: null }), 't20')).toEqual(none);
    });

    test('a part without innings scores 0', () => {
        expect(scoreOf(player('bat', { batting: batting(0, 40, 160), bowling: null }), 't20')).toEqual({ batting: 0, bowling: 0, score: 35, hasFigures: false });
    });
});

describe('whatever the figures are', () => {
    test('a score is a number from 0 to 100 with one decimal', () => {
        const odd = [NaN, Infinity, -5, undefined, null, '12', 1e9, 0];

        for (const value of odd) {
            for (const role of ['wk', 'bat', 'ar', 'bowl', 'coach']) {
                const result = scoreOf(player(role, { batting: batting(value, value, value), bowling: bowling(value, value, value) }), 't20');

                for (const part of [result.batting, result.bowling, result.score]) {
                    expect(Number.isFinite(part)).toBe(true);
                    expect(part).toBeGreaterThanOrEqual(0);
                    expect(part).toBeLessThanOrEqual(100);
                    expect(Math.round(part * 10)).toBeCloseTo(part * 10, 6);
                }
            }
        }
    });

    test('an unknown format is scored as a T20, an unknown role as a batter', () => {
        const figures = { batting: batting(100, 30, 140), bowling: null };

        expect(scoreOf(player('bat', figures), 'hundred').score).toBe(72);
        expect(scoreOf(player('coach', figures), 't20').score).toBe(72);
        // names every object has are not roles or formats either
        expect(scoreOf(player('__proto__', figures), 'constructor').score).toBe(72);
        expect(scoreOf(player('toString', figures), 'valueOf').score).toBe(72);
    });
});
