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

  // 音频静音裁剪函数
  const trimSilence = async (audioBlob) => {
    try {
      // 将 Blob 转换为 ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // 解码音频数据
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0); // 获取第一个声道
      
      // 计算音频能量阈值（可调整）
      const threshold = 0.01; // 静音阈值
      const minSilenceLength = 0.1; // 最小静音长度（秒）
      const sampleRate = audioBuffer.sampleRate;
      const minSilenceSamples = Math.floor(minSilenceLength * sampleRate);
      
      // 找到第一个非静音位置
      let startIndex = 0;
      for (let i = 0; i < channelData.length; i++) {
        if (Math.abs(channelData[i]) > threshold) {
          startIndex = i;
          break;
        }
      }
      
      // 找到最后一个非静音位置
      let endIndex = channelData.length - 1;
      for (let i = channelData.length - 1; i >= 0; i--) {
        if (Math.abs(channelData[i]) > threshold) {
          endIndex = i;
          break;
        }
      }
      
      // 确保有足够的音频数据
      if (endIndex <= startIndex) {
        console.log('音频太短，无法裁剪');
        return audioBlob;
      }
      
      // 添加一些缓冲（保留前后各0.1秒）
      const bufferSamples = Math.floor(0.1 * sampleRate);
      startIndex = Math.max(0, startIndex - bufferSamples);
      endIndex = Math.min(channelData.length - 1, endIndex + bufferSamples);
      
      // 创建新的音频缓冲区
      const trimmedLength = endIndex - startIndex + 1;
      const trimmedBuffer = audioContext.createBuffer(1, trimmedLength, sampleRate);
      const trimmedChannelData = trimmedBuffer.getChannelData(0);
      
      // 复制裁剪后的音频数据
      for (let i = 0; i < trimmedLength; i++) {
        trimmedChannelData[i] = channelData[startIndex + i];
      }
      
      // 将 AudioBuffer 转换回 Blob
      const trimmedBlob = await audioBufferToBlob(trimmedBuffer);
      
      console.log(`音频裁剪: 原始长度 ${channelData.length} 样本，裁剪后 ${trimmedLength} 样本`);
      return trimmedBlob;
      
    } catch (error) {
      console.error('音频裁剪失败:', error);
      return audioBlob; // 如果裁剪失败，返回原始音频
    }
  };
  
  // AudioBuffer 转 Blob 的辅助函数
  const audioBufferToBlob = async (audioBuffer) => {
    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    
    // 创建 WAV 格式的 ArrayBuffer
    const buffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(buffer);
    
    // WAV 文件头
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // 写入音频数据
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  };

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
      
      // 对音频进行静音裁剪
      const trimmedBlob = await trimSilence(blob);
      
      // 直接发送音频，不保存到本地状态
      if (onAudioData) {
        onAudioData(trimmedBlob);
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