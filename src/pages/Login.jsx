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
import AuthBackground from './AuthBackground';
import styles from './AuthBackground.module.css';

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
    <div className="min-h-screen flex items-center justify-center" style={{ position: 'relative', zIndex: 1, overflowY: 'auto', height: '100vh' }}>
      <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', padding: '40px 0' }}>
        {/* 标题，流式布局在表单区上方 */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 className={"text-4xl font-bold mb-2 " + styles.gradientTitle}>
            模拟面试系统
          </h1>
          <p className="text-lg" style={{ color: '#888' }}>
            智能面试，助您成功
          </p>
        </div>
        {/* 表单区 */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible" exit={{ opacity: 0, x: -40, transition: { duration: 0.4 } }}>
          <Card className={styles.loginCardBeautify + " p-8"} style={{ maxWidth: 720, margin: '0 auto' }}>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2" style={{ color: '#1e293b' }}>
                欢迎回来
              </h2>
              <p style={{ color: '#64748b' }}>
                请登录您的账户
              </p>
            </div>
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="用户名"
                value={formData.username}
                onChange={e => handleInputChange('username', e.target.value)}
                error={errors.username}
                iconLeft={<User className="text-slate-400 w-5 h-5" />}
                onKeyPress={e => e.key === 'Enter' && onFinish()}
                style={{ width: '100%' }}
              />
              <Input
                type="password"
                placeholder="密码"
                value={formData.password}
                onChange={e => handleInputChange('password', e.target.value)}
                error={errors.password}
                iconLeft={<Lock className="text-slate-400 w-5 h-5" />}
                onKeyPress={e => e.key === 'Enter' && onFinish()}
                style={{ width: '100%' }}
              />
            </div>
            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={onFinish}
              className={styles.loginGradientBtn}
              style={{ width: '100%', height: '48px', borderRadius: '16px', fontSize: '16px', marginTop: '32px' }}
              icon={!loading && <ArrowRight style={{ fontSize: '16px' }} />}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
            <div className="text-center mt-4">
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
          </Card>
        </motion.div>
        <Toast toast={toast} setToast={setToast} />
      </div>
    </div>
  );
};

export default Login; 