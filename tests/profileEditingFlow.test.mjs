import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import loadWithMocks from "./helpers/loadWithMocks.cjs";

const jsx = (type, props) => ({ type, props });
function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...[tree.props?.children].flat().flatMap(nodes)];
}

function hookRuntime(path, mocks, parameters) {
  const state = [],
    refs = [],
    dependencies = [],
    cleanups = [];
  let cursor = 0,
    effects = [];
  const react = {
    useMemo: (fn) => fn(),
    useState(value) {
      const index = cursor++;
      if (!(index in state)) state[index] = value;
      return [
        state[index],
        (next) => {
          state[index] = typeof next === "function" ? next(state[index]) : next;
        },
      ];
    },
    useRef(value) {
      const index = cursor++;
      return refs[index] ?? (refs[index] = { current: value });
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (
        !dependencies[index] ||
        deps.some((value, i) => !Object.is(value, dependencies[index][i]))
      ) {
        dependencies[index] = deps;
        effects.push(() => {
          cleanups[index]?.();
          cleanups[index] = effect();
        });
      }
    },
  };
  const exports = loadWithMocks(fileURLToPath(new URL(path, import.meta.url)), {
    react,
    ...mocks,
  });
  const hook = Object.values(exports).find((fn) => fn.name.startsWith("use"));
  return {
    render() {
      cursor = 0;
      return hook(parameters());
    },
    flushEffects() {
      const pending = effects;
      effects = [];
      pending.forEach((effect) => effect());
    },
    dispose() {
      cleanups.forEach((cleanup) => cleanup?.());
    },
  };
}

