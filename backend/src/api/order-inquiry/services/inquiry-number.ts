/**
 * Generates a unique inquiry number with format: INQ-YYYYMMDD-XXXX
 * where XXXX is a random 4-digit number
 *
 * @returns {string} Inquiry number in format INQ-YYYYMMDD-XXXX
 * @example
 * generateInquiryNumber() // 'INQ-20260110-1234'
 */
export function generateInquiryNumber(): string {
  // Get current date in YYYYMMDD format
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  // Generate random 4-digit number (0000-9999)
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  return `INQ-${date}-${random}`;
}
