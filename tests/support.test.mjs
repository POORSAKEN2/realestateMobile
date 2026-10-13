import assert from "node:assert/strict";
import test from "node:test";
import Module from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import load from "./helpers/loadTs.cjs";
import postcss from "postcss";
import tailwind from "tailwindcss";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
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
    "ScrollView",
  ].map((name) => [name, name]),
);
const palette = load("../../constants/colors.ts");
const icons = {
  Feather: "Feather",
  Ionicons: "Ionicons",
  MaterialCommunityIcons: "MaterialCommunityIcons",
};
const sharedMocks = {
  "react/jsx-runtime": jsx,
  "react-native": native,
  "@expo/vector-icons": icons,
};
const skeleton = compile("../components/ui/Skeleton.tsx", {
  ...sharedMocks,
  react: load("react"),
});
const moduleState = compile("../components/ui/ModuleState.tsx", {
  ...sharedMocks,
  "../../constants/colors": palette,
  "./Skeleton": skeleton,
});
const { SearchField } = compile("../components/ui/fields/SearchField.tsx", {
  ...sharedMocks,
  "../../../constants/colors": palette,
});
const { SearchToolbar } = compile("../components/ui/SearchToolbar.tsx", {
  ...sharedMocks,
  "../../constants/colors": palette,
  "./fields/SearchField": { SearchField },
});
const choiceChips = compile("../components/ui/chips/ChoiceChips.tsx", {
  ...sharedMocks,
  react: load("react"),
});
const { default: AddButton } = compile(
  "../components/ui/buttons/AddButton.tsx",
  {
    ...sharedMocks,
    react: load("react"),
    "../../../hooks/auth/useAccess": {
      useAccess: () => ({ can: () => false }),
    },
  },
);
const { FormActionRow } = compile(
  "../components/ui/forms/FormActionRow.tsx",
  { ...sharedMocks, "../../../constants/colors": palette },
);
const { ModalActionFooter } = compile(
  "../components/ui/ModalActionFooter.tsx",
  {
    "react/jsx-runtime": jsx,
    "react-native-safe-area-context": { SafeAreaView: "SafeAreaView" },
  },
);
const { SearchFilterActions, SearchFilterSheet } = compile(
  "../components/ui/SearchFilterSheet.tsx",
  {
    ...sharedMocks,
    "react-native-safe-area-context": { SafeAreaView: "SafeAreaView" },
    "./BottomSheetModal": { BottomSheetModal: "BottomSheetModal" },
    "./forms/FormActionRow": { FormActionRow },
    "./groups/RadioOptionList": { RadioOptionList: "RadioOptionList" },
    "./ModalActionFooter": { ModalActionFooter },
    "./ModalHeader": { ModalHeader: "ModalHeader" },
  },
);
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
    "../ui/ModuleState": moduleState,
  },
);

