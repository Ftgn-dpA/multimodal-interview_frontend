import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Title, Text } from '../components/ui/Typography';
import Toast from '../components/ui/Toast';
import { showToast } from '../utils/toast';

const DeviceCheck = () => {
  const navigate = useNavigate();
  const { type } = useParams();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [audioSource, setAudioSource] = useState(null);
  const [audioActive, setAudioActive] = useState(false);
  const [videoActive, setVideoActive] = useState(false);
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  // 获取设备流
  const startDeviceCheck = async () => {
    setChecking(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaStream(stream);
      setVideoActive(true);
      // 原生Web Audio API实现音频波形
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      setAudioContext(ctx);
      const source = ctx.createMediaStreamSource(stream);
      setAudioSource(source);
      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 256;
      setAnalyser(analyserNode);
      source.connect(analyserNode);
      setAudioActive(true);
    } catch (err) {
      showToast(setToast, '请允许摄像头和麦克风权限', 'error');
      setVideoActive(false);
      setAudioActive(false);
    } finally {
      setChecking(false);
    }
  };

  // 停止设备流
  const stopDeviceCheck = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    setAudioActive(false);
    setVideoActive(false);
  };

  // 画音频波形
  useEffect(() => {
    let animationId;
    let prevDataArray = null;
    const SMOOTHING = 0.96; // 变化更慢，越大越平滑
    const draw = () => {
      if (!analyser || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);
      // 平滑处理
      if (!prevDataArray) {
        prevDataArray = new Float32Array(bufferLength);
        for (let i = 0; i < bufferLength; i++) {
          prevDataArray[i] = dataArray[i];
        }
      } else {
        for (let i = 0; i < bufferLength; i++) {
          prevDataArray[i] = prevDataArray[i] * SMOOTHING + dataArray[i] * (1 - SMOOTHING);
        }
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // 柱状条可视化（圆角柱，数量更少，宽度更大，变化更慢）
      const barCount = 16; // 柱条数量减少
      const barWidth = canvas.width / barCount * 0.7; // 宽度更大
      const barGap = canvas.width / barCount * 0.3; // 柱子间距
      const minBarHeight = canvas.height * 0.2;
      for (let i = 0; i < barCount; i++) {
        // 取每段的最大值
        const start = Math.floor(i * bufferLength / barCount);
        const end = Math.floor((i + 1) * bufferLength / barCount);
        let max = 128;
        for (let j = start; j < end; j++) {
          if (prevDataArray[j] > max) max = prevDataArray[j];
        }
        const v = max / 128.0;
        // 增大变化幅度（如放大1.6倍，最大不超过画布高度）
        let barHeight = Math.abs(v - 1) * canvas.height * 2.0;
        if (barHeight > canvas.height) barHeight = canvas.height;
        // 判断当前柱条区间是否有明显音频输入
        let isSilentBar = true;
        for (let j = start; j < end; j++) {
          if (Math.abs(prevDataArray[j] - 128) > 4) {
            isSilentBar = false;
            break;
          }
        }
        if (isSilentBar) {
          barHeight = minBarHeight;
        } else if (barHeight < minBarHeight) {
          barHeight = minBarHeight + (barHeight - minBarHeight) * 0.5; // 轻微抬高，防止动效丢失
        }
        const x = i * (barWidth + barGap);
        const y = (canvas.height - barHeight) / 2;
        ctx.fillStyle = '#3b82f6';
        const radius = Math.min(barWidth, barHeight) / 2;
        // 画圆角矩形
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + barHeight - radius);
        ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - radius, y + barHeight);
        ctx.lineTo(x + radius, y + barHeight);
        ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
      }
      animationId = requestAnimationFrame(draw);
    };
    if (analyser) {
      draw();
    }
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      prevDataArray = null;
    };
  }, [analyser]);

  // 组件卸载时关闭设备
  useEffect(() => {
    return () => {
      stopDeviceCheck();
    };
    // eslint-disable-next-line
  }, []);

  // 视频流绑定
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  const handleReady = () => {
    stopDeviceCheck();
    navigate(`/interview/${type}`);
  };

  return (
    <div className="glass-effect" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, visible: false })} />
      <Card style={{ maxWidth: 420, width: '100%', padding: 32, borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', border: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <Title level={3} style={{ color: '#1e293b', marginBottom: 8 }}>设备检测</Title>
        <Text type="secondary" style={{ fontSize: 15, marginBottom: 8 }}>请手动开启摄像头和麦克风，确保设备正常工作</Text>
        <div style={{ width: 220, height: 140, background: '#f1f5f9', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: videoActive ? '2px solid #3b82f6' : '2px dashed #e2e8f0' }}>
          {videoActive ? (
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#94a3b8', fontSize: 32 }}>📷</span>
          )}
        </div>
        <div style={{ width: 220, height: 40, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, border: audioActive ? '2px solid #3b82f6' : '2px dashed #e2e8f0' }}>
          {audioActive ? (
            <canvas ref={canvasRef} width={200} height={32} />
          ) : (
            <span style={{ color: '#94a3b8', fontSize: 24 }}>🎤</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <Button
            type="primary"
            onClick={startDeviceCheck}
            loading={checking}
            style={{ minWidth: 120, borderRadius: 10 }}
            disabled={checking || (videoActive && audioActive)}
          >
            {videoActive && audioActive ? '设备已开启' : '开启设备'}
          </Button>
          <Button
            onClick={stopDeviceCheck}
            style={{ minWidth: 100, borderRadius: 10 }}
            disabled={!videoActive && !audioActive}
          >
            关闭设备
          </Button>
        </div>
        <Button
          type="primary"
          size="large"
          style={{ 
            width: '100%', 
            marginTop: 24, 
            borderRadius: 12, 
            fontSize: 16, 
            fontWeight: 600,
            background: !(videoActive && audioActive) ? '#e5e7eb' : undefined,
            color: !(videoActive && audioActive) ? '#cbd5e1' : undefined,
            border: !(videoActive && audioActive) ? '1px solid #e5e7eb' : undefined,
            cursor: !(videoActive && audioActive) ? 'not-allowed' : undefined
          }}
          disabled={!(videoActive && audioActive)}
          onClick={handleReady}
        >
          {videoActive && audioActive ? '准备好了，进入面试' : '请开启设备'}
        </Button>
      </Card>
    </div>
  );
};

export default DeviceCheck; 