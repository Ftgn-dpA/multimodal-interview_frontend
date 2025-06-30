import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  loading = false,
  disabled = false,
  onClick,
  ...props 
}) => {
  const getButtonClasses = () => {
    const baseClasses = 'modern-button';
    const variantClasses = {
      primary: 'modern-button-primary',
      secondary: 'modern-button-secondary',
      danger: 'modern-button-danger',
      ghost: 'modern-button-ghost'
    };
    const sizeClasses = {
      sm: 'modern-button-sm',
      md: 'modern-button-md',
      lg: 'modern-button-lg',
      xl: 'modern-button-xl'
    };
    
    return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();
  };

  return (
    <motion.button
      className={getButtonClasses()}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <motion.div
          className="mr-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </motion.div>
      )}
      {children}
    </motion.button>
  );
};

export default Button; 