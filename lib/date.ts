export const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

type Parts = {
  year: string;
  month: string;
  day: string;
  hour: number;
  minute: number;
  second: number;
};

function getParts(date = new Date()): Parts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

export function getVietnamNow() {
  return getParts();
}

export function getVietnamToday(date = new Date()) {
  const parts = getParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getDateOrVietnamToday(value: string | string[] | undefined) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : getVietnamToday();
}

export function getYearMonth(date: string | Date = new Date()) {
  if (typeof date === "string") return date.slice(0, 7);
  const parts = getParts(date);
  return `${parts.year}-${parts.month}`;
}

export function canSubmitOffRequest(offDate: string, now = new Date()) {
  const today = getVietnamToday(now);
  if (offDate < today) return false;
  if (offDate > today) return true;

  const parts = getParts(now);
  // Parent requests and cancellations close at exactly 06:00 Vietnam time.
  return parts.hour < 6;
}

export function formatVietnamDate(date: string | null | undefined) {
  if (!date) return "Chưa có";
  const parsed = new Date(`${date}T00:00:00+07:00`);
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function formatVietnamDateTime(value: string | null | undefined) {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getMonthBounds(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = `${yearMonth}-01`;
  const next = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return { start, end: next };
}

export function getDayOfWeek(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function isSaturday(date: string) {
  return getDayOfWeek(date) === 6;
}

export function isSunday(date: string) {
  return getDayOfWeek(date) === 0;
}

export function isWeekend(date: string) {
  const day = getDayOfWeek(date);
  return day === 0 || day === 6;
}
