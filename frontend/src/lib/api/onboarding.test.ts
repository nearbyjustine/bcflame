import { describe, it, expect, vi, beforeEach } from 'vitest';
import { markTourComplete } from './onboarding';

vi.mock('./strapi', () => ({
  strapiApi: {
    post: vi.fn(),
  },
}));

import { strapiApi } from './strapi';

describe('markTourComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POSTs to the correct endpoint with the moduleKey', async () => {
    (strapiApi.post as any).mockResolvedValue({
      data: {
        success: true,
        onboarding_progress: {
          products: { completed: true, completedAt: '2026-02-05T14:30:00.000Z' },
        },
      },
    });

    const result = await markTourComplete('products');

    expect(strapiApi.post).toHaveBeenCalledWith('/api/users/onboarding/complete', {
      moduleKey: 'products',
    });
    expect(result.success).toBe(true);
    expect(result.onboarding_progress.products.completed).toBe(true);
  });

  it('returns the full onboarding_progress from the response', async () => {
    const mockProgress = {
      dashboard: { completed: true, completedAt: '2026-02-05T10:00:00.000Z' },
      products: { completed: true, completedAt: '2026-02-05T14:30:00.000Z' },
    };

    (strapiApi.post as any).mockResolvedValue({
      data: { success: true, onboarding_progress: mockProgress },
    });

    const result = await markTourComplete('products');

    expect(result.onboarding_progress).toEqual(mockProgress);
  });
});
