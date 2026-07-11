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

export type RebuyCalendarFunnelBottleneck = "return" | "decision" | "new_bag" | "insufficient_data";

export type RebuyCalendarFunnel = {
  readonly exportedUsers: number;
  readonly returnedUsers: number;
  readonly purchaseClueUsers: number;
  readonly decidedUsers: number;
  readonly reboughtUsers: number;
  readonly shelfMemoryUsers: number;
  readonly rates: {
    readonly returnAfterExportPercent: number | null;
    readonly decisionAfterReturnPercent: number | null;
    readonly newBagAfterReboughtPercent: number | null;
  };
  readonly bottleneck: RebuyCalendarFunnelBottleneck;
  readonly unattributedEvents: number;
  readonly windowDays: 14;
  readonly windowStart: string;
};

const WINDOW_DAYS = 14 as const;
const DAY_MS = 24 * 60 * 60 * 1000;

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

function percentage(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return Math.round((numerator / denominator) * 100);
}

export function buildRebuyCalendarFunnel(input: {
  readonly events: readonly CalendarEvent[];
  readonly shelfItems: readonly RebuyDecision[];
  readonly now?: Date;
}): RebuyCalendarFunnel {
  const now = input.now ?? new Date();
  const windowStartTime = now.getTime() - WINDOW_DAYS * DAY_MS;
  const windowEvents = input.events.filter((event) => (timestamp(event.occurred_at) ?? -Infinity) >= windowStartTime);
  const exportedAtByUser = earliestEventByUser(windowEvents, "rebuy_calendar_export_clicked");
  const returnedAtByUser = earliestEventByUser(windowEvents, "rebuy_calendar_returned");
  const returnedUsers = new Map(
    Array.from(returnedAtByUser.entries()).filter(([userId, returnedAt]) => {
      const exportedAt = exportedAtByUser.get(userId);
      return exportedAt !== undefined && returnedAt >= exportedAt;
    }),
  );
  const purchaseClueAtByUser = earliestEventByUser(windowEvents, "rebuy_purchase_clue_opened");
  const purchaseClueUsers = new Set(
    Array.from(purchaseClueAtByUser.entries())
      .filter(([userId, openedAt]) => {
        const returnedAt = returnedUsers.get(userId);
        return returnedAt !== undefined && openedAt >= returnedAt;
      })
      .map(([userId]) => userId),
  );
  const decidedUsers = new Set<string>();
  const reboughtAtByUser = new Map<string, number>();

  for (const shelfItem of input.shelfItems) {
    if (shelfItem.rebuy_action !== "will_rebuy" && shelfItem.rebuy_action !== "rebought") continue;
    const returnedAt = returnedUsers.get(shelfItem.user_id);
    const decidedAt = shelfItem.rebuy_action_at ? timestamp(shelfItem.rebuy_action_at) : null;
    if (returnedAt !== undefined && decidedAt !== null && decidedAt >= returnedAt) {
      decidedUsers.add(shelfItem.user_id);
      if (shelfItem.rebuy_action === "rebought") {
        const existingReboughtAt = reboughtAtByUser.get(shelfItem.user_id);
        if (existingReboughtAt === undefined || decidedAt < existingReboughtAt) {
          reboughtAtByUser.set(shelfItem.user_id, decidedAt);
        }
      }
    }
  }

  const shelfMemoryAtByUser = earliestEventByUser(windowEvents, "rebuy_shelf_memory_started");
  const shelfMemoryUsers = new Set(
    Array.from(shelfMemoryAtByUser.entries())
      .filter(([userId, startedAt]) => {
        const reboughtAt = reboughtAtByUser.get(userId);
        return reboughtAt !== undefined && startedAt >= reboughtAt;
      })
      .map(([userId]) => userId),
  );
  const rates = {
    returnAfterExportPercent: percentage(returnedUsers.size, exportedAtByUser.size),
    decisionAfterReturnPercent: percentage(decidedUsers.size, returnedUsers.size),
    newBagAfterReboughtPercent: percentage(shelfMemoryUsers.size, reboughtAtByUser.size),
  };
  let bottleneck: RebuyCalendarFunnelBottleneck = "insufficient_data";
  if (
    rates.returnAfterExportPercent !== null
    && rates.decisionAfterReturnPercent !== null
    && rates.newBagAfterReboughtPercent !== null
  ) {
    if (
      rates.returnAfterExportPercent <= rates.decisionAfterReturnPercent
      && rates.returnAfterExportPercent <= rates.newBagAfterReboughtPercent
    ) {
      bottleneck = "return";
    } else if (rates.decisionAfterReturnPercent <= rates.newBagAfterReboughtPercent) {
      bottleneck = "decision";
    } else {
      bottleneck = "new_bag";
    }
  }

  return {
    exportedUsers: exportedAtByUser.size,
    returnedUsers: returnedUsers.size,
    purchaseClueUsers: purchaseClueUsers.size,
    decidedUsers: decidedUsers.size,
    reboughtUsers: reboughtAtByUser.size,
    shelfMemoryUsers: shelfMemoryUsers.size,
    rates,
    bottleneck,
    unattributedEvents: windowEvents.filter((event) => (
      (event.event_name === "rebuy_calendar_export_clicked" || event.event_name === "rebuy_calendar_returned" || event.event_name === "rebuy_purchase_clue_opened" || event.event_name === "rebuy_shelf_memory_started")
      && event.user_id === null
    )).length,
    windowDays: WINDOW_DAYS,
    windowStart: new Date(windowStartTime).toISOString(),
  };
}
