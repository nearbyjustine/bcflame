'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ProductCard, type StockStatus } from './ProductCard';
import type { Product } from '@/types/product';

interface AnimatedProductCardProps {
  product: Product;
  stockStatus?: StockStatus;
  index: number;
  onCustomize?: () => void;
}

/**
 * Animated wrapper for ProductCard with scroll-triggered fade-up effect
 * Stagger delay based on card index for sequential reveal
 */
export function AnimatedProductCard({
  product,
  stockStatus,
  index,
  onCustomize,
}: AnimatedProductCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '0px 0px -100px 0px',
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.21, 1.11, 0.81, 0.99],
      }}
    >
      <ProductCard
        product={product}
        stockStatus={stockStatus}
        onCustomize={onCustomize}
      />
    </motion.div>
  );
}
