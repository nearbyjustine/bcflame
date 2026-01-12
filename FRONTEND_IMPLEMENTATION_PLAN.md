# Frontend Implementation Plan
## BC Flame Customization Wizard

**Created:** 2026-01-12
**Status:** Backend Complete ✅ | Frontend Pending
**Phase:** Ready for Phase 2 - Frontend Component Extraction

---

## Progress Summary

### ✅ Phase 1: Backend Schema Updates (COMPLETE)

**Completed Tasks:**
1. ✅ Updated `OrderInquiry` schema
   - Added `total_weight` (decimal, required)
   - Added `weight_unit` (enum: g/oz/lb, default: "g")
   - File: `backend/src/api/order-inquiry/content-types/order-inquiry/schema.json`

2. ✅ Updated `PreBaggingOption` schema
   - Added `unit_size` (decimal, optional)
   - Added `unit_size_unit` (enum: g/oz, default: "g")
   - File: `backend/src/api/prebagging-option/content-types/prebagging-option/schema.json`

3. ✅ Created batch submission endpoint
   - Route: `POST /api/order-inquiries/batch`
   - Accepts array of inquiries, auto-sets customer, generates inquiry numbers
   - Returns all created inquiries with meta (inquiry_numbers, total)
   - Files:
     - `backend/src/api/order-inquiry/controllers/order-inquiry.ts`
     - `backend/src/api/order-inquiry/routes/order-inquiry.ts`

4. ✅ Enhanced lifecycle hooks
   - `beforeCreate`: Auto-generates `inquiry_number`, auto-sets customer
   - `afterCreate`: Placeholder for email notifications (TODO: implement)
   - File: `backend/src/api/order-inquiry/content-types/order-inquiry/lifecycles.ts`

**Important Note:**
- User schema update (`reseller_logo` field) must be added via Strapi Admin Content-Type Builder
- Navigate to: Settings → Users & Permissions plugin → User → Add field
- Field type: Media (single), allowed: images
- Field name: `reseller_logo`

**Backend Restart Required:**
```bash
# Restart Strapi to apply schema changes
docker-compose restart strapi
# OR locally:
cd backend && npm run develop
```

---

## 🚀 Phase 2: Frontend Component Extraction

### Overview
Extract the 800+ line monolithic React prototype into 6 modular, reusable components.

### Source Reference
Prototype code is in the user's message containing the full React `App.tsx` component.

---

### Step 5: Extract StepIndicator Component

**File:** `frontend/src/components/products/StepIndicator.tsx`

**Purpose:** Visual progress indicator for 4-step wizard

**Props Interface:**
```typescript
interface StepIndicatorProps {
  currentStep: number;  // 0-indexed
  totalSteps: number;   // Should be 4
}
```

**Implementation Notes:**
- Extract from prototype lines containing `[...Array(totalSteps)].map`
- Uses checkmark icon for completed steps
- Shows step number for upcoming steps
- Animated progress bar between steps
- Tailwind classes: `bg-orange-600` for active, `border-neutral-700` for inactive

**Code to Extract:**
```jsx
// From prototype modal footer area
<div className="flex justify-between items-center mb-8 px-2">
  {[...Array(totalSteps)].map((_, i) => (
    <React.Fragment key={i}>
      <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors duration-500 ${
        i <= currentStep ? 'bg-orange-600 border-orange-600 text-white' : 'border-neutral-700 text-neutral-600'
      }`}>
        {i < currentStep ? <Check size={16} /> : i + 1}
      </div>
      {i < totalSteps - 1 && (
        <div className={`flex-1 h-0.5 mx-4 transition-colors duration-500 ${
          i < currentStep ? 'bg-orange-600' : 'bg-neutral-800'
        }`} />
      )}
    </React.Fragment>
  ))}
</div>
```

**Checklist:**
- [ ] Create file `frontend/src/components/products/StepIndicator.tsx`
- [ ] Define `StepIndicatorProps` interface
- [ ] Copy JSX from prototype
- [ ] Import `Check` icon from lucide-react
- [ ] Add 'use client' directive
- [ ] Export component as default

**Test File:** `frontend/src/components/products/StepIndicator.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StepIndicator from './StepIndicator';

