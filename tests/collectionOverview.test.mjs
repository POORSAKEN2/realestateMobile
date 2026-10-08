import assert from "node:assert/strict";
import test from "node:test";
import Module from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import load from "./helpers/loadTs.cjs";

const { lightColors, darkColors } = load("../../constants/colors.ts");
let palette = lightColors;
const filename = fileURLToPath(
  new URL("../components/payments/CollectionOverview.tsx", import.meta.url),
);
const mocks = {
  "react/jsx-runtime": load("react/jsx-runtime"),
  "@expo/vector-icons": { Ionicons: "Ionicons" },
  "react-native": Object.fromEntries(
    ["ActivityIndicator", "Text", "TouchableOpacity", "View"].map((name) => [
      name,
      name,
    ]),
  ),
  "../../context/WorkspacePresentationContext": {
    useThemeColors: () => palette,
  },
  "../../constants/paymentStatusPresentation": load(
    "../../constants/paymentStatusPresentation.ts",
  ),
  "../../utils/formatters": load("../../utils/formatters.ts"),
  "../../utils/expenses/expenseForm": load(
    "../../utils/expenses/expenseForm.ts",
  ),
};
const instance = new Module(filename);
instance.filename = filename;
instance.require = (name) => {
  assert.ok(name in mocks, `Unexpected dependency: ${name}`);
  return mocks[name];
};
instance._compile(
  ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText,
  filename,
);
const { CollectionOverview } = instance.exports;

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  return [element, ...nodes(element.props?.children)];
}

const overview = {
  overdue: { count: 2, amount: 8000 },
  upcoming: { count: 1, amount: 4000 },
  collected: { count: 1, amount: 4000 },
  outstanding: { count: 3, amount: 12000 },
  reportingDate: "2026-10-08",
  timezone: "Asia/Manila",
  collectionMonthStart: "2026-10-01",
  collectionMonthEnd: "2026-10-31",
  upcomingEnd: "2026-10-15",
  scope: { kind: "accessible_properties", propertyIds: ["p1"] },
};

test("overdue card uses primary and onPrimary foregrounds in both themes while retaining bucket actions", () => {
  for (const theme of [lightColors, darkColors]) {
    palette = theme;
    const selections = [];
    const tree = CollectionOverview({
      data: overview,
      loading: false,
      error: null,
      onRetry: () => {},
      onSelect: (bucket) => selections.push(bucket),
    });
    const cards = nodes(tree).filter(
      (node) => node.type === "TouchableOpacity",
    );
    const overdue = cards.find((node) =>
      node.props.accessibilityLabel?.startsWith("View overdue:"),
    );
    assert.equal(overdue.props.style.backgroundColor, theme.primary);
    const labels = nodes(overdue).filter((node) => node.type === "Text");
    assert.equal(labels.length, 4);
    for (const label of labels)
      assert.equal(label.props.style.color, theme.onPrimary);
    assert.equal(
      nodes(overdue).find((node) => node.type === "Ionicons").props.color,
      theme.onPrimary,
    );
    for (const card of cards) card.props.onPress();
    assert.deepEqual(selections, ["overdue", "upcoming", "collected"]);
  }
});

test("collection overview retains loading, failure retry and cached-refresh failure states", () => {
  let retries = 0;
  const props = {
    loading: true,
    error: null,
    onRetry: () => {
      retries++;
    },
    onSelect: () => {},
  };
  const loading = CollectionOverview(props);
  assert.equal(
    nodes(loading).filter((node) => node.type === "ActivityIndicator").length,
    1,
  );
  const failure = CollectionOverview({
    ...props,
    loading: false,
    error: new Error("Offline"),
  });
  assert.ok(
    nodes(failure).some(
      (node) => node.type === "Text" && node.props.children === "Offline",
    ),
  );
  nodes(failure)
    .find((node) => node.type === "TouchableOpacity")
    .props.onPress();
  const stale = CollectionOverview({
    ...props,
    data: overview,
    loading: false,
    error: new Error("Offline"),
  });
  assert.ok(
    nodes(stale).some((node) =>
      node.props.accessibilityLabel?.startsWith("View overdue:"),
    ),
  );
  nodes(stale)
    .find((node) => node.type === "TouchableOpacity")
    .props.onPress();
  assert.equal(retries, 2);
});
