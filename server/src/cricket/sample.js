// Sample matches: made-up teams and players with made-up career figures, so the app
// can be used without the cricket source. They are marked "Sample" wherever they appear.

const HOUR_MS = 60 * 60 * 1000;

const bat = (innings, runs, average, strikeRate) => ({ innings, runs, average, strikeRate });
const bowl = (innings, wickets, economy) => ({ innings, wickets, economy });

const RIGHT = 'Right Handed Bat';
const LEFT = 'Left Handed Bat';

// name, role, batting figures, bowling figures, batting style, bowling style
const player = (name, role, batting, bowling, battingStyle = RIGHT, bowlingStyle = '') =>
    ({ name, role, batting, bowling, battingStyle, bowlingStyle });

const TEAMS = {
    mum: {
        name: 'Mumbai Mariners', shortName: 'MUM', country: 'India',
        players: [
            player('Aarav Kulkarni', 'wk', bat(142, 3890, 31.4, 141.2), null),
            player('Ishan Dubey', 'wk', bat(58, 1320, 26.9, 133.5), null, LEFT),
            player('Rohan Deshpande', 'bat', bat(201, 6010, 34.2, 138.9), bowl(14, 6, 8.9), RIGHT, 'Right-arm offbreak'),
            player('Kabir Malhotra', 'bat', bat(96, 2740, 32.6, 151.3), null, LEFT),
            player('Dev Sharma', 'bat', bat(77, 1890, 27.8, 129.4), null),
            player('Tanmay Joshi', 'bat', bat(34, 760, 24.5, 136.0), null),
            player('Yash Thakur', 'bat', bat(12, 210, 19.1, 122.7), null, LEFT),
            player('Vikram Rane', 'ar', bat(120, 2210, 25.4, 147.8), bowl(110, 98, 8.1), RIGHT, 'Right-arm fast-medium'),
            player('Sahil Pathan', 'ar', bat(88, 1340, 21.6, 139.2), bowl(85, 92, 7.6), LEFT, 'Slow left-arm orthodox'),
            player('Neil Fernandes', 'ar', bat(40, 520, 18.6, 128.3), bowl(38, 35, 8.4), RIGHT, 'Right-arm medium'),
            player('Arjun Nair', 'bowl', bat(30, 120, 6.3, 95.0), bowl(130, 168, 7.2), RIGHT, 'Right-arm fast'),
            player('Pranav Shetty', 'bowl', bat(22, 80, 5.7, 88.0), bowl(95, 112, 7.9), RIGHT, 'Legbreak googly'),
            player('Karan Bhosale', 'bowl', bat(15, 45, 4.5, 80.0), bowl(61, 70, 8.3), LEFT, 'Left-arm fast-medium'),
            player('Omkar Jadhav', 'bowl', bat(8, 30, 6.0, 90.0), bowl(28, 31, 8.8), RIGHT, 'Right-arm offbreak'),
            player('Zaid Khan', 'bowl', null, null, RIGHT, 'Right-arm fast-medium'),
        ],
    },
    che: {
        name: 'Chennai Chargers', shortName: 'CHE', country: 'India',
        players: [
            player('Srinivas Iyer', 'wk', bat(168, 4420, 33.0, 136.4), null),
            player('Aditya Menon', 'wk', bat(25, 480, 22.9, 128.0), null),
            player('Raghav Subramanian', 'bat', bat(155, 4650, 36.1, 132.8), null, LEFT),
            player('Karthik Balaji', 'bat', bat(110, 2980, 30.4, 144.6), null),
            player('Varun Pillai', 'bat', bat(64, 1510, 26.5, 140.1), bowl(9, 4, 9.2), RIGHT, 'Right-arm offbreak'),
            player('Harish Rao', 'bat', bat(41, 930, 25.1, 127.3), null, LEFT),
            player('Nikhil Reddy', 'bat', bat(9, 150, 18.8, 119.0), null),
            player('Ashwin Krishnan', 'ar', bat(132, 1980, 22.0, 135.5), bowl(140, 151, 6.9), RIGHT, 'Right-arm offbreak'),
            player('Mohammed Farhan', 'ar', bat(70, 1420, 27.3, 152.4), bowl(55, 44, 8.7), RIGHT, 'Right-arm medium-fast'),
            player('Dinesh Chandran', 'ar', bat(46, 610, 17.4, 131.0), bowl(47, 49, 7.8), LEFT, 'Slow left-arm orthodox'),
            player('Suresh Pandian', 'bowl', bat(35, 140, 7.0, 98.0), bowl(118, 149, 7.4), RIGHT, 'Right-arm fast'),
            player('Lokesh Naidu', 'bowl', bat(19, 60, 5.0, 85.0), bowl(84, 101, 7.7), RIGHT, 'Legbreak'),
            player('Tushar Vasan', 'bowl', bat(12, 35, 4.4, 78.0), bowl(52, 55, 8.5), LEFT, 'Left-arm fast'),
            player('Ganesh Murali', 'bowl', bat(6, 14, 3.5, 70.0), bowl(21, 19, 9.1), RIGHT, 'Right-arm fast-medium'),
            player('Prem Selvan', 'bowl', bat(3, 8, 4.0, 72.0), bowl(7, 9, 7.9), RIGHT, 'Right-arm offbreak'),
        ],
    },
    del: {
        name: 'Delhi Dynamos', shortName: 'DEL', country: 'India',
        players: [
            player('Rishi Chauhan', 'wk', bat(121, 3460, 34.9, 149.8), null, LEFT),
            player('Manav Bedi', 'wk', bat(44, 870, 23.5, 126.2), null),
            player('Shaurya Kapoor', 'bat', bat(178, 5230, 35.6, 134.1), null),
            player('Dhruv Ahuja', 'bat', bat(102, 2860, 31.1, 146.9), null),
            player('Parth Sehgal', 'bat', bat(59, 1390, 26.2, 138.4), null, LEFT),
            player('Lakshay Gill', 'bat', bat(31, 690, 24.6, 131.7), null),
            player('Ayaan Bhatia', 'bat', bat(5, 60, 12.0, 105.0), null),
            player('Kunal Tyagi', 'ar', bat(98, 1760, 24.1, 141.5), bowl(96, 104, 7.8), RIGHT, 'Right-arm fast-medium'),
            player('Harpreet Sandhu', 'ar', bat(83, 1190, 19.8, 144.0), bowl(80, 79, 8.0), LEFT, 'Left-arm medium'),
            player('Aman Verma', 'ar', bat(27, 410, 20.5, 133.2), bowl(26, 22, 8.6), RIGHT, 'Right-arm offbreak'),
            player('Navdeep Rana', 'bowl', bat(28, 110, 6.9, 96.0), bowl(104, 131, 7.5), RIGHT, 'Right-arm fast'),
            player('Yuvraj Dahiya', 'bowl', bat(20, 70, 5.8, 90.0), bowl(90, 109, 7.3), RIGHT, 'Legbreak googly'),
            player('Mohit Saini', 'bowl', bat(17, 50, 4.2, 82.0), bowl(66, 64, 8.6), RIGHT, 'Right-arm medium-fast'),
            player('Sameer Lamba', 'bowl', bat(10, 25, 3.6, 75.0), bowl(33, 36, 8.2), LEFT, 'Slow left-arm orthodox'),
            player('Ritvik Bansal', 'bowl', null, null, RIGHT, 'Right-arm fast'),
        ],
    },
    kol: {
        name: 'Kolkata Kings', shortName: 'KOL', country: 'India',
        players: [
            player('Abhishek Ghosh', 'wk', bat(133, 3120, 28.6, 139.7), null),
            player('Sourav Dutta', 'wk', bat(37, 720, 22.5, 124.9), null, LEFT),
            player('Anirban Sen', 'bat', bat(164, 4380, 31.7, 135.0), null),
            player('Debojit Roy', 'bat', bat(89, 2510, 33.5, 153.8), null, LEFT),
            player('Pritam Bose', 'bat', bat(72, 1640, 25.6, 130.6), bowl(11, 5, 9.4), RIGHT, 'Right-arm offbreak'),
            player('Rajdeep Mitra', 'bat', bat(48, 1050, 24.4, 137.5), null),
            player('Subho Paul', 'bat', bat(14, 260, 20.0, 125.0), null),
            player('Arnab Chatterjee', 'ar', bat(115, 2040, 23.7, 158.2), bowl(99, 87, 8.8), RIGHT, 'Right-arm fast-medium'),
            player('Imran Sheikh', 'ar', bat(76, 980, 18.5, 127.4), bowl(92, 108, 7.1), LEFT, 'Slow left-arm orthodox'),
            player('Tapas Mondal', 'ar', bat(33, 450, 17.3, 134.8), bowl(31, 27, 8.5), RIGHT, 'Right-arm medium'),
            player('Sayan Das', 'bowl', bat(26, 95, 5.9, 92.0), bowl(112, 139, 7.6), RIGHT, 'Right-arm fast'),
            player('Wasim Akhtar', 'bowl', bat(21, 75, 5.4, 86.0), bowl(88, 97, 7.2), RIGHT, 'Right-arm offbreak'),
            player('Biplab Saha', 'bowl', bat(13, 40, 4.0, 79.0), bowl(57, 61, 8.4), LEFT, 'Left-arm fast-medium'),
            player('Rana Majumdar', 'bowl', bat(7, 18, 3.6, 74.0), bowl(24, 26, 8.9), RIGHT, 'Legbreak'),
            player('Kaushik Pal', 'bowl', bat(2, 4, 2.0, 66.0), bowl(4, 3, 9.6), RIGHT, 'Right-arm medium'),
        ],
    },
    nor: {
        name: 'Northern Stars', shortName: 'NOR', country: 'India',
        players: [
            player('Gurkeerat Bajwa', 'wk', bat(96, 3180, 38.3, 91.4), null),
            player('Ankit Rawat', 'wk', bat(22, 510, 25.5, 84.0), null, LEFT),
            player('Virat Dogra', 'bat', bat(184, 8210, 51.3, 93.6), null),
            player('Shubham Negi', 'bat', bat(121, 4640, 42.2, 88.9), null),
            player('Pawan Bisht', 'bat', bat(74, 2390, 36.2, 96.8), bowl(12, 7, 5.8), LEFT, 'Slow left-arm orthodox'),
            player('Jatin Mehra', 'bat', bat(38, 1080, 31.8, 82.5), null),
            player('Rahul Thapa', 'bat', bat(11, 240, 24.0, 78.3), null),
            player('Hardik Chahal', 'ar', bat(88, 2150, 30.3, 104.5), bowl(84, 96, 5.6), RIGHT, 'Right-arm fast-medium'),
            player('Ravinder Jaggi', 'ar', bat(132, 2420, 27.5, 86.2), bowl(140, 172, 4.8), LEFT, 'Slow left-arm orthodox'),
            player('Deepak Hooda', 'ar', bat(29, 560, 23.3, 90.1), bowl(25, 21, 5.9), RIGHT, 'Right-arm offbreak'),
            player('Jaspreet Brar', 'bowl', bat(40, 190, 7.6, 70.0), bowl(102, 171, 4.6), RIGHT, 'Right-arm fast'),
            player('Mandeep Kalsi', 'bowl', bat(33, 150, 6.8, 65.0), bowl(79, 118, 5.2), RIGHT, 'Legbreak googly'),
            player('Sandeep Lohan', 'bowl', bat(24, 90, 5.6, 62.0), bowl(58, 74, 5.7), LEFT, 'Left-arm fast-medium'),
            player('Umesh Dhillon', 'bowl', bat(12, 40, 4.4, 58.0), bowl(27, 30, 6.1), RIGHT, 'Right-arm fast-medium'),
            player('Arshdeep Sodhi', 'bowl', bat(4, 9, 3.0, 50.0), bowl(8, 11, 5.4), LEFT, 'Left-arm fast-medium'),
        ],
    },
    sou: {
        name: 'Southern Storm', shortName: 'SOU', country: 'India',
        players: [
            player('Sanjay Nambiar', 'wk', bat(118, 3910, 37.6, 95.2), null),
            player('Vishal Hegde', 'wk', bat(30, 640, 23.7, 81.6), null),
            player('Mayank Gowda', 'bat', bat(142, 5760, 44.6, 89.7), null),
            player('Abhinav Kamath', 'bat', bat(99, 3620, 40.7, 98.4), null, LEFT),
            player('Shreyas Bhat', 'bat', bat(81, 2710, 37.1, 92.3), null),
            player('Devdutt Shenoy', 'bat', bat(45, 1310, 32.0, 85.9), null, LEFT),
            player('Manish Poojary', 'bat', bat(7, 130, 18.6, 74.0), null),
            player('Krunal Naik', 'ar', bat(104, 2380, 28.7, 99.3), bowl(101, 109, 5.3), LEFT, 'Slow left-arm orthodox'),
            player('Vijay Acharya', 'ar', bat(66, 1290, 24.3, 108.6), bowl(60, 58, 6.0), RIGHT, 'Right-arm medium-fast'),
            player('Sundar Moorthy', 'ar', bat(52, 840, 21.0, 83.4), bowl(55, 63, 4.9), LEFT, 'Right-arm offbreak'),
            player('Prasidh Kini', 'bowl', bat(36, 160, 6.7, 68.0), bowl(91, 148, 5.0), RIGHT, 'Right-arm fast'),
            player('Kuldeep Varma', 'bowl', bat(30, 130, 6.5, 63.0), bowl(86, 140, 5.1), LEFT, 'Left-arm wrist-spin'),
            player('Basil Kurian', 'bowl', bat(18, 60, 4.6, 60.0), bowl(49, 60, 5.8), RIGHT, 'Right-arm fast-medium'),
            player('Sandeep Warrier', 'bowl', bat(9, 28, 4.0, 55.0), bowl(19, 20, 6.3), RIGHT, 'Right-arm fast-medium'),
            player('Rohit Kuttan', 'bowl', null, null, RIGHT, 'Legbreak'),
        ],
    },
};

