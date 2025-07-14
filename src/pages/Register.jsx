import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { authAPI } from '../api';
import { showToast } from '../utils/toast';
import styles from './AuthBackground.module.css';

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
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
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少3个字符';
    }
    
    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6个字符';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onFinish = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await authAPI.register(formData.username, formData.password);
      
      // 显示成功消息，1.5秒后自动跳转
      showToast(setToast, '注册成功，请登录', 'success');
      
      // 立即跳转
      navigate('/login');
    } catch (error) {
      let errorMessage = '注册失败';
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

  const features = [
    'AI智能面试官',
    '实时语音对话',
    '个性化反馈',
    '面试技巧指导'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ position: 'relative', zIndex: 1, height: '100vh', overflow: 'auto' }}>
      <motion.div
        className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8"
        style={{ padding: '40px 0' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 左侧：功能介绍 */}
        <motion.div
          className="hidden lg:flex flex-col justify-center"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="space-y-6">
            <div>
              <h1 className={"text-5xl font-bold mb-4 text-center " + styles.gradientTitle}>
                开始您的面试之旅
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed text-center">
                加入我们的智能面试系统，体验前所未有的面试训练方式
              </p>
            </div>
            {/* 横向分布的功能点，间距加大 */}
            <div className="flex justify-center items-center mt-8" style={{ gap: '64px' }}>
              {features.map((feature, index) => (
                <div key={feature} className="flex flex-col items-center">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-gray-700 font-medium text-base whitespace-nowrap">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        {/* 右侧：注册表单 */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible" exit={{ opacity: 0, x: 40, transition: { duration: 0.4 } }}>
          <Card className={styles.loginCardBeautify + " p-8"} variant="glass" style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  创建账户
                </h2>
                <p className="text-gray-600">
                  开始您的智能面试体验
                </p>
              </div>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="用户名"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  error={errors.username}
                  iconLeft={<User className="text-slate-400 w-5 h-5" />}
                  onKeyPress={(e) => e.key === 'Enter' && onFinish()}
                  style={{ width: '100%' }}
                />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="密码"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  error={errors.password}
                  iconLeft={<Lock className="text-slate-400 w-5 h-5" />}
                  onKeyPress={(e) => e.key === 'Enter' && onFinish()}
                  style={{ width: '100%' }}
                />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="确认密码"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  error={errors.confirmPassword}
                  iconLeft={<Lock className="text-slate-400 w-5 h-5" />}
                  onKeyPress={(e) => e.key === 'Enter' && onFinish()}
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
                {loading ? '注册中...' : '注册'}
              </Button>
              <div className="text-center">
                <p style={{ color: '#a18aff' }}>
                  已有账号？{' '}
                  <Link 
                    to="/login" 
                    style={{ color: '#f7b0e3', fontWeight: 500 }}
                  >
                    立即登录
                  </Link>
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
      <Toast toast={toast} setToast={setToast} />
    </div>
  );
};

export default Register; 