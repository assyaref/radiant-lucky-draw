/**
 * Response Wrapper
 *
 * Standardized API response format for consistency across all endpoints.
 *
 * Success: { success: true, data, meta }
 * Error:   { success: false, error: { code, message, details } }
 */

import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: ApiResponse['meta'],
  statusCode: number = 200,
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: unknown,
): void {
  const response: ApiResponse = {
    success: false,
    error: { code, message, details },
  };
  res.status(statusCode).json(response);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
): void {
  sendSuccess(res, data, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}
