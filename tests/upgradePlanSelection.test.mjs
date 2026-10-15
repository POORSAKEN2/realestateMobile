import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import loadWithMocks from "./helpers/loadWithMocks.cjs";

const jsx = (type, props) =>
  typeof type === "function"
    ? { type: "footer", props: { ...props, children: type(props) } }
    : { type, props };
const { BillingPurchaseFooter } = loadWithMocks(
  fileURLToPath(
    new URL("../components/billing/BillingPurchaseFooter.tsx", import.meta.url),
  ),
  {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { Text: "text", View: "view" },
    "./BillingActionButton": { BillingActionButton: "action" },
    "../ui/ModalActionFooter": { ModalActionFooter: "modal-footer" },
  },
);
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...nodes(tree.props?.children)];
}
const tiers = [
  { key: "starter", label: "Starter", property_limit: 3 },
  { key: "professional", label: "Professional", property_limit: 15 },
  { key: "portfolio", label: "Portfolio", property_limit: 50 },
];

function setup() {
  const slots = [];
  let cursor = 0;
  let effects = [];
  let allowed = true;
  let fetching = false;
  let failed = false;
  let loading = false;
  let premium = false;
  let purchaseResult = null;
  let preview = async () => ({ allowed: true, blockers: [] });
  let purchases = 0;
  const alerts = [];
  const calls = [];
  const entitlement = { tier: "free", tiers };
  const packages = Object.fromEntries(
    tiers.flatMap((tier, i) =>
      ["monthly", "yearly"].map((period) => [
        `${tier.key}_${period}`,
        {
          product: {
            priceString: `$${(i + 1) * (period === "monthly" ? 10 : 100)}`,
          },
        },
      ]),
    ),
  );
  function changed(slot, deps) {
    return !slot || deps.some((value, i) => !Object.is(value, slot.deps[i]));
  }
  const react = {
    useState(initial) {
      const i = cursor++;
      slots[i] ??= { value: initial };
      return [
        slots[i].value,
        (next) => {
          slots[i].value =
            typeof next === "function" ? next(slots[i].value) : next;
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      slots[i] ??= { current: initial };
      return slots[i];
    },
    useMemo(fn, deps) {
      const i = cursor++;
      if (changed(slots[i], deps)) slots[i] = { value: fn(), deps };
      return slots[i].value;
    },
    useEffect(fn, deps) {
      const i = cursor++;
      if (changed(slots[i], deps)) {
        slots[i] = { deps };
        effects.push(fn);
      }
    },
  };
  const { UpgradePlanModal } = loadWithMocks(
    fileURLToPath(
      new URL("../components/billing/UpgradePlanModal.tsx", import.meta.url),
    ),
    {
      react,
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": {
        Alert: { alert: (...args) => alerts.push(args) },
        Modal: "modal",
        ScrollView: "scroll",
        Text: "text",
        TouchableOpacity: "touch",
        View: "view",
      },
      "react-native-safe-area-context": { SafeAreaView: "safe" },
      "../../hooks/api/useBillingEntitlement": {
        useBillingEntitlement: () => ({
          data: entitlement,
          isFetching: fetching,
          isError: failed,
          refetch() {},
        }),
      },
      "../../hooks/auth/useAccess": {
        useAccess: () => ({ can: () => allowed }),
      },
      "../../hooks/useRevenueCat": {
        useRevenueCat: () => ({
          customerInfo: null,
          isLoading: loading,
          isPremium: premium,
          packages,
          purchasePackage: async () => {
            purchases++;
            return purchaseResult;
          },
          refresh() {},
        }),
      },
      "../../api/billing": {
        fetchPlanChangePreview: async (tier) => {
          calls.push(tier);
          return preview(tier);
        },
      },
      "../legal/LegalLink": { LegalLink: "legal" },
      "../ui/ModalHeader": { ModalHeader: "header" },
      "../ui/forms/FormSection": { FormSection: "section" },
      "./BillingPlanCard": { BillingPlanCard: "card" },
      "./BillingPlanFeatures": { BillingPlanFeatures: "features" },
      "./BillingPurchaseFooter": { BillingPurchaseFooter },
      "./BillingActionButton": { BillingActionButton: "action" },
      "./RevenueCatPackagePicker": { RevenueCatPackagePicker: "picker" },
      "./RevenueCatPurchaseSummaryCard": {
        RevenueCatPurchaseSummaryCard: "summary",
      },
      "./RevenueCatCustomerCenter": { RevenueCatCustomerCenter: "center" },
    },
  );
  let visible = true;
  function render() {
    let tree;
    for (let pass = 0; pass < 5; pass++) {
      cursor = 0;
      tree = UpgradePlanModal({ isVisible: visible, onClose() {} });
      if (!effects.length) return nodes(tree);
      const pending = effects;
      effects = [];
      pending.forEach((fn) => fn());
    }
    throw Error("Render did not settle");
  }
  return {
    render,
    alerts,
    calls,
    entitlement,
    packages,
    card: (tier) =>
      render().find(
        (node) => node.type === "card" && node.props.tier.key === tier,
      ),
    picker: () => render().find((node) => node.type === "picker"),
    purchase: () =>
      render().find(
        (node) =>
          node.type === "action" &&
          /^(Purchase |Checking plan|Processing purchase)/.test(
            node.props.label,
          ),
      ),
    get purchases() {
      return purchases;
    },
    setPreview: (fn) => {
      preview = fn;
    },
    setAllowed: (value) => {
      allowed = value;
    },
    setFetching: (value) => {
      fetching = value;
    },
    setFailed: (value) => {
      failed = value;
    },
    setLoading: (value) => {
      loading = value;
    },
    setVisible: (value) => {
      visible = value;
    },
    setPremium: (value) => {
      premium = value;
    },
    setPurchaseResult: (value) => {
      purchaseResult = value;
    },
  };
}

test("tier choices precede Purchase and selection shows only the chosen features and packages", async () => {
  const ui = setup();
  const initial = ui.render();
  assert.equal(
    initial.some((node) => node.type === "features"),
    false,
  );
  const prompt = initial.findIndex(
    (node) =>
      node.props.children ===
      "Select a tier to review its details and billing options.",
  );
  assert.ok(prompt > initial.findLastIndex((node) => node.type === "card"));
  assert.equal(ui.calls.length, 0);
  assert.equal(ui.purchase(), undefined);
  for (const tier of tiers) {
    await ui.card(tier.key).props.onUpgrade();
    const features = ui.render().filter((node) => node.type === "features");
    assert.deepEqual(
      features.map((node) => node.props.tier.key),
      [tier.key],
    );
    assert.equal(ui.card(tier.key).props.isSelected, true);
    assert.equal(ui.picker().props.selectedKey, `${tier.key}_monthly`);
    assert.ok(
      ui
        .picker()
        .props.options.every((option) => option.key.startsWith(tier.key)),
    );
    const scroll = ui.render().find((node) => node.type === "scroll");
    assert.equal(
      nodes(scroll).some((node) => node.type === "footer"),
      false,
    );
  }
  ui.picker().props.onSelect("portfolio_yearly");
  assert.match(ui.purchase().props.label, /\$300 \/ year/);
  await ui.card("starter").props.onUpgrade();
  assert.equal(ui.picker().props.selectedKey, "starter_monthly");
});

test("pending and failed previews retain confirmed details and block stale checkout", async () => {
  const ui = setup();
  await ui.card("starter").props.onUpgrade();
  ui.picker().props.onSelect("starter_yearly");
  let reject;
  ui.setPreview(
    () =>
      new Promise((_, fail) => {
        reject = fail;
      }),
  );
  const pending = ui.card("professional").props.onUpgrade();
  assert.equal(ui.picker().props.disabled, true);
  assert.equal(ui.purchase().props.disabled, true);
  await ui.purchase().props.onPress();
  assert.equal(ui.purchases, 0);
  reject(Error("Preview offline"));
  await pending;
  assert.equal(ui.card("starter").props.isSelected, true);
  assert.equal(ui.picker().props.selectedKey, "starter_yearly");
  assert.equal(ui.purchase().props.disabled, false);
  assert.equal(ui.alerts[0][0], "Plan preview unavailable");
});

test("blocked tiers show features, blockers and disabled checkout", async () => {
  const ui = setup();
  ui.setPreview(async () => ({
    allowed: false,
    blockers: [
      { dimension: "properties", current: 4, target_limit: 3, excess: 1 },
    ],
  }));
  await ui.card("starter").props.onUpgrade();
  assert.equal(
    ui.render().find((node) => node.type === "features").props.tier.key,
    "starter",
  );
  assert.ok(
    ui.render().some((node) => node.props.accessibilityRole === "alert"),
  );
  assert.equal(ui.picker(), undefined);
  assert.equal(ui.purchase().props.label, "Purchase unavailable");
  assert.equal(ui.purchase().props.disabled, true);
});

test("checkout rechecks server eligibility before sending a store purchase", async () => {
  const ui = setup();
  await ui.card("starter").props.onUpgrade();
  ui.setPreview(async () => ({ allowed: false, blockers: [] }));
  await ui.purchase().props.onPress();
  await new Promise(setImmediate);
  assert.deepEqual(ui.calls, ["starter", "starter"]);
  assert.equal(ui.purchases, 0);
  assert.equal(ui.purchase().props.disabled, true);
});

test("store loading and missing packages cannot expose usable checkout", async () => {
  const ui = setup();
  ui.packages.starter_monthly = null;
  ui.packages.starter_yearly = null;
  await ui.card("starter").props.onUpgrade();
  assert.deepEqual(ui.picker().props.options, []);
  assert.equal(ui.purchase().props.disabled, true);
  ui.setLoading(true);
  assert.equal(ui.picker().props.isLoading, true);
});

test("selected footer tracks period, localized price, entitlement loading and revoked permission", async () => {
  const ui = setup();
  ui.packages.starter_monthly.product.priceString = "₱499.00";
  await ui.card("starter").props.onUpgrade();
  assert.equal(ui.purchase().props.label, "Purchase ₱499.00 / month");
  assert.ok(
    ui
      .render()
      .some((node) => node.props.children === "Renews monthly until canceled."),
  );
  ui.picker().props.onSelect("starter_yearly");
  assert.equal(ui.purchase().props.label, "Purchase $100 / year");
  assert.ok(
    ui
      .render()
      .some((node) => node.props.children === "Renews yearly until canceled."),
  );
  assert.equal(
    ui
      .render()
      .some((node) => node.props.children === "Renews monthly until canceled."),
    false,
  );
  for (const setter of [ui.setFetching, ui.setFailed, ui.setLoading]) {
    setter(true);
    assert.equal(ui.purchase().props.disabled, true);
    await ui.purchase().props.onPress();
    assert.equal(ui.purchases, 0);
    setter(false);
  }
  ui.setAllowed(false);
  assert.equal(ui.purchase(), undefined);
});

test("manager permissions, current plans, and failed entitlement loads preserve selection restrictions", async () => {
  const ui = setup();
  ui.setAllowed(false);
  assert.equal(ui.card("starter").props.canUpgrade, false);
  await ui.card("starter").props.onUpgrade();
  assert.equal(ui.calls.length, 0);
  ui.setAllowed(true);
  ui.entitlement.tier = "starter";
  ui.entitlement.entitlement_source = "purchase";
  assert.equal(ui.card("starter").props.isCurrent, true);
  assert.equal(ui.card("starter").props.canUpgrade, false);
  ui.entitlement.entitlement_source = "trial";
  assert.equal(ui.card("starter").props.canUpgrade, true);
  for (const setter of [ui.setFetching, ui.setFailed]) {
    setter(true);
    assert.equal(ui.card("starter").props.disabled, true);
    await ui.card("starter").props.onUpgrade();
    assert.equal(ui.calls.length, 0);
    setter(false);
  }
});

test("closing the modal clears selection before reopening", async () => {
  const ui = setup();
  await ui.card("starter").props.onUpgrade();
  ui.setVisible(false);
  ui.render();
  ui.setVisible(true);
  assert.equal(
    ui.render().some((node) => node.type === "features"),
    false,
  );
});

test("checkout footer hides during purchase completion and subscription management", async () => {
  const ui = setup();
  await ui.card("starter").props.onUpgrade();
  ui.setPurchaseResult({ entitlements: { active: {} } });
  await ui.purchase().props.onPress();
  await new Promise(setImmediate);
  assert.equal(ui.purchases, 1);
  assert.equal(ui.purchase(), undefined);
  assert.ok(ui.render().some((node) => node.type === "summary"));
  ui.setVisible(false);
  ui.render();
  ui.setVisible(true);
  ui.setPremium(true);
  await ui.card("starter").props.onUpgrade();
  const manage = ui
    .render()
    .find((node) => node.props.label === "Open purchase support");
  manage.props.onPress();
  assert.ok(ui.render().some((node) => node.type === "center"));
  assert.equal(ui.purchase(), undefined);
});

test("strong checkout appearance preserves default actions and has readable contrast in both themes", () => {
  const { BillingActionButton } = loadWithMocks(
    fileURLToPath(
      new URL("../components/billing/BillingActionButton.tsx", import.meta.url),
    ),
    {
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": {
        Text: "text",
        TouchableOpacity: "touch",
        ActivityIndicator: "spinner",
      },
      "@expo/vector-icons": { Feather: "icon" },
    },
  );
  const props = { label: "Purchase ₱499.00 / month", onPress() {} };
  assert.equal(BillingActionButton(props).props.style, undefined);
  assert.equal(
    BillingActionButton({ ...props, primary: true }).props.style,
    undefined,
  );
  const luminance = (hex) => {
    const rgb = hex
      .slice(1)
      .match(/../g)
      .map((value) => parseInt(value, 16) / 255)
      .map((value) =>
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
      );
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const { lightColors, darkColors } = loadWithMocks(
    fileURLToPath(new URL("../constants/colors.ts", import.meta.url)),
    {},
  );
  for (const palette of [lightColors, darkColors]) {
    const values = [
      luminance(palette.primaryContent),
      luminance(palette.onInverse),
    ].sort((a, b) => b - a);
    assert.ok((values[0] + 0.05) / (values[1] + 0.05) >= 4.5);
  }
  const strong = BillingActionButton({
    ...props,
    strong: true,
    isLoading: true,
  });
  assert.equal(strong.props.disabled, true);
  assert.equal(strong.props.accessibilityState.busy, true);
  assert.ok(nodes(strong).some((node) => node.type === "spinner"));
});

test("tier cards act as single-choice radios without nested buttons", () => {
  const { BillingPlanCard } = loadWithMocks(
    fileURLToPath(
      new URL("../components/billing/BillingPlanCard.tsx", import.meta.url),
    ),
    {
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": {
        View: "view",
        Text: "text",
        TouchableOpacity: "touch",
        ActivityIndicator: "spinner",
      },
      "@expo/vector-icons": { Feather: "icon" },
    },
  );
  const props = {
    tier: tiers[0],
    priceLabel: "$10 / month",
    canUpgrade: true,
    isCurrent: false,
    isSelected: false,
    isPending: false,
    disabled: false,
    onUpgrade() {
      selected++;
    },
  };
  let selected = 0;
  const tree = nodes(BillingPlanCard(props));
  assert.deepEqual(
    tree
      .filter((node) => node.type === "text")
      .map((node) => node.props.children),
    ["Starter", "$10 / month"],
  );
  const radio = BillingPlanCard(props);
  assert.equal(radio.props.accessibilityRole, "radio");
  assert.equal(radio.props.accessibilityState.checked, false);
  radio.props.onPress();
  assert.equal(selected, 1);
  assert.equal(tree.filter((node) => node.type === "touch").length, 1);
  const checked = BillingPlanCard({ ...props, isSelected: true });
  assert.equal(checked.props.accessibilityState.checked, true);
  checked.props.onPress();
  assert.equal(selected, 1);
  for (const state of [
    { isCurrent: true },
    { isPending: true },
    { disabled: true },
    { canUpgrade: false },
  ]) {
    const card = BillingPlanCard({ ...props, ...state });
    assert.equal(card.props.disabled, true);
    assert.equal(card.props.accessibilityState.disabled, true);
    card.props.onPress();
    assert.equal(selected, 1);
  }
  assert.equal(
    BillingPlanCard({ ...props, isPending: true }).props.accessibilityState
      .busy,
    true,
  );
});
