import React from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

function UpcomingMatch({
  dateTimeGMT,
  matchType,
  t1,
  t2,
  t1img,
  t2img,
  matchId,
}) {
  const navigate = useNavigate();

  const startTime = new Date(dateTimeGMT);
  const currentTime = new Date();
  const timeDifference = Math.max(0, startTime - currentTime); // In milliseconds
  const hours = Math.floor(timeDifference / (1000 * 60 * 60));
  const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

  const obj={matchId,matchType};

  return (
    <div className="max-w-xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 my-4">
      <div className="flex items-center justify-between p-6 bg-gray-100 rounded-t-lg">
        <div className="flex items-center space-x-4">
          <img
            src={t1img}
            alt={t1}
            className="w-16 h-16 rounded-full border-2 border-gray-300"
          />
          <span className="text-xl font-semibold text-gray-700">{t1}</span>
        </div>
        <div className="text-center">
          <span className="text-gray-500 text-sm block">Starts in</span>
          <span className="text-gray-800 text-xl font-bold">
            {hours}h {minutes}m
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xl font-semibold text-gray-700">{t2}</span>
          <img
            src={t2img}
            alt={t2}
            className="w-16 h-16 rounded-full border-2 border-gray-300"
          />
        </div>
      </div>
      <div className="p-6 bg-white">
        <div className="flex items-center justify-between text-gray-500 space-x-4">
          <button className="text-xs font-medium text-gray-700 hover:text-blue-500 flex items-center space-x-1">
            <i className="fas fa-info-circle"></i>
            <span>{matchType}</span>
          </button>
          <Link to={`/team/${obj.matchId}/${obj.matchType}`}>
            <button className="bg-blue-500 text-white text-xs px-4 py-2 rounded-md hover:bg-blue-600">
              Create Team
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default UpcomingMatch;

// import React from 'react'

// function UpcomingMatch({ dateTimeGMT, matchType, t1, t2, t1img, t2img }) {
//   const startTime = new Date(dateTimeGMT);
//   const currentTime = new Date();
//   const timeDifference = Math.max(0, startTime - currentTime); // In milliseconds
//   const hours = Math.floor(timeDifference / (1000 * 60 * 60));
//   const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

//   return (
//     <div className="max-w-xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 my-4">
//       <div className="flex items-center justify-between p-6 bg-gray-100 rounded-t-lg">
//         <div className="flex items-center space-x-4">
//           <img
//             src={t1img}
//             alt={t1}
//             className="w-16 h-16 rounded-full border-2 border-gray-300"
//           />
//           <span className="text-xl font-semibold text-gray-700">{t1}</span>
//         </div>
//         <div className="text-center">
//           <span className="text-gray-500 text-sm block">Starts in</span>
//           <span className="text-gray-800 text-xl font-bold">
//             {hours}h {minutes}m
//           </span>
//         </div>
//         <div className="flex items-center space-x-4">
//           <span className="text-xl font-semibold text-gray-700">{t2}</span>
//           <img
//             src={t2img}
//             alt={t2}
//             className="w-16 h-16 rounded-full border-2 border-gray-300"
//           />
//         </div>
//       </div>
//       <div className="p-6 bg-white">
//         <div className="flex items-center justify-between text-gray-500 space-x-4">
//           <button className="text-xs font-medium text-gray-700 hover:text-blue-500 flex items-center space-x-1">
//             <i className="fas fa-info-circle"></i>
//             <span>{matchType}</span>
//           </button>
//           <button className="text-xs font-medium text-gray-700 hover:text-blue-500 flex items-center space-x-1">
//             <i className="fas fa-users"></i>
//             <span>My Teams</span>
//           </button>
//           <button className="bg-blue-500 text-white text-xs px-4 py-2 rounded-md hover:bg-blue-600">
//             Create Team
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default UpcomingMatch;
