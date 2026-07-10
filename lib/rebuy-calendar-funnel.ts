type CalendarEvent = {
  readonly event_name: string;
  readonly occurred_at: string;
  readonly user_id: string | null;
};

type RebuyDecision = {
  readonly user_id: string;
  readonly rebuy_action: "none" | "drank" | "will_rebuy" | "rebought" | null;
  readonly rebuy_action_at: string | null;
};

export type RebuyCalendarFunnel = {
  readonly exportedUsers: number;
  readonly returnedUsers: number;
  readonly decidedUsers: number;
  readonly unattributedEvents: number;
};

function timestamp(value: string): number | null {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function earliestEventByUser(events: readonly CalendarEvent[], eventName: string): Map<string, number> {
  const earliest = new Map<string, number>();

  for (const event of events) {
    if (event.event_name !== eventName || !event.user_id) continue;
    const occurredAt = timestamp(event.occurred_at);
    if (occurredAt === null) continue;
    const current = earliest.get(event.user_id);
    if (current === undefined || occurredAt < current) earliest.set(event.user_id, occurredAt);
  }

  return earliest;
}

export function buildRebuyCalendarFunnel(input: {
  readonly events: readonly CalendarEvent[];
  readonly shelfItems: readonly RebuyDecision[];
}): RebuyCalendarFunnel {
  const exportedAtByUser = earliestEventByUser(input.events, "rebuy_calendar_export_clicked");
  const returnedAtByUser = earliestEventByUser(input.events, "rebuy_calendar_returned");
  const returnedUsers = new Map(
    Array.from(returnedAtByUser.entries()).filter(([userId, returnedAt]) => {
      const exportedAt = exportedAtByUser.get(userId);
      return exportedAt !== undefined && returnedAt >= exportedAt;
    }),
  );
  const decidedUsers = new Set<string>();

  for (const shelfItem of input.shelfItems) {
    if (shelfItem.rebuy_action !== "will_rebuy" && shelfItem.rebuy_action !== "rebought") continue;
    const returnedAt = returnedUsers.get(shelfItem.user_id);
    const decidedAt = shelfItem.rebuy_action_at ? timestamp(shelfItem.rebuy_action_at) : null;
    if (returnedAt !== undefined && decidedAt !== null && decidedAt >= returnedAt) {
      decidedUsers.add(shelfItem.user_id);
    }
  }

  return {
    exportedUsers: exportedAtByUser.size,
    returnedUsers: returnedUsers.size,
    decidedUsers: decidedUsers.size,
    unattributedEvents: input.events.filter((event) => (
      (event.event_name === "rebuy_calendar_export_clicked" || event.event_name === "rebuy_calendar_returned")
      && event.user_id === null
    )).length,
  };
}
