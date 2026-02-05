import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOnboardingTour, type TourStepConfig } from './useOnboardingTour';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/lib/api/onboarding', () => ({
  markTourComplete: vi.fn().mockResolvedValue({ success: true, onboarding_progress: {} }),
}));

const mockAddStep = vi.fn();
const mockStart = vi.fn();
const mockDestroy = vi.fn();
const mockOn = vi.fn();

vi.mock('shepherd.js', () => ({
  default: {
    Tour: function Tour() {
      this.addStep = mockAddStep;
      this.start = mockStart;
      this.destroy = mockDestroy;
      this.on = mockOn;
    },
  },
}));

vi.mock('shepherd.js/dist/css/shepherd.css', () => ({}), { virtual: true });

import { useAuthStore } from '@/stores/authStore';
import { markTourComplete } from '@/lib/api/onboarding';

const sampleSteps: TourStepConfig[] = [
  {
    id: 'step-1',
    title: 'Step One',
    text: 'Welcome to the tour.',
    attachTo: { element: '[data-tour="test"]', on: 'bottom' },
  },
];

describe('useOnboardingTour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not start the tour when the module is already completed', async () => {
    (useAuthStore as any).mockImplementation((selector: any) => {
      const state = {
        userProfile: {
          onboarding_progress: {
            products: { completed: true, completedAt: '2026-02-05T10:00:00.000Z' },
          },
        },
        isLoading: false,
      };
      return selector(state);
    });

    renderHook(() => useOnboardingTour({ moduleKey: 'products', steps: sampleSteps }));

    await new Promise((r) => setTimeout(r, 100));
    expect(mockStart).not.toHaveBeenCalled();
    expect(markTourComplete).not.toHaveBeenCalled();
  });

  it('does not start the tour while isLoading is true', async () => {
    (useAuthStore as any).mockImplementation((selector: any) => {
      const state = { userProfile: null, isLoading: true };
      return selector(state);
    });

    renderHook(() => useOnboardingTour({ moduleKey: 'products', steps: sampleSteps }));

    await new Promise((r) => setTimeout(r, 100));
    expect(mockStart).not.toHaveBeenCalled();
    expect(markTourComplete).not.toHaveBeenCalled();
  });

  it('does not start the tour when enabled is false', async () => {
    (useAuthStore as any).mockImplementation((selector: any) => {
      const state = { userProfile: { onboarding_progress: {} }, isLoading: false };
      return selector(state);
    });

    renderHook(() => useOnboardingTour({ moduleKey: 'products', steps: sampleSteps, enabled: false }));

    await new Promise((r) => setTimeout(r, 100));
    expect(mockStart).not.toHaveBeenCalled();
    expect(markTourComplete).not.toHaveBeenCalled();
  });

  it('calls markTourComplete on tour complete event', async () => {
    (useAuthStore as any).mockImplementation((selector: any) => {
      const state = { userProfile: { onboarding_progress: {} }, isLoading: false };
      return selector(state);
    });

    mockOn.mockImplementation((event: string, cb: () => void) => {
      if (event === 'complete') cb();
    });

    renderHook(() => useOnboardingTour({ moduleKey: 'products', steps: sampleSteps }));

    await waitFor(() => {
      expect(markTourComplete).toHaveBeenCalledWith('products');
    }, { timeout: 1000 });
  });

  it('calls markTourComplete on tour cancel event', async () => {
    (useAuthStore as any).mockImplementation((selector: any) => {
      const state = { userProfile: { onboarding_progress: {} }, isLoading: false };
      return selector(state);
    });

    mockOn.mockImplementation((event: string, cb: () => void) => {
      if (event === 'cancel') cb();
    });

    renderHook(() => useOnboardingTour({ moduleKey: 'orders', steps: sampleSteps }));

    await waitFor(() => {
      expect(markTourComplete).toHaveBeenCalledWith('orders');
    }, { timeout: 1000 });
  });
});