// hours from the start of the current hour
const FIXTURES = [
    { id: 'sample-t20-1', format: 't20', teams: ['mum', 'che'], startsIn: 20, venue: 'Harbour Stadium, Mumbai', title: 'Sample Premier League' },
    { id: 'sample-t20-2', format: 't20', teams: ['del', 'kol'], startsIn: 54, venue: 'Capital Ground, Delhi', title: 'Sample Premier League' },
    { id: 'sample-odi-1', format: 'odi', teams: ['nor', 'sou'], startsIn: 100, venue: 'Lakeside Oval, Bengaluru', title: 'Sample One-Day Cup' },
];

const isSampleId = (id) => FIXTURES.some((fixture) => fixture.id === id);

const matchOf = (fixture, now) => {
    const teams = fixture.teams.map((key) => TEAMS[key]);
    const hour = Math.floor(now / HOUR_MS) * HOUR_MS;

    return {
        id: fixture.id,
        name: `${teams[0].name} vs ${teams[1].name}, ${fixture.title}`,
        format: fixture.format,
        startsAt: new Date(hour + fixture.startsIn * HOUR_MS).toISOString(),
        venue: fixture.venue,
        teams: teams.map((team) => ({ name: team.name, shortName: team.shortName, logo: '' })),
        isSample: true,
    };
};

// always upcoming: their start is counted from now
const sampleMatches = (now = Date.now()) => FIXTURES.map((fixture) => matchOf(fixture, now));

// the match with both squads and every player's figures, or null for another id
const sampleMatch = (id, now = Date.now()) => {
    const fixture = FIXTURES.find((entry) => entry.id === id);
    if (!fixture) return null;

    const squads = fixture.teams.map((key) => {
        const team = TEAMS[key];

        return {
            team: team.name,
            players: team.players.map((entry, index) => ({
                id: `sample-${key}-${String(index + 1).padStart(2, '0')}`,
                name: entry.name,
                team: team.name,
                role: entry.role,
                battingStyle: entry.battingStyle,
                bowlingStyle: entry.bowlingStyle,
                country: team.country,
                image: '',
                figures: entry.batting || entry.bowling ? { batting: entry.batting, bowling: entry.bowling } : null,
                figuresLoaded: true,
            })),
        };
    });

    return { match: matchOf(fixture, now), squads };
};

export { sampleMatches, sampleMatch, isSampleId }
