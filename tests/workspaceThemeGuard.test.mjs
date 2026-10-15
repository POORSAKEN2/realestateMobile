import assert from "node:assert/strict";
import test from "node:test";
import Module from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import load from "./helpers/loadTs.cjs";

test("presentation switches all theme outputs on expiry and renewal", () => {
  const filename = fileURLToPath(
    new URL("../context/WorkspacePresentationContext.tsx", import.meta.url),
  );
  const instance = new Module(filename);
  instance.filename = filename;
  let entitlement = { access_mode: "active" };
  let activePalette;
  let presentation;
  let effective = {
    appName: "Acme",
    currency: "PHP",
    locale: "en-PH",
    dateFormat: "MM/DD/YYYY",
    theme: "dark",
    defaultDashboardLocation: { value: "philippines" },
  };
  const palette = load("../../constants/colors.ts");
  const jsx = (type, props) => ({ type, props });
  const mocks = {
    "expo-status-bar": { StatusBar: "StatusBar" },
    nativewind: { vars: (value) => value },
    react: {
      createContext: () => ({ Provider: "Provider" }),
      useMemo: (factory) => factory(),
      useContext: () => undefined,
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { useColorScheme: () => "dark", View: "View" },
    "../constants/colors": {
      ...palette,
      setActiveColors: (theme) => { activePalette = theme; },
    },
    "../constants/defaultLocation": {
      DEFAULT_LOCATION_OPTIONS: [{ id: "philippines" }],
    },
    "../hooks/api/useWorkspaceSettings": {
      useEffectiveWorkspaceSettings: () => ({ data: effective }),
    },
    "../hooks/api/useBillingEntitlement": {
      useBillingEntitlement: () => ({ data: entitlement }),
    },
    "../utils/formatters": {
      setPresentationSettings: (settings) => { presentation = settings; },
    },
    "../utils/workspaceSettings": load("../../utils/workspaceSettings.ts"),
  };
  instance.require = (specifier) => {
    assert.ok(specifier in mocks, `Unexpected dependency: ${specifier}`);
    return mocks[specifier];
  };
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  instance._compile(outputText, filename);
  const render = () => instance.exports.WorkspacePresentationProvider({ children: null });

  assert.equal(render().props.value.resolvedTheme, "dark");
  entitlement = { access_mode: "read_only", status: "expired" };
  const expired = render();
  assert.equal(expired.props.value.settings.theme, "light");
  assert.equal(expired.props.value.resolvedTheme, "light");
  assert.equal(activePalette, "light");
  assert.equal(presentation.theme, "light");
  assert.equal(expired.props.children.props.children[0].props.style, "dark");
  assert.equal(effective.theme, "dark");

  entitlement = { access_mode: "active" };
  assert.equal(render().props.value.resolvedTheme, "dark");
  entitlement = undefined;
  assert.equal(render().props.value.resolvedTheme, "dark");
  effective = undefined;
  assert.equal(render().props.value.resolvedTheme, "light");
});
