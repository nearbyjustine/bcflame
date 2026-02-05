'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { markTourComplete } from '@/lib/api/onboarding';

export interface TourStepConfig {
  id: string;
  title?: string;
  text: string;
  attachTo: { element: string; on: 'top' | 'bottom' | 'left' | 'right' };
  beforeShowPromise?: () => Promise<void>;
}

interface UseOnboardingTourOptions {
  moduleKey: string;
  steps: TourStepConfig[];
  enabled?: boolean;
}

function waitForElement(selector: string, timeout = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(selector)) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        clearTimeout(timer);
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
}

export function useOnboardingTour({ moduleKey, steps, enabled = true }: UseOnboardingTourOptions) {
  const userProfile = useAuthStore((state) => state.userProfile);
  const setUserProfile = useAuthStore((state) => state.setUserProfile);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (isLoading || !enabled || hasAttemptedRef.current) return;

    if (userProfile?.onboarding_progress?.[moduleKey]?.completed) return;

    hasAttemptedRef.current = true;

    let tour: any = null;

    const initTour = async () => {
      const [{ default: Shepherd }] = await Promise.all([
        import('shepherd.js'),
        import('shepherd.js/dist/css/shepherd.css'),
      ]);

      tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          scrollTo: true,
        },
      });

      steps.forEach((step, index) => {
        const isLast = index === steps.length - 1;

        tour.addStep({
          id: step.id,
          title: step.title,
          text: step.text,
          attachTo: step.attachTo,
          beforeShowPromise: step.beforeShowPromise ?? (() => waitForElement(step.attachTo.element)),
          buttons: [
            {
              classes: 'shepherd-button-secondary',
              text: 'Skip Tour',
              action: () => tour.cancel(),
            },
            {
              classes: 'shepherd-button-primary',
              text: isLast ? 'Finish' : 'Next',
              action: isLast ? () => tour.complete() : () => tour.next(),
            },
          ],
        });
      });

      const persist = () => {
        markTourComplete(moduleKey)
          .then(({ onboarding_progress }) => {
            const current = useAuthStore.getState().userProfile;
            if (current && onboarding_progress) {
              setUserProfile({ ...current, onboarding_progress });
            }
          })
          .catch(console.error);
      };

      tour.on('complete', persist);
      tour.on('cancel', persist);

      tour.start();
    };

    initTour().catch(console.error);

    return () => {
      if (tour) tour.destroy();
    };
  }, [moduleKey, steps, enabled, userProfile, isLoading]);
}
