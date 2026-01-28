/**
 * Unit conversion utilities for weight measurements
 */

/** Number of grams in one pound */
export const GRAMS_PER_POUND = 453.592

/** Weight unit symbol (e.g., for API calls, fallbacks) */
export const WEIGHT_UNIT = 'P'

/** Weight unit display with slash (e.g., "/P" for price displays) */
export const WEIGHT_UNIT_DISPLAY = '/P'

/** Half weight unit display with slash (e.g., "/0.5P" for half-pound pricing) */
export const HALF_WEIGHT_UNIT_DISPLAY = '/0.5P'

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
