import React from 'react';
import { motion } from 'framer-motion';

/**
 * SkeletonLoader — src/components/layout/SkeletonLoader.jsx
 * Provides a glassmorphism shimmer effect for async data loading states.
 */
export const SkeletonLoader = ({ width = '100%', height = '150px', borderRadius = '16px', className = '' }) => {
  return (
    <motion.div
      className={`skeleton-loader ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <motion.div
        className="skeleton-shimmer"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'linear'
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)'
        }}
      />
    </motion.div>
  );
};
