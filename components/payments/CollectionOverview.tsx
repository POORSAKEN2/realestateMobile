import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useThemeColors } from "../../context/WorkspacePresentationContext";
import { getPaymentStatusPresentation } from "../../constants/paymentStatusPresentation";
import type {
  PaymentBucket,
  PaymentOverview,
} from "../../types/domain/payments";
import {
  formatCurrency,
  formatDate,
  formatLocalizedDate,
} from "../../utils/formatters";
import { parseDateValue } from "../../utils/expenses/expenseForm";

const paymentCount = (count: number) =>
  `${count} payment${count === 1 ? "" : "s"}`;

export function CollectionOverview({
  data,
  loading,
  error,
  onRetry,
  onSelect,
}: {
  data?: PaymentOverview;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  onSelect: (bucket: PaymentBucket) => void;
}) {
  const palette = useThemeColors();
  const hero = palette.primaryStrong;
  if (!data)
    return (
      <View className="mt-4 rounded-3xl border border-primary/20 bg-panel p-5">
        {loading ? (
          <>
            <ActivityIndicator color={palette.primary} />
            <Text className="mt-2 text-center text-description">
              Loading collection overview…
            </Text>
          </>
        ) : (
          <>
            <Text className="font-ralewayBold text-textPrimary">
              Collection overview unavailable
            </Text>
            <Text className="mt-1 text-sm text-description">
              {error?.message || "Try refreshing the overview."}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onRetry}
              className="mt-3 self-start rounded-xl bg-primary/10 px-4 py-2"
            >
              <Text className="font-ralewayBold text-textPrimary">
                Retry overview
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  const month = formatLocalizedDate(parseDateValue(data.collectionMonthStart), {
    month: "long",
    year: "numeric",
  });
  const pending = getPaymentStatusPresentation("Pending");
  const paid = getPaymentStatusPresentation("Paid");
  return (
    <View className="mt-4 gap-3">
      <View>
        <Text className="font-ralewayBold text-lg text-textPrimary">
          Collection overview
        </Text>
        <Text className="mt-1 text-xs text-description">
          All payment types · All accessible properties
        </Text>
      </View>
      {error ? (
        <TouchableOpacity accessibilityRole="button" onPress={onRetry}>
          <Text className="text-sm text-description">
            Could not refresh. Showing last overview. Tap to retry.
          </Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`View overdue: ${formatCurrency(data.overdue.amount)}, ${paymentCount(data.overdue.count)}`}
        activeOpacity={0.85}
        onPress={() => onSelect("overdue")}
        style={{ backgroundColor: hero }}
        className="rounded-3xl p-5"
      >
        <View className="flex-row items-center justify-between">
          <Text
            style={{ color: palette.whitePrimary }}
            className="font-ralewayBold text-sm"
          >
            Overdue
          </Text>
          <Ionicons
            name="alert-circle-outline"
            size={24}
            color={palette.whitePrimary}
          />
        </View>
        <Text
          style={{ color: palette.whitePrimary }}
          className="mt-2 font-ralewayExtraBold text-3xl"
        >
          {formatCurrency(data.overdue.amount)}
        </Text>
        <View className="mt-3 flex-row flex-wrap items-center justify-between gap-2">
          <Text
            style={{ color: palette.whitePrimary }}
            className="font-ralewayMedium text-xs"
          >
            {paymentCount(data.overdue.count)} · Includes older arrears
          </Text>
          <Text
            style={{ color: palette.whitePrimary }}
            className="font-ralewayBold text-xs"
          >
            View overdue ›
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.85}
        onPress={() => onSelect("upcoming")}
        className={`rounded-2xl border p-4 ${pending.containerClass}`}
      >
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <View>
            <Text className="font-ralewayBold text-sm text-textPrimary">
              Due next 7 days
            </Text>
            <Text className="mt-1 text-xs text-description">
              {paymentCount(data.upcoming.count)} · View upcoming ›
            </Text>
          </View>
          <Text className="font-ralewayExtraBold text-xl text-textPrimary">
            {formatCurrency(data.upcoming.amount)}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.85}
        onPress={() => onSelect("collected")}
        className={`rounded-2xl border px-4 py-3 ${paid.containerClass}`}
      >
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <View>
            <Text className="font-ralewayBold text-sm text-success">
              Collected · {month}
            </Text>
            <Text className="mt-1 text-xs text-success">
              {paymentCount(data.collected.count)} · View collections ›
            </Text>
          </View>
          <Text className="font-ralewayExtraBold text-lg text-success">
            {formatCurrency(data.collected.amount)}
          </Text>
        </View>
      </TouchableOpacity>
      <Text className="text-sm text-textPrimary">
        Total outstanding: {formatCurrency(data.outstanding.amount)} ·{" "}
        {paymentCount(data.outstanding.count)}
      </Text>
      <Text className="text-xs text-description">
        As of {formatDate(parseDateValue(data.reportingDate))} ({data.timezone}
        ). Outstanding includes later due dates.
      </Text>
    </View>
  );
}