function controllerSetup() {
  let session = {
    authMethod: "apple",
    accessToken: "test-token",
    user: {
      name: "Saved name",
      email: "member@private.icloud.com",
      company: "Saved company",
    },
  };
  let update = async (payload) => ({
    name: payload.name,
    company: payload.company,
    phone: payload.phone,
  });
  let image = { status: "cancelled" };
  const calls = [];
  const runtime = hookRuntime(
    "../hooks/profile/useProfileController.ts",
    {
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
    () => ({
      updateProfile: async (payload) => {
        calls.push(payload);
        return update(payload);
      },
      selectImage: async () => image,
    }),
  );
  return {
    ...runtime,
    calls,
    setUpdate: (fn) => {
      update = fn;
    },
    setImage: (value) => {
      image = value;
    },
  };
}

test("view/edit/save/cancel keeps popup data persisted until a successful save", async () => {
  const runtime = controllerSetup();
  assert.equal(runtime.render().isEditing, false);
  runtime.render().beginEditing();
  assert.equal(runtime.render().isEditing, true);
  assert.equal(runtime.render().saveDisabled, true);
  runtime.render().updateField("fullName", "Draft name");
  assert.equal(runtime.render().savedForm.fullName, "Saved name");
  assert.equal(runtime.render().accountPresentation.accountName, "Saved name");
  assert.equal(runtime.render().hasChanges, true);
  runtime.render().discardChanges();
  assert.equal(runtime.render().isEditing, false);
  assert.equal(runtime.render().form.fullName, "Saved name");
  runtime.render().beginEditing();
  runtime.render().updateField("fullName", "New name");
  assert.equal((await runtime.render().saveProfile()).status, "saved");
  assert.equal(runtime.render().isEditing, false);
  assert.equal(runtime.render().hasChanges, false);
  assert.equal(runtime.render().accountPresentation.accountName, "New name");
  assert.equal(
    runtime.render().accountPresentation.accountEmail,
    "member@private.icloud.com",
  );
});

test("invalid and failed saves retain draft fields and editing mode", async () => {
  const runtime = controllerSetup();
  runtime.render().beginEditing();
  runtime.render().updateField("fullName", "  ");
  assert.equal((await runtime.render().saveProfile()).status, "invalid");
  assert.ok(runtime.render().validationErrors.fullName);
  assert.equal(runtime.calls.length, 0);
  runtime.render().updateField("fullName", "Draft name");
  runtime.setUpdate(async () => {
    throw Error("Service unavailable");
  });
  assert.equal((await runtime.render().saveProfile()).status, "failed");
  assert.equal(runtime.render().isEditing, true);
  assert.equal(runtime.render().form.fullName, "Draft name");
  assert.equal(runtime.render().savedForm.fullName, "Saved name");
});

test("photo selection opens editing and cancel discards the whole draft", async () => {
  const runtime = controllerSetup();
  await runtime.render().chooseProfileImage();
  assert.equal(runtime.render().isEditing, false);
  runtime.setImage({
    status: "selected",
    image: { uri: "file:///photo.jpg", name: "photo.jpg", type: "image/jpeg" },
  });
  await runtime.render().chooseProfileImage();
  assert.equal(runtime.render().isEditing, true);
  assert.equal(runtime.render().hasChanges, true);
  runtime.render().updateField("companyName", "Draft company");
  runtime.render().discardChanges();
  assert.equal(runtime.render().form.imageUri, "");
  assert.equal(runtime.render().form.companyName, "Saved company");
  assert.equal(runtime.render().hasChanges, false);
});

test("saving locks edits, cancellation, and concurrent requests", async () => {
  const runtime = controllerSetup();
  let finish;
  runtime.setUpdate(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  runtime.render().beginEditing();
  runtime.render().updateField("fullName", "Draft name");
  const pending = runtime.render().saveProfile();
  assert.equal(runtime.render().isSaving, true);
  runtime.render().updateField("fullName", "Unexpected edit");
  runtime.render().discardChanges();
  assert.equal(runtime.render().form.fullName, "Draft name");
  assert.equal((await runtime.render().saveProfile()).status, "failed");
  assert.equal(runtime.calls.length, 1);
  finish({ name: "Draft name" });
  await pending;
  assert.equal(runtime.render().isSaving, false);
});

function guardSetup() {
  let hasChanges = true,
    isSaving = false,
    prevented,
    handler;
  let discarded = 0;
  const dispatched = [];
  const runtime = hookRuntime(
    "../hooks/profile/useProfileExitGuard.ts",
    {
      "@react-navigation/native": {
        useNavigation: () => ({
          dispatch: (action) => {
            assert.equal(prevented, false);
            dispatched.push(action);
          },
        }),
        usePreventRemove: (value, callback) => {
          prevented = value;
          handler = callback;
        },
      },
      "react-native": { Platform: { OS: "ios" } },
    },
    () => ({
      hasChanges,
      isSaving,
      onDiscard: () => {
        discarded++;
        hasChanges = false;
      },
    }),
  );
  return {
    ...runtime,
    attempt: (action) => handler({ data: { action } }),
    dispatched,
    get discarded() {
      return discarded;
    },
    setDirty: (value) => {
      hasChanges = value;
    },
    setSaving: (value) => {
      isSaving = value;
    },
  };
}

test("dirty navigation waits for confirmation and bypasses the guard only after approval", () => {
  const runtime = guardSetup();
  runtime.render();
  runtime.flushEffects();
  const action = { type: "GO_BACK" };
  runtime.attempt(action);
  assert.equal(runtime.render().confirmation.title, "Discard changes?");
  runtime.render().cancel();
  assert.equal(runtime.render().confirmation, null);
  assert.equal(runtime.dispatched.length, 0);
  runtime.attempt(action);
  runtime.render().confirm();
  assert.equal(runtime.discarded, 1);
  runtime.render();
  runtime.flushEffects();
  assert.deepEqual(runtime.dispatched, [action]);
  runtime.render();
  runtime.flushEffects();
  assert.equal(runtime.dispatched.length, 1);
});

test("cancel editing and sign-out cancellation retain drafts; clean cancel needs no prompt", () => {
  const runtime = guardSetup();
  runtime.render().requestDiscard();
  runtime.render().cancel();
  assert.equal(runtime.discarded, 0);
  let signedOut = 0;
  runtime.render().requestSignOut(() => {
    signedOut++;
  });
  assert.match(runtime.render().confirmation.description, /unsaved/);
  runtime.render().cancel();
  runtime.render();
  runtime.flushEffects();
  assert.equal(signedOut, 0);
  runtime.setDirty(false);
  runtime.render().requestDiscard();
  assert.equal(runtime.discarded, 1);
  assert.equal(runtime.render().confirmation, null);
});

test("confirmed sign-out disables navigation protection before clearing the session", () => {
  const runtime = guardSetup();
  runtime.render();
  runtime.flushEffects();
  runtime.render().requestSignOut(() => runtime.dispatched.push("signed-out"));
  runtime.render().confirm();
  assert.equal(runtime.dispatched.length, 0);
  runtime.render();
  runtime.flushEffects();
  assert.deepEqual(runtime.dispatched, ["signed-out"]);
  assert.equal(runtime.render().confirmation, null);
});

test("navigation and sign-out stay blocked while saving", () => {
  const runtime = guardSetup();
  runtime.setSaving(true);
  runtime.render();
  runtime.attempt({ type: "GO_BACK" });
  runtime.render().requestSignOut(() => runtime.dispatched.push("signed-out"));
  assert.equal(runtime.render().confirmation, null);
  assert.equal(runtime.dispatched.length, 0);
  assert.equal(runtime.discarded, 0);
});

test("professional details show saved values until Edit reveals reusable fields", () => {
  const { ProfileDetailsForm } = loadWithMocks(
    fileURLToPath(
      new URL("../components/profile/ProfileDetailsForm.tsx", import.meta.url),
    ),
    {
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": { View: "view", Text: "text", Pressable: "button" },
      "./ProfileField": { ProfileField: "field" },
      "../ui/forms/FormSection": { FormSection: "section" },
    },
  );
  let edited = false;
  const props = {
    values: {
      fullName: "Draft",
      companyName: "Draft company",
      phoneNumber: "123",
    },
    savedValues: { fullName: "Saved", companyName: "", phoneNumber: "" },
    errors: {},
    isEditing: false,
    onEdit: () => {
      edited = true;
    },
    onChange() {},
  };
  const section = ProfileDetailsForm(props).props.children;
  section.props.headerAction.props.onPress();
  assert.equal(edited, true);
  const view = nodes(section);
  assert.ok(view.some((node) => node.props.children === "Saved"));
  assert.equal(
    view.filter((node) => node.props.children === "Not added").length,
    2,
  );
  assert.equal(
    view.some((node) => node.type === "field"),
    false,
  );
  const editor = nodes(ProfileDetailsForm({ ...props, isEditing: true }));
  assert.equal(editor.filter((node) => node.type === "field").length, 3);
  assert.equal(
    editor.find((node) => node.type === "field").props.value,
    "Draft",
  );
});

test("Save/Cancel actions lock during submission and Save stays disabled without changes", () => {
  const { ProfileSaveButton } = loadWithMocks(
    fileURLToPath(
      new URL("../components/profile/ProfileSaveButton.tsx", import.meta.url),
    ),
    {
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": { Text: "text", View: "view" },
      "../ui/forms/FormActionRow": { FormActionRow: "actions" },
    },
  );
  const props = {
    hasChanges: false,
    disabled: false,
    isSaving: false,
    onPress() {},
    onDiscard() {},
  };
  const idle = nodes(ProfileSaveButton(props));
  assert.equal(
    idle.find((node) => node.props.submitText === "Save changes").props
      .submitDisabled,
    true,
  );
  assert.equal(
    idle.some((node) => node.props.children === "Profile up to date"),
    false,
  );
  const busy = nodes(
    ProfileSaveButton({
      ...props,
      hasChanges: true,
      isSaving: true,
      disabled: true,
    }),
  );
  assert.equal(
    busy.find((node) => node.props.submitText === "Save changes").props
      .isPending,
    true,
  );
});

test("sign-out row remains a disabled-aware action without restoring Settings", () => {
  const { ProfileAccountActions } = loadWithMocks(
    fileURLToPath(
      new URL(
        "../components/profile/ProfileAccountActions.tsx",
        import.meta.url,
      ),
    ),
    {
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": {
        Text: "text",
        View: "view",
        TouchableOpacity: "button",
      },
      "@expo/vector-icons": { Ionicons: "icon" },
      "./ProfileMenuSection": { ProfileMenuSection: "section" },
    },
  );
  let requested = 0;
  const props = {
    onOpenAdditionalSettings() {},
    onSignOut: () => {
      requested++;
    },
  };
  const row = nodes(ProfileAccountActions(props)).find(
    (node) => node.props.accessibilityLabel === "Sign out",
  );
  row.props.onPress();
  assert.equal(requested, 1);
  assert.equal(
    nodes(ProfileAccountActions(props)).some((node) => node.type === "section"),
    false,
  );
  const locked = nodes(
    ProfileAccountActions({ ...props, disabled: true }),
  ).find((node) => node.props.accessibilityLabel === "Sign out");
  assert.equal(locked.props.disabled, true);
  assert.equal(locked.props.accessibilityState.disabled, true);
});

test("keyboard overlap follows measured content bounds and clears on hide", () => {
  const listeners = new Map();
  let removed = 0,
    animations = 0;
  const runtime = hookRuntime(
    "../hooks/profile/useProfileKeyboardInset.ts",
    {
      "react-native": {
        View: "view",
        Platform: { OS: "ios" },
        Keyboard: {
          metrics: () => undefined,
          scheduleLayoutAnimation: () => {
            animations++;
          },
          addListener: (name, listener) => {
            listeners.set(name, listener);
            return {
              remove() {
                removed++;
              },
            };
          },
        },
      },
    },
    () => undefined,
  );
  runtime.render().containerRef.current = {
    measureInWindow: (callback) => callback(0, 83, 402, 733),
  };
  runtime.render().onLayout();
  runtime.flushEffects();
  assert.equal(runtime.render().bottomInset, 0);
  listeners.get("keyboardWillChangeFrame")({
    endCoordinates: { screenY: 539 },
  });
  assert.equal(runtime.render().bottomInset, 277);
  assert.equal(animations, 1);
  runtime.render().containerRef.current = {
    measureInWindow: (callback) => callback(0, 83, 402, 456),
  };
  runtime.render().onLayout();
  assert.equal(runtime.render().bottomInset, 0);
  listeners.get("keyboardDidHide")();
  assert.equal(runtime.render().bottomInset, 0);
  runtime.dispose();
  assert.equal(removed, 2);
});

test("web keyboard compatibility does not require native metrics APIs", () => {
  const runtime = hookRuntime(
    "../hooks/profile/useProfileKeyboardInset.ts",
    {
      "react-native": {
        View: "view",
        Platform: { OS: "web" },
        Keyboard: { addListener: () => ({ remove() {} }) },
      },
    },
    () => undefined,
  );
  assert.equal(runtime.render().bottomInset, 0);
  runtime.flushEffects();
  runtime.dispose();
});

test("Profile's shared field adapter preserves native input behavior, errors, and clearing", () => {
  let focused = false;
  const values = [];
  const { ProfileField } = loadWithMocks(
    fileURLToPath(
      new URL("../components/profile/ProfileField.tsx", import.meta.url),
    ),
    {
      react: {
        useState: () => [
          focused,
          (value) => {
            focused = value;
          },
        ],
      },
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": { TouchableOpacity: "button" },
      "@expo/vector-icons": { Ionicons: "icon" },
      "../ui/fields/BaseField": { BaseField: "field" },
    },
  );
  const props = {
    icon: "call-outline",
    label: "Phone number",
    value: "123",
    placeholder: "Enter your phone number",
    keyboardType: "phone-pad",
    autoComplete: "tel",
    maxLength: 24,
    error: "Check this number",
    onChangeText: (value) => values.push(value),
  };
  const field = ProfileField(props);
  assert.equal(field.props.keyboardType, "phone-pad");
  assert.equal(field.props.autoComplete, "tel");
  assert.equal(field.props.maxLength, 24);
  assert.equal(field.props.error, "Check this number");
  field.props.trailing.props.onPress();
  assert.deepEqual(values, [""]);
  field.props.onFocus();
  assert.equal(ProfileField(props).props.focused, true);
  field.props.onBlur();
  assert.equal(ProfileField(props).props.focused, false);
  assert.equal(
    ProfileField({ ...props, editable: false }).props.trailing,
    null,
  );
});
