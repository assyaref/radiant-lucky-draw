export interface Event {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  logoUrl?: string;
  bannerUrl?: string;
  theme?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}
