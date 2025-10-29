import React, { useEffect, useState } from "react";
import axios from "axios";
import useApiCall from "../Context/apiCount";
import UpcomingMatch from "../components/Upcomingmatch";

function Matches() {
  const { isApiCalled, setIsApiCalled } = useApiCall();
  const [matches, setMatches] = useState([]);
  const API_KEY = import.meta.env.VITE_CRICKDATA_KEY;

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await axios.get(
          `https://api.cricapi.com/v1/cricScore?apikey=${API_KEY}`
        );

        // Log the actual data fetched from the API
        console.log("Actual data fetched:", response.data.data);

        // Get the current date and the next date
        const now = new Date();
        const currentDateString = now.toISOString().split('T')[0]; // Current date
        const nextDate = new Date(now);
        nextDate.setDate(now.getDate() + 1); // Get the next day
        const nextDateString = nextDate.toISOString().split('T')[0]; // Next date

        // Filter matches to only include T20 or ODI type matches and those that are on today's or next day's date
        const filteredMatches = response.data.data.filter((match) => {
          const matchDateTime = new Date(match.dateTimeGMT);
          const matchDateString = matchDateTime.toISOString().split('T')[0];

          // Check if match is T20 or ODI, and if it's either today or tomorrow
          return (
            (matchDateString === currentDateString || matchDateString === nextDateString) &&
            matchDateTime > now &&
            (match.matchType === "t20" || match.matchType === "odi") // Only T20 and ODI matches
          );
        });

        // Log the filtered matches
        console.log("Filtered matches:", filteredMatches);

        // Set the filtered matches to state
        setMatches(filteredMatches);
      } catch (error) {
        console.error("Error fetching matches:", error);
      }
    };

    if (!isApiCalled) {
      setIsApiCalled(true);
      fetchMatches();
    }
  }, [isApiCalled, setIsApiCalled, API_KEY]);

  return (
    <div className="container mx-auto p-4">
      {/* Render the cards for each match */}
      {matches.length > 0 ? (
        matches.map((match) => (
          <UpcomingMatch
            key={match.id}
            matchId={match.id}
            dateTimeGMT={match.dateTimeGMT}
            matchType={match.matchType}
            t1={match.t1}
            t2={match.t2}
            t1img={match.t1img}
            t2img={match.t2img}
          />
        ))
      ) : (
        <p>No upcoming matches for today.</p>
      )}
    </div>
  );
}

export default Matches;