describe('StepIndicator', () => {
  it('renders all steps correctly', () => {
    render(<StepIndicator currentStep={1} totalSteps={4} />);

    // Should have 4 step circles
    const stepElements = screen.getAllByRole('generic').filter(
      el => el.className.includes('w-8 h-8')
    );
    expect(stepElements).toHaveLength(4);
  });

  it('shows checkmark for completed steps', () => {
    render(<StepIndicator currentStep={2} totalSteps={4} />);

    // Steps 0 and 1 should have checkmarks (completed)
    // Using data-testid approach is better:
    // Add data-testid="step-{i}" to each step div
  });

  it('shows step number for upcoming steps', () => {
    render(<StepIndicator currentStep={0} totalSteps={4} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('applies active styling to current and completed steps', () => {
    const { container } = render(<StepIndicator currentStep={2} totalSteps={4} />);

    // Steps 0, 1, 2 should have orange background
    const activeSteps = container.querySelectorAll('.bg-orange-600');
    expect(activeSteps.length).toBeGreaterThanOrEqual(3);
  });
});
```

---

### Step 6: Extract PhotoSelectionGrid Component

**File:** `frontend/src/components/products/PhotoSelectionGrid.tsx`

**Purpose:** Display product photos in grid, allow selection up to max limit (5 by default)

**Props Interface:**
```typescript
interface PhotoSelectionGridProps {
  photos: Array<{
    id: number;
    url: string;
    name?: string;
  }>;
  selectedPhotoIndices: number[];  // Array indices (0-based)
  maxSelections: number;            // Default: 5
  onToggle: (index: number) => void;
}
```

**Implementation Notes:**
- Grid layout: 2 columns mobile, 5 columns desktop (`grid-cols-2 md:grid-cols-5`)
- Show photo count badge: `{selectedPhotoIndices.length} / {maxSelections} Selected`
- Disable selection if max reached (but allow deselection)
- Visual feedback: orange border when selected, checkmark icon
- Image placeholder if photo URL not loaded

**Code to Extract:**
```jsx
// From prototype Step 1
<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
  {photos.map((photo, i) => (
    <div
      key={i}
      onClick={() => onToggle(i)}
      className={`aspect-square rounded-2xl cursor-pointer border-2 transition-all relative overflow-hidden group ${
        selectedPhotoIndices.includes(i) ? 'border-orange-500' : 'border-neutral-800 hover:border-neutral-700'
      }`}
    >
      <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      {selectedPhotoIndices.includes(i) && (
        <div className="absolute top-2 right-2 bg-orange-500 rounded-full p-1 text-white shadow-lg">
          <Check size={12} />
        </div>
      )}
    </div>
  ))}
</div>
```

**Checklist:**
- [ ] Create file `frontend/src/components/products/PhotoSelectionGrid.tsx`
- [ ] Define props interface
- [ ] Implement selection logic (prevent selection if max reached)
- [ ] Add image error handling (fallback placeholder)
- [ ] Import icons: `Check`, `ImageIcon` from lucide-react
- [ ] Add 'use client' directive

**Test File:** `frontend/src/components/products/PhotoSelectionGrid.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PhotoSelectionGrid from './PhotoSelectionGrid';

const mockPhotos = [
  { id: 1, url: '/photo1.jpg', name: 'Photo 1' },
  { id: 2, url: '/photo2.jpg', name: 'Photo 2' },
  { id: 3, url: '/photo3.jpg', name: 'Photo 3' },
  { id: 4, url: '/photo4.jpg', name: 'Photo 4' },
  { id: 5, url: '/photo5.jpg', name: 'Photo 5' },
  { id: 6, url: '/photo6.jpg', name: 'Photo 6' },
];

describe('PhotoSelectionGrid', () => {
  it('renders all photos', () => {
    const onToggle = vi.fn();
    render(
      <PhotoSelectionGrid
        photos={mockPhotos}
        selectedPhotoIndices={[]}
        maxSelections={5}
        onToggle={onToggle}
      />
    );

    expect(screen.getAllByRole('img')).toHaveLength(6);
  });

  it('allows selection up to max limit', () => {
    const onToggle = vi.fn();
    render(
      <PhotoSelectionGrid
        photos={mockPhotos}
        selectedPhotoIndices={[0, 1, 2, 3]}
        maxSelections={5}
        onToggle={onToggle}
      />
    );

    // Click unselected photo (index 4) - should call onToggle
    const photos = screen.getAllByRole('img');
    fireEvent.click(photos[4].parentElement!);

    expect(onToggle).toHaveBeenCalledWith(4);
  });

  it('prevents selection when max is reached', () => {
    const onToggle = vi.fn();
    render(
      <PhotoSelectionGrid
        photos={mockPhotos}
        selectedPhotoIndices={[0, 1, 2, 3, 4]} // Max 5 reached
        maxSelections={5}
        onToggle={onToggle}
      />
    );

    // Try to select 6th photo - should not call onToggle
    // Note: Implementation should prevent this in component logic
  });

  it('allows deselection even when max is reached', () => {
    const onToggle = vi.fn();
    render(
      <PhotoSelectionGrid
        photos={mockPhotos}
        selectedPhotoIndices={[0, 1, 2, 3, 4]}
        maxSelections={5}
        onToggle={onToggle}
      />
    );

    // Click selected photo (index 0) - should allow deselection
    const photos = screen.getAllByRole('img');
    fireEvent.click(photos[0].parentElement!);

    expect(onToggle).toHaveBeenCalledWith(0);
  });

  it('displays selection count badge', () => {
    render(
      <PhotoSelectionGrid
        photos={mockPhotos}
        selectedPhotoIndices={[0, 1, 2]}
        maxSelections={5}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText(/3 \/ 5 Selected/)).toBeInTheDocument();
  });
});
```

---

### Step 7: Extract BudStyleSelector Component

**File:** `frontend/src/components/products/BudStyleSelector.tsx`

**Purpose:** Select bud style(s) with support for both single and multi-select modes

**Props Interface:**
```typescript
interface BudStyle {
  id: number;
  attributes: {
    name: string;
    category: string;
    description?: string;
    image?: { data: { attributes: { url: string } } };
  };
}

interface BudStyleSelectorProps {
  budStyles: BudStyle[];
  selectedIds: number[];
  allowMultiple: boolean;  // From product.selection_limits
  onChange: (ids: number[]) => void;
  label?: string;
}
```

**Implementation Notes:**
- Use checkboxes if `allowMultiple === true`
- Use radio buttons if `allowMultiple === false`
- Display as vertical list with name, description (optional)
- Active state: `border-orange-500 bg-orange-500/10 text-white`
- Show category badge if present

**Code to Extract:**
```jsx
// From prototype Step 2 (Bud Style section)
<div className="space-y-2">
  {budStyles.map(style => (
    <button
      key={style.id}
      onClick={() => handleSelect(style.id)}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        selectedIds.includes(style.id)
          ? 'border-orange-500 bg-orange-500/10 text-white'
          : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'
      }`}
    >
      {style.attributes.name}
    </button>
  ))}
</div>
```

**Logic:**
```typescript
const handleSelect = (id: number) => {
  if (allowMultiple) {
    // Toggle in array
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  } else {
    // Single select
    onChange([id]);
  }
};
```

**Checklist:**
- [ ] Create file `frontend/src/components/products/BudStyleSelector.tsx`
- [ ] Define interfaces
- [ ] Implement multi/single select logic
- [ ] Add visual indicators for selection mode
- [ ] Import `Box` icon from lucide-react
- [ ] Add 'use client' directive

---

### Step 8: Implement BackgroundFontSelector Component

**File:** `frontend/src/components/products/BackgroundFontSelector.tsx`

**Purpose:** Combined selector for background styles, font styles, and optional logo upload

**Props Interface:**
```typescript
interface BackgroundFontSelectorProps {
  backgrounds: BackgroundStyle[];
  fonts: FontStyle[];
  selectedBackgrounds: number[];
  selectedFonts: number[];
  allowMultipleBackgrounds: boolean;
  allowMultipleFonts: boolean;
  onBackgroundChange: (ids: number[]) => void;
  onFontChange: (ids: number[]) => void;
  userLogo?: string | null;  // From authStore
  onLogoUpload?: (file: File) => void;
}
```

**Layout:**
- Two-column grid on desktop
- Left: Background selector
- Right: Font selector + Logo upload zone

**Code to Extract:**
```jsx
// From prototype Step 2 (right column)
<div className="grid md:grid-cols-2 gap-8">
  {/* Backgrounds */}
  <div>
    <label className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-3 block flex items-center space-x-2">
      <Palette size={14} /> <span>Background Theme</span>
    </label>
    {/* Grid of background options */}
  </div>

  {/* Fonts */}
  <div>
    <label className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-3 block flex items-center space-x-2">
      <Type size={14} /> <span>Typography</span>
    </label>
    {/* List of font options */}

    {/* Logo Upload */}
    <div className="mt-6">
      <label className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-3 block flex items-center space-x-2">
        <Upload size={14} /> <span>Reseller Identity</span>
      </label>
      <div className="p-6 rounded-2xl border-2 border-dashed border-neutral-800 flex flex-col items-center justify-center text-neutral-500 hover:border-orange-500/50 transition-colors cursor-pointer group">
        <Upload size={32} className="mb-2 group-hover:text-orange-500 transition-colors" />
        <p className="text-sm">Upload Business Logo</p>
        <p className="text-[10px] uppercase mt-1">PNG, SVG (Max 2MB)</p>
        {userLogo && <img src={userLogo} alt="Logo" className="mt-4 max-h-16" />}
      </div>
    </div>
  </div>
</div>
```

**File Upload Logic:**
```typescript
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file type and size
  if (!['image/png', 'image/svg+xml'].includes(file.type)) {
    alert('Only PNG and SVG files are allowed');
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    alert('File size must be under 2MB');
    return;
  }

  onLogoUpload?.(file);
};
```

**Checklist:**
- [ ] Create file `frontend/src/components/products/BackgroundFontSelector.tsx`
- [ ] Implement background grid selector
- [ ] Implement font list selector
- [ ] Add file upload input (hidden) with drag-and-drop zone
- [ ] Validate file type and size
- [ ] Show uploaded logo preview
- [ ] Import icons: `Palette`, `Type`, `Upload` from lucide-react

---

### Step 9: Extract PreBaggingConfig Component

**File:** `frontend/src/components/products/PreBaggingConfig.tsx`

**Purpose:** Select pre-bagging option and enter total weight, show calculated bag count

**Props Interface:**
```typescript
interface PreBaggingConfigProps {
  options: PreBaggingOption[];
  selectedId: number | null;
  totalWeight: number;  // in grams
  onOptionChange: (id: number) => void;
  onWeightChange: (weight: number) => void;
}
```

**Features:**
- Radio button list of bagging options
- Weight input with increment/decrement buttons
- Auto-calculate bag count if `option.unit_size` exists
  - Formula: `Math.floor(totalWeight / selectedOption.unit_size)`
  - Display: "Estimated 100 bags (3.5g each)"

**Code to Extract:**
```jsx
// From prototype Step 3
<div className="bg-neutral-950 p-8 rounded-3xl border border-neutral-800">
  <h4 className="text-xl font-bold mb-6 flex items-center space-x-2">
    <ShoppingBag size={20} className="text-orange-500" />
    <span>Pre-Bagging Service</span>
  </h4>
  <div className="space-y-4">
    {options.map(option => (
      <div
        key={option.id}
        onClick={() => onOptionChange(option.id)}
        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
          selectedId === option.id ? 'border-orange-500 bg-orange-500/5' : 'border-neutral-900 hover:border-neutral-800'
        }`}
      >
        <span className={selectedId === option.id ? 'text-white font-medium' : 'text-neutral-500'}>
          {option.attributes.name}
        </span>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          selectedId === option.id ? 'border-orange-500' : 'border-neutral-700'
        }`}>
          {selectedId === option.id && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
        </div>
      </div>
    ))}
  </div>

  {/* Weight Input */}
  <div className="mt-8">
    <label className="block text-sm font-bold text-neutral-500 uppercase mb-3">Total Weight (grams)</label>
    <div className="flex items-center space-x-4">
      <button
        onClick={() => onWeightChange(Math.max(0, totalWeight - 10))}
        className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-xl font-bold text-white"
      >
        -
      </button>
      <input
        type="number"
        value={totalWeight}
        onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0)}
        className="flex-1 h-12 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-center text-xl font-bold text-center"
      />
      <button
        onClick={() => onWeightChange(totalWeight + 10)}
        className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-xl font-bold text-white"
      >
        +
      </button>
    </div>
    {selectedOption?.attributes.unit_size && (
      <p className="mt-3 text-sm text-neutral-500 text-center">
        Estimated {Math.floor(totalWeight / selectedOption.attributes.unit_size)} bags
        ({selectedOption.attributes.unit_size}g each)
      </p>
    )}
  </div>
</div>
```

**Checklist:**
- [ ] Create file `frontend/src/components/products/PreBaggingConfig.tsx`
- [ ] Implement option selector (radio button style)
- [ ] Add weight input with increment/decrement
- [ ] Calculate and display bag count
- [ ] Import `ShoppingBag` icon from lucide-react

---

### Step 10: Implement CustomizationModal Orchestrator

**File:** `frontend/src/components/products/CustomizationModal.tsx`

**Purpose:** Main wizard orchestrator that manages step flow and integrates all sub-components

**Props Interface:**
```typescript
interface CustomizationModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (customization: CustomizationData) => void;
}

interface CustomizationData {
  productId: number;
  selectedPhotos: number[];  // indices
  selectedBudStyles: number[];
  selectedBackgrounds: number[];
  selectedFonts: number[];
  selectedPreBagging: number | null;
  totalWeight: number;
  weightUnit: string;
}
```

**State Management:**
```typescript
const [step, setStep] = useState(0);
const [selections, setSelections] = useState<CustomizationData>({
  productId: product?.id || 0,
  selectedPhotos: [],
  selectedBudStyles: [],
  selectedBackgrounds: [],
  selectedFonts: [],
  selectedPreBagging: null,
  totalWeight: 0,
  weightUnit: 'g',
});
```

**Step Flow:**
1. **Step 0:** PhotoSelectionGrid
2. **Step 1:** BudStyleSelector + BackgroundFontSelector
3. **Step 2:** PreBaggingConfig
4. **Step 3:** Summary Review

**Modal Structure:**
```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/90 backdrop-blur-md">
  <div className="bg-neutral-900 w-full max-w-4xl max-h-[90vh] rounded-[40px] border border-neutral-800 shadow-2xl flex flex-col overflow-hidden">

    {/* Header */}
    <div className="p-8 border-b border-neutral-800 flex justify-between items-start">
      <div>
        <span className="text-orange-500 font-bold uppercase tracking-widest text-xs">
          Phase 1: Customization
        </span>
        <h2 className="text-3xl font-black mt-1">Configure {product?.attributes.name}</h2>
      </div>
      <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
        <X size={24} />
      </button>
    </div>

    {/* Body with StepIndicator */}
    <div className="flex-1 overflow-y-auto p-8">
      <StepIndicator currentStep={step} totalSteps={4} />

      {/* Conditional Step Rendering */}
      {step === 0 && <PhotoSelectionGrid {...photoProps} />}
      {step === 1 && (
        <div className="grid md:grid-cols-2 gap-8">
          <BudStyleSelector {...budProps} />
          <BackgroundFontSelector {...bgFontProps} />
        </div>
      )}
      {step === 2 && <PreBaggingConfig {...bagProps} />}
      {step === 3 && <SummaryView selections={selections} product={product} />}
    </div>

    {/* Footer Navigation */}
    <div className="p-8 border-t border-neutral-800 flex justify-between">
      <button
        onClick={() => setStep(Math.max(0, step - 1))}
        disabled={step === 0}
        className="flex items-center space-x-2 text-neutral-400 hover:text-white disabled:opacity-0"
      >
        <ChevronLeft size={20} />
        <span>Back</span>
      </button>

      {step < 3 ? (
        <button
          onClick={() => setStep(step + 1)}
          disabled={!canProceed(step, selections)}
          className="flex items-center space-x-2 bg-neutral-800 hover:bg-neutral-700 px-8 py-3 rounded-xl font-bold"
        >
          <span>Continue</span>
          <ChevronRight size={20} />
        </button>
      ) : (
        <button
          onClick={() => onAddToCart(selections)}
          className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-10 py-3 rounded-xl font-bold"
        >
          <CheckCircle2 size={20} />
          <span>Confirm Configuration</span>
        </button>
      )}
    </div>
  </div>
</div>
```

**Validation Logic:**
```typescript
const canProceed = (currentStep: number, data: CustomizationData): boolean => {
  switch (currentStep) {
    case 0:
      return data.selectedPhotos.length > 0;  // At least 1 photo
    case 1:
      return data.selectedBudStyles.length > 0;  // At least 1 bud style
    case 2:
      return data.selectedPreBagging !== null && data.totalWeight > 0;
    default:
      return true;
  }
};
```

**Checklist:**
- [ ] Create file `frontend/src/components/products/CustomizationModal.tsx`
- [ ] Set up state for step navigation and selections
- [ ] Implement step validation logic
- [ ] Import all sub-components
- [ ] Add modal close on backdrop click (optional)
- [ ] Add 'use client' directive
- [ ] Integrate with product data (fetch selection limits)

---

## 🔄 Phase 3: State Management Integration

### Step 11: Update customizationStore.ts

**File:** `frontend/src/stores/customizationStore.ts`

**Purpose:** Centralize customization state, cart management, and batch submission

**State Shape:**
```typescript
interface CustomizationStore {
  // Current customization session
  currentProduct: Product | null;
  selectedPhotos: number[];
  selectedBudStyles: number[];
  selectedBackgrounds: number[];
  selectedFonts: number[];
  selectedPreBagging: number | null;
  totalWeight: number;
  weightUnit: string;

  // Cart
  cart: CartItem[];

  // Actions
  setProduct: (product: Product) => void;
  togglePhoto: (index: number, max: number) => void;
  toggleBudStyle: (id: number, allowMultiple: boolean) => void;
  toggleBackground: (id: number, allowMultiple: boolean) => void;
  toggleFont: (id: number, allowMultiple: boolean) => void;
  setPreBagging: (id: number) => void;
  setTotalWeight: (weight: number) => void;
  addToCart: () => void;
  removeFromCart: (cartItemId: string) => void;
  clearCurrentSelections: () => void;
  clearCart: () => void;

  // Async actions
  submitCart: () => Promise<{ success: boolean; inquiryNumbers?: string[] }>;
}

interface CartItem {
  id: string;  // UUID
  product: Product;
  customization: {
    selectedPhotos: number[];
    selectedBudStyles: number[];
    selectedBackgrounds: number[];
    selectedFonts: number[];
    selectedPreBagging: number | null;
    totalWeight: number;
    weightUnit: string;
  };
  addedAt: string;  // ISO timestamp
}
```

**Implementation:**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { submitBatchOrderInquiries } from '@/lib/api/customization';

export const useCustomizationStore = create<CustomizationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentProduct: null,
      selectedPhotos: [],
      selectedBudStyles: [],
      selectedBackgrounds: [],
      selectedFonts: [],
      selectedPreBagging: null,
      totalWeight: 0,
      weightUnit: 'g',
      cart: [],

      // Actions
      setProduct: (product) => set({ currentProduct: product }),

      togglePhoto: (index, max) => set((state) => {
        const current = state.selectedPhotos;
        if (current.includes(index)) {
          return { selectedPhotos: current.filter(i => i !== index) };
        } else if (current.length < max) {
          return { selectedPhotos: [...current, index] };
        }
        return state;
      }),

      toggleBudStyle: (id, allowMultiple) => set((state) => {
        if (allowMultiple) {
          const current = state.selectedBudStyles;
          return {
            selectedBudStyles: current.includes(id)
              ? current.filter(i => i !== id)
              : [...current, id]
          };
        } else {
          return { selectedBudStyles: [id] };
        }
      }),

      toggleBackground: (id, allowMultiple) => set((state) => {
        if (allowMultiple) {
          const current = state.selectedBackgrounds;
          return {
            selectedBackgrounds: current.includes(id)
              ? current.filter(i => i !== id)
              : [...current, id]
          };
        } else {
          return { selectedBackgrounds: [id] };
        }
      }),

      toggleFont: (id, allowMultiple) => set((state) => {
        if (allowMultiple) {
          const current = state.selectedFonts;
          return {
            selectedFonts: current.includes(id)
              ? current.filter(i => i !== id)
              : [...current, id]
          };
        } else {
          return { selectedFonts: [id] };
        }
      }),

      setPreBagging: (id) => set({ selectedPreBagging: id }),
      setTotalWeight: (weight) => set({ totalWeight: weight }),

      addToCart: () => set((state) => {
        if (!state.currentProduct) return state;

        const cartItem: CartItem = {
          id: `cart-${Date.now()}-${Math.random()}`,
          product: state.currentProduct,
          customization: {
            selectedPhotos: state.selectedPhotos,
            selectedBudStyles: state.selectedBudStyles,
            selectedBackgrounds: state.selectedBackgrounds,
            selectedFonts: state.selectedFonts,
            selectedPreBagging: state.selectedPreBagging,
            totalWeight: state.totalWeight,
            weightUnit: state.weightUnit,
          },
          addedAt: new Date().toISOString(),
        };

        return {
          cart: [...state.cart, cartItem],
          // Clear current selections
          currentProduct: null,
          selectedPhotos: [],
          selectedBudStyles: [],
          selectedBackgrounds: [],
          selectedFonts: [],
          selectedPreBagging: null,
          totalWeight: 0,
        };
      }),

      removeFromCart: (cartItemId) => set((state) => ({
        cart: state.cart.filter(item => item.id !== cartItemId),
      })),

      clearCurrentSelections: () => set({
        currentProduct: null,
        selectedPhotos: [],
        selectedBudStyles: [],
        selectedBackgrounds: [],
        selectedFonts: [],
        selectedPreBagging: null,
        totalWeight: 0,
      }),

      clearCart: () => set({ cart: [] }),

      submitCart: async () => {
        const { cart } = get();

        if (cart.length === 0) {
          return { success: false };
        }

        try {
          // Transform cart items to API format
          const inquiries = cart.map(item => ({
            product: item.product.id,
            selected_photos: item.customization.selectedPhotos,
            selected_bud_styles: item.customization.selectedBudStyles,
            selected_backgrounds: item.customization.selectedBackgrounds,
            selected_fonts: item.customization.selectedFonts,
            selected_prebagging: item.customization.selectedPreBagging ? [item.customization.selectedPreBagging] : [],
            total_weight: item.customization.totalWeight,
            weight_unit: item.customization.weightUnit,
            notes: '',
          }));

          const response = await submitBatchOrderInquiries(inquiries);

          // Clear cart on success
          set({ cart: [] });

          return {
            success: true,
            inquiryNumbers: response.meta.inquiry_numbers,
          };
        } catch (error) {
          console.error('Failed to submit cart:', error);
          return { success: false };
        }
      },
    }),
    {
      name: 'customization-storage',
      partialize: (state) => ({ cart: state.cart }), // Only persist cart
    }
  )
);
```

**Checklist:**
- [ ] Update `frontend/src/stores/customizationStore.ts`
- [ ] Add all state properties
- [ ] Implement all actions
- [ ] Add localStorage persistence for cart
- [ ] Import API functions
- [ ] Add TypeScript interfaces

---

### Step 12: Update authStore.ts

**File:** `frontend/src/stores/authStore.ts`

**Purpose:** Add user profile with logo upload functionality

**Additions:**
```typescript
interface AuthStore {
  // Existing fields
  user: User | null;
  isAuthenticated: boolean;

