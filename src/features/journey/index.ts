/**
 * Participant Journey Feature
 *
 * M2.2 — Complete participant journey & booth flow.
 *
 * Landing → Scan QR → Registration → Validation → Queue → Ready
 * → Lucky Draw → Winner → Claim → Restart
 *
 * Reuses existing APIs, stores, services, hooks, authentication, and the
 * M2.1 Premium Booth UI Foundation components. No business logic changes.
 */

export { JourneyProvider, useJourney } from './JourneyContext';
export type {
  JourneyStep,
  ValidationStatus,
  ValidationResult,
  ParticipantData,
  QueueInfo,
  ReadyState,
  DrawResult,
  ClaimInfo,
  JourneyState,
} from './types';

export { JourneyPage } from './JourneyPage';
export { JourneyFlow } from './JourneyFlow';

// Screens
export { LandingScreen } from './screens/LandingScreen';
export { ScanScreen } from './screens/ScanScreen';
export { RegistrationScreen } from './screens/RegistrationScreen';
export { ValidationScreen } from './screens/ValidationScreen';
export { QueueScreen } from './screens/QueueScreen';
export { ReadyScreen } from './screens/ReadyScreen';

// Shared UI
export { JourneyProgress } from './components/JourneyProgress';
export { GlassPanel } from './components/GlassPanel';
export { LoadingSkeleton } from './components/LoadingSkeleton';
