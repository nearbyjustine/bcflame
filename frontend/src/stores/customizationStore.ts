import { create } from 'zustand'
import type { PreBaggingSelection, CustomizationSelections } from '@/types/customization'

interface SelectionLimits {
  photos: { min: number; max: number }
  budStyles: { min: number; max: number }
  backgrounds: { min: number; max: number }
  fonts: { min: number; max: number }
}

interface CustomizationStore {
  // Current customization selections
  selectedPhotos: number[]
  selectedBudStyles: number[]
  selectedBackgrounds: number[]
  selectedFonts: number[]
  preBaggingSelections: PreBaggingSelection[]

  // Selection limits (from product)
  limits: SelectionLimits

  // Wizard state
  currentStep: number
  productId: number | null

  // Loading states
  isLoadingOptions: boolean

  // Actions
  initializeCustomization: (productId: number, limits: SelectionLimits) => void
  togglePhoto: (photoId: number) => void
  toggleBudStyle: (styleId: number) => void
  toggleBackground: (bgId: number) => void
  toggleFont: (fontId: number) => void
  updatePreBagging: (optionId: number, quantity: number, customText?: string) => void
  removePreBagging: (optionId: number) => void
  setStep: (step: number) => void
  validateStep: (step: number) => boolean
  resetCustomization: () => void
  getSelections: () => CustomizationSelections
  setLoadingOptions: (isLoading: boolean) => void
}

const initialState = {
  selectedPhotos: [],
  selectedBudStyles: [],
  selectedBackgrounds: [],
  selectedFonts: [],
  preBaggingSelections: [],
  limits: {
    photos: { min: 0, max: 0 },
    budStyles: { min: 0, max: 0 },
    backgrounds: { min: 0, max: 0 },
    fonts: { min: 0, max: 0 },
  },
  currentStep: 0,
  productId: null,
  isLoadingOptions: false,
}

export const useCustomizationStore = create<CustomizationStore>((set, get) => ({
  ...initialState,

  initializeCustomization: (productId, limits) => {
    set({
      productId,
      limits,
      currentStep: 0,
      selectedPhotos: [],
      selectedBudStyles: [],
      selectedBackgrounds: [],
      selectedFonts: [],
      preBaggingSelections: [],
    })
  },

  togglePhoto: (photoId) => {
    const { selectedPhotos, limits } = get()
    const isSelected = selectedPhotos.includes(photoId)

    if (isSelected) {
      // Remove if already selected
      set({ selectedPhotos: selectedPhotos.filter((id) => id !== photoId) })
    } else {
      // Add only if under max limit
      if (selectedPhotos.length < limits.photos.max) {
        set({ selectedPhotos: [...selectedPhotos, photoId] })
      }
    }
  },

  toggleBudStyle: (styleId) => {
    const { selectedBudStyles, limits } = get()
    const isSelected = selectedBudStyles.includes(styleId)

    if (isSelected) {
      // Remove if already selected
      set({ selectedBudStyles: selectedBudStyles.filter((id) => id !== styleId) })
    } else {
      // Add only if under max limit
      if (selectedBudStyles.length < limits.budStyles.max) {
        set({ selectedBudStyles: [...selectedBudStyles, styleId] })
      }
    }
  },

  toggleBackground: (bgId) => {
    const { selectedBackgrounds, limits } = get()
    const isSelected = selectedBackgrounds.includes(bgId)

    if (isSelected) {
      // Remove if already selected
      set({ selectedBackgrounds: selectedBackgrounds.filter((id) => id !== bgId) })
    } else {
      // If max is 1 (single-select), replace existing selection
      if (limits.backgrounds.max === 1) {
        set({ selectedBackgrounds: [bgId] })
      } else {
        // Add only if under max limit
        if (selectedBackgrounds.length < limits.backgrounds.max) {
          set({ selectedBackgrounds: [...selectedBackgrounds, bgId] })
        }
      }
    }
  },

  toggleFont: (fontId) => {
    const { selectedFonts, limits } = get()
    const isSelected = selectedFonts.includes(fontId)

    if (isSelected) {
      // Remove if already selected
      set({ selectedFonts: selectedFonts.filter((id) => id !== fontId) })
    } else {
      // If max is 1 (single-select), replace existing selection
      if (limits.fonts.max === 1) {
        set({ selectedFonts: [fontId] })
      } else {
        // Add only if under max limit
        if (selectedFonts.length < limits.fonts.max) {
          set({ selectedFonts: [...selectedFonts, fontId] })
        }
      }
    }
  },

  updatePreBagging: (optionId, quantity, customText) => {
    const { preBaggingSelections } = get()
    const existingIndex = preBaggingSelections.findIndex((s) => s.optionId === optionId)

    if (existingIndex !== -1) {
      // Update existing selection
      const updated = [...preBaggingSelections]
      updated[existingIndex] = { optionId, quantity, customText }
      set({ preBaggingSelections: updated })
    } else {
      // Add new selection
      set({
        preBaggingSelections: [
          ...preBaggingSelections,
          { optionId, quantity, customText },
        ],
      })
    }
  },

  removePreBagging: (optionId) => {
    const { preBaggingSelections } = get()
    set({
      preBaggingSelections: preBaggingSelections.filter((s) => s.optionId !== optionId),
    })
  },

  setStep: (step) => {
    set({ currentStep: step })
  },

  validateStep: (step) => {
    const state = get()

    switch (step) {
      case 0: // Photos
        return (
          state.selectedPhotos.length >= state.limits.photos.min &&
          state.selectedPhotos.length <= state.limits.photos.max
        )
      case 1: // Bud Styles
        return (
          state.selectedBudStyles.length >= state.limits.budStyles.min &&
          state.selectedBudStyles.length <= state.limits.budStyles.max
        )
      case 2: // Backgrounds & Fonts
        return (
          state.selectedBackgrounds.length >= state.limits.backgrounds.min &&
          state.selectedBackgrounds.length <= state.limits.backgrounds.max &&
          state.selectedFonts.length >= state.limits.fonts.min &&
          state.selectedFonts.length <= state.limits.fonts.max
        )
      case 3: // Pre-Bagging (optional, always valid)
        return true
      default:
        return false
    }
  },

  resetCustomization: () => {
    set(initialState)
  },

  getSelections: () => {
    const state = get()
    return {
      photos: state.selectedPhotos,
      budStyles: state.selectedBudStyles,
      backgrounds: state.selectedBackgrounds,
      fonts: state.selectedFonts,
      preBagging: state.preBaggingSelections,
    }
  },

  setLoadingOptions: (isLoading) => {
    set({ isLoadingOptions: isLoading })
  },
}))
