import { memo } from 'react';
import { motion } from 'framer-motion';

export const Floor = memo(function Floor() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 overflow-hidden">
      {/* Floor gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1120] via-[#0d1a33]/60 to-transparent" />

      {/* Floor reflection sheen */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
      </motion.div>

      {/* Moving grid on floor */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-40 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          transform: 'perspective(400px) rotateX(60deg)',
          transformOrigin: 'bottom',
        }}
        animate={{ backgroundPosition: ['0 0', '0 60px'] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
      />
    </div>
  );
});
