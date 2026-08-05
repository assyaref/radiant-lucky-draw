/**
 * JourneyContext
 *
 * Manages the complete participant journey state machine:
 * Landing → Scan QR → Registration → Validation → Queue → Ready
 * → Lucky Draw → Winner → Claim → Restart
 *
 * Reuses existing APIs, stores, and services. No business logic changes.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { registerParticipant } from '../registration/api';
import { queueApi } from '../../api/queue';
import { ApiClientError } from '../../api/client';
import type {
  JourneyStep,
  ParticipantData,
  ValidationResult,
  QueueInfo,
  DrawResult,
  ClaimInfo,
  ReadyState,
} from './types';

interface JourneyContextValue {
  step: JourneyStep;
  participant: ParticipantData | null;
  validation: ValidationResult;
  queue: QueueInfo | null;
  draw: DrawResult | null;
  claim: ClaimInfo | null;
  isSubmitting: boolean;
  submitError: string | null;

  // M2.2B extended state (aliases + ready state)
  validationResult: ValidationResult;
  queueInfo: QueueInfo | null;
  readyState: ReadyState;

  // Navigation
  goTo: (step: JourneyStep) => void;
  restart: () => void;

  // Registration
  setParticipant: (data: ParticipantData) => void;
  submitRegistration: (data: ParticipantData) => Promise<boolean>;

  // Validation
  validateParticipant: (data: ParticipantData) => Promise<ValidationResult>;

  // Queue
  setQueueInfo: (info: QueueInfo) => void;

  // Ready
  setReadyState: (state: ReadyState) => void;

  // Draw
  setDrawResult: (result: DrawResult) => void;

  // Claim
  setClaimInfo: (info: ClaimInfo) => void;
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error('useJourney must be used within JourneyProvider');
  return ctx;
}

const INITIAL_VALIDATION: ValidationResult = { status: 'idle' };

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<JourneyStep>('landing');
  const [participant, setParticipantState] = useState<ParticipantData | null>(null);
  const [validation, setValidation] = useState<ValidationResult>(INITIAL_VALIDATION);
  const [queue, setQueueState] = useState<QueueInfo | null>(null);
  const [draw, setDrawState] = useState<DrawResult | null>(null);
  const [claim, setClaimState] = useState<ClaimInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [readyState, setReadyStateState] = useState<ReadyState>('idle');

  const goTo = useCallback((s: JourneyStep) => {
    setStep(s);
  }, []);

  const restart = useCallback(() => {
    setStep('landing');
    setParticipantState(null);
    setValidation(INITIAL_VALIDATION);
    setQueueState(null);
    setDrawState(null);
    setClaimState(null);
    setSubmitError(null);
    setReadyStateState('idle');
  }, []);

  const setParticipant = useCallback((data: ParticipantData) => {
    setParticipantState(data);
  }, []);

  const setQueueInfo = useCallback((info: QueueInfo) => {
    setQueueState(info);
  }, []);

  const setReadyState = useCallback((state: ReadyState) => {
    setReadyStateState(state);
  }, []);

  const setDrawResult = useCallback((result: DrawResult) => {
    setDrawState(result);
  }, []);

  const setClaimInfo = useCallback((info: ClaimInfo) => {
    setClaimState(info);
  }, []);

  /**
   * Validate participant for duplicates and blacklist.
   * Uses the existing registration API which returns CONFLICT for duplicates.
   */
  const validateParticipant = useCallback(
    async (data: ParticipantData): Promise<ValidationResult> => {
      setValidation({ status: 'checking' });

      // Simulate realtime validation delay for UX
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Client-side format checks
      if (data.phone && !/^[+]?[\d\s()-]{8,15}$/.test(data.phone.trim())) {
        const result: ValidationResult = {
          status: 'failed',
          field: 'phone',
          message: 'Invalid phone number format',
        };
        setValidation(result);
        return result;
      }

      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        const result: ValidationResult = {
          status: 'failed',
          field: 'email',
          message: 'Invalid email format',
        };
        setValidation(result);
        return result;
      }

      // Blacklist simulation (common blocked numbers)
      const BLACKLISTED_PHONES = ['0000000000', '1111111111', '9999999999'];
      if (BLACKLISTED_PHONES.includes(data.phone.replace(/\D/g, ''))) {
        const result: ValidationResult = {
          status: 'failed',
          field: 'phone',
          message: 'This phone number is not eligible to participate.',
          blacklisted: true,
        };
        setValidation(result);
        return result;
      }

      const result: ValidationResult = { status: 'passed' };
      setValidation(result);
      return result;
    },
    [],
  );

  /**
   * Submit registration via the existing registration API.
   * On success, fetches queue state and transitions to queue step.
   */
  const submitRegistration = useCallback(async (data: ParticipantData): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await registerParticipant({
        name: data.fullName.trim(),
        phone: data.phone.trim(),
        company: data.company.trim(),
        email: data.email.trim() || undefined,
      });

      setParticipantState(data);

      // Fetch queue state to get current queue info
      try {
        const queueState = await queueApi.getState();
        const queueInfo: QueueInfo = {
          queueNumber: result.queueNumber,
          estimatedWait: result.estimatedWait ?? queueState.data.estimatedWait,
          currentQueue: result.currentQueue ?? 0,
          totalWaiting: queueState.data.totalWaiting,
          status: result.status ?? 'waiting',
        };
        setQueueState(queueInfo);
      } catch {
        // Fallback to registration response data
        setQueueState({
          queueNumber: result.queueNumber,
          estimatedWait: result.estimatedWait,
          currentQueue: result.currentQueue,
          totalWaiting: 0,
          status: result.status,
        });
      }

      setIsSubmitting(false);
      setStep('queue');
      return true;
    } catch (err) {
      setIsSubmitting(false);
      if (err instanceof ApiClientError) {
        setSubmitError(mapApiError(err));
      } else {
        setSubmitError('An unexpected error occurred. Please try again.');
      }
      return false;
    }
  }, []);

  return (
    <JourneyContext.Provider
      value={{
        step,
        participant,
        validation,
        queue,
        draw,
        claim,
        isSubmitting,
        submitError,
        // M2.2B extended state
        validationResult: validation,
        queueInfo: queue,
        readyState,
        goTo,
        restart,
        setParticipant,
        submitRegistration,
        validateParticipant,
        setQueueInfo,
        setReadyState,
        setDrawResult,
        setClaimInfo,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
}

function mapApiError(err: ApiClientError): string {
  switch (err.code) {
    case 'CONFLICT':
      return 'This phone number is already registered.';
    case 'VALIDATION_ERROR':
      return err.message || 'Please check your details and try again.';
    case 'NETWORK_ERROR':
      return 'Network unavailable. Please check your connection and try again.';
    case 'TIMEOUT':
      return 'The request timed out. Please try again.';
    case 'RATE_LIMIT':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      if (err.status === 400) return err.message || 'Registration is closed.';
      if (err.status >= 500) return 'Server error. Please try again later.';
      return err.message || 'Unable to register. Please try again.';
  }
}
