import React from 'react';
import { motion } from 'framer-motion';

const Input = ({ 
  label,
  error,
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
      <motion.div
        className={error ? 'animate-shake' : ''}
        whileFocus={{ scale: 1.02 }}
        transition={{ duration: 0.1 }}
      >
        <input
          className={`modern-input ${error ? 'error' : ''} ${className}`.trim()}
          {...props}
        />
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default Input; 