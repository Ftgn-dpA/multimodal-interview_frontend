import React, { useState, useRef } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { Title, Text } from './ui/Typography';
import { AudioOutlined, StopOutlined } from '@ant-design/icons';
import Recorder from 'recorder-js';

const AudioRecorder = ({ onAudioData }) => {
  const [isRecording, setIsRecording] = useState(false);
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
    } catch (error) {
      // 可以用全局Toast提示
    }
  };

  const stopRecording = async () => {
    if (recorderRef.current && isRecording) {
      const { blob } = await recorderRef.current.stop();
      setIsRecording(false);
      
      // 直接发送原始音频，不进行裁剪
      if (onAudioData) {
        onAudioData(blob);
      }
      
      // 清理资源
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
      
      // 重置状态，不保存音频URL和Blob
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
    <Card style={{ padding: 16, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Title level={5} style={{ marginBottom: 4, fontSize: 16 }}>音频录制</Title>
      </div>
      
      {/* 音频可视化 */}
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <canvas
          ref={canvasRef}
          width={300} 
          height={40} 
          style={{ 
            border: '1px solid #e2e8f0', 
            borderRadius: 6, 
            background: '#f8fafc' 
          }} 
        />
      </div>
      
      {/* 控制按钮 */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {!isRecording && (
          <Button 
            type="primary" 
            icon={<AudioOutlined />} 
            onClick={startRecording}
            style={{ minWidth: 140, height: 40, fontSize: 14 }}
          >
            点击说话
            </Button>
          )}
        
        {isRecording && (
          <Button 
            danger 
            icon={<StopOutlined />} 
            onClick={stopRecording}
            style={{ minWidth: 140, height: 40, fontSize: 14 }}
          >
            结束说话
          </Button>
        )}
      </div>
      
      {/* 状态提示 */}
      {isRecording && (
        <div style={{ 
          marginTop: 12, 
          textAlign: 'center', 
          color: '#ef4444', 
          fontSize: 12,
          fontWeight: 500 
        }}>
          🎤 正在录制中...
        </div>
      )}
    </Card>
  );
};

export default AudioRecorder; 