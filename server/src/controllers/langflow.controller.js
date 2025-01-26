import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/customAsyncHandler.js';
import axios from "axios"
import extractJson from '../utils/extractJson.js';
import { astraConnection } from '../astraDB/astraDB.js';

const systemPrompt = `you will get players from two teams. Analyze the performance of each player based on their last five matches in the specified format (ODI/T20/Test), which will be provided as plain text. Append the following statistical data to each player object:

avg_runs: Average runs scored in the last five matches.
stkrate: Strike rate in the last five matches.
total_wickets: Total wickets taken in the last five matches.
batting_success_percent: Percentage of success against the opposition’s key bowlers.
bowling_success_percent: Percentage of success against the opposition’s key batters.
Update each player object by appending this statistical data based on the provided format and return the updated object.

Example Input:

Format: T20

Players:
[
 {
   "id": "15c1b556-a5b4-4cad-94da-0417c74b6918",
   "name": "Tabraiz Shamsi",
   "role": "Bowler",
   "battingStyle": "Right Handed Bat",
   "bowlingStyle": "Left-arm wrist-spin",
   "country": "South Africa",
   "playerImg": "https://h.cricapi.com/img/players/15c1b556-a5b4-4cad-94da-0417c74b6918.jpg"
 }
]
Example Output:
[
 {
   "id": "15c1b556-a5b4-4cad-94da-0417c74b6918",
   "name": "Tabraiz Shamsi",
   "role": "Bowler",
   "battingStyle": "Right Handed Bat",
   "bowlingStyle": "Left-arm wrist-spin",
   "country": "South Africa",
   "playerImg": "https://h.cricapi.com/img/players/15c1b556-a5b4-4cad-94da-0417c74b6918.jpg",
   "avg_runs": 12,
   "stkrate": 105.4,
   "total_wickets": 8,
   "batting_success_percent": 33.5,
   "bowling_success_percent": 75.0
 }
]
Instructions:

Analyze the last five matches for each player based on the format specified.
Use opposition key players for calculating success percentages.
Return the updated players object with appended statistical data for each player.
Use placeholder values when actual data is unavailable to maintain consistency.`;

