/**
 * Participant Journey Types
 *
 * Defines the complete participant journey state machine:
 * Landing → Scan QR → Registration → Validation → Queue → Ready
 * → Lucky Draw → Winner → Claim → Restart
 */

export type JourneyStep =
  | 'landing'
  | 'scan'
  | 'registration'
  | 'validation'
  | 'queue'
  | 'ready'
  | 'draw'
  | 'winner'
  | 'claim'
  | 'restart';

export type ValidationStatus = 'idle' | 'checking' | 'passed' | 'failed';

export interface ValidationResult {
  status: ValidationStatus;
  message?: string;
  field?: 'phone' | 'email' | 'employeeId';
  duplicate?: boolean;
  blacklisted?: boolean;
}

export interface ParticipantData {
  fullName: string;
  company: string;
  phone: string;
  email: string;
  department: string;
  employeeId: string;
  agreeTerms: boolean;
}

export interface QueueInfo {
  queueNumber: string;
  estimatedWait: number;
  currentQueue: number;
  totalWaiting: number;
  status: string;
}

export interface DrawResult {
  winnerId: string;
  winnerName: string;
  winnerNumber: string;
  prizeName: string;
  prizeValue: string;
  prizeImage?: string;
  celebrationLevel: 'low' | 'medium' | 'high' | 'epic';
}

export interface ClaimInfo {
  qrCode: string;
  claimCode: string;
  instructions: string[];
}

export interface JourneyState {
  step: JourneyStep;
  participant: ParticipantData | null;
  validation: ValidationResult;
  queue: QueueInfo | null;
  draw: DrawResult | null;
  claim: ClaimInfo | null;
}
