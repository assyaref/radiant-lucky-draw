export interface Booth {
  id: string;
  name: string;
  code: string;
  location?: string;
  status: 'active' | 'inactive' | 'maintenance';
  eventId: string;
  operatorId?: string;
  theme?: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}
