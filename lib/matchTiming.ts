export const MATCH_REPORT_DELAY_MS = 15 * 60 * 1000;
export const MATCH_TICKET_WINDOW_MS = 2 * 60 * 60 * 1000;

function scheduledTime(matchTime: string | null | undefined): number | null {
  if (!matchTime || !/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)$/.test(matchTime)) return null;
  const scheduled = Date.parse(matchTime);
  return Number.isFinite(scheduled) ? scheduled : null;
}

export function matchReportingOpensAt(matchTime: string | null | undefined): number | null {
  const scheduled = scheduledTime(matchTime);
  return scheduled === null ? null : scheduled + MATCH_REPORT_DELAY_MS;
}

export function matchTicketDeadline(matchTime: string | null | undefined): number | null {
  const scheduled = scheduledTime(matchTime);
  return scheduled === null ? null : scheduled + MATCH_TICKET_WINDOW_MS;
}
