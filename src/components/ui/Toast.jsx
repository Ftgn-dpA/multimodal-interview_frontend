import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'info', visible, onClose, duration = 2000 }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div className={`custom-toast toast-${type}`}>{message}</div>
  );
};

export default Toast; 