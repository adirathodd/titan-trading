// src/components/VerifyEmail.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function VerifyEmail() {
  const { uidb64, token } = useParams();
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/verify/${uidb64}/${token}/`);
        setMessage(response.data.message);

        const { access, refresh } = response.data;
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;

        setTimeout(() => {
          navigate('/');
        }, 2500);
      } catch (error) {
        setMessage(error.response?.data?.error || 'Verification failed.');
      }
    };
    verifyEmail();
  }, [uidb64, token, navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Email Verification</h2>
      <p>{message}</p>
      {message === 'Email verified successfully.' && <p>Redirecting to login page...</p>}
    </div>
  );
}

export default VerifyEmail;