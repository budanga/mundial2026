import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import isYesterday from 'dayjs/plugin/isYesterday';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.extend(isYesterday);
dayjs.extend(relativeTime);

/**
 * Format an ISO string to local time: "7:00 PM"
 */
export function formatLocalTime(isoString: string): string {
  return dayjs(isoString).format('h:mm A');
}

/**
 * Format an ISO string to a section header date:
 * "Today • Tuesday, June 16" / "Tomorrow • ..." / "Wednesday, June 17"
 */
export function formatSectionDate(isoString: string): string {
  const d = dayjs(isoString);
  const dateStr = d.format('dddd, MMMM D');
  if (d.isToday()) return `Today • ${dateStr}`;
  if (d.isTomorrow()) return `Tomorrow • ${dateStr}`;
  if (d.isYesterday()) return `Yesterday • ${dateStr}`;
  return dateStr;
}

/**
 * Returns the local date string "YYYY-MM-DD" (for grouping)
 */
export function getLocalDateKey(isoString: string): string {
  return dayjs(isoString).format('YYYY-MM-DD');
}

/**
 * Returns true if the match starts within the next `minutes` minutes
 */
export function isWithinMinutes(isoString: string, minutes: number): boolean {
  const matchTime = dayjs(isoString);
  const now = dayjs();
  const diff = matchTime.diff(now, 'minute');
  return diff >= 0 && diff <= minutes;
}

/**
 * Returns true if the date is in the past
 */
export function isInPast(isoString: string): boolean {
  return dayjs(isoString).isBefore(dayjs());
}

/**
 * Format full date+time for display: "Tue, June 16 • 7:00 PM"
 */
export function formatDateTime(isoString: string): string {
  return dayjs(isoString).format('ddd, MMM D • h:mm A');
}
