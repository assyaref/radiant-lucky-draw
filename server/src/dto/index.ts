/**
 * DTO barrel export
 */

export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  AuthUser,
  RefreshResponse,
  MeResponse,
  SessionListResponse,
  RevokeSessionResponse,
  LogoutResponse,
} from './auth.dto';

export type {
  CreateParticipantRequest,
  UpdateParticipantRequest,
  ParticipantResponse,
} from './participant.dto';

export type { CreatePrizeRequest, UpdatePrizeRequest, PrizeResponse } from './prize.dto';

export type { CreateDrawRequest, UpdateDrawStatusRequest, DrawResponse } from './draw.dto';

export type { QueueEntryResponse, QueueStateResponse, CallNextResponse } from './queue.dto';

export type { UpdateSettingsRequest, SettingsResponse } from './settings.dto';

export type {
  BoothConfigResponse,
  PublicPrize,
  CreateBoothParticipantRequest,
  BoothParticipantResponse,
  UploadPhotoRequest,
  UploadPhotoResponse,
  SpinRequest,
  SpinResponse,
  WinnerResponse,
  UpdateClaimStatusRequest,
} from './booth.dto';
