import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../components/ui/Screen";
import { ModuleHeader } from "../../components/ui/ModuleHeader";
import { SecondaryBackButton } from "../../components/navigation/SecondaryBackButton";
import { Button } from "../../components/ui/buttons/Button";
import { BaseField } from "../../components/ui/fields/BaseField";
import { OwnerForm } from "../../components/owners/OwnerForm";
import { useAccess } from "../../hooks/auth/useAccess";
import { useAuth } from "../../hooks/useAuth";
import {
  useOwnerDetail,
  useOwnerList,
  useOwnerProperties,
} from "../../hooks/api/useOwnerManagement";
import { appRoutes } from "../../constants/navigation";

function OwnerManagement() {
  const { ownerId } = useLocalSearchParams<{ ownerId?: string }>();
  const [selectedId, setSelectedId] = useState<string | undefined>(ownerId);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [propertyPage, setPropertyPage] = useState(1);
  const list = useOwnerList(page, filter);
  const detail = useOwnerDetail(selectedId);
  const properties = useOwnerProperties(selectedId, propertyPage);
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  function select(id?: string) {
    setSelectedId(id);
    setPropertyPage(1);
    setFormMode(null);
  }
  const header = (
    <ModuleHeader
      title="Property Owners"
      supportingText="Manage the owners of your portfolio properties."
      leading={
        <SecondaryBackButton fallbackRoute={appRoutes.primary.properties} />
      }
    />
  );
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {header}
        {formMode ? (
          <OwnerForm
            key={formMode === "edit" ? selectedId : "new"}
            owner={formMode === "edit" ? detail.data : undefined}
            onCancel={() => setFormMode(null)}
            onSaved={(owner) => select(owner.id)}
          />
        ) : selectedId ? (
          <>
            <Button
              title="Back to owners"
              variant="secondary"
              onPress={() => select()}
            />
            {detail.isPending ? (
              <ActivityIndicator />
            ) : detail.data ? (
              <View className="gap-3 rounded-2xl bg-panel p-4">
                <Text className="font-ralewayBold text-lg text-textPrimary">
                  {detail.data.name}
                </Text>
                <Text className="text-textPrimary">
                  {detail.data.contactEmail}
                </Text>
                <Text className="text-textPrimary">{detail.data.phone}</Text>
                {detail.data.createdAt ? (
                  <Text className="text-description">
                    Added {new Date(detail.data.createdAt).toLocaleDateString()}
                  </Text>
                ) : null}
                <Button
                  title="Edit owner"
                  onPress={() => setFormMode("edit")}
                />
                <Text className="font-ralewayBold text-textPrimary">
                  Linked properties
                </Text>
                {properties.isPending ? (
                  <ActivityIndicator />
                ) : properties.isError ? (
                  <>
                    <Text className="text-red-600">
                      {properties.error.message}
                    </Text>
                    <Button
                      title="Retry linked properties"
                      onPress={() => {
                        void properties.refetch();
                      }}
                    />
                  </>
                ) : (
                  <>
                    {properties.data?.records.map((property) => (
                      <Button
                        key={property.id}
                        title={`${property.title} · ${property.location}`}
                        variant="secondary"
                        onPress={() =>
                          router.push({
                            pathname: appRoutes.secondary.propertyDetails,
                            params: { propertyId: property.id },
                          })
                        }
                      />
                    ))}
                    {!properties.data?.records.length ? (
                      <Text className="text-description">
                        No active properties assigned to this owner.
                      </Text>
                    ) : null}
                    {propertyPage > 1 ? (
                      <Button
                        title="Previous properties"
                        onPress={() => setPropertyPage(propertyPage - 1)}
                      />
                    ) : null}
                    {properties.data?.next_page ? (
                      <Button
                        title="Next properties"
                        onPress={() =>
                          setPropertyPage(properties.data!.next_page!)
                        }
                      />
                    ) : null}
                  </>
                )}
              </View>
            ) : (
              <>
                <Text className="text-red-600">
                  {detail.error?.message ?? "Owner unavailable."}
                </Text>
                <Button
                  title="Retry owner"
                  onPress={() => {
                    void detail.refetch();
                  }}
                />
              </>
            )}
            <Button
              title="Refresh owner"
              variant="secondary"
              disabled={detail.isFetching || properties.isFetching}
              onPress={() => {
                void detail.refetch();
                void properties.refetch();
              }}
            />
          </>
        ) : (
          <>
            <Button title="Add owner" onPress={() => setFormMode("create")} />
            <BaseField
              label="Search owners by name"
              value={search}
              onChangeText={setSearch}
              maxLength={100}
            />
            {list.isPending ? (
              <ActivityIndicator />
            ) : list.isError ? (
              <>
                <Text className="text-red-600">{list.error.message}</Text>
                <Button
                  title="Retry owners"
                  onPress={() => {
                    void list.refetch();
                  }}
                />
              </>
            ) : (
              <>
                {list.data?.records.map((owner) => (
                  <Button
                    key={owner.id}
                    title={owner.name}
                    variant="secondary"
                    onPress={() => select(owner.id)}
                  />
                ))}
                {!list.data?.records.length ? (
                  <Text className="text-description">
                    {filter
                      ? "No owners match your search."
                      : "No property owners yet. Add an owner to assign them to a property."}
                  </Text>
                ) : null}
                {page > 1 ? (
                  <Button
                    title="Previous owners"
                    onPress={() => setPage(page - 1)}
                  />
                ) : null}
                {list.data?.nextPage ? (
                  <Button
                    title="Next owners"
                    onPress={() => setPage(list.data!.nextPage!)}
                  />
                ) : null}
              </>
            )}
            <Button
              title="Refresh owners"
              variant="secondary"
              disabled={list.isFetching}
              onPress={() => {
                void list.refetch();
              }}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

export default function PropertyOwnersScreen() {
  const { access } = useAccess();
  const { session } = useAuth();
  if (access.role !== "ADMIN")
    return (
      <Screen>
        <Text className="text-textPrimary">
          Property owner management requires an administrator.
        </Text>
        <SecondaryBackButton fallbackRoute={appRoutes.primary.properties} />
      </Screen>
    );
  return <OwnerManagement key={session?.accessToken} />;
}
