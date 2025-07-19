import axios from 'axios';
import { getToken, removeToken } from '../utils/auth';

const API_BASE_URL = 'http://localhost:8080/api';

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 请求拦截器 - 添加 token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理 token 过期
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关接口
export const authAPI = {
  register: (username, password) =>
    api.post('/auth/register', { username, password }),
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
};

// 面试相关接口
export const interviewAPI = {
  // 获取面试类型列表
  getInterviewTypes: () => api.get('/interview/types'),
  
  // 获取面试信息（不创建记录）
  getInterviewInfo: (type) => api.get(`/interview/info/${type}`),
  
  // 开始指定类型的面试（返回recordId）
  startInterview: (type) => api.post(`/interview/start/${type}`),
  
  // 结束面试（传recordId）
  endInterview: (recordId, actualDuration) => {
    const params = new URLSearchParams();
    if (actualDuration !== undefined && actualDuration !== null) {
      params.append('actualDuration', actualDuration);
    }
    return api.post(`/interview/end/${recordId}?${params.toString()}`);
  },
  
  // 上传面试视频
  uploadVideo: (recordId, videoFile) => {
    const formData = new FormData();
    formData.append('video', videoFile);
    return api.post(`/interview/upload-video/${recordId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // 获取历史记录
  getHistory: () => api.get('/interview/history'),
  
  // 获取面试记录详情
  getInterviewRecord: (recordId) => api.get(`/interview/record/${recordId}`),
  
  // 提交文字答案（保留兼容性）
  submitAnswer: (question, answer) =>
    api.post('/interview/answer', { question, answer }),
  
  // 提交音频答案（保留兼容性）
  submitAudioAnswer: (question, audioFile) => {
    const formData = new FormData();
    formData.append('question', question);
    formData.append('audio', audioFile);
    return api.post('/interview/audio-answer', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// 导出单个函数，方便直接使用
export const getInterviewHistory = () => interviewAPI.getHistory();
export const getInterviewRecord = (recordId) => interviewAPI.getInterviewRecord(recordId);
export const getInterviewInfo = (type) => interviewAPI.getInterviewInfo(type);
export const startInterview = (type) => interviewAPI.startInterview(type);
export const endInterview = (recordId, actualDuration) => interviewAPI.endInterview(recordId, actualDuration);
export const uploadVideo = (recordId, videoFile) => interviewAPI.uploadVideo(recordId, videoFile);

export const deleteInterviewRecord = (recordId) =>
  api.delete(`/interview/delete/${recordId}`);

export default api; 