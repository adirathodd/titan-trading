import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Input } from "@material-tailwind/react";
import axios from 'axios';

const Navbar = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  const handleLogout = () => {
    try {
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const fetchSuggestions = async (query) => {
    try {
      const response = await axios.get(`https://titanapi.onrender.com/api/tickers?query=${query}`);
      setSuggestions(response.data);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const validateTicker = async (ticker) => {
    try {
      const response = await axios.get(`https://titanapi.onrender.com/api/search/${ticker}`);
      if (response.data.stockDetails.valid) {
        navigate(`/stock/${ticker}`);
      } else {
        setError('Invalid ticker symbol.');
      }
    } catch (error) {
      console.error('Error validating ticker:', error);
      setError('Invalid ticker symbol.');
    }
  };

  const handleChange = (e) => {
    const value = e.target.value.toUpperCase();
    setSearchTerm(value);
    setError('');

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length > 0) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (ticker) => {
    setSearchTerm(ticker);
    setShowDropdown(false);
    validateTicker(ticker);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim() !== '') {
      validateTicker(searchTerm.trim());
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-gray-800 dark:bg-gray-900 text-white px-4 py-3 flex justify-between items-center">
      <h2 className="text-xl font-bold">Titan</h2>
      <div className="flex items-center space-x-4 search-container relative">
        {!auth.isAuthenticated ? (
          <>
            <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
            <Link to="/register" className="text-gray-300 hover:text-white">Register</Link>
          </>
        ) : (
          <>
            <Link to="/" className="text-gray-300 hover:text-white">Home</Link>
            <form onSubmit={handleSubmit} className="relative">
              <Input
                type="search"
                placeholder="Search Ticker"
                value={searchTerm}
                onChange={handleChange}
                className="w-[400px] bg-gray-700 h-10 text-white focus:ring-blue-500 dark:bg-gray-800 dark:text-white rounded-lg"
              />
              {showDropdown && suggestions.length > 0 && (
                <ul className="absolute top-full left-0 w-full bg-gray-700 dark:bg-gray-800 border border-gray-600 rounded-lg mt-1 max-h-60 overflow-y-auto z-10">
                  {suggestions.map((item) => (
                    <li
                      key={item.ticker}
                      onClick={() => handleSelect(item.ticker)}
                      className="px-4 py-2 hover:bg-gray-600 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      {item.ticker} - {item.company_name}
                    </li>
                  ))}
                </ul>
              )}
            </form>
            {error && <p className="text-red-500 text-sm absolute top-full mt-1">{error}</p>}
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