  // NEW: User profile
  userProfile: UserProfile | null;

  // Existing actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;

  // NEW: Profile actions
  fetchUserProfile: () => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  reseller_logo?: {
    id: number;
    url: string;
    name: string;
  };
}
```

**Implementation:**
```typescript
import { uploadUserLogo, getUserProfile } from '@/lib/api/user';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // ... existing state

      userProfile: null,

      fetchUserProfile: async () => {
        try {
          const profile = await getUserProfile();
          set({ userProfile: profile });
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      },

      uploadLogo: async (file: File) => {
        try {
          const updatedProfile = await uploadUserLogo(file);
          set({ userProfile: updatedProfile });
        } catch (error) {
          console.error('Logo upload failed:', error);
          throw error;
        }
      },

      // Update login to fetch profile
      login: async (email, password) => {
        // ... existing login logic

        // After successful login
        const { fetchUserProfile } = get();
        await fetchUserProfile();
      },
    }),
    { name: 'auth-storage' }
  )
);
```

**Checklist:**
- [ ] Update `frontend/src/stores/authStore.ts`
- [ ] Add `userProfile` state
- [ ] Implement `fetchUserProfile` action
- [ ] Implement `uploadLogo` action
- [ ] Call `fetchUserProfile` after login
- [ ] Import user API functions

---

## 🌐 Phase 4: API Integration

### Step 13: Add Batch & Logo Endpoints to Customization API

**File:** `frontend/src/lib/api/customization.ts`

**Add Function:**
```typescript
/**
 * Submit multiple order inquiries in a batch
 */
