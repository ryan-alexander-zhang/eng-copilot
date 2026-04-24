export function countWords(text: string) {
  const matches = text.match(/\S+/g);

  return matches ? matches.length : 0;
}

export function estimateReadingMinutes(wordCount: number) {
  return Math.max(1, Math.round(wordCount / 200));
}

export function formatRelativeDayLabel(date: Date, now = new Date()) {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = dayStart.getTime() - targetStart.getTime();
  const diffDays = Math.round(diffMs / 86400000);

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTimeLabel(date: Date) {
  const relativeLabel = formatRelativeDayLabel(date);
  const timeLabel = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  if (relativeLabel === "Today" || relativeLabel === "Yesterday") {
    return `${relativeLabel} at ${timeLabel}`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatLongDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatShortTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatStorageAmount(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = unitIndex === 0 ? 0 : 1;

  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}
