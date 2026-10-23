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
