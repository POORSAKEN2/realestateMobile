import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import load from "./helpers/loadTs.cjs";
import loadWithMocks from "./helpers/loadWithMocks.cjs";

const { getProfileAccountPresentation } = load(
  "../../utils/profile/profileAccountPresentation.ts",
);
const jsx = (type, props) => ({ type, props });

function elements(node) {
  if (!node || typeof node !== "object") return [];
  const children = node.props?.children;
  return [node, ...[children].flat().flatMap(elements)];
}

function summaryRuntime() {
  let visible = false;
  const { ProfileSummaryCard } = loadWithMocks(
    fileURLToPath(
      new URL("../components/profile/ProfileSummaryCard.tsx", import.meta.url),
    ),
    {
      react: {
        useState: () => [
          visible,
          (value) => {
            visible = value;
          },
        ],
      },
      "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" },
      "react-native": {
        Image: "image",
        Text: "text",
        TouchableOpacity: "button",
        Pressable: "button",
        View: "view",
      },
      "@expo/vector-icons": { Ionicons: "icon" },
      "./ProfileAccountDetailsDialog": {
        ProfileAccountDetailsDialog: "dialog",
      },
    },
  );
  return { render: (props) => ProfileSummaryCard(props) };
}

test("Apple relay domains are hidden only in the summary", () => {
  for (const email of [
    "member@privaterelay.appleid.com",
    "member@private.icloud.com",
    "Member@PRIVATERELAY.APPLEID.COM",
    "Member@PRIVATE.ICLOUD.COM",
  ]) {
    const account = getProfileAccountPresentation("apple", email);
    assert.equal(account.provider, "apple");
    assert.equal(account.isPrivateEmail, true);
    assert.equal(account.summaryEmail, undefined);
    assert.equal(account.accountEmail, email);
  }
});

test("shared and misleading-domain emails stay visible", () => {
  for (const email of [
    "member@example.com",
    "member@icloud.com",
    "member@privaterelay.appleid.com.example.com",
    "member@notprivate.icloud.com",
    "privaterelay.appleid.com",
  ]) {
    const account = getProfileAccountPresentation("apple", email);
    assert.equal(account.isPrivateEmail, false);
    assert.equal(account.summaryEmail, email);
  }
});

test("provider metadata, not email domain, determines the provider", () => {
  for (const method of ["password", undefined]) {
    for (const email of [
      "member@gmail.com",
      "member@privaterelay.appleid.com",
    ]) {
      const account = getProfileAccountPresentation(method, email);
      assert.equal(account.provider, null);
      assert.equal(account.summaryEmail, email);
      assert.equal(account.isPrivateEmail, false);
    }
  }
  assert.deepEqual(getProfileAccountPresentation(undefined, "  "), {
    provider: null,
    isPrivateEmail: false,
    accountEmail: undefined,
    summaryEmail: undefined,
  });
  assert.equal(getProfileAccountPresentation("apple").provider, "apple");
});

test("restored sessions retain presentation without changing stored email", () => {
  const stored = JSON.stringify({
    authMethod: "apple",
    user: { email: "Member@PRIVATERELAY.APPLEID.COM" },
  });
  const session = JSON.parse(stored);
  const account = getProfileAccountPresentation(
    session.authMethod,
    session.user.email,
  );
  assert.equal(account.summaryEmail, undefined);
  assert.equal(JSON.stringify(session), stored);
});

test("profile updates preserve the canonical email and Apple session metadata", async () => {
  const email = "member@privaterelay.appleid.com";
  let session = {
    accessToken: "test-token",
    authMethod: "apple",
    user: { name: "Member", email },
  };
  let sentPayload;
  const { useProfileController } = loadWithMocks(
    fileURLToPath(
      new URL("../hooks/profile/useProfileController.ts", import.meta.url),
    ),
    {
      react: {
        useMemo: (fn) => fn(),
        useState: (value) => [value, () => {}],
        useRef: (value) => ({ current: value }),
      },
      "../../api/user": { updateUserProfile() {} },
      "../../services/profileImagePicker": { selectProfileImage() {} },
      "../useAuth": {
        useAuth: () => ({
          session,
          signIn: (next) => {
            session = next;
          },
          signOut() {},
        }),
      },
    },
  );
  const controller = useProfileController({
    updateProfile: async (payload) => {
      sentPayload = payload;
      return { name: "Updated member" };
    },
    selectImage: async () => ({ status: "cancelled" }),
  });
  assert.equal(controller.accountPresentation.summaryEmail, undefined);
  assert.equal((await controller.saveProfile()).status, "saved");
  assert.equal(session.user.email, email);
  assert.equal(session.authMethod, "apple");
  assert.equal("email" in sentPayload, false);
  assert.equal(useProfileController().accountPresentation.accountEmail, email);
});

test("relay summary reveals the full email only through account details", () => {
  const runtime = summaryRuntime();
  const email = "member@privaterelay.appleid.com";
  const props = {
    account: getProfileAccountPresentation("apple", email),
    name: "Member",
    imageUri: "",
    jobTitle: "Admin",
    completion: { percent: 25 },
    onChangePhoto() {},
  };
  const render = () => elements(runtime.render(props));
  const nodes = render();
  const text = nodes
    .filter((node) => node.type === "text")
    .map((node) => node.props.children);
  assert.ok(text.includes("Apple account"));
  assert.ok(!text.includes(email));
  assert.ok(!text.includes("Email hidden by Apple"));
  nodes
    .find(
      (node) =>
        node.props.accessibilityHint ===
        "Opens your sign-in method and full account email",
    )
    .props.onPress();
  const dialog = render().find((node) => node.type === "dialog");
  assert.equal(dialog.props.visible, true);
  assert.equal(dialog.props.email, email);
  dialog.props.onClose();
  assert.equal(
    render().find((node) => node.type === "dialog").props.visible,
    false,
  );
});

test("summary content adapts to shared email, missing details, and completion state", () => {
  const runtime = summaryRuntime();
  const longName = "A very long member name with several family names";
  for (const scenario of [
    {
      method: "apple",
      email: "member@example.com",
      name: longName,
      jobTitle: "",
      percent: 50,
      missing: "phone",
      expected: [
        longName,
        "Apple account",
        "member@example.com",
        "50%",
        "Add your phone to complete your profile.",
      ],
    },
    {
      method: "apple",
      email: undefined,
      name: "",
      jobTitle: "",
      percent: 0,
      missing: "name",
      expected: ["Your name", "RE", "Apple account", "0%"],
    },
    {
      method: "password",
      email: undefined,
      name: "Member",
      jobTitle: "Manager",
      percent: 100,
      expected: [
        "Member",
        "Manager",
        "100%",
        "All key profile details are complete.",
      ],
    },
    {
      method: undefined,
      email: undefined,
      name: "",
      jobTitle: "",
      percent: 0,
      expected: ["Your name", "Real estate professional"],
    },
  ]) {
    const tree = runtime.render({
      account: getProfileAccountPresentation(scenario.method, scenario.email),
      name: scenario.name,
      jobTitle: scenario.jobTitle,
      imageUri: "",
      completion: {
        percent: scenario.percent,
        nextMissingItem: scenario.missing,
      },
      onChangePhoto() {},
    });
    const nodes = elements(tree);
    const text = nodes
      .filter((node) => node.type === "text")
      .map((node) => [node.props.children].flat().join(""));
    for (const value of scenario.expected)
      assert.ok(text.includes(value), value);
    assert.ok(!text.includes("Change photo"));
    assert.ok(!text.includes("Add profile photo"));
    if (scenario.method !== "apple") {
      assert.equal(
        nodes.some(
          (node) => node.props.accessibilityLabel === "View account details",
        ),
        false,
      );
      assert.equal(tree.props.children.filter(Boolean).length, 2);
    }
    const name = nodes.find(
      (node) => node.props.children === (scenario.name || "Your name"),
    );
    assert.equal(name.props.numberOfLines, undefined);
    assert.equal(
      nodes.find((node) => node.props.accessibilityRole === "progressbar").props
        .accessibilityValue.now,
      scenario.percent,
    );
  }
});

test("avatar remains the photo control and exposes the saving lock", () => {
  const runtime = summaryRuntime();
  let changes = 0;
  const props = {
    account: getProfileAccountPresentation("password", "member@example.com"),
    name: "Member",
    jobTitle: "",
    imageUri: "https://example.com/avatar.jpg",
    completion: { percent: 75 },
    onChangePhoto: () => {
      changes++;
    },
  };
  const nodes = elements(runtime.render(props));
  assert.equal(
    nodes.find((node) => node.type === "image").props.source.uri,
    props.imageUri,
  );
  const photo = nodes.find(
    (node) => node.props.accessibilityLabel === "Change profile photo",
  );
  photo.props.onPress();
  assert.equal(changes, 1);
  const locked = elements(runtime.render({ ...props, disabled: true })).find(
    (node) => node.props.accessibilityLabel === "Change profile photo",
  );
  assert.equal(locked.props.disabled, true);
  assert.equal(locked.props.accessibilityState.disabled, true);
});

test("account dialog offers selectable full email and closes through shared controls", () => {
  let closes = 0;
  const { ProfileAccountDetailsDialog } = loadWithMocks(
    fileURLToPath(
      new URL(
        "../components/profile/ProfileAccountDetailsDialog.tsx",
        import.meta.url,
      ),
    ),
    {
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": { Text: "text", View: "view" },
      "../auth/AuthDialog": { AuthDialog: "dialog" },
      "../ui/ModalHeader": { ModalHeader: "header" },
      "../ui/forms/FormActionRow": { FormActionRow: "actions" },
    },
  );
  const email = "member@private.icloud.com";
  const tree = ProfileAccountDetailsDialog({
    email,
    name: "Saved name",
    isPrivateEmail: true,
    visible: true,
    onClose: () => {
      closes++;
    },
  });
  const nodes = elements(tree);
  assert.ok(
    nodes.some(
      (node) => node.props.selectable && node.props.children === email,
    ),
  );
  assert.ok(nodes.some((node) => node.props.children === "Sign in with Apple"));
  assert.ok(nodes.some((node) => node.props.children === "Saved name"));
  assert.ok(
    nodes.some((node) =>
      String(node.props.children).includes(
        "Apple provided this private address",
      ),
    ),
  );
  const missing = elements(
    ProfileAccountDetailsDialog({ visible: true, onClose() {} }),
  );
  assert.equal(
    missing.filter((node) => node.props.children === "Not provided").length,
    2,
  );
  assert.equal(
    missing.some((node) =>
      String(node.props.children).includes(
        "Apple provided this private address",
      ),
    ),
    false,
  );
  nodes.find((node) => node.props.cancelText === "Close").props.onCancel();
  tree.props.onClose();
  assert.equal(closes, 2);
});
