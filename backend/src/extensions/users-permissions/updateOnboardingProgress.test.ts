import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUpdate = vi.fn();

// Minimal strapi global mock
(globalThis as any).strapi = {
  query: () => ({
    update: mockUpdate,
  }),
  log: { info: vi.fn(), error: vi.fn() },
};

// Re-create the controller logic in isolation for unit testing
const VALID_MODULE_KEYS = [
  'dashboard', 'products', 'orders', 'messages', 'media-hub',
  'admin-dashboard', 'admin-orders', 'admin-products', 'admin-users', 'admin-media', 'admin-messages',
];

async function updateOnboardingProgress(ctx: any) {
  const user = ctx.state.user;
  const { moduleKey } = ctx.request.body;

  if (!moduleKey || !VALID_MODULE_KEYS.includes(moduleKey)) {
    return ctx.badRequest('moduleKey is required and must be a valid module key');
  }

  const currentProgress = user.onboarding_progress || {};

  if (currentProgress[moduleKey]?.completed) {
    return { success: true, onboarding_progress: currentProgress };
  }

  const updatedProgress = {
    ...currentProgress,
    [moduleKey]: {
      completed: true,
      completedAt: new Date().toISOString(),
    },
  };

  await (globalThis as any).strapi.query('plugin::users-permissions.user').update({
    where: { id: user.id },
    data: { onboarding_progress: updatedProgress },
  });

  return { success: true, onboarding_progress: updatedProgress };
}

function createCtx(user: any, body: any) {
  return {
    state: { user },
    request: { body },
    badRequest: (msg: string) => ({ error: msg }),
  };
}

describe('updateOnboardingProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new entry on first completion', async () => {
    const ctx = createCtx(
      { id: 1, onboarding_progress: null },
      { moduleKey: 'products' }
    );

    const result = await updateOnboardingProgress(ctx);

    expect(result.success).toBe(true);
    expect(result.onboarding_progress.products.completed).toBe(true);
    expect(result.onboarding_progress.products.completedAt).toBeDefined();
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    );
  });

  it('returns early without DB write when already completed', async () => {
    const existingProgress = {
      products: { completed: true, completedAt: '2026-02-05T10:00:00.000Z' },
    };
    const ctx = createCtx(
      { id: 1, onboarding_progress: existingProgress },
      { moduleKey: 'products' }
    );

    const result = await updateOnboardingProgress(ctx);

    expect(result.success).toBe(true);
    expect(result.onboarding_progress).toEqual(existingProgress);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns 400 when moduleKey is missing', async () => {
    const ctx = createCtx({ id: 1, onboarding_progress: null }, {});

    const result = await updateOnboardingProgress(ctx);

    expect(result.error).toBe('moduleKey is required and must be a valid module key');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns 400 when moduleKey is not in whitelist', async () => {
    const ctx = createCtx(
      { id: 1, onboarding_progress: null },
      { moduleKey: 'invalid-module' }
    );

    const result = await updateOnboardingProgress(ctx);

    expect(result.error).toBe('moduleKey is required and must be a valid module key');
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
