import React, { useState } from 'react';
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
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
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            模拟面试系统
          </h1>
          <p className="text-slate-600 text-lg">
            智能面试，助您成功
          </p>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible">
          <Card className="p-8">
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                  欢迎回来
                </h2>
                <p className="text-slate-600">
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
                style={{ 
                  width: '100%',
                  height: '48px',
                  borderRadius: '12px',
                  fontSize: '16px'
                }}
                icon={!loading && <ArrowRight style={{ fontSize: '16px' }} />}
              >
                {loading ? '登录中...' : '登录'}
              </Button>

              <div className="text-center">
                <p className="text-slate-600">
                  还没有账号？{' '}
                  <Link 
                    to="/register" 
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
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
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
};

export default Login; 