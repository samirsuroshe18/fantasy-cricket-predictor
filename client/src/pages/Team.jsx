import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import PlayerCard from "../components/Playercard";
import axios from "axios"; // Import axios

const Team = () => {
  const { matchId, matchType } = useParams(); // Extract matchId and matchType from URL params
  const [loading, setLoading] = useState(true);
  const [playersData, setPlayersData] = useState(null); // State to hold player data

  const defaultImage = "https://sc-auetal.de/wp-content/uploads/2018/04/personal-dummy.png";

  const apiKey = import.meta.env.VITE_CRICKDATA_KEY

  useEffect(() => {
    // Fetch players data using axios
    axios
      .get(`https://api.cricapi.com/v1/match_squad?apikey=${apiKey}&id=${matchId}`) // Use dynamic matchId and apiKey
      .then((response) => {
        setPlayersData(response.data); // Assign the response data to playersData
        setLoading(false); // Set loading to false once data is fetched
      })
      .catch((error) => {
        console.error("Error fetching players data:", error);
        setLoading(false); // Set loading to false on error
      });
  }, [matchId]); // Run useEffect when matchId changes

  if (loading || !playersData) {
    return <div>Loading...</div>;
  }

  console.log(playersData); // Log players data to inspect its structure

  return (
    <div className="font-sans bg-gray-50 min-h-screen"> 
      <header className="bg-emerald-500 text-white py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold">AI Predicted Team</h1>
          <p>Match ID: {matchId}</p>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Team 1 Section */}
        <div className="bg-blue-50 p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-blue-700 mb-4">{playersData.data[0].teamName}</h2>
          <div className="space-y-4">
            {playersData.data[0].players.map((player) => {
              const playerImage = player.playerImg === "https://h.cricapi.com/img/icon512.png"
                ? defaultImage
                : player.playerImg;

              return (
                <div key={player.id} className="w-full">
                  <PlayerCard
                    image={playerImage}
                    name={player.name}
                    role={player.role}
                    country={player.country}
                    bat={player.battingStyle}
                    bowl={player.bowlingStyle}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Team 2 Section */}
        <div className="bg-red-50 p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-700 mb-4">{playersData.data[1].teamName}</h2>
          <div className="space-y-4">
            {playersData.data[1].players.map((player) => {
              const playerImage = player.playerImg === "https://h.cricapi.com/img/icon512.png"
                ? defaultImage
                : player.playerImg;

              return (
                <div key={player.id} className="w-full">
                  <PlayerCard
                    image={playerImage}
                    name={player.name}
                    role={player.role}
                    country={player.country}
                    bat={player.battingStyle}
                    bowl={player.bowlingStyle}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Team;
