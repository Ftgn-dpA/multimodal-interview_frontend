import React from 'react';
import './EmptyState.css';

const EmptyState = ({ text = '暂无数据', buttonText, onButtonClick }) => (
  <div className="custom-empty-state">
    <div className="custom-empty-icon">😕</div>
    <div className="custom-empty-text">{text}</div>
    {buttonText && (
      <button className="custom-btn primary" onClick={onButtonClick}>{buttonText}</button>
    )}
  </div>
);

export default EmptyState; 