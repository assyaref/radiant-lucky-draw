import { memo } from 'react';
import { AnimatedBackground } from '@components/layout';
import { colors } from '@design-system/index';
import { useJourney } from './JourneyContext';
import { JourneyFlow } from './JourneyFlow';
import { JourneyProgress } from './components/JourneyProgress';

/**
 * JourneyPage
 *
 * Container for the participant journey. Displays the animated
 * background, the step progress indicator, and the journey flow.
 */
export const JourneyPage = memo(function JourneyPage() {
  const { step } = useJourney();

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Premium animated background */}
      <AnimatedBackground />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Progress indicator */}
        <header
          className="flex w-full items-center justify-center px-4 pt-6"
          style={{ zIndex: 20 }}
        >
          <JourneyProgress currentStep={step} />
        </header>

        {/* Journey flow */}
        <main className="flex flex-1 flex-col">
          <JourneyFlow />
        </main>

        {/* Footer */}
        <footer
          className="flex w-full items-center justify-center px-4 pb-6"
          style={{ color: colors.text.tertiary }}
        >
          <p className="text-xs font-light tracking-widest uppercase">
            Radiant Lucky Draw · Participant Journey
          </p>
        </footer>
      </div>
    </div>
  );
});
