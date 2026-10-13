import type { SupportTicket } from "../../types/domain/support";

export type TicketSortField = "creation" | "priority" | "status";
export type TicketSortDirection = "asc" | "desc";
export type TicketSort = {
  field: TicketSortField;
  directions: Record<TicketSortField, TicketSortDirection>;
};
export type TicketListFilters = {
  statuses: string[];
  priorities: string[];
  sort: TicketSort;
};

export const DEFAULT_TICKET_FILTERS: TicketListFilters = {
  statuses: [],
  priorities: [],
  sort: {
    field: "creation",
    directions: { creation: "desc", priority: "desc", status: "asc" },
  },
};

export const TICKET_SORT_OPTIONS: { label: string; value: TicketSortField }[] =
  [
    { label: "Creation", value: "creation" },
    { label: "Priority", value: "priority" },
    { label: "Status", value: "status" },
  ];

const SORT_SUMMARIES: Record<
  TicketSortField,
  Record<TicketSortDirection, string>
> = {
  creation: { asc: "Creation: oldest first", desc: "Creation: newest first" },
  priority: { asc: "Priority: lowest first", desc: "Priority: highest first" },
  status: { asc: "Status: open first", desc: "Status: closed first" },
};

export function ticketSortSummary(sort: TicketSort, field = sort.field) {
  return SORT_SUMMARIES[field][sort.directions[field]];
}

export function selectTicketSort(
  sort: TicketSort,
  field: TicketSortField,
): TicketSort {
  if (sort.field !== field) return { ...sort, field };
  return {
    ...sort,
    directions: {
      ...sort.directions,
      [field]: sort.directions[field] === "asc" ? "desc" : "asc",
    },
  };
}

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

export function ticketListSummary(
  filters: TicketListFilters,
  options = ticketFilterOptions([]),
) {
  const labels = (
    values: string[],
    choices: { label: string; value: string }[],
    allLabel: string,
  ) => {
    if (values.length === 0) return allLabel;
    const selected = new Set(values);
    const ordered = choices.filter((option) => selected.has(option.value));
    const knownValues = new Set(ordered.map((option) => option.value));
    return [
      ...ordered.map((option) => option.label),
      ...values
        .filter((value) => !knownValues.has(value))
        .sort()
        .map((value) => value || "Not provided"),
    ].join(", ");
  };
  return [
    ticketSortSummary(filters.sort),
    labels(filters.statuses, options.statuses, "All statuses"),
    labels(filters.priorities, options.priorities, "All priorities"),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function filterAndSortTickets(
  tickets: SupportTicket[],
  filters: TicketListFilters,
) {
  const statuses = new Set(filters.statuses);
  const priorities = new Set(filters.priorities);
  const rank = (value: string | undefined, order: string[]) => {
    return order.indexOf(value?.trim() || "");
  };
  const rows = tickets
    .filter(
      (ticket) =>
        (statuses.size === 0 || statuses.has(ticket.status?.trim() || "")) &&
        (priorities.size === 0 ||
          priorities.has(ticket.priority?.trim() || "")),
    )
    .map((ticket) => ({
      ticket,
      timestamp: ticket.created_at ? Date.parse(ticket.created_at) : NaN,
      statusRank: rank(ticket.status, STATUS_ORDER),
      priorityRank: rank(ticket.priority, PRIORITY_ORDER),
    }));

  const { field, directions } = filters.sort;
  const direction = directions[field];
  rows.sort((a, b) => {
    if (field !== "creation") {
      const aRank = field === "priority" ? a.priorityRank : a.statusRank;
      const bRank = field === "priority" ? b.priorityRank : b.statusRank;
      const aKnown = aRank >= 0;
      const bKnown = bRank >= 0;
      if (aKnown !== bKnown) return aKnown ? -1 : 1;
      if (aKnown && aRank !== bRank) {
        const ascendingRank = field === "status" ? 1 : -1;
        return (aRank - bRank) * ascendingRank * (direction === "asc" ? 1 : -1);
      }
    }
    const aValid = Number.isFinite(a.timestamp);
    const bValid = Number.isFinite(b.timestamp);
    if (aValid !== bValid) return aValid ? -1 : 1;
    if (aValid && a.timestamp !== b.timestamp)
      return field === "creation" && direction === "asc"
        ? a.timestamp - b.timestamp
        : b.timestamp - a.timestamp;
    return String(a.ticket.id).localeCompare(String(b.ticket.id));
  });
  return rows.map(({ ticket }) => ticket);
}
