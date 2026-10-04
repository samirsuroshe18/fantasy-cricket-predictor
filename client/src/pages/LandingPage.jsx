import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const icon = (path) => (
  <span className="mx-auto mb-4 w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  </span>
);

const FEATURES = [
  {
    title: "Predictions from real figures",
    text: "Every player is scored from career batting and bowling figures, and the best valid eleven is built from the scores.",
    icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  },
  {
    title: "Upcoming matches",
    text: "T20 and one-day matches of the coming week with their squads, and sample matches that are always there to try.",
    icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
  },
  {
    title: "Explained and saved",
    text: "The suggested team comes with a short explanation of its choices. Change it to your liking and save it to your account.",
    icon: "M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z",
  },
];

const STEPS = [
  { title: "Step 1", text: "Pick an upcoming match and look through both squads." },
  { title: "Step 2", text: "Get a suggested eleven with a captain and a vice-captain." },
  { title: "Step 3", text: "Adjust the team within the rules and save it." },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="hero text-center py-20 bg-gradient-to-r from-green-400 to-cyan-400 text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-bold">Winning Fantasy Cricket Team Predictor</h1>
          <p className="mt-4 text-lg max-w-2xl mx-auto">
            Build your fantasy cricket team for the next match from data: a score for
            every player, and the best eleven the rules allow.
          </p>
          <Link to="/matches" className="inline-block bg-emerald-500 text-white font-semibold py-2 px-4 rounded hover:bg-emerald-600 mt-6">
            Get Started
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="features py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-semibold">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="feature text-center">
                {icon(feature.icon)}
                <h3 className="text-xl font-medium">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="workflow bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-semibold">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            {STEPS.map((step) => (
              <div key={step.title} className="workflow-step text-center">
                <h3 className="text-xl font-medium">{step.title}</h3>
                <p className="mt-2 text-gray-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta text-center py-16 bg-emerald-500 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold">Ready to Build Your Winning Team?</h2>
          <Link to="/matches" className="inline-block bg-white text-emerald-500 font-semibold py-2 px-4 rounded hover:bg-gray-200 mt-6">
            Start Predicting
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
