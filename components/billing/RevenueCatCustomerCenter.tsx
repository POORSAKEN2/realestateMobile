import { Component, useEffect, useState, type PropsWithChildren } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import RevenueCatUI from "react-native-purchases-ui";

import { colors } from "../../constants/colors";
import { useAccess } from "../../hooks/auth/useAccess";
import { useAuth } from "../../hooks/useAuth";
import { useRevenueCat } from "../../hooks/useRevenueCat";
import { Button } from "../ui/buttons/Button";

class CustomerCenterBoundary extends Component<
  PropsWithChildren<{ onRetry: () => void }>,
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <CustomerCenterFailure
        message={`Subscription management could not load. ${this.state.error.message || "Please try again."} If the native UI module is missing, install a rebuilt development app.`}
        onRetry={this.props.onRetry}
      />
    ) : (
      this.props.children
    );
  }
}

function CustomerCenterFailure({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View className="gap-4 p-6">
      <Text accessibilityRole="alert" className="text-sm leading-6 text-danger">
        {message}
      </Text>
      <Button
        title="Retry subscription management"
        variant="secondary"
        onPress={onRetry}
      />
    </View>
  );
}

// Embedded native view avoids asking iOS to present a second controller from
// the root controller while UpgradePlanModal already occupies that presenter.
export function RevenueCatCustomerCenter({ onClose }: { onClose: () => void }) {
  const { can } = useAccess();
  const { session } = useAuth();
  const { prepareCustomerCenter, receiveCustomerCenterInfo } = useRevenueCat();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    readyFor: string | null;
    error: string | null;
  }>({ readyFor: null, error: null });
  const token = session?.accessToken ?? null;
  const allowed = can("billing.checkout");
  useEffect(() => {
    let disposed = false;
    setState({ readyFor: null, error: null });
    if (!allowed || !token) return;
    void prepareCustomerCenter().then(
      () => {
        if (!disposed) setState({ readyFor: token, error: null });
      },
      (error) => {
        if (!disposed)
          setState({
            readyFor: null,
            error:
              error instanceof Error
                ? error.message
                : "Subscription management unavailable.",
          });
      },
    );
    return () => {
      disposed = true;
    };
  }, [allowed, token, attempt, prepareCustomerCenter]);
  const retry = () => setAttempt((value) => value + 1);
  if (!allowed || !token)
    return (
      <Text className="p-6 text-sm text-description">
        An administrator must sign in to manage this subscription.
      </Text>
    );
  if (state.error)
    return <CustomerCenterFailure message={state.error} onRetry={retry} />;
  if (state.readyFor !== token)
    return (
      <View className="flex-1 items-center justify-center gap-3 p-6">
        <ActivityIndicator
          color={colors.primary}
          accessibilityLabel="Preparing subscription management"
        />
        <Text className="text-sm text-description">
          Opening subscription management…
        </Text>
      </View>
    );
  return (
    <CustomerCenterBoundary key={`${token}:${attempt}`} onRetry={retry}>
      <RevenueCatUI.CustomerCenterView
        style={{ flex: 1 }}
        shouldShowCloseButton={false}
        onDismiss={onClose}
        onRestoreCompleted={({ customerInfo }) =>
          receiveCustomerCenterInfo(customerInfo)
        }
        onPromotionalOfferSucceeded={({ customerInfo }) =>
          receiveCustomerCenterInfo(customerInfo)
        }
      />
    </CustomerCenterBoundary>
  );
}
