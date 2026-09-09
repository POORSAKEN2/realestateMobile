import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const { filterUserVisibleNotifications, isUserVisibleNotification } = load(
  "../../utils/notifications/notificationVisibility.ts",
);

test("internal system errors never reach the customer notification feed", () => {
  const visible = { id: "visible", type: "SYSTEM" };
  const internal = { id: "internal", type: "SYSTEM_ERROR" };

  assert.equal(isUserVisibleNotification(internal), false);
  assert.deepEqual(filterUserVisibleNotifications([internal, visible]), [
    visible,
  ]);
});

test("notification type matching is normalized", () => {
  assert.equal(isUserVisibleNotification({ type: " system_error " }), false);
  assert.equal(isUserVisibleNotification({ type: null }), true);
});
