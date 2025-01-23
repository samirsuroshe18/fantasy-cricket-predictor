import React from "react";
import PlayerCard from "../components/Playercard";


const players = [
  // Same array with 30 players
];

const Squad = () => {
  const team1 = players.slice(0, 15);
  const team2 = players.slice(15, 30);

  const defaultPlayer = {
    image: "default-player.jpg", // Replace with a valid image URL
    name: "Default Player",
    role: "All-rounder",
    battingStyle: "Right-hand bat",
    bowlingStyle: "Right-arm medium",
  };

  return (
    <div className="container mx-auto p-4">
      {/* Default Player Card Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Featured Player</h2>
        <PlayerCard
          image={defaultPlayer.image}
          name={defaultPlayer.name}
          role={defaultPlayer.role}
          battingStyle={defaultPlayer.battingStyle}
          bowlingStyle={defaultPlayer.bowlingStyle}
        />
      </div>

      {/* Team 1 Section */}
      <div className="team-section mb-8">
        <h2 className="text-2xl font-bold mb-4">Team 1</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team1.map((player, index) => (
            <PlayerCard
              key={index}
              image={player.image}
              name={player.name}
              role={player.role}
              battingStyle={player.battingStyle}
              bowlingStyle={player.bowlingStyle}
            />
          ))}
        </div>
      </div>

      {/* Team 2 Section */}
      <div className="team-section">
        <h2 className="text-2xl font-bold mb-4">Team 2</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team2.map((player, index) => (
            <PlayerCard
              key={index}
              image={player.image}
              name={player.name}
              role={player.role}
              battingStyle={player.battingStyle}
              bowlingStyle={player.bowlingStyle}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Squad;