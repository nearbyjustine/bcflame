import { describe, it, expect, beforeEach } from 'vitest'
import { useCustomizationStore } from './customizationStore'
import type { PreBaggingSelection } from '@/types/customization'

describe('customizationStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCustomizationStore.getState().resetCustomization()
  })

  it('should have initial empty state', () => {
    const state = useCustomizationStore.getState()

    expect(state.selectedPhotos).toEqual([])
    expect(state.selectedBudStyles).toEqual([])
    expect(state.selectedBackgrounds).toEqual([])
    expect(state.selectedFonts).toEqual([])
    expect(state.preBaggingSelections).toEqual([])
    expect(state.currentStep).toBe(0)
    expect(state.productId).toBeNull()
    expect(state.isLoadingOptions).toBe(false)
  })

  it('should initialize customization with product ID and limits', () => {
    const limits = {
      photos: { min: 3, max: 5 },
      budStyles: { min: 2, max: 4 },
      backgrounds: { min: 1, max: 2 },
      fonts: { min: 1, max: 1 },
    }

    useCustomizationStore.getState().initializeCustomization(123, limits)

    const state = useCustomizationStore.getState()
    expect(state.productId).toBe(123)
    expect(state.limits).toEqual(limits)
    expect(state.currentStep).toBe(0)
  })

  describe('Photo selection', () => {
    beforeEach(() => {
      useCustomizationStore.getState().initializeCustomization(1, {
        photos: { min: 2, max: 4 },
        budStyles: { min: 1, max: 3 },
        backgrounds: { min: 1, max: 2 },
        fonts: { min: 1, max: 1 },
      })
    })

    it('should add photo when under max limit', () => {
      useCustomizationStore.getState().togglePhoto(1)
      expect(useCustomizationStore.getState().selectedPhotos).toEqual([1])

      useCustomizationStore.getState().togglePhoto(2)
      expect(useCustomizationStore.getState().selectedPhotos).toEqual([1, 2])
    })

    it('should remove photo if already selected', () => {
      useCustomizationStore.getState().togglePhoto(1)
      useCustomizationStore.getState().togglePhoto(2)
      expect(useCustomizationStore.getState().selectedPhotos).toEqual([1, 2])

      useCustomizationStore.getState().togglePhoto(1)
      expect(useCustomizationStore.getState().selectedPhotos).toEqual([2])
    })

    it('should NOT add photo if at max limit', () => {
      // Add up to max (4)
      useCustomizationStore.getState().togglePhoto(1)
      useCustomizationStore.getState().togglePhoto(2)
      useCustomizationStore.getState().togglePhoto(3)
      useCustomizationStore.getState().togglePhoto(4)
      expect(useCustomizationStore.getState().selectedPhotos).toEqual([1, 2, 3, 4])

      // Try to add 5th photo (should be ignored)
      useCustomizationStore.getState().togglePhoto(5)
      expect(useCustomizationStore.getState().selectedPhotos).toEqual([1, 2, 3, 4])
    })
  })

  describe('Step validation', () => {
    beforeEach(() => {
      useCustomizationStore.getState().initializeCustomization(1, {
        photos: { min: 2, max: 4 },
        budStyles: { min: 1, max: 3 },
        backgrounds: { min: 1, max: 2 },
        fonts: { min: 1, max: 1 },
      })
    })

    it('should return false if below minimum selections for step 0 (photos)', () => {
      // Add only 1 photo (min is 2)
      useCustomizationStore.getState().togglePhoto(1)
      expect(useCustomizationStore.getState().validateStep(0)).toBe(false)
    })

    it('should return true if within min/max range for step 0 (photos)', () => {
      // Add 2 photos (min is 2, max is 4)
      useCustomizationStore.getState().togglePhoto(1)
      useCustomizationStore.getState().togglePhoto(2)
      expect(useCustomizationStore.getState().validateStep(0)).toBe(true)
    })

    it('should return false if below minimum selections for step 1 (bud styles)', () => {
      // Add 0 bud styles (min is 1)
      expect(useCustomizationStore.getState().validateStep(1)).toBe(false)
    })

    it('should return true if within min/max range for step 1 (bud styles)', () => {
      // Add 2 bud styles (min is 1, max is 3)
      useCustomizationStore.getState().toggleBudStyle(1)
      useCustomizationStore.getState().toggleBudStyle(2)
      expect(useCustomizationStore.getState().validateStep(1)).toBe(true)
    })

    it('should return false if below minimum for step 2 (backgrounds and fonts)', () => {
      // Add 0 backgrounds (min is 1)
      expect(useCustomizationStore.getState().validateStep(2)).toBe(false)

      // Add 1 background but 0 fonts (font min is 1)
      useCustomizationStore.getState().toggleBackground(1)
      expect(useCustomizationStore.getState().validateStep(2)).toBe(false)
    })

    it('should return true if both backgrounds and fonts meet requirements for step 2', () => {
      useCustomizationStore.getState().toggleBackground(1)
      useCustomizationStore.getState().toggleFont(1)
      expect(useCustomizationStore.getState().validateStep(2)).toBe(true)
    })

    it('should always return true for step 3 (pre-bagging is optional)', () => {
      expect(useCustomizationStore.getState().validateStep(3)).toBe(true)
    })
  })

  describe('Pre-bagging selections', () => {
    it('should add pre-bagging selection with quantity and custom text', () => {
      useCustomizationStore.getState().updatePreBagging(1, 10, 'Custom branding')

      const selections = useCustomizationStore.getState().preBaggingSelections
      expect(selections).toHaveLength(1)
      expect(selections[0]).toEqual({
        optionId: 1,
        quantity: 10,
        customText: 'Custom branding'
      })
    })

    it('should update existing pre-bagging selection', () => {
      useCustomizationStore.getState().updatePreBagging(1, 10, 'First')
      useCustomizationStore.getState().updatePreBagging(1, 20, 'Updated')

      const selections = useCustomizationStore.getState().preBaggingSelections
      expect(selections).toHaveLength(1)
      expect(selections[0]).toEqual({
        optionId: 1,
        quantity: 20,
        customText: 'Updated'
      })
    })

    it('should remove pre-bagging selection', () => {
      useCustomizationStore.getState().updatePreBagging(1, 10)
      useCustomizationStore.getState().updatePreBagging(2, 5)
      expect(useCustomizationStore.getState().preBaggingSelections).toHaveLength(2)

      useCustomizationStore.getState().removePreBagging(1)
      const selections = useCustomizationStore.getState().preBaggingSelections
      expect(selections).toHaveLength(1)
      expect(selections[0].optionId).toBe(2)
    })
  })

  describe('Step navigation', () => {
    it('should update current step', () => {
      useCustomizationStore.getState().setStep(2)
      expect(useCustomizationStore.getState().currentStep).toBe(2)

      useCustomizationStore.getState().setStep(1)
      expect(useCustomizationStore.getState().currentStep).toBe(1)
    })
  })

  describe('Reset functionality', () => {
    it('should clear all selections and reset to initial state', () => {
      // Setup some selections
      useCustomizationStore.getState().initializeCustomization(123, {
        photos: { min: 1, max: 5 },
        budStyles: { min: 1, max: 3 },
        backgrounds: { min: 1, max: 2 },
        fonts: { min: 1, max: 1 },
      })
      useCustomizationStore.getState().togglePhoto(1)
      useCustomizationStore.getState().toggleBudStyle(1)
      useCustomizationStore.getState().setStep(2)

      // Reset
      useCustomizationStore.getState().resetCustomization()

      // Verify reset
      const state = useCustomizationStore.getState()
      expect(state.selectedPhotos).toEqual([])
      expect(state.selectedBudStyles).toEqual([])
      expect(state.selectedBackgrounds).toEqual([])
      expect(state.selectedFonts).toEqual([])
      expect(state.preBaggingSelections).toEqual([])
      expect(state.currentStep).toBe(0)
      expect(state.productId).toBeNull()
    })
  })

  describe('getSelections', () => {
    it('should return CustomizationSelections object for API', () => {
      useCustomizationStore.getState().initializeCustomization(123, {
        photos: { min: 1, max: 5 },
        budStyles: { min: 1, max: 3 },
        backgrounds: { min: 1, max: 2 },
        fonts: { min: 1, max: 1 },
      })

      useCustomizationStore.getState().togglePhoto(1)
      useCustomizationStore.getState().togglePhoto(2)
      useCustomizationStore.getState().toggleBudStyle(3)
      useCustomizationStore.getState().toggleBackground(4)
      useCustomizationStore.getState().toggleFont(5)
      useCustomizationStore.getState().updatePreBagging(1, 10, 'Custom')

      const selections = useCustomizationStore.getState().getSelections()

      expect(selections).toEqual({
        photos: [1, 2],
        budStyles: [3],
        backgrounds: [4],
        fonts: [5],
        preBagging: [{ optionId: 1, quantity: 10, customText: 'Custom' }]
      })
    })
  })

  describe('Background and Font toggles (single-select behavior)', () => {
    beforeEach(() => {
      useCustomizationStore.getState().initializeCustomization(1, {
        photos: { min: 1, max: 5 },
        budStyles: { min: 1, max: 3 },
        backgrounds: { min: 1, max: 1 }, // Single select
        fonts: { min: 1, max: 1 }, // Single select
      })
    })

    it('should replace background when max is 1 (single-select)', () => {
      useCustomizationStore.getState().toggleBackground(1)
      expect(useCustomizationStore.getState().selectedBackgrounds).toEqual([1])

      useCustomizationStore.getState().toggleBackground(2)
      expect(useCustomizationStore.getState().selectedBackgrounds).toEqual([2])
    })

    it('should replace font when max is 1 (single-select)', () => {
      useCustomizationStore.getState().toggleFont(1)
      expect(useCustomizationStore.getState().selectedFonts).toEqual([1])

      useCustomizationStore.getState().toggleFont(2)
      expect(useCustomizationStore.getState().selectedFonts).toEqual([2])
    })

    it('should remove background if clicking same one when max is 1', () => {
      useCustomizationStore.getState().toggleBackground(1)
      expect(useCustomizationStore.getState().selectedBackgrounds).toEqual([1])

      useCustomizationStore.getState().toggleBackground(1)
      expect(useCustomizationStore.getState().selectedBackgrounds).toEqual([])
    })
  })
})
