/**
 * Registration API
 *
 * Client-side API integration for the public registration endpoint.
 */

import { api } from '../../api/client';

export interface RegisterParticipantRequest {
  name: string;
  phone: string;
  company: string;
  email?: string;
}

export interface RegisterParticipantResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  queueNumber: string;
  status: string;
  registeredAt: string;
  estimatedWait: number;
  currentQueue: number;
}

export async function registerParticipant(
  data: RegisterParticipantRequest,
): Promise<RegisterParticipantResponse> {
  const response = await api.post<{ success: boolean; data: RegisterParticipantResponse }>(
    '/participants/register',
    data,
  );
  return response.data;
}
