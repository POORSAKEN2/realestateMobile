import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";
import load from "./helpers/loadTs.cjs";

const tokens = load("../../constants/colors.ts");
let palette = tokens.lightColors;

function loadComponent(path) {
  const filename = fileURLToPath(
    new URL(`../components/${path}`, import.meta.url),
  );
  const compiled = new Module(filename);
  const mocks = {
    "react/jsx-runtime": load("react/jsx-runtime"),
    "react-native": {
      Text: "Text",
      View: "View",
      TouchableOpacity: "TouchableOpacity",
    },
    "@expo/vector-icons": {
      Ionicons: "Ionicons",
      MaterialCommunityIcons: "MaterialCommunityIcons",
    },
  };
  compiled.require = (request) => {
    if (request.endsWith("constants/colors")) return tokens;
    if (request.endsWith("context/WorkspacePresentationContext")) {
      return { useThemeColors: () => palette };
    }
    if (request in mocks) return mocks[request];
    throw new Error(`Unexpected component dependency: ${request}`);
  };
  compiled._compile(
    ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    filename,
  );
  return compiled.exports;
}

function nodes(element) {
  if (Array.isArray(element)) return element.flatMap(nodes);
  if (!element || typeof element !== "object") return [];
  if (typeof element.type === "function")
    return nodes(element.type(element.props));
  return [element, ...nodes(element.props?.children)];
}

function contrast(foreground, background) {
  const luminance = (hex) =>
    [1, 3, 5]
      .map((offset) => {
        const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
        return channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4;
      })
      .reduce(
        (sum, channel, index) =>
          sum + channel * [0.2126, 0.7152, 0.0722][index],
        0,
      );
  const [light, dark] = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (light + 0.05) / (dark + 0.05);
}

const { FormSection } = loadComponent("ui/forms/FormSection.tsx");
const { ModalHeader } = loadComponent("ui/ModalHeader.tsx");
const { ProfileMenuSection } = loadComponent("profile/ProfileMenuSection.tsx");
const { NavigationTile } = loadComponent("navigation/NavigationTile.tsx");
const { FloorPlanIconButton } = loadComponent(
  "floorplans/FloorPlanIconButton.tsx",
);

for (const theme of ["light", "dark"]) {
  test(`${theme} icon tiles use a consistent tint with accessible icon contrast`, () => {
    palette = theme === "light" ? tokens.lightColors : tokens.darkColors;
    tokens.setActiveColors(theme);
    try {
      assert.ok(contrast(palette.primary, palette.iconSurface) >= 3);
      assert.ok(contrast(palette.primaryContent, palette.iconSurface) >= 4.5);
      const expectedSurface = theme === "light" ? "#F3F1FE" : "#252537";
      assert.equal(palette.iconSurface, expectedSurface);
      assert.equal(tokens.colors.iconSurface, expectedSurface);

      for (const variant of ["divider", "card"]) {
        const section = nodes(
          FormSection({
            icon: "ticket-outline",
            title: "Ticket information",
            variant,
          }),
        );
        assert.ok(
          section.some((node) =>
            node.props.className?.includes("bg-iconSurface"),
          ),
        );
        assert.equal(
          section.find((node) => node.type === "MaterialCommunityIcons").props
            .color,
          palette.primary,
        );
      }

      let presses = 0;
      const onPress = () => presses++;
      const header = nodes(
        ModalHeader({ title: "Ticket Details", onClose: onPress }),
      );
      const close = header.find((node) => node.type === "TouchableOpacity");
      assert.match(
        close.props.className,
        /h-11 w-11.*rounded-2xl bg-iconSurface/,
      );
      assert.equal(
        header.find((node) => node.type === "Ionicons").props.color,
        palette.primary,
      );
      close.props.onPress();

      const menu = nodes(
        ProfileMenuSection({
          title: "Account",
          items: [
            { icon: "notifications-outline", label: "Notifications", onPress },
          ],
        }),
      );
      assert.ok(
        menu.some((node) => node.props.className?.includes("bg-iconSurface")),
      );
      assert.ok(
        menu
          .filter((node) => node.type === "Ionicons")
          .every((node) => node.props.color === palette.primary),
      );
      menu.find((node) => node.type === "TouchableOpacity").props.onPress();

      let navigated;
      const item = {
        label: "Payments",
        href: "/payments",
        icon: { family: "Ionicons", name: "wallet-outline" },
      };
      const navigation = nodes(
        NavigationTile({
          item,
          onNavigate: (href) => {
            navigated = href;
          },
        }),
      );
      assert.ok(
        navigation.some((node) =>
          node.props.className?.includes("bg-iconSurface"),
        ),
      );
      assert.equal(
        navigation.find((node) => node.type === "Ionicons").props.color,
        palette.primary,
      );
      navigation
        .find((node) => node.type === "TouchableOpacity")
        .props.onPress();
      assert.equal(navigated, item.href);
      assert.equal(presses, 2);

      for (const selected of [false, true]) {
        const button = nodes(
          FloorPlanIconButton({
            icon: "magnify-plus-outline",
            label: "Zoom",
            onPress,
            selected,
          }),
        );
        assert.match(button[0].props.className, /bg-iconSurface/);
        assert.equal(button[0].props.accessibilityState.selected, selected);
        assert.equal(
          button.find((node) => node.type === "MaterialCommunityIcons").props
            .color,
          palette.primary,
        );
        if (selected)
          assert.match(button[0].props.className, /border border-primary/);
      }
      const destructive = nodes(
        FloorPlanIconButton({
          danger: true,
          disabled: true,
          icon: "delete-outline",
          label: "Delete",
          onPress,
        }),
      );
      assert.match(destructive[0].props.className, /bg-dangerSurface/);
      assert.equal(destructive[0].props.disabled, true);
      assert.equal(
        destructive.find((node) => node.type === "MaterialCommunityIcons").props
          .color,
        palette.danger,
      );
    } finally {
      tokens.setActiveColors("light");
      palette = tokens.lightColors;
    }
  });
}

test("iconSurface is wired through NativeWind and the active workspace palette", () => {
  const provider = readFileSync(
    new URL("../context/WorkspacePresentationContext.tsx", import.meta.url),
    "utf8",
  );
  const config = load("../../tailwind.config.js");
  assert.match(provider, /"--color-icon-surface": rgb\(palette\.iconSurface\)/);
  assert.equal(
    config.theme.extend.colors.iconSurface,
    "rgb(var(--color-icon-surface) / <alpha-value>)",
  );
});

test("rounded brand icon tiles do not retain fixed foreground colors", () => {
  let tiles = 0;
  function scan(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) {
        scan(path);
        continue;
      }
      if (!path.endsWith(".tsx")) continue;
      const source = ts.createSourceFile(
        path,
        readFileSync(path, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      function visit(node) {
        if (
          ts.isJsxElement(node) &&
          node.openingElement.attributes
            .getText(source)
            .includes("bg-iconSurface")
        ) {
          tiles++;
          for (const child of node.children) {
            if (
              !ts.isJsxSelfClosingElement(child) ||
              !/Icon|Feather/.test(child.tagName.getText(source))
            )
              continue;
            const color = child.attributes.properties.find(
              (prop) => prop.name?.text === "color",
            )?.initializer;
            assert.ok(
              !color || !ts.isStringLiteral(color),
              `${path}: brand tile must use the theme foreground`,
            );
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
  scan(fileURLToPath(new URL("../components", import.meta.url)));
  scan(fileURLToPath(new URL("../app", import.meta.url)));
  assert.ok(
    tiles >= 60,
    `Expected app-wide coverage, found ${tiles} icon tiles`,
  );
});
