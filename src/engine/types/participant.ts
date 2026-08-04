/**
 * Participant model for the Lucky Draw Engine.
 * Represents a draw participant eligible to win a prize.
 * Fully independent of any UI framework.
 */
export interface Participant {
  /** Unique identifier */
  id: string;
  /** Queue number / ticket number */
  number: string;
  /** Full display name */
  fullName: string;
  /** Company / organization */
  company: string;
  /** Phone number */
  phone: string;
  /** Email address */
  email: string;
  /** Whether the participant has already won a prize (prevents duplicates) */
  hasWon: boolean;
  /** Timestamp when the participant won (if any) */
  wonAt?: string;
  /** Prize ID won (if any) */
  wonPrizeId?: string;
}

/**
 * Parameters for creating a new Participant.
 * Omits runtime state fields.
 */
export interface ParticipantCreateParams {
  id: string;
  number: string;
  fullName: string;
  company: string;
  phone: string;
  email: string;
}
