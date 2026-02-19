'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useRef, useState } from 'react';

interface VideoHeroProps {
  videoSrc: string;
  title?: string;
  subtitle?: string;
  onScrollClick?: () => void;
}

/**
 * Full-screen video hero section with parallax scroll effect
 */
export function VideoHero({
  videoSrc,
  title,
  subtitle,
  onScrollClick,
}: VideoHeroProps) {
  const [isLoading, setIsLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();

  // Video: subtle scale as user scrolls
  const scale = useTransform(scrollY, [0, 600], [1, 1.12]);
  // Content: drift upward and fade out quickly as user scrolls
  const contentY = useTransform(scrollY, [0, 250], ['0%', '-60%']);
  const contentOpacity = useTransform(scrollY, [0, 180], [1, 0]);

  const handleScrollClick = () => {
    if (onScrollClick) {
      onScrollClick();
    } else {
      // Default behavior: scroll to products section
      const productsSection = document.getElementById('products-content');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
    >
      {/* Video Background — subtle scale parallax only, no opacity fade */}
      <motion.div className="absolute inset-0" style={{ scale }}>
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => setIsLoading(false)}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </motion.div>

      {/* Gradient Overlay — dramatic vignette top/bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/80" />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="h-12 w-12 animate-spin rounded-full border border-[hsl(43,74%,49%)] border-t-transparent" />
        </div>
      )}

      {/* Content Overlay — anchored to bottom third, fades on scroll */}
      <motion.div
        className="absolute z-10 bottom-24 inset-x-0 flex flex-col items-center px-4 text-center text-white"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        {title && (
          <>
            {/* Decorative gold rule above title */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
              className="mb-6 w-16 h-px"
              style={{ backgroundColor: 'hsl(43, 74%, 49%)' }}
            />
            <motion.h1
              className="mb-4 text-luxury-xl font-display tracking-tight text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              {title}
            </motion.h1>
          </>
        )}

        {subtitle && (
          <motion.p
            className="mb-8 max-w-2xl font-body text-lg md:text-xl tracking-wide text-white/70"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            {subtitle}
          </motion.p>
        )}

        {/* Scroll Indicator */}
        <motion.button
          onClick={handleScrollClick}
          className="mt-8 flex flex-col items-center text-white/50 transition-colors hover:text-white/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          aria-label="Scroll to products"
        >
          <span className="mb-2 font-body text-xs tracking-[0.3em] uppercase">Scroll</span>
          <motion.div
            animate={{
              y: [0, 8, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.button>
      </motion.div>
    </section>
  );
}
