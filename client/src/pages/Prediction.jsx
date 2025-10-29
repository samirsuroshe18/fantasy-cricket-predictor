import React from "react";
import PlayerFinalCard from "../components/PlayerFinalCard";

const Prediction = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
  <div
    className="flex items-center justify-center w-1/3 h-[calc(100vh-32px)] bg-[url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRh6ksDbRlmjSEjGbA6LOlwUz2k7UzKC9LMHA&s')] bg-cover bg-center py-2 p-4"
  >
    <PlayerFinalCard
      player={{
        name: 'Lionel Messi',
        role: 'Forward',
        credits: 10.5,
        image: 'https://fcb-abj-pre.s3.amazonaws.com/img/jugadors/MESSI.jpg',
      }}
    />
  </div>
</div>

  );
};

export default Prediction;
