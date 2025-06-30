import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { startInterview, endInterview } from '../api';
import Toast from '../components/ui/Toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import { Title, Text } from '../components/ui/Typography';
import Loading from '../components/ui/Loading';
import Modal from '../components/ui/Modal';
import { removeToken } from '../utils/auth';
import styles from './Interview.module.css';
import { showToast } from '../utils/toast';

// AI面试官占位视频组件
const AIInterviewerVideo = ({ showSubtitle, subtitle, children }) => (
  <div className={styles.aiVideo}>
    <div style={{ textAlign: 'center', color: 'white' }}>
      <div style={{ fontSize: 110, marginBottom: 10 }}>🤖</div>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>AI面试官</div>
    </div>
    {showSubtitle && subtitle && (
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.7)', color: 'white', padding: '14px 32px', borderRadius: 12, fontSize: 18, maxWidth: '90%', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
      }}>{subtitle}</div>
    )}
    {children}
  </div>
);

// 面试者摄像头视频画中画小框
const UserVideoPiP = ({ stream }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return (
    <div className={styles.userPiP}>
      {stream ? (
        <video ref={videoRef} autoPlay muted style={{ width: '100%', height: '100%' }} />
      ) : (
        <div style={{ color: '#fff', textAlign: 'center', lineHeight: '120px', fontSize: 16 }}>摄像头未开启</div>
      )}
    </div>
  );
};

const Interview = () => {
  const navigate = useNavigate();
  const { type } = useParams();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [question, setQuestion] = useState('');
  const [recordId, setRecordId] = useState(null);
  const [interviewInfo, setInterviewInfo] = useState(null);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [userStream, setUserStream] = useState(null);
  const [endModalVisible, setEndModalVisible] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  // 页面加载时直接打开摄像头，不产生记录
  useEffect(() => {
    let isMounted = true;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => { if (isMounted) setUserStream(stream); })
      .catch(() => { if (isMounted) setUserStream(null); });
    return () => {
      if (userStream) {
        userStream.getTracks().forEach(track => track.stop());
      }
      isMounted = false;
    };
    // eslint-disable-next-line
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
  };

  // 只有点击"提交并结束面试"时才产生记录
  const handleEndInterview = async () => {
    setLoading(true);
    try {
      // 先创建面试记录
      const res = await startInterview(type);
      setQuestion(res.data.question);
      setRecordId(res.data.recordId);
      setInterviewInfo({ position: res.data.position, aiModel: res.data.aiModel });
      // 立即结束面试
      await endInterview(res.data.recordId);
      showToast('面试已结束', 'success');
      if (userStream) {
        userStream.getTracks().forEach(track => track.stop());
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      navigate(`/ai-review/${res.data.recordId}`);
    } catch (e) {
      showToast('结束面试失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExitInterview = async () => {
    if (userStream) {
      userStream.getTracks().forEach(track => track.stop());
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    navigate('/interview-types');
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, visible: false })} />
      {loading && <Loading />}
      {/* Header 区域 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#fff', padding: '0 32px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderBottom: '1px solid #e2e8f0', height: 64, position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: '#fff'
          }}>
            <span role="img" aria-label="robot">🤖</span>
          </div>
          <Title level={3} style={{ margin: 0 }}>AI面试模拟器</Title>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#64748b', cursor: 'pointer' }}>
            <input type="checkbox" checked={showSubtitle} onChange={e => setShowSubtitle(e.target.checked)} style={{ accentColor: '#3b82f6', width: 16, height: 16 }} />
            显示AI字幕
          </label>
          <Button type="primary" style={{ height: 40, minWidth: 120, padding: '0 24px', borderRadius: 8, fontSize: 14, fontWeight: 500 }} onClick={() => setEndModalVisible(true)}>提交并结束面试</Button>
          <Button danger style={{ height: 40, minWidth: 120, padding: '0 24px', borderRadius: 8, fontSize: 14, fontWeight: 500 }} onClick={() => setExitModalVisible(true)}>直接退出面试</Button>
        </div>
      </div>
      {/* 内容区域 */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: 'calc(100vh - 64px)', padding: '40px 0' }}>
        <div style={{ width: '100%', maxWidth: 900, position: 'relative' }}>
          <AIInterviewerVideo showSubtitle={showSubtitle} subtitle={question}>
            <UserVideoPiP stream={userStream} />
          </AIInterviewerVideo>
        </div>
      </div>
      {/* 结束面试确认弹窗 */}
      <Modal
        visible={endModalVisible}
        title="确认结束面试"
        onOk={handleEndInterview}
        onCancel={() => setEndModalVisible(false)}
        okText="确认结束"
        cancelText="取消"
      >
        <div style={{ fontSize: 16, color: '#475569', padding: '12px 0' }}>
          确定要提交并结束本次面试吗？
        </div>
      </Modal>
      {/* 直接退出面试确认弹窗 */}
      <Modal
        visible={exitModalVisible}
        title="确认直接退出面试"
        onOk={handleExitInterview}
        onCancel={() => setExitModalVisible(false)}
        okText="确认退出"
        cancelText="取消"
      >
        <div style={{ fontSize: 16, color: '#475569', padding: '12px 0' }}>
          直接退出将不会保存本次面试记录，也不会生成点评。确定要退出吗？
        </div>
      </Modal>
    </div>
  );
};

export default Interview; 