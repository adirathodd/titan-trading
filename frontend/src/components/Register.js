import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { auth } = useAuth();

  if (auth.isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);
    try {
      const response = await axios.post('https://stale-goldi-titan-trading-bcb085f8.koyeb.app/api/register/', formData);
      navigate('/login', { state: {message: response.data.message }});
    } catch (error) {
      if (error.response && error.response.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ non_field_errors: ['An unexpected error occurred. Please try again.'] });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-800 shadow-md rounded">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Register</h2>
      <form onSubmit={handleSubmit} className="flex flex-col">
        {/* Username Field */}
        <label htmlFor="username" className="mb-2 font-semibold text-gray-700 dark:text-gray-200">Username</label>
        <input
          type="text"
          name="username"
          id="username"
          placeholder="Username"
          onChange={handleChange}
          value={formData.username}
          required
          className={`px-3 py-2 border rounded mb-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 ${errors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
        />
        {errors.username && errors.username.map((msg, index) => (
          <p key={index} className="text-red-500 text-sm mb-2">{msg}</p>
        ))}

        {/* Email Field */}
        <label htmlFor="email" className="mb-2 font-semibold text-gray-700 dark:text-gray-200">Email</label>
        <input
          type="email"
          name="email"
          id="email"
          placeholder="Email"
          onChange={handleChange}
          value={formData.email}
          required
          className={`px-3 py-2 border rounded mb-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
        />
        {errors.email && errors.email.map((msg, index) => (
          <p key={index} className="text-red-500 text-sm mb-2">{msg}</p>
        ))}

        {/* Password Field */}
        <label htmlFor="password" className="mb-2 font-semibold text-gray-700 dark:text-gray-200">Password</label>
        <input
          type="password"
          name="password"
          id="password"
          placeholder="Password"
          onChange={handleChange}
          value={formData.password}
          required
          className={`px-3 py-2 border rounded mb-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
        />
        {errors.password && errors.password.map((msg, index) => (
          <p key={index} className="text-red-500 text-sm mb-2">{msg}</p>
        ))}

        {/* Confirm Password Field */}
        <label htmlFor="password2" className="mb-2 font-semibold text-gray-700 dark:text-gray-200">Confirm Password</label>
        <input
          type="password"
          name="password2"
          id="password2"
          placeholder="Confirm Password"
          onChange={handleChange}
          value={formData.password2}
          required
          className={`px-3 py-2 border rounded mb-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 ${errors.password2 ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
        />
        {errors.password2 && errors.password2.map((msg, index) => (
          <p key={index} className="text-red-500 text-sm mb-2">{msg}</p>
        ))}

        {/* Non-field Errors */}
        {errors.non_field_errors && errors.non_field_errors.map((msg, index) => (
          <p key={index} className="text-red-500 text-sm mb-2">{msg}</p>
        ))}

        <button
          type="submit"
          className="bg-blue-500 mt-5 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}

export default Register;