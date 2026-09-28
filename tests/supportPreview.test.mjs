import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { supportPreviewTarget } = require("../config/supportPreview.js");
const { stage } = require("../scripts/build-with-support-preview.cjs");
const root = path.resolve(import.meta.dirname, "..");

test("clean clone resolves disabled fallback; enabled missing module fails clearly", () => {
  const temporary = fs.mkdtempSync(
    path.join(os.tmpdir(), "support-preview-test-"),
  );
  try {
    assert.equal(
      supportPreviewTarget({}, temporary),
      path.join(temporary, "components/support-preview/disabled.tsx"),
    );
    assert.throws(
      () =>
        supportPreviewTarget(
          { EXPO_PUBLIC_ENABLE_RAZE_SUPPORT_PREVIEW: "true" },
          temporary,
        ),
      /missing/,
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
test("production and unknown profiles reject Support enablement before module resolution", () => {
  for (const profile of ["production", "release"]) {
    assert.throws(
      () =>
        supportPreviewTarget(
          {
            EXPO_PUBLIC_ENABLE_RAZE_SUPPORT_PREVIEW: "true",
            EAS_BUILD_PROFILE: profile,
          },
          root,
        ),
      /forbidden/,
    );
  }
  assert.throws(() => stage(root, "production", true), /forbidden/);
});
test("production upload snapshot excludes all ignored Support contents", () => {
  const snapshot = stage(root, "production", false);
  try {
    assert.equal(fs.existsSync(path.join(snapshot, "local-modules")), false);
    assert.match(
      fs.readFileSync(path.join(snapshot, ".easignore"), "utf8"),
      /\/local-modules\//,
    );
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(snapshot, "eas.json"), "utf8")).build
        .production.env.EXPO_PUBLIC_ENABLE_RAZE_SUPPORT_PREVIEW,
      "false",
    );
  } finally {
    fs.rmSync(snapshot, { recursive: true, force: true });
  }
});
test(
  "explicit preview upload includes optional local module when installed",
  {
    skip: !fs.existsSync(
      path.join(root, "local-modules/raze-support/index.tsx"),
    ),
  },
  () => {
    const snapshot = stage(root, "preview", true);
    try {
      assert.equal(
        fs.existsSync(
          path.join(snapshot, "local-modules/raze-support/index.tsx"),
        ),
        true,
      );
      assert.match(
        fs.readFileSync(path.join(snapshot, ".easignore"), "utf8"),
        /!\/local-modules\/raze-support\//,
      );
      assert.equal(
        JSON.parse(fs.readFileSync(path.join(snapshot, "eas.json"), "utf8"))
          .build.preview.env.EXPO_PUBLIC_ENABLE_RAZE_SUPPORT_PREVIEW,
        "true",
      );
      assert.equal(
        supportPreviewTarget(
          {
            EXPO_PUBLIC_ENABLE_RAZE_SUPPORT_PREVIEW: "true",
            EAS_BUILD_PROFILE: "preview",
          },
          snapshot,
        ),
        path.join(snapshot, "local-modules/raze-support/index.tsx"),
      );
    } finally {
      fs.rmSync(snapshot, { recursive: true, force: true });
    }
  },
);
