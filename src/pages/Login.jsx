import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { authAPI } from '../api';
import { setToken } from '../utils/auth';
import { showToast } from '../utils/toast';
import styles from './LoginBeautify.module.css';
import { v4 as uuidv4 } from 'uuid';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const squareConfigs = [
    { left: '12%', width: 160, height: 160, duration: 7.5 },
    { right: '10%', width: 120, height: 120, duration: 10.1 },
    { left: '55%', width: 200, height: 200, duration: 8.2 }
  ];
  const [pageHeight, setPageHeight] = useState(window.innerHeight);
  const [squares, setSquares] = useState([null, null, null]);

  useEffect(() => {
    const handleResize = () => setPageHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 动态生成正方形
  useEffect(() => {
    let timers = [];
    function spawnSquare(cfgIdx) {
      const cfg = squareConfigs[cfgIdx];
      const travel = pageHeight * 0.8 + cfg.height;
      const id = uuidv4();
      setSquares(sqs => {
        const newSqs = [...sqs];
        newSqs[cfgIdx] = {
          id,
          ...cfg,
          travel,
          duration: cfg.duration,
          born: Date.now(),
          cfgIdx
        };
        return newSqs;
      });
      timers[cfgIdx] = setTimeout(() => {
        setSquares(sqs => {
          const newSqs = [...sqs];
          newSqs[cfgIdx] = null;
          return newSqs;
        });
        spawnSquare(cfgIdx);
      }, cfg.duration * 1000);
    }
    // 初始化每个轨道都生成一个正方形
    squareConfigs.forEach((cfg, idx) => spawnSquare(idx));
    return () => timers.forEach(t => clearTimeout(t));
  }, [pageHeight]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名';
    }
    if (!formData.password) {
      newErrors.password = '请输入密码';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onFinish = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await authAPI.login(formData.username, formData.password);
      setToken(response.data.token);
      
      // 显示成功消息，1.5秒后自动跳转
      showToast(setToast, '登录成功', 'success');
      
      // 立即跳转
      navigate('/interview-types');
    } catch (error) {
      let errorMessage = '登录失败';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      showToast(setToast, errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.5, delay: 0.2 }
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* 美化背景和动态元素 */}
      <div className={styles.loginBeautifyBg}>
        {/* 圆形泡泡，分配不同颜色渐变动画和时长/延迟 */}
        <div className={`${styles.floatingCircle} ${styles.deep}`} style={{ width: 80, height: 80, left: '2%', top: '12%', animationDelay: '0.8s', animationDuration: '7s', animationName: `${styles.floatCircleSin}, circleColorFade1` }} />
        <div className={`${styles.floatingCircle} ${styles.pink}`} style={{ width: 120, height: 120, right: '4%', top: '18%', animationDelay: '1.5s', animationDuration: '9s', animationName: `${styles.floatCircleSin}, circleColorFade2` }} />
        <div className={`${styles.floatingCircle} ${styles.purple}`} style={{ width: 100, height: 100, left: '70%', bottom: '10%', animationDelay: '2.2s', animationDuration: '8s', animationName: `${styles.floatCircleSin}, circleColorFade3` }} />
        <div className={`${styles.floatingCircle} ${styles.purple}`} style={{ width: 18, height: 18, left: '80%', top: '8%', animationDelay: '1.2s', animationDuration: '6s', animationName: `${styles.floatCircleSin}, circleColorFade2` }} />
        <div className={`${styles.floatingCircle} ${styles.pink}`} style={{ width: 24, height: 24, left: '30%', bottom: '12%', animationDelay: '2.1s', animationDuration: '5s', animationName: `${styles.floatCircleSin}, circleColorFade1` }} />
        <div className={`${styles.floatingCircle} ${styles.purple}`} style={{ width: 16, height: 16, right: '18%', bottom: '20%', animationDelay: '0.7s', animationDuration: '7s', animationName: `${styles.floatCircleSin}, circleColorFade3` }} />
        <div className={`${styles.floatingCircle} ${styles.deep}`} style={{ width: 32, height: 32, left: '60%', top: '5%', animationDelay: '2.5s', animationDuration: '8s', animationName: `${styles.floatCircleSin}, circleColorFade2` }} />
        <div className={`${styles.floatingCircle} ${styles.pink}`} style={{ width: 36, height: 36, right: '10%', top: '40%', animationDelay: '3.2s', animationDuration: '6s', animationName: `${styles.floatCircleSin}, circleColorFade1` }} />
        <div className={`${styles.floatingCircle} ${styles.deep}`} style={{ width: 48, height: 48, left: '5%', top: '28%', animationDelay: '0.5s', animationDuration: '7s', animationName: `${styles.floatCircleSin}, circleColorFade3` }} />
        <div className={`${styles.floatingCircle} ${styles.purple}`} style={{ width: 22, height: 22, left: '80%', bottom: '8%', animationDelay: '1.7s', animationDuration: '5s', animationName: `${styles.floatCircleSin}, circleColorFade2` }} />
        <div className={`${styles.floatingCircle} ${styles.deep}`} style={{ width: 28, height: 28, right: '20%', top: '22%', animationDelay: '2.9s', animationDuration: '8s', animationName: `${styles.floatCircleSin}, circleColorFade1` }} />
        {/* 动态正方形（每轨道只存在一个） */}
        {squares.filter(Boolean).map(sq => (
          <div
            key={sq.id}
            className={styles.squareAnimWrap}
            style={{ left: sq.left, right: sq.right, bottom: 0, width: sq.width, height: sq.height }}
          >
            <div
              className={styles.squareAnim}
              style={{
                width: sq.width,
                height: sq.height,
                animationDuration: `${sq.duration}s`,
                '--square-travel': `${sq.travel}px`
              }}
            />
          </div>
        ))}
      </div>
      {/* 登录内容区域 */}
      <div className="min-h-screen flex items-center justify-center p-4" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          className="relative z-10 w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h1 className={styles.gradientTitle + " text-4xl font-bold mb-2"}>
              模拟面试系统
            </h1>
            <p className="text-lg" style={{ color: '#888' }}>
              智能面试，助您成功
            </p>
          </motion.div>

          <motion.div variants={cardVariants} initial="hidden" animate="visible">
            <Card className={styles.loginCardBeautify + " p-8"} style={{ maxWidth: '680px', margin: '0 auto' }}>
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold mb-2" style={{ color: '#a18aff' }}>
                    欢迎回来
                  </h2>
                  <p style={{ color: '#b48be6' }}>
                    请登录您的账户
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="用户名"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      error={errors.username}
                      className="pl-10"
                      onKeyPress={(e) => e.key === 'Enter' && onFinish()}
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="密码"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      error={errors.password}
                      className="pl-10 pr-10"
                      onKeyPress={(e) => e.key === 'Enter' && onFinish()}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="primary"
                  size="large"
                  loading={loading}
                  onClick={onFinish}
                  className={styles.loginGradientBtn}
                  style={{ width: '100%', height: '48px', borderRadius: '16px', fontSize: '16px', marginTop: '8px' }}
                  icon={!loading && <ArrowRight style={{ fontSize: '16px' }} />}
                >
                  {loading ? '登录中...' : '登录'}
                </Button>

                <div className="text-center">
                  <p style={{ color: '#a18aff' }}>
                    还没有账号？{' '}
                    <Link 
                      to="/register" 
                      style={{ color: '#f7b0e3', fontWeight: 500 }}
                    >
                      立即注册
                    </Link>
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* 底部装饰 */}
          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <p className="text-slate-500 text-sm">
              © 2025 模拟面试系统. 让面试更简单
            </p>
          </motion.div>
        </motion.div>
      </div>
      {/* Toast 保持原有逻辑 */}
      <Toast toast={toast} setToast={setToast} />
    </div>
  );
};

export default Login; 