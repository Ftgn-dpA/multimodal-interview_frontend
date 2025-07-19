import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { getToken } from '../utils/auth';

const MediaRecorderComponent = forwardRef(({ onStop, recordId, uploadUrl }, ref) => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [stream, setStream] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);

  const startRecording = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setStream(mediaStream);
    videoRef.current.srcObject = mediaStream;
    const recorder = new window.MediaRecorder(mediaStream);
    let chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'video/mp4' });
      setVideoUrl(URL.createObjectURL(blob));
      setRecordedBlob(blob); // 保存录制的blob
      if (onStop) onStop(blob);
      // 不在这里上传，等待手动调用uploadVideo
      mediaStream.getTracks().forEach(track => track.stop());
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const uploadVideo = async (newRecordId) => {
    if (recordedBlob && uploadUrl && newRecordId) {
      try {
        const token = getToken();
        const formData = new FormData();
        formData.append('video', recordedBlob, `record_${newRecordId}.mp4`);
        const response = await fetch(`${uploadUrl}/${newRecordId}`, {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          console.error('视频上传失败:', response.status, response.statusText);
          throw new Error('视频上传失败');
        } else {
          console.log('视频上传成功');
          return true;
        }
      } catch (error) {
        console.error('视频上传异常:', error);
        throw error;
      }
    } else {
      console.log('没有录制的视频或缺少recordId，跳过上传');
      return false;
    }
  };

  useImperativeHandle(ref, () => ({
    startRecording,
    stopRecording,
    uploadVideo
  }));

  return (
    <div style={{ display: 'none' }}>
      <video ref={videoRef} autoPlay muted style={{ width: 320, height: 240, background: '#000' }} />
      {videoUrl && <video src={videoUrl} controls style={{ width: 320, height: 240, marginTop: 8 }} />}
    </div>
  );
});

export default MediaRecorderComponent; 