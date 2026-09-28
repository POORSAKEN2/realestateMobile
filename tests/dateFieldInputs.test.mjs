import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import load from "./helpers/loadTs.cjs";

const { formatDateValue, parseDateValue } = load(
  "../../utils/expenses/expenseForm.ts",
);

test("date-only values retain the selected local calendar day", () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = "Asia/Manila";
    const date = new Date(2026, 8, 28, 0, 5);
    assert.equal(date.toISOString().slice(0, 10), "2026-09-27");
    assert.equal(formatDateValue(date), "2026-09-28");
    assert.equal(formatDateValue(parseDateValue("2024-02-29")), "2024-02-29");
    process.env.TZ = "America/Los_Angeles";
    assert.equal(formatDateValue(parseDateValue("2026-09-28")), "2026-09-28");
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test("app date fields do not regress to generic text entry", () => {
  const failures = [];
  const rawInputs = new Set([
    "TextInput",
    "BaseField",
    "ProfileField",
    "RegistrationField",
  ]);
  const root = fileURLToPath(new URL("../", import.meta.url));
  function scan(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) scan(file);
      else if (file.endsWith(".tsx")) {
        const source = ts.createSourceFile(
          file,
          fs.readFileSync(file, "utf8"),
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TSX,
        );
        function visit(node) {
          if (
            (ts.isJsxSelfClosingElement(node) ||
              ts.isJsxOpeningElement(node)) &&
            rawInputs.has(node.tagName.getText(source))
          ) {
            const attributes = node.attributes.properties.filter(
              (attribute) =>
                ts.isJsxAttribute(attribute) &&
                [
                  "label",
                  "accessibilityLabel",
                  "placeholder",
                  "value",
                  "onChangeText",
                ].includes(attribute.name.getText(source)),
            );
            if (
              attributes.some((attribute) =>
                /\bdate\b|Date\b|_date\b|YYYY-MM-DD|HH:mm/.test(
                  attribute.getText(source),
                ),
              )
            )
              failures.push(file);
          }
          ts.forEachChild(node, visit);
        }
        visit(source);
      }
    }
  }
  scan(path.join(root, "app"));
  scan(path.join(root, "components"));
  assert.deepEqual(
    failures,
    [],
    "Use PickerField + DateTimePickerModal for calendar inputs.",
  );
});
