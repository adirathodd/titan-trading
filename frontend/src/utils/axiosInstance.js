import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://titanapi.onrender.com/api/',
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