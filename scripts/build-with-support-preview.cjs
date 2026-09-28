#!/usr/bin/env node
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");

function stage(root, profile, enabled) {
  if (!["development", "preview", "production"].includes(profile))
    throw new Error("Expected development, preview, or production profile.");
  if (enabled && profile === "production")
    throw new Error("Support preview is forbidden in production.");
  if (
    enabled &&
    !fs.existsSync(path.join(root, "local-modules/raze-support/index.tsx"))
  )
    throw new Error("Local Support module is missing.");
  const snapshot = fs.mkdtempSync(path.join(os.tmpdir(), "terrane-build-"));
  try {
    const paths = execFileSync(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
      { cwd: root },
    )
      .toString()
      .split("\0")
      .filter(Boolean);
    for (const relative of paths) {
      if (
        relative.startsWith("local-modules/") ||
        relative === ".env" ||
        /^\.env.*\.local$/.test(relative)
      )
        continue;
      const source = path.join(root, relative);
      if (!fs.existsSync(source)) continue;
      if (fs.lstatSync(source).isSymbolicLink())
        throw new Error(`Build snapshot rejects symlinks: ${relative}`);
      const destination = path.join(snapshot, relative);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(source, destination);
    }
    if (enabled) {
      fs.cpSync(
        path.join(root, "local-modules/raze-support"),
        path.join(snapshot, "local-modules/raze-support"),
        {
          recursive: true,
          filter: (source) => {
            if (fs.lstatSync(source).isSymbolicLink())
              throw new Error(
                "Local Support module must not contain symlinks.",
              );
            return !/node_modules|\.env|\.git/.test(path.basename(source));
          },
        },
      );
    }
    const ignore = fs
      .readFileSync(path.join(snapshot, ".easignore"), "utf8")
      .replace(
        /^\/local-modules\/\s*$/m,
        enabled
          ? "/local-modules/*\n!/local-modules/raze-support/"
          : "/local-modules/",
      );
    fs.writeFileSync(path.join(snapshot, ".easignore"), ignore);
    const eas = JSON.parse(
      fs.readFileSync(path.join(snapshot, "eas.json"), "utf8"),
    );
    eas.build[profile].env = {
      ...eas.build[profile].env,
      EXPO_PUBLIC_ENABLE_RAZE_SUPPORT_PREVIEW: enabled ? "true" : "false",
    };
    fs.writeFileSync(
      path.join(snapshot, "eas.json"),
      JSON.stringify(eas, null, 2),
    );
    return snapshot;
  } catch (error) {
    fs.rmSync(snapshot, { recursive: true, force: true });
    throw error;
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const profile = args.shift() ?? "preview";
  const enabled = args.includes("--support");
  const check = args.includes("--check");
  let snapshot;
  try {
    if (args.some((arg) => arg === "--profile" || arg.startsWith("--profile=")))
      throw new Error("Specify the build profile only as the first argument.");
    snapshot = stage(path.resolve(__dirname, ".."), profile, enabled);
    console.log(
      `${profile} snapshot ready; Support module ${enabled ? "included" : "excluded"}.`,
    );
    if (!check) {
      // Used for local config resolution only; .easignore excludes node_modules from upload.
      fs.symlinkSync(
        path.resolve(__dirname, "../node_modules"),
        path.join(snapshot, "node_modules"),
        "dir",
      );
      const result = spawnSync(
        "eas",
        [
          "build",
          "--profile",
          profile,
          ...args.filter((arg) => !["--support", "--check"].includes(arg)),
        ],
        {
          cwd: snapshot,
          stdio: "inherit",
          env: {
            ...process.env,
            EAS_NO_VCS: "1",
            EAS_BUILD_PROFILE: profile,
            EXPO_PUBLIC_ENABLE_RAZE_SUPPORT_PREVIEW: enabled ? "true" : "false",
          },
        },
      );
      if (result.error) throw result.error;
      process.exitCode = result.status ?? 1;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    if (snapshot) fs.rmSync(snapshot, { recursive: true, force: true });
  }
}
module.exports = { stage };
