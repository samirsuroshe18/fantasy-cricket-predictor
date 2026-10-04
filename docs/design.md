# Fantasy Cricket Predictor: design of the completed app

The app suggests a fantasy eleven for an upcoming cricket match. It began as a
personal project of the team in January 2025. This document describes the
completed version.

## 1. Where the project stands

The first version has a landing page, a list of upcoming matches, a squad page
and the start of a server.

| Problem | Effect |
|---|---|
| Unresolved merge conflicts are committed in the server and in the squad page; the server imports a file that is not in the repository | Neither part starts |
| The server ignores the chosen match and sends a fixed squad to a language model, asking it to make up statistics where it has none | The "prediction" is invented |
| The result is then passed to a flow on the hosted Langflow service and stored in an Astra database | Langflow's hosted service was shut down in April 2026; free Astra databases are paused and deleted when idle |
| The result page shows one fixed card of a footballer | There is no prediction to see |
| The dashboard lists made-up matches with random percentages | Nothing on it is true |
| The pages call the cricket API from the browser with the key in the page | Anyone can read the key; every visitor spends the 100 requests a day |
| Dependency folders and a database credential bundle were committed | Removed from the history of the new repository |
| No tests, a one-line README | Nothing guards or explains the behaviour |

## 2. What the completed app does

A user picks an upcoming T20 or ODI match, sees both squads and gets a
suggested eleven with a captain and a vice-captain, a score for every player
and a written explanation. They can change the team and save it.

### Decisions

| Topic | Decision |
|---|---|
| Repository | New repository `fantasy-cricket-predictor` under samirsuroshe18, team history kept, dependency folders and the credential bundle removed from every commit |
| Cricket data | cricketdata.org, called by the server only, cached in MongoDB, with a daily budget; built-in sample matches keep the app usable without it |
| Prediction | Players are scored by rules from their career figures; the server builds the best valid eleven; Gemini explains it and cannot change it |
| Accounts | Email accounts with verification and password reset, and a demo account |
| Saved teams | A user saves, renames, edits and deletes teams |
| Look | The current look is kept; what is broken is fixed |
| Out of scope | Fantasy points after a match, contests, player credits, other sports |
| Delivery | Two stages (section 12) |

## 3. Accounts

As in the team's other apps:

- Sign-up with name, email and password (at least 8 characters), a
  verification link valid for 10 minutes, and a page that receives it. An
  unverified account can log in and is told to verify; it cannot predict or
  save until it has.
- Login in an httpOnly cookie for 7 days. Logout, a password change and a
  password reset end every session.
- "Forgot password" answers the same whether or not the address has an
  account.
- Limits per visitor, per account and per address a request really came from;
  wrong passwords from one place do not lock the owner out elsewhere. The
  whole site sends at most `DAILY_MAIL_LIMIT` mails a day.
- **Demo account**: `demo@fantasy.demo`, password `Demo@123`, behind a button
  on the login page. Nobody can sign up with an `@fantasy.demo` address. It
  sends no email and cannot change its password. Its saved teams are rebuilt
  when the server starts (`SEED_ON_START=true`).

Matches and squads can be read without a login. Predicting and saving need a
verified account.

## 4. Cricket data

### Source

cricketdata.org (CricAPI v1), with the key in `CRICKET_API_KEY` on the server.

| What | Kept for |
|---|---|
| The list of upcoming matches | 1 hour |
| The squads of a match | 6 hours (1 hour while one of them is not announced) |
| The career figures of a player | 14 days |

- A match is listed when it is a T20 or an ODI, has not started, and starts
  within the next 7 days.
- Every request to the source counts against `CRICKET_DAILY_BUDGET` (default
  90 a day, in UTC). When the budget is used up, or the source fails, what
  is in the cache is used even if it is older, and the page says that the
  live data is as of an earlier time. Nothing is retried in a loop: after a
  failure of the source as a whole it is left alone for 5 minutes.
