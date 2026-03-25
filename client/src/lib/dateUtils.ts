/**
 * Format a date value (Date object, ISO string YYYY-MM-DD, or timestamp) to DD/MM/YYYY.
 */
export function formatDate(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined) return '-';
  // Handle Date objects directly
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '-';
    const dd = String(value.getDate()).padStart(2, '0');
    const mm = String(value.getMonth() + 1).padStart(2, '0');
    const yyyy = value.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  const str = String(value);
  // ISO date string YYYY-MM-DD (possibly with time component)
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  // Numeric timestamp
  if (!isNaN(Number(str))) {
    const d = new Date(Number(str));
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  return str;
}

/**
 * Format a date+time value to "DD/MM/YYYY HH:mm".
 */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined) return '-';
  let d: Date;
  if (value instanceof Date) {
    d = value;
  } else if (!isNaN(Number(value))) {
    d = new Date(Number(value));
  } else {
    d = new Date(String(value));
  }
  if (isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}
