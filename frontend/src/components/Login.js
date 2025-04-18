import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function Login() {
  const location = useLocation();
  const { message } = location.state || {};
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState(''); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { auth, login } = useAuth();

  if (auth.isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await axios.post('https://stale-goldi-titan-trading-bcb085f8.koyeb.app/api/login/', formData);
      const { access, refresh, username, cash } = response.data;
      login(access, refresh, username, cash );
      navigate('/');
    } catch (error) {
      if (error.response && error.response.data) {
        setError(error.response.data.detail || 'Invalid username or password.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md items-center justify-center mx-auto mt-52 p-6 bg-gray-800 shadow-md rounded">
      {/* Message */}
      {message && (
      <div className="p-4 mb-5 mt-5 text-gray-700 bg-green-100 rounded">
        {message}
      </div>
      )}

      <h2 className="text-2xl font-bold mb-6 mt-4 text-center text-white">Login</h2>
      <form onSubmit={handleSubmit} className="flex flex-col">
        {/* Username Field */}
        <label htmlFor="username" className="mb-2 font-semibold text-white">Username</label>
        <input
          type="text"
          name="username"
          id="username"
          placeholder="Username"
          onChange={handleChange}
          value={formData.username}
          required
          className="px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Password Field */}
        <label htmlFor="password" className="mb-2 font-semibold text-white">Password</label>
        <input
          type="password"
          name="password"
          id="password"
          placeholder="Password"
          onChange={handleChange}
          value={formData.password}
          required
          className="px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded mb-2 *:focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Error Message */}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 mt-5 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default Login;