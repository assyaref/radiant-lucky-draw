export interface CreateBoothRequest {
  name: string;
  code: string;
  location?: string;
  eventId: string;
  operatorId?: string;
  theme?: string;
}

export interface UpdateBoothRequest {
  name?: string;
  code?: string;
  location?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  operatorId?: string;
  theme?: string;
}

export interface BoothResponse {
  id: string;
  name: string;
  code: string;
  location?: string;
  status: string;
  eventId: string;
  operatorId?: string;
  theme?: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}
