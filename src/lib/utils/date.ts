/**
 * Date formatting utilities
 */

/**
 * Format a date for display in short format (e.g., "Jan 15, 2026")
 */
export function formatDateShort(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date for display with time (e.g., "January 15, 2026, 02:30 PM")
 */
export function formatDateLong(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a date for tables and lists (e.g., "Jan 15, 2026, 2:30 PM")
 */
export function formatDateMedium(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