export async function submitBatchOrderInquiries(
  inquiries: Array<{
    product: number;
    selected_photos: number[];
    selected_bud_styles: number[];
    selected_backgrounds: number[];
    selected_fonts: number[];
    selected_prebagging: number[];
    total_weight: number;
    weight_unit: string;
    notes?: string;
  }>
): Promise<{
  data: OrderInquiry[];
  meta: {
    inquiry_numbers: string[];
    total: number;
  };
}> {
  const response = await strapiApi.post('/api/order-inquiries/batch', {
    inquiries,
  });
  return response.data;
}
```

**Checklist:**
- [ ] Add `submitBatchOrderInquiries` function
- [ ] Update TypeScript types if needed
- [ ] Test API response shape

---

### Step 14: Create User API Client

**File:** `frontend/src/lib/api/user.ts` (NEW)

**Purpose:** Handle user profile and logo upload

**Implementation:**
```typescript
import { strapiApi } from './strapi';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  reseller_logo?: {
    id: number;
    url: string;
    name: string;
  };
}

/**
 * Get authenticated user's profile with logo
 */
export async function getUserProfile(): Promise<UserProfile> {
  const response = await strapiApi.get('/api/users/me', {
    params: {
      populate: 'reseller_logo',
    },
  });
  return response.data;
}

