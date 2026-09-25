import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const {
  deletionStatusLabel,
  normalizeAccountDeletion,
  normalizeAccountDeletionPage,
  restorationNotice,
  subscriptionCancellationMessage,
} = load("../../utils/accountDeletion/accountDeletion.ts");

const request = {
  id: "request-1",
  status: "information_required",
  scope: "user",
  requester: {
    id: "user-1",
    name: "Manager",
    email: "manager@example.test",
    role: "MANAGER",
  },
  reviewer: { id: "admin-1", name: "Admin", role: "ADMIN" },
  retry_count: 0,
  impact: {
    scope: "user",
    summary: "Profile is anonymized.",
    groups: [
      {
        code: "profile",
        label: "Profile",
        count: 1,
        retention_action: "anonymize",
      },
    ],
    total_records: 1,
  },
  available_actions: ["respond", "cancel", "made_up_client_transition"],
  history: [
    {
      status: "pending",
      label: "Request submitted",
      at: "2026-09-24T00:00:00Z",
    },
  ],
};

test("normalizes deletion contracts without inventing frontend transitions", () => {
  const normalized = normalizeAccountDeletion(request);
  assert.deepEqual(normalized.available_actions, ["respond", "cancel"]);
  assert.equal(normalized.impact.groups[0].retention_action, "anonymize");
  assert.equal(normalized.history[0].label, "Request submitted");
  assert.throws(
    () => normalizeAccountDeletion({ ...request, status: "client_approved" }),
    /invalid/,
  );
});

test("normalizes queue pagination and backend subscription state", () => {
  const page = normalizeAccountDeletionPage({
    data: [
      {
        ...request,
        scope: "tenant",
        subscription_blocker: { status: "active" },
      },
    ],
    current_page: 2,
    last_page: 3,
    total: 21,
  });
  assert.equal(page.data[0].subscription_blocker.status, "active");
  assert.equal(page.current_page, 2);
  assert.equal(page.total, 21);
});

test("presents statuses, subscription blockers, and restored-login scope", () => {
  assert.equal(
    deletionStatusLabel("information_required"),
    "Information required",
  );
  assert.equal(
    subscriptionCancellationMessage({
      code: "subscription_cancellation_required",
      message: "Cancel in the store first.",
    }),
    "Cancel in the store first.",
  );
  assert.equal(subscriptionCancellationMessage({ code: "other" }), null);
  assert.match(restorationNotice("tenant"), /organization.*restored/i);
  assert.match(restorationNotice("user"), /account deletion was cancelled/i);
});
