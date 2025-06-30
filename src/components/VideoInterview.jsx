import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Card, 
  Button, 
  Switch, 
  Typography, 
  Space, 
  Layout,
  Menu,
  message,
  Progress,
  Alert,
  Divider,
  Modal
} from 'antd';
import { 
  VideoCameraOutlined, 
  AudioOutlined,
  StopOutlined,
  HistoryOutlined,
  CloseOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { removeToken } from '../utils/auth';
import { motion } from 'framer-motion';
import { endInterview as endInterviewAPI, startInterview as startInterviewAPI, uploadVideo } from '../api';

const { Title, Text } = Typography;
const { Header, Content } = Layout;

// 语音波形可视化组件
const AudioWaveform = ({ isPlaying }) => {
  const bars = 20;
  const barArray = Array.from({ length: bars }, (_, i) => i);
  
  // 确保barArray是有效的数组
  if (!Array.isArray(barArray) || barArray.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '60px',
        padding: '10px'
      }}>
        <div style={{ color: '#64748b', fontSize: '12px' }}>音频波形</div>
      </div>
    );
  }
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      gap: '2px',
      height: '60px',
      padding: '10px'
    }}>
      {barArray.map((_, index) => {
        const height = isPlaying 
          ? Math.random() * 40 + 10 
          : Math.sin(index * 0.3) * 5 + 5;
        
        return (
          <motion.div
            key={index}
            style={{
              width: '3px',
              height: `${height}px`,
              backgroundColor: isPlaying ? '#3b82f6' : '#e2e8f0',
              borderRadius: '2px',
            }}
            animate={{
              height: isPlaying ? Math.random() * 40 + 10 : Math.sin(index * 0.3) * 5 + 5,
              backgroundColor: isPlaying ? '#3b82f6' : '#e2e8f0'
            }}
            transition={{ duration: 0.1 }}
          />
        );
      })}
    </div>
  );
};

// AI面试官视频占位符
const AIInterviewerVideo = ({ isSpeaking, subtitle }) => {
  return (
    <div style={{
      width: '100%',
      height: '400px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(59, 130, 246, 0.2)'
    }}>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: 'white'
      }}>
        <motion.div
          animate={{ scale: isSpeaking ? 1.1 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <VideoCameraOutlined style={{ 
            fontSize: '80px', 
            marginBottom: '20px',
            opacity: 0.9,
            color: 'white'
          }} />
        </motion.div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
          AI面试官
        </div>
        <div style={{ fontSize: '14px', opacity: 0.8 }}>
          {isSpeaking ? '正在提问...' : '等待开始'}
        </div>
      </div>
      
      {/* 语音波形 */}
      <div style={{ 
        position: 'absolute', 
        bottom: '40px', 
        left: '50%', 
        transform: 'translateX(-50%)' 
      }}>
        <AudioWaveform isPlaying={isSpeaking} />
      </div>
      
      {/* 字幕 */}
      {subtitle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            fontSize: '16px',
            maxWidth: '90%',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
        >
          {subtitle}
        </motion.div>
      )}
    </div>
  );
};

// 用户视频组件
const UserVideo = ({ stream, isRecording }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={{
      width: '100%',
      height: '250px',
      background: '#000',
      borderRadius: '16px',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc'
        }}>
          <VideoCameraOutlined style={{ 
            fontSize: '60px', 
            color: '#64748b',
            opacity: 0.8
          }} />
        </div>
      )}
      
      {/* 录制状态指示器 */}
      {isRecording && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '16px',
            height: '16px',
            backgroundColor: '#ef4444',
            borderRadius: '50%',
            boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
          }}
        />
      )}
    </div>
  );
};

