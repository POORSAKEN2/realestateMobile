import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const { validatePasswordChange } = load(
  "../../utils/settings/passwordChange.ts",
);

test("password form reports missing fields individually", () => {
  assert.deepEqual(
    Object.keys(validatePasswordChange({ current: "", next: "", confirm: "" })),
    ["current", "next", "confirm"],
  );
});

test("password form preserves minimum length and different-password rules", () => {
  assert.equal(
    validatePasswordChange({
      current: "old password",
      next: "short",
      confirm: "short",
    }).next,
    "Use at least 8 characters.",
  );
  assert.equal(
    validatePasswordChange({
      current: "password",
      next: "password",
      confirm: "password",
    }).next,
    "Choose a different password.",
  );
});

test("password form catches mismatched confirmation", () => {
  assert.equal(
    validatePasswordChange({
      current: "old password",
      next: "new password",
      confirm: "different password",
    }).confirm,
    "Passwords do not match.",
  );
});

test("valid passwords remain exact, including spaces", () => {
  assert.deepEqual(
    validatePasswordChange({
      current: "previous password",
      next: " new password ",
      confirm: " new password ",
    }),
    {},
  );
});
