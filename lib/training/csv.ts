/**
 * Sanitizes a string value to prevent CSV Formula Injection (CWE-1236).
 * Prepends a single quote if the field begins with '=', '+', '-', '@', '\t', '\r', or '\n'.
 */
export function sanitizeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  const trimmed = str.trimStart();
  if (/^[=+\-@\t\r\n]/.test(trimmed) || /^[=+\-@\t\r\n]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}