const userPrompt = `
[
{
        "teamName": "Joburg Super Kings",
        "shortname": "JSK",
        "img": "https://g.cricapi.com/iapi/4126-638110225996089656.webp?w=48",
        "players": [
            {
                "id": "15c1b556-a5b4-4cad-94da-0417c74b6918",
                "name": "Tabraiz Shamsi",
                "role": "Bowler",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Left-arm wrist-spin",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/players/15c1b556-a5b4-4cad-94da-0417c74b6918.jpg"
            },
            {
                "id": "715107b5-0412-452b-aa0b-04394f7b1327",
                "name": "Jonny Bairstow",
                "role": "WK-Batsman",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm medium",
                "country": "England",
                "playerImg": "https://h.cricapi.com/img/players/715107b5-0412-452b-aa0b-04394f7b1327.jpg"
            },
            {
                "id": "0fa3b27a-30a7-493e-973f-51683a26f000",
                "name": "Hardus Viljoen",
                "role": "Bowler",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm fast-medium",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/players/0fa3b27a-30a7-493e-973f-51683a26f000.jpg"
            },
            {
                "id": "5165d25c-edb0-4728-867a-572b8b1b434c",
                "name": "Evan Jones",
                "role": "Bowler",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm fast-medium",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/icon512.png"
            },
            {
                "id": "7e09eef0-d886-4997-b568-5fd4e0dfbbec",
                "name": "Maheesh Theekshana",
                "role": "Bowler",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm offbreak",
                "country": "Sri Lanka",
                "playerImg": "https://h.cricapi.com/img/players/7e09eef0-d886-4997-b568-5fd4e0dfbbec.jpg"
            },
            {
                "id": "4cea6e1d-5808-466b-9a8c-74fc324efb75",
                "name": "David Wiese",
                "role": "Batting Allrounder",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm fast-medium",
                "country": "Namibia",
                "playerImg": "https://h.cricapi.com/img/players/4cea6e1d-5808-466b-9a8c-74fc324efb75.jpg"
            },
            {
                "id": "27883e8e-173e-463e-8cdc-75be94495200",
                "name": "JP King",
                "role": "Bowling Allrounder",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm offbreak",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/icon512.png"
            },
            {
                "id": "9f06f450-c300-4b49-9359-7876f492f686",
                "name": "Moeen Ali",
                "role": "Batting Allrounder",
                "battingStyle": "Left Handed Bat",
                "bowlingStyle": "Right-arm offbreak",
                "country": "England",
                "playerImg": "https://h.cricapi.com/img/players/9f06f450-c300-4b49-9359-7876f492f686.jpg"
            },
            {
                "id": "18249dbf-6ece-4c0c-bcd7-7e0c6a805b76",
                "name": "Doug Bracewell",
                "role": "Bowler",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm fast-medium",
                "country": "New Zealand",
                "playerImg": "https://h.cricapi.com/img/players/18249dbf-6ece-4c0c-bcd7-7e0c6a805b76.jpg"
            },
            {
                "id": "9854d0a6-9480-4564-99b6-933b070fa23a",
                "name": "Imran Tahir",
                "role": "Bowler",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm legbreak",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/players/9854d0a6-9480-4564-99b6-933b070fa23a.jpg"
            },
            {
                "id": "d59bfc6b-bf4c-4a23-aa82-954911b0973d",
                "name": "Matheesha Pathirana",
                "role": "Bowler",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm fast",
                "country": "Sri Lanka",
                "playerImg": "https://h.cricapi.com/img/icon512.png"
            },
            {
                "id": "f9267401-81bf-4a02-b500-a6133712b596",
                "name": "Beuran Hendricks",
                "role": "Bowler",
                "battingStyle": "Left Handed Bat",
                "bowlingStyle": "Left-arm fast-medium",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/players/f9267401-81bf-4a02-b500-a6133712b596.jpg"
            },
            {
                "id": "ffdec101-c557-4eea-b2be-c77f6b953f23",
                "name": "Wihan Lubbe",
                "role": "Batting Allrounder",
                "battingStyle": "Left Handed Bat",
                "bowlingStyle": "Right-arm offbreak",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/icon512.png"
            },
            {
                "id": "69bff2f3-056f-4bc1-a51b-d00e6d0b95cd",
                "name": "Sibonelo Makhanya",
                "role": "Batsman",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm medium",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/icon512.png"
            },
            {
                "id": "3f9ced2d-d71a-4478-93db-d7260c7145ee",
                "name": "Donovan Ferreira",
                "role": "WK-Batsman",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm offbreak",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/icon512.png"
            },
            {
                "id": "dd632169-52e3-4327-830e-dc5a9d18faa5",
                "name": "Gerald Coetzee",
                "role": "Bowler",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm fast",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/players/dd632169-52e3-4327-830e-dc5a9d18faa5.jpg"
            },
            {
                "id": "e5700821-49b6-4cbb-97d0-ddbc276f9682",
                "name": "Leus du Plooy",
                "role": "Batsman",
                "battingStyle": "Left Handed Bat",
                "bowlingStyle": "Left-arm orthodox",
                "country": "England",
                "playerImg": "https://h.cricapi.com/img/icon512.png"
            },
            {
                "id": "eac0032b-055a-497b-9d4e-f54008414515",
                "name": "Devon Conway",
                "role": "WK-Batsman",
                "battingStyle": "Left Handed Bat",
                "bowlingStyle": "Right-arm medium",
                "country": "New Zealand",
                "playerImg": "https://h.cricapi.com/img/players/eac0032b-055a-497b-9d4e-f54008414515.jpg"
            },
            {
                "id": "e5912efa-da10-4342-981c-f5ae32794672",
                "name": "Faf du Plessis",
                "role": "Batsman",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm legbreak",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/players/e5912efa-da10-4342-981c-f5ae32794672.jpg"
            }
        ]
    },
    {
        "teamName": "Pretoria Capitals",
        "shortname": "PC",
        "img": "https://g.cricapi.com/iapi/4147-638109570840598004.webp?w=48",
        "players": [
            {
                "id": "c510fbe6-8a16-47e4-ab60-0965720241af",
                "name": "Will Jacks",
                "role": "Batting Allrounder",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm offbreak",
                "country": "England",
                "playerImg": "https://h.cricapi.com/img/icon512.png"
            },
            {
                "id": "ae38ef88-1fb7-411a-b7bf-09a7d07f0f9c",
                "name": "Senuran Muthusamy",
                "role": "Batting Allrounder",
                "battingStyle": "Left Handed Bat",
                "bowlingStyle": "Left-arm orthodox",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/icon512.png"
            },
            {
                "id": "475a70da-7cc2-4120-bf33-3814eecb1b39",
                "name": "Keagan Lion Cachet",
                "role": "WK-Batsman",
                "battingStyle": "Right Handed Bat",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/icon512.png"
            },
            {
                "id": "347b673e-6aac-4f03-bcfe-3b988347b345",
                "name": "Rilee Rossouw",
                "role": "Batsman",
                "battingStyle": "Left Handed Bat",
                "bowlingStyle": "Right-arm offbreak",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/players/347b673e-6aac-4f03-bcfe-3b988347b345.jpg"
            },
            {
                "id": "6237a9af-5ba3-4ba4-a843-747f41ffad4a",
                "name": "Eathan Bosch",
                "role": "Bowler",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm fast",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/icon512.png"
            },
            {
                "id": "a8c7ce67-5862-4acb-9297-97eafd0ea3d5",
                "name": "Anrich Nortje",
                "role": "Bowler",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm fast",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/players/a8c7ce67-5862-4acb-9297-97eafd0ea3d5.jpg"
            },
            {
                "id": "b957eb6f-7ed7-47c5-ace9-a1b6aa8e1e16",
                "name": "Kyle Verreynne",
                "role": "WK-Batsman",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm offbreak",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/icon512.png"
            },
            {
                "id": "caf472eb-5afc-4521-b38d-ae69090eeee5",
                "name": "Marques Ackerman",
                "role": "Batsman",
                "battingStyle": "Left Handed Bat",
                "bowlingStyle": "Right-arm offbreak",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/icon512.png"
            },
            {
                "id": "eccad6b2-7fb5-4be4-a6a1-aeaadbd9f85b",
                "name": "Evin Lewis",
                "role": "Batsman",
                "battingStyle": "Left Handed Bat",
                "country": "West Indies",
                "playerImg": "https://h.cricapi.com/img/players/eccad6b2-7fb5-4be4-a6a1-aeaadbd9f85b.jpg"
            },
            {
                "id": "e318825f-655b-4548-8e0b-b17cf04ca13e",
                "name": "Will Smeed",
                "role": "Batsman",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm legbreak",
                "country": "England",
                "playerImg": "https://h.cricapi.com/img/icon512.png"
            },
            {
                "id": "d7c5942c-bc2d-46d2-a3dc-b4bd0ad5e368",
                "name": "Tiaan van Vuuren",
                "role": "Batsman",
                "battingStyle": "Right Handed Bat",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/icon512.png"
            },
            {
                "id": "fb8fcc16-4d39-43d9-94f8-c1cd09b9450f",
                "name": "Steve Stolk",
                "role": "Batsman",
                "battingStyle": "Right Handed Bat",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/icon512.png"
            },
            {
                "id": "0fe9e795-cf84-473a-a51e-c7252f022633",
                "name": "Kyle Simmonds",
                "role": "Batting Allrounder",
                "battingStyle": "Left Handed Bat",
                "bowlingStyle": "Left-arm orthodox",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/icon512.png"
            },
            {
                "id": "00fee12c-63aa-43ed-a1ed-cd156a2e26bc",
                "name": "Rahmanullah Gurbaz",
                "role": "WK-Batsman",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm medium",
                "country": "Afghanistan",
                "playerImg": "https://h.cricapi.com/img/players/00fee12c-63aa-43ed-a1ed-cd156a2e26bc.jpg"
            },
            {
                "id": "6efb08ed-3316-40db-ad25-d8992fdf1a87",
                "name": "Wayne Parnell",
                "role": "Bowler",
                "battingStyle": "Left Handed Bat",
                "bowlingStyle": "Left-arm fast-medium",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/players/6efb08ed-3316-40db-ad25-d8992fdf1a87.jpg"
            },
            {
                "id": "d1c0a448-6ee6-473a-90a2-e6a486698a8a",
                "name": "Liam Livingstone",
                "role": "Batting Allrounder",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm legbreak",
                "country": "England",
                "playerImg": "https://h.cricapi.com/img/players/d1c0a448-6ee6-473a-90a2-e6a486698a8a.jpg"
            },
            {
                "id": "916f7c95-6801-44da-8cfd-e821a845e314",
                "name": "Migael Pretorius",
                "role": "Bowling Allrounder",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm medium",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/players/916f7c95-6801-44da-8cfd-e821a845e314.jpg"
            },
            {
                "id": "edcc938a-7b0e-401b-b0e0-f14163b7fe64",
                "name": "Daryn Dupavillon",
                "role": "Bowler",
                "battingStyle": "Right Handed Bat",
                "bowlingStyle": "Right-arm fast",
                "country": "South Africa",
                "playerImg": "https://h.cricapi.com/img/icon512.png"
            },
            {
                "id": "f8fdffff-13a9-4c84-939d-f5db814519cc",
                "name": "James Neesham",
                "role": "Batting Allrounder",
                "battingStyle": "Left Handed Bat",
                "bowlingStyle": "Right-arm fast-medium",
                "country": "New Zealand",
                "playerImg": "https://h.cricapi.com/img/players/f8fdffff-13a9-4c84-939d-f5db814519cc.jpg"
            }
        ]
    },
    {
        "format": "T20"
    }
]
`;

const getInfo = asyncHandler(async (req, res) => {

    const payload = {
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
    }

    const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        payload,
        {
            headers: {
                Authorization: `Bearer ${process.env.OPEN_AI_API}`
            }
        }
    );

    if (response.statusText != 'OK') {
        throw new ApiError(500, "Error during api call");
    }

    console.log(response.data);

    const data = response.data.choices[0].message.content;

    if (!data) {
        throw new ApiError(400, "data is not available")
    }

    const extractedJsonData = extractJson(data);
    const parseJsonData = JSON.parse(extractedJsonData[0].code);
    console.log(parseJsonData);
    console.log(parseJsonData[0].language)

    const playersWithTeamInfo = parseJsonData.flatMap(team =>
        team.players.map(player => ({
            ...player,
            teamName: team.teamName,
            teamLogo: team.img
        }))
    );
    
    console.log(playersWithTeamInfo);

    const collection = astraConnection.collection('players_collection');
    // await collection.deleteMany({});
    await collection.insertOne({"playersInfo" : playersWithTeamInfo, date: new Date()});

    console.log("All players inserted successfully");

    //TODO: call to langflow

    return res.status(200).json(
        new ApiResponse(200, parseJsonData, "Successfull")
    );
})

export { getInfo };