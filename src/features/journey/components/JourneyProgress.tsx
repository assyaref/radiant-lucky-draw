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
  { key: 'validation', label: 'Validation' },
  { key: 'queue', label: 'Queue' },
  { key: 'ready', label: 'Ready' },
  { key: 'draw', label: 'Draw' },
  { key: 'winner', label: 'Winner' },
  { key: 'claim', label: 'Claim' },
];

const STEP_INDEX: Record<JourneyStep, number> = {
  landing: 0,
  scan: 1,
  registration: 2,
  validation: 3,
  queue: 4,
  ready: 5,
  draw: 6,
  winner: 7,
  claim: 8,
  restart: 0,
};

/**
 * Animated 9-step progress indicator for the participant journey.
 * Highlights the active step with a gold glow and animated fill.
 * Connectors animate from left to right as the participant advances.
 */
export const JourneyProgress = memo(function JourneyProgress({
  currentStep,
}: JourneyProgressProps) {
  const activeIndex = STEP_INDEX[currentStep] ?? 0;

  return (
    <div className="flex w-full items-center justify-center gap-1.5 sm:gap-2">
      {STEPS.map((step, i) => {
        const isActive = i === activeIndex;
        const isComplete = i < activeIndex;

        return (
          <div key={step.key} className="flex items-center gap-1.5 sm:gap-2">
            {/* Step node */}
            <div className="flex flex-col items-center gap-1">
              <motion.div
                className="flex h-8 w-8 items-center justify-center rounded-full border text-[0.65rem] font-bold sm:h-9 sm:w-9 sm:text-xs"
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
                    width="14"
                    height="14"
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
                className="text-[0.55rem] font-semibold tracking-wider uppercase sm:text-[0.65rem]"
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
                className="relative mb-4 h-0.5 w-5 overflow-hidden rounded-full sm:w-10"
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
