import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { Animated, Easing, View } from "react-native";

type RunAfterExit = (action: () => void) => void;

const transition = {
  copyDelay: 30,
  copyEnterDuration: 120,
  copyExitDuration: 80,
  visualEnterDuration: 180,
  visualExitDuration: 120,
  visualOffset: 32,
} as const;

const OnboardingTransitionContext = createContext<RunAfterExit>((action) =>
  action(),
);

export function useOnboardingTransition() {
  return useContext(OnboardingTransitionContext);
}

type OnboardingStepTransitionProps = {
  copy: ReactNode;
  footer: ReactNode;
  visual: ReactNode;
};

export function OnboardingStepTransition({
  copy,
  footer,
  visual,
}: OnboardingStepTransitionProps) {
  const visualTranslateX = useRef(
    new Animated.Value(transition.visualOffset),
  ).current;
  const visualOpacity = useRef(new Animated.Value(0)).current;
  const copyOpacity = useRef(new Animated.Value(0)).current;
  const isExiting = useRef(false);

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(visualTranslateX, {
        duration: transition.visualEnterDuration,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(visualOpacity, {
        duration: transition.visualEnterDuration,
        easing: Easing.out(Easing.quad),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(transition.copyDelay),
        Animated.timing(copyOpacity, {
          duration: transition.copyEnterDuration,
          easing: Easing.out(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start();

    return () => animation.stop();
  }, [copyOpacity, visualOpacity, visualTranslateX]);

  const runAfterExit = useCallback<RunAfterExit>(
    (action) => {
      if (isExiting.current) {
        return;
      }

      isExiting.current = true;
      Animated.parallel([
        Animated.timing(copyOpacity, {
          duration: transition.copyExitDuration,
          easing: Easing.in(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(visualTranslateX, {
          duration: transition.visualExitDuration,
          easing: Easing.in(Easing.cubic),
          toValue: -transition.visualOffset,
          useNativeDriver: true,
        }),
        Animated.timing(visualOpacity, {
          duration: transition.visualExitDuration,
          easing: Easing.in(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          action();
          return;
        }

        isExiting.current = false;
      });
    },
    [copyOpacity, visualOpacity, visualTranslateX],
  );

  return (
    <OnboardingTransitionContext.Provider value={runAfterExit}>
      <Animated.View
        className="flex-1"
        style={{
          opacity: visualOpacity,
          transform: [{ translateX: visualTranslateX }],
        }}
      >
        {visual}
      </Animated.View>
      <Animated.View style={{ opacity: copyOpacity }}>{copy}</Animated.View>
      <View className="pt-8">{footer}</View>
    </OnboardingTransitionContext.Provider>
  );
}
