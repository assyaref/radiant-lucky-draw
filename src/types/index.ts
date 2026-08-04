export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'user';

export interface Draw {
  id: string;
  title: string;
  description?: string;
  status: DrawStatus;
  startDate: string;
  endDate: string;
  prizes: Prize[];
  participants: Participant[];
  winnerCount: number;
  createdAt: string;
  updatedAt: string;
}

export type DrawStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface Prize {
  id: string;
  name: string;
  description?: string;
  image?: string;
  quantity: number;
  tier: PrizeTier;
}

export type PrizeTier = 'gold' | 'silver' | 'bronze' | 'special';

export interface Participant {
  id: string;
  userId: string;
  drawId: string;
  ticketNumber: string;
  status: ParticipantStatus;
  joinedAt: string;
}

export type ParticipantStatus = 'registered' | 'winner' | 'redeemed';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}