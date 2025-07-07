import React, { useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import Login from './pages/Login';
import Register from './pages/Register';
import InterviewTypes from './pages/InterviewTypes';
import History from './pages/History';
import AIReview from './pages/AIReview';
import Demo from './pages/Demo';
import Interview from './pages/Interview';
import DeviceCheck from './pages/DeviceCheck';
import { isAuthenticated } from './utils/auth';
import WAVES from "vanta/dist/vanta.waves.min";
import * as THREE from "three";
import Particles from "react-tsparticles";
import bgEffectConfig from './config/bgEffect';

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

// 背景动效组件
const BgEffect = React.memo(() => {
  const vantaRef = useRef(null);
  const { type } = bgEffectConfig;

  useEffect(() => {
    let vantaEffect;
    if (type === 'waves') {
      vantaEffect = WAVES({
        el: vantaRef.current,
        THREE: THREE,
        mouseControls: true,
        touchControls: true,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0x87CEEB,
        shininess: 50.00,
        waveHeight: 20.00,
        waveSpeed: 1.00,
        zoom: 0.85
      });
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [type]);

  if (type === 'waves') {
    return <div ref={vantaRef} style={{ position: "fixed", width: "100vw", height: "100vh", top: 0, left: 0, zIndex: -1, pointerEvents: "none" }} />;
  }
  if (type === 'particles') {
    return (
      <Particles
        options={{
          background: { color: "#0d47a1" },
          particles: {
            number: { value: 80 },
            size: { value: 3 },
            move: { speed: 1 },
            line_linked: { enable: true, color: "#fff" }
          }
        }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -1,
          pointerEvents: "none"
        }}
      />
    );
  }
  return null;
});

const AppContent = () => {
  const location = useLocation();
  // 需要毛玻璃的页面
  const glassRoutes = ["/interview-types", "/interview"]; // 可根据需要扩展
  const isGlass = glassRoutes.some(route => location.pathname.startsWith(route));
  const mainClass = isGlass ? "main-glass-bg" : "main-glass-bg-none";

  return (
    <div className={mainClass} style={{ minHeight: '100vh' }}>
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
        <Route 
          path="/device-check/:type" 
          element={
            <ProtectedRoute>
              <DeviceCheck />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/interview-types" />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <>
      <BgEffect />
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
          <AppContent />
        </Router>
      </ConfigProvider>
    </>
  );
};

export default App; 