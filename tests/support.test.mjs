import assert from "node:assert/strict";
import test from "node:test";
import Module from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import load from "./helpers/loadTs.cjs";
import postcss from "postcss";
import tailwind from "tailwindcss";
const { cssToReactNativeRuntime } = load("react-native-css-interop/css-to-rn");

function compile(path, mocks) {
  const filename = fileURLToPath(new URL(path, import.meta.url));
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
  return instance.exports;
}

const clientHelpers = compile("../api/client.ts", {
  "../services/access/accessEvents": {},
  "./config": {},
  "./axios": {},
  "./errors": {},
  "../services/billing/entitlementEvents": {},
  "../services/access/sessionAccess": {},
  "../services/access/requestPolicy": { ResourceScopeIndex: class {} },
});

for (const [name, method, path] of [
  ["FAQs", "fetchFaqs", "/faqs"],
  ["tickets", "fetchSupportTickets", "/support-tickets"],
]) {
  test(`${name} reads array, envelope, and nested paginated responses`, async () => {
    const records = [
      { id: "one", subject: "Help", question: "Question", answer: "Answer" },
    ];
    for (const response of [
      records,
      { data: records },
      { data: { data: records, current_page: 1 } },
      [],
    ]) {
      const api = compile("../api/support.ts", {
        "./client": {
          ...clientHelpers,
          authHeaders: clientHelpers.authHeaders,
          apiClient: {
            get: async (url, options) => {
              assert.equal(url, path);
              assert.equal(options.headers.Authorization, "Bearer test-token");
              return response;
            },
          },
        },
      });
      assert.deepEqual(
        await api[method]("test-token"),
        response.length === 0 ? [] : records,
      );
    }
  });

  test(`${name} keeps failed requests rejected instead of returning an empty collection`, async () => {
    for (const status of [401, 403, 500]) {
      const failure = Object.assign(new Error("Request failed"), { status });
      const api = compile("../api/support.ts", {
        "./client": {
          ...clientHelpers,
          apiClient: {
            get: async () => {
              throw failure;
            },
          },
        },
      });
      await assert.rejects(api[method](), (error) => error === failure);
    }
  });
}

const jsx = load("react/jsx-runtime");
const native = Object.fromEntries(
  [
    "ActivityIndicator",
    "Linking",
    "Text",
    "TextInput",
    "TouchableOpacity",
    "View",
    "Pressable",
  ].map((name) => [name, name]),
);
const palette = load("../../constants/colors.ts");
const { Button } = compile("../components/ui/buttons/Button.tsx", {
  "react/jsx-runtime": jsx,
  "react-native": native,
  "../../../constants/colors": palette,
});
const { SupportListFeedback } = compile(
  "../components/support/SupportListFeedback.tsx",
  {
    "react/jsx-runtime": jsx,
    "react-native": native,
    "../../constants/colors": palette,
    "../ui/buttons/Button": { Button },
  },
);

function screen({
  faqs,
  tickets,
  tab = "faqs",
  search = "",
  refetch = async () => {},
}) {
  const query = (overrides) => ({
    data: undefined,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch,
    ...overrides,
  });
  let values = [tab, search, false, null];
  let index = 0;
  const mocks = {
    "react/jsx-runtime": jsx,
    react: {
      useMemo: (factory) => factory(),
      useState: () => {
        const slot = index++;
        return [
          values[slot],
          (next) => {
            values[slot] = next;
          },
        ];
      },
    },
    "react-native": native,
    "@expo/vector-icons": { Feather: "Feather", Ionicons: "Ionicons" },
    "../../constants/colors": palette,
    "../../hooks/api/useSupport": {
      useFaqs: () => query(faqs),
      useSupportTickets: () => query(tickets),
      useCreateSupportTicket: () => ({}),
    },
    "../../hooks/api/useBillingEntitlement": {
      useBillingEntitlement: () => ({}),
    },
    "../../utils/billing/entitlementCapabilities": load(
      "../../utils/billing/entitlementCapabilities.ts",
    ),
    "../../components/support/SupportListFeedback": { SupportListFeedback },
  };
  for (const [path, name] of [
    ["ui/PullToRefreshFlatList", "PullToRefreshFlatList"],
    ["support/FaqAccordion", "FaqAccordion"],
    ["support/SupportTicketModal", "SupportTicketModal"],
    ["navigation/SecondaryBackButton", "SecondaryBackButton"],
    ["ui/ModuleHeader", "ModuleHeader"],
    ["ui/Screen", "Screen"],
    ["ui/Snackbar", "ScreenSnackbar"],
  ])
    mocks[`../../components/${path}`] = { [name]: name };
  const { default: SupportScreen } = compile(
    "../app/(secondary)/support.tsx",
    mocks,
  );
  return () => {
    index = 0;
    return SupportScreen();
  };
}

