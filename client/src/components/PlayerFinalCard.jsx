import React from 'react';


const PlayerFinalCard = ({ player }) => {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden w-32">
      <div className="bg-gray-200 h-24 flex items-center justify-center">
        <img src={player.image} alt={player.name} className="h-20 w-20" />
      </div>
      <div className="p-2">
        <h3 className="font-bold text-gray-800 truncate justify-center flex items-center">{player.name}</h3>
        <p className="text-gray-600 text-sm justify-center flex items-center">{player.role}</p>
      </div>
    </div>
  );
};

export default PlayerFinalCard;

