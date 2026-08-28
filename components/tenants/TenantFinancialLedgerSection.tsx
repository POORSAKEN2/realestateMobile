import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import type { TenantFinancialLedger } from "../../types";
import { formatCurrency } from "../../utils/formatters";
import {
  formatTenantDetailDate,
  getPaymentStatusStyle,
} from "../../utils/tenants/tenantDetails";
import { SkeletonBlock, SkeletonGroup } from "../ui/Skeleton";

export function TenantFinancialLedgerSection({
  error,
  isLoading,
  ledger,
}: {
  error: unknown;
  isLoading: boolean;
  ledger: TenantFinancialLedger;
}) {
  return (
    <TenantSection icon="card-outline" title="Financial ledger">
      {isLoading ? (
        <SkeletonGroup accessibilityLabel="Loading financial ledger">
          <View className="flex-row gap-2 rounded-2xl border border-primary/20 bg-white p-4">
            {Array.from({ length: 3 }, (_, index) => (
              <View className="flex-1 gap-2" key={index}>
                <SkeletonBlock className="h-3 w-16" />
                <SkeletonBlock className="h-5 w-20 bg-primary/15" />
              </View>
            ))}
          </View>
          <SkeletonBlock className="mt-3 h-20 rounded-2xl" />
        </SkeletonGroup>
      ) : error ? (
        <DetailError message="Financial ledger could not be loaded." />
      ) : (
        <>
          <View className="flex-row rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <LedgerMetric label="Outstanding" value={ledger.totalOutstanding} />
            <LedgerMetric label="Overdue" value={ledger.totalOverdue} />
            <LedgerMetric label="Paid to date" value={ledger.totalPaid} />
          </View>

          {ledger.payments.length ? (
            <View className="mt-3 overflow-hidden rounded-2xl border border-primary/20 bg-white">
              {ledger.payments.slice(0, 6).map((payment, index) => {
                const statusStyle = getPaymentStatusStyle(payment.status);
                return (
                  <View
                    className={`p-4 ${index ? "border-t border-primary/10" : ""}`}
                    key={payment.id}
                  >
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="min-w-0 flex-1">
                        <Text className="font-ralewayExtraBold text-sm text-textPrimary">
                          {formatCurrency(payment.amount)}
                        </Text>
                        <Text className="mt-1 font-ralewayMedium text-xs text-description">
                          Due {formatTenantDetailDate(payment.dueDate)}
                        </Text>
                        <Text className="mt-1 font-ralewayMedium text-[11px] text-description">
                          {payment.paymentMethod || payment.type}
                        </Text>
                      </View>
                      <View
                        className="rounded-full px-3 py-1.5"
                        style={{ backgroundColor: statusStyle.backgroundColor }}
                      >
                        <Text
                          className="font-ralewayExtraBold text-[10px] uppercase"
                          style={{ color: statusStyle.color }}
                        >
                          {payment.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
              {ledger.payments.length > 6 ? (
                <Text className="border-t border-primary/10 px-4 py-3 text-center font-ralewaySemiBold text-xs text-description">
                  Showing 6 of {ledger.payments.length} ledger entries
                </Text>
              ) : null}
            </View>
          ) : (
            <View className="mt-3 items-center rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-6">
              <Ionicons color="#8A77F4" name="receipt-outline" size={28} />
              <Text className="mt-2 font-ralewayBold text-sm text-textPrimary">
                No ledger entries
              </Text>
              <Text className="mt-1 text-center font-ralewayMedium text-xs text-description">
                Payments appear when this tenant has a linked lease.
              </Text>
            </View>
          )}
        </>
      )}
    </TenantSection>
  );
}

function LedgerMetric({ label, value }: { label: string; value: number }) {
  return (
    <View className="min-w-0 flex-1 px-1">
      <Text className="font-ralewayExtraBold text-[9px] uppercase tracking-wider text-description">
        {label}
      </Text>
      <Text
        adjustsFontSizeToFit
        className="mt-1 font-ralewayExtraBold text-sm text-textPrimary"
        numberOfLines={1}
      >
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

export function TenantSection({
  children,
  icon,
  title,
}: {
  children: React.ReactNode;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View className="mt-7">
      <View className="mb-3 flex-row items-center gap-2">
        <Ionicons color="#8A77F4" name={icon} size={18} />
        <Text className="font-ralewayExtraBold text-xs uppercase tracking-wider text-description">
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

export function DetailError({ message }: { message: string }) {
  return (
    <View className="rounded-2xl border border-danger/20 bg-dangerSurface p-4">
      <Text className="font-ralewayBold text-sm text-danger">{message}</Text>
    </View>
  );
}
