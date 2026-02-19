import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOnboardingTour, type TourStepConfig } from './useOnboardingTour';

const mockSetUserProfile = vi.fn();

vi.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(vi.fn(), {
    getState: vi.fn(() => ({ userProfile: { onboarding_progress: {} } })),
  }),
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
    Tour: class Tour {
      addStep = mockAddStep;
      start = mockStart;
      destroy = mockDestroy;
      on = mockOn;
    },
  },
}));

vi.mock('shepherd.js/dist/css/shepherd.css', () => ({}));

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
    type AuthStoreState = {
      userProfile: { onboarding_progress: { products: { completed: boolean; completedAt: string } } } | null;
      isLoading: boolean;
      setUserProfile: typeof mockSetUserProfile;
    };
    (useAuthStore as unknown as Mock).mockImplementation((selector: (state: AuthStoreState) => unknown) => {
      const state: AuthStoreState = {
        userProfile: {
          onboarding_progress: {
            products: { completed: true, completedAt: '2026-02-05T10:00:00.000Z' },
          },
        },
        isLoading: false,
        setUserProfile: mockSetUserProfile,
      };
      return selector(state);
    });

    renderHook(() => useOnboardingTour({ moduleKey: 'products', steps: sampleSteps }));

    await new Promise((r) => setTimeout(r, 100));
    expect(mockStart).not.toHaveBeenCalled();
    expect(markTourComplete).not.toHaveBeenCalled();
  });

  it('does not start the tour while isLoading is true', async () => {
    type AuthStoreState = { userProfile: null; isLoading: boolean; setUserProfile: typeof mockSetUserProfile };
    (useAuthStore as unknown as Mock).mockImplementation((selector: (state: AuthStoreState) => unknown) => {
      const state: AuthStoreState = { userProfile: null, isLoading: true, setUserProfile: mockSetUserProfile };
      return selector(state);
    });

    renderHook(() => useOnboardingTour({ moduleKey: 'products', steps: sampleSteps }));

    await new Promise((r) => setTimeout(r, 100));
    expect(mockStart).not.toHaveBeenCalled();
    expect(markTourComplete).not.toHaveBeenCalled();
  });

  it('does not start the tour when enabled is false', async () => {
    type AuthStoreState = { userProfile: { onboarding_progress: Record<string, never> }; isLoading: boolean; setUserProfile: typeof mockSetUserProfile };
    (useAuthStore as unknown as Mock).mockImplementation((selector: (state: AuthStoreState) => unknown) => {
      const state: AuthStoreState = { userProfile: { onboarding_progress: {} }, isLoading: false, setUserProfile: mockSetUserProfile };
      return selector(state);
    });

    renderHook(() => useOnboardingTour({ moduleKey: 'products', steps: sampleSteps, enabled: false }));

    await new Promise((r) => setTimeout(r, 100));
    expect(mockStart).not.toHaveBeenCalled();
    expect(markTourComplete).not.toHaveBeenCalled();
  });

  it('calls markTourComplete on tour complete event', async () => {
    type AuthStoreState = { userProfile: { onboarding_progress: Record<string, never> }; isLoading: boolean; setUserProfile: typeof mockSetUserProfile };
    (useAuthStore as unknown as Mock).mockImplementation((selector: (state: AuthStoreState) => unknown) => {
      const state: AuthStoreState = { userProfile: { onboarding_progress: {} }, isLoading: false, setUserProfile: mockSetUserProfile };
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
    type AuthStoreState = { userProfile: { onboarding_progress: Record<string, never> }; isLoading: boolean; setUserProfile: typeof mockSetUserProfile };
    (useAuthStore as unknown as Mock).mockImplementation((selector: (state: AuthStoreState) => unknown) => {
      const state: AuthStoreState = { userProfile: { onboarding_progress: {} }, isLoading: false, setUserProfile: mockSetUserProfile };
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
