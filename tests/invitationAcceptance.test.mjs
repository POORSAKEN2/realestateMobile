import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const { invitationPasswordError, tokenFromInvitationUrl } = load(
  "../../utils/staff/invitationAcceptance.ts",
);

test("invitation tokens resolve from web fragments and mobile query URLs", () => {
  assert.equal(
    tokenFromInvitationUrl(
      "https://terrane.example/accept-invitation#token=abc%20123",
    ),
    "abc 123",
  );
  assert.equal(
    tokenFromInvitationUrl("terrane:///accept-invitation?token=secret"),
    "secret",
  );
  assert.equal(tokenFromInvitationUrl("terrane:///accept-invitation"), "");
  assert.equal(
    tokenFromInvitationUrl("terrane:///accept-invitation#token=%E0%A4%A"),
    "",
  );
});

test("invitation password validation preserves form state until valid", () => {
  assert.equal(
    invitationPasswordError("short", "short"),
    "Password must contain at least 8 characters.",
  );
  assert.equal(
    invitationPasswordError("password1", "password2"),
    "Passwords do not match.",
  );
  assert.equal(invitationPasswordError("password1", "password1"), "");
});
