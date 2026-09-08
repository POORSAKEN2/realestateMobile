import type { PropertyStatus, PropertyStatusHistoryEntry } from "../../types";

export const PROPERTY_LIFECYCLE_SCOPE = "property" as const;

export const PROPERTY_LIFECYCLE_STEPS = [
  "IDLE",
  "UNDER_CONSTRUCTION",
  "PRE_LEASED",
  "REVENUE_GENERATING",
] as const satisfies readonly PropertyStatus[];

const LIFECYCLE_LABELS: Record<PropertyStatus, string> = {
  IDLE: "Planned",
  UNDER_CONSTRUCTION: "Building",
  PRE_LEASED: "Ready for Rent",
  REVENUE_GENERATING: "Revenue Generating",
  PERSONAL_USE: "Personal Use",
};

const LIFECYCLE_DESCRIPTIONS: Record<PropertyStatus, string> = {
  IDLE: "Planned or inactive while the next use is prepared.",
  UNDER_CONSTRUCTION: "Construction or major preparation is in progress.",
  PRE_LEASED: "Prepared for rental operations before revenue begins.",
  REVENUE_GENERATING: "Occupied or otherwise producing rental revenue.",
  PERSONAL_USE: "Temporarily outside the rental lifecycle for owner use.",
};

const ALLOWED_TRANSITIONS: Record<PropertyStatus, readonly PropertyStatus[]> = {
  UNDER_CONSTRUCTION: ["PRE_LEASED", "IDLE"],
  PRE_LEASED: ["REVENUE_GENERATING", "IDLE"],
  REVENUE_GENERATING: ["PERSONAL_USE", "IDLE"],
  PERSONAL_USE: ["REVENUE_GENERATING", "IDLE"],
  IDLE: [
    "UNDER_CONSTRUCTION",
    "PRE_LEASED",
    "REVENUE_GENERATING",
    "PERSONAL_USE",
  ],
};

export function getPropertyLifecycleLabel(status: PropertyStatus) {
  return LIFECYCLE_LABELS[status];
}

export function getPropertyLifecycleDescription(status: PropertyStatus) {
  return LIFECYCLE_DESCRIPTIONS[status];
}

export function getAllowedPropertyTransitions(status: PropertyStatus) {
  return ALLOWED_TRANSITIONS[status];
}

export function canTransitionProperty(
  fromStatus: PropertyStatus,
  toStatus: PropertyStatus,
) {
  return ALLOWED_TRANSITIONS[fromStatus].includes(toStatus);
}

export function assertPropertyTransition(
  fromStatus: PropertyStatus,
  toStatus: PropertyStatus,
) {
  if (!canTransitionProperty(fromStatus, toStatus)) {
    throw new Error(
      `Cannot move from ${getPropertyLifecycleLabel(fromStatus)} to ${getPropertyLifecycleLabel(toStatus)}.`,
    );
  }
}

export function getPropertyLifecycleStepIndex(status: PropertyStatus) {
  return PROPERTY_LIFECYCLE_STEPS.indexOf(
    status as (typeof PROPERTY_LIFECYCLE_STEPS)[number],
  );
}

export function mergePropertyStatusHistory(
  history: readonly PropertyStatusHistoryEntry[],
  entry: PropertyStatusHistoryEntry,
) {
  return [
    entry,
    ...history.filter(
      (item) =>
        item.id !== entry.id &&
        !(
          item.fromStatus === entry.fromStatus &&
          item.toStatus === entry.toStatus &&
          item.createdAt === entry.createdAt
        ),
    ),
  ];
}
