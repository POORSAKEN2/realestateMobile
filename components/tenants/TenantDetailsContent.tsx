import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type {
  Lessee,
  PropertyDocument,
  TenantFinancialLedger,
  TenantNote,
} from "../../types";
import { formatCurrency } from "../../utils/formatters";
import { TenantDocumentsSection } from "./TenantDocumentsSection";
import { TenantFinancialLedgerSection } from "./TenantFinancialLedgerSection";
import { TenantNotesSection } from "./TenantNotesSection";

export type TenantDetailsContentProps = {
  documents: PropertyDocument[];
  documentsError: unknown;
  isLoadingDocuments: boolean;
  isLoadingLedger: boolean;
  ledger: TenantFinancialLedger;
  ledgerError: unknown;
  linkedLeaseCount?: number;
  monthlyRent?: number;
  onAddDocument: () => void;
  onAddNote: () => void;
  onClose: () => void;
  onDeleteNote: (note: TenantNote) => void;
  onEditNote: (note: TenantNote) => void;
  onLoadMoreNotes: () => void;
  onOpenDocument: (document: PropertyDocument) => void;
  onSelectDocument: () => void;
  onViewAllDocuments: () => void;
  propertyNames: string[];
  tenant: Lessee;
  tenantNotes: TenantNote[];
  tenantNotesError: unknown;
  tenantNotesHasNextPage: boolean;
  tenantNotesIsFetchingNextPage: boolean;
  tenantNotesIsLoading: boolean;
};

export function TenantDetailsContent({
  documents,
  documentsError,
  isLoadingDocuments,
  isLoadingLedger,
  ledger,
  ledgerError,
  linkedLeaseCount,
  monthlyRent,
  onAddDocument,
  onAddNote,
  onClose,
  onDeleteNote,
  onEditNote,
  onLoadMoreNotes,
  onOpenDocument,
  onSelectDocument,
  onViewAllDocuments,
  propertyNames,
  tenant,
  tenantNotes,
  tenantNotesError,
  tenantNotesHasNextPage,
  tenantNotesIsFetchingNextPage,
  tenantNotesIsLoading,
}: TenantDetailsContentProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="overflow-hidden rounded-t-[30px] bg-white"
      style={{ maxHeight: height * 0.84 }}
    >
      <ScrollView
        bounces={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pb-2">
          <View className="flex-row items-start gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Text className="font-ralewayExtraBold text-xl text-secondary">
                {getTenantInitials(tenant.name)}
              </Text>
            </View>
            <View className="min-w-0 flex-1 pt-0.5">
              <Text className="font-ralewayExtraBold text-2xl text-textPrimary">
                {tenant.name}
              </Text>
              <Text className="mt-1 font-ralewaySemiBold text-xs uppercase tracking-wider text-description">
                Tenant profile
              </Text>
            </View>
            <TouchableOpacity
              accessibilityLabel="Close tenant details"
              accessibilityRole="button"
              activeOpacity={0.75}
              className="h-10 w-10 items-center justify-center rounded-full bg-primary/10"
              onPress={onClose}
            >
              <Ionicons color="#8A77F4" name="close" size={20} />
            </TouchableOpacity>
          </View>

          {linkedLeaseCount !== undefined || monthlyRent !== undefined ? (
            <View className="mt-6 flex-row gap-3">
              {linkedLeaseCount !== undefined ? (
                <Metric
                  label="Linked leases"
                  value={String(linkedLeaseCount)}
                />
              ) : null}
              {monthlyRent !== undefined ? (
                <Metric
                  label="Monthly rent"
                  value={formatCurrency(monthlyRent)}
                />
              ) : null}
            </View>
          ) : null}

          <Text className="mb-3 mt-6 font-ralewayExtraBold text-xs uppercase tracking-wider text-description">
            Contact details
          </Text>
          <View className="gap-3">
            <ContactRow
              icon="mail-outline"
              label="Email"
              value={tenant.contactEmail || "No email on file"}
            />
            <ContactRow
              icon="call-outline"
              label="Phone"
              value={tenant.phone || "No phone on file"}
            />
          </View>

          {propertyNames.length > 0 ? (
            <LinkedProperties propertyNames={propertyNames} />
          ) : null}

          <TenantFinancialLedgerSection
            error={ledgerError}
            isLoading={isLoadingLedger}
            ledger={ledger}
          />

          <TenantDocumentsSection
            documents={documents}
            error={documentsError}
            isLoading={isLoadingDocuments}
            onAdd={onAddDocument}
            onOpen={onOpenDocument}
            onSelect={onSelectDocument}
            onViewAll={onViewAllDocuments}
          />

          <TenantNotesSection
            error={tenantNotesError}
            hasNextPage={tenantNotesHasNextPage}
            isFetchingNextPage={tenantNotesIsFetchingNextPage}
            isLoading={tenantNotesIsLoading}
            notes={tenantNotes}
            onAdd={onAddNote}
            onDelete={onDeleteNote}
            onEdit={onEditNote}
            onLoadMore={onLoadMoreNotes}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function getTenantInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "T"
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-0 flex-1 rounded-2xl border border-primary/20 bg-primary/10 p-4">
      <Text className="font-ralewayExtraBold text-[10px] uppercase tracking-wider text-description">
        {label}
      </Text>
      <Text
        adjustsFontSizeToFit
        className="mt-1 font-ralewayExtraBold text-xl text-textPrimary"
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        <Ionicons color="#8A77F4" name={icon} size={19} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-ralewayExtraBold text-[10px] uppercase tracking-wider text-description">
          {label}
        </Text>
        <Text
          className="mt-1 font-ralewaySemiBold text-sm text-textPrimary"
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function LinkedProperties({ propertyNames }: { propertyNames: string[] }) {
  return (
    <>
      <Text className="mb-3 mt-6 font-ralewayExtraBold text-xs uppercase tracking-wider text-description">
        Linked properties
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {propertyNames.map((propertyName) => (
          <View
            className="max-w-full flex-row items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-2"
            key={propertyName}
          >
            <Ionicons color="#8A77F4" name="business-outline" size={14} />
            <Text
              className="min-w-0 font-ralewayBold text-xs text-textPrimary"
              numberOfLines={1}
            >
              {propertyName}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}
