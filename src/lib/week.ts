const PROGRAM_START = new Date("2026-05-11T00:00:00");
const TOTAL_WEEKS = 6;

/** Returns the current week number (1-indexed), clamped to 1..TOTAL_WEEKS. */
export function getCurrentWeek(): number {
  const now = new Date();
  const diffMs = now.getTime() - PROGRAM_START.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(TOTAL_WEEKS, diffWeeks + 1));
}

/** Returns "May 11 – May 17" style date range for a given week number. */
export function getWeekDateRange(weekNum: number): string {
  const start = new Date(PROGRAM_START);
  start.setDate(start.getDate() + (weekNum - 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "America/New_York",
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

/** Days remaining until Friday 5pm EST of the current week. Returns 0 if past. */
export function getDaysUntilFriday(): number {
  const now = new Date();
  const week = getCurrentWeek();
  const weekStart = new Date(PROGRAM_START);
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7);

  // Friday = day 4 of the week (Mon=0-based from weekStart which is a Monday)
  const friday = new Date(weekStart);
  friday.setDate(friday.getDate() + 4);
  friday.setHours(17, 0, 0, 0); // 5pm

  const diffMs = friday.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

export const TOTAL_PROGRAM_WEEKS = TOTAL_WEEKS;
