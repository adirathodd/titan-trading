// Example: src/components/Navbar.js

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
      <h2 className="text-xl font-bold">Titan</h2>
      <div>
        {!auth.isAuthenticated ? (
          <>
            <Link to="/login" className="mr-4 text-gray-300 hover:text-white">Login</Link>
            <Link to="/register" className="text-gray-300 hover:text-white">Register</Link>
          </>
        ) : (
          <>
            <Link to="/" className="mr-4 text-gray-300 hover:text-white">Home</Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded"
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;