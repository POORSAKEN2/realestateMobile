import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { BottomSheetModal } from "../ui/BottomSheetModal";
import type { Lessee, Property, PropertyDocument } from "../../types";
import {
  DOCUMENT_CATEGORIES,
  type DocumentAdvancedFilters,
  type DocumentCategoryFilter,
} from "../../utils/documents/documentPresentation";
import { RadioOptionList } from "../ui/groups/RadioOptionList";
import {
  SearchFilterActions,
  SearchFilterSection,
} from "../ui/SearchFilterSheet";
import {
  SearchableOptionSelector,
  SelectionField,
} from "./SearchableOptionSelector";

type SelectorMode = "property" | "tenant" | null;

const documentTypes: Array<PropertyDocument["type"] | "All"> = [
  "All",
  "PDF",
  "DOCX",
  "JPG",
  "PNG",
];

export function DocumentFilterSheet({
  category,
  filters,
  lessees,
  onApply,
  onClose,
  properties,
  visible,
}: {
  category: DocumentCategoryFilter;
  filters: DocumentAdvancedFilters;
  lessees: Lessee[];
  onApply: (
    filters: DocumentAdvancedFilters,
    category: DocumentCategoryFilter,
  ) => void;
  onClose: () => void;
  properties: Property[];
  visible: boolean;
}) {
  const [draft, setDraft] = useState(filters);
  const [draftCategory, setDraftCategory] = useState(category);
  const [selectorMode, setSelectorMode] = useState<SelectorMode>(null);
  const [selectorQuery, setSelectorQuery] = useState("");

  useEffect(() => {
    if (!visible) return;
    setDraft(filters);
    setDraftCategory(category);
    setSelectorMode(null);
    setSelectorQuery("");
  }, [category, filters, visible]);

  const propertyOptions = useMemo(
    () => properties.map(({ id, title }) => ({ id, label: title })),
    [properties],
  );
  const tenantOptions = useMemo(
    () => lessees.map(({ id, name }) => ({ id, label: name })),
    [lessees],
  );
  const selectedProperty = propertyOptions.find(
    ({ id }) => id === draft.propertyId,
  );
  const selectedTenant = tenantOptions.find(({ id }) => id === draft.lesseeId);

  function closeSelector() {
    setSelectorMode(null);
    setSelectorQuery("");
  }

  function handleClose() {
    if (selectorMode) {
      closeSelector();
      return;
    }
    onClose();
  }

  const selectorOptions =
    selectorMode === "property" ? propertyOptions : tenantOptions;
  const selectedId =
    selectorMode === "property" ? draft.propertyId : draft.lesseeId;

  return (
    <BottomSheetModal
      backdropAccessibilityLabel="Close document filters"
      backdropClassName="bg-textPrimary/45"
      onClose={handleClose}
      visible={visible}
    >
      <View
        accessibilityViewIsModal
        className="max-h-[90%] min-h-[520px] rounded-t-[30px] bg-white"
      >
        <View className="pt-3">
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-secondary/30" />
        </View>

        {selectorMode ? (
          <SearchableOptionSelector
            backAccessibilityLabel="Back to filters"
            emptyLabel={
              selectorMode === "property" ? "All properties" : "All tenants"
            }
            onBack={closeSelector}
            onChangeQuery={setSelectorQuery}
            onSelect={(id) => {
              setDraft((current) => ({
                ...current,
                [selectorMode === "property" ? "propertyId" : "lesseeId"]: id,
              }));
              closeSelector();
            }}
            options={selectorOptions}
            query={selectorQuery}
            selectedId={selectedId}
            title={
              selectorMode === "property" ? "Choose property" : "Choose tenant"
            }
          />
        ) : (
          <>
            <View className="flex-row items-center justify-between border-b border-secondary/20 px-5 pb-4">
              <Text
                accessibilityRole="header"
                className="font-ralewayExtraBold text-xl text-textPrimary"
              >
                Filter documents
              </Text>
              <TouchableOpacity
                accessibilityLabel="Close filters"
                accessibilityRole="button"
                activeOpacity={0.75}
                className="h-11 w-11 items-center justify-center rounded-full bg-secondary/10"
                onPress={onClose}
              >
                <MaterialCommunityIcons
                  name="close"
                  color="#634CE4"
                  size={21}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerClassName="gap-5 p-5"
              keyboardShouldPersistTaps="handled"
            >
              <SelectionField
                label="Property"
                onPress={() => setSelectorMode("property")}
                value={selectedProperty?.label ?? "All properties"}
              />
              <SelectionField
                label="Tenant"
                onPress={() => setSelectorMode("tenant")}
                value={selectedTenant?.label ?? "All tenants"}
              />

              <SearchFilterSection label="Category">
                <RadioOptionList
                  onSelect={setDraftCategory}
                  options={[
                    { label: "All categories", value: "All" },
                    ...DOCUMENT_CATEGORIES.map((item) => ({
                      label: item,
                      value: item,
                    })),
                  ]}
                  value={draftCategory}
                />
              </SearchFilterSection>

              <SearchFilterSection label="File type">
                <RadioOptionList
                  onSelect={(type) =>
                    setDraft((current) => ({ ...current, type }))
                  }
                  options={documentTypes.map((type) => ({
                    label: type === "All" ? "All types" : type,
                    value: type,
                  }))}
                  value={draft.type}
                />
              </SearchFilterSection>
            </ScrollView>

            <SearchFilterActions
              onApply={() => onApply(draft, draftCategory)}
              onReset={() => {
                setDraft({ propertyId: "", lesseeId: "", type: "All" });
                setDraftCategory("All");
              }}
            />
          </>
        )}
      </View>
    </BottomSheetModal>
  );
}
