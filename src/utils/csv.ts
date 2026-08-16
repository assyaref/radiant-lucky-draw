/**
 * CSV helpers for client-side export.
 * - UTF-8 BOM so Microsoft Excel decodes the file correctly.
 * - CSV formula-injection protection for values starting with = + - @.
 */

const BOM = '\uFEFF';

/** Escape a single CSV field (quote handling + formula injection guard). */
export function escapeCsvField(value: unknown): string {
  const raw = value == null ? '' : String(value);
  let field = raw;

  // Prevent formula injection: prefix values starting with = + - @ (or tab/CR).
  if (/^[=+\-@\t\r]/.test(field)) {
    field = `'${field}`;
  }

  // Quote fields containing delimiters, quotes, or newlines.
  if (/[",\r\n]/.test(field)) {
    field = `"${field.replace(/"/g, '""')}"`;
  }

  return field;
}

/** Build a CSV document string (with UTF-8 BOM) from rows of cells. */
export function buildCsv(rows: Array<Array<string | number | null | undefined>>): string {
  const body = rows.map((row) => row.map((cell) => escapeCsvField(cell)).join(',')).join('\r\n');
  return BOM + body;
}

/** Trigger a client-side download of the CSV content. */
export function downloadCsvFile(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
