export function attendanceDayBounds(now: Date) {
  const local = new Date(now.getTime() + 3600000); // Africa/Douala: UTC+1, no DST.
  const start =
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) -
    3600000;
  return {
    start: new Date(start),
    end: new Date(start + 86400000),
    late: local.getUTCHours() * 60 + local.getUTCMinutes() > 510,
  };
}
