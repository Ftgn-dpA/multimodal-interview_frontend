import React from 'react';
import './Button.css';

const Button = ({ children, type = 'default', danger, onClick, style = {}, ...props }) => {
  let className = 'custom-btn';
  if (type === 'primary') className += ' primary';
  if (danger) className += ' danger';
  if (type === 'text') className += ' text';
  return (
    <button className={className} onClick={onClick} style={style} {...props}>
      {children}
    </button>
  );
};

export default Button; 