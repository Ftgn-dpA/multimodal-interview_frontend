import React from 'react';
import { motion } from 'framer-motion';

const Input = ({ 
  label,
  error,
  iconLeft,
  className = '',
  ...props 
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="input-wrapper">
        {iconLeft && (
          <>
            <span className="input-icon-left">{iconLeft}</span>
            <span className="input-icon-divider" />
          </>
        )}
        <input
          className={`modern-input ${error ? 'error' : ''} ${iconLeft ? 'input-has-icon' : ''} ${className}`.trim()}
          {...props}
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default Input; 