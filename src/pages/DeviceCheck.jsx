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
    const draw = () => {
      if (!analyser || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#3b82f6';
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      let isSilent = true;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (dataArray[i] !== 128) isSilent = false;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      if (isSilent) {
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('无音频输入', 60, 20);
      }
      animationId = requestAnimationFrame(draw);
    };
    if (analyser) {
      draw();
    }
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
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
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
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