import axios from 'axios';
import { getToken } from '../utils/auth';

const instance = axios.create({
  baseURL: '/api', // 统一走 CRA 代理
  timeout: 10000,
});

instance.interceptors.request.use(
  config => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }
    return config;
  },
  error => Promise.reject(error)
);

instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance; 