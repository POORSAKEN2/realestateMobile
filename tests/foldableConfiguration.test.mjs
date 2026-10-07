import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const withFoldableConfiguration = require("../plugins/withFoldableConfiguration");

function manifestFixture(configChanges) {
  return {
    manifest: {
      $: { "xmlns:android": "http://schemas.android.com/apk/res/android" },
      application: [
        {
          $: { "android:name": ".MainApplication" },
          activity: [
            {
              $: {
                "android:name": ".MainActivity",
                "android:launchMode": "singleTask",
                "android:screenOrientation": "portrait",
                "android:exported": "true",
                ...(configChanges === undefined
                  ? {}
                  : { "android:configChanges": configChanges }),
              },
              "intent-filter": [
                {
                  action: [{ $: { "android:name": "android.intent.action.MAIN" } }],
                  category: [
                    { $: { "android:name": "android.intent.category.LAUNCHER" } },
                  ],
                },
              ],
            },
            { $: { "android:name": ".OtherActivity", "android:configChanges": "locale" } },
          ],
        },
      ],
    },
  };
}

async function applyPlugin(manifest) {
  const config = withFoldableConfiguration({ name: "Terrane", slug: "realestateMobile" });
  const result = await config.mods.android.manifest({
    ...config,
    modResults: manifest,
    modRequest: { platform: "android", modName: "manifest" },
  });
  return result.modResults;
}

function mainAttributes(manifest) {
  return manifest.manifest.application[0].activity[0].$;
}

test("foldable changes retain existing configuration flags", async () => {
  const existing = "keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode";
  const manifest = await applyPlugin(manifestFixture(existing));
  assert.deepEqual(mainAttributes(manifest)["android:configChanges"].split("|"), [
    ...existing.split("|"), "smallestScreenSize", "density",
  ]);
});

test("repeated plugin execution does not duplicate foldable flags", async () => {
  const manifest = await applyPlugin(manifestFixture("screenSize|smallestScreenSize|density"));
  const once = structuredClone(manifest);
  await applyPlugin(manifest);
  assert.deepEqual(manifest, once);
  assert.equal(mainAttributes(manifest)["android:configChanges"], "screenSize|smallestScreenSize|density");
});

test("missing configuration flags are initialized", async () => {
  const manifest = await applyPlugin(manifestFixture());
  assert.equal(mainAttributes(manifest)["android:configChanges"], "smallestScreenSize|density");
});

test("only main activity configuration flags change", async () => {
  const manifest = manifestFixture("locale|fontScale");
  const expected = structuredClone(manifest);
  mainAttributes(expected)["android:configChanges"] = "locale|fontScale|smallestScreenSize|density";
  await applyPlugin(manifest);
  assert.deepEqual(manifest, expected);
});

test("manifest without main activity fails instead of modifying another activity", async () => {
  const manifest = manifestFixture("screenSize");
  manifest.manifest.application[0].activity.shift();
  await assert.rejects(applyPlugin(manifest), /MainActivity/i);
});
