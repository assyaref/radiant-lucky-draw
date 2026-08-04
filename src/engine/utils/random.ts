/**
 * Seeded Pseudo-Random Number Generator (PRNG).
 * Implements a Mulberry32 algorithm for deterministic randomness.
 * 
 * Features:
 * - Deterministic: same seed always produces same sequence
 * - next(): returns next random number [0, 1)
 * - nextFloat(min, max): returns float in range
 * - nextInt(min, max): returns integer in range
 * - shuffle(array): Fisher-Yates shuffle
 * 
 * This enables fully repeatable test scenarios.
 */
export class SeededRandom {
  private state: number;
  public readonly seed: number;

  constructor(seed: number) {
    this.seed = seed;
    this.state = seed;
  }

  /**
   * Reset the generator to its initial seed state.
   */
  reset(): void {
    this.state = this.seed;
  }

  /**
   * Generate next random number in [0, 1) range.
   * Uses Mulberry32 algorithm.
   */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generate a random float in [min, max) range.
   */
  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Generate a random integer in [min, max] range (inclusive).
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Fisher-Yates shuffle of an array (in-place).
   * Returns the shuffled array for chaining.
   */
  shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Pick a random element from an array.
   */
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  /**
   * Create a new SeededRandom with a derived seed.
   * Useful for parallel streams that need independent sequences.
   */
  derive(offset: number): SeededRandom {
    return new SeededRandom(this.seed + offset * 1000);
  }
}

/**
 * Create a seed from a string (hash-based).
 * Useful for creating deterministic seeds from participant names/IDs.
 */
export function seedFromString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Create a seed from current timestamp.
 * Useful for production (non-deterministic) draws.
 */
export function seedFromTimestamp(): number {
  return Date.now() ^ (Math.random() * 0xffffffff);
}