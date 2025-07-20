import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { startInterview, endInterview, deleteInterviewRecord, getInterviewInfo } from '../api';
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
const AIInterviewerVideo = ({ showSubtitle, subtitle, streamInfo, children, avatarLoading, avatarReady, avatarFail, onPlayerReady, onPlayerFail }) => {
  const wrapperRef = useRef(null);
  const playerRef = useRef(null);
  const [playNotAllowed, setPlayNotAllowed] = useState(false);
  // 优化：拉流重试参数
  const maxRetry = 8; // 拉流最大重试次数，1秒间隔共8秒
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  // 优化：waiting状态检测
  const waitingTimeoutRef = useRef(null);
  const waitingStartTimeRef = useRef(null);
  // 优化：简化状态管理
  const isInitializedRef = useRef(false);
  // 优化：全局超时机制
  const globalTimeoutRef = useRef(null);
  // 新增：播放成功标志，防止重试
  const isPlayingSuccessfullyRef = useRef(false);

  useEffect(() => {
    let stopped = false;
    
    const clearAllTimeouts = () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (waitingTimeoutRef.current) {
        clearTimeout(waitingTimeoutRef.current);
        waitingTimeoutRef.current = null;
      }
      if (globalTimeoutRef.current) {
        clearTimeout(globalTimeoutRef.current);
        globalTimeoutRef.current = null;
      }
    };

    const handleRetry = () => {
      // 如果已经成功播放，不再重试
      if (stopped || isPlayingSuccessfullyRef.current) return;
      
      if (retryCountRef.current < maxRetry) {
        retryCountRef.current++;
        console.log(`拉流重试，第${retryCountRef.current}次，共${maxRetry}次`);
        retryTimeoutRef.current = setTimeout(tryPlay, 1000); // 重试间隔1秒
      } else {
        console.log(`重试${maxRetry}次后仍然失败，显示失败状态`);
        console.log('重试失败状态：', {
          isPlayingSuccessfully: isPlayingSuccessfullyRef.current,
          retryCount: retryCountRef.current,
          maxRetry: maxRetry
        });
        // 确保失败状态被正确设置
        if (onPlayerFail) {
          onPlayerFail();
        }
      }
    };

    const tryPlay = () => {
      // 如果已经成功播放，不再尝试
      if (stopped || isPlayingSuccessfullyRef.current) return;
      
      // 清理之前的播放器
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
          .on('play', () => {
            console.log('sdk event: player play');
            // 重置waiting状态
            if (waitingTimeoutRef.current) {
              clearTimeout(waitingTimeoutRef.current);
              waitingTimeoutRef.current = null;
            }
            waitingStartTimeRef.current = null;
          })
          .on('waiting', () => {
            // 如果已经成功播放，忽略waiting事件
            if (isPlayingSuccessfullyRef.current) return;
            
            console.log('sdk event: player waiting');
            // 记录waiting开始时间
            if (!waitingStartTimeRef.current) {
              waitingStartTimeRef.current = Date.now();
            }
            // 如果waiting超过3秒，触发重试
            if (waitingTimeoutRef.current) {
              clearTimeout(waitingTimeoutRef.current);
            }
            waitingTimeoutRef.current = setTimeout(() => {
              console.log('waiting超时3秒，触发重试');
              handleRetry();
            }, 3000);
          })
          .on('playing', () => {
            console.log('sdk event: player playing');
            // 立即隐藏加载效果，不等待严格检测
            if (onPlayerReady) onPlayerReady();
            
            // 清除所有超时
            clearAllTimeouts();
            
            // 设置视频样式
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
              
              // 简化检测机制：只使用loadeddata事件
              const handleVideoReady = () => {
                console.log('loadeddata事件触发，开始严格检测');
                
                // 延迟检测，给视频更多时间加载
                setTimeout(() => {
                  if (checkVideoActuallyPlaying()) {
                    console.log('严格检测通过，视频真正在播放');
                    isPlayingSuccessfullyRef.current = true;
                    // 注意：这里不再调用onPlayerReady，因为已经在playing事件中调用了
                  } else {
                    console.log('严格检测失败，视频可能黑屏，继续等待');
                    // 如果检测失败，继续等待或重试
                    setTimeout(() => {
                      if (!isPlayingSuccessfullyRef.current && checkVideoActuallyPlaying()) {
                        console.log('延迟检测通过，视频开始播放');
                        isPlayingSuccessfullyRef.current = true;
                        // 注意：这里不再调用onPlayerReady，因为已经在playing事件中调用了
                      } else {
                        console.log('延迟检测也失败，可能真的有问题');
                      }
                    }, 2000);
                  }
                }, 500);
                
                video.removeEventListener('loadeddata', handleVideoReady);
              };
              
              // 更严格的视频检测机制
              const checkVideoActuallyPlaying = () => {
                if (!video) return false;
                
                // 检查1：视频尺寸
                if (video.videoWidth === 0 || video.videoHeight === 0) {
                  console.log('视频尺寸检测失败：', video.videoWidth, 'x', video.videoHeight);
                  return false;
                }
                
                // 检查2：视频时长
                if (video.duration === 0 || isNaN(video.duration)) {
                  console.log('视频时长检测失败：', video.duration);
                  return false;
                }
                
                // 检查3：视频是否真的在播放
                if (video.paused) {
                  console.log('视频暂停状态检测失败');
                  return false;
                }
                
                // 检查4：使用Canvas检测像素数据
                try {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  
                  // 绘制当前视频帧到Canvas
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  
                  // 获取像素数据
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const data = imageData.data;
                  
                  // 检查是否有非黑色像素
                  let nonBlackPixels = 0;
                  let totalPixels = data.length / 4;
                  
                  for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    // 如果RGB值都大于10，认为是非黑色像素
                    if (r > 10 || g > 10 || b > 10) {
                      nonBlackPixels++;
                    }
                  }
                  
                  const blackPixelRatio = (totalPixels - nonBlackPixels) / totalPixels;
                  console.log('像素检测结果：', {
                    totalPixels,
                    nonBlackPixels,
                    blackPixelRatio: blackPixelRatio.toFixed(3)
                  });
                  
                  // 如果超过95%的像素都是黑色，认为是黑屏
                  if (blackPixelRatio > 0.95) {
                    console.log('检测到黑屏，黑色像素比例：', blackPixelRatio.toFixed(3));
                    return false;
                  }
                  
                  console.log('像素检测通过，视频有实际内容');
                } catch (error) {
                  console.log('Canvas像素检测失败：', error);
                  // Canvas检测失败时，继续其他检测
                }
                
                return true;
              };
              
              video.addEventListener('loadeddata', handleVideoReady);
              
              // 备用检测：如果5秒后还没有成功，也标记为成功
              setTimeout(() => {
                if (!isPlayingSuccessfullyRef.current) {
                  console.log('备用检测：playing事件后5秒，标记为成功');
                  isPlayingSuccessfullyRef.current = true;
                  // 注意：这里不再调用onPlayerReady，因为已经在playing事件中调用了
                }
              }, 5000);
            }
            
            // 重置重试计数
            retryCountRef.current = 0;
          })
          .on('not-allowed', () => {
            setPlayNotAllowed(true);
            console.log('sdk event: play not allowed, muted play');
          })
          .on('error', err => {
            // 如果已经成功播放，忽略错误
            if (isPlayingSuccessfullyRef.current) return;
            
            console.error('sdk event: error', err);
            setPlayNotAllowed(true);
            handleRetry();
          });
        
        try {
          player.play();
          playerRef.current = player;
        } catch (error) {
          // 如果已经成功播放，忽略错误
          if (isPlayingSuccessfullyRef.current) return;
          
          console.error('RTCPlayer播放失败:', error);
          setPlayNotAllowed(true);
          handleRetry();
        }
      }
    };
    
    if (streamInfo && streamInfo.stream_url && streamInfo.session) {
      // 重置状态
      retryCountRef.current = 0;
      isInitializedRef.current = false;
      isPlayingSuccessfullyRef.current = false; // 重置播放成功标志
      clearAllTimeouts();
      
      // 设置全局超时：12秒后如果还没有成功就显示失败
      globalTimeoutRef.current = setTimeout(() => {
        // 如果已经成功播放，不触发失败
        if (isPlayingSuccessfullyRef.current) {
          console.log('全局超时检查：已成功播放，跳过失败处理');
          return;
        }
        
        console.log('全局超时12秒，显示失败状态');
        console.log('当前状态：', {
          isPlayingSuccessfully: isPlayingSuccessfullyRef.current,
          retryCount: retryCountRef.current,
          maxRetry: maxRetry
        });
        // 确保失败状态被正确设置
        if (onPlayerFail) {
          onPlayerFail();
        }
      }, 12000); // 12秒超时
      
      tryPlay();
    }
    
    return () => {
      stopped = true;
      if (playerRef.current) {
        playerRef.current.stop();
        playerRef.current = null;
      }
      clearAllTimeouts();
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
        {/* 加载动画：虚拟人加载中且未就绪且未失败时显示 */}
        {(!avatarReady && !avatarFail && (avatarLoading || (streamInfo && streamInfo.stream_url))) && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, background: 'rgba(24,24,28,0.7)' }}>
            <div style={{ width: 72, height: 72, border: '6px solid #fff', borderTop: '6px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
            <div style={{ color: '#fff', fontSize: 14, textAlign: 'center' }}>
              {avatarLoading ? '正在启动虚拟人，请稍候...' : '正在连接虚拟人，请稍候...'}
            </div>
          </div>
        )}
        
        {/* 连接失败提示 */}
        {avatarFail && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, background: 'rgba(24,24,28,0.9)' }}>
            <div style={{ fontSize: 80, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 8, textAlign: 'center' }}>虚拟人连接失败</div>
            <div style={{ fontSize: 14, color: '#cbd5e1', marginBottom: 20, textAlign: 'center', maxWidth: 300 }}>
              请检查网络连接或刷新页面重试
            </div>
            <Button 
              type="primary" 
              onClick={() => window.location.reload()}
              style={{ fontSize: 14, padding: '8px 20px', borderRadius: 8 }}
            >
              刷新页面
            </Button>
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

  // 页面加载时直接打开摄像头，并自动启动虚拟人（不创建面试记录）
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
        
        // 2. 获取面试信息（不创建记录）
        try {
          const res = await getInterviewInfo(type);
          if (!isMounted) return;
          setQuestion(res.data.question);
          setInterviewInfo({ position: res.data.position, aiModel: res.data.aiModel });
        } catch (e) {
          // 如果获取面试信息失败，使用默认值
          setQuestion('');
          setInterviewInfo({ position: getPositionByType(type), aiModel: 'GPT-4' });
        }
        
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
        
        // 4. 开始录制视频（不依赖recordId）
        if (isMounted && mediaRecorderRef.current) {
          // 使用临时ID开始录制
          mediaRecorderRef.current.startRecording();
        }
      } catch (e) {
        showToast('面试初始化失败', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    initializeInterview();
    
    // 5. 启动计时器
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
      // 1. 停止视频录制
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stopRecording();
      }
      
      // 2. 创建面试记录（只在正常提交时创建）
      const startRes = await startInterview(type);
      const newRecordId = startRes.data.recordId;
      setRecordId(newRecordId);
      
      // 3. 上传录制的视频
      if (mediaRecorderRef.current) {
        try {
          await mediaRecorderRef.current.uploadVideo(newRecordId);
          console.log('视频上传成功');
        } catch (error) {
          console.error('视频上传失败:', error);
          // 视频上传失败不影响面试结束流程
        }
      }
      
      // 4. 结束面试（生成报告）
      console.log('结束面试，recordId:', newRecordId, 'sessionId:', streamInfo?.session, '实际时长:', interviewSeconds, '秒');
      await endInterview(newRecordId, interviewSeconds, streamInfo?.session);
      showToast('面试已结束', 'success');
      
      // 5. 清理资源
      if (userStream) {
        userStream.getTracks().forEach(track => track.stop());
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      // 自动关闭虚拟人连接
      await closeAvatarConnection();
      
      // 6. 跳转到AI评测页面，传递面试时长
      navigate(`/ai-review/${newRecordId}?duration=${interviewSeconds}`);
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
      // 构建请求参数
      const params = new URLSearchParams();
      params.append('sessionId', streamInfo.session);
      params.append('text', text);
      if (recordId) {
        params.append('interviewRecordId', recordId);
        console.log('[Interview] 发送文字消息，recordId:', recordId);
      } else {
        console.log('[Interview] 发送文字消息，recordId为空');
      }
      
      const res = await api.post(`/avatar/send?${params.toString()}`);
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
      const sessionId = streamInfo.session;
      try {
        console.log('正在关闭虚拟人连接，sessionId:', sessionId);
        await api.post(`/avatar/stop?sessionId=${sessionId}`);
        console.log('虚拟人连接已关闭，sessionId:', sessionId);
        // 清理本地状态
        setStreamInfo(null);
        setAvatarReady(false);
        setAvatarFail(false);
      } catch (error) {
        console.error('关闭虚拟人连接失败，sessionId:', sessionId, error);
        // 即使失败也要清理本地状态
        setStreamInfo(null);
        setAvatarReady(false);
        setAvatarFail(false);
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

  // 新增：页面刷新和卸载时的session清理
  useEffect(() => {
    const handleBeforeUnload = async (event) => {
      // 如果有活跃的session，尝试清理
      if (streamInfo?.session) {
        try {
          // 使用 sendBeacon 确保在页面卸载时也能发送请求
          // sendBeacon 不支持 FormData，使用 URL 参数
          const url = `/api/avatar/stop?sessionId=${encodeURIComponent(streamInfo.session)}`;
          navigator.sendBeacon(url);
          console.log('页面刷新/卸载时已清理session:', streamInfo.session);
        } catch (error) {
          console.error('页面卸载时清理session失败:', error);
        }
      }
    };

    const handleVisibilityChange = () => {
      // 当页面隐藏时（如切换到其他标签页），也尝试清理session
      if (document.hidden && streamInfo?.session) {
        console.log('页面隐藏，准备清理session:', streamInfo.session);
      }
    };

    // 监听页面刷新和卸载事件
    window.addEventListener('beforeunload', handleBeforeUnload);
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // 组件卸载时也清理session
      closeAvatarConnection();
    };
  }, [streamInfo?.session]);

  // 新增：定期检查session状态，如果页面长时间不活跃则清理
  useEffect(() => {
    let inactivityTimer = null;
    
    const resetInactivityTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      // 如果5分钟没有活动，自动清理session
      inactivityTimer = setTimeout(() => {
        if (streamInfo?.session) {
          console.log('页面长时间不活跃，自动清理session:', streamInfo.session);
          closeAvatarConnection();
        }
      }, 5 * 60 * 1000); // 5分钟
    };

    // 监听用户活动
    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    if (streamInfo?.session) {
      resetInactivityTimer();
      window.addEventListener('mousemove', handleUserActivity);
      window.addEventListener('keydown', handleUserActivity);
      window.addEventListener('click', handleUserActivity);
      window.addEventListener('scroll', handleUserActivity);
    }

    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, [streamInfo?.session]);

  // 新增：session状态检查和恢复机制
  useEffect(() => {
    let sessionCheckTimer = null;
    
    const checkSessionStatus = async () => {
      if (streamInfo?.session) {
        try {
          // 这里可以添加session状态检查逻辑
          // 例如：检查WebSocket连接状态、心跳检测等
          console.log('检查session状态:', streamInfo.session);
        } catch (error) {
          console.error('session状态检查失败:', error);
          // 如果session异常，尝试重新连接或清理
          await closeAvatarConnection();
        }
      }
    };

    if (streamInfo?.session) {
      // 每30秒检查一次session状态
      sessionCheckTimer = setInterval(checkSessionStatus, 30 * 1000);
    }

    return () => {
      if (sessionCheckTimer) {
        clearInterval(sessionCheckTimer);
      }
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
    if (recordId) {
      formData.append('interviewRecordId', recordId);
      console.log('[Interview] 发送音频消息，recordId:', recordId);
    } else {
      console.log('[Interview] 发送音频消息，recordId为空');
    }
    try {
      const res = await api.post('/avatar/audio-interact', formData, {
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

  // 获取面试类型对应的岗位名称
  const getPositionByType = (type) => {
    const positionMap = {
      'AI_ENGINEER': 'AI工程师',
      'DATA_ENGINEER': '数据工程师', 
      'IOT_ENGINEER': '物联网工程师',
      'SYSTEM_ENGINEER': '系统工程师',
      'PRODUCT_MANAGER': '产品经理'
    };
    return positionMap[type] || '技术工程师';
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
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontWeight: 500,
            fontSize: 14,
            letterSpacing: 0.5,
          }}>
            <div>⏱️ 面试时长：{formatTime(interviewSeconds)}</div>
            {/* 调试信息（开发环境显示） */}
            {process.env.NODE_ENV === 'development' && streamInfo?.session && (
              <>
                <div style={{ width: '1px', height: '20px', background: '#cbd5e1' }}></div>
                <div>🔄 {streamInfo.session.substring(0, 8)}...</div>
                <div>🎯 {avatarReady ? '已就绪' : avatarFail ? '连接失败' : '连接中'}</div>
                {avatarLoading && <div style={{ color: '#f59e0b' }}>🔄 启动中...</div>}
              </>
            )}
          </div>
          <Button type="primary" style={{ height: 40, minWidth: 120, padding: '0 24px', borderRadius: 8, fontSize: 14, fontWeight: 500 }} onClick={() => setEndModalVisible(true)} disabled={loading}>提交并结束面试</Button>
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
            avatarReady={avatarReady}
            avatarFail={avatarFail}
            onPlayerReady={() => {
              if (!avatarReady) {
                setAvatarReady(true);
                setAvatarFail(false);
                showToast('虚拟人已启动', 'success');
              }
            }}
            onPlayerFail={() => { 
              console.log('设置虚拟人失败状态');
              setAvatarFail(true); 
              setAvatarReady(false); 
              showToast('虚拟人拉流失败，请重试或检查网络', 'error');
            }}
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
              uploadUrl="/api/interview/upload-video"
              onStop={(blob) => {
                console.log('视频录制完成，文件大小:', blob.size);
              }}
            />
            {/* 音频录音区域 - 替换说话框位置 */}
            <div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>
              <AudioRecorder
                onAudioData={blob => {
                  setAudioBlob(blob);
                  handleSendAudio(blob);
                }}
              />
            </div>
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
    </div>
  );
};

export default Interview; 