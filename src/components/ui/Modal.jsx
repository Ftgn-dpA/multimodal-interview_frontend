import React from 'react';
import './Modal.css';

const Modal = ({ visible, title, children, onOk, onCancel, okText = '确定', cancelText = '取消' }) => {
  if (!visible) return null;
  return (
    <div className="custom-modal-mask">
      <div className="custom-modal">
        {title && <div className="custom-modal-title">{title}</div>}
        <div className="custom-modal-content">{children}</div>
        <div className="custom-modal-footer">
          <button className="custom-btn" onClick={onCancel}>{cancelText}</button>
          <button className="custom-btn primary" onClick={onOk}>{okText}</button>
        </div>
      </div>
    </div>
  );
};

export default Modal; 