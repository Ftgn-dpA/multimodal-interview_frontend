import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  hoverable = false,
  variant = 'default',
  ...props 
}) => {
  const getCardClasses = () => {
    const baseClasses = 'modern-card';
    const variantClasses = {
      default: '',
      glass: 'modern-card-glass'
    };
    
    return `${baseClasses} ${variantClasses[variant]} ${className}`.trim();
  };

  if (hoverable) {
    return (
      <motion.div
        className={getCardClasses()}
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={getCardClasses()} {...props}>
      {children}
    </div>
  );
};

export default Card; 