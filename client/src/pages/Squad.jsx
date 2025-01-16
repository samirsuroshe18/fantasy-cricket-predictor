import React from 'react';
import 'tailwindcss/tailwind.css'; 

const players = [
    // Add 30 players here with their properties
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    }, {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    {
        image: 'player1.jpg',
        name: 'Player 1',
        role: 'Batsman',
        battingStyle: 'Right-hand bat',
        bowlingStyle: 'Right-arm offbreak'
    },
    // Add more players...
];

const Squad = () => {
    const team1 = players.slice(0, 15);
    const team2 = players.slice(15, 30);

    const renderPlayerCard = (player) => (
        <div className="bg-white shadow-md rounded-lg p-4 m-2" key={player.name}>
            <img src={player.image} alt={player.name} className="w-full h-32 object-cover rounded-t-lg" />
            <h3 className="text-xl font-semibold mt-2">{player.name}</h3>
            <p className="text-gray-600">Role: {player.role}</p>
            <p className="text-gray-600">Batting Style: {player.battingStyle}</p>
            <p className="text-gray-600">Bowling Style: {player.bowlingStyle}</p>
        </div>
    );

    return (
        <div className="container mx-auto p-4">
            <div className="team-section mb-8">
                <h2 className="text-2xl font-bold mb-4">Team 1</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {team1.map(renderPlayerCard)}
                </div>
            </div>
            <div className="team-section">
                <h2 className="text-2xl font-bold mb-4">Team 2</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {team2.map(renderPlayerCard)}
                </div>
            </div>
        </div>
    );
};

export default Squad;