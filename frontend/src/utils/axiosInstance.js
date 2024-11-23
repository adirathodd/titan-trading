import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://stale-goldi-titan-trading-bcb085f8.koyeb.app/api/',
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