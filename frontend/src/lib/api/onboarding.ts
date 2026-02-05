import { strapiApi } from './strapi';

export interface OnboardingProgress {
  [moduleKey: string]: { completed: boolean; completedAt: string };
}

export async function markTourComplete(moduleKey: string): Promise<{ success: boolean; onboarding_progress: OnboardingProgress }> {
  const response = await strapiApi.post('/api/users/onboarding/complete', { moduleKey });
  return response.data;
}
