import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { getToken } from '../utils/auth';

const MediaRecorderComponent = forwardRef(({ onStop, recordId, uploadUrl }, ref) => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [stream, setStream] = useState(null);

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
      if (onStop) onStop(blob);
      if (uploadUrl && recordId) {
        const token = getToken();
        const formData = new FormData();
        formData.append('video', blob, `record_${recordId}.mp4`);
        await fetch(`${uploadUrl}/${recordId}`, {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
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

  useImperativeHandle(ref, () => ({
    startRecording,
    stopRecording
  }));

  return (
    <div style={{ display: 'none' }}>
      <video ref={videoRef} autoPlay muted style={{ width: 320, height: 240, background: '#000' }} />
      {videoUrl && <video src={videoUrl} controls style={{ width: 320, height: 240, marginTop: 8 }} />}
    </div>
  );
});

export default MediaRecorderComponent; 