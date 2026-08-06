/**
 * Winner Entity
 */

export interface Winner {
  id: string;
  drawId: string;
  participantId: string;
  prizeId: string;
  prizeTier: string;
  prizeValue: number;
  claimStatus: 'unclaimed' | 'claimed';
  claimedAt?: string;
  claimedBy?: string;
  announcedAt: string;
  createdAt: string;
  updatedAt: string;
}
