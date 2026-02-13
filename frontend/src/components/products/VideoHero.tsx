'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

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
  const { scrollY } = useScroll();

  // Parallax effect: fade and scale video as user scrolls
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 1.1]);

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
    <motion.section
      className="relative h-screen w-full overflow-hidden"
      style={{ opacity, scale }}
    >
      {/* Video Background */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
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

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {/* Content Overlay */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center text-white">
        {title && (
          <motion.h1
            className="mb-4 text-5xl font-bold md:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            {title}
          </motion.h1>
        )}

        {subtitle && (
          <motion.p
            className="mb-8 max-w-2xl text-lg md:text-xl lg:text-2xl"
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
          className="absolute bottom-8 flex flex-col items-center text-white/80 transition-colors hover:text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          aria-label="Scroll to products"
        >
          <span className="mb-2 text-sm uppercase tracking-wider">Scroll</span>
          <motion.div
            animate={{
              y: [0, 8, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </motion.button>
      </div>
    </motion.section>
  );
}
