import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { usePropertyManagerAssignments } from "../../hooks/properties/usePropertyManagerAssignments";
import { Button } from "../ui/buttons/Button";
import { SearchField } from "../ui/fields/SearchField";
import { SelectionCheckbox } from "../ui/SelectionCheckbox";
import { SkeletonBlock } from "../ui/Skeleton";
import { PropertyAdminSection } from "./PropertyAdminSection";

export function PropertyManagerAssignments({
  propertyId,
}: {
  propertyId: string;
}) {
  const assignments = usePropertyManagerAssignments(propertyId);
  const [search, setSearch] = useState("");
  const managers = assignments.roster.data?.managers ?? [];
  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? managers.filter((manager) => manager.name.toLowerCase().includes(term))
      : managers;
  }, [managers, search]);
  const loading =
    assignments.property.isPending || assignments.roster.isPending;
  const failed =
    assignments.property.isError ||
    assignments.roster.isError ||
    assignments.unavailable;
  return (
    <PropertyAdminSection
      title="Assigned managers"
      description="Choose which team members can access this property."
      icon="users"
      accessory={
        !loading && !failed ? (
          <View className="rounded-full bg-primary/10 px-2.5 py-1">
            <Text className="font-ralewayBold text-xs text-primary">
              {assignments.selectedIds.size}
            </Text>
          </View>
        ) : undefined
      }
    >
      {loading ? (
        <View accessibilityLabel="Loading assignments" className="gap-3">
          <SkeletonBlock className="h-5 w-2/3" />
          <SkeletonBlock className="h-12 w-full" />
        </View>
      ) : failed ? (
        <>
          <Text accessibilityRole="alert" className="text-sm text-danger">
            {assignments.property.error?.message ??
              assignments.roster.error?.message ??
              "Complete manager assignments could not be loaded."}
          </Text>
          <Button
            title="Retry assignments"
            variant="secondary"
            onPress={() => {
              void assignments.reload();
            }}
          />
        </>
      ) : assignments.editing ? (
        <>
          <SearchField
            clearAccessibilityLabel="Clear manager search"
            placeholder="Find a manager"
            value={search}
            onChangeText={setSearch}
            editable={!assignments.save.isPending}
          />
          <View className="gap-2">
            {matches.map((manager) => (
              <SelectionCheckbox
                key={manager.id}
                label={`${manager.name}${manager.status === "disabled" ? " · Disabled account" : ""}`}
                selected={assignments.selectedIds.has(manager.id)}
                disabled={assignments.save.isPending}
                onPress={() => assignments.toggle(manager.id)}
              />
            ))}
          </View>
          {!matches.length ? (
            <Text className="text-sm text-description">
              No managers match your search.
            </Text>
          ) : null}
          <Button
            title="Save assignments"
            disabled={!assignments.dirty || assignments.unavailable}
            isLoading={assignments.save.isPending}
            onPress={() => assignments.save.mutate()}
          />
          <Button
            title="Cancel changes"
            variant="secondary"
            disabled={assignments.save.isPending}
            onPress={() => {
              assignments.cancel();
              setSearch("");
            }}
          />
        </>
      ) : (
        <>
          {assignments.property.data?.managers?.length ? (
            <View className="flex-row flex-wrap gap-2">
              {assignments.property.data.managers.map((manager) => (
                <View
                  key={manager.id}
                  className="rounded-xl bg-surface px-3 py-2"
                >
                  <Text className="font-ralewaySemiBold text-sm text-textPrimary">
                    {manager.name}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm leading-5 text-description">
              No managers assigned. Only administrators currently manage this
              property.
            </Text>
          )}
          {managers.length ? (
            <Button
              title="Edit manager assignments"
              variant="secondary"
              onPress={assignments.edit}
            />
          ) : (
            <Text className="text-sm leading-5 text-description">
              Create a manager in Team & Access to assign them here.
            </Text>
          )}
        </>
      )}
      {assignments.save.error ? (
        <Text accessibilityRole="alert" className="text-sm text-danger">
          {assignments.save.error.message}
        </Text>
      ) : null}
      {assignments.notice ? (
        <Text accessibilityLiveRegion="polite" className="text-sm text-success">
          {assignments.notice}
        </Text>
      ) : null}
    </PropertyAdminSection>
  );
}
