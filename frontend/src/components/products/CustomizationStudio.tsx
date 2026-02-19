'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, ChevronLeft, ChevronRight, X, ZoomIn, ShoppingCart, CreditCard, Loader2, Download, Sparkles } from 'lucide-react';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { TextEffectSelector } from './TextEffectSelector';
import type { BackgroundStyle, FontStyle, TextEffect } from '@/types/customization';
import type { Product, ProductImage } from '@/types/product';
import { hexToGradient } from '@/lib/utils/color';
import { useGoogleFonts } from '@/hooks/useGoogleFonts';
import { getBackgroundStyles, getFontStyles, getTextEffects, submitOrderInquiry } from '@/lib/api/customization';
import { getImageUrl } from '@/lib/utils/image';
import { toast } from 'sonner';

type Screen = 'customize' | 'checkout' | 'success';

interface CustomizationStudioProps {
  product: Product;
  onClose: () => void;
}

export function CustomizationStudio({ product, onClose }: CustomizationStudioProps) {
  // Screen navigation
  const [currentScreen, setCurrentScreen] = useState<Screen>('customize');

  // API Data state
  const [budImages, setBudImages] = useState<ProductImage[]>([]);
  const [backgrounds, setBackgrounds] = useState<BackgroundStyle[]>([]);
  const [fonts, setFonts] = useState<FontStyle[]>([]);
  const [textEffects, setTextEffects] = useState<TextEffect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customization state
  const [slots, setSlots] = useState<(number | null)[]>([null, null, null, null, null]);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [activeBackgroundId, setActiveBackgroundId] = useState<number | null>(null);
  const [activeFontId, setActiveFontId] = useState<number | null>(null);
  const [activeTextEffectIds, setActiveTextEffectIds] = useState<number[]>([]);
  const [activeSizeId, setActiveSizeId] = useState<'sm' | 'md' | 'lg'>('md');

  // Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSlotIndex, setPreviewSlotIndex] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Refs for download functionality
  const canvasRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Font sizes
  const FONT_SIZES = {
    sm: { label: 'Small', size: 24 },
    md: { label: 'Medium', size: 32 },
    lg: { label: 'Large', size: 48 },
  };

  // Derived state
  const filledSlotsCount = slots.filter(s => s !== null).length;
  const filledSlotIndices = slots.map((slot, idx) => slot !== null ? idx : -1).filter(idx => idx !== -1);
  const canCheckout = filledSlotsCount > 0 && activeBackgroundId && activeFontId;
  const activeBackground = backgrounds.find(b => b.id === activeBackgroundId);
  const activeFont = fonts.find(f => f.id === activeFontId);
  const activeSize = FONT_SIZES[activeSizeId];

  // Load Google Fonts
  useGoogleFonts(fonts);

  // Get selected text effects
  const selectedTextEffects = textEffects.filter(effect =>
    activeTextEffectIds.includes(effect.id)
  );

  // Extract primary CSS class from effect (e.g., ".text" -> "text")
  const extractClassName = (cssCode: string): string | null => {
    const match = cssCode.match(/\.([a-zA-Z0-9_-]+)\s*\{/);
    return match ? match[1] : null;
  };

  // Get CSS classes to apply from selected effects
  const textEffectClasses = selectedTextEffects
    .map(effect => extractClassName(effect.attributes.css_code))
    .filter((className): className is string => className !== null)
    .join(' ');

  // Check if any selected effect requires special HTML structure
  const hasRetroNeon = selectedTextEffects.some(e => e.attributes.name === 'Retro 80s Neon');
  const hasSweetStuff = selectedTextEffects.some(e => e.attributes.name === 'Sweet Stuff');

  // Inject CSS for selected text effects
  useEffect(() => {
    const styleId = 'text-effects-dynamic-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // Combine all CSS from selected effects
    const combinedCss = selectedTextEffects
      .map(effect => effect.attributes.css_code)
      .join('\n\n');

    styleElement.textContent = combinedCss;

    return () => {
      // Cleanup on unmount
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [selectedTextEffects]);

  // Fetch customization data on mount
  useEffect(() => {
    const fetchCustomizationData = async () => {
      try {
        setIsLoading(true);

        // Get bud images from product
        const productBudImages = product.attributes.bud_images?.data || [];
        setBudImages(productBudImages);

        // Fetch backgrounds, fonts, and text effects from API
        const [backgroundsRes, fontsRes, textEffectsRes] = await Promise.all([
          getBackgroundStyles(),
          getFontStyles(),
          getTextEffects(),
        ]);

        setBackgrounds(backgroundsRes);
        setFonts(fontsRes);
        setTextEffects(textEffectsRes);

        // Set default selections
        if (backgroundsRes.length > 0 && !activeBackgroundId) {
          setActiveBackgroundId(backgroundsRes[0].id);
        }
        if (fontsRes.length > 0 && !activeFontId) {
          setActiveFontId(fontsRes[0].id);
        }
        // Auto-select default text effect if exists
        const defaultEffect = textEffectsRes.find(e => e.attributes.is_default);
        if (defaultEffect && activeTextEffectIds.length === 0) {
          setActiveTextEffectIds([defaultEffect.id]);
        }
      } catch (err) {
        console.error('Error loading customization data:', err);
        toast.error('Failed to load customization options');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomizationData();
  }, [product]);

  // Handlers
  const handleSelectBudImage = (budImageId: number) => {
    const nextEmptyIndex = slots.findIndex(s => s === null);
    if (nextEmptyIndex === -1) return; // All slots filled

    const newSlots = [...slots];
    newSlots[nextEmptyIndex] = budImageId;
    setSlots(newSlots);
    setCurrentSlotIndex(Math.min(nextEmptyIndex + 1, 4));
  };

  const handleRemoveBudImage = (slotIndex: number) => {
    const newSlots = [...slots];
    newSlots[slotIndex] = null;
    setSlots(newSlots);
  };

  const handleCheckout = () => {
    setCurrentScreen('checkout');
  };

  const handlePayment = async () => {
    if (!activeBackgroundId || !activeFontId) {
      toast.error('Please select a background and font');
      return;
    }

    try {
      setIsSubmitting(true);

      // Build selections object
      const selections = {
        photos: [],
        bud_images: slots.filter(id => id !== null) as number[],
        backgrounds: [activeBackgroundId],
        fonts: [activeFontId],
        text_effects: activeTextEffectIds,
        preBagging: [],
      };

      // Submit order inquiry
      await submitOrderInquiry(product.id, selections);

      toast.success('Order inquiry submitted successfully!');
      setCurrentScreen('success');
    } catch (err) {
      console.error('Error submitting order:', err);
      toast.error('Failed to submit order inquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Show confirmation if user has made changes
    if (filledSlotsCount > 0 && currentScreen !== 'success') {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    onClose();
  };

  const handlePreviewSlot = (slotIndex: number) => {
    setPreviewSlotIndex(slotIndex);
    setIsPreviewOpen(true);
  };

  const handleNavigatePreview = (direction: 'prev' | 'next') => {
    const currentFilledIndex = filledSlotIndices.indexOf(previewSlotIndex);
    if (direction === 'prev' && currentFilledIndex > 0) {
      setPreviewSlotIndex(filledSlotIndices[currentFilledIndex - 1]);
    } else if (direction === 'next' && currentFilledIndex < filledSlotIndices.length - 1) {
      setPreviewSlotIndex(filledSlotIndices[currentFilledIndex + 1]);
    }
  };

  const handleDownloadImages = async () => {
    try {
      setIsDownloading(true);
      const zip = new JSZip();
      
      // Create a temporary container for high-res canvases
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      document.body.appendChild(tempContainer);
      
      // Generate and add each image to the zip
      for (let i = 0; i < slots.length; i++) {
        if (slots[i] !== null) {
          const budImageId = slots[i];
          const budImage = budImages.find(b => b.id === budImageId);
          const budImageUrl = budImage ? getImageUrl(budImage) : null;
          
          if (!budImageUrl) continue;
          
          // Create a high-res canvas for this variation
          const canvas = document.createElement('div');
          canvas.style.width = '1200px';
          canvas.style.height = '1800px';
          canvas.style.position = 'relative';
          canvas.style.overflow = 'hidden';
          canvas.style.borderRadius = '12px';
          
          // Background Layer
          if (activeBackground) {
            const bgDiv = document.createElement('div');
            bgDiv.style.position = 'absolute';
            bgDiv.style.inset = '0';
            
            const { type, color_hex, preview_image } = activeBackground.attributes;
            if (type === 'solid_color' && color_hex) {
              bgDiv.style.backgroundColor = color_hex;
            } else if (type === 'gradient' && color_hex) {
              bgDiv.style.background = hexToGradient(color_hex);
            } else if ((type === 'image' || type === 'texture') && preview_image?.data) {
              const imageUrl = getImageUrl(preview_image.data);
              bgDiv.style.backgroundImage = `url(${imageUrl})`;
              bgDiv.style.backgroundSize = 'cover';
              bgDiv.style.backgroundPosition = 'center';
            }
            canvas.appendChild(bgDiv);
          }
          
          // Bud Image Layer
          const budImgContainer = document.createElement('div');
          budImgContainer.style.position = 'absolute';
          budImgContainer.style.inset = '0';
          budImgContainer.style.display = 'flex';
          budImgContainer.style.alignItems = 'center';
          budImgContainer.style.justifyContent = 'center';
          budImgContainer.style.padding = '96px';
          
          const budImg = document.createElement('img');
          budImg.src = budImageUrl;
          budImg.style.maxHeight = '1080px';
          budImg.style.maxWidth = '80%';
          budImg.style.objectFit = 'contain';
          budImg.style.filter = 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))';
          budImgContainer.appendChild(budImg);
          canvas.appendChild(budImgContainer);
          
          // Text Layer
          if (activeFont) {
            const textContainer = document.createElement('div');
            textContainer.style.position = 'absolute';
            textContainer.style.bottom = '120px';
            textContainer.style.left = '50%';
            textContainer.style.transform = 'translateX(-50%)';
            textContainer.style.width = '100%';
            textContainer.style.padding = '0 48px';
            
            const textBox = document.createElement('div');
            textBox.style.padding = '72px 96px';
            textBox.style.borderRadius = '12px';
            textBox.style.margin = '0 auto';
            textBox.style.width = 'fit-content';
            textBox.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            textBox.style.color = 'white';
            textBox.style.opacity = '0.95';
            
            const text = document.createElement('div');
            text.textContent = product.attributes.name;
            text.style.fontFamily = activeFont.attributes.font_family;
            text.style.fontSize = `${activeSize.size * 3}px`;
            text.style.fontWeight = '700';
            text.style.letterSpacing = '0.05em';
            text.style.textTransform = 'uppercase';
            text.style.textAlign = 'center';
            textBox.appendChild(text);
            textContainer.appendChild(textBox);
            canvas.appendChild(textContainer);
          }
          
          tempContainer.appendChild(canvas);
          
          // Wait for images to load
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Capture the canvas as an image
          const canvasImage = await html2canvas(canvas, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            scale: 2,
            width: 1200,
            height: 1800
          });
          
          // Convert to blob and add to zip
          const blob = await new Promise<Blob>((resolve) => {
            canvasImage.toBlob((b) => {
              if (b) resolve(b);
            }, 'image/png');
          });
          
          zip.file(`variation_${i + 1}.png`, blob);
          tempContainer.removeChild(canvas);
        }
      }
      
      // Clean up temp container
      document.body.removeChild(tempContainer);
      
      // Generate zip file and download
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${product.attributes.name.replace(/\s+/g, '_')}_customizations.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Images downloaded successfully!');
    } catch (err) {
      console.error('Error downloading images:', err);
      toast.error('Failed to download images');
    } finally {
      setIsDownloading(false);
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
      const imageUrl = getImageUrl(preview_image.data);
      return (
        <div
          className={className}
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      );
    }

    return <div className={`${className} bg-white/10`} />;
  };

  const renderPreviewCanvas = (slotIndex: number, size: 'normal' | 'large' | 'thumbnail' | 'download' = 'normal', refKey?: number) => {
    const budImageId = slots[slotIndex];
    const budImage = budImages.find(b => b.id === budImageId);
    const budImageUrl = budImage ? getImageUrl(budImage) : null;
    
    // Determine dimensions and scales based on size
    let containerClass: string;
    let budSizeClass: string;
    let textSizeStyle: { fontSize: string };
    let scale: number;
    
    if (size === 'large') {
      containerClass = 'w-[600px] h-[900px]';
      budSizeClass = 'max-h-[540px]';
      scale = 1.5;
    } else if (size === 'thumbnail') {
      containerClass = 'w-full h-full';
      budSizeClass = 'max-h-[60%]';
      scale = 0.5;
    } else if (size === 'download') {
      containerClass = 'w-[1200px] h-[1800px]';
      budSizeClass = 'max-h-[1080px]';
      scale = 3;
    } else {
      containerClass = 'w-[400px] h-[600px]';
      budSizeClass = 'max-h-[360px]';
      scale = 1;
    }
    
    textSizeStyle = { fontSize: `${activeSize.size * scale}px` };

    return (
      <div 
        ref={refKey !== undefined ? (el) => { canvasRefs.current[refKey] = el; } : undefined}
        className={`${containerClass} relative rounded-lg overflow-hidden shadow-xl`}
      >
        {/* Background Layer */}
        {activeBackground && renderBackground(activeBackground, 'absolute inset-0')}

        {/* Bud Image Layer */}
        {budImageUrl && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <img
              src={budImageUrl}
              alt={budImage?.attributes.name || 'Bud image'}
              className={`${budSizeClass} max-w-[80%] object-contain`}
              style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}
            />
          </div>
        )}

        {/* Text Layer */}
        {activeFont && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full px-4">
            <div
              className="px-6 py-3 rounded-lg mx-auto w-fit"
              style={
                textEffectClasses
                  ? {} // Remove background when text effect is active
                  : {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      opacity: 0.95
                    }
              }
            >
              {hasRetroNeon ? (
                // Retro 80s Neon requires dual-span structure
                <h1 className="retro-neon" style={{ fontSize: textSizeStyle.fontSize }}>
                  <span className="retro-neon-stroke">{product.attributes.name}</span>
                  <span className="retro-neon-fill">{product.attributes.name}</span>
                </h1>
              ) : hasSweetStuff ? (
                // Sweet Stuff requires data-text attribute
                <h1 className="sweet-title" style={{ fontSize: textSizeStyle.fontSize }}>
                  <span data-text={product.attributes.name}>{product.attributes.name}</span>
                </h1>
              ) : (
                // Standard text effect or no effect
                <div
                  className={textEffectClasses}
                  style={
                    textEffectClasses
                      ? {
                          // When text effect is active, only apply font size
                          fontSize: textSizeStyle.fontSize,
                        }
                      : {
                          // No text effect - apply full styling
                          fontFamily: activeFont.attributes.font_family,
                          ...textSizeStyle,
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          textAlign: 'center',
                          color: 'white'
                        }
                  }
                >
                  {product.attributes.name}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!budImageUrl && (
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

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
          <p className="text-white/60">Loading customization options...</p>
        </div>
      </div>
    );
  }

  // Screen renderers
  if (currentScreen === 'customize') {
    return (
      <div className="h-screen flex flex-col bg-[#0a0a0a]">
        {/* Header */}
        <div className="bg-black/95 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4 mr-1" />
              Close
            </Button>
            <div>
              <h1 className="text-lg font-bold text-white">{product.attributes.name}</h1>
              <p className="text-xs text-white/50">{filledSlotsCount} of 5 images selected</p>
            </div>
          </div>
          <Button
            onClick={handleCheckout}
            disabled={!canCheckout}
            className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Proceed to Checkout
          </Button>
        </div>

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Font Controls */}
          <div className="w-64 bg-black/60 border-r border-white/10 p-4 overflow-y-auto">
            <h2 className="text-sm font-bold text-white/60 mb-3 tracking-widest">FONT STYLE</h2>
            <div className="space-y-2 mb-6">
              {fonts.map(font => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => setActiveFontId(font.id)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    activeFontId === font.id
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-white/10 hover:border-white/30 bg-white/5'
                  }`}
                  style={{ fontFamily: font.attributes.font_family }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">Aa Bb</span>
                    {activeFontId === font.id && <Check className="w-4 h-4 text-orange-500" />}
                  </div>
                  <div className="text-xs text-white/50 mt-1">{font.attributes.name}</div>
                </button>
              ))}
            </div>

            <h2 className="text-sm font-bold text-white/60 mb-3 tracking-widest">FONT SIZE</h2>
            <div className="flex gap-2 mb-6">
              {Object.entries(FONT_SIZES).map(([key, size]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSizeId(key as 'sm' | 'md' | 'lg')}
                  className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all ${
                    activeSizeId === key
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                      : 'border-white/10 hover:border-white/30 bg-white/5 text-white/70'
                  }`}
                >
                  <div className="text-xs font-medium">{size.label}</div>
                </button>
              ))}
            </div>

            <h2 className="text-sm font-bold text-white/60 mb-3 tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              TEXT EFFECTS
            </h2>
            <div className="space-y-2">
              {textEffects.map(effect => (
                <button
                  key={effect.id}
                  type="button"
                  onClick={() => {
                    if (activeTextEffectIds.includes(effect.id)) {
                      setActiveTextEffectIds(activeTextEffectIds.filter(id => id !== effect.id));
                    } else if (activeTextEffectIds.length < 3) {
                      setActiveTextEffectIds([...activeTextEffectIds, effect.id]);
                    }
                  }}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    activeTextEffectIds.includes(effect.id)
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-white/10 hover:border-white/30 bg-white/5'
                  }`}
                  disabled={!activeTextEffectIds.includes(effect.id) && activeTextEffectIds.length >= 3}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{effect.attributes.name}</span>
                    {activeTextEffectIds.includes(effect.id) && <Check className="w-4 h-4 text-orange-500" />}
                  </div>
                  {effect.attributes.description && (
                    <div className="text-xs text-white/40 mt-1 line-clamp-2">{effect.attributes.description}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Center - Preview */}
          <div className="flex-1 flex flex-col items-center overflow-y-auto p-8">
            {/* Bud Picker - Select Bud Images (TOP) */}
            <div className="w-full mb-8">
              <h2 className="text-sm font-bold text-white/60 mb-3 tracking-widest">SELECT BUD IMAGES</h2>
              {budImages.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  <p>No bud images available for this product.</p>
                  <p className="text-sm mt-2">Contact support to add images.</p>
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-4">
                  {budImages.map(budImage => {
                    const isSelected = slots.includes(budImage.id);
                    const budImageUrl = getImageUrl(budImage);
                    return (
                      <button
                        key={budImage.id}
                        type="button"
                        onClick={() => !isSelected && handleSelectBudImage(budImage.id)}
                        disabled={isSelected || filledSlotsCount >= 5}
                        className={`relative flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected
                            ? 'border-orange-500 opacity-50 cursor-not-allowed'
                            : filledSlotsCount >= 5
                            ? 'border-white/20 opacity-30 cursor-not-allowed'
                            : 'border-white/20 hover:border-orange-400 hover:scale-105 cursor-pointer'
                        }`}
                      >
                        <img
                          src={budImageUrl || ''}
                          alt={budImage.attributes.name || 'Bud image'}
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
                          {budImage.attributes.name || `Image ${budImage.id}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Snapshots - Slot Tabs (MIDDLE) */}
            <div className="w-full mb-6">
              <h2 className="text-sm font-bold text-white/60 mb-3 tracking-widest">SNAPSHOTS</h2>
              <div className="flex gap-2">
                {slots.map((budImageId, index) => {
                  const budImage = budImageId ? budImages.find(b => b.id === budImageId) : null;
                  const budImageUrl = budImage ? getImageUrl(budImage) : null;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentSlotIndex(index)}
                      className={`relative w-16 h-20 rounded-lg border-2 transition-all overflow-hidden ${
                        currentSlotIndex === index
                          ? 'border-orange-500 ring-2 ring-orange-500/30'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      {budImageUrl ? (
                        <>
                          <img
                            src={budImageUrl}
                            alt={`Slot ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
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
                        <div className="flex items-center justify-center h-full text-white/30 text-2xl bg-white/5">
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
            </div>

            {/* Generated Image - Preview (BOTTOM) */}
            <div className="w-full">
              <h2 className="text-sm font-bold text-white/60 mb-3 tracking-widest">GENERATED IMAGE</h2>
              <div className="flex flex-col items-center">
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
              </div>
            </div>
          </div>

          {/* Right Sidebar - Backgrounds */}
          <div className="w-72 bg-black/60 border-l border-white/10 p-4 overflow-y-auto">
            <h2 className="text-sm font-bold text-white/60 mb-3 tracking-widest">BACKGROUND STYLE</h2>
            <div className="grid grid-cols-2 gap-3">
              {backgrounds.map(background => (
                <button
                  key={background.id}
                  type="button"
                  onClick={() => setActiveBackgroundId(background.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    activeBackgroundId === background.id
                      ? 'border-orange-500 ring-2 ring-orange-500/30'
                      : 'border-white/20 hover:border-orange-400 hover:scale-105'
                  }`}
                >
                  {renderBackground(background, 'w-full h-full')}
                  {activeBackgroundId === background.id && (
                    <div className="absolute top-1 right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
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
                disabled={filledSlotIndices.indexOf(previewSlotIndex) === 0}
                className="text-white hover:bg-white/10"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>

              {/* Large Preview */}
              <div className="flex flex-col items-center gap-4">
                {renderPreviewCanvas(previewSlotIndex, 'large')}
                <div className="text-white text-sm">
                  Image {filledSlotIndices.indexOf(previewSlotIndex) + 1} of {filledSlotsCount}
                </div>
              </div>

              {/* Next Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleNavigatePreview('next')}
                disabled={filledSlotIndices.indexOf(previewSlotIndex) === filledSlotIndices.length - 1}
                className="text-white hover:bg-white/10"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Exit Confirmation Dialog */}
        <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
          <DialogContent>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Discard changes?</h2>
              <p className="text-white/60 mb-6">
                You have unsaved customizations. Are you sure you want to exit?
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowExitConfirm(false)}>
                  Continue Editing
                </Button>
                <Button variant="destructive" onClick={handleConfirmExit}>
                  Exit & Discard
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (currentScreen === 'checkout') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentScreen('customize')}
            className="mb-6 text-white/70 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Editor
          </Button>

          <Card className="p-8 bg-black/60 border-white/10">
            <h1 className="text-3xl font-bold mb-6 text-white">Review & Submit</h1>

            {/* Order Summary */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-white/80">Your Customizations</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {slots.map((budImageId, index) => {
                  if (!budImageId) return null;
                  return (
                    <div key={index} className="relative">
                      <div className="aspect-[2/3] rounded-lg overflow-hidden border-2 border-white/10">
                        {renderPreviewCanvas(index, 'thumbnail')}
                      </div>
                      <div className="text-xs text-center text-white/50 mt-1">
                        Variation {index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60">Product:</span>
                  <span className="font-semibold text-white">{product.attributes.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60">Customizations:</span>
                  <span className="font-semibold text-white">{filledSlotsCount} variations</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60">Background:</span>
                  <span className="font-semibold text-white">{activeBackground?.attributes.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60">Font:</span>
                  <span className="font-semibold text-white">{activeFont?.attributes.name}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-sm text-white/50">Order Type:</span>
                  <span className="text-sm font-semibold text-white">Custom Inquiry</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isSubmitting}
              className="w-full bg-orange-600 hover:bg-orange-700 py-6 text-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Submit Order Inquiry
                </>
              )}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (currentScreen === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
        <Card className="max-w-2xl w-full p-8 text-center bg-black/60 border-white/10">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-400" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Order Inquiry Submitted!</h1>
          <p className="text-white/60 mb-8">
            Thank you for your inquiry. Our team will review your customization and contact you shortly.
          </p>

          <div className="space-y-3 mb-8">
            {slots.map((budImageId, index) => {
              if (!budImageId) return null;
              const budImage = budImages.find(b => b.id === budImageId);
              return (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg"
                >
                  <div className="w-16 h-24 rounded overflow-hidden border border-white/10 flex-shrink-0">
                    {renderPreviewCanvas(index, 'thumbnail')}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-white">
                      Variation #{index + 1}
                    </div>
                    <div className="text-sm text-white/50">
                      {budImage?.attributes.name || `photo_${index + 1}.png`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleDownloadImages}
              disabled={isDownloading}
              className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Images...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Download All Images (ZIP)
                </>
              )}
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              className="w-full py-6 text-lg border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
            >
              Back to Products
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
