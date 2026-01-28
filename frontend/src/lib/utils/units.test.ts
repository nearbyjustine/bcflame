import { describe, it, expect } from 'vitest'
import { gramsToLbs, lbsToGrams, GRAMS_PER_POUND } from './units'

describe('Unit Conversions', () => {
  describe('GRAMS_PER_POUND constant', () => {
    it('has the correct value', () => {
      expect(GRAMS_PER_POUND).toBe(453.592)
    })
  })

  describe('gramsToLbs', () => {
    it('converts 1 pound worth of grams correctly', () => {
      expect(gramsToLbs(453.592)).toBeCloseTo(1, 5)
    })

    it('converts common prebagging weights correctly', () => {
      // 3.5g = ~0.00772 P
      expect(gramsToLbs(3.5)).toBeCloseTo(0.00772, 4)
      // 7g = ~0.01543 P
      expect(gramsToLbs(7)).toBeCloseTo(0.01543, 4)
      // 14g = ~0.03086 P
      expect(gramsToLbs(14)).toBeCloseTo(0.03086, 4)
      // 28g = ~0.06173 P
      expect(gramsToLbs(28)).toBeCloseTo(0.06173, 4)
    })

    it('handles zero correctly', () => {
      expect(gramsToLbs(0)).toBe(0)
    })

    it('handles large weights correctly', () => {
      // 1000g = ~2.205 P
      expect(gramsToLbs(1000)).toBeCloseTo(2.205, 2)
    })
  })

  describe('lbsToGrams', () => {
    it('converts 1 pound to grams correctly', () => {
      expect(lbsToGrams(1)).toBeCloseTo(453.592, 2)
    })

    it('handles zero correctly', () => {
      expect(lbsToGrams(0)).toBe(0)
    })

    it('handles fractional pounds correctly', () => {
      // 0.5 P = ~226.796 g
      expect(lbsToGrams(0.5)).toBeCloseTo(226.796, 2)
    })
  })

  describe('round-trip conversions', () => {
    it('converts grams to Ps and back correctly', () => {
      const originalGrams = 14
      const Ps = gramsToLbs(originalGrams)
      const backToGrams = lbsToGrams(Ps)
      expect(backToGrams).toBeCloseTo(originalGrams, 5)
    })

    it('converts Ps to grams and back correctly', () => {
      const originalLbs = 2.5
      const grams = lbsToGrams(originalLbs)
      const backToLbs = gramsToLbs(grams)
      expect(backToLbs).toBeCloseTo(originalLbs, 5)
    })
  })
})
