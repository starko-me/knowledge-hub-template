const TZ_OFFSET_PATTERN = /[+-]\d{2}:?\d{2}$/;

/** Treat DB timestamp as UTC (no Z suffix) when parsing */
function parseUtc(dateString: string): Date {
  const s = dateString.trim();
  const needsUtcSuffix = !s.endsWith("Z") && !TZ_OFFSET_PATTERN.test(s);
  return new Date(needsUtcSuffix ? `${s}Z` : s);
}

export function formatDateString(dateString: string): string {
  const utcDate = parseUtc(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return utcDate.toLocaleDateString("en-US", options);
}

export function formatTimeString(dateString: string): string {
  const utcDate = parseUtc(dateString);
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };
  return utcDate.toLocaleTimeString("en-US", options);
}

