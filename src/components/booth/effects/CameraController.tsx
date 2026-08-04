import { memo, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CameraControllerProps {
  children?: ReactNode;
  className?: string;
}

export const CameraController = memo(function CameraController({ children, className = '' }: CameraControllerProps) {
  return (
    <motion.div
      className={`pointer-events-none absolute inset-0 ${className}`}
      animate={{
        scale: [1, 1.03, 1],
        x: [0, -10, 0],
        y: [0, -5, 0],
      }}
      transition={{
        repeat: Infinity,
        duration: 30,
        ease: 'easeInOut',
      }}
    >
      {/* Parallax layers */}
      <motion.div
        className="absolute inset-0"
        animate={{ x: [0, 15, 0] }}
        transition={{ repeat: Infinity, duration: 40, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0"
        animate={{ x: [0, -15, 0] }}
        transition={{ repeat: Infinity, duration: 45, ease: 'easeInOut' }}
      />
      {children}
    </motion.div>
  );
});
