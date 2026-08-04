/**
 * LiveEventEngine - Live Event Experience
 * Composite component that renders all engine overlays together.
 * Wraps the provider and renders the idle, demo, attract, and event overlays.
 */
import { memo, type ReactNode } from 'react';
import { LiveEventEngineProvider } from './LiveEventEngine';
import { IdleSceneOverlay } from './IdleSceneOverlay';
import { DemoSequenceOverlay } from './DemoSequenceOverlay';
import { AttractFlashOverlay } from './AttractFlashOverlay';
import { EventSequenceOverlay } from './EventSequenceOverlay';
import type { EngineConfig } from './types';

interface LiveEventExperienceProps {
  children: ReactNode;
  config?: Partial<EngineConfig>;
  onEventStart?: () => void;
  onEventComplete?: () => void;
}

/**
 * Full Live Event Experience wrapper.
 * Provides the engine context and renders all cinematic overlays.
 */
export const LiveEventExperience = memo(function LiveEventExperience({
  children,
  config,
  onEventStart,
  onEventComplete,
}: LiveEventExperienceProps) {
  return (
    <LiveEventEngineProvider
      config={config}
      onEventStart={onEventStart}
      onEventComplete={onEventComplete}
    >
      {children}
      {/* Idle scene attraction loop */}
      <IdleSceneOverlay />
      {/* Grand prize flash every 15s */}
      <AttractFlashOverlay />
      {/* Simulated draw every 45s */}
      <DemoSequenceOverlay />
      {/* Live event draw (interrupts idle) */}
      <EventSequenceOverlay />
    </LiveEventEngineProvider>
  );
});
