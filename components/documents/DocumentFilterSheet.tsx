import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { Lessee, Property, PropertyDocument } from "../../types";
import type { DocumentAdvancedFilters } from "../../utils/documents/documentPresentation";
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
  filters,
  lessees,
  onApply,
  onClose,
  properties,
  visible,
}: {
  filters: DocumentAdvancedFilters;
  lessees: Lessee[];
  onApply: (filters: DocumentAdvancedFilters) => void;
  onClose: () => void;
  properties: Property[];
  visible: boolean;
}) {
  const [draft, setDraft] = useState(filters);
  const [selectorMode, setSelectorMode] = useState<SelectorMode>(null);
  const [selectorQuery, setSelectorQuery] = useState("");

  useEffect(() => {
    if (!visible) return;
    setDraft(filters);
    setSelectorMode(null);
    setSelectorQuery("");
  }, [filters, visible]);

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
    <Modal
      animationType="slide"
      onRequestClose={handleClose}
      transparent
      visible={visible}
    >
      <View className="flex-1 justify-end bg-slate-950/45">
        <Pressable className="flex-1" onPress={onClose} />
        <View
          accessibilityViewIsModal
          className="max-h-[90%] min-h-[520px] rounded-t-[30px] bg-white"
        >
          <View className="pt-3">
            <View className="mb-3 h-1 w-10 self-center rounded-full bg-slate-300" />
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
                selectorMode === "property"
                  ? "Choose property"
                  : "Choose tenant"
              }
            />
          ) : (
            <>
              <View className="flex-row items-center justify-between border-b border-slate-100 px-5 pb-4">
                <Text
                  accessibilityRole="header"
                  className="font-soraBold text-xl text-slate-950"
                >
                  Filter documents
                </Text>
                <TouchableOpacity
                  accessibilityLabel="Close filters"
                  accessibilityRole="button"
                  activeOpacity={0.75}
                  className="h-11 w-11 items-center justify-center rounded-full bg-slate-100"
                  onPress={onClose}
                >
                  <MaterialCommunityIcons
                    name="close"
                    color="#334155"
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

                <View className="gap-2">
                  <Text className="font-soraSemiBold text-xs uppercase tracking-wide text-slate-500">
                    File type
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {documentTypes.map((type) => {
                      const isSelected = draft.type === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: isSelected }}
                          activeOpacity={0.8}
                          className={`min-h-11 justify-center rounded-2xl border px-4 ${
                            isSelected
                              ? "border-slate-950 bg-slate-950"
                              : "border-slate-200 bg-white"
                          }`}
                          onPress={() =>
                            setDraft((current) => ({ ...current, type }))
                          }
                        >
                          <Text
                            className={`font-soraSemiBold text-xs ${
                              isSelected ? "text-white" : "text-slate-600"
                            }`}
                          >
                            {type === "All" ? "All types" : type}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              <View className="flex-row gap-3 border-t border-slate-100 p-5 pb-8">
                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.82}
                  className="min-h-12 flex-1 items-center justify-center rounded-2xl bg-slate-100"
                  onPress={() =>
                    setDraft({ propertyId: "", lesseeId: "", type: "All" })
                  }
                >
                  <Text className="font-soraBold text-sm text-slate-700">
                    Reset
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.82}
                  className="min-h-12 flex-[2] items-center justify-center rounded-2xl bg-blue-600"
                  onPress={() => onApply(draft)}
                >
                  <Text className="font-soraBold text-sm text-white">
                    Apply filters
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
