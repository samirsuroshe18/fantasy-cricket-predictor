import React from "react";

export default function PlayerCard({ image, name, role, country, bat, bowl }) {
  return (
    <div className="w-full bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="flex p-4 gap-4">
        {/* Profile Picture */}
        <div className="w-1/5 h-full rounded-lg overflow-hidden flex-shrink-0 justify-center items-center">
          <img
            src={image}
            alt={`${name}'s Profile`}
            className="h-[150px] w-[200px] object-cover"
          />
        </div>

        {/* Player Info */}
        <div className="flex-1">
          <div className="space-y-3">
            {/* Name */}
            <div className="flex items-center">
              <label className="text-amber-700 font-medium w-20">Name:</label>
              <span className="text-gray-800">{name}</span>
              
            </div>

            {/* Role */}
            <div className="flex items-center">
              <label className="text-amber-700 font-medium w-20">Role:</label>
              <span className="text-gray-800">{role}</span>
              
            </div>

            {/* Country */}
            <div className="flex items-center">
              <label className="text-amber-700 font-medium w-20">Country:</label>
              <span className="text-gray-800">{country}</span>
              
            </div>

            {/* Bat and Bowl */}
            <div className="flex items-center gap-6">
              {/* Bat */}
              <div className="flex items-center">
                <span className="text-amber-700 font-medium">Bat:</span>
                <span className="ml-2 text-gray-800">{bat}</span>
                
              </div>
              {/* Bowl */}
              <div className="flex items-center">
                <span className="text-amber-700 font-medium">Bowl:</span>
                <span className="ml-2 text-gray-800">{bowl}</span>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
