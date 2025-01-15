import React from "react";
import Progress from "../components/ui/progress"

const Dashboard = () => {
  return (
    <div className="font-sans bg-gray-50 min-h-screen">
      <header className="bg-emerald-500 text-white py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Fantasy Cricket Dashboard</h1>
          <button className="bg-white text-emerald-500 font-semibold py-2 px-4 rounded hover:bg-gray-100">
            Logout
          </button>
        </div>
      </header>

      <main className="py-10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold mb-6">Upcoming Matches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Match Card */}
            {["Team A vs Team B", "Team C vs Team D", "Team E vs Team F"].map(
              (match, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded shadow flex-col justify-between items-center"
                >
                  <div>
                    <h3 className="text-xl font-bold mb-2">{match}</h3>
                    <div className="w-full bg-gray-200 rounded-full h-4 relative">
                      <Progress value={33} />

                    </div>
                    <span className="text-sm text-gray-600 mt-2 inline-block">
                      {Math.floor(Math.random() * 50) + 50}% - {
                        100 - (Math.floor(Math.random() * 50) + 50)
                      }%
                    </span>
                  </div>
                  <button className="bg-emerald-500 text-white font-semibold py-2 px-4 rounded hover:bg-emerald-600">
                    Predict with AI
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </main>

      <footer className="text-center py-6 bg-gray-900 text-gray-400">
        <p>&copy; 2025 Fantasy Cricket Predictor. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default Dashboard;
