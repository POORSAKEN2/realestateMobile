import assert from "node:assert/strict";
import test from "node:test";
import load from "./helpers/loadTs.cjs";

const { lightColors, darkColors, colors, setActiveColors } = load(
  "../../constants/colors.ts",
);

function channels(hex) {
  return [1, 3, 5].map(
    (offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
}

function luminance(rgb) {
  return rgb
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    )
    .reduce(
      (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
      0,
    );
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (values[0] + 0.05) / (values[1] + 0.05);
}

for (const [theme, palette] of Object.entries({
  light: lightColors,
  dark: darkColors,
})) {
  test(`${theme} badges, inverse actions, alerts and snackbars retain readable contrast`, () => {
    for (const [foreground, background] of [
      ["text", "panel"],
      ["description", "surface"],
      ["onInverse", "text"],
      ["onDanger", "danger"],
      ["onSuccess", "success"],
      ["onInfo", "info"],
      ["whitePrimary", "overlay"],
      ["whitePrimary", "primaryStrong"],
      ["onPrimary", "primary"],
      ["overlayAccent", "overlay"],
    ]) {
      assert.ok(
        contrast(
          channels(palette[foreground]),
          channels(palette[background]),
        ) >= 4.5,
        `${theme}: ${foreground} on ${background} must meet 4.5:1`,
      );
    }
    // Photo counters use an 80% scrim; check its worst case over a white image.
    const photoOverlay = channels(palette.overlay).map(
      (value) => value * 0.8 + 0.2,
    );
    assert.ok(contrast(channels(palette.whitePrimary), photoOverlay) >= 4.5);
    const primaryBadge = channels(palette.primary).map(
      (value, index) => value * 0.1 + channels(palette.panel)[index] * 0.9,
    );
    assert.ok(
      contrast(channels(palette.primaryContent), primaryBadge) >= 4.5,
      `${theme}: primary badge text must meet 4.5:1`,
    );
  });
}

test("theme changes update inline foreground tokens without reloading", () => {
  try {
    setActiveColors("dark");
    assert.equal(colors.onInverse, darkColors.onInverse);
    assert.equal(colors.onDanger, darkColors.onDanger);
    assert.equal(colors.onPrimary, darkColors.onPrimary);
    assert.equal(colors.primaryContent, darkColors.primaryContent);
    setActiveColors("light");
    assert.equal(colors.onInverse, lightColors.onInverse);
    assert.equal(colors.onDanger, lightColors.onDanger);
    assert.equal(colors.onPrimary, lightColors.onPrimary);
    assert.equal(colors.primaryContent, lightColors.primaryContent);
  } finally {
    setActiveColors("light");
  }
});
