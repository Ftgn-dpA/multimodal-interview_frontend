import React from 'react';
import './Progress.css';

const Progress = ({ percent = 0, color = '#3b82f6', showInfo = false }) => (
  <div className="custom-progress-bar">
    <div className="custom-progress-inner" style={{ width: `${percent}%`, background: color }} />
    {showInfo && <span className="custom-progress-info">{percent}%</span>}
  </div>
);

export default Progress; 