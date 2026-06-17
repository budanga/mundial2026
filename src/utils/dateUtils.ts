import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import isYesterday from 'dayjs/plugin/isYesterday';
import 'dayjs/locale/es';

// Set dayjs locale to Spanish globally
dayjs.locale('es');

dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.extend(isYesterday);

/**
 * Format an ISO string to local time: "19:00"
 */
export function formatLocalTime(isoString: string): string {
  return dayjs(isoString).format('HH:mm');
}

/**
 * Format an ISO string to a section header date:
 * "HOY • martes, 16 de junio" / "MAÑANA • ..." / "miércoles, 17 de junio"
 */
export function formatSectionDate(isoString: string): string {
  const d = dayjs(isoString);
  const dateStr = d.format('dddd, D [de] MMMM');
  // @ts-ignore - dayjs plugin methods are added at runtime
  if (d.isToday()) return `HOY  •  ${dateStr}`;
  // @ts-ignore
  if (d.isTomorrow()) return `MAÑANA  •  ${dateStr}`;
  // @ts-ignore
  if (d.isYesterday()) return `AYER  •  ${dateStr}`;
  return dateStr.toUpperCase();
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
 * Format full date+time for display: "mar, 16 de jun • 19:00"
 */
export function formatDateTime(isoString: string): string {
  return dayjs(isoString).format('ddd, D [de] MMM  •  HH:mm');
}