- Every player's figures are a request of their own, so the last 15 requests
  of a day are kept from them, and the last 5 from squads: the list can
  always be fetched. Figures the source would not give are not asked for again
  for some hours. A player whose figures could not be
  fetched is scored as a player without figures, and the page says how many
  there are.
- Only matches of the list are fetched: an id a visitor made up costs nothing.
- Without a key the app shows the sample matches only and says so.

### Sample matches

Three built-in matches (two T20, one ODI) with full squads of fifteen and
career figures for every player, marked "Sample" wherever they appear. Their
start times are counted from now, so they are always upcoming. They cost no
requests and are always listed after the live matches.

### A match, a squad, a player

- Match: `{ id, name, format: "t20" | "odi", startsAt, teams: [{ name, shortName, logo }], isSample }`.
- Squad: for each of the two teams, its players.
- Player: `{ id, name, team, role, battingStyle, bowlingStyle, country, image, figures }`.
  `role` is one of `wk` (wicket-keeper), `bat`, `ar` (all-rounder), `bowl`;
  a role the source does not give is `bat`.
- Figures, for the format of the match, or `null` when the source has none:
  `{ batting: { innings, runs, average, strikeRate }, bowling: { innings, wickets, economy } }`.
  For a T20 match the source's `t20` figures are used, then `t20i`, then
  `ipl`; for an ODI its `odi` figures.

## 5. Scoring

Every figure is from the source; nothing is estimated by a language model.

```
batting = (60 × min(average / A, 1) + 40 × min(strikeRate / S, 1)) × min(innings / 10, 1)
bowling = (60 × min(wicketsPerInnings / W, 1) + 40 × clamp((E_worst − economy) / (E_worst − E_best), 0, 1)) × min(innings / 10, 1)
```

| Format | A | S | W | E_best | E_worst |
|---|---|---|---|---|---|
| T20 | 40 | 160 | 1.5 | 6 | 10 |
| ODI | 50 | 100 | 1.8 | 4 | 7 |

A part without innings scores 0. The player's score, from 0 to 100, rounded
to one decimal:

| Role | Score |
|---|---|
| Wicket-keeper, batter | 0.9 × batting + 0.1 × bowling |
| Bowler | 0.15 × batting + 0.85 × bowling |
| All-rounder | 0.6 × batting + 0.6 × bowling, at most 100 |
| No figures | 35, and the player is marked "no figures available" |

## 6. The eleven

Rules of a valid team:

- 11 different players from the two squads
- 1 to 4 wicket-keepers, 3 to 6 batters, 1 to 4 all-rounders, 3 to 6 bowlers
- at most 7 from one team
- a captain and a vice-captain, two different players of the eleven

The suggested team is the valid eleven with the highest sum of scores, found
exactly, not by trial. Of the equal players of one role on one side the first
by name is taken, and between teams of equal sums the choice is fixed, so the
same squads always give the same team. The captain is the
player with the highest score, the vice-captain the next.

When no valid team exists (for example no wicket-keeper is listed), the
answer says which rule cannot be met.

## 7. The explanation

- Gemini (model from `GEMINI_MODEL`, default `gemini-3.5-flash-lite`) is given
  the match, the eleven with scores and figures, the captain and
  vice-captain, and the five best players left out.
- It writes a summary, a line on the captain and vice-captain, and up to
  three players who narrowly missed out, in a fixed shape checked by the
  server. It cannot change the team. Names from the source are passed as
  data, never as instructions.
- A prediction is kept for 6 hours for each match, so asking again costs
  nothing and gives the same text.
- If Gemini fails, is not set up, or the site's `SITE_EXPLANATION_LIMIT`
  (default 200 a day) is used up, the team is shown without the text.
- A user can ask for 20 predictions a day (`DAILY_PREDICTION_LIMIT`). Every
  visitor of the demo account has that allowance of their own, and all of
  them behind one real address together have 300.
- A team whose explanation could not be written is not asked for again for 5
  minutes.

## 8. Saved teams

