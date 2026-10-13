import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";
import load from "./helpers/loadTs.cjs";

const tokens = load("../../constants/colors.ts");
let palette = tokens.lightColors;
let fieldStateChanges = [];

function loadComponent(path) {
  const filename = fileURLToPath(
    new URL(`../components/${path}`, import.meta.url),
  );
  const compiled = new Module(filename);
  const mocks = {
    react: {
      ...load("react"),
      useState: (initial) => [
        initial,
        (value) => fieldStateChanges.push(value),
      ],
    },
    "react/jsx-runtime": load("react/jsx-runtime"),
    "react-native": {
      Text: "Text",
      View: "View",
      TouchableOpacity: "TouchableOpacity",
      TextInput: "TextInput",
      ScrollView: "ScrollView",
      useWindowDimensions: () => ({ width: 390, height: 844 }),
    },
    "@expo/vector-icons": {
      Ionicons: "Ionicons",
      MaterialCommunityIcons: "MaterialCommunityIcons",
    },
    "react-native-safe-area-context": { SafeAreaView: "SafeAreaView" },
    "../BottomSheetModal": { BottomSheetModal: "BottomSheetModal" },
    "../ModalHeader": { ModalHeader: "ModalHeader" },
    "../ModalActionFooter": { MODAL_ACTION_FOOTER_CONTENT_HEIGHT: 80 },
    "./fields/SearchField": loadFieldSearch(),
    "../ui/fields/SearchField": loadFieldSearch(),
  };
  compiled.require = (request) => {
    if (request.endsWith("constants/colors")) return tokens;
    if (request.endsWith("constants/modal"))
      return load("../../constants/modal.ts");
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

function loadFieldSearch() {
  return { SearchField: (props) => SearchField(props) };
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
const { SearchField } = loadComponent("ui/fields/SearchField.tsx");
const { SearchToolbar } = loadComponent("ui/SearchToolbar.tsx");
const { BaseField } = loadComponent("ui/fields/BaseField.tsx");
const { DropdownField } = loadComponent("ui/fields/DropdownField.tsx");
const { PickerField } = loadComponent("ui/fields/PickerField.tsx");
const { SelectionField, SearchableOptionSelector } = loadComponent(
  "documents/SearchableOptionSelector.tsx",
);

for (const theme of ["light", "dark"]) {
  test(`${theme} search and field icons use primary without changing input behavior`, () => {
    palette = theme === "light" ? tokens.lightColors : tokens.darkColors;
    tokens.setActiveColors(theme);
    try {
      for (const background of [palette.panel, palette.surface]) {
        assert.ok(contrast(palette.primary, background) >= 3);
      }
      const changes = [];
      let filtersOpened = 0;
      const searchProps = {
        accessibilityLabel: "Search tenants",
        clearAccessibilityLabel: "Clear tenant search",
        onChangeText: (value) => changes.push(value),
        placeholder: "Name, email, phone, or unit",
        value: "tenant",
      };
      const toolbar = nodes(
        SearchToolbar({
          ...searchProps,
          activeFilterCount: 2,
          onFilterPress: () => filtersOpened++,
        }),
      );
      const icons = toolbar.filter(
        (node) => node.type === "MaterialCommunityIcons",
      );
      assert.deepEqual(
        icons.map((node) => node.props.name),
        ["magnify", "close-circle", "tune-variant"],
      );
      assert.deepEqual(
        icons.map((node) => node.props.color),
        [palette.primary, palette.muted, palette.primary],
      );
      const input = toolbar.find((node) => node.type === "TextInput");
      assert.match(input.props.className, /\bh-full\b/);
      assert.match(input.props.className, /\bpy-0\b/);
      assert.ok(input.props.className.includes("text-[16px]"));
      assert.ok(!input.props.className.includes("text-base"));
      assert.equal(input.props.textAlignVertical, "center");
      assert.equal(input.props.style.includeFontPadding, false);
      assert.equal(input.props.placeholderTextColor, palette.description);
      assert.equal(input.props.value, "tenant");
      input.props.onChangeText("unit");
      toolbar
        .find((node) => node.props.accessibilityLabel === "Clear tenant search")
        .props.onPress();
      toolbar
        .find((node) => node.props.accessibilityLabel === "Open filters")
        .props.onPress();
      assert.deepEqual(changes, ["unit", ""]);
      assert.equal(filtersOpened, 1);
      assert.ok(
        toolbar.some(
          (node) => node.type === "Text" && node.props.children === 2,
        ),
      );
      assert.equal(
        nodes(SearchField({ ...searchProps, value: "" })).filter(
          (node) => node.type === "TouchableOpacity",
        ).length,
        0,
      );

      for (const variant of ["default", "filled"]) {
        const field = nodes(
          BaseField({
            icon: "mail-outline",
            label: "Email",
            value: "",
            required: true,
            keyboardType: "email-address",
            editable: false,
            onChangeText: searchProps.onChangeText,
            variant,
          }),
        );
        assert.equal(
          field.find((node) => node.type === "Ionicons").props.color,
          palette.primary,
        );
        const fieldInput = field.find((node) => node.type === "TextInput");
        assert.equal(
          fieldInput.props.placeholderTextColor,
          palette.description,
        );
        assert.equal(fieldInput.props.accessibilityLabel, "Email, required");
        assert.equal(fieldInput.props.editable, false);
        assert.equal(fieldInput.props.autoCapitalize, "none");
      }

      for (const variant of ["compact", "default", "filled"]) {
        fieldStateChanges = [];
        let selected;
        const dropdown = nodes(
          DropdownField({
            label: "Category",
            value: "Technical",
            variant,
            options: [
              { value: "Technical", label: "Technical" },
              { value: "Billing", label: "Billing" },
            ],
            onSelect: (value) => {
              selected = value;
            },
          }),
        );
        assert.ok(
          dropdown
            .filter((node) => node.type === "MaterialCommunityIcons")
            .every((node) => node.props.color === palette.primary),
        );
        const buttons = dropdown.filter(
          (node) => node.type === "TouchableOpacity",
        );
        buttons[0].props.onPress();
        buttons[2].props.onPress();
        assert.equal(selected, "Billing");
        assert.deepEqual(fieldStateChanges, [true, false]);
      }

      let pickerOpened = 0;
      const pickerProps = {
        label: "Date",
        placeholder: "Select date",
        onPress: () => pickerOpened++,
      };
      const picker = nodes(PickerField(pickerProps));
      assert.equal(
        picker.find((node) => node.type === "Ionicons").props.color,
        palette.primary,
      );
      picker.find((node) => node.type === "TouchableOpacity").props.onPress();
      assert.equal(pickerOpened, 1);
      const customPicker = nodes(
        PickerField({
          ...pickerProps,
          disabled: true,
          iconColor: palette.danger,
        }),
      );
      assert.equal(
        customPicker.find((node) => node.type === "Ionicons").props.color,
        palette.danger,
      );
      assert.equal(
        customPicker.find((node) => node.type === "TouchableOpacity").props
          .disabled,
        true,
      );

      const selection = nodes(
        SelectionField({
          label: "Property",
          value: "None",
          onPress: () => pickerOpened++,
        }),
      );
      assert.equal(
        selection.find((node) => node.type === "MaterialCommunityIcons").props
          .color,
        palette.primary,
      );
      selection
        .find((node) => node.type === "TouchableOpacity")
        .props.onPress();
      assert.equal(pickerOpened, 2);
      let chosen;
      const selector = nodes(
        SearchableOptionSelector({
          backAccessibilityLabel: "Back",
          emptyLabel: "None",
          onBack: () => {},
          onChangeQuery: searchProps.onChangeText,
          onSelect: (id) => {
            chosen = id;
          },
          options: [{ id: "1", label: "Property" }],
          query: "",
          selectedId: "1",
          title: "Property",
        }),
      );
      assert.ok(
        selector
          .filter((node) => node.type === "MaterialCommunityIcons")
          .every((node) => node.props.color === palette.primary),
      );
      selector
        .filter((node) => node.props.accessibilityRole === "radio")[1]
        .props.onPress();
      assert.equal(chosen, "1");
    } finally {
      tokens.setActiveColors("light");
      palette = tokens.lightColors;
    }
  });
}

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
