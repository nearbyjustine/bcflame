import * as XLSX from 'xlsx';

/**
 * Generate CSV from array of objects
 * Properly escapes quotes, commas, and newlines
 */
export function generateCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);

  // Escape and quote CSV field
  const escapeCSVField = (value: any): string => {
    if (value === null || value === undefined) {
      return '""';
    }

    const stringValue = String(value);

    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      const escaped = stringValue.replace(/"/g, '""');
      return `"${escaped}"`;
    }

    return `"${stringValue}"`;
  };

  const csvRows = [
    // Header row
    headers.map(header => escapeCSVField(header)).join(','),
    // Data rows
    ...data.map(row =>
      headers.map(header => escapeCSVField(row[header])).join(',')
    )
  ];

  return csvRows.join('\n');
}

/**
 * Generate Excel (XLSX) buffer from array of objects
 */
export function generateXLSX(data: any[]): Buffer {
  if (!data || data.length === 0) {
    // Return empty workbook if no data
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([['No Data']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  }

  // Create worksheet from JSON data
  const ws = XLSX.utils.json_to_sheet(data);

  // Create workbook and append worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');

  // Write to buffer
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
