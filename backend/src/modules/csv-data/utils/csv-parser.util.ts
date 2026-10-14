/**
 * RFC 4180 Compliant CSV Parser & Generator
 * Includes defense against Spreadsheet Formula Injection (CSV Injection)
 */

export function sanitizeCsvField(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  let str = String(value);

  // Spreadsheet formula injection protection
  // If field starts with =, +, -, @, tab, or carriage return, prepend with single quote
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousPrefixes.some((prefix) => str.startsWith(prefix))) {
    str = `'${str}`;
  }

  // If string contains comma, quote, newline, or has leading/trailing spaces, quote it and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function stringifyCsv(rows: string[][]): string {
  return rows.map((row) => row.map(sanitizeCsvField).join(',')).join('\r\n');
}

/**
 * Robust RFC 4180 CSV line parser supporting embedded commas, quotes, and newlines
 */
export function parseCsv(csvText: string): string[][] {
  if (!csvText || !csvText.trim()) {
    return [];
  }

  // Remove BOM if present
  let text = csvText.replace(/^\uFEFF/, '');

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // consume \n of \r\n
      }
      currentRow.push(currentField.trim());
      currentField = '';
      // Only push non-empty rows
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  // Final field and row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}
