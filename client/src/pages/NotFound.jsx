import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-800">404 - Page Not Found</h1>
        <p className="text-gray-600 mt-3">The page you are looking for does not exist.</p>
        <Link to="/" className="btn-primary mt-6">Go back to the start</Link>
      </div>
    </div>
  );
};

export default NotFound;
