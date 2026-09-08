import Feather from "@expo/vector-icons/Feather";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";
import type { PropertyStatus, PropertyStatusHistoryEntry } from "../../types";
import {
  getPropertyLifecycleDescription,
  getPropertyLifecycleLabel,
  getPropertyLifecycleStepIndex,
  PROPERTY_LIFECYCLE_STEPS,
} from "../../utils/properties/propertyLifecycle";

type PropertyLifecyclePanelProps = {
  allowedTransitions: PropertyStatus[];
  canUpdate: boolean;
  currentStatus: PropertyStatus;
  error?: string;
  history: PropertyStatusHistoryEntry[];
  historyError?: string;
  isHistoryLoading: boolean;
  isPending: boolean;
  onRequestTransition: (status: PropertyStatus) => void;
};

function formatTransitionTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-PH", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PropertyLifecyclePanel({
  allowedTransitions,
  canUpdate,
  currentStatus,
  error,
  history,
  historyError,
  isHistoryLoading,
  isPending,
  onRequestTransition,
}: PropertyLifecyclePanelProps) {
  const currentStep = getPropertyLifecycleStepIndex(currentStatus);

  return (
    <View className="mt-5 rounded-[24px] border border-primary/20 bg-white p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-ralewayBold text-xs uppercase text-secondary">
            Property lifecycle
          </Text>
          <Text className="mt-1 font-ralewayExtraBold text-lg text-textPrimary">
            {getPropertyLifecycleLabel(currentStatus)}
          </Text>
          <Text className="mt-1 text-xs leading-5 text-description">
            {getPropertyLifecycleDescription(currentStatus)}
          </Text>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
          <Feather name="repeat" color={colors.primary} size={18} />
        </View>
      </View>

      <View className="mt-5 flex-row items-start">
        {PROPERTY_LIFECYCLE_STEPS.map((status, index) => {
          const isCurrent = status === currentStatus;
          const isReached = currentStep >= 0 && index <= currentStep;

          return (
            <View className="flex-1 items-center" key={status}>
              <View className="w-full flex-row items-center">
                {index > 0 ? (
                  <View
                    className={`h-0.5 flex-1 ${isReached ? "bg-primary" : "bg-primary/15"}`}
                  />
                ) : (
                  <View className="flex-1" />
                )}
                <View
                  className={`h-7 w-7 items-center justify-center rounded-full border ${
                    isCurrent
                      ? "border-primary bg-primary"
                      : isReached
                        ? "border-primary bg-primary/15"
                        : "border-primary/20 bg-surface"
                  }`}
                >
                  {isReached ? (
                    <Feather
                      name={isCurrent ? "map-pin" : "check"}
                      color={isCurrent ? colors.whitePrimary : colors.primary}
                      size={12}
                    />
                  ) : (
                    <Text className="font-ralewayBold text-[9px] text-description">
                      {index + 1}
                    </Text>
                  )}
                </View>
                {index < PROPERTY_LIFECYCLE_STEPS.length - 1 ? (
                  <View
                    className={`h-0.5 flex-1 ${currentStep > index ? "bg-primary" : "bg-primary/15"}`}
                  />
                ) : (
                  <View className="flex-1" />
                )}
              </View>
              <Text
                className={`mt-2 text-center font-ralewayBold text-[9px] ${isCurrent ? "text-primary" : "text-description"}`}
                numberOfLines={2}
              >
                {getPropertyLifecycleLabel(status)}
              </Text>
            </View>
          );
        })}
      </View>

      {currentStatus === "PERSONAL_USE" ? (
        <View className="mt-4 rounded-2xl bg-primary/10 px-3 py-2.5">
          <Text className="text-xs leading-5 text-description">
            Personal Use sits outside the four rental lifecycle stages. Return
            it to Planned or Revenue Generating when its use changes.
          </Text>
        </View>
      ) : null}

      <View className="mt-5 border-t border-primary/15 pt-4">
        <Text className="font-ralewayBold text-[10px] uppercase text-description">
          Allowed next states
        </Text>
        {canUpdate ? (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {allowedTransitions.map((status) => (
              <TouchableOpacity
                accessibilityLabel={`Move property to ${getPropertyLifecycleLabel(status)}`}
                accessibilityRole="button"
                activeOpacity={0.8}
                className="flex-row items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5"
                disabled={isPending}
                key={status}
                onPress={() => onRequestTransition(status)}
              >
                {isPending ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Feather
                    name="arrow-right"
                    color={colors.primary}
                    size={13}
                  />
                )}
                <Text className="font-ralewayBold text-xs text-primary">
                  {getPropertyLifecycleLabel(status)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text className="mt-2 text-xs leading-5 text-description">
            Your access allows viewing this lifecycle but not changing it.
          </Text>
        )}
        {error ? (
          <Text accessibilityRole="alert" className="mt-3 text-xs text-danger">
            {error}
          </Text>
        ) : null}
      </View>

      <View className="mt-5 border-t border-primary/15 pt-4">
        <Text className="font-ralewayBold text-[10px] uppercase text-description">
          Transition history
        </Text>
        {isHistoryLoading ? (
          <View className="mt-3 flex-row items-center gap-2">
            <ActivityIndicator color={colors.primary} size="small" />
            <Text className="text-xs text-description">Loading history…</Text>
          </View>
        ) : historyError ? (
          <Text accessibilityRole="alert" className="mt-2 text-xs text-danger">
            {historyError}
          </Text>
        ) : history.length ? (
          <View className="mt-3 gap-3">
            {history.slice(0, 5).map((entry) => (
              <View className="flex-row gap-3" key={entry.id}>
                <View className="mt-1 h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                  <Feather name="clock" color={colors.primary} size={13} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="font-ralewayBold text-xs text-textPrimary">
                    {getPropertyLifecycleLabel(entry.fromStatus)} →{" "}
                    {getPropertyLifecycleLabel(entry.toStatus)}
                  </Text>
                  <Text className="mt-0.5 text-[10px] text-description">
                    {formatTransitionTime(entry.createdAt)}
                    {entry.actorName ? ` · ${entry.actorName}` : ""}
                  </Text>
                  {entry.reason ? (
                    <Text className="mt-1 text-[11px] text-description">
                      {entry.reason}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text className="mt-2 text-xs leading-5 text-description">
            No lifecycle transitions recorded yet.
          </Text>
        )}
      </View>
    </View>
  );
}
