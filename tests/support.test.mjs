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
  filters,
  createTicket = async () => {},
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
    "react-native": native,
    "@expo/vector-icons": { Feather: "Feather", Ionicons: "Ionicons" },
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
  const original = [...listRecords];
  const ids = (filters) =>
    ticketList
      .filterAndSortTickets(listRecords, {
        ...ticketList.DEFAULT_TICKET_FILTERS,
        ...filters,
      })
      .map((ticket) => ticket.id);
  assert.deepEqual(ids({ sort: "newest" }), [
    "new",
    "urgent",
    "high",
    "medium",
    "missing",
    "unknown",
  ]);
  assert.deepEqual(ids({ sort: "oldest" }), [
    "medium",
    "high",
    "urgent",
    "new",
    "missing",
    "unknown",
  ]);
  assert.deepEqual(ids({ sort: "priority" }), [
    "urgent",
    "high",
    "medium",
    "new",
    "missing",
    "unknown",
  ]);
  assert.deepEqual(ids({ sort: "status" }), [
    "urgent",
    "high",
    "medium",
    "new",
    "missing",
    "unknown",
  ]);
  assert.deepEqual(ids({ status: "Open", priority: "Urgent" }), ["urgent"]);
  assert.deepEqual(ids({ status: "Closed", priority: "Urgent" }), []);
  assert.deepEqual(ids({ status: "Deferred", priority: "Escalated" }), [
    "unknown",
  ]);
  assert.deepEqual(ids({ status: "", priority: "" }), ["missing"]);
  assert.deepEqual(listRecords, original);
  assert.deepEqual(ids({ sort: "newest" }), ids({ sort: "newest" }));
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
  const filters = { status: "Open", priority: "Urgent", sort: "priority" };
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
  getSheet().props.onApply({ ...filters, status: "Closed" });
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

test("successful ticket submission clears list filters so the new ticket is not hidden", async () => {
  let submitted;
  const render = screen({
    tab: "tickets",
    tickets: { data: listRecords },
    filters: { status: "Closed", priority: "Low", sort: "oldest" },
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

test("ticket filter sheet keeps edits local until apply and reset restores all defaults", () => {
  let buttonPalette = palette.lightColors;
  let draft = { status: "Closed", priority: "Low", sort: "oldest" };
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
      "../ui/SearchFilterSheet": {
        SearchFilterSheet: "SearchFilterSheet",
        SearchFilterSection: "SearchFilterSection",
      },
      "../ui/groups/RadioOptionList": { RadioOptionList: "RadioOptionList" },
      "../ui/ModalActionFooter": { ModalActionFooter: "ModalActionFooter" },
      "../../context/WorkspacePresentationContext": {
        useThemeColors: () => buttonPalette,
      },
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
  for (const [index, value] of [
    [0, "Open"],
    [1, "Urgent"],
    [2, "priority"],
  ]) {
    nodes(render())
      .filter((node) => node.type === "RadioOptionList")
      [index].props.onSelect(value);
  }
  assert.deepEqual(initial, {
    status: "Closed",
    priority: "Low",
    sort: "oldest",
  });
  assert.equal(applied, undefined);
  for (const theme of [palette.lightColors, palette.darkColors]) {
    buttonPalette = theme;
    const applyButton = nodes(render().props.footer).find(
      (node) => node.props?.accessibilityLabel === "Apply ticket filters",
    );
    assert.equal(applyButton.props.style.backgroundColor, theme.primaryStrong);
    assert.match(
      nodes(applyButton).find((node) => node.type === "Text").props.className,
      /text-whitePrimary/,
    );
  }
  nodes(render().props.footer)
    .find((node) => node.props?.accessibilityLabel === "Apply ticket filters")
    .props.onPress();
  assert.deepEqual(applied, {
    status: "Open",
    priority: "Urgent",
    sort: "priority",
  });
  nodes(render().props.footer)
    .find((node) => node.props?.accessibilityLabel === "Reset ticket filters")
    .props.onPress();
  assert.deepEqual(draft, ticketList.DEFAULT_TICKET_FILTERS);
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
