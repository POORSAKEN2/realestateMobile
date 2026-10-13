import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import loadWithMocks from "./helpers/loadWithMocks.cjs";

const feedback = () => ({
  title: "Unable to sign in",
  message: "Terrane is temporarily unavailable. Please try again shortly.",
  retryable: true,
  retryAfterSeconds: 30,
});

function setup(platform = "ios") {
  const state = [];
  const refs = [];
  let cursor = 0;
  let retries = 0;
  let keyboardDismissals = 0;
  const jsx = (type, props) => ({ type, props });
  const { AuthErrorPopup } = loadWithMocks(
    fileURLToPath(
      new URL("../components/auth/AuthErrorPopup.tsx", import.meta.url),
    ),
    {
      react: {
        useState(initial) {
          const index = cursor++;
          if (!(index in state)) state[index] = initial;
          return [
            state[index],
            (value) => {
              state[index] = value;
            },
          ];
        },
        useRef(initial) {
          const index = cursor++;
          return refs[index] ?? (refs[index] = { current: initial });
        },
        useEffect(effect) {
          effect();
        },
      },
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": {
        Modal: "modal",
        View: "view",
        ScrollView: "scroll",
        Keyboard: {
          dismiss() {
            keyboardDismissals++;
          },
        },
        Platform: { OS: platform },
        useWindowDimensions: () => ({ height: 320 }),
      },
      "react-native-safe-area-context": {
        useSafeAreaInsets: () => ({ top: 59, bottom: 34 }),
      },
      "./AuthErrorFeedback": { AuthErrorFeedback: "feedback" },
      "./AuthDialog": { AuthDialog: "dialog" },
      "../../context/WorkspacePresentationContext": {
        useThemeColors: () => ({ panel: "#FFFFFF" }),
        getThemeVariables: () => ({ "--color-panel": "255 255 255" }),
      },
    },
  );
  return {
    render(error, disabled = false) {
      cursor = 0;
      return AuthErrorPopup({
        feedback: error,
        disabled,
        onRetry() {
          retries++;
        },
      });
    },
    card: (modal) => modal.props.children,
    get retries() {
      return retries;
    },
    get keyboardDismissals() {
      return keyboardDismissals;
    },
  };
}

test("dismissal hides only the current error and preserves throttling metadata", () => {
  const runtime = setup();
  const error = feedback();
  const modal = runtime.render(error);
  assert.equal(modal.props.visible, true);
  assert.equal(runtime.card(modal).props.feedback, error);
  runtime.card(modal).props.onDismiss();
  assert.equal(runtime.render(error).props.visible, false);
  modal.props.onDismiss();
  assert.equal(runtime.retries, 0);
  assert.equal(error.retryAfterSeconds, 30);
  assert.equal(runtime.render(feedback()).props.visible, true);
});

test("iOS retry waits for native popup dismissal and runs once", () => {
  const runtime = setup();
  const error = feedback();
  runtime.card(runtime.render(error)).props.onRetry();
  const dismissed = runtime.render(error);
  assert.equal(dismissed.props.visible, false);
  assert.equal(runtime.retries, 0);
  dismissed.props.onDismiss();
  dismissed.props.onDismiss();
  assert.equal(runtime.retries, 1);
});

test("busy retries stay locked; Android and web support retry and system dismissal", () => {
  for (const platform of ["android", "web"]) {
    const runtime = setup(platform);
    const error = feedback();
    runtime.card(runtime.render(error, true)).props.onRetry();
    assert.equal(runtime.retries, 0);
    assert.equal(runtime.render(error).props.visible, true);
    runtime.card(runtime.render(error)).props.onRetry();
    assert.equal(runtime.retries, 1);
    assert.equal(runtime.render(error).props.visible, false);
    const next = feedback();
    const modal = runtime.render(next);
    modal.props.onClose();
    assert.equal(runtime.render(next).props.visible, false);
  }
});

test("popup scroll area stays within screen safe areas", () => {
  const jsx = (type, props) => ({ type, props });
  const { AuthDialog } = loadWithMocks(
    fileURLToPath(
      new URL("../components/auth/AuthDialog.tsx", import.meta.url),
    ),
    {
      react: { useEffect: (effect) => effect() },
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "react-native": {
        Modal: "modal",
        View: "view",
        ScrollView: "scroll",
        Keyboard: { dismiss() {} },
        useWindowDimensions: () => ({ height: 320 }),
      },
      "react-native-safe-area-context": {
        useSafeAreaInsets: () => ({ top: 59, bottom: 34 }),
      },
      "../../context/WorkspacePresentationContext": {
        useThemeColors: () => ({}),
        getThemeVariables: () => ({ "--color-panel": "255 255 255" }),
      },
    },
  );
  const modal = AuthDialog({ visible: true, onClose() {} });
  const scroll = modal.props.children.props.children;
  assert.equal(scroll.props.accessibilityViewIsModal, true);
  assert.equal(scroll.props.style.maxHeight, 179);
  assert.equal(scroll.props.style.flexGrow, 0);
  assert.equal(
    modal.props.children.props.style[0]["--color-panel"],
    "255 255 255",
  );
});
