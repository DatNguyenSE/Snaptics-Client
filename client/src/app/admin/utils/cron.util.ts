/**
 * Converts a time string "HH:mm" to a daily cron expression.
 *
 * Examples:
 *   convertTimeToCron("08:00") → "0 8 * * *"
 *   convertTimeToCron("23:30") → "30 23 * * *"
 *
 * @param time - Time string in "HH:mm" format
 * @returns Cron expression string for daily scheduling
 */
export function convertTimeToCron(time: string): string {
  if (!time || !time.includes(':')) {
    return '0 0 * * *'; // default midnight
  }
  const parts = time.split(':');
  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);

  if (isNaN(hour) || isNaN(minute)) {
    return '0 0 * * *';
  }

  return `${minute} ${hour} * * *`;
}

/**
 * Converts a cron expression back to a time string "HH:mm".
 * Assumes daily cron format: "minute hour * * *"
 *
 * @param cron - Cron expression string
 * @returns Time string in "HH:mm" format, or null if not parseable
 */
export function convertCronToTime(cron: string): string | null {
  if (!cron) return null;
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const minute = parseInt(parts[0], 10);
  const hour = parseInt(parts[1], 10);
  if (isNaN(minute) || isNaN(hour)) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
