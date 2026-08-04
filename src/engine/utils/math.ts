/**
 * Mathematical utilities for the Lucky Draw Engine.
 * Pure functions with no side effects.
 */

/**
 * Clamp a number between min and max values.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate the percentage that a value represents of a total.
 * Returns a value between 0 and 100.
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Round to a specified number of decimal places.
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate cumulative weights from an array of weights.
 * Returns an array where each element is the sum of all previous weights.
 * Used for weighted random selection.
 */
export function cumulativeWeights(weights: number[]): number[] {
  const cumulative: number[] = [];
  let sum = 0;
  for (const weight of weights) {
    sum += weight;
    cumulative.push(sum);
  }
  return cumulative;
}

/**
 * Sum all values in an array.
 */
export function sum(values: number[]): number {
  return values.reduce((acc, val) => acc + val, 0);
}

/**
 * Calculate the mean (average) of an array of values.
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}

/**
 * Check if a value is a valid positive number.
 */
export function isValidWeight(value: number): boolean {
  return typeof value === 'number' && !Number.isNaN(value) && value > 0 && Number.isFinite(value);
}

/**
 * Generate a unique identifier.
 * Uses crypto API when available, falls back to timestamp + random.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Format a timestamp to ISO string.
 */
export function timestamp(): string {
  return new Date().toISOString();
}