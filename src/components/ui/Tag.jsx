import React from 'react';
import './Tag.css';

const Tag = ({ color = '#e5e7eb', children }) => (
  <span className="custom-tag" style={{ background: color }}>{children}</span>
);

export default Tag; 