/**
 * Upload user logo and update profile
 */
export async function uploadUserLogo(file: File): Promise<UserProfile> {
  // Step 1: Upload file to Strapi media library
  const formData = new FormData();
  formData.append('files', file);

  const uploadResponse = await strapiApi.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const uploadedFile = uploadResponse.data[0];

  // Step 2: Update user profile with logo ID
  const updateResponse = await strapiApi.put('/api/users/me', {
    reseller_logo: uploadedFile.id,
  });

  return updateResponse.data;
}
```

**Checklist:**
- [ ] Create file `frontend/src/lib/api/user.ts`
- [ ] Implement `getUserProfile`
- [ ] Implement `uploadUserLogo`
- [ ] Add TypeScript interfaces
- [ ] Handle errors appropriately

---

### Step 15: Update Products API

**File:** `frontend/src/lib/api/products.ts`

**Add Function:**
```typescript
/**
 * Get single product with all customization data
 */
export async function getProductWithPhotos(id: number): Promise<Product> {
  const response = await strapiApi.get<{ data: Product }>(`/api/products/${id}`, {
    params: {
      populate: ['images', 'available_photos', 'pricing', 'features', 'selection_limits'],
    },
  });
  return response.data.data;
}
```

**Update Existing:**
```typescript
export async function getProducts(): Promise<Product[]> {
  const response = await strapiApi.get<ProductsResponse>('/api/products', {
    params: {
      populate: ['images', 'pricing'],  // Add 'available_photos' if needed in grid
      filters: {
        customization_enabled: true,
      },
    },
  });
  return response.data.data;
}
```

**Checklist:**
- [ ] Add `getProductWithPhotos` function
- [ ] Update `getProducts` to populate images
- [ ] Verify `Product` type includes `available_photos`

---

## 📄 Phase 5: Page Integration

### Step 16: Update Products Page

**File:** `frontend/src/app/(portal)/products/page.tsx`

**Changes:**
1. Fetch products from API using `getProducts()`
2. Add loading state
3. Render CustomizationModal
4. Pass product to modal on "Customize" button click

**Implementation:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { getProducts } from '@/lib/api/products';
import { getBudStyles, getBackgroundStyles, getFontStyles, getPreBaggingOptions } from '@/lib/api/customization';
import ProductCard from '@/components/products/ProductCard';
import CustomizationModal from '@/components/products/CustomizationModal';
import type { Product } from '@/types/product';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsData] = await Promise.all([
          getProducts(),
          // Prefetch customization options
          getBudStyles(),
          getBackgroundStyles(),
          getFontStyles(),
          getPreBaggingOptions(),
        ]);
        setProducts(productsData);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div>Loading products...</div>;  // TODO: Add skeleton loader
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onCustomize={() => setSelectedProduct(product)}
          />
        ))}
      </div>

      <CustomizationModal
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(customization) => {
          // Handled by CustomizationModal internally using store
          setSelectedProduct(null);
        }}
      />
    </>
  );
}
```

