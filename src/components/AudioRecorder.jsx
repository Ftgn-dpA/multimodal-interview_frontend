import React, { useState, useRef } from 'react';
import { Button, Space, message } from 'antd';
import { AudioOutlined, StopOutlined, PlayCircleOutlined } from '@ant-design/icons';

const AudioRecorder = ({ onAudioData }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onAudioData(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      message.success('开始录音');
    } catch (error) {
      message.error('无法访问麦克风');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      message.success('录音完成');
    }
  };

  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div>
      <Space>
        {!isRecording ? (
          <Button
            type="primary"
            icon={<AudioOutlined />}
            onClick={startRecording}
            disabled={!!audioBlob}
          >
            开始录音
          </Button>
        ) : (
          <Button
            danger
            icon={<StopOutlined />}
            onClick={stopRecording}
          >
            停止录音
          </Button>
        )}
        
        {audioUrl && (
          <Button
            icon={<PlayCircleOutlined />}
            onClick={playAudio}
            disabled={isPlaying}
          >
            播放录音
          </Button>
        )}
      </Space>
      
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleAudioEnded}
          style={{ display: 'none' }}
        />
      )}
      
      {audioBlob && (
        <div style={{ marginTop: 8 }}>
          <p>录音时长: {Math.round(audioBlob.size / 1000)} KB</p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder; 