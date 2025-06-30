import React from 'react';
import './Loading.css';

const Loading = () => (
  <div className="custom-loading-mask">
    <div className="custom-loading-spinner"></div>
    <div className="custom-loading-text">加载中...</div>
  </div>
);

export default Loading; 