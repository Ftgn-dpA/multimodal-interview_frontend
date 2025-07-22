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
  
  // 结束面试（传recordId和sessionId）
  endInterview: (recordId, actualDuration, sessionId, resumeId) => {
    const params = new URLSearchParams();
    if (actualDuration !== undefined && actualDuration !== null) {
      params.append('actualDuration', actualDuration);
    }
    if (sessionId) {
      params.append('sessionId', sessionId);
    }
    if (resumeId) {
      params.append('resumeId', resumeId);
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
  
  // 获取首句提示词
  getPrompt: (scene, position) => api.get(`/interview/prompt?scene=${encodeURIComponent(scene)}&position=${encodeURIComponent(position)}`),
};

// 简历相关接口
export const resumeAPI = {
  // 获取用户简历列表
  getResumeList: () => api.get('/resume/list'),
  
  // 上传简历
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // 删除简历
  deleteResume: (id) => api.delete(`/resume/${id}`),
  
  // 下载简历
  downloadResume: (id) => api.get(`/resume/download/${id}`, {
    responseType: 'blob',
  }),
};

// 面试分析相关接口
export const analysisAPI = {
  // 执行面试分析
  analyzeInterview: (recordId, resumeId) => {
    const params = new URLSearchParams();
    if (resumeId) {
      params.append('resumeId', resumeId);
    }
    return api.post(`/interview/analyze/${recordId}?${params.toString()}`);
  },
  
  // 获取分析结果
  getAnalysisResult: (recordId) => api.get(`/interview/analysis-result/${recordId}`),

  // 获取分析进度
  getAnalysisProgress: (recordId) => api.get(`/interview/analysis-progress/${recordId}`),
};

// 虚拟人相关接口
export const avatarAPI = {
  // 启动虚拟人
  startAvatar: () => api.post('/avatar/start'),
  
  // 发送消息给虚拟人
  sendMessage: (sessionId, text, interviewRecordId) => {
    const params = new URLSearchParams();
    params.append('sessionId', sessionId);
    params.append('text', text);
    if (interviewRecordId) {
      params.append('interviewRecordId', interviewRecordId);
    }
    return api.post(`/avatar/send?${params.toString()}`);
  },
  
  // 音频交互
  audioInteract: (sessionId, audioFile, interviewRecordId) => {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('audio', audioFile);
    if (interviewRecordId) {
      formData.append('interviewRecordId', interviewRecordId);
    }
    return api.post('/avatar/audio-interact', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // 停止虚拟人
  stopAvatar: (sessionId) => api.post(`/avatar/stop?sessionId=${sessionId}`),
};

// AI回复相关接口
export const aiResponseAPI = {
  // 获取所有AI回复
  getAllResponses: () => api.get('/ai-responses/all'),
  
  // 根据面试记录ID获取AI回复
  getResponsesByInterview: (recordId) => api.get(`/ai-responses/interview/${recordId}`),
  
  // 根据会话ID获取AI回复
  getResponsesBySession: (sessionId) => api.get(`/ai-responses/session/${sessionId}`),
  
  // 根据回复类型获取AI回复
  getResponsesByType: (responseType) => api.get(`/ai-responses/type/${responseType}`),
  
  // 获取当前用户的AI回复
  getMyResponses: () => api.get('/ai-responses/my'),
  
  // 统计某个面试记录的AI回复数量
  countResponses: (recordId) => api.get(`/ai-responses/count/${recordId}`),
};

// 导出单个函数，方便直接使用
export const getInterviewHistory = () => interviewAPI.getHistory();
export const getInterviewRecord = (recordId) => interviewAPI.getInterviewRecord(recordId);
export const getInterviewInfo = (type) => interviewAPI.getInterviewInfo(type);
export const startInterview = (type) => interviewAPI.startInterview(type);
export const endInterview = (recordId, actualDuration, sessionId, resumeId) => interviewAPI.endInterview(recordId, actualDuration, sessionId, resumeId);
export const uploadVideo = (recordId, videoFile) => interviewAPI.uploadVideo(recordId, videoFile);

export const deleteInterviewRecord = (recordId) =>
  api.delete(`/interview/delete/${recordId}`);

export default api; 