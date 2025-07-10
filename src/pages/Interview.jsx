import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { startInterview, endInterview, deleteInterviewRecord } from '../api';
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
import MediaRecorderComponent from '../components/MediaRecorder.jsx';
import { RTCPlayer } from '../libs/rtcplayer.esm.js';

// AI面试官WebRTC视频组件
const AIInterviewerVideo = ({ showSubtitle, subtitle, streamInfo, children }) => {
  const wrapperRef = useRef(null);
  const playerRef = useRef(null);
  const [playNotAllowed, setPlayNotAllowed] = useState(false);

  useEffect(() => {
    console.log('【AIInterviewerVideo useEffect】streamInfo:', streamInfo);
    if (streamInfo) {
      console.log('【AIInterviewerVideo useEffect】streamUrl:', streamInfo.streamUrl);
      console.log('【AIInterviewerVideo useEffect】apiUrl:', streamInfo.apiUrl);
      if (!streamInfo.streamUrl) {
        console.error('【AIInterviewerVideo useEffect】streamUrl为空或未定义！', streamInfo);
      }
    } else {
      console.error('【AIInterviewerVideo useEffect】streamInfo为null或undefined！');
    }
    if (streamInfo && streamInfo.streamUrl) {
      // 销毁旧实例
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current = null;
      }
      // 创建新实例
      const player = new RTCPlayer();
      player.playerType = 11; // 明确指定webrtc模式
      player.container = wrapperRef.current;
      player.videoSize = { width: 640, height: 320 };
      // 某些SDK即使webrtc也需要apiUrl字段
      const streamParam = { url: streamInfo.streamUrl, apiUrl: streamInfo.apiUrl || '' };
      console.log('【AIInterviewerVideo useEffect】即将赋值player.stream参数:', streamParam);
      player.stream = streamParam;
      player
        .on('play', () => console.log('sdk event: player play'))
        .on('waiting', () => console.log('sdk event: player waiting'))
        .on('playing', () => console.log('sdk event: player playing'))
        .on('not-allowed', () => {
          setPlayNotAllowed(true);
          console.log('sdk event: play not allowed, muted play');
        })
        .on('error', err => console.error('sdk event: error', err));
      player.play();
      playerRef.current = player;
    } else {
      console.error('streamUrl 无效', streamInfo);
    }
    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current = null;
      }
    };
  }, [streamInfo]);

  return (
    <div className={styles.aiVideo} style={{ position: 'relative' }}>
      <div id="playerWrapper" ref={wrapperRef} style={{ width: '100%', height: 320, background: '#000', borderRadius: 16 }} />
      {playNotAllowed && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 320, background: 'rgba(0,0,0,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div>
            <div style={{ fontSize: 24, marginBottom: 12 }}>浏览器限制自动播放，请点击下方按钮恢复</div>
            <button onClick={() => { playerRef.current && playerRef.current.resume(); setPlayNotAllowed(false); }} style={{ fontSize: 18, padding: '8px 24px', borderRadius: 8 }}>点击恢复播放</button>
          </div>
        </div>
      )}
      {(!streamInfo || !streamInfo.streamUrl) && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <div style={{ fontSize: 110, marginBottom: 10 }}>🤖</div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2 }}>AI面试官</div>
        </div>
      )}
      {showSubtitle && subtitle && (
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)', color: 'white', padding: '14px 32px', borderRadius: 12, fontSize: 18, maxWidth: '90%', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
        }}>{subtitle}</div>
      )}
      {children}
    </div>
  );
};

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
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [question, setQuestion] = useState('');
  const [recordId, setRecordId] = useState(null);
  const [interviewInfo, setInterviewInfo] = useState(null);
  const [showSubtitle, setShowSubtitle] = useState(true);
  const [userStream, setUserStream] = useState(null);
  const [endModalVisible, setEndModalVisible] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [interviewSeconds, setInterviewSeconds] = useState(0);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef();
  const [streamInfo, setStreamInfo] = useState(null);
  const [avatarInput, setAvatarInput] = useState("");

  // 页面加载时直接打开摄像头，并创建面试记录
  useEffect(() => {
    console.log('Interview useEffect called', new Date().toISOString());
    let isMounted = true;
    // 1. 打开摄像头
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => { if (isMounted) setUserStream(stream); })
      .catch(() => { if (isMounted) setUserStream(null); });
    // 2. 创建面试记录
    (async () => {
      try {
        const res = await startInterview(type);
        if (!isMounted) return;
        setQuestion(res.data.question);
        setRecordId(res.data.recordId);
        setInterviewInfo({ position: res.data.position, aiModel: res.data.aiModel });
      } catch (e) {
        showToast('面试初始化失败', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    // 3. 启动计时器
    timerRef.current = setInterval(() => {
      setInterviewSeconds(sec => sec + 1);
    }, 1000);
    return () => {
      if (userStream) {
        userStream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      isMounted = false;
    };
    // eslint-disable-next-line
  }, []);

  // 页面加载后，recordId有值时自动开始录制
  useEffect(() => {
    if (recordId && mediaRecorderRef.current) {
      mediaRecorderRef.current.startRecording();
    }
  }, [recordId]);

  // 格式化时间
  const formatTime = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
  };

  // 结束面试
  const handleEndInterview = async () => {
    setLoading(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    try {
      if (!recordId) {
        showToast('面试记录未初始化', 'error');
        setLoading(false);
        return;
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stopRecording();
      }
      await endInterview(recordId);
      showToast('面试已结束', 'success');
      if (userStream) {
        userStream.getTracks().forEach(track => track.stop());
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      navigate(`/ai-review/${recordId}`);
    } catch (e) {
      showToast('结束面试失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExitInterview = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (userStream) {
      userStream.getTracks().forEach(track => track.stop());
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (recordId) {
      try {
        await deleteInterviewRecord(recordId);
      } catch (e) {
        // 可选：提示删除失败，但不影响跳转
      }
    }
    navigate('/interview-types');
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  // 启动avatar会话
  const handleStartAvatar = async () => {
    const res = await fetch('/api/avatar/start', { method: 'POST' });
    const text = await res.text();
    console.log('【handleStartAvatar】后端原始返回:', text);
    // 假设后端返回json: { sid, streamUrl, ... }
    try {
      const info = JSON.parse(text);
      console.log('【handleStartAvatar】解析后:', info);
      setStreamInfo(info);
      showToast('虚拟人已启动', 'info');
    } catch {
      setStreamInfo(null);
      showToast(text, 'info');
    }
  };
  // 发送文本驱动
  const handleSendAvatarText = async () => {
    if (!avatarInput) return;
    const res = await fetch(`/api/avatar/send?text=${encodeURIComponent(avatarInput)}`, { method: 'POST' });
    const text = await res.text();
    showToast(text, 'info');
  };
  // 关闭avatar会话
  const handleStopAvatar = async () => {
    const res = await fetch('/api/avatar/stop', { method: 'POST' });
    const text = await res.text();
    setStreamInfo(null);
    showToast(text, 'info');
  };

  return (
    <div className="glass-effect" style={{ minHeight: '100vh' }}>
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
          <div style={{
            background: '#f1f5f9',
            color: '#334155',
            borderRadius: 8,
            padding: '0 18px',
            height: 36,
            display: 'flex',
            alignItems: 'center',
            fontWeight: 500,
            fontSize: 16,
            letterSpacing: 1,
          }}>
            面试时长：{formatTime(interviewSeconds)}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#64748b', cursor: 'pointer' }}>
            <input type="checkbox" checked={showSubtitle} onChange={e => setShowSubtitle(e.target.checked)} style={{ accentColor: '#3b82f6', width: 16, height: 16 }} />
            显示AI字幕
          </label>
          <Button type="primary" style={{ height: 40, minWidth: 120, padding: '0 24px', borderRadius: 8, fontSize: 14, fontWeight: 500 }} onClick={() => setEndModalVisible(true)} disabled={loading || !recordId}>提交并结束面试</Button>
          <Button danger style={{ height: 40, minWidth: 120, padding: '0 24px', borderRadius: 8, fontSize: 14, fontWeight: 500 }} onClick={() => setExitModalVisible(true)}>直接退出面试</Button>
        </div>
      </div>
      {/* 内容区域 */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: 'calc(100vh - 64px)', padding: '40px 0' }}>
        <div style={{ width: '100%', maxWidth: 900, position: 'relative' }}>
          <AIInterviewerVideo showSubtitle={showSubtitle} subtitle={question} streamInfo={streamInfo}>
            <UserVideoPiP stream={userStream} />
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <Button onClick={handleStartAvatar} type="primary">启动虚拟人</Button>
              <Button onClick={handleStopAvatar} danger>关闭虚拟人</Button>
              <input value={avatarInput} onChange={e => setAvatarInput(e.target.value)} placeholder="输入给虚拟人的文本" style={{ width: 200, marginLeft: 8 }} />
              <Button onClick={handleSendAvatarText}>发送文本</Button>
            </div>
          </AIInterviewerVideo>
          <MediaRecorderComponent
            ref={mediaRecorderRef}
            recordId={recordId}
            uploadUrl="/api/interview/upload-video"
          />
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