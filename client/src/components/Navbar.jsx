import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Modal from 'react-modal';
import { Instagram, ExternalLink } from 'lucide-react';
import  Logo from "../assets/cricket.jpg"

Modal.setAppElement('#root');

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const userData = {
    username: "hackhorizon.ai",
    name: "Hack Horizon",
    instagramHandle: "@hackhorizon.ai",
    instagramUrl: "https://instagram.com/"
  };


  const getLinkStyle = ({ isActive }) => {
    return isActive
      ? "text-green-500"
      : "text-white hover:text-purple-500 transition-colors";
  };

  return (
    <>
      <nav className=" bg-emerald-500 text-white flex justify-between items-center p-4">
        <Link to="/home">
          <div className="text-2xl font-bold flex justify-center items-center space-x-2">
            <img src={Logo} className='w-8 h-8 m-2' />
            <span>Influence <sup className='p-[0.5px]'>IQ</sup></span>
          </div>
        </Link>
        <ul className="flex space-x-6 gap-12 text-md">
          <li><NavLink to="/" className={getLinkStyle}>Home</NavLink></li>
          <li><NavLink to="/analytics" className={getLinkStyle}>Analytics</NavLink></li>
          <li><NavLink to="/insights" className={getLinkStyle}>Insights</NavLink></li>
          <li><NavLink to="/about" className={getLinkStyle}>About</NavLink></li>
        </ul>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-white hover:bg-green-400 transition-colors px-4 py-2 rounded text-green-700 hover:text-white"
        >
          Get Started
        </button>
      </nav>

      <Modal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-80 shadow-xl"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <div className="relative">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-0 top-0 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>

          <div className="pt-4 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                {userData.username[0].toUpperCase()}
              </div>
              <h2 className="text-xl font-semibold">{userData.username}</h2>
              <p className="text-gray-600">{userData.name}</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Instagram size={20} className="text-gray-600" />
                <span className="text-gray-800">{userData.instagramHandle}</span>
              </div>
              <a
                href={userData.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-500 hover:text-purple-600"
              >
                <ExternalLink size={20} />
              </a>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Navbar;