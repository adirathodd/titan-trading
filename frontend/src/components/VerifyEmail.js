import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../hooks/useAuth';
import '../index.css';

function VerifyEmail() {
  const { uidb64, token } = useParams();
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`https://titanapi.onrender.com/api/verify/${uidb64}/${token}/`);
        setMessage(response.data.message);

        // Store the tokens
        const { access, refresh } = response.data;
        login(access, refresh);

        // Redirect to welcome page after a short delay
        setTimeout(() => {
          navigate('/welcome');
        }, 2000); // 2-second delay to show the success message
      } catch (error) {
        setMessage(error.response?.data?.error || 'Verification failed.');
      }
    };
    verifyEmail();
  }, [uidb64, token, navigate, login]);

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow-md rounded text-center">
      <h2 className="text-2xl font-bold mb-4">Email Verification</h2>
      <p className={`text-lg ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
        {message}
      </p>
      {message.includes('successfully') && <p className="mt-2">Redirecting to welcome page...</p>}
    </div>
  );
}

export default VerifyEmail;