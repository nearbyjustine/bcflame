'use client';

import { useInView } from 'framer-motion';
import { useRef } from 'react';

interface UseScrollAnimationOptions {
  once?: boolean;
  margin?: string;
}

/**
 * Reusable scroll-triggered animation hook
 * Wraps Framer Motion's useInView with sensible defaults
 */
export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);

  const isInView = useInView(ref, {
    once: options.once ?? true,
    margin: options.margin ?? '0px 0px -100px 0px',
  });

  return { ref, isInView };
}
