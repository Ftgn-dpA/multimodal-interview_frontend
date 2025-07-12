import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { startInterview, endInterview, deleteInterviewRecord } from '../api';
import api from '../api';
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
      console.log('【AIInterviewerVideo useEffect】stream_url:', streamInfo.stream_url);
      console.log('【AIInterviewerVideo useEffect】api_url:', streamInfo.api_url);
      if (!streamInfo.stream_url) {
        console.error('【AIInterviewerVideo useEffect】stream_url为空或未定义！', streamInfo);
      }
    } else {
      console.error('【AIInterviewerVideo useEffect】streamInfo为null或undefined！');
    }
    
    if (streamInfo && streamInfo.stream_url && streamInfo.session) {
      // 销毁旧实例
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current = null;
      }
      // 创建新实例
      const player = new RTCPlayer();
      player.playerType = 6; // WebRTC 模式
      player.container = wrapperRef.current;
      // 使播放器与外层方框完全一致，16:9比例
      player.videoSize = { width: 720, height: 405 };
      player.stream = {
        sid: streamInfo.session,
        streamUrl: streamInfo.stream_url
      };
      console.log('【AIInterviewerVideo useEffect】RTCPlayer配置完成', player.stream);
      player
        .on('play', () => console.log('sdk event: player play'))
        .on('waiting', () => console.log('sdk event: player waiting'))
        .on('playing', () => console.log('sdk event: player playing'))
        .on('not-allowed', () => {
          setPlayNotAllowed(true);
          console.log('sdk event: play not allowed, muted play');
        })
        .on('error', err => {
          console.error('sdk event: error', err);
          setPlayNotAllowed(true);
        });
      try {
        player.play();
        playerRef.current = player;
        console.log('【AIInterviewerVideo useEffect】RTCPlayer开始播放');
      } catch (error) {
        console.error('【AIInterviewerVideo useEffect】RTCPlayer播放失败:', error);
        setPlayNotAllowed(true);
      }
    } else {
      console.error('stream_url 或 session 无效', streamInfo);
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
      <div
        id="playerWrapper"
        ref={wrapperRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          borderRadius: 24,
          overflow: 'hidden',
          background: 'transparent', // 去除黑色背景
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
      {playNotAllowed && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div>
            <div style={{ fontSize: 24, marginBottom: 12 }}>浏览器限制自动播放，请点击下方按钮恢复</div>
            <button onClick={() => { playerRef.current && playerRef.current.resume(); setPlayNotAllowed(false); }} style={{ fontSize: 18, padding: '8px 24px', borderRadius: 8 }}>点击恢复播放</button>
          </div>
        </div>
      )}
      {(!streamInfo || !streamInfo.stream_url) && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
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
  const [avatarLoading, setAvatarLoading] = useState(false);
  const userVideoRef = useRef(null);

  // 页面加载时直接打开摄像头，创建面试记录，并自动启动虚拟人
  useEffect(() => {
    console.log('Interview useEffect called', new Date().toISOString());
    let isMounted = true;
    
    const initializeInterview = async () => {
      try {
        // 1. 打开摄像头
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (isMounted) setUserStream(stream);
        } catch (e) {
          if (isMounted) setUserStream(null);
        }
        
        // 2. 创建面试记录
        const res = await startInterview(type);
        if (!isMounted) return;
        setQuestion(res.data.question);
        setRecordId(res.data.recordId);
        setInterviewInfo({ position: res.data.position, aiModel: res.data.aiModel });
        
        // 3. 自动启动虚拟人
        if (isMounted) {
          setAvatarLoading(true);
          try {
            console.log('【自动启动虚拟人】开始调用后端接口');
            const avatarRes = await api.post('/avatar/start');
            console.log('【自动启动虚拟人】后端原始返回:', avatarRes.data);
            
            const info = avatarRes.data;
            
            // 检查必要字段
            if (!info.session) {
              throw new Error('返回数据缺少 session');
            }
            
            if (info.status === 'fail') {
              throw new Error(info.msg || '启动失败');
            }
            
            if (isMounted) {
              setStreamInfo(info);
              showToast('虚拟人已启动', 'info');
            }
          } catch (error) {
            console.error('自动启动虚拟人失败:', error);
            if (isMounted) {
              setStreamInfo(null);
              showToast(`虚拟人启动失败: ${error.message}`, 'error');
            }
          } finally {
            if (isMounted) {
              setAvatarLoading(false);
            }
          }
        }
      } catch (e) {
        showToast('面试初始化失败', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    initializeInterview();
    
    // 4. 启动计时器
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
  }, [type]);

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
      // 自动关闭虚拟人连接
      await closeAvatarConnection();
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
    // 自动关闭虚拟人连接
    await closeAvatarConnection();
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

  // 发送消息（大模型交互）
  const handleSendMessage = async () => {
    if (!avatarInput.trim() || !streamInfo?.session) {
      showToast('请输入消息', 'error');
      return;
    }
    try {
      const res = await api.post(`/avatar/send?sessionId=${streamInfo.session}&text=${encodeURIComponent(avatarInput.trim())}`);
      const data = res.data;
      if (data.status === 'ok') {
        showToast(data.msg, 'info');
        setAvatarInput(''); // 清空输入框
      } else {
        showToast(data.msg, 'error');
      }
    } catch (error) {
      showToast('发送消息失败', 'error');
    }
  };

  // 键盘事件处理
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // 阻止默认的换行行为
      if (avatarInput.trim() && !avatarLoading && streamInfo?.session) {
        handleSendMessage();
      }
    }
  };

  // 关闭虚拟人连接
  const closeAvatarConnection = async () => {
    if (streamInfo?.session) {
      try {
        await api.post(`/avatar/stop?sessionId=${streamInfo.session}`);
        console.log('虚拟人连接已关闭');
      } catch (error) {
        console.error('关闭虚拟人连接失败:', error);
      }
    }
  };

  useEffect(() => {
    if (userVideoRef.current && userStream) {
      userVideoRef.current.srcObject = userStream;
    }
  }, [userStream]);

  // 组件卸载时自动关闭虚拟人连接
  useEffect(() => {
    return () => {
      closeAvatarConnection();
    };
  }, [streamInfo?.session]);

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
          {/* 视频区整体容器 */}
          <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* AI面试官视频 */}
            <AIInterviewerVideo showSubtitle={showSubtitle} subtitle={question} streamInfo={streamInfo} />
            {/* 面试者视频，紧贴AI面试官视频下方 */}
            <div className={styles.userVideoArea} style={{ marginTop: 16 }}>
              {userStream ? (
                <video
                  ref={userVideoRef}
                  autoPlay
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 24, background: '#000' }}
                />
              ) : (
                <div style={{ color: '#64748b', textAlign: 'center', lineHeight: '120px', fontSize: 18 }}>摄像头未开启</div>
              )}
            </div>
          </div>
          {/* 聊天输入区域 */}
          <div className={styles.chatInputArea} style={{ 
            width: '100%', 
            maxWidth: 720, 
            margin: '32px auto 0 auto',
            position: 'relative'
          }}>
            {/* 隐藏的视频录制组件 */}
            <MediaRecorderComponent
              ref={mediaRecorderRef}
              recordId={recordId}
              uploadUrl="/api/interview/upload-video"
              onStop={(blob) => {
                console.log('视频录制完成，文件大小:', blob.size);
              }}
            />
            <textarea
              value={avatarInput}
              onChange={e => {
                setAvatarInput(e.target.value);
                // 自动调整高度
                const textarea = e.target;
                textarea.style.height = 'auto';
                textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="输入消息与虚拟人对话，按Enter发送..."
              style={{
                width: '100%',
                minHeight: 96, // 4行文字高度：14px * 1.5 * 4 + 16px * 2 = 96px
                maxHeight: 120,
                padding: '16px 50px 16px 16px', // 右侧留出按钮空间
                border: '1px solid #d1d5db',
                borderRadius: 12,
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                transition: 'border-color 0.2s, height 0.2s',
                lineHeight: '1.5',
                overflowY: 'hidden',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
              }}
            />
            {/* 发送按钮 - 位于右下角 */}
            <Button 
              onClick={handleSendMessage} 
              type="primary" 
              disabled={avatarLoading || !streamInfo?.session || !avatarInput.trim()}
              style={{
                position: 'absolute',
                right: 8,
                bottom: 8,
                height: 21, // 一行文字高度：14px * 1.5 = 21px
                width: 36,
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                minWidth: 'unset'
              }}
            >
              <span style={{ fontSize: 14 }}>→</span>
            </Button>
            {/* 虚拟人加载状态提示 */}
            {avatarLoading && (
              <div style={{ marginTop: 16, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 16, height: 16, border: '2px solid #e2e8f0', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  正在启动虚拟人，请稍候...
                </div>
              </div>
            )}
          </div>
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