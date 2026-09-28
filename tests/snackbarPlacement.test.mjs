import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const { getSnackbarBottomOffset } = load("../../utils/snackbarPlacement.ts");
const { getTabBarContentInset } = load("../../constants/tabBar.ts");

test("no navigation uses compact spacing while clearing the home indicator", () => {
  assert.equal(getSnackbarBottomOffset({}), 24);
  assert.equal(getSnackbarBottomOffset({ safeAreaInset: 34 }), 46);
  assert.equal(getSnackbarBottomOffset({ safeAreaInset: -5 }), 24);
});

test("primary navigation uses shared bar clearance on both platforms", () => {
  for (const safeAreaInset of [0, 34]) {
    const navigationInset = getTabBarContentInset(safeAreaInset);
    assert.equal(
      getSnackbarBottomOffset({ navigationInset, safeAreaInset }),
      navigationInset,
    );
    assert.ok(navigationInset > getSnackbarBottomOffset({ safeAreaInset }));
  }
});

test("screen-bottom override and consumed safe area do not reserve navigation", () => {
  assert.equal(
    getSnackbarBottomOffset({
      navigationInset: 126,
      placement: "screen-bottom",
    }),
    24,
  );
});

test("sticky save footer remains clear without app bar spacing", () => {
  assert.equal(
    getSnackbarBottomOffset({ bottomClearance: 76, safeAreaInset: 34 }),
    88,
  );
  assert.equal(
    getSnackbarBottomOffset({ bottomClearance: 76, navigationInset: 126 }),
    126,
  );
});
