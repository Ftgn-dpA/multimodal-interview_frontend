import React from 'react';
import './Typography.css';

export const Title = ({ level = 1, children, style = {} }) => {
  const Tag = `h${level}`;
  return <Tag className={`custom-title custom-title-${level}`} style={style}>{children}</Tag>;
};

export const Text = ({ type, strong, children, style = {} }) => {
  let className = 'custom-text';
  if (type === 'secondary') className += ' secondary';
  if (strong) className += ' strong';
  return <span className={className} style={style}>{children}</span>;
};

export const Paragraph = ({ children, style = {} }) => (
  <p className="custom-paragraph" style={style}>{children}</p>
); 