- A team is saved under a name (1 to 60 characters) with the match, the
  squads as they were, the eleven, the captain and vice-captain, and the
  explanation when the team is the suggested one.
- Editing replaces players by others of the same match's squads, or changes
  the captain or vice-captain. The server checks the rules of section 6 and
  names the one that is broken. An edited team is marked "edited" and loses
  the explanation.
- A user has at most 50 saved teams (the demo account 20), and reaches only
  their own.
- The demo account starts with three saved teams of the sample matches.

## 9. Pages

| Page | Who | Content |
|---|---|---|
| Landing | Everyone | As now |
| Login, Register, Forgot password, Reset password, Verify email | Everyone | Accounts; the login page has the demo button |
| Matches | Everyone | Live and sample matches, with how long until each starts |
| Match | Everyone | Both squads with roles and figures; "Predict my eleven" |
| Prediction | Verified | The eleven on a pitch by role, scores, the explanation, the players left out; "Save team" |
| My teams | Logged in | The saved teams |
| Team | Logged in | A saved team; edit, rename, delete |
| Not found | Everyone | |

Pages that need a login send a visitor to the login page and back. Every page
that loads data has a loading, an empty and an error state. The layout works
on a phone without sideways scrolling. The made-up dashboard is removed.

## 10. API

All routes are under `/api/v1` and answer
`{ statusCode, data, message, success }`.

| Route | Purpose |
|---|---|
| `GET /health` | The server is up |
| `POST /users/register`, `POST /users/login`, `POST /users/demo-login`, `GET /users/me`, `POST /users/logout`, `POST /users/resend-verification`, `POST /users/forgot-password`, `POST /users/change-password` | Accounts |
| `GET /verify/verify-email`, `GET /verify/reset-password`, `POST /verify/reset-password` | Links from emails |
| `GET /matches` | `{ matches, live: { available, asOf, note } }` |
| `GET /matches/:id` | The match with its squads and each player's score |
| `POST /matches/:id/prediction` | `{ match, players, captainId, viceCaptainId, total, bench, explanation, remaining, note }` |
| `GET /teams`, `POST /teams` | The user's saved teams; save one |
| `GET /teams/:id`, `PUT /teams/:id`, `DELETE /teams/:id` | One saved team |

## 11. Structure, settings and tests

```
server/src/   app.js, index.js, controllers/, models/, routes/, middlewares/,
              cricket/ (source, cache, budget, sample matches, normalising),
              prediction/ (scores, the eleven, the explanation), scripts/ (demo data), utils/
server/tests/
client/src/   api/, components/, pages/, redux/, lib/
docs/design.md
```

`server/.env`: `MONGODB_URI`, `PORT`, `SERVER_HOST`, `FRONTEND_URL`,
`ACCESS_TOKEN_SECRET`, `NODE_ENV`, mail settings, `CRICKET_API_KEY`,
`GEMINI_API_KEY`, `GEMINI_MODEL`, `SEED_ON_START`, the limits above, and
`CONNECTION_IP_HEADER` on hosts whose own proxies sit in front of the server.
The web app needs none.

Server tests run against an in-memory database and never call the cricket
source, Gemini or a mail server; each is replaced by a stand-in. They cover
accounts, reading the source's answers (including odd and missing values),
the cache and the budget, the scores (with numbers checked by hand), the
eleven (every rule, ties, impossible squads, and that no better valid team
exists on small cases checked by brute force), the explanation's checks, the
limits, saved teams and who may reach them, and the demo data. The web app is
checked by building it, linting it and walking through every page in a
browser on a desktop and a phone width.

## 12. Stages

1. **Accounts, cricket data, matches and squads**: sections 3 and 4, the
   scores of section 5 shown on the squad page, and their pages.
2. **Prediction, explanation and saved teams**: sections 6 to 8, the demo
   data, their pages and the README.

Each stage has its own plan, tests, review and pull request.

## 13. Deployment

Server on Render, web app on Vercel, database on MongoDB Atlas, email through
Brevo. `client/vercel.json` forwards `/api` to the server.
