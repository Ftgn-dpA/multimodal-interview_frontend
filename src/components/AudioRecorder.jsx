import React, { useState, useRef } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { Title, Text } from './ui/Typography';
import { AudioOutlined, StopOutlined, PlayCircleOutlined, RedoOutlined } from '@ant-design/icons';
import Recorder from 'recorder-js';

const AudioRecorder = ({ onAudioData }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0); // 用于可视化

  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  // 可视化渲染
  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath();
    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    // 计算音量等级用于后续扩展
    const rms = Math.sqrt(dataArray.reduce((sum, v) => sum + (v - 128) * (v - 128), 0) / bufferLength);
    setAudioLevel(rms);
    animationRef.current = requestAnimationFrame(drawVisualizer);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      const recorder = new Recorder(audioContext, {
        numChannels: 1,
        sampleRate: 16000
      });
      recorderRef.current = recorder;
      await recorder.init(stream);
      recorder.start();
      // 可视化
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);
      animationRef.current = requestAnimationFrame(drawVisualizer);
      setIsRecording(true);
      setAudioBlob(null);
      setAudioUrl(null);
    } catch (error) {
      // 可以用全局Toast提示
    }
  };

  const stopRecording = async () => {
    if (recorderRef.current && isRecording) {
      const { blob } = await recorderRef.current.stop();
      setIsRecording(false);
      setAudioBlob(blob);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      if (onAudioData) onAudioData(blob);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  // 组件卸载时清理动画和音频流
  React.useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <Card style={{ boxShadow: 'none', padding: 16, margin: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Title level={4} style={{ marginBottom: 8, color: '#1e293b' }}>语音录制</Title>
        <Text style={{ marginBottom: 18, color: '#64748b' }}>点击下方按钮录制你的语音，录音完成后会自动发送</Text>
        <canvas
          ref={canvasRef}
          width={320}
          height={48}
          style={{ background: '#f1f5f9', borderRadius: 12, marginBottom: 18, width: 320, height: 48 }}
        />
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          {!isRecording && (
            <Button type="primary" style={{ borderRadius: 24, fontSize: 18, minWidth: 160 }} onClick={startRecording}>
              <AudioOutlined style={{ marginRight: 8 }} /> 点击说话
            </Button>
          )}
          {isRecording && (
            <Button danger style={{ borderRadius: 24, fontSize: 18, minWidth: 160 }} onClick={stopRecording}>
              <StopOutlined style={{ marginRight: 8 }} /> 结束说话
            </Button>
          )}
        </div>
        {isRecording && (
          <Text type="secondary" style={{ color: '#ef4444', fontWeight: 600, marginBottom: 8 }}>● 正在录音，请说话...</Text>
        )}
      </div>
    </Card>
  );
};

export default AudioRecorder; 