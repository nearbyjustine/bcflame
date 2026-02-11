'use client';

import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, X, ZoomIn, Download, ShoppingCart, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MOCK_PRODUCTS, MOCK_BUD_IMAGES, MOCK_BACKGROUNDS, MOCK_FONTS, MOCK_FONT_SIZES, type MockBudImage } from '@/lib/mock-data';
import type { BackgroundStyle, FontStyle } from '@/types/customization';
import type { Product } from '@/types/product';
import { hexToGradient } from '@/lib/utils/color';
import { useGoogleFonts } from '@/hooks/useGoogleFonts';

type Screen = 'products' | 'customize' | 'checkout' | 'success';

export function DemoCustomizationStudio() {
  // Screen navigation
  const [currentScreen, setCurrentScreen] = useState<Screen>('products');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Customization state
  const [slots, setSlots] = useState<(number | null)[]>([null, null, null, null, null]);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [activeBackgroundId, setActiveBackgroundId] = useState(1);
  const [activeFontId, setActiveFontId] = useState(1);
  const [activeSizeId, setActiveSizeId] = useState<'sm' | 'md' | 'lg'>('md');

  // Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSlotIndex, setPreviewSlotIndex] = useState(0);

  // Derived state
  const filledSlotsCount = slots.filter(s => s !== null).length;
  const canCheckout = filledSlotsCount > 0;
  const activeBackground = MOCK_BACKGROUNDS.find(b => b.id === activeBackgroundId) || MOCK_BACKGROUNDS[0];
  const activeFont = MOCK_FONTS.find(f => f.id === activeFontId) || MOCK_FONTS[0];
  const activeSize = MOCK_FONT_SIZES.find(s => s.id === activeSizeId) || MOCK_FONT_SIZES[1];

  // Load Google Fonts
  const fontFamilies = MOCK_FONTS.map(f => f.attributes.font_family);
  useGoogleFonts(fontFamilies);

  // Handlers
  const handleSelectBudImage = (budId: number) => {
    const nextEmptyIndex = slots.findIndex(s => s === null);
    if (nextEmptyIndex === -1) return; // All slots filled

    const newSlots = [...slots];
    newSlots[nextEmptyIndex] = budId;
    setSlots(newSlots);
    setCurrentSlotIndex(Math.min(nextEmptyIndex + 1, 4));
  };

  const handleRemoveBudImage = (slotIndex: number) => {
    const newSlots = [...slots];
    newSlots[slotIndex] = null;
    setSlots(newSlots);
  };

  const handleStartCustomization = (product: Product) => {
    setSelectedProduct(product);
    setCurrentScreen('customize');
  };

  const handleCheckout = () => {
    setCurrentScreen('checkout');
  };

  const handlePayment = () => {
    setCurrentScreen('success');
  };

  const handleCreateAnother = () => {
    // Reset state
    setSlots([null, null, null, null, null]);
    setCurrentSlotIndex(0);
    setActiveBackgroundId(1);
    setActiveFontId(1);
    setActiveSizeId('md');
    setSelectedProduct(null);
    setCurrentScreen('products');
  };

  const handlePreviewSlot = (slotIndex: number) => {
    setPreviewSlotIndex(slotIndex);
    setIsPreviewOpen(true);
  };

  const handleNavigatePreview = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setPreviewSlotIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else {
      setPreviewSlotIndex(prev => (prev < 4 ? prev + 1 : prev));
    }
  };

  // Render functions
  const renderBackground = (background: BackgroundStyle, className = '') => {
    const { type, color_hex, preview_image } = background.attributes;

    if (type === 'solid_color' && color_hex) {
      return (
        <div
          className={className}
          style={{ backgroundColor: color_hex }}
        />
      );
    }

    if (type === 'gradient' && color_hex) {
      const gradient = hexToGradient(color_hex);
      return (
        <div
          className={className}
          style={{ background: gradient }}
        />
      );
    }

    if ((type === 'image' || type === 'texture') && preview_image?.data) {
      return (
        <div
          className={className}
          style={{
            backgroundImage: `url(${preview_image.data.attributes.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      );
    }

    return <div className={`${className} bg-gray-200`} />;
  };

  const renderPreviewCanvas = (slotIndex: number, size: 'normal' | 'large' = 'normal') => {
    const budId = slots[slotIndex];
    const budImage = MOCK_BUD_IMAGES.find(b => b.id === budId);
    const containerClass = size === 'large' ? 'w-[600px] h-[900px]' : 'w-[400px] h-[600px]';
    const budSizeClass = size === 'large' ? 'max-h-[540px]' : 'max-h-[360px]';
    const textSizeStyle = { fontSize: `${activeSize.value * (size === 'large' ? 1.5 : 1)}px` };

    return (
      <div className={`${containerClass} relative rounded-lg overflow-hidden shadow-xl`}>
        {/* Background Layer */}
        {renderBackground(activeBackground, 'absolute inset-0')}

        {/* Bud Image Layer */}
        {budImage && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <img
              src={budImage.imageUrl}
              alt={budImage.name}
              className={`${budSizeClass} max-w-[80%] object-contain`}
              style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}
            />
          </div>
        )}

        {/* Text Layer */}
        {selectedProduct && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <div
              className="px-6 py-3 rounded-lg"
              style={{
                backgroundColor: activeBackground.attributes.text_background_color,
                color: activeBackground.attributes.text_color,
                opacity: 0.95
              }}
            >
              <div
                style={{
                  fontFamily: activeFont.attributes.font_family,
                  ...textSizeStyle,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}
              >
                {selectedProduct.attributes.name}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!budImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/70">
              <div className="text-6xl mb-4">+</div>
              <div className="text-sm">Select a bud image</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Screen renderers
  if (currentScreen === 'products') {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Customize Your Products</h1>
            <p className="text-gray-600">Select a product to start customizing your packaging</p>
            <div className="mt-2 inline-block px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
              DEMO PROTOTYPE
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MOCK_PRODUCTS.map(product => (
              <Card key={product.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{product.attributes.name}</h2>
                  <p className="text-sm text-orange-600 font-medium">{product.attributes.tagline}</p>
                </div>
                <p className="text-gray-600 mb-4">{product.attributes.description}</p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded">
                    {product.attributes.category}
                  </div>
                  <div className="text-sm text-gray-600">
                    THC: <span className="font-semibold">{product.attributes.thc_content}</span>
                  </div>
                </div>
                <Button
                  onClick={() => handleStartCustomization(product)}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  Customize Packaging
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'customize') {
    return (
      <div className="h-screen flex flex-col bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentScreen('products')}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-bold">{selectedProduct?.attributes.name}</h1>
              <p className="text-xs text-gray-500">{filledSlotsCount} of 5 images selected</p>
            </div>
          </div>
          <Button
            onClick={handleCheckout}
            disabled={!canCheckout}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Checkout & Download
          </Button>
        </div>

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Font Controls */}
          <div className="w-64 bg-white border-r p-4 overflow-y-auto">
            <h2 className="text-sm font-bold text-gray-700 mb-3">FONT STYLE</h2>
            <div className="space-y-2 mb-6">
              {MOCK_FONTS.map(font => (
                <button
                  key={font.id}
                  onClick={() => setActiveFontId(font.id)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    activeFontId === font.id
                      ? 'border-orange-600 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ fontFamily: font.attributes.font_family }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">Aa Bb</span>
                    {activeFontId === font.id && <Check className="w-4 h-4 text-orange-600" />}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{font.attributes.name}</div>
                </button>
              ))}
            </div>

            <h2 className="text-sm font-bold text-gray-700 mb-3">FONT SIZE</h2>
            <div className="flex gap-2">
              {MOCK_FONT_SIZES.map(size => (
                <button
                  key={size.id}
                  onClick={() => setActiveSizeId(size.id as 'sm' | 'md' | 'lg')}
                  className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all ${
                    activeSizeId === size.id
                      ? 'border-orange-600 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xs font-medium">{size.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Center - Preview */}
          <div className="flex-1 flex flex-col items-center overflow-y-auto p-8">
            {/* Slot Tabs */}
            <div className="flex gap-2 mb-6">
              {slots.map((budId, index) => {
                const budImage = budId ? MOCK_BUD_IMAGES.find(b => b.id === budId) : null;
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentSlotIndex(index)}
                    className={`relative w-16 h-20 rounded-lg border-2 transition-all overflow-hidden ${
                      currentSlotIndex === index
                        ? 'border-orange-600 ring-2 ring-orange-200'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {budImage ? (
                      <>
                        <img
                          src={budImage.imageUrl}
                          alt={`Slot ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveBudImage(index);
                          }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-2xl">
                        +
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs text-center py-0.5">
                      {index + 1}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Main Preview */}
            <div className="mb-4">
              {renderPreviewCanvas(currentSlotIndex)}
            </div>

            {/* Preview Button */}
            {slots[currentSlotIndex] && (
              <Button
                variant="outline"
                onClick={() => handlePreviewSlot(currentSlotIndex)}
              >
                <ZoomIn className="w-4 h-4 mr-2" />
                Preview Fullscreen
              </Button>
            )}

            {/* Bud Picker - Horizontal Scroll */}
            <div className="mt-8 w-full">
              <h2 className="text-sm font-bold text-gray-700 mb-3">SELECT BUD IMAGES</h2>
              <div className="flex gap-3 overflow-x-auto pb-4">
                {MOCK_BUD_IMAGES.map(bud => {
                  const isSelected = slots.includes(bud.id);
                  return (
                    <button
                      key={bud.id}
                      onClick={() => !isSelected && handleSelectBudImage(bud.id)}
                      disabled={isSelected || filledSlotsCount >= 5}
                      className={`relative flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-orange-600 opacity-50 cursor-not-allowed'
                          : filledSlotsCount >= 5
                          ? 'border-gray-300 opacity-30 cursor-not-allowed'
                          : 'border-gray-300 hover:border-orange-400 hover:scale-105 cursor-pointer'
                      }`}
                    >
                      <img
                        src={bud.imageUrl}
                        alt={bud.name}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-orange-600/20 flex items-center justify-center">
                          <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-xs text-center py-1 px-1 truncate">
                        {bud.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Backgrounds */}
          <div className="w-72 bg-white border-l p-4 overflow-y-auto">
            <h2 className="text-sm font-bold text-gray-700 mb-3">BACKGROUND STYLE</h2>
            <div className="grid grid-cols-2 gap-3">
              {MOCK_BACKGROUNDS.map(background => (
                <button
                  key={background.id}
                  onClick={() => setActiveBackgroundId(background.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    activeBackgroundId === background.id
                      ? 'border-orange-600 ring-2 ring-orange-200'
                      : 'border-gray-300 hover:border-orange-400 hover:scale-105'
                  }`}
                >
                  {renderBackground(background, 'w-full h-full')}
                  {activeBackgroundId === background.id && (
                    <div className="absolute top-1 right-1 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-xs text-center py-1 px-1 truncate">
                    {background.attributes.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fullscreen Preview Modal */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-none w-auto bg-black/95 border-none p-8">
            <div className="relative flex items-center gap-6">
              {/* Previous Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNavigatePreview('prev')}
                disabled={previewSlotIndex === 0}
                className="text-white hover:bg-white/10"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>

              {/* Large Preview */}
              <div className="flex flex-col items-center gap-4">
                {renderPreviewCanvas(previewSlotIndex, 'large')}
                <div className="text-white text-sm">
                  Image {previewSlotIndex + 1} of 5
                </div>
              </div>

              {/* Next Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNavigatePreview('next')}
                disabled={previewSlotIndex === 4}
                className="text-white hover:bg-white/10"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>

              {/* Close Button */}
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (currentScreen === 'checkout') {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentScreen('customize')}
            className="mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Editor
          </Button>

          <Card className="p-8">
            <h1 className="text-3xl font-bold mb-6">Checkout</h1>

            {/* Order Summary */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Your Customizations</h2>
              <div className="grid grid-cols-5 gap-4 mb-6">
                {slots.map((budId, index) => {
                  if (!budId) return null;
                  return (
                    <div key={index} className="relative">
                      <div className="aspect-[2/3] rounded-lg overflow-hidden border-2 border-gray-200">
                        {renderPreviewCanvas(index)}
                      </div>
                      <div className="text-xs text-center text-gray-600 mt-1">
                        Variation {index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Product:</span>
                  <span className="font-semibold">{selectedProduct?.attributes.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Customizations:</span>
                  <span className="font-semibold">{filledSlotsCount} variations</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-2xl font-bold text-orange-600">
                    ${(filledSlotsCount * 25).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Mock Payment Form */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM / YY"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                className="w-full mt-8 bg-orange-600 hover:bg-orange-700 py-6 text-lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pay ${(filledSlotsCount * 25).toFixed(2)}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (currentScreen === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <Card className="max-w-2xl w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-8">
            Your customized packaging images are ready to download
          </p>

          <div className="space-y-3 mb-8">
            {slots.map((budId, index) => {
              if (!budId) return null;
              const budImage = MOCK_BUD_IMAGES.find(b => b.id === budId);
              return (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-16 h-24 rounded overflow-hidden border border-gray-200 flex-shrink-0">
                    {renderPreviewCanvas(index)}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900">
                      Image #{index + 1} - High Res PNG
                    </div>
                    <div className="text-sm text-gray-500">{budImage?.name}</div>
                  </div>
                  <Button variant="outline" className="flex-shrink-0">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              );
            })}
          </div>

          <Button
            onClick={handleCreateAnother}
            className="w-full bg-orange-600 hover:bg-orange-700 py-6 text-lg"
          >
            Create Another Pack
          </Button>
        </Card>
      </div>
    );
  }

  return null;
}
