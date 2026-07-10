export const missingRebuyReminderDateMessage = "재구매 예정일이 있는 원두만 캘린더로 내보낼 수 있습니다.";

const calendarLineBreak = "\r\n";
const maxCalendarLineOctets = 75;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const utf8Encoder = new TextEncoder();

export class RebuyCalendarInputError extends Error {
  readonly code = "missing_rebuy_reminder_date";

  constructor(message = missingRebuyReminderDateMessage) {
    super(message);
    this.name = "RebuyCalendarInputError";
  }
}

export type RebuyCalendarShelfItem = {
  readonly id: string;
  readonly roaster_name: string | null;
  readonly bean_name: string | null;
  readonly rebuy_reminder_date: string | null;
};

export type BuildRebuyReminderCalendarInput = {
  readonly shelfItem: RebuyCalendarShelfItem;
  readonly origin: string;
  readonly now?: Date;
};

export function buildRebuyReminderCalendar(input: BuildRebuyReminderCalendarInput): string {
  const reminderDate = requireReminderDate(input.shelfItem.rebuy_reminder_date);
  const nextDate = addOneUtcDay(reminderDate);
  const label = shelfItemLabel(input.shelfItem);
  const dashboardUrl = new URL("/dashboard?source=rebuy_calendar", input.origin).toString();
  const now = input.now ?? new Date();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CoffeeDex//Rebuy Reminder//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${deterministicUid(input.shelfItem.id, reminderDate)}`,
    `DTSTAMP:${formatUtcDateTime(now)}`,
    `DTSTART;VALUE=DATE:${formatAllDayDate(reminderDate)}`,
    `DTEND;VALUE=DATE:${formatAllDayDate(nextDate)}`,
    `SUMMARY:${escapeCalendarText(`원두 재구매 리마인더 - ${label}`)}`,
    `DESCRIPTION:${escapeCalendarText(`${label} 재구매를 떠올릴 시간입니다.\nCoffeeDex 대시보드에서 기억을 이어가세요: ${dashboardUrl}`)}`,
    `URL:${dashboardUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.flatMap(foldCalendarLine).join(calendarLineBreak)}${calendarLineBreak}`;
}

export function rebuyReminderCalendarFilename(reminderDate: string): string {
  return `coffeedex-rebuy-reminder-${requireReminderDate(reminderDate)}.ics`;
}

function requireReminderDate(value: string | null): string {
  if (!value || !datePattern.test(value)) {
    throw new RebuyCalendarInputError();
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.toISOString().slice(0, 10) !== value) {
    throw new RebuyCalendarInputError();
  }
  return value;
}

function addOneUtcDay(value: string): string {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  return date.toISOString().slice(0, 10);
}

function formatAllDayDate(value: string): string {
  return value.replaceAll("-", "");
}

function formatUtcDateTime(date: Date): string {
  return date.toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");
}

function shelfItemLabel(item: RebuyCalendarShelfItem): string {
  const parts = [displayPart(item.roaster_name), displayPart(item.bean_name)].filter((part) => part !== null);
  return parts.length > 0 ? parts.join(" - ") : "CoffeeDex 원두";
}

function displayPart(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function deterministicUid(id: string, reminderDate: string): string {
  return `coffeedex-rebuy-${stableHash(`${id}:${reminderDate}`)}@coffeedex.local`;
}

function stableHash(value: string): string {
  let hash = 5381;
  for (const character of value) {
    hash = (hash * 33 + character.charCodeAt(0)) % 2_147_483_647;
  }
  return hash.toString(36);
}

function escapeCalendarText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\r\n", "\\n")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
}

function foldCalendarLine(line: string): readonly string[] {
  const folded: string[] = [];
  let current = "";

  for (const character of line) {
    const next = `${current}${character}`;
    if (utf8Encoder.encode(next).length > maxCalendarLineOctets) {
      folded.push(current);
      current = ` ${character}`;
    } else {
      current = next;
    }
  }

  folded.push(current);
  return folded;
}
