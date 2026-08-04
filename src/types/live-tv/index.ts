export type TVStage =
  | 'idle'
  | 'loading'
  | 'participant'
  | 'countdown'
  | 'machine'
  | 'drawing'
  | 'winner'
  | 'confetti'
  | 'prize'
  | 'congratulations';

export interface TVParticipant {
  id: string;
  number: string;
  fullName: string;
  company: string;
  phone: string;
  email: string;
}

export interface TVPrize {
  id: string;
  name: string;
  value: string;
  icon: string;
  color: string;
}

export interface TVState {
  stage: TVStage;
  participant: TVParticipant | null;
  prize: TVPrize | null;
  countdownValue: number;
  isPlaying: boolean;
  autoStart: boolean;
}

// Socket.IO preparation - future event types
export interface TVSocketEvents {
  'tv:start': { participantId: string };
  'tv:skip': Record<string, never>;
  'tv:reset': Record<string, never>;
  'tv:set-prize': { prize: TVPrize };
}

export interface TVSocketResponses {
  'tv:state': TVState;
  'tv:stage-changed': { stage: TVStage; participant: TVParticipant | null };
}
