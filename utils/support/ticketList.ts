import type { SupportTicket } from "../../types/domain/support";

export type TicketSort = "newest" | "oldest" | "priority" | "status";
export type TicketListFilters = {
  status: string;
  priority: string;
  sort: TicketSort;
};

export const DEFAULT_TICKET_FILTERS: TicketListFilters = {
  status: "ALL",
  priority: "ALL",
  sort: "newest",
};

export const TICKET_SORT_OPTIONS: { label: string; value: TicketSort }[] = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Priority: highest first", value: "priority" },
  { label: "Status: open first", value: "status" },
];

const STATUS_ORDER = ["Open", "In Progress", "Resolved", "Closed"];
const PRIORITY_ORDER = ["Urgent", "High", "Medium", "Low"];

export function ticketFilterOptions(tickets: SupportTicket[]) {
  const options = (known: string[], field: "status" | "priority") => [
    {
      label: field === "status" ? "All statuses" : "All priorities",
      value: "ALL",
    },
    ...Array.from(
      new Set([
        ...known,
        ...tickets.map((ticket) => ticket[field]?.trim() || ""),
      ]),
    ).map((value) => ({ label: value || "Not provided", value })),
  ];
  return {
    statuses: options(STATUS_ORDER, "status"),
    priorities: options(PRIORITY_ORDER, "priority"),
  };
}

export function ticketListSummary(filters: TicketListFilters) {
  return [
    TICKET_SORT_OPTIONS.find((option) => option.value === filters.sort)?.label,
    filters.status !== "ALL" ? filters.status || "Status not provided" : null,
    filters.priority !== "ALL"
      ? `${filters.priority || "Not provided"} priority`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function filterAndSortTickets(
  tickets: SupportTicket[],
  filters: TicketListFilters,
) {
  const rank = (value: string | undefined, order: string[]) => {
    const index = order.indexOf(value?.trim() || "");
    return index < 0 ? order.length : index;
  };
  const rows = tickets
    .filter(
      (ticket) =>
        (filters.status === "ALL" ||
          (ticket.status?.trim() || "") === filters.status) &&
        (filters.priority === "ALL" ||
          (ticket.priority?.trim() || "") === filters.priority),
    )
    .map((ticket) => ({
      ticket,
      timestamp: ticket.created_at ? Date.parse(ticket.created_at) : NaN,
      statusRank: rank(ticket.status, STATUS_ORDER),
      priorityRank: rank(ticket.priority, PRIORITY_ORDER),
    }));

  rows.sort((a, b) => {
    if (filters.sort === "priority" && a.priorityRank !== b.priorityRank)
      return a.priorityRank - b.priorityRank;
    if (filters.sort === "status" && a.statusRank !== b.statusRank)
      return a.statusRank - b.statusRank;
    const aValid = Number.isFinite(a.timestamp);
    const bValid = Number.isFinite(b.timestamp);
    if (aValid !== bValid) return aValid ? -1 : 1;
    if (aValid && a.timestamp !== b.timestamp)
      return filters.sort === "oldest"
        ? a.timestamp - b.timestamp
        : b.timestamp - a.timestamp;
    return String(a.ticket.id).localeCompare(String(b.ticket.id));
  });
  return rows.map(({ ticket }) => ticket);
}
