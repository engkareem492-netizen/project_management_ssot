/**
 * Format an ISO date string (YYYY-MM-DD) or timestamp to DD/MM/YYYY
 * without timezone shift issues.
 */
export function formatDate(value: string | number | null | undefined): string {
  if (!value) return '-';
  const str = String(value);
  // ISO date string YYYY-MM-DD
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
