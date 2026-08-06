export interface CreateEventRequest {
  name: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status?: 'upcoming' | 'active' | 'completed' | 'cancelled';
  logoUrl?: string;
  bannerUrl?: string;
  theme?: string;
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status?: 'upcoming' | 'active' | 'completed' | 'cancelled';
  logoUrl?: string;
  bannerUrl?: string;
  theme?: string;
}

export interface EventResponse {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  logoUrl?: string;
  bannerUrl?: string;
  theme?: string;
  createdBy?: string;
  _count?: { participants: number; prizes: number; winners: number; booths: number };
  createdAt: string;
  updatedAt: string;
}