**Checklist:**
- [ ] Import API functions
- [ ] Add state for products and loading
- [ ] Fetch products on mount
- [ ] Prefetch customization options
- [ ] Render CustomizationModal
- [ ] Add loading skeleton (optional)

---

### Step 17: Update Orders Page

**File:** `frontend/src/app/(portal)/orders/page.tsx`

**Changes:**
1. Display cart from `customizationStore`
2. Fetch order history from API
3. Implement "Finish Order" → batch submit
4. Show success message with inquiry numbers

**Implementation:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useCustomizationStore } from '@/stores/customizationStore';
import { getMyOrderInquiries } from '@/lib/api/customization';
import type { OrderInquiry } from '@/types/customization';

export default function OrdersPage() {
  const { cart, removeFromCart, submitCart } = useCustomizationStore();
  const [orderHistory, setOrderHistory] = useState<OrderInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const orders = await getMyOrderInquiries();
        setOrderHistory(orders);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleFinishOrder = async () => {
    if (cart.length === 0) return;

    setSubmitting(true);
    try {
      const result = await submitCart();

      if (result.success) {
        setSuccessMessage(
          `Order submitted! Inquiry numbers: ${result.inquiryNumbers?.join(', ')}`
        );

        // Refresh order history
        const orders = await getMyOrderInquiries();
        setOrderHistory(orders);
      }
    } catch (error) {
      console.error('Order submission failed:', error);
      alert('Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-8 p-4 bg-green-500/10 border border-green-500 rounded-xl text-green-500">
          {successMessage}
        </div>
      )}

      {/* Current Cart */}
      {cart.length > 0 && (
        <div className="mb-12 bg-neutral-900 rounded-3xl border border-orange-500/30 p-8">
          <h3 className="text-2xl font-bold mb-6">Current Batch ({cart.length} items)</h3>

          <div className="space-y-4 mb-8">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-neutral-950 rounded-2xl">
                <div>
                  <p className="font-bold">{item.product.attributes.name}</p>
                  <p className="text-xs text-neutral-500">
                    {item.customization.totalWeight}g • {item.customization.selectedPhotos.length} photos
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-400"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleFinishOrder}
              disabled={submitting}
              className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Finish Order & Notify Staff'}
            </button>
          </div>
        </div>
      )}

      {/* Order History */}
      <h3 className="text-xl font-bold mb-6">Order History</h3>
      {loading ? (
        <div>Loading orders...</div>
      ) : (
        <div className="bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-neutral-950 border-b border-neutral-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">Inquiry #</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {orderHistory.map(order => (
                <tr key={order.id} className="hover:bg-neutral-800/50">
                  <td className="px-6 py-4 font-mono text-sm">{order.attributes.inquiry_number}</td>
                  <td className="px-6 py-4 text-sm text-neutral-400">
                    {new Date(order.attributes.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-orange-500/10 text-orange-500">
                      {order.attributes.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**Checklist:**
- [ ] Import customization store
- [ ] Display cart items
- [ ] Implement batch submit
- [ ] Fetch and display order history
- [ ] Add success/error messaging
- [ ] Add loading states

---

### Step 18: Create Settings Page

**File:** `frontend/src/app/(portal)/settings/page.tsx` (NEW)

**Purpose:** User profile settings with logo upload

**Implementation:**
```typescript
'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Upload } from 'lucide-react';

export default function SettingsPage() {
  const { userProfile, uploadLogo } = useAuthStore();
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!['image/png', 'image/svg+xml', 'image/jpeg'].includes(file.type)) {
      alert('Only PNG, JPG, and SVG files are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be under 2MB');
      return;
    }

    setUploading(true);
    try {
      await uploadLogo(file);
      alert('Logo uploaded successfully!');
    } catch (error) {
      alert('Logo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* Profile Info */}
      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-8 mb-8">
        <h2 className="text-xl font-bold mb-6">Profile Information</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-neutral-500">Username</label>
            <p className="text-lg font-semibold">{userProfile?.username}</p>
          </div>
          <div>
            <label className="text-sm text-neutral-500">Email</label>
            <p className="text-lg font-semibold">{userProfile?.email}</p>
          </div>
        </div>
      </div>

      {/* Logo Upload */}
      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-8">
        <h2 className="text-xl font-bold mb-6">Reseller Logo</h2>

        <div className="space-y-6">
          {/* Current Logo */}
          {userProfile?.reseller_logo && (
            <div>
              <p className="text-sm text-neutral-500 mb-3">Current Logo</p>
              <img
                src={`${process.env.NEXT_PUBLIC_STRAPI_URL}${userProfile.reseller_logo.url}`}
                alt="Current logo"
                className="max-h-32 border border-neutral-800 rounded-xl p-4 bg-neutral-950"
              />
            </div>
          )}

          {/* Upload Zone */}
          <div>
            <label htmlFor="logo-upload" className="block">
              <div className="p-8 rounded-2xl border-2 border-dashed border-neutral-800 flex flex-col items-center justify-center text-neutral-500 hover:border-orange-500/50 transition-colors cursor-pointer group">
                <Upload size={48} className="mb-4 group-hover:text-orange-500 transition-colors" />
                <p className="text-lg font-semibold mb-1">
                  {uploading ? 'Uploading...' : 'Upload New Logo'}
                </p>
                <p className="text-sm">PNG, JPG, SVG (Max 2MB)</p>
              </div>
            </label>
            <input
              id="logo-upload"
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              onChange={handleLogoUpload}
              disabled={uploading}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Checklist:**
- [ ] Create file `frontend/src/app/(portal)/settings/page.tsx`
- [ ] Import auth store
- [ ] Display user profile info
- [ ] Implement logo upload
- [ ] Add file validation
- [ ] Show current logo if exists
- [ ] Add loading state

---

## 🎨 Phase 6: Testing & Polish

### Step 19: Add Loading States and Error Handling

**Tasks:**
- [ ] Add skeleton loaders to product grid
- [ ] Add spinner during order submission
- [ ] Disable "Finish Order" button while submitting
- [ ] Add toast notifications for errors (consider: react-hot-toast)
- [ ] Add validation error messages in modal steps
- [ ] Add network error retry logic

**Example Skeleton Loader:**
```tsx
// In products/page.tsx
{loading && (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-neutral-900 rounded-3xl border border-neutral-800 p-5 animate-pulse">
        <div className="h-48 rounded-2xl bg-neutral-800 mb-4" />
        <div className="h-6 bg-neutral-800 rounded mb-2" />
        <div className="h-4 bg-neutral-800 rounded w-2/3" />
      </div>
    ))}
  </div>
)}
```

---

### Step 20: Test End-to-End Flow

**Manual Testing Checklist:**
- [ ] User can login and see products
- [ ] Click "Customize" opens modal
- [ ] Step 1: Select photos (enforce max 5)
- [ ] Step 2: Select bud styles, backgrounds, fonts
- [ ] Step 3: Select bag type, enter weight, see calculated bag count
- [ ] Step 4: Review summary, add to cart
- [ ] Cart displays items correctly
- [ ] "Finish Order" submits batch to backend
- [ ] Order history shows new inquiries
- [ ] Settings page allows logo upload
- [ ] Logo appears in user profile

**Backend Verification:**
- [ ] Check Strapi admin panel for created order inquiries
- [ ] Verify `inquiry_number` format (INQ-YYYYMMDD-XXXX)
- [ ] Verify all relations are saved (product, customer)
- [ ] Verify `total_weight` and `weight_unit` are saved
- [ ] Check logs for lifecycle hook execution

---

## 📝 Type Definitions Updates

### Update customization.ts Types

Add to `frontend/src/types/customization.ts`:

```typescript
// Cart item type
export interface CartItem {
  id: string;
  product: Product;
  customization: {
    selectedPhotos: number[];
    selectedBudStyles: number[];
    selectedBackgrounds: number[];
    selectedFonts: number[];
    selectedPreBagging: number | null;
    totalWeight: number;
    weightUnit: string;
  };
  addedAt: string;
}

// Batch submission request
export interface BatchOrderInquiryRequest {
  inquiries: Array<{
    product: number;
    selected_photos: number[];
    selected_bud_styles: number[];
    selected_backgrounds: number[];
    selected_fonts: number[];
    selected_prebagging: number[];
    total_weight: number;
    weight_unit: string;
    notes?: string;
  }>;
}

// Batch submission response
export interface BatchOrderInquiryResponse {
  data: OrderInquiry[];
  meta: {
    inquiry_numbers: string[];
    total: number;
  };
}
```

### Update product.ts Types

Ensure `frontend/src/types/product.ts` includes:

```typescript
export interface Product {
  id: number;
  attributes: {
    name: string;
    sku: string;
    category: 'Indica' | 'Hybrid' | 'Sativa';
    description: string;
    // ... other fields

    customization_enabled: boolean;
    available_photos?: {
      data: Array<{
        id: number;
        attributes: {
          url: string;
          name: string;
          alternativeText?: string;
        };
      }>;
    };
    selection_limits?: {
      data: Array<{
        id: number;
        attributes: {
          option_type: 'photos' | 'bud_styles' | 'backgrounds' | 'fonts' | 'prebagging';
          min_selections: number;
          max_selections: number;
        };
      }>;
    };
  };
}
```

---

## 🚀 Next Session Quick Start

**To resume implementation:**

1. **Restart Backend (Apply Schema Changes):**
   ```bash
   cd /Users/justinecastaneda/Desktop/bcflame
   docker-compose restart strapi
   # Wait for startup, then verify:
   docker-compose logs -f strapi
   ```

2. **Add User Logo Field via Strapi Admin:**
   - Navigate to: http://localhost:1337/admin
   - Settings → Users & Permissions plugin → User
   - Click "Add another field"
   - Type: Media (single), Field name: `reseller_logo`
   - Save

3. **Start Frontend Component Implementation:**
   - Begin with Step 5: StepIndicator (simplest component)
   - Test each component in isolation before integration
   - Use the prototype code from user's message as reference

4. **Verify Backend API:**
   ```bash
   # Test batch endpoint
   curl -X POST http://localhost:1337/api/order-inquiries/batch \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"inquiries": [{"product": 1, "selected_photos": [0,1], "selected_bud_styles": [1], "selected_backgrounds": [1], "selected_fonts": [1], "selected_prebagging": [1], "total_weight": 100, "weight_unit": "g"}]}'
   ```

5. **Reference Files:**
   - Plan: `/Users/justinecastaneda/.claude/plans/enumerated-finding-crane.md`
   - This document: `/Users/justinecastaneda/Desktop/bcflame/FRONTEND_IMPLEMENTATION_PLAN.md`
   - Prototype: User's original React component code

---

## 📊 Progress Tracker

### Backend (4/4 Complete) ✅
- [x] OrderInquiry schema update
- [x] PreBaggingOption schema update
- [x] Batch submission controller
- [x] Lifecycle hooks

### Frontend Components (0/6 Complete)
- [ ] StepIndicator
- [ ] PhotoSelectionGrid
- [ ] BudStyleSelector
- [ ] BackgroundFontSelector
- [ ] PreBaggingConfig
- [ ] CustomizationModal

### State Management (0/2 Complete)
- [ ] customizationStore
- [ ] authStore

### API Integration (1/3 Complete)
- [x] customization.ts (batch endpoint pending)
- [ ] user.ts (NEW)
- [ ] products.ts (update pending)

### Pages (0/3 Complete)
- [ ] products/page.tsx
- [ ] orders/page.tsx
- [ ] settings/page.tsx (NEW)

### Testing & Polish (0/2 Complete)
- [ ] Loading states & error handling
- [ ] End-to-end testing

---

**Total Progress: 5 / 20 tasks complete (25%)**

**Estimated Remaining Work:** 15 implementation steps

**Next Priority:** Phase 2 - Frontend Component Extraction (Steps 5-10)

---

## 🧪 Testing Strategy

### Component Testing Approach
All components should be tested using **Vitest + React Testing Library** following TDD principles.

**Test File Naming:** `ComponentName.test.tsx` (alongside implementation)

**Required Test Coverage:**
- [ ] StepIndicator.test.tsx - Step progression UI
- [ ] PhotoSelectionGrid.test.tsx - Photo selection logic
- [ ] BudStyleSelector.test.tsx - Multi/single select behavior
- [ ] BackgroundFontSelector.test.tsx - Combined selectors + file upload
- [ ] PreBaggingConfig.test.tsx - Weight input + bag calculation
- [ ] CustomizationModal.test.tsx - Wizard orchestration

### Store Testing
- [ ] customizationStore.test.ts - Cart logic, batch submission
- [ ] authStore.test.ts (update existing) - Logo upload, profile fetch

### API Integration Testing
- [ ] user.test.ts - Profile + logo upload API calls
- [ ] products.test.ts (update existing) - Populate available_photos

### Testing Commands
```bash
cd frontend

# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm run test PhotoSelectionGrid

# Generate coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Test Setup Requirements
Ensure `frontend/src/test/setup.ts` includes:

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_STRAPI_URL = 'http://localhost:1337';
```

### Sample Test Pattern for Stores

```typescript
// customizationStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useCustomizationStore } from './customizationStore';
import { act, renderHook } from '@testing-library/react';

describe('customizationStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { clearCart, clearCurrentSelections } = useCustomizationStore.getState();
    clearCart();
    clearCurrentSelections();
  });

  it('toggles photo selection', () => {
    const { result } = renderHook(() => useCustomizationStore());

    act(() => {
      result.current.togglePhoto(0, 5); // Select index 0, max 5
    });

    expect(result.current.selectedPhotos).toContain(0);

    act(() => {
      result.current.togglePhoto(0, 5); // Deselect
    });

    expect(result.current.selectedPhotos).not.toContain(0);
  });

  it('prevents photo selection beyond max limit', () => {
    const { result } = renderHook(() => useCustomizationStore());

    act(() => {
      // Select 5 photos (max)
      result.current.togglePhoto(0, 5);
      result.current.togglePhoto(1, 5);
      result.current.togglePhoto(2, 5);
      result.current.togglePhoto(3, 5);
      result.current.togglePhoto(4, 5);

      // Try to select 6th - should be prevented
      result.current.togglePhoto(5, 5);
    });

    expect(result.current.selectedPhotos).toHaveLength(5);
    expect(result.current.selectedPhotos).not.toContain(5);
  });

  it('adds item to cart with correct structure', () => {
    const { result } = renderHook(() => useCustomizationStore());

    const mockProduct = {
      id: 1,
      attributes: { name: 'Test Product' }
    };

    act(() => {
      result.current.setProduct(mockProduct);
      result.current.togglePhoto(0, 5);
      result.current.toggleBudStyle(1, true);
      result.current.setTotalWeight(100);
      result.current.addToCart();
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0]).toMatchObject({
      product: mockProduct,
      customization: {
        selectedPhotos: [0],
        selectedBudStyles: [1],
        totalWeight: 100,
      },
    });

    // Should clear current selections after adding to cart
    expect(result.current.selectedPhotos).toHaveLength(0);
  });
});
```

### Integration Test Example

```typescript
// CustomizationModal.test.tsx (integration test)
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomizationModal from './CustomizationModal';

const mockProduct = {
  id: 1,
  attributes: {
    name: 'Test Product',
    available_photos: {
      data: [
        { id: 1, attributes: { url: '/photo1.jpg' } },
        { id: 2, attributes: { url: '/photo2.jpg' } },
      ],
    },
  },
};

describe('CustomizationModal Integration', () => {
  it('completes full wizard flow', async () => {
    const onClose = vi.fn();
    const onAddToCart = vi.fn();

    render(
      <CustomizationModal
        product={mockProduct}
        isOpen={true}
        onClose={onClose}
        onAddToCart={onAddToCart}
      />
    );

    // Step 0: Select photo
    const photo = screen.getAllByRole('img')[0];
    fireEvent.click(photo.parentElement!);

    // Continue to next step
    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);

    // Step 1: Select bud style (would need mock API responses)
    // ... test other steps

    // Step 3: Submit
    const confirmButton = screen.getByText('Confirm Configuration');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onAddToCart).toHaveBeenCalled();
    });
  });

  it('validates step progression', () => {
    render(
      <CustomizationModal
        product={mockProduct}
        isOpen={true}
        onClose={vi.fn()}
        onAddToCart={vi.fn()}
      />
    );

    // Continue button should be disabled if no photos selected
    const continueButton = screen.getByText('Continue');
    expect(continueButton).toBeDisabled();

    // Select photo
    const photo = screen.getAllByRole('img')[0];
    fireEvent.click(photo.parentElement!);

    // Now continue should be enabled
    expect(continueButton).not.toBeDisabled();
  });
});
```

---

## 📋 Test Checklist Summary

**Component Tests (6):**
- [ ] StepIndicator.test.tsx
- [ ] PhotoSelectionGrid.test.tsx
- [ ] BudStyleSelector.test.tsx
- [ ] BackgroundFontSelector.test.tsx
- [ ] PreBaggingConfig.test.tsx
- [ ] CustomizationModal.test.tsx

**Store Tests (2):**
- [ ] customizationStore.test.ts
- [ ] authStore.test.ts (update existing)

**API Tests (2):**
- [ ] user.test.ts
- [ ] products.test.ts (update existing)

**Target Coverage:** 70%+ for all modules

---