// 设备检测组件
const DeviceDetector = ({ onClose }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        setDevices(deviceList);
      } catch (error) {
        console.error('设备检测失败:', error);
      } finally {
        setLoading(false);
      }
    };

    detectDevices();
  }, []);

  const videoDevices = Array.isArray(devices) ? devices.filter(device => device.kind === 'videoinput') : [];
  const audioDevices = Array.isArray(devices) ? devices.filter(device => device.kind === 'audioinput') : [];

  return (
    <Card 
      title="设备检测" 
      style={{ marginBottom: '24px', borderRadius: '12px' }}
      extra={<Button type="text" icon={<CloseOutlined />} onClick={onClose} />}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <LoadingOutlined style={{ fontSize: '24px' }} />
          <div style={{ marginTop: '8px' }}>正在检测设备...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <Title level={5}>摄像头设备 ({videoDevices.length})</Title>
            {videoDevices.length === 0 ? (
              <Alert 
                message="未检测到摄像头设备" 
                description="请安装虚拟摄像头软件如OBS Virtual Camera进行测试"
                type="warning" 
                showIcon
              />
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {videoDevices.map((device, index) => (
                  <div key={device.deviceId} style={{ 
                    padding: '8px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '6px', 
                    marginBottom: '8px',
                    background: '#f8fafc'
                  }}>
                    <div style={{ fontWeight: 'bold' }}>摄像头 {index + 1}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {device.label || `设备 ${device.deviceId.slice(0, 8)}...`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <Title level={5}>音频设备 ({audioDevices.length})</Title>
            {audioDevices.length === 0 ? (
              <Alert 
                message="未检测到音频设备" 
                description="请检查麦克风连接"
                type="warning" 
                showIcon
              />
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {audioDevices.map((device, index) => (
                  <div key={device.deviceId} style={{ 
                    padding: '8px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '6px', 
                    marginBottom: '8px',
                    background: '#f8fafc'
                  }}>
                    <div style={{ fontWeight: 'bold' }}>麦克风 {index + 1}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {device.label || `设备 ${device.deviceId.slice(0, 8)}...`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '16px', padding: '12px', background: '#f1f5f9', borderRadius: '8px' }}>
        <Text type="secondary">
          <strong>调试提示：</strong>
          <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
            <li>确保浏览器已获得摄像头和麦克风权限</li>
            <li>关闭其他可能占用摄像头的应用程序</li>
            <li>检查设备驱动是否正确安装</li>
            <li>确保摄像头和麦克风设备已正确连接</li>
          </ul>
        </Text>
      </div>
    </Card>
  );
};

const VideoInterview = () => {
  const navigate = useNavigate();
  const { type } = useParams(); // 获取面试类型参数
  
  // 状态管理
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [mediaStream, setMediaStream] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeviceDetector, setShowDeviceDetector] = useState(false);
  const [interviewRecordId, setInterviewRecordId] = useState(null); // 面试记录ID
  const [endingInterview, setEndingInterview] = useState(false); // 结束面试状态

  // 引用
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const videoRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const [videoBlob, setVideoBlob] = useState(null);

  // 获取媒体权限
  const getMediaPermissions = useCallback(async () => {
    try {
      console.log('=== 开始媒体权限检查 ===');
      
      // 1. 检查浏览器是否支持getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = '浏览器不支持getUserMedia API';
        console.error(errorMsg);
        setError(errorMsg);
        return null;
      }
      
      // 2. 检查可用的媒体设备
      console.log('正在枚举设备...');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = Array.isArray(devices) ? devices.filter(device => device.kind === 'videoinput') : [];
      const audioDevices = Array.isArray(devices) ? devices.filter(device => device.kind === 'audioinput') : [];
      
      console.log('所有设备:', devices);
      console.log('摄像头设备:', videoDevices);
      console.log('音频设备:', audioDevices);
      
      // 3. 检查设备权限状态
      const hasVideoPermission = videoDevices.some(device => device.label !== '');
      const hasAudioPermission = audioDevices.some(device => device.label !== '');
      
      console.log('摄像头权限状态:', hasVideoPermission ? '已授权' : '未授权');
      console.log('音频权限状态:', hasAudioPermission ? '已授权' : '未授权');
      
      // 4. 如果没有摄像头设备，显示详细提示
      if (videoDevices.length === 0) {
        const errorMsg = '未检测到摄像头设备。请确保：\n1. 摄像头设备已正确连接\n2. 摄像头驱动已正确安装\n3. 浏览器已刷新页面';
        console.error(errorMsg);
        message.warning('未检测到摄像头设备');
        setError(errorMsg);
        return null;
      }
      
      // 5. 尝试获取媒体流（先尝试视频+音频）
      console.log('尝试获取视频+音频流...');
      let stream;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        console.log('视频+音频流获取成功');
      } catch (videoAudioError) {
        console.log('视频+音频流获取失败，尝试仅视频:', videoAudioError);
        
        // 6. 如果视频+音频失败，尝试仅视频
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
              facingMode: 'user'
            },
            audio: false
          });
          console.log('仅视频流获取成功');
        } catch (videoOnlyError) {
          console.log('仅视频流也失败，尝试最低配置:', videoOnlyError);
          
          // 7. 尝试最低配置
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            });
            console.log('最低配置视频流获取成功');
          } catch (minimalError) {
            console.error('所有配置都失败:', minimalError);
            throw minimalError;
          }
        }
      }
      
      setMediaStream(stream);
      setAudioStream(stream);
      console.log('最终媒体流:', stream);
      console.log('媒体轨道:', stream.getTracks());
      
      return stream;
    } catch (err) {
      console.error('=== 媒体权限获取失败 ===');
      console.error('错误名称:', err.name);
      console.error('错误消息:', err.message);
      console.error('错误详情:', err);
      
      let errorMessage = '无法访问摄像头或麦克风';
      let detailedError = '';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = '摄像头权限被拒绝';
        detailedError = '请在浏览器地址栏左侧点击摄像头图标，选择"允许"访问摄像头和麦克风。\n\n如果看不到权限提示，请：\n1. 刷新页面\n2. 检查浏览器设置中的摄像头权限\n3. 确保没有其他应用占用摄像头';
      } else if (err.name === 'NotFoundError') {
        errorMessage = '未找到摄像头设备';
        detailedError = '请确保：\n1. 摄像头设备已正确连接\n2. 摄像头驱动已正确安装\n3. 重启浏览器\n4. 检查设备管理器中的摄像头状态';
      } else if (err.name === 'NotReadableError') {
        errorMessage = '摄像头被其他应用程序占用';
        detailedError = '请关闭其他使用摄像头的应用程序，包括：\n1. 其他浏览器标签页\n2. 视频会议软件\n3. 录制软件\n4. 其他可能占用摄像头的应用';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = '摄像头不满足要求';
        detailedError = '摄像头规格不满足要求，请：\n1. 检查摄像头设置\n2. 尝试降低分辨率要求\n3. 更新摄像头驱动';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = '浏览器不支持此功能';
        detailedError = '请使用现代浏览器如Chrome、Firefox、Edge的最新版本';
      } else {
        detailedError = `未知错误: ${err.message}\n\n请尝试：\n1. 重启浏览器\n2. 检查摄像头设置\n3. 清除浏览器缓存`;
      }
      
      message.error(errorMessage);
      setError(`${errorMessage}\n\n${detailedError}`);
      return null;
    }
  }, []);

  // 开始面试
  const startInterview = async () => {
    setLoading(true);
    try {
      const stream = await getMediaPermissions();
      if (!stream) {
        setLoading(false);
        return;
      }

      console.log('=== 开始面试 ===');
      console.log('面试类型:', type);
      
      // 调用后端API开始面试
      const response = await startInterviewAPI(type);
      console.log('后端API响应:', response);
      
      if (response.data && response.data.recordId) {
        setInterviewRecordId(response.data.recordId);
        console.log('设置interviewRecordId:', response.data.recordId);
        message.success(`开始${response.data.position}面试`);
      } else {
        console.warn('后端响应中没有recordId');
      }

      setIsInterviewStarted(true);
      
      // 模拟AI开始提问
      setTimeout(() => {
        setAiSpeaking(true);
        setSubtitle('您好，我是AI面试官，请简单介绍一下您自己。');
        
        // 模拟AI说话结束
        setTimeout(() => {
          setAiSpeaking(false);
          setSubtitle('');
          setIsRecording(true);
          startRecording();
        }, 3000);
      }, 1000);
      
    } catch (error) {
      console.error('开始面试失败:', error);
      message.error('启动面试失败');
      setError('面试启动失败');
    } finally {
      setLoading(false);
    }
  };

  // 开始录制（视频+音频）
  const startRecording = () => {
    if (!mediaStream) return;
    videoChunksRef.current = [];
    videoRecorderRef.current = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });
    videoRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        videoChunksRef.current.push(event.data);
      }
    };
    videoRecorderRef.current.onstop = () => {
      const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
      setVideoBlob(blob);
    };
    videoRecorderRef.current.start();
    setIsRecording(true);
  };

  // 停止录制
  const stopRecording = () => {
    try {
      if (videoRecorderRef.current && videoRecorderRef.current.state === 'recording') {
        videoRecorderRef.current.stop();
        console.log('视频录制已停止');
      }
      setIsRecording(false);
    } catch (error) {
      console.error('停止录制时出错:', error);
      setIsRecording(false);
      message.error('停止录制失败');
    }
  };

  // 结束面试
  const endInterview = async () => {
    console.log('=== 开始结束面试 ===');
    console.log('interviewRecordId:', interviewRecordId);
    if (isRecording) {
      stopRecording();
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    setEndingInterview(true);
    try {
      // 先上传视频
      if (interviewRecordId && videoBlob) {
        const videoFile = new File([videoBlob], 'interview.webm', { type: 'video/webm' });
        await uploadVideo(interviewRecordId, videoFile);
      }
      // 再结束面试
      if (interviewRecordId) {
        await endInterviewAPI(interviewRecordId);
        message.success('面试已结束，正在生成AI点评...');
        navigate(`/ai-review/${interviewRecordId}`);
      } else {
        message.success('面试已结束');
        navigate('/interview-types');
      }
    } catch (error) {
      console.error('结束面试时出错:', error);
      message.error('结束面试失败');
      navigate('/interview-types');
    } finally {
      setEndingInterview(false);
      setIsInterviewStarted(false);
      setIsRecording(false);
      setAiSpeaking(false);
      setSubtitle('');
      setMediaStream(null);
      setAudioStream(null);
      setInterviewRecordId(null);
      setVideoBlob(null);
    }
  };

  // 处理退出登录
  const handleLogout = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    removeToken();
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'interview',
      icon: <VideoCameraOutlined />,
      label: '视频面试',
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: '历史记录',
      onClick: () => navigate('/history'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Title level={3} style={{ margin: 0, color: '#1e293b' }}>
          视频面试
        </Title>
        <Space>
          <Menu
            mode="horizontal"
            items={menuItems}
            style={{ border: 'none' }}
          />
          <Button onClick={handleLogout}>退出登录</Button>
        </Space>
      </Header>

      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* 错误提示 */}
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              style={{ marginBottom: '24px', borderRadius: '12px' }}
              onClose={() => setError(null)}
            />
          )}

          {/* 设备检测组件 */}
          {showDeviceDetector && (
            <DeviceDetector onClose={() => setShowDeviceDetector(false)} />
          )}

          {/* 面试未开始状态 */}
          {!isInterviewStarted && (
            <Card style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <VideoCameraOutlined style={{ fontSize: '64px', color: '#3b82f6', marginBottom: '24px' }} />
                  <Title level={2} style={{ marginBottom: '16px', color: '#1e293b' }}>
                    准备开始视频面试
                  </Title>
                  <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '32px' }}>
                    请确保您的摄像头和麦克风正常工作
                  </Text>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Button
                      type="primary"
                      size="large"
                      loading={loading}
                      onClick={startInterview}
                      style={{ 
                        height: '48px', 
                        padding: '0 32px',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: '#3b82f6',
                        borderColor: '#3b82f6'
                      }}
                      icon={!loading && <PlayCircleOutlined />}
                    >
                      {loading ? '准备中...' : '开始面试'}
                    </Button>
                    
                    <Button
                      onClick={() => setShowDeviceDetector(!showDeviceDetector)}
                      style={{ 
                        height: '48px', 
                        padding: '0 32px',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: '#f8fafc',
                        borderColor: '#e2e8f0',
                        color: '#64748b'
                      }}
                      icon={<SettingOutlined />}
                    >
                      {showDeviceDetector ? '隐藏设备检测' : '检测设备'}
                    </Button>
                    
                    <Button
                      onClick={() => navigate('/interview-types')}
                      style={{ 
                        height: '48px', 
                        padding: '0 32px',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: '#f8fafc',
                        borderColor: '#e2e8f0',
                        color: '#64748b'
                      }}
                      icon={<CloseOutlined />}
                    >
                      返回
                    </Button>
                  </div>
                </motion.div>
              </div>
            </Card>
          )}

          {/* 面试进行中状态 */}
          {isInterviewStarted && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}
            >
              {/* 左侧：AI面试官视频 */}
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <VideoCameraOutlined style={{ color: '#3b82f6' }} />
                    <span style={{ color: '#1e293b' }}>AI面试官</span>
                  </div>
                } 
                style={{ 
                  borderRadius: '16px',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <AIInterviewerVideo 
                  isSpeaking={aiSpeaking} 
                  subtitle={showSubtitle ? subtitle : ''} 
                />
                
                <Divider />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SettingOutlined style={{ color: '#64748b' }} />
                    <Text style={{ color: '#64748b' }}>字幕显示</Text>
                  </div>
                  <Switch 
                    checked={showSubtitle} 
                    onChange={setShowSubtitle}
                    checkedChildren={<EyeOutlined style={{ fontSize: '12px' }} />}
                    unCheckedChildren={<EyeInvisibleOutlined style={{ fontSize: '12px' }} />}
                  />
                </div>
                
                {aiSpeaking && (
                  <Progress 
                    percent={100} 
                    status="active"
                    strokeColor="#3b82f6"
                    showInfo={false}
                    style={{ marginTop: '16px' }}
                  />
                )}
              </Card>

              {/* 右侧：用户视频和控制 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <VideoCameraOutlined style={{ color: '#16a34a' }} />
                      <span style={{ color: '#1e293b' }}>您的视频</span>
                    </div>
                  }
                  style={{ 
                    borderRadius: '16px',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <UserVideo 
                    stream={mediaStream} 
                    isRecording={isRecording} 
                  />
                </Card>

                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AudioOutlined style={{ color: '#f59e0b' }} />
                      <span style={{ color: '#1e293b' }}>面试控制</span>
                    </div>
                  }
                  style={{ 
                    borderRadius: '16px',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {isRecording ? (
                      <Button
                        type="primary"
                        danger
                        icon={<StopOutlined style={{ fontSize: '16px' }} />}
                        onClick={stopRecording}
                        block
                        size="large"
                        style={{ 
                          height: '48px',
                          borderRadius: '12px',
                          fontSize: '16px'
                        }}
                      >
                        停止回答
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        icon={<AudioOutlined style={{ fontSize: '16px' }} />}
                        disabled={aiSpeaking}
                        onClick={startRecording}
                        block
                        size="large"
                        style={{ 
                          height: '48px',
                          borderRadius: '12px',
                          fontSize: '16px',
                          background: aiSpeaking ? '#e2e8f0' : '#3b82f6',
                          borderColor: aiSpeaking ? '#e2e8f0' : '#3b82f6'
                        }}
                      >
                        {aiSpeaking ? 'AI正在提问...' : '开始回答'}
                      </Button>
                    )}
                    
                    <Button
                      danger
                      icon={<CloseOutlined style={{ fontSize: '16px' }} />}
                      onClick={endInterview}
                      block
                      style={{ 
                        height: '48px',
                        borderRadius: '12px',
                        fontSize: '16px'
                      }}
                    >
                      结束面试
                    </Button>
                  </Space>
                </Card>

                {/* 状态指示器 */}
                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircleOutlined style={{ color: '#16a34a' }} />
                      <span style={{ color: '#1e293b' }}>面试状态</span>
                    </div>
                  }
                  style={{ 
                    borderRadius: '16px',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#64748b' }}>AI状态:</Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: aiSpeaking ? '#16a34a' : '#e2e8f0'
                        }} />
                        <Text type={aiSpeaking ? 'success' : 'secondary'}>
                          {aiSpeaking ? '正在提问' : '等待中'}
                        </Text>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#64748b' }}>录制状态:</Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: isRecording ? '#ef4444' : '#e2e8f0'
                        }} />
                        <Text type={isRecording ? 'danger' : 'secondary'}>
                          {isRecording ? '正在录制' : '未录制'}
                        </Text>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#64748b' }}>字幕:</Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: showSubtitle ? '#16a34a' : '#e2e8f0'
                        }} />
                        <Text type={showSubtitle ? 'success' : 'secondary'}>
                          {showSubtitle ? '已开启' : '已关闭'}
                        </Text>
                      </div>
                    </div>
                  </Space>
                </Card>
              </div>
            </motion.div>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default VideoInterview; 