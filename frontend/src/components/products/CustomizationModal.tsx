'use client'

import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, ShoppingCart, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { getImageUrl, getImageName } from '@/lib/utils/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useCustomizationStore } from '@/stores/customizationStore'
import { useAuthStore } from '@/stores/authStore'
import StepIndicator from './StepIndicator'
import PhotoSelectionGrid from './PhotoSelectionGrid'
import BudStyleSelector from './BudStyleSelector'
import BackgroundFontSelector from './BackgroundFontSelector'
import PreBaggingConfig from './PreBaggingConfig'
import { OrderConfirmationModal } from './OrderConfirmationModal'
import {
  getBudStyles,
  getBackgroundStyles,
  getFontStyles,
  getPreBaggingOptions,
  submitOrderInquiry,
} from '@/lib/api/customization'
import type { Product } from '@/types/product'
import type {
  BudStyle,
  BackgroundStyle,
  FontStyle,
  PreBaggingOption,
} from '@/types/customization'
import { useCartStore } from '@/stores/cartStore'
import { gramsToLbs } from '@/lib/utils/units'

interface CustomizationModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product
}

const STEP_LABELS = ['Photos', 'Bud Style', 'Background & Font', 'Pre-Bagging']

export function CustomizationModal({ isOpen, onClose, product }: CustomizationModalProps) {
  const user = useAuthStore((state) => state.user)

  // Customization store
  const {
    currentStep,
    selectedPhotos,
    selectedBudStyles,
    selectedBackgrounds,
    selectedFonts,
    preBaggingSelections,
    limits,
    initializeCustomization,
    togglePhoto,
    toggleBudStyle,
    toggleBackground,
    toggleFont,
    updatePreBagging,
    removePreBagging,
    setStep,
    validateStep,
    resetCustomization,
    getSelections,
  } = useCustomizationStore()

  // Customization options
  const [budStyles, setBudStyles] = useState<BudStyle[]>([])
  const [backgrounds, setBackgrounds] = useState<BackgroundStyle[]>([])
  const [fonts, setFonts] = useState<FontStyle[]>([])
  const [preBaggingOptions, setPreBaggingOptions] = useState<PreBaggingOption[]>([])

  // Loading states
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Order confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  // Cart store
  const addToCart = useCartStore((state) => state.addItem)

  // Load customization options when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCustomizationOptions()
      initializeCustomizationSession()
    } else {
      // Reset when modal closes
      resetCustomization()
    }
  }, [isOpen])

  const initializeCustomizationSession = () => {
    // Parse selection limits from product
    const selectionLimits = product.attributes.selection_limits || []

    const parsedLimits = {
      photos: { min: 0, max: 7 },
      budStyles: { min: 0, max: 4 },
      backgrounds: { min: 0, max: 1 },
      fonts: { min: 0, max: 1 },
    }

    selectionLimits.forEach((limit) => {
      // Map the schema field names (min_selections, max_selections) to our expected names (min, max)
      const minValue = limit.min_selections ?? limit.min ?? 0
      const maxValue = limit.max_selections ?? limit.max ?? 5

      if (limit.option_type === 'photos') {
        parsedLimits.photos = { min: minValue, max: maxValue }
      } else if (limit.option_type === 'bud_styles' || limit.option_type === 'budStyles') {
        parsedLimits.budStyles = { min: minValue, max: maxValue }
      } else if (limit.option_type === 'backgrounds') {
        parsedLimits.backgrounds = { min: minValue, max: maxValue }
      } else if (limit.option_type === 'fonts') {
        parsedLimits.fonts = { min: minValue, max: maxValue }
      }
    })

    console.log('Initialized customization with limits:', parsedLimits)

    initializeCustomization(product.id, parsedLimits)
  }

  const loadCustomizationOptions = async () => {
    setIsLoadingOptions(true)

    try {
      const [budStylesRes, backgroundsRes, fontsRes, preBaggingRes] = await Promise.all([
        getBudStyles(),
        getBackgroundStyles(),
        getFontStyles(),
        getPreBaggingOptions(),
      ])

      // const ALLOWED_BUD_STYLES = ['1 Bud Style', '2 Bud Style', '3 Bud Style', '4 Bud Style']
      setBudStyles(budStylesRes)
      setBackgrounds(backgroundsRes)
      setFonts(fontsRes)
      setPreBaggingOptions(preBaggingRes)
    } catch (err) {
      console.error('Error loading customization options:', err)
      toast.error('Failed to load customization options', {
        description: 'Please try again or contact support if the issue persists.'
      })
    } finally {
      setIsLoadingOptions(false)
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1)
    }
  }

  // Calculate price and weight from selections
  const calculatePriceAndWeight = () => {
    // Calculate total weight from pre-bagging selections (in the unit specified by unitSizeUnit)
    const totalWeight = preBaggingSelections.reduce((sum, selection) => {
      return sum + (selection.quantity * selection.unitSize)
    }, 0)
    const weightUnit = preBaggingSelections[0]?.unitSizeUnit || 'g'

    // Calculate price - use base_price_per_pound if available, otherwise first pricing tier
    let unitPrice = 0
    if (product.attributes.base_price_per_pound) {
      // Convert weight to pounds for price calculation if weight is in grams
      if (weightUnit === 'g') {
        const weightInPounds = gramsToLbs(totalWeight)
        unitPrice = product.attributes.base_price_per_pound * weightInPounds
      } else {
        // Weight is already in pounds
        unitPrice = product.attributes.base_price_per_pound * totalWeight
      }
    } else if (product.attributes.pricing && product.attributes.pricing.length > 0) {
      unitPrice = product.attributes.pricing[0].amount || 0
    }

    return { unitPrice, totalWeight, weightUnit }
  }

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Authentication required', {
        description: 'You must be logged in to add items to cart'
      })
      return
    }

    const selections = getSelections()
    const { unitPrice, totalWeight, weightUnit } = calculatePriceAndWeight()

    addToCart(product, selections, unitPrice, totalWeight, weightUnit)

    toast.success('Added to cart!', {
      description: `${product.attributes.name} has been added to your cart`
    })

    onClose()
  }

  const handleOrderNow = () => {
    if (!user) {
      toast.error('Authentication required', {
        description: 'You must be logged in to place an order'
      })
      return
    }
    setShowConfirmation(true)
  }

  const handleConfirmOrder = async () => {
    setIsSubmitting(true)

    try {
      const selections = getSelections()
      const orderInquiry = await submitOrderInquiry(product.id, selections)

      toast.success('Order inquiry submitted!', {
        description: `Inquiry #: ${orderInquiry.attributes.inquiry_number}`
      })

      setShowConfirmation(false)
      // Close modal after showing success
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (err: any) {
      console.error('Error submitting order inquiry:', err)
      toast.error('Failed to submit order inquiry', {
        description: err.response?.data?.error?.message || 'Please try again or contact support.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Authentication required', {
        description: 'You must be logged in to submit an order inquiry'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const selections = getSelections()
      const orderInquiry = await submitOrderInquiry(product.id, selections)

      toast.success('Order inquiry submitted!', {
        description: `Inquiry #: ${orderInquiry.attributes.inquiry_number}`
      })

      // Close modal after showing success
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: any) {
      console.error('Error submitting order inquiry:', err)
      toast.error('Failed to submit order inquiry', {
        description: err.response?.data?.error?.message || 'Please try again or contact support.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Transform available photos to the expected format
  // Using images field for both display and customization
  const availablePhotos = React.useMemo(() => {
    const photos = product.attributes.images?.data || []

    // Debug: Log the raw photo data structure
    if (photos.length > 0) {
      console.log('Available photos structure:', photos[0])
    }

    return photos.map(photo => {
      return {
        id: photo.id,
        attributes: {
          url: getImageUrl(photo) || '',
          name: getImageName(photo, `Photo ${photo.id}`),
        }
      }
    })
  }, [product.attributes.images])

  const isStepValid = validateStep(currentStep)

  // Calculate price and weight for confirmation modal
  const { unitPrice, totalWeight, weightUnit } = calculatePriceAndWeight()

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoadingOptions ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Loading customization options...</p>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Customize {product.attributes.name}</DialogTitle>
              <DialogDescription>
                Create your custom packaging design with our easy 4-step wizard
              </DialogDescription>
            </DialogHeader>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} totalSteps={4} stepLabels={STEP_LABELS} />

        {/* Step Content */}
        <div className="py-6 min-h-[400px]">
          {currentStep === 0 && (
            <>
              {availablePhotos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-neutral-700 mb-2">No photos available for customization</p>
                  <p className="text-sm text-neutral-500">
                    Please contact support or select a different product
                  </p>
                </div>
              ) : (
                <PhotoSelectionGrid
                  availablePhotos={availablePhotos}
                  selectedPhotoIds={selectedPhotos}
                  onToggle={togglePhoto}
                  limits={limits.photos}
                />
              )}
            </>
          )}

          {currentStep === 1 && (
            <BudStyleSelector
              budStyles={budStyles}
              selectedIds={selectedBudStyles}
              onToggle={toggleBudStyle}
              limits={limits.budStyles}
            />
          )}

          {currentStep === 2 && (
            <BackgroundFontSelector
              backgrounds={backgrounds}
              fonts={fonts}
              selectedBackgroundIds={selectedBackgrounds}
              selectedFontIds={selectedFonts}
              onToggleBackground={toggleBackground}
              onToggleFont={toggleFont}
            />
          )}

          {currentStep === 3 && (
            <PreBaggingConfig
              options={preBaggingOptions}
              selections={preBaggingSelections}
              onUpdate={updatePreBagging}
              onRemove={removePreBagging}
            />
          )}
        </div>

        {/* Navigation Footer */}
        <DialogFooter className="flex flex-row items-center justify-between sm:justify-between">
          <Button
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
            variant="outline"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid || isSubmitting}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleOrderNow}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Submit Inquiry
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>

    {/* Order Confirmation Modal */}
    <OrderConfirmationModal
      isOpen={showConfirmation}
      onClose={() => setShowConfirmation(false)}
      onConfirm={handleConfirmOrder}
      isSubmitting={isSubmitting}
      product={product}
      selections={getSelections()}
      unitPrice={unitPrice}
      weight={totalWeight}
      weightUnit={weightUnit}
      backgrounds={backgrounds}
      fonts={fonts}
      companyName={user?.companyName}
    />
    </>
  )
}
