// src/components/Welcome.js

import React from 'react';
import useAuth from '../hooks/useAuth';

function Welcome() {
  const { auth } = useAuth();
  
  return (
    <div className="max-w-lg mx-auto mt-20 p-6 bg-white dark:bg-gray-800 shadow-md rounded text-center">
      <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Welcome to the Web Application!</h2>
      <p className="text-lg text-gray-700 dark:text-gray-300">
        You have successfully logged in!<span className="font-semibold text-gray-900 dark:text-white"></span>
      </p>
    </div>
  );
}

export default Welcome;