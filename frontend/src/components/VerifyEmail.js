import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/solid';
import '../index.css';

function VerifyEmail() {
  const { uidb64, token } = useParams();
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/verify/${uidb64}/${token}/`);
        setMessage(response.data.message);
        setTimeout(() => {
          navigate('/login');
        }, 3500);
      } catch (error) {
        setMessage(error.response?.data?.error || 'Verification failed.');
      }
    };
    verifyEmail();
  }, [uidb64, token, navigate]);

  const isSuccess = message.toLowerCase().includes('successfully');

  return (
    <div className="min-h-screen bg-gradient-to-r flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        {isSuccess ? (
          <CheckCircleIcon className="mx-auto h-20 w-20 text-green-500" />
        ) : (
          <XCircleIcon className="mx-auto h-20 w-20 text-red-500" />
        )}
        <h2 className="mt-4 text-2xl font-semibold text-gray-800 dark:text-gray-100">Email Verification</h2>
        <p className={`mt-2 text-lg ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
        {isSuccess && (
          <p className="mt-4 text-gray-600 dark:text-gray-300">Redirecting to login page...</p>
        )}
        {!isSuccess && (
          <button
            onClick={() => navigate('/login')}
            className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition duration-300"
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;