function nodes(element) {
  if (element == null || typeof element === "boolean") return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  if (typeof element !== "object") return [element];
  if (typeof element.type === "function")
    return nodes(element.type(element.props));
  if (element.type === "PullToRefreshFlatList") {
    const content = element.props.data.length
      ? element.props.data.map((item) => element.props.renderItem({ item }))
      : element.props.ListEmptyComponent;
    return [element, ...nodes(content)];
  }
  return [element, ...nodes(element.props?.children)];
}
const text = (tree) =>
  nodes(tree)
    .filter((node) => typeof node === "string" || typeof node === "number")
    .join(" ");

function ticketModal(onSubmit) {
  let index = 0;
  const states = [];
  const refs = [];
  let refIndex = 0;
  let closes = 0;
  const { SupportTicketModal } = compile(
    "../components/support/SupportTicketModal.tsx",
    {
      "react/jsx-runtime": jsx,
      react: {
        useState: (initial) => {
          const slot = index++;
          if (!(slot in states)) states[slot] = initial;
          return [
            states[slot],
            (value) => {
              states[slot] =
                typeof value === "function" ? value(states[slot]) : value;
            },
          ];
        },
        useRef: (initial) =>
          refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
      },
      "react-native": native,
      "../ui/AddEditModal": { AddEditModal: "AddEditModal" },
      "../ui/fields/BaseField": { BaseField: "BaseField" },
    "../ui/fields/DropdownField": { DropdownField: "DropdownField" },
    "../ui/forms/FormSection": { FormSection: "FormSection" },
      "../../utils/support/ticketForm": load(
        "../../utils/support/ticketForm.ts",
      ),
    },
  );
  const render = () => {
    index = 0;
    refIndex = 0;
    return SupportTicketModal({
      isVisible: true,
      isPending: false,
      onSubmit,
      onClose: () => closes++,
    });
  };
  const fill = () => {
    for (const [label, value] of [
      ["Subject", "  Billing issue  "],
      ["Description & details", "  Restore failed  "],
    ]) {
      nodes(render())
        .find((node) => node.type === "BaseField" && node.props.label === label)
        .props.onChangeText(value);
    }
    nodes(render())
      .find((node) => node.type === "DropdownField")
      .props.onSelect("Billing");
  };
  return { render, fill, closes: () => closes };
}

test("ticket validates blank and oversized fields before transport", async () => {
  const modal = ticketModal(() => {
    throw new Error("Unexpected request");
  });
  await modal.render().props.onSubmit();
  assert.match(text(modal.render()), /Enter a subject.*Describe your issue/);
  const { validateTicket } = load("../../utils/support/ticketForm.ts");
  assert.ok(
    validateTicket({
      subject: "x".repeat(256),
      description: "Issue",
      priority: "Medium",
      category: "Technical",
    }).subject,
  );
});

test("ticket submits trimmed selected category once, disables fields, then resets on success", async () => {
  let release;
  const sent = [];
  const modal = ticketModal((payload) => {
    sent.push(payload);
    return new Promise((resolve) => {
      release = resolve;
    });
  });
  modal.fill();
  const submit = modal.render().props.onSubmit;
  const pending = submit();
  await submit();
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0], {
    subject: "Billing issue",
    description: "Restore failed",
    priority: "Medium",
    category: "Billing",
  });
  assert.equal(modal.render().props.isPending, true);
  for (const node of nodes(modal.render()).filter(
    (node) => node.type === "BaseField",
  ))
    assert.equal(node.props.editable, false);
  release();
  await pending;
  assert.equal(modal.closes(), 1);
  assert.equal(
    nodes(modal.render()).find((node) => node.type === "BaseField").props.value,
    "",
  );
  assert.equal(
    nodes(modal.render()).find((node) => node.type === "DropdownField").props
      .value,
    "Technical",
  );
});

