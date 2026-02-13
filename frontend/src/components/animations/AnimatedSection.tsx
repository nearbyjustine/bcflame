'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import {
  fadeInUp,
  fadeIn,
  scaleIn,
  slideInFromLeft,
  slideInFromRight,
} from '@/lib/animations/variants';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: 'fadeInUp' | 'fadeIn' | 'scaleIn' | 'slideInFromLeft' | 'slideInFromRight';
}

const VARIANTS = {
  fadeInUp,
  fadeIn,
  scaleIn,
  slideInFromLeft,
  slideInFromRight,
};

/**
 * Reusable animated section wrapper
 * Respects user's reduced motion preference
 */
export function AnimatedSection({
  children,
  className,
  delay = 0,
  variant = 'fadeInUp',
}: AnimatedSectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const { ref, isInView } = useScrollAnimation();

  // Skip animations if user prefers reduced motion
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const selectedVariant = VARIANTS[variant];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={selectedVariant}
      transition={{
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
