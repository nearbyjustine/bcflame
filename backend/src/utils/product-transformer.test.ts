/**
 * Unit Tests for Product Transformer Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  transformPricing,
  transformFeatures,
  isValidCategory,
  sanitizeSKU,
} from './product-transformer';

describe('transformPricing', () => {
  it('should transform pricing data correctly', () => {
    const quantityOptions = ['7g', '14g', '28g'];
    const pricing = {
      '7g': { amount: 55.0, currency: 'USD' },
      '14g': { amount: 100.0, currency: 'USD' },
      '28g': { amount: 180.0, currency: 'USD' },
    };

    const result = transformPricing(quantityOptions, pricing);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      weight: '7g',
      amount: 55.0,
      currency: 'USD',
    });
    expect(result[2]).toEqual({
      weight: '28g',
      amount: 180.0,
      currency: 'USD',
    });
  });

  it('should handle single pricing option', () => {
    const quantityOptions = ['14g'];
    const pricing = {
      '14g': { amount: 100.0, currency: 'USD' },
    };

    const result = transformPricing(quantityOptions, pricing);

    expect(result).toHaveLength(1);
    expect(result[0].weight).toBe('14g');
  });

  it('should preserve currency information', () => {
    const quantityOptions = ['7g'];
    const pricing = {
      '7g': { amount: 45.0, currency: 'CAD' },
    };

    const result = transformPricing(quantityOptions, pricing);

    expect(result[0].currency).toBe('CAD');
  });
});

describe('transformFeatures', () => {
  it('should transform feature strings into component format', () => {
    const features = ['Premium Quality', 'Lab Tested', 'Organic'];

    const result = transformFeatures(features);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      label: 'Premium Quality',
      icon: null,
    });
  });

  it('should handle empty feature array', () => {
    const features: string[] = [];

    const result = transformFeatures(features);

    expect(result).toHaveLength(0);
  });

  it('should set icon to null for all features', () => {
    const features = ['Feature 1', 'Feature 2'];

    const result = transformFeatures(features);

    expect(result.every((f) => f.icon === null)).toBe(true);
  });
});

describe('isValidCategory', () => {
  it('should return true for valid Indica category', () => {
    expect(isValidCategory('Indica')).toBe(true);
  });

  it('should return true for valid Hybrid category', () => {
    expect(isValidCategory('Hybrid')).toBe(true);
  });

  it('should return true for valid Sativa category', () => {
    expect(isValidCategory('Sativa')).toBe(true);
  });

  it('should return false for invalid category', () => {
    expect(isValidCategory('Invalid')).toBe(false);
  });

  it('should return false for lowercase valid category', () => {
    expect(isValidCategory('indica')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidCategory('')).toBe(false);
  });
});

describe('sanitizeSKU', () => {
  it('should convert SKU to uppercase', () => {
    const result = sanitizeSKU('bc-flame-001');

    expect(result).toBe('BC-FLAME-001');
  });

  it('should remove special characters except hyphens and underscores', () => {
    const result = sanitizeSKU('bc@flame#001!');

    expect(result).toBe('BCFLAME001');
  });

  it('should preserve hyphens and underscores', () => {
    const result = sanitizeSKU('bc-flame_001');

    expect(result).toBe('BC-FLAME_001');
  });

  it('should limit length to 50 characters', () => {
    const longSKU = 'a'.repeat(100);
    const result = sanitizeSKU(longSKU);

    expect(result).toHaveLength(50);
  });

  it('should handle alphanumeric SKUs correctly', () => {
    const result = sanitizeSKU('SKU123ABC');

    expect(result).toBe('SKU123ABC');
  });

  it('should handle SKUs with spaces', () => {
    const result = sanitizeSKU('BC FLAME 001');

    expect(result).toBe('BCFLAME001');
  });
});