function screen({
  faqs,
  tickets,
  tab = "faqs",
  search = "",
  filters,
  createTicket = async () => {},
  refetch = async () => {},
  openURL = async () => {},
}) {
  const query = (overrides) => ({
    data: undefined,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch,
    ...overrides,
  });
  let values = [
    tab,
    search,
    false,
    null,
    null,
    filters ?? ticketList.DEFAULT_TICKET_FILTERS,
    false,
  ];
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
            values[slot] =
              typeof next === "function" ? next(values[slot]) : next;
          },
        ];
      },
    },
    "react-native": { ...native, Linking: { openURL } },
    "@expo/vector-icons": icons,
    "../../constants/colors": palette,
    "../../hooks/api/useSupport": {
      useFaqs: () => query(faqs),
      useSupportTickets: () => query(tickets),
      useCreateSupportTicket: () => ({ mutateAsync: createTicket }),
    },
    "../../hooks/api/useBillingEntitlement": {
      useBillingEntitlement: () => ({}),
    },
    "../../utils/billing/entitlementCapabilities": load(
      "../../utils/billing/entitlementCapabilities.ts",
    ),
    "../../components/support/SupportListFeedback": { SupportListFeedback },
    "../../components/ui/ModuleState": moduleState,
    "../../components/ui/SearchToolbar": { SearchToolbar },
    "../../components/ui/buttons/AddButton": {
      __esModule: true,
      default: AddButton,
    },
    "../../components/ui/buttons/Button": { Button },
    "../../components/ui/chips/ChoiceChips": choiceChips,
    "../../utils/support/ticketDetails": ticketDetailsHelpers,
    "../../utils/support/ticketList": ticketList,
  };
  for (const [path, name] of [
    ["ui/PullToRefreshFlatList", "PullToRefreshFlatList"],
    ["support/FaqAccordion", "FaqAccordion"],
    ["support/SupportTicketModal", "SupportTicketModal"],
    ["support/SupportTicketDetailsModal", "SupportTicketDetailsModal"],
    ["support/SupportTicketFilterSheet", "SupportTicketFilterSheet"],
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

test("Help Center uses shared search and add controls while contact actions retain destinations", async () => {
  const opened = [];
  const render = screen({
    faqs: {
      data: [
        { id: "billing", question: "Billing", answer: "Rent help" },
        { id: "access", question: "Access", answer: "Login help" },
      ],
    },
    openURL: async (url) => {
      opened.push(url);
    },
  });
  const getSearch = () =>
    nodes(render()).find((node) => node.type === "TextInput");
  assert.equal(getSearch().props.accessibilityLabel, "Search FAQs");
  assert.equal(getSearch().props.placeholder, "Search help topics...");
  assert.equal(getSearch().props.textAlignVertical, "center");
  assert.equal(
    nodes(render()).some(
      (node) => node.props?.accessibilityLabel === "Open filters",
    ),
    false,
  );
  getSearch().props.onChangeText("billing");
  assert.deepEqual(
    nodes(render())
      .find((node) => node.type === "PullToRefreshFlatList")
      .props.data.map((faq) => faq.id),
    ["billing"],
  );
  nodes(render())
    .find((node) => node.props?.accessibilityLabel === "Clear FAQ search")
    .props.onPress();
  assert.equal(getSearch().props.value, "");
  assert.equal(
    nodes(render()).find((node) => node.type === "PullToRefreshFlatList").props
      .data.length,
    2,
  );

  const add = nodes(
    nodes(render()).find((node) => node.type === "ModuleHeader").props.action,
  ).find((node) => node.type === "TouchableOpacity");
  assert.equal(add.props.accessibilityLabel, "Create support ticket");
  add.props.onPress();
  assert.equal(
    nodes(render()).find((node) => node.type === "SupportTicketModal").props
      .isVisible,
    true,
  );
  for (const [title, icon] of [
    ["Email Support", "mail"],
    ["Hotline", "phone"],
  ]) {
    const button = nodes(render()).find(
      (node) =>
        node.type === "Pressable" && node.props.accessibilityLabel === title,
    );
    assert.match(button.props.className, /bg-panel/);
    assert.equal(
      nodes(button).find((node) => node.type === "Feather").props.name,
      icon,
    );
    await button.props.onPress();
  }
  assert.deepEqual(opened, ["mailto:support@terrane.app", "tel:+639171234567"]);
});

test("shared Button leading icons preserve loading and disabled behavior", () => {
  for (const leadingIcon of [undefined, jsx.jsx("Feather", { name: "mail" })]) {
    for (const isLoading of [false, true]) {
      const button = Button({
        title: "Retry",
        variant: "secondary",
        onPress: () => {},
        leadingIcon,
        isLoading,
      });
      assert.equal(button.props.disabled, isLoading);
      assert.equal(button.props.accessibilityState.busy, isLoading);
      assert.equal(button.props.accessibilityLabel, "Retry");
      assert.match(button.props.className, leadingIcon ? /min-h-12/ : /h-12/);
      if (leadingIcon && !isLoading) {
        assert.match(
          nodes(button).find((node) => node.type === "Text").props.className,
          /min-w-0 shrink/,
        );
      }
      assert.equal(
        nodes(button).some((node) => node.type === "Feather"),
        Boolean(leadingIcon) && !isLoading,
      );
      assert.equal(
        nodes(button).some((node) => node.type === "ActivityIndicator"),
        isLoading,
      );
    }
  }
  assert.equal(
    Button({ title: "Retry", onPress: () => {}, disabled: true }).props
      .disabled,
    true,
  );
  const empty = moduleState.ModuleEmptyState({
    title: "Empty",
    description: "No items",
    icon: "help-circle-outline",
  });
  assert.equal(
    nodes(empty).some((node) => node.type === "Pressable"),
    false,
  );
});

test("ticket card opens selected details and dismissal retains list state", () => {
  const ticket = {
    id: "one",
    subject: "Billing issue",
    description: "Details",
    status: "Open",
  };
  const render = screen({ tab: "tickets", tickets: { data: [ticket] } });
  const card = nodes(render()).find((node) =>
    node.props?.accessibilityLabel?.startsWith(
      "View ticket details: Billing issue",
    ),
  );
  card.props.onPress();
  const details = nodes(render()).find(
    (node) => node.type === "SupportTicketDetailsModal",
  );
  assert.equal(details.props.ticket, ticket);
  details.props.onClose();
  assert.equal(
    nodes(render()).find((node) => node.type === "SupportTicketDetailsModal")
      .props.ticket,
    null,
  );
  assert.equal(
    nodes(render()).find((node) => node.type === "PullToRefreshFlatList").props
      .data[0],
    ticket,
  );
});

test("ticket cards hide descriptions and show only urgent priority before status", () => {
  for (const priority of [
    "Low",
    "Medium",
    "High",
    "Urgent",
    "Escalated",
    undefined,
  ]) {
    for (const status of ["Open", "In Progress", "Resolved", "Closed"]) {
      const ticket = {
        id: "one",
        subject: "Ticket",
        priority,
        status,
        description: "Full description belongs in the sheet",
      };
      const render = screen({ tab: "tickets", tickets: { data: [ticket] } });
      const tree = render();
      assert.ok(!text(tree).includes(ticket.description));
      const card = nodes(tree).find((node) =>
        node.props?.accessibilityLabel?.startsWith("View ticket details:"),
      );
      const labels = nodes(card)
        .filter((node) => node.type === "Text")
        .map((node) => node.props.children);
      if (priority === "Urgent") {
        assert.equal(labels.indexOf("Urgent") + 1, labels.indexOf(status));
        assert.match(card.props.accessibilityLabel, /Urgent priority/);
      } else {
        assert.equal(labels.includes(priority || "Not provided"), false);
        assert.equal(labels.includes("Urgent"), false);
        assert.equal(card.props.accessibilityLabel.includes("priority"), false);
      }
      card.props.onPress();
      const selected = nodes(render()).find(
        (node) => node.type === "SupportTicketDetailsModal",
      ).props.ticket;
      assert.equal(selected.description, ticket.description);
    }
  }
});

const ticketList = load("../../utils/support/ticketList.ts");
const sortChoice = (
  field = "creation",
  direction = ticketList.DEFAULT_TICKET_FILTERS.sort.directions[field],
) => ({
  field,
  directions: {
    ...ticketList.DEFAULT_TICKET_FILTERS.sort.directions,
    [field]: direction,
  },
});
const listRecords = [
  {
    id: "new",
    subject: "New",
    priority: "Low",
    status: "Closed",
    created_at: "2026-10-08T10:00:00Z",
  },
  {
    id: "urgent",
    subject: "Urgent ticket",
    priority: "Urgent",
    status: "Open",
    created_at: "2026-10-07T10:00:00Z",
  },
  {
    id: "high",
    subject: "High ticket",
    priority: "High",
    status: "In Progress",
    created_at: "2026-10-06T10:00:00Z",
  },
  {
    id: "medium",
    subject: "Medium ticket",
    priority: "Medium",
    status: "Resolved",
    created_at: "2026-10-05T10:00:00Z",
  },
  {
    id: "unknown",
    subject: "Unknown",
    priority: "Escalated",
    status: "Deferred",
    created_at: "invalid",
  },
  { id: "missing", subject: "Missing" },
];

test("ticket filters combine exactly and sort without mutating cached rows", () => {
  const original = structuredClone(listRecords);
  const ids = (filters) =>
    ticketList
      .filterAndSortTickets(listRecords, {
        ...ticketList.DEFAULT_TICKET_FILTERS,
        ...filters,
      })
      .map((ticket) => ticket.id);
  assert.deepEqual(ids({ sort: sortChoice() }), [
    "new",
    "urgent",
    "high",
    "medium",
    "missing",
    "unknown",
  ]);
  assert.deepEqual(ids({ sort: sortChoice("creation", "asc") }), [
    "medium",
    "high",
    "urgent",
    "new",
    "missing",
    "unknown",
  ]);
  assert.deepEqual(ids({ sort: sortChoice("priority", "desc") }), [
    "urgent",
    "high",
    "medium",
    "new",
    "missing",
    "unknown",
  ]);
  assert.deepEqual(ids({ sort: sortChoice("status", "asc") }), [
    "urgent",
    "high",
    "medium",
    "new",
    "missing",
    "unknown",
  ]);
  for (const sort of [
    sortChoice("priority", "asc"),
    sortChoice("status", "desc"),
  ]) {
    assert.deepEqual(ids({ sort }), [
      "new",
      "medium",
      "high",
      "urgent",
      "missing",
      "unknown",
    ]);
    assert.deepEqual(
      ids({
        sort,
        statuses: ["Open", "In Progress"],
        priorities: ["Urgent", "High"],
      }),
      ["high", "urgent"],
    );
  }
  assert.deepEqual(ids({ statuses: ["Open"], priorities: ["Urgent"] }), [
    "urgent",
  ]);
  assert.deepEqual(ids({ statuses: ["Closed"], priorities: ["Urgent"] }), []);
  assert.deepEqual(ids({ statuses: ["Deferred"], priorities: ["Escalated"] }), [
    "unknown",
  ]);
  assert.deepEqual(ids({ statuses: [""], priorities: [""] }), ["missing"]);
  assert.deepEqual(
    ids({ statuses: ["Open", "In Progress"], priorities: ["Urgent", "High"] }),
    ["urgent", "high"],
  );
  assert.deepEqual(
    ids({ statuses: ["Open", "Closed"], priorities: ["Urgent", "High"] }),
    ["urgent"],
  );
  assert.deepEqual(listRecords, original);
  assert.deepEqual(ids({ sort: sortChoice() }), ids({ sort: sortChoice() }));
  const options = ticketList.ticketFilterOptions(listRecords);
  assert.deepEqual(
    options.statuses.map((option) => option.value),
    ["ALL", "Open", "In Progress", "Resolved", "Closed", "Deferred", ""],
  );
  assert.deepEqual(
    options.priorities.map((option) => option.value),
    ["ALL", "Urgent", "High", "Medium", "Low", "Escalated", ""],
  );
});

test("sort ties retain submitted-date and ID ordering, invalid and unfamiliar values stay last", () => {
  const records = [
    { id: "tie-b", created_at: "2026-10-07T10:00:00Z" },
    { id: "tie-a", created_at: "2026-10-07T10:00:00Z" },
    { id: "latest-submission", created_at: "2026-10-08T10:00:00Z" },
    { id: "invalid-submission", created_at: "invalid" },
    { id: "no-dates" },
  ].map((ticket) => ({
    ...ticket,
    subject: ticket.id,
    status: "Open",
    priority: "High",
  }));
  records.push(
    {
      id: "unfamiliar",
      status: "Deferred",
      priority: "Escalated",
      created_at: "2026-10-09T10:00:00Z",
    },
    { id: "missing", created_at: "2026-10-10T10:00:00Z" },
  );
  const original = structuredClone(records);
  for (const field of ["creation", "priority", "status"]) {
    for (const direction of ["asc", "desc"]) {
      const result = ticketList.filterAndSortTickets(records, {
        ...ticketList.DEFAULT_TICKET_FILTERS,
        sort: sortChoice(field, direction),
      });
      const expected =
        field === "creation"
          ? direction === "asc"
            ? [
                "tie-a",
                "tie-b",
                "latest-submission",
                "unfamiliar",
                "missing",
                "invalid-submission",
                "no-dates",
              ]
            : [
                "missing",
                "unfamiliar",
                "latest-submission",
                "tie-a",
                "tie-b",
                "invalid-submission",
                "no-dates",
              ]
          : [
              "latest-submission",
              "tie-a",
              "tie-b",
              "invalid-submission",
              "no-dates",
              "missing",
              "unfamiliar",
            ];
      assert.deepEqual(
        result.map((ticket) => ticket.id),
        expected,
      );
      for (const ticket of result)
        assert.equal(
          ticket,
          records.find((row) => row.id === ticket.id),
        );
      assert.deepEqual(records, original);
    }
  }
});

test("selecting sort fields preserves direction memory, toggles only the active field and leaves defaults unchanged", () => {
  const initial = structuredClone(ticketList.DEFAULT_TICKET_FILTERS.sort);
  let sort = ticketList.selectTicketSort(initial, "creation");
  assert.deepEqual(sort.directions, {
    creation: "asc",
    priority: "desc",
    status: "asc",
  });
  sort = ticketList.selectTicketSort(sort, "priority");
  assert.equal(sort.directions.priority, "desc");
  sort = ticketList.selectTicketSort(sort, "priority");
  assert.equal(sort.directions.priority, "asc");
  sort = ticketList.selectTicketSort(sort, "status");
  sort = ticketList.selectTicketSort(sort, "status");
  assert.equal(sort.directions.status, "desc");
  sort = ticketList.selectTicketSort(sort, "creation");
  assert.deepEqual(sort.directions, {
    creation: "asc",
    priority: "asc",
    status: "desc",
  });
  assert.deepEqual(initial, ticketList.DEFAULT_TICKET_FILTERS.sort);
  for (const [field, asc, desc] of [
    ["creation", "Creation: oldest first", "Creation: newest first"],
    ["priority", "Priority: lowest first", "Priority: highest first"],
    ["status", "Status: open first", "Status: closed first"],
  ]) {
    assert.equal(ticketList.ticketSortSummary(sortChoice(field, "asc")), asc);
    assert.equal(ticketList.ticketSortSummary(sortChoice(field, "desc")), desc);
  }
});

test("ticket sort/filter controls apply, cancel, clear and survive detail dismissal and tab switches", () => {
  const render = screen({ tab: "tickets", tickets: { data: listRecords } });
  const getSheet = () =>
    nodes(render()).find(
      (node) => node.type === "SupportTicketFilterSheet" && node.props.visible,
    );
  const open = () =>
    nodes(render())
      .find((node) =>
        node.props?.accessibilityLabel?.startsWith("Sort and filter tickets."),
      )
      .props.onPress();
  const data = () =>
    nodes(render()).find((node) => node.type === "PullToRefreshFlatList").props
      .data;
  open();
  getSheet().props.onClose();
  assert.equal(getSheet(), undefined);
  assert.equal(data().length, listRecords.length);
  open();
  const filters = {
    statuses: ["Open"],
    priorities: ["Urgent"],
    sort: sortChoice("priority"),
  };
  getSheet().props.onApply(filters);
  assert.equal(getSheet(), undefined);
  assert.deepEqual(
    data().map((ticket) => ticket.id),
    ["urgent"],
  );
  assert.match(text(render()), /Showing\s+1\s+of\s+6\s+tickets/);
  nodes(render())
    .find((node) =>
      node.props?.accessibilityLabel?.startsWith("View ticket details:"),
    )
    .props.onPress();
  nodes(render())
    .find((node) => node.type === "SupportTicketDetailsModal")
    .props.onClose();
  open();
  assert.deepEqual(getSheet().props.filters, filters);
  getSheet().props.onClose();
  nodes(render())
    .find(
      (node) =>
        node.props?.accessibilityRole === "tab" &&
        text(node).includes("Knowledge Base"),
    )
    .props.onPress();
  nodes(render())
    .find(
      (node) =>
        node.props?.accessibilityRole === "tab" &&
        text(node).includes("My Tickets"),
    )
    .props.onPress();
  assert.deepEqual(
    data().map((ticket) => ticket.id),
    ["urgent"],
  );
  open();
  getSheet().props.onApply({ ...filters, statuses: ["Closed"] });
  assert.deepEqual(data(), []);
  const empty = nodes(render()).find(
    (node) => node.type === "PullToRefreshFlatList",
  ).props.ListEmptyComponent;
  assert.match(text(empty), /No matching tickets/);
  nodes(empty)
    .find((node) => node.props?.accessibilityLabel === "Clear ticket filters")
    .props.onPress();
  assert.equal(data().length, listRecords.length);
});

test("ticket summaries follow option order including unfamiliar and missing values", () => {
  const options = ticketList.ticketFilterOptions(listRecords);
  assert.equal(
    ticketList.ticketListSummary(ticketList.DEFAULT_TICKET_FILTERS, options),
    "Creation: newest first · All statuses · All priorities",
  );
  const filters = {
    statuses: ["", "Deferred", "Closed", "Open"],
    priorities: ["Escalated", "High", "Urgent", ""],
    sort: sortChoice("status"),
  };
  assert.equal(
    ticketList.ticketListSummary(filters, options),
    "Status: open first · Open, Closed, Deferred, Not provided · Urgent, High, Escalated, Not provided",
  );
  assert.equal(
    ticketList.ticketListSummary(filters, options),
    ticketList.ticketListSummary(
      {
        ...filters,
        statuses: [...filters.statuses].reverse(),
        priorities: [...filters.priorities].reverse(),
      },
      options,
    ),
  );
});

test("shared pill selection indicators are opt-in and retain single-select defaults", () => {
  const { default: ChoiceChips } = choiceChips;
  let selected;
  const props = {
    options: [
      { label: "Open", value: "Open" },
      { label: "Closed", value: "Closed" },
    ],
    value: "Open",
    onSelect: (value) => {
      selected = value;
    },
  };
  const plain = ChoiceChips(props);
  assert.ok(!text(plain).includes("✓"));
  const pills = nodes(plain).filter(
    (node) => node.props?.accessibilityRole === "radio",
  );
  assert.equal(pills[0].props.children.type, "Text");
  pills[1].props.onPress();
  assert.equal(selected, "Closed");
  const decorated = ChoiceChips({ ...props, showSelectionIndicator: true });
  const indicators = nodes(decorated).filter(
    (node) => node.type === "Text" && node.props.children === "✓",
  );
  assert.equal(indicators.length, 1);
  assert.equal(indicators[0].props.accessible, false);
  const withIcon = ChoiceChips({
    ...props,
    options: [
      {
        label: "Creation",
        value: "Open",
        trailingIcon: jsx.jsx("Feather", { name: "arrow-down" }),
        accessibilityLabel: "Creation: newest first, descending",
        accessibilityHint: "Tap again to reverse.",
      },
    ],
  });
  const iconPill = nodes(withIcon).find(
    (node) => node.props?.accessibilityRole === "radio",
  );
  assert.equal(
    iconPill.props.accessibilityLabel,
    "Creation: newest first, descending",
  );
  assert.equal(iconPill.props.accessibilityHint, "Tap again to reverse.");
  assert.ok(!text(iconPill).includes("✓"));
  assert.equal(
    nodes(iconPill).find((node) => node.type === "Feather").props.name,
    "arrow-down",
  );
  assert.ok(
    nodes(iconPill).some(
      (node) =>
        node.type === "View" &&
        node.props.importantForAccessibility === "no-hide-descendants",
    ),
  );
});

test("large filter button shows ordered supporting text without inline pills or sort icons", () => {
  const render = screen({
    tab: "tickets",
    tickets: { data: listRecords },
    filters: { statuses: [], priorities: [], sort: sortChoice() },
  });
  const trigger = () =>
    nodes(render()).find((node) =>
      node.props?.accessibilityLabel?.startsWith("Sort and filter tickets."),
    );
  const sheet = () =>
    nodes(render()).find((node) => node.type === "SupportTicketFilterSheet");
  assert.match(text(trigger()), /Sort & filter/);
  assert.match(
    text(trigger()),
    /Creation: newest first · All statuses · All priorities/,
  );
  assert.deepEqual(
    nodes(trigger())
      .filter((node) => node.type === "Feather")
      .map((node) => node.props.name),
    ["sliders", "chevron-down"],
  );
  assert.ok(
    !nodes(render()).some(
      (node) =>
        node.props?.accessibilityRole === "checkbox" ||
        node.type === "ScrollView",
    ),
  );
  trigger().props.onPress();
  sheet().props.onApply({
    statuses: ["In Progress", "Open"],
    priorities: ["High", "Urgent"],
    sort: sortChoice("creation", "asc"),
  });
  assert.match(
    text(trigger()),
    /Creation: oldest first · Open, In Progress · Urgent, High/,
  );
  assert.deepEqual(
    nodes(render())
      .find((node) => node.type === "PullToRefreshFlatList")
      .props.data.map((ticket) => ticket.id),
    ["high", "urgent"],
  );
  const summary = nodes(trigger()).find(
    (node) =>
      node.type === "Text" && text(node).includes("Creation: oldest first"),
  );
  assert.equal(summary.props.numberOfLines, undefined);
  assert.match(trigger().props.className, /min-h-11/);
});

test("directional sorting applies to rows and summary and survives reopening and cancellation", () => {
  const records = [
    { ...listRecords[0], updated_at: "2026-10-08T10:00:00Z" },
    { ...listRecords[1], updated_at: "2026-10-09T10:00:00Z" },
  ];
  const original = structuredClone(records);
  const render = screen({ tab: "tickets", tickets: { data: records } });
  const trigger = () =>
    nodes(render()).find((node) =>
      node.props?.accessibilityLabel?.startsWith("Sort and filter tickets."),
    );
  const sheet = () =>
    nodes(render()).find((node) => node.type === "SupportTicketFilterSheet");
  trigger().props.onPress();
  const filters = {
    statuses: [],
    priorities: [],
    sort: sortChoice("creation", "asc"),
  };
  sheet().props.onApply(filters);
  assert.equal(sheet().props.visible, false);
  assert.match(
    text(trigger()),
    /Creation: oldest first · All statuses · All priorities/,
  );
  assert.match(
    trigger().props.accessibilityLabel,
    /Creation: oldest first · All statuses · All priorities/,
  );
  assert.deepEqual(
    nodes(render())
      .find((node) => node.type === "PullToRefreshFlatList")
      .props.data.map((ticket) => ticket.id),
    ["urgent", "new"],
  );
  trigger().props.onPress();
  assert.deepEqual(sheet().props.filters, filters);
  sheet().props.onClose();
  trigger().props.onPress();
  assert.deepEqual(sheet().props.filters, filters);
  assert.deepEqual(records, original);
});

test("successful ticket submission clears list filters so the new ticket is not hidden", async () => {
  let submitted;
  const render = screen({
    tab: "tickets",
    tickets: { data: listRecords },
    filters: {
      statuses: ["Closed"],
      priorities: ["Low"],
      sort: sortChoice("creation", "asc"),
    },
    createTicket: async (payload) => {
      submitted = payload;
    },
  });
  const payload = {
    subject: "New ticket",
    description: "Details",
    category: "Billing",
    priority: "Urgent",
  };
  await nodes(render())
    .find((node) => node.type === "SupportTicketModal")
    .props.onSubmit(payload);
  assert.equal(submitted, payload);
  assert.deepEqual(
    nodes(render()).find((node) => node.type === "SupportTicketFilterSheet")
      .props.filters,
    ticketList.DEFAULT_TICKET_FILTERS,
  );
  assert.equal(
    nodes(render()).find((node) => node.type === "ScreenSnackbar").props
      .message,
    "Support ticket submitted.",
  );
});

test("shared radio choices announce selection and use readable theme tokens", () => {
  const { RadioOptionList } = compile(
    "../components/ui/groups/RadioOptionList.tsx",
    {
      "react/jsx-runtime": jsx,
      "react-native": native,
      "@expo/vector-icons": {
        MaterialCommunityIcons: "MaterialCommunityIcons",
      },
      "../../../constants/colors": palette,
    },
  );
  let selected;
  const tree = RadioOptionList({
    options: [
      { value: "Open", label: "Open" },
      { value: "Closed", label: "Closed" },
    ],
    value: "Open",
    onSelect: (value) => {
      selected = value;
    },
  });
  const radios = nodes(tree).filter(
    (node) => node.props?.accessibilityRole === "radio",
  );
  assert.deepEqual(
    radios.map((node) => node.props.accessibilityState.checked),
    [true, false],
  );
  radios[1].props.onPress();
  assert.equal(selected, "Closed");
  assert.match(
    nodes(radios[0]).find((node) => node.type === "Text").props.className,
    /text-primaryContent/,
  );
  assert.equal(
    nodes(tree).find((node) => node.type === "MaterialCommunityIcons").props
      .color,
    palette.colors.primaryContent,
  );
});

test("filter sheets with actions avoid the iOS edge offset and retain one bottom safe-area owner", () => {
  for (const hasFooter of [false, true]) {
    const footer = hasFooter
      ? SearchFilterActions({ onApply: () => {}, onReset: () => {} })
      : undefined;
    const tree = SearchFilterSheet({
      children: jsx.jsx("Text", { children: "Filters" }),
      footer,
      title: "Filters",
      description: "Choose filters",
      visible: true,
      onClose: () => {},
    });
    assert.equal(tree.props.bottomInsetMode, hasFooter ? "safe-area" : "edge");
    const body = tree.props.children;
    assert.deepEqual(body.props.edges, hasFooter ? [] : ["bottom"]);
    const safeAreas = nodes(tree).filter(
      (node) => node.type === "SafeAreaView",
    );
    assert.equal(
      safeAreas.filter((node) => node.props.edges.includes("bottom")).length,
      1,
    );
    if (hasFooter) {
      const actions = safeAreas.find((node) =>
        node.props.edges.includes("bottom"),
      );
      assert.match(actions.props.className, /pb-4/);
      assert.equal(
        nodes(tree).find((node) => node.type === "ScrollView").props.style
          .flexShrink,
        1,
      );
      assert.ok(
        nodes(actions).some(
          (node) => node.props?.accessibilityLabel === "Apply filters",
        ),
      );
    }
  }
});

test("ticket filter sheet uses shared actions, keeps drafts local and resets defaults", () => {
  let draft = {
    statuses: ["Closed"],
    priorities: ["Low"],
    sort: sortChoice("creation", "asc"),
  };
  const initial = draft;
  let applied;
  const { SupportTicketFilterSheet } = compile(
    "../components/support/SupportTicketFilterSheet.tsx",
    {
      "react/jsx-runtime": jsx,
      react: {
        useEffect: () => {},
        useRef: (current) => ({ current }),
        useState: () => [
          draft,
          (next) => {
            draft = typeof next === "function" ? next(draft) : next;
          },
        ],
      },
      "react-native": { ...native, Platform: { OS: "ios" } },
      "@expo/vector-icons": icons,
      "../../constants/colors": palette,
      "../ui/SearchFilterSheet": {
        SearchFilterSheet: "SearchFilterSheet",
        SearchFilterSection: "SearchFilterSection",
        SearchFilterActions,
      },
      "../ui/chips/ChoiceChips": choiceChips,
      "../../utils/support/ticketList": ticketList,
    },
  );
  const options = ticketList.ticketFilterOptions(listRecords);
  const render = () =>
    SupportTicketFilterSheet({
      filters: initial,
      visible: true,
      ...options,
      onApply: (filters) => {
        applied = filters;
      },
      onClose: () => {},
    });
  const press = (label) =>
    nodes([render(), render().props.footer])
      .find(
        (node) =>
          node.props?.accessibilityLabel === label ||
          (node.props?.accessibilityRole === "radio" &&
            node.props.accessibilityLabel.startsWith(`${label}:`)),
      )
      .props.onPress();
  press("Open");
  press("Urgent");
  press("Priority");
  assert.deepEqual(initial, {
    statuses: ["Closed"],
    priorities: ["Low"],
    sort: sortChoice("creation", "asc"),
  });
  assert.equal(applied, undefined);
  assert.deepEqual(
    nodes(render())
      .filter((node) => node.type === "SearchFilterSection")
      .map((node) => node.props.label),
    ["Status", "Priority", "Sort by"],
  );
  assert.equal(render().props.footer.type, SearchFilterActions);
  const applyButton = nodes(render().props.footer).find(
    (node) => node.props?.accessibilityLabel === "Apply filters",
  );
  assert.match(applyButton.props.className, /bg-primary/);
  nodes(render().props.footer)
    .find((node) => node.props?.accessibilityLabel === "Apply filters")
    .props.onPress();
  assert.deepEqual(applied, {
    statuses: ["Closed", "Open"],
    priorities: ["Low", "Urgent"],
    sort: {
      field: "priority",
      directions: { creation: "asc", priority: "desc", status: "asc" },
    },
  });
  nodes(render().props.footer)
    .find((node) => node.props?.accessibilityLabel === "Reset")
    .props.onPress();
  assert.deepEqual(draft, ticketList.DEFAULT_TICKET_FILTERS);
  for (const [group, all, first, second] of [
    ["statuses", "All statuses", "Open", "In Progress"],
    ["priorities", "All priorities", "Urgent", "High"],
  ]) {
    const pill = (label) =>
      nodes(render()).find((node) => node.props?.accessibilityLabel === label);
    assert.equal(pill(all).props.accessibilityState.checked, true);
    assert.equal(pill(all).props.accessibilityRole, "checkbox");
    assert.match(text(pill(all)), /✓/);
    assert.match(pill(all).props.className, /min-h-11/);
    press(first);
    assert.deepEqual(draft[group], [first]);
    assert.equal(pill(all).props.accessibilityState.checked, false);
    press(second);
    assert.deepEqual(draft[group], [first, second]);
    press(first);
    assert.deepEqual(draft[group], [second]);
    press(second);
    assert.deepEqual(draft[group], []);
    assert.equal(pill(all).props.accessibilityState.checked, true);
    press(first);
    press(all);
    assert.deepEqual(draft[group], []);
    assert.equal(pill(first).props.accessibilityState.checked, false);
  }
  assert.deepEqual(
    nodes(render())
      .filter((node) => node.props?.accessibilityRole === "radio")
      .map(
        (node) =>
          nodes(node).find(
            (child) => child.type === "Text" && child.props.children !== "✓",
          ).props.children,
      ),
    ["Creation", "Priority", "Status"],
  );
  for (const { label, value } of ticketList.TICKET_SORT_OPTIONS) {
    if (draft.sort.field === value)
      press(value === "creation" ? "Priority" : "Creation");
    press(label);
    assert.equal(draft.sort.field, value);
    const initialDirection = draft.sort.directions[value];
    press(label);
    assert.equal(
      draft.sort.directions[value],
      initialDirection === "asc" ? "desc" : "asc",
    );
    const checkedSorts = nodes(render()).filter(
      (node) =>
        node.props?.accessibilityRole === "radio" &&
        node.props.accessibilityState.checked,
    );
    assert.equal(checkedSorts.length, 1);
    assert.ok(checkedSorts[0].props.accessibilityLabel.startsWith(`${label}:`));
    assert.match(
      checkedSorts[0].props.accessibilityHint,
      /Tap again to reverse/,
    );
    assert.match(text(checkedSorts[0]), /✓/);
    for (const option of ticketList.TICKET_SORT_OPTIONS) {
      const pill = nodes(render()).find(
        (node) =>
          node.props?.accessibilityRole === "radio" &&
          node.props.accessibilityLabel.startsWith(`${option.label}:`),
      );
      const arrow = nodes(pill).find((node) => node.type === "Feather");
      assert.equal(
        arrow.props.name,
        draft.sort.directions[option.value] === "asc"
          ? "arrow-up"
          : "arrow-down",
      );
      assert.equal(
        arrow.props.color,
        draft.sort.field === option.value
          ? palette.colors.primaryContent
          : palette.colors.text,
      );
    }
  }
  const remembered = structuredClone(draft.sort.directions);
  press("Creation");
  press("Priority");
  press("Status");
  assert.deepEqual(draft.sort.directions, remembered);
  assert.match(
    text(render()),
    /Tap the selected option again to reverse its order/,
  );
  const beforeDraft = structuredClone(draft);
  press("Escalated");
  assert.deepEqual(beforeDraft.priorities, []);
  press("Apply filters");
  assert.deepEqual(applied.priorities, ["Escalated"]);
  assert.deepEqual(applied.sort, { field: "status", directions: remembered });
  press("Reset");
  press("Apply filters");
  assert.deepEqual(applied, ticketList.DEFAULT_TICKET_FILTERS);
});

test("remembered sort directions survive reopening and web Escape restores focus", () => {
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  const listeners = new Map();
  let focusRestored = 0;
  class FocusTarget {
    isConnected = true;
    focus() {
      focusRestored++;
    }
  }
  globalThis.HTMLElement = FocusTarget;
  globalThis.document = {
    activeElement: new FocusTarget(),
    addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener: (name, handler) => {
      if (listeners.get(name) === handler) listeners.delete(name);
    },
  };
  try {
    let effects = [];
    let draft;
    let closes = 0;
    const { SupportTicketFilterSheet } = compile(
      "../components/support/SupportTicketFilterSheet.tsx",
      {
        "react/jsx-runtime": jsx,
        react: {
          useEffect: (effect) => effects.push(effect),
          useRef: (current) => ({ current }),
          useState: (initial) => [
            draft ?? initial,
            (next) => {
              draft = typeof next === "function" ? next(draft) : next;
            },
          ],
        },
        "react-native": { Platform: { OS: "web" } },
        "@expo/vector-icons": icons,
        "../../constants/colors": palette,
        "../ui/SearchFilterSheet": {
          SearchFilterActions,
          SearchFilterSheet: "SearchFilterSheet",
          SearchFilterSection: "SearchFilterSection",
        },
        "../ui/chips/ChoiceChips": choiceChips,
        "../../utils/support/ticketList": ticketList,
      },
    );
    const filters = {
      statuses: ["Open"],
      priorities: ["Urgent"],
      sort: {
        field: "priority",
        directions: { creation: "asc", priority: "asc", status: "desc" },
      },
    };
    const props = {
      filters,
      ...ticketList.ticketFilterOptions(listRecords),
      visible: true,
      onApply: () => {},
      onClose: () => closes++,
    };
    SupportTicketFilterSheet(props);
    effects[0]();
    const cleanup = effects[1]();
    assert.deepEqual(draft, filters);
    let prevented = 0;
    listeners.get("keydown")({
      key: "Escape",
      preventDefault: () => prevented++,
      stopPropagation: () => {},
    });
    assert.equal(closes, 1);
    assert.equal(prevented, 1);
    cleanup();
    assert.equal(listeners.size, 0);
    assert.equal(focusRestored, 1);
    draft = {
      ...filters,
      statuses: ["Closed"],
      sort: ticketList.selectTicketSort(filters.sort, "priority"),
    };
    effects = [];
    SupportTicketFilterSheet(props);
    effects[0]();
    assert.deepEqual(draft, filters);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousHTMLElement === undefined) delete globalThis.HTMLElement;
    else globalThis.HTMLElement = previousHTMLElement;
  }
});

test("ticket detail endpoint encodes ID and unwraps response", async () => {
  const ticket = { id: "one/two", status: "In Progress" };
  for (const response of [ticket, { data: ticket }]) {
    const api = compile("../api/support.ts", {
      "./client": {
        ...clientHelpers,
        apiClient: {
          get: async (url, options) => {
            assert.equal(url, "/support-tickets/one%2Ftwo");
            assert.equal(options.headers.Authorization, "Bearer token");
            return response;
          },
        },
      },
    });
    assert.deepEqual(await api.fetchSupportTicket(ticket.id, "token"), ticket);
  }
});

const ticketDetailsHelpers = load("../../utils/support/ticketDetails.ts");
const { ApiError: TicketApiError } = load("../../api/errors.ts");

test("clearing denied detail data retains the error without refetching", async () => {
  const client = new QueryClient();
  const key = ["supportTickets", "detail", "denied"];
  client.setQueryData(key, { id: "denied", subject: "Cached private details" });
  let requests = 0;
  const observer = new QueryObserver(client, {
    queryKey: key,
    retry: false,
    enabled: false,
    queryFn: async () => {
      requests++;
      throw new TicketApiError("Denied", 403);
    },
  });
  const unsubscribe = observer.subscribe(() => {});
  try {
    await observer.refetch();
    client
      .getQueryCache()
      .find({ queryKey: key, exact: true })
      .setState({ data: undefined });
    assert.equal(observer.getCurrentResult().data, undefined);
    assert.equal(observer.getCurrentResult().isError, true);
    assert.equal(requests, 1);
  } finally {
    unsubscribe();
    client.clear();
  }
});

test("ticket details handles timestamps, unknown statuses and unavailable errors", () => {
  assert.equal(ticketDetailsHelpers.ticketTimestamp(), "Unavailable");
  assert.equal(ticketDetailsHelpers.ticketTimestamp("invalid"), "Unavailable");
  assert.notEqual(
    ticketDetailsHelpers.ticketTimestamp("2026-10-08T01:00:00Z"),
    "Unavailable",
  );
  assert.equal(
    ticketDetailsHelpers.ticketStatusClass("Escalated"),
    "bg-surface text-textPrimary",
  );
  for (const status of [403, 404])
    assert.equal(
      ticketDetailsHelpers.isTicketUnavailable(
        new TicketApiError("Denied", status),
      ),
      true,
    );
  assert.equal(
    ticketDetailsHelpers.isTicketUnavailable(new TicketApiError("Failed", 500)),
    false,
  );
});

function detailsModal(
  ticket,
  query,
  onClose = () => {},
  dimensions = { height: 800, width: 393, fontScale: 1 },
) {
  const { SupportTicketDetailsModal } = compile(
    "../components/support/SupportTicketDetailsModal.tsx",
    {
      "react/jsx-runtime": jsx,
      react: { useEffect: () => {}, useRef: (current) => ({ current }) },
      "react-native": {
        ...native,
        Platform: { OS: "ios" },
        ScrollView: "ScrollView",
        useWindowDimensions: () => dimensions,
      },
      "react-native-safe-area-context": {
        useSafeAreaInsets: () => ({ bottom: 24 }),
      },
      "../../hooks/api/useSupport": { useSupportTicket: () => query },
      "../../hooks/ui/useReducedMotionPreference": {
        useReducedMotionPreference: () => true,
      },
      "../../constants/colors": palette,
      "../../utils/billing/entitlementCapabilities": load(
        "../../utils/billing/entitlementCapabilities.ts",
      ),
      "../../utils/support/ticketDetails": ticketDetailsHelpers,
      "../ui/BottomSheetModal": { BottomSheetModal: "BottomSheetModal" },
      "../ui/ModalHeader": { ModalHeader: "ModalHeader" },
      "../ui/forms/FormSection": { FormSection: "FormSection" },
      "../ui/buttons/Button": { Button },
    },
  );
  return SupportTicketDetailsModal({ ticket, onClose });
}

test("ticket details shows fresh response, complete description and missing-field fallbacks", () => {
  const old = {
    id: "one",
    subject: "Old",
    status: "Open",
    description: "Old description",
  };
  const fresh = {
    ...old,
    subject: "Fresh",
    status: "Escalated",
    description: "x".repeat(1000),
  };
  const tree = detailsModal(old, { data: fresh });
  assert.match(text(tree), /Fresh/);
  assert.match(text(tree), /Escalated/);
  assert.ok(text(tree).includes(fresh.description));
  assert.match(text(tree), /Not provided/);
  assert.match(text(tree), /Unavailable/);
  assert.equal(tree.props.reducedMotion, true);
  assert.equal(
    nodes(tree).filter((node) => node.type === "TextInput").length,
    0,
  );
});

test("ticket detail priorities share status badge styling with semantic colors and neutral fallbacks", () => {
  const badgeShape =
    "self-start rounded-xl px-3 py-1.5 font-ralewayBold text-sm";
  for (const [priority, colorClass] of [
    ["Low", "bg-successSurface text-success"],
    ["Medium", "bg-infoSurface text-info"],
    ["High", "bg-warningSurface text-warning"],
    ["Urgent", "bg-dangerSurface text-danger"],
    ["Escalated", "bg-surface text-textPrimary"],
    [undefined, "bg-surface text-textPrimary"],
    ["", "bg-surface text-textPrimary"],
    [" Urgent ", "bg-dangerSurface text-danger"],
  ]) {
    assert.equal(
      ticketDetailsHelpers.ticketPriorityClass(priority),
      colorClass,
    );
    const ticket = { id: "one", subject: "Help", status: "Open", priority };
    const tree = detailsModal(ticket, { data: ticket });
    const priorityBadge = nodes(tree).find(
      (node) =>
        node.type === "Text" &&
        node.props.children === (priority?.trim() || "Not provided") &&
        node.props.className?.startsWith(badgeShape),
    );
    assert.ok(priorityBadge);
    assert.equal(priorityBadge.props.className, `${badgeShape} ${colorClass}`);
    const statusBadge = nodes(tree).find(
      (node) => node.type === "Text" && node.props.children === "Open",
    );
    assert.equal(
      statusBadge.props.className,
      `${badgeShape} bg-warningSurface text-warning`,
    );
  }
});

test("ticket details uses title case, smaller subject and a responsive 2x2 metadata grid", () => {
  const ticket = {
    id: "one",
    subject: "Support submission",
    status: "Open",
    description: "Test ticket",
  };
  for (const [width, fontScale, direction] of [
    [393, 1, "flex-row"],
    [320, 1, "flex-col"],
    [393, 2, "flex-col"],
  ]) {
    const tree = detailsModal(ticket, { data: ticket }, undefined, {
      height: 800,
      width,
      fontScale,
    });
    assert.equal(
      nodes(tree).find((node) => node.type === "ModalHeader").props.title,
      "Ticket Details",
    );
    const subject = nodes(tree).find(
      (node) => node.type === "Text" && node.props.children === ticket.subject,
    );
    assert.match(subject.props.className, /text-lg/);
    const grids = nodes(tree).filter(
      (node) =>
        node.type === "View" && node.props.className === `gap-4 ${direction}`,
    );
    assert.equal(grids.length, 2);
    assert.deepEqual(
      grids.map((grid) => grid.props.children.map((cell) => cell.props.label)),
      [
        ["Category", "Priority"],
        ["Submitted", "Last updated"],
      ],
    );
  }
});

test("ticket details retains cached data on failure and retry invokes refresh", () => {
  let retries = 0;
  const ticket = {
    id: "one",
    subject: "Cached issue",
    status: "Open",
    description: "Details",
  };
  const tree = detailsModal(ticket, {
    isError: true,
    error: new TicketApiError("Failed", 500),
    refetch: () => {
      retries++;
    },
  });
  assert.match(text(tree), /Cached issue/);
  assert.match(text(tree), /Couldn’t refresh ticket details/);
  nodes(tree)
    .find((node) => node.type === "Pressable")
    .props.onPress();
  assert.equal(retries, 1);
  assert.match(
    text(detailsModal(null, { isFetching: true })),
    /Loading ticket details/,
  );
  assert.match(
    text(detailsModal(null, { isError: true })),
    /Couldn’t load ticket details/,
  );
});

test("403 and 404 conceal cached ticket content", () => {
  for (const status of [403, 404]) {
    const ticket = {
      id: "one",
      subject: "Private subject",
      status: "Open",
      description: "Private details",
    };
    const tree = detailsModal(ticket, {
      data: ticket,
      isError: true,
      error: new TicketApiError("Denied", status),
    });
    assert.match(text(tree), /This ticket is no longer available/);
    assert.doesNotMatch(text(tree), /Private subject|Private details/);
  }
});

test("ticket query scopes selection, refreshes on open, updates list and clears denied cache", async () => {
  let options;
  let state = {};
  const effects = [];
  let list = [
    { id: "one", status: "Open" },
    { id: "two", status: "Open" },
  ];
  const cleared = [],
    invalidated = [];
  const hooks = compile("../hooks/api/useSupport.ts", {
    react: { useEffect: (effect) => effects.push(effect) },
    "@tanstack/react-query": {
      useQuery: (value) => {
        options = value;
        return state;
      },
      useMutation: () => ({}),
      useQueryClient: () => ({
        setQueryData: (key, update) => {
          assert.deepEqual(key, ["supportTickets"]);
          list = update(list);
        },
        getQueryCache: () => ({
          find: (value) => ({
            setState: (state) => cleared.push({ value, state }),
          }),
        }),
        invalidateQueries: (value) => invalidated.push(value),
      }),
    },
    "../../api/support": {
      fetchSupportTicket: async (id) => ({ id, status: "Resolved" }),
    },
    "../../utils/support/ticketDetails": ticketDetailsHelpers,
  });
  hooks.useSupportTicket(list[0]);
  assert.deepEqual(options.queryKey, ["supportTickets", "detail", "one"]);
  assert.equal(options.refetchOnMount, "always");
  const firstRequest = options.queryFn({
    signal: new AbortController().signal,
  });
  hooks.useSupportTicket(list[1]);
  assert.deepEqual(options.queryKey, ["supportTickets", "detail", "two"]);
  assert.equal(options.placeholderData.id, "two");
  assert.equal((await firstRequest).id, "one");
  assert.equal(list[0].status, "Resolved");
  assert.equal(list[1].status, "Open");
  assert.equal(options.retry(0, new TicketApiError("Denied", 403)), false);
  assert.equal(options.retry(0, new Error("Offline")), true);
  state = { error: new TicketApiError("Missing", 404) };
  hooks.useSupportTicket(list[1]);
  effects.at(-1)();
  assert.deepEqual(cleared[0], {
    value: {
      queryKey: ["supportTickets", "detail", "two"],
      exact: true,
    },
    state: { data: undefined },
  });
  assert.deepEqual(invalidated[0], {
    queryKey: ["supportTickets"],
    exact: true,
  });
  hooks.useSupportTicket(null);
  assert.equal(options.enabled, false);
});

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
      if (state.isPending) {
        assert.ok(
          nodes(tree).some(
            (node) =>
              node.props?.accessibilityRole === "progressbar" &&
              node.props.accessibilityLabel.startsWith("Loading"),
          ),
        );
      } else {
        assert.match(text(tree), /Could not load/);
      }
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
