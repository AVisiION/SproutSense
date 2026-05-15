import React from 'react';
import { motion } from 'framer-motion';

/**
 * SkeletonLoader — src/components/layout/SkeletonLoader.jsx
 * Provides a glassmorphism shimmer effect for async data loading states.
 */
export const SkeletonLoader = ({ width = '100%', height = '150px', borderRadius = '16px', className = '' }) => {
  // SkeletonLoader uses CSS tokens for its glass surface and highlight.
  // The shimmer reads `--glass-highlight` which keeps the loading UI
  // consistent with the active theme without hard-coded colors.
  return (
    <motion.div
      className={`skeleton-loader ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--card-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        border: 'var(--card-border)',
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
          background: 'linear-gradient(90deg, transparent, var(--glass-highlight), transparent)'
        }}
      />
    </motion.div>
  );
};
