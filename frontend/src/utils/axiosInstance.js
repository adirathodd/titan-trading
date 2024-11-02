// src/utils/axiosInstance.js

import axios from 'axios';
import useAuth from '../hooks/useAuth';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/',
});

axiosInstance.interceptors.request.use(
  config => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export default axiosInstance;