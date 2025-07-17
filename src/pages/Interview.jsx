import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { startInterview, endInterview, deleteInterviewRecord } from '../api';
import api from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import { Title, Text } from '../components/ui/Typography';
import Loading from '../components/ui/Loading';
import Modal from '../components/ui/Modal';
import { removeToken } from '../utils/auth';
import styles from './Interview.module.css';
import MediaRecorderComponent from '../components/MediaRecorder.jsx';
import { RTCPlayer } from '../libs/rtcplayer.esm.js';
import { BgEffectContext } from '../App';
import axios from 'axios';
import AudioRecorder from '../components/AudioRecorder.jsx';
import Toast from '../components/ui/Toast';
import { showToast as showToastUtil } from '../utils/toast';

// AI面试官WebRTC视频组件
const AIInterviewerVideo = ({ showSubtitle, subtitle, streamInfo, children, avatarLoading, onPlayerReady, onPlayerFail }) => {
  const wrapperRef = useRef(null);
  const playerRef = useRef(null);
  const [playNotAllowed, setPlayNotAllowed] = useState(false);
  // 新增：拉流重试
  const maxRetry = 16; // 拉流最大重试次数，0.5秒间隔共8秒
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  // 新增：currentTime检测
  const currentTimeCheckTimeout = useRef(null);

  useEffect(() => {
    let stopped = false;
    const tryPlay = () => {
      if (stopped) return;
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current = null;
      }
      if (streamInfo && streamInfo.stream_url && streamInfo.session) {
        const player = new RTCPlayer();
        player.playerType = 6;
        player.container = wrapperRef.current;
        player.videoSize = { width: 720, height: 405 };
        player.stream = {
          sid: streamInfo.session,
          streamUrl: streamInfo.stream_url
        };
        player
          .on('play', () => console.log('sdk event: player play'))
          .on('waiting', () => console.log('sdk event: player waiting'))
          .on('playing', () => {
            console.log('sdk event: player playing');
            // currentTime检测
            const video = wrapperRef.current?.querySelector('video');
            if (video) {
              let lastTime = video.currentTime;
              if (currentTimeCheckTimeout.current) clearTimeout(currentTimeCheckTimeout.current);
              currentTimeCheckTimeout.current = setTimeout(() => {
                if (video.currentTime > lastTime + 0.1) {
                  // 说明真的在播放
                  if (onPlayerReady) onPlayerReady();
                } else {
                  // 可能黑屏/无流
                  if (onPlayerFail) onPlayerFail();
                }
              }, 2000); // 2秒后检测
            } else {
              // 没有video标签，直接判定失败
              if (onPlayerFail) onPlayerFail();
            }
            retryCountRef.current = 0;
          })
          .on('not-allowed', () => {
            setPlayNotAllowed(true);
            console.log('sdk event: play not allowed, muted play');
          })
          .on('error', err => {
            console.error('sdk event: error', err);
            setPlayNotAllowed(true);
            // 拉流失败重试
            if (retryCountRef.current < maxRetry) {
              retryCountRef.current++;
              retryTimeoutRef.current = setTimeout(tryPlay, 500); // 拉流重试间隔缩短为0.5秒
            } else {
              if (onPlayerFail) onPlayerFail();
            }
          });
        try {
          player.play();
          playerRef.current = player;
          setTimeout(() => {
            const video = wrapperRef.current?.querySelector('video');
            if (video) {
              video.style.width = '100%';
              video.style.height = '100%';
              video.style.objectFit = 'contain';
              video.style.borderRadius = '24px';
              video.style.background = '#18181c';
              video.style.padding = '0';
              video.style.display = 'block';
              video.style.margin = '0 auto';
            }
          }, 500);
        } catch (error) {
          console.error('RTCPlayer播放失败:', error);
          setPlayNotAllowed(true);
          if (retryCountRef.current < maxRetry) {
            retryCountRef.current++;
            retryTimeoutRef.current = setTimeout(tryPlay, 500); // 拉流重试间隔缩短为0.5秒
          } else {
            if (onPlayerFail) onPlayerFail();
          }
        }
      }
    };
    if (streamInfo && streamInfo.stream_url && streamInfo.session) {
      retryCountRef.current = 0;
      tryPlay();
    }
    return () => {
      stopped = true;
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (currentTimeCheckTimeout.current) {
        clearTimeout(currentTimeCheckTimeout.current);
      }
    };
  }, [streamInfo]);

  return (
    <div className={styles.aiVideo} style={{ position: 'relative' }}>
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          aspectRatio: '16/9',
          background: '#18181c',
          borderRadius: 24,
          boxShadow: '0 4px 32px 0 rgba(0,0,0,0.18)',
          position: 'relative',
          overflow: 'hidden',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* 视频内容（RTCPlayer） */}
        <div
          id="playerWrapper"
          ref={wrapperRef}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            borderRadius: 24,
            overflow: 'hidden',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
        {/* 加载动画：虚拟人加载中且未就绪时显示 */}
        {avatarLoading && (!streamInfo || !streamInfo.stream_url) && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, background: 'rgba(24,24,28,0.7)' }}>
            <div style={{ width: 72, height: 72, border: '6px solid #fff', borderTop: '6px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        )}
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
  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
  };
  const [question, setQuestion] = useState('');
  const [recordId, setRecordId] = useState(null);
  const [interviewInfo, setInterviewInfo] = useState(null);
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
  const { resetColors } = useContext(BgEffectContext);

  // 新增：虚拟人拉流成功/失败提示
  const [avatarReady, setAvatarReady] = useState(false);
  const [avatarFail, setAvatarFail] = useState(false);

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
    // 重置泡泡颜色
    resetColors();
    navigate('/interview-types');
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  // 发送消息（大模型交互）
  const handleSendMessage = async (msg) => {
    const text = (typeof msg === 'string' ? msg : avatarInput).trim();
    if (!text || !streamInfo?.session) {
      showToast('请输入消息', 'error');
      return;
    }
    try {
      const res = await api.post(`/avatar/send?sessionId=${streamInfo.session}&text=${encodeURIComponent(text)}`);
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

  // 新增：录音得到的音频 Blob
  const [audioBlob, setAudioBlob] = useState(null);
  // 新增：音频上传 loading 状态
  const [audioUploading, setAudioUploading] = useState(false);

  // 修改 handleSendAudio，支持直接用 audioBlob
  const handleSendAudio = async (blob) => {
    // blob 参数优先，兼容原有 audioFile
    const audio = blob || audioBlob;
    if (!audio || !streamInfo?.session) {
      showToast('请先启动虚拟人并录音', 'warning');
      return;
    }
    setAudioUploading(true);
    const formData = new FormData();
    formData.append('sessionId', streamInfo.session);
    formData.append('audio', audio, 'record.wav');
    try {
      const res = await axios.post('/api/avatar/audio-interact', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast(res.data.msg || '上传成功', 'success');
      setAudioBlob(null);
    } catch (err) {
      showToast('上传失败: ' + (err?.response?.data?.msg || err.message), 'error');
    } finally {
      setAudioUploading(false);
    }
  };

  return (
    <div className="glass-effect" style={{ minHeight: '100vh' }}>
      {/* 移除所有 Toast 相关提示 */}
      {/* 只在全局初始化时转圈，avatarLoading 时不全局转圈 */}
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
          <Button type="primary" style={{ height: 40, minWidth: 120, padding: '0 24px', borderRadius: 8, fontSize: 14, fontWeight: 500 }} onClick={() => setEndModalVisible(true)} disabled={loading || !recordId}>提交并结束面试</Button>
          <Button danger style={{ height: 40, minWidth: 120, padding: '0 24px', borderRadius: 8, fontSize: 14, fontWeight: 500 }} onClick={() => setExitModalVisible(true)}>直接退出面试</Button>
        </div>
      </div>
      {/* 内容区域 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 'calc(100vh - 64px)', padding: '40px 0' }}>
        <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* AI面试官视频 */}
          <AIInterviewerVideo
            showSubtitle={question}
            subtitle={question}
            streamInfo={streamInfo}
            avatarLoading={avatarLoading}
            onPlayerReady={() => {
              if (!avatarReady) {
                setAvatarReady(true);
                setAvatarFail(false);
              }
            }}
            onPlayerFail={() => { setAvatarFail(true); setAvatarReady(false); }}
          />
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
            {/* “继续”按钮直接传递 '继续' 给 handleSendMessage */}
            <Button
              onClick={() => handleSendMessage('继续')}
              type="primary"
              disabled={avatarLoading || !streamInfo?.session}
              style={{
                width: '100%',
                height: 64,
                fontSize: 20,
                borderRadius: 16,
                marginTop: 8
              }}
            >
              继续
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
          {/* 音频录音区域，放在主内容下方，单列居中 */}
          <div style={{ width: '100%', maxWidth: 480, margin: '32px auto 0 auto' }}>
            <AudioRecorder
              onAudioData={blob => {
                setAudioBlob(blob);
                handleSendAudio(blob);
              }}
            />
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, textAlign: 'center' }}>需先启动虚拟人，录音后自动发送音频</div>
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
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, visible: false })} />
      {/* 拉流成功/失败提示 */}
      {avatarReady && <div style={{ position: 'fixed', top: 80, left: 0, right: 0, zIndex: 9999, textAlign: 'center' }}><Toast visible={true} message="虚拟人已启动" type="success" /></div>}
      {avatarFail && <div style={{ position: 'fixed', top: 80, left: 0, right: 0, zIndex: 9999, textAlign: 'center' }}><Toast visible={true} message="虚拟人拉流失败，请重试或检查网络" type="error" /></div>}
    </div>
  );
};

export default Interview; 