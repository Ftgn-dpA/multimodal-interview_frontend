import React from 'react';
import './Card.css';

const Card = ({ children, style = {}, ...props }) => (
  <div className="custom-card" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', ...style }} {...props}>
    {children}
  </div>
);

export default Card; 