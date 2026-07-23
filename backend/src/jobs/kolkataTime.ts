/** Asia/Kolkata helpers for daily report scheduling. */

const KOLKATA_TZ = 'Asia/Kolkata';

export function getKolkataDateString(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: KOLKATA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function getKolkataTodayRange(now = new Date()): {
  fromDate: Date;
  toDate: Date;
  dateString: string;
} {
  const dateString = getKolkataDateString(now);
  const fromDate = new Date(`${dateString}T00:00:00+05:30`);
  const toDate = new Date(`${dateString}T23:59:59.999+05:30`);
  return { fromDate, toDate, dateString };
}

/**
 * Next 20:00 Asia/Kolkata occurrence (cron: 0 20 * * *).
 */
export function getNextKolkataEightPm(now = new Date()): Date {
  const dateString = getKolkataDateString(now);
  let next = new Date(`${dateString}T20:00:00+05:30`);
  if (now.getTime() >= next.getTime()) {
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = getKolkataDateString(tomorrow);
    next = new Date(`${tomorrowStr}T20:00:00+05:30`);
  }
  return next;
}

export { KOLKATA_TZ };
