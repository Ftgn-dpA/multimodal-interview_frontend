import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import Login from './pages/Login';
import Register from './pages/Register';
import InterviewTypes from './pages/InterviewTypes';
import History from './pages/History';
import AIReview from './pages/AIReview';
import Demo from './pages/Demo';
import Interview from './pages/Interview';
import { isAuthenticated } from './utils/auth';

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <ConfigProvider 
      locale={zhCN}
      message={{
        maxCount: 1,
        duration: 1.5,
        top: 100,
        rtl: false,
      }}
    >
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/demo" element={<Demo />} />
          <Route 
            path="/interview-types" 
            element={
              <ProtectedRoute>
                <InterviewTypes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/interview/:type" 
            element={
              <ProtectedRoute>
                <Interview />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ai-review/:recordId" 
            element={
              <ProtectedRoute>
                <AIReview />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/interview-types" />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App; 