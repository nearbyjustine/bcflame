import { describe, it, expect } from 'vitest';
import { generateInquiryNumber } from './inquiry-number';

describe('generateInquiryNumber', () => {
  it('generates inquiry number with correct format', () => {
    const inquiryNumber = generateInquiryNumber();
    expect(inquiryNumber).toMatch(/^INQ-\d{8}-\d{4}$/);
  });

  it('includes current date in YYYYMMDD format', () => {
    const inquiryNumber = generateInquiryNumber();
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    expect(inquiryNumber).toContain(today);
  });

  it('generates unique numbers on consecutive calls', () => {
    const numbers = new Set();
    for (let i = 0; i < 100; i++) {
      numbers.add(generateInquiryNumber());
    }
    expect(numbers.size).toBeGreaterThan(90); // Allow for some rare collisions
  });

  it('starts with INQ prefix', () => {
    const inquiryNumber = generateInquiryNumber();
    expect(inquiryNumber).toMatch(/^INQ-/);
  });

  it('has 4-digit random suffix', () => {
    const inquiryNumber = generateInquiryNumber();
    const parts = inquiryNumber.split('-');
    expect(parts[2]).toHaveLength(4);
    expect(parseInt(parts[2])).toBeGreaterThanOrEqual(0);
    expect(parseInt(parts[2])).toBeLessThanOrEqual(9999);
  });
});
