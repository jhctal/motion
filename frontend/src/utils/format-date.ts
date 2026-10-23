// Single place that decides how dates are shown, so i18n can plug in later.
// TODO(i18n): return the user's preferred locale instead of the browser default.
export function getLocale(): string | undefined {
  return undefined;
}

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTIONS,
) {
  return new Date(date).toLocaleDateString(getLocale(), options);
}

export function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString(getLocale(), {
    hour: "numeric",
    minute: "2-digit",
  });
}

// Locale-aware number, e.g. 12,450 or 20.25
export function formatNumber(
  n: number,
  options: Intl.NumberFormatOptions = { maximumFractionDigits: 2 },
) {
  return n.toLocaleString(getLocale(), options);
}

// Thousands separator for the user's locale, e.g. "," or "."
export function groupSeparator() {
  return (
    new Intl.NumberFormat(getLocale())
      .formatToParts(1000)
      .find((part) => part.type === "group")?.value ?? ","
  );
}

// Short form for big numbers, e.g. 1,284 / 12.9K / 4.2M
export function formatCompact(n: number) {
  return n.toLocaleString(getLocale(), {
    notation: n >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  });
}

// e.g. "45 min", "1 h 10 min"
export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  const hours = Math.floor(minutes / 60);
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

// e.g. "Wed 21 Oct, 19:18" in the user's locale
export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString(getLocale(), {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

// "today", "yesterday", "2 days ago" by calendar day, in the user's locale
export function formatRelativeDay(date: string | Date, now = new Date()) {
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round(
    (startOfDay(new Date(date)) - startOfDay(now)) / 86_400_000,
  );
  return new Intl.RelativeTimeFormat(getLocale(), { numeric: "auto" }).format(
    days,
    "day",
  );
}

// Workout names are stored without a date; the date is added at display time
// so it always follows the user's locale
export function formatSessionTitle(session: {
  name: string;
  createdAt: string | Date;
}) {
  return `${session.name} - ${formatDate(session.createdAt)}`;
}
