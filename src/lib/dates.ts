export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** True when `birthDate` is a later calendar day than `than`. A missing or invalid date is not younger. */
export function isYoungerThan(birthDate: string | null | undefined, than: string | null | undefined): boolean {
  const birth = birthDate?.trim() ?? "";
  const other = than?.trim() ?? "";
  if (!parseIsoDate(birth) || !parseIsoDate(other)) return false;
  return birth > other;
}

const DAY_MONTH_YEAR = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/;

/** ISO `YYYY-MM-DD`, or null when the text is not a real calendar date. Accepts `dd/mm/yyyy` as well. */
export function parseFlexibleDate(value: string): string | null {
  const compact = value.trim().replace(/\s+/g, "");
  if (!compact) return null;
  if (parseIsoDate(compact)) return compact;
  const match = DAY_MONTH_YEAR.exec(compact);
  if (!match) return null;
  const iso = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  return parseIsoDate(iso) ? iso : null;
}

/** `dd/mm/yyyy` for a stored ISO date. Other text is left as typed. */
export function displayDate(value: string): string {
  const iso = parseFlexibleDate(value);
  if (!iso) return value;
  const parsed = parseIsoDate(iso);
  if (!parsed) return value;
  const day = String(parsed.day).padStart(2, "0");
  const month = String(parsed.month).padStart(2, "0");
  return `${day}/${month}/${parsed.year}`;
}

export function parseIsoDate(value: string): CalendarDate | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return null;

  const maxDay = new Date(year, month, 0).getDate();
  if (day < 1 || day > maxDay) return null;

  return { year, month, day };
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

export function formatLongDate(iso: string): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(parsed.year, parsed.month - 1, parsed.day));
}

export function formatToday(date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
}
