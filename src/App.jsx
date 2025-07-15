import React, { useRef, useEffect, useContext, useState } from "react";
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
import AuthBackground from './pages/AuthBackground';
import { isAuthenticated } from './utils/auth';
import WAVES from "vanta/dist/vanta.waves.min";
import * as THREE from "three";
import Particles from "react-tsparticles";
import bgEffectConfig from './config/bgEffect';

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

// 全局泡泡主题色 context
export const BgEffectContext = React.createContext({ setThemeColor: () => {}, resetColors: () => {} });

// 在 App 组件外部定义
const bubblesRef = React.createRef();
const prevColorRef = React.createRef();

// 背景动效组件
const BgEffect = React.memo(({ mainColor, animStart, animating, setAnimating, setAnimStart, prevColorRef, bubblesRef }) => {
  const MAIN_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
  const BUBBLE_NUM = 36;
  const canvasRef = useRef(null);
  const transitionDuration = 600; // ms
  const transitionProgressRef = useRef(1); // 0~1
  const animationFrameRef = useRef();
  const lastTransitionTimeRef = useRef();

  function genBubble(idx) {
    const r = 60 + Math.random() * 80;
    const originalColor = MAIN_COLORS[idx % MAIN_COLORS.length];
    const alpha = 0.16 + Math.random() * 0.12;
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r,
      originalColor,
      themeColor: null,
      color: originalColor,
      dx: (Math.random() - 0.5) * 0.2,
      dy: -0.1 - Math.random() * 0.15,
      alpha: alpha,
      phase: Math.random() * Math.PI * 2,
      fromColor: originalColor,
      toColor: originalColor
    };
  }

  // 切换主题色时，给每个泡泡设置 fromColor/toColor，并重置动画
  useEffect(() => {
    if (!bubblesRef.current || bubblesRef.current.length === 0) return;
    if (mainColor) {
      bubblesRef.current.forEach(b => {
        b.fromColor = b.color;
        b.toColor = mainColor;
      });
    } else {
      bubblesRef.current.forEach(b => {
        b.fromColor = b.color;
        b.toColor = b.originalColor;
      });
    }
    transitionProgressRef.current = 0;
    lastTransitionTimeRef.current = performance.now();
    // 不要在这里 requestAnimationFrame(draw)
  }, [mainColor]);

  // draw 只初始化一次，持续 requestAnimationFrame
  useEffect(() => {
    if (!canvasRef.current) return;
    let dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth, height = window.innerHeight;
    const canvas = canvasRef.current;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let running = true;
    if (!bubblesRef.current || bubblesRef.current.length === 0) {
      bubblesRef.current = Array.from({ length: 36 }, (_, i) => genBubble(i));
    }
    function draw(now) {
      ctx.clearRect(0, 0, width, height);
      let bubbles = bubblesRef.current;
      // 动画进度
      if (transitionProgressRef.current < 1) {
        const last = lastTransitionTimeRef.current || now;
        const elapsed = now - last;
        let progress = Math.min(transitionProgressRef.current + elapsed / transitionDuration, 1);
        transitionProgressRef.current = progress;
        lastTransitionTimeRef.current = now;
      }
      for (let i = 0; i < bubbles.length; i++) {
        let b = bubbles[i];
        let drawColor;
        if (b.fromColor && b.toColor && transitionProgressRef.current < 1) {
          drawColor = lerpColor(b.fromColor, b.toColor, transitionProgressRef.current);
          b.color = drawColor;
        } else if (mainColor) {
          drawColor = mainColor;
          b.color = drawColor;
        } else {
          drawColor = b.originalColor;
          b.color = drawColor;
        }
        b.themeColor = mainColor || null;
        b.x += b.dx + Math.sin(Date.now() / 2000 + b.phase) * 0.08;
        b.y += b.dy;
        let floatY = b.y + Math.sin((Date.now() / 1200) + b.phase) * 18;
        let floatX = b.x + Math.sin((Date.now() / 2000) + b.phase) * 12;
        ctx.save();
        ctx.globalAlpha = b.alpha;
        ctx.beginPath();
        ctx.arc(floatX, floatY, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color + '40';
        ctx.shadowBlur = 24;
        ctx.fill();
        ctx.restore();
        if (b.y + b.r < 0) Object.assign(b, genBubble(i), { y: height + b.r });
        if (b.x - b.r > width) b.x = -b.r;
        if (b.x + b.r < 0) b.x = width + b.r;
      }
      // 动画结束后锁定颜色并清空 fromColor/toColor
      if (transitionProgressRef.current >= 1) {
        for (let i = 0; i < bubbles.length; i++) {
          let b = bubbles[i];
          b.color = b.toColor;
          b.fromColor = null;
          b.toColor = null;
        }
      }
      if (running) {
        animationFrameRef.current = requestAnimationFrame(draw);
      }
    }
    animationFrameRef.current = requestAnimationFrame(draw);
    function handleResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
    }
    window.addEventListener('resize', handleResize);
    return () => {
      running = false;
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mainColor]);
  // 颜色插值
  function lerpColor(a, b, t) {
    function parseColor(str) {
      if (str.startsWith('rgb')) {
        // rgb(x, y, z)
        const arr = str.match(/\d+/g).map(Number);
        return arr.length === 3 ? arr : [0,0,0];
      } else {
        // #rrggbb
        str = str.replace('#', '');
        if (str.length === 3) str = str.split('').map(x => x + x).join('');
        const num = parseInt(str, 16);
        return [num >> 16, (num >> 8) & 0xff, num & 0xff];
      }
    }
    const [r1, g1, b1] = parseColor(a);
    const [r2, g2, b2] = parseColor(b);
    return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
  }
  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none', background: 'transparent' }} />;
});

const AppContent = () => {
  const location = useLocation();
  const glassRoutes = ["/interview-types", "/interview"];
  const isGlass = glassRoutes.some(route => location.pathname.startsWith(route));
  const mainClass = isGlass ? "main-glass-bg" : "main-glass-bg-none";
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  return (
    <div className={mainClass} style={{ minHeight: '100vh' }}>
      {isAuthPage ? (
        <AuthBackground>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </AuthBackground>
      ) : (
        <Routes>
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
      )}
    </div>
  );
};

const App = () => {
  // 统一管理动画主色和动画状态
  const [mainColor, setMainColor] = useState(null);
  const [animStart, setAnimStart] = useState(0);
  const [animating, setAnimating] = useState(false);
  // context方法
  const setThemeColor = (color) => {
    if (bubblesRef.current && bubblesRef.current.length > 0) {
      prevColorRef.current = bubblesRef.current.map(b => b.themeColor || b.originalColor);
    } else {
      prevColorRef.current = null;
    }
    setMainColor(color);
    setAnimStart(Date.now());
    setAnimating(true);
  };
  const resetColors = () => {
    if (bubblesRef.current && bubblesRef.current.length > 0) {
      prevColorRef.current = bubblesRef.current.map(b => b.themeColor || b.originalColor);
    } else {
      prevColorRef.current = null;
    }
    setMainColor(null);
    setAnimStart(Date.now());
    setAnimating(true);
  };
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
      <BgEffectContext.Provider value={{ setThemeColor, resetColors }}>
        <BgEffect mainColor={mainColor} animStart={animStart} animating={animating} setAnimating={setAnimating} setAnimStart={setAnimStart} prevColorRef={prevColorRef} bubblesRef={bubblesRef} />
        <Router>
          <AppContent />
        </Router>
      </BgEffectContext.Provider>
    </ConfigProvider>
  );
};

export default App; 