import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const { ApiError } = load("../../api/errors.ts");
const { APPLE_MAPS_UNAVAILABLE_CODE, isAppleMapsUnavailableError } = load(
  "../../utils/maps/appleMapsAvailability.ts",
);

test("classifies only the structured Apple Maps unavailable response", () => {
  assert.equal(
    isAppleMapsUnavailableError(
      new ApiError(
        "Apple Maps is temporarily unavailable.",
        503,
        APPLE_MAPS_UNAVAILABLE_CODE,
      ),
    ),
    true,
  );
  assert.equal(
    isAppleMapsUnavailableError(new ApiError("Server error", 500)),
    false,
  );
  assert.equal(isAppleMapsUnavailableError(new Error("Network error")), false);
});
