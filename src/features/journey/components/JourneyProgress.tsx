import { memo } from 'react';
import { motion } from 'framer-motion';
import { colors, shadows, transitions } from '@design-system/index';
import type { JourneyStep } from '../types';

interface JourneyProgressProps {
  currentStep: JourneyStep;
}

const STEPS: { key: JourneyStep; label: string }[] = [
  { key: 'landing', label: 'Landing' },
  { key: 'scan', label: 'Scan' },
  { key: 'registration', label: 'Registration' },
];

const STEP_INDEX: Record<JourneyStep, number> = {
  landing: 0,
  scan: 1,
  registration: 2,
  validation: 2,
  queue: 2,
  ready: 2,
  draw: 2,
  winner: 2,
  claim: 2,
  restart: 0,
};

/**
 * Animated 3-step progress indicator for the participant journey.
 * Highlights the active step with a gold glow and animated fill.
 */
export const JourneyProgress = memo(function JourneyProgress({
  currentStep,
}: JourneyProgressProps) {
  const activeIndex = STEP_INDEX[currentStep] ?? 0;

  return (
    <div className="flex w-full items-center justify-center gap-2 sm:gap-3">
      {STEPS.map((step, i) => {
        const isActive = i === activeIndex;
        const isComplete = i < activeIndex;

        return (
          <div key={step.key} className="flex items-center gap-2 sm:gap-3">
            {/* Step node */}
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                className="flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold sm:h-10 sm:w-10 sm:text-sm"
                style={{
                  borderColor:
                    isActive || isComplete ? colors.gold.DEFAULT : colors.glass.lineStrong,
                  background: isActive
                    ? colors.gradient.blueToGold
                    : isComplete
                      ? colors.glass.lighter
                      : colors.glass.light,
                  color: isActive
                    ? colors.text.inverse
                    : isComplete
                      ? colors.text.gold
                      : colors.text.tertiary,
                  boxShadow: isActive ? shadows.glow.gold.md : undefined,
                }}
                animate={isActive ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={{ repeat: isActive ? Infinity : 0, duration: 2, ease: 'easeInOut' }}
              >
                {isComplete ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </motion.div>

              <span
                className="text-[10px] font-semibold tracking-wider uppercase sm:text-xs"
                style={{
                  color: isActive
                    ? colors.text.gold
                    : isComplete
                      ? colors.text.secondary
                      : colors.text.tertiary,
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className="relative mb-5 h-0.5 w-8 overflow-hidden rounded-full sm:w-14"
                style={{ background: colors.glass.line }}
              >
                <motion.div
                  className="absolute inset-y-0 left-0"
                  style={{ background: colors.gold.DEFAULT }}
                  initial={{ width: '0%' }}
                  animate={{ width: isComplete ? '100%' : '0%' }}
                  transition={transitions.luxury()}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
