/**
 * Unit conversion utilities for weight measurements
 */

/** Number of grams in one pound */
export const GRAMS_PER_POUND = 453.592

/**
 * Convert grams to pounds
 * @param grams - Weight in grams
 * @returns Weight in pounds
 */
export function gramsToLbs(grams: number): number {
  return grams / GRAMS_PER_POUND
}

/**
 * Convert pounds to grams
 * @param lbs - Weight in pounds
 * @returns Weight in grams
 */
export function lbsToGrams(lbs: number): number {
  return lbs * GRAMS_PER_POUND
}
