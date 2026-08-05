import { motion } from 'framer-motion';
import { useRegistration } from './RegistrationContext';

export function ConfirmationScreen() {
  const { queueNumber, estimatedWait, currentQueue, status, goToStep, formData } =
    useRegistration();

  return (
    <motion.div
      className="flex min-h-screen flex-col items-center justify-center bg-[#020617] px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        <div className="h-full w-full bg-gradient-radial from-emerald-400/15 via-blue-500/8 to-transparent blur-3xl" />
      </motion.div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        {/* Success checkmark */}
        <motion.div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-lg shadow-emerald-400/25"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        >
          <motion.svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#020617"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <polyline points="20 6 9 17 4 12" />
          </motion.svg>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="mb-2 text-2xl font-black tracking-wider text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Registration Successful
        </motion.h1>

        <motion.p
          className="mb-8 text-sm font-light text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Thank you, {formData.fullName.split(' ')[0]}!
        </motion.p>

        {/* Queue Number Card */}
        <motion.div
          className="mb-6 w-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="mb-2 text-center text-xs font-bold tracking-wider text-white/30 uppercase">
            Your Queue Number
          </p>
          <motion.p
            className="text-center text-5xl font-black tracking-tight"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 10, delay: 0.5 }}
            style={{
              backgroundImage: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            #{queueNumber}
          </motion.p>
        </motion.div>

        {/* Estimated Wait */}
        <motion.div
          className="mb-8 flex w-full gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center backdrop-blur-sm">
            <p className="mb-1 text-[10px] font-bold tracking-wider text-white/30 uppercase">
              Est. Wait
            </p>
            <p className="text-lg font-black text-amber-300">{estimatedWait} min</p>
          </div>
          <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center backdrop-blur-sm">
            <p className="mb-1 text-[10px] font-bold tracking-wider text-white/30 uppercase">
              Current Queue
            </p>
            <p className="text-lg font-black text-blue-300">#{currentQueue}</p>
          </div>
          <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center backdrop-blur-sm">
            <p className="mb-1 text-[10px] font-bold tracking-wider text-white/30 uppercase">
              Status
            </p>
            <p className="text-lg font-black capitalize text-emerald-400">{status || 'Waiting'}</p>
          </div>
        </motion.div>

        {/* View Queue Button */}
        <motion.button
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 py-4 text-lg font-bold text-slate-900 shadow-lg shadow-amber-400/25"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(251,191,36,0.4)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => goToStep('waiting')}
        >
          View Queue Status
        </motion.button>
      </div>
    </motion.div>
  );
}
