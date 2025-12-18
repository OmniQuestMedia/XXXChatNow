import * as moment from 'moment-timezone';

/**
 * Platform timezone (Eastern Time - America/Toronto)
 * All campaign times, earnings calculations, and reporting use this timezone
 */
export const PLATFORM_TIMEZONE = 'America/Toronto';

/**
 * Convert UTC date to Eastern Time (ET)
 */
export function toET(utcDate: Date): Date {
  return moment(utcDate).tz(PLATFORM_TIMEZONE).toDate();
}

/**
 * Convert Eastern Time (ET) date to UTC
 */
export function toUTC(etDate: Date): Date {
  return moment.tz(etDate, PLATFORM_TIMEZONE).utc().toDate();
}

/**
 * Format date in Eastern Time with timezone indicator
 * Format: YYYY-MM-DD HH:mm:ss z
 * Example: 2026-06-01 00:00:00 EDT
 */
export function formatET(date: Date): string {
  return moment(date).tz(PLATFORM_TIMEZONE).format('YYYY-MM-DD HH:mm:ss z');
}

/**
 * Get current time in Eastern Time
 */
export function nowET(): Date {
  return moment().tz(PLATFORM_TIMEZONE).toDate();
}

/**
 * Check if a date is within a time range (inclusive)
 * All dates should be in UTC for accurate comparison
 */
export function isWithinRange(date: Date, startDate: Date, endDate: Date): boolean {
  const timestamp = date.getTime();
  return timestamp >= startDate.getTime() && timestamp <= endDate.getTime();
}

/**
 * Parse ET date string to UTC Date object
 * Input format: YYYY-MM-DD HH:mm:ss
 */
export function parseETToUTC(etDateString: string): Date {
  return moment.tz(etDateString, 'YYYY-MM-DD HH:mm:ss', PLATFORM_TIMEZONE).utc().toDate();
}

/**
 * Get start of day in ET, returned as UTC
 */
export function startOfDayET(date: Date): Date {
  return moment(date).tz(PLATFORM_TIMEZONE).startOf('day').utc().toDate();
}

/**
 * Get end of day in ET, returned as UTC
 */
export function endOfDayET(date: Date): Date {
  return moment(date).tz(PLATFORM_TIMEZONE).endOf('day').utc().toDate();
}

/**
 * Add hours to a date
 */
export function addHours(date: Date, hours: number): Date {
  return moment(date).add(hours, 'hours').toDate();
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  return moment(date).add(days, 'days').toDate();
}

/**
 * Calculate difference in days between two dates
 */
export function diffDays(date1: Date, date2: Date): number {
  return moment(date1).diff(moment(date2), 'days');
}

/**
 * Calculate difference in hours between two dates
 */
export function diffHours(date1: Date, date2: Date): number {
  return moment(date1).diff(moment(date2), 'hours');
}

/**
 * Check if current time (ET) is at or past the target date
 */
export function isTimeReached(targetDate: Date): boolean {
  const now = nowET();
  return now.getTime() >= targetDate.getTime();
}

/**
 * Format time remaining as human-readable string
 * Example: "5 days 3 hours" or "2 hours 30 minutes"
 */
export function formatTimeRemaining(targetDate: Date): string {
  const now = nowET();
  const diff = moment(targetDate).diff(moment(now));
  const duration = moment.duration(diff);

  if (diff <= 0) {
    return 'Ended';
  }

  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (days === 0 && minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);

  return parts.slice(0, 2).join(' ') || 'Less than a minute';
}