test("ticket maps validation errors, preserves draft, and supports retry", async () => {
  const { ApiError } = load("../../api/errors.ts");
  let fail = true;
  const modal = ticketModal(async () => {
    if (fail)
      throw new ApiError("Validation failed", 422, undefined, {
        subject: ["Subject rejected"],
      });
  });
  modal.fill();
  await modal.render().props.onSubmit();
  assert.match(text(modal.render()), /Subject rejected/);
  assert.equal(
    nodes(modal.render()).find((node) => node.type === "BaseField").props.value,
    "  Billing issue  ",
  );
  assert.equal(modal.closes(), 0);
  fail = false;
  await modal.render().props.onSubmit();
  assert.equal(modal.closes(), 1);
});

test("ticket network failure appears in general banner and retains draft", async () => {
  const modal = ticketModal(async () => {
    throw new Error("Network unavailable");
  });
  modal.fill();
  await modal.render().props.onSubmit();
  assert.equal(modal.render().props.formError, "Network unavailable");
  assert.equal(
    nodes(modal.render()).find((node) => node.type === "DropdownField").props
      .value,
    "Billing",
  );
});

for (const tab of ["faqs", "tickets"]) {
  test(`${tab}: pending and failed reads never show empty results or zero counts`, () => {
    for (const state of [{ isPending: true }, { isError: true }]) {
      const tree = screen({ tab, [tab]: state })();
      assert.doesNotMatch(
        text(tree),
        /No support tickets yet|No FAQs available|\(0\)/,
      );
      assert.match(text(tree), state.isPending ? /Loading/ : /Could not load/);
      assert.equal(
        nodes(tree).some((node) => node.type === "PullToRefreshFlatList"),
        false,
      );
    }
  });

  test(`${tab}: cached data survives failed refresh and Retry runs its query`, () => {
    let retries = 0;
    const record = {
      id: "one",
      subject: "Payment help",
      description: "Details",
      question: "Question",
      answer: "Answer",
      status: "Open",
    };
    const tree = screen({
      tab,
      [tab]: { data: [record], isError: true },
      refetch: async () => {
        retries++;
      },
    })();
    assert.match(text(tree), /Showing the last loaded results/);
    const list = nodes(tree).find(
      (node) => node.type === "PullToRefreshFlatList",
    );
    assert.deepEqual(list.props.data, [record]);
    assert.equal(list.props.ListEmptyComponent, null);
    nodes(tree)
      .find((node) => node.type === "Pressable")
      .props.onPress();
    assert.equal(retries, 1);
  });

  test(`${tab}: successful empty collection has count zero and correct message`, () => {
    const tree = screen({ tab, [tab]: { data: [] } })();
    assert.match(text(tree), /\(0\)/);
    assert.match(
      text(tree),
      tab === "tickets" ? /No support tickets yet/ : /No FAQs available/,
    );
  });
}

test("search with no FAQ match differs from an empty knowledge base", () => {
  const tree = screen({
    faqs: { data: [{ id: 1, question: "Billing", answer: "Help" }] },
    search: "unmatched",
  })();
  assert.match(text(tree), /No matching FAQs/);
  assert.doesNotMatch(text(tree), /No FAQs available/);
  const empty = screen({ faqs: { data: [] }, search: "unmatched" })();
  assert.match(text(empty), /No FAQs available/);
  assert.doesNotMatch(text(empty), /No matching FAQs/);
});

test("switching tabs initializes shadow variables before selection and separates content identity", async () => {
  const render = screen({ faqs: { data: [] }, tickets: { data: [] } });
  const initial = render();
  const tabs = nodes(initial).filter(
    (node) => node.props?.accessibilityRole === "tab",
  );
  const css = await postcss([
    tailwind({
      presets: [load("nativewind/preset")],
      content: [
        {
          raw: tabs.map((node) => node.props.className).join(" "),
          extension: "tsx",
        },
      ],
    }),
  ]).process("@tailwind utilities;", { from: undefined });
  const compiled = cssToReactNativeRuntime(css.css);
  for (const tab of tabs) {
    assert.ok(
      tab.props.className
        .split(/\s+/)
        .some((name) => compiled.rules[name]?.variables),
    );
  }
  const initialContent = nodes(initial).find((node) => node.key === "faqs");
  assert.ok(initialContent);
  tabs[1].props.onPress();
  const selected = render();
  assert.ok(nodes(selected).find((node) => node.key === "tickets"));
  assert.equal(
    nodes(selected).some((node) => node.key === "faqs"),
    false,
  );
  assert.match(text(selected), /No support tickets yet/);
});
