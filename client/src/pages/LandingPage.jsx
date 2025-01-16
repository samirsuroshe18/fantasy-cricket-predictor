import React from "react";
import Navbar from "../components/navbar";
import { Link } from "react-router";

const LandingPage = () => {
  return (
    <>
    <Navbar/>
    <div className="font-sans bg-gray-50">
      {/* Hero Section */}
      <section className="hero text-center py-20 bg-gradient-to-r from-green-400 to-cyan-400 text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold">Winning Fantasy Cricket Team Predictor</h1>
          <p className="mt-4 text-lg">
            Leverage AI to craft your ultimate fantasy cricket team with data-driven
            predictions.
          </p>
          <Link to="/matches">
          <button className="bg-emerald-500 text-white font-semibold py-2 px-4 rounded hover:bg-emerald-600 mt-6"
          >
            Get Started
          </button></Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="features py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-semibold">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            <div className="feature text-center">
              <img
                src="https://via.placeholder.com/80"
                alt="AI Analysis"
                className="mx-auto mb-4"
              />
              <h4 className="text-xl font-medium">AI-Powered Predictions</h4>
              <p>
                Analyze player performance and match conditions to build your dream
                team.
              </p>
            </div>
            <div className="feature text-center">
              <img
                src="https://via.placeholder.com/80"
                alt="Real-time Data"
                className="mx-auto mb-4"
              />
              <h4 className="text-xl font-medium">Real-Time Data</h4>
              <p>Access the latest player statistics and updates to stay ahead.</p>
            </div>
            <div className="feature text-center">
              <img
                src="https://via.placeholder.com/80"
                alt="User Friendly"
                className="mx-auto mb-4"
              />
              <h4 className="text-xl font-medium">User-Friendly Interface</h4>
              <p>Navigate effortlessly through our intuitive and sleek platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="workflow bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-semibold">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            <div className="workflow-step text-center">
              <h4 className="text-xl font-medium">Step 1</h4>
              <p>Enter match details and desired team parameters.</p>
            </div>
            <div className="workflow-step text-center">
              <h4 className="text-xl font-medium">Step 2</h4>
              <p>Let the AI analyze data and predict the best players.</p>
            </div>
            <div className="workflow-step text-center">
              <h4 className="text-xl font-medium">Step 3</h4>
              <p>View your winning team and optimize your strategy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta text-center py-16 bg-emerald-500 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold">Ready to Build Your Winning Team?</h2>
          <button className="bg-white text-emerald-500 font-semibold py-2 px-4 rounded hover:bg-gray-200 mt-6">
            Start Predicting
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 bg-gray-900 text-gray-400">
        <p>&copy; 2025 Fantasy Cricket Predictor. All Rights Reserved.</p>
      </footer>
    </div>
    </>
  );
};

export default LandingPage;

