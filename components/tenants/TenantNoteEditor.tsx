import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  TENANT_NOTE_CATEGORIES,
  type TenantNote,
  type TenantNoteCategory,
} from "../../types";
import type { TenantNoteFormState } from "../../utils/tenants/tenantNoteForm";
import {
  formatTenantNoteDate,
  parseTenantNoteDate,
  TENANT_NOTE_CONTENT_LIMIT,
} from "../../utils/tenants/tenantNoteForm";
import { formatTenantDetailDate } from "../../utils/tenants/tenantDetails";
import { BaseField } from "../ui/fields/BaseField";
import { ChoiceField } from "../ui/fields/ChoiceField";
import { DateTimePickerModal } from "../ui/fields/DateTimePickerModal";
import { PickerField } from "../ui/fields/PickerField";

const CATEGORY_OPTIONS = TENANT_NOTE_CATEGORIES.map((category) => ({
  label: category,
  value: category,
}));

export function TenantNoteEditor({
  error,
  form,
  isSaving,
  note,
  onBack,
  onSubmit,
  onUpdate,
}: {
  error: string;
  form: TenantNoteFormState;
  isSaving: boolean;
  note?: TenantNote;
  onBack: () => void;
  onSubmit: () => void;
  onUpdate: <K extends keyof TenantNoteFormState>(
    key: K,
    value: TenantNoteFormState[K],
  ) => void;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  return (
    <View
      accessibilityViewIsModal
      className="overflow-hidden rounded-t-[30px] bg-white"
      style={{ height: height * 0.84 }}
    >
      <View className="flex-row items-center border-b border-textPrimary/10 px-5 pb-4 pt-2">
        <Text className="min-w-0 flex-1 font-ralewayExtraBold text-lg text-textPrimary">
          {note ? "Edit internal note" : "Add internal note"}
        </Text>
        <TouchableOpacity
          accessibilityLabel="Back to tenant details"
          accessibilityRole="button"
          activeOpacity={0.75}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface"
          disabled={isSaving}
          onPress={onBack}
        >
          <Ionicons color="#6F6D6D" name="close" size={21} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-5">
          <View>
            <BaseField
              label="Note"
              maxLength={TENANT_NOTE_CONTENT_LIMIT}
              multiline
              numberOfLines={7}
              onChangeText={(value) => onUpdate("content", value)}
              placeholder="Add information your team should retain"
              required
              value={form.content}
              variant="filled"
            />
            <Text className="mt-1 text-right font-ralewayMedium text-[10px] text-description">
              {form.content.length.toLocaleString()} /{" "}
              {TENANT_NOTE_CONTENT_LIMIT.toLocaleString()}
            </Text>
          </View>

          <ChoiceField<TenantNoteCategory>
            label="Category"
            onChange={(value) => {
              if (!Array.isArray(value)) onUpdate("category", value);
            }}
            options={CATEGORY_OPTIONS}
            value={form.category}
            variant="filled"
          />

          <PickerField
            label="Note date"
            onPress={() => setIsDatePickerVisible(true)}
            placeholder="Select a note date"
            required
            value={formatTenantDetailDate(form.date)}
            variant="filled"
          />

          {error ? (
            <View className="rounded-2xl border border-danger/20 bg-dangerSurface p-4">
              <Text className="font-ralewayBold text-sm text-danger">
                {error}
              </Text>
            </View>
          ) : null}

          <View className="flex-row gap-3 pt-1">
            <TouchableOpacity
              accessibilityRole="button"
              className="h-12 flex-1 items-center justify-center rounded-2xl border border-textPrimary/10"
              disabled={isSaving}
              onPress={onBack}
            >
              <Text className="font-ralewayExtraBold text-textPrimary">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              className="h-12 flex-1 items-center justify-center rounded-2xl bg-primary"
              disabled={isSaving}
              onPress={onSubmit}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-ralewayExtraBold text-white">
                  {note ? "Save changes" : "Add note"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {isDatePickerVisible ? (
        <DateTimePickerModal
          mode="date"
          onClose={() => setIsDatePickerVisible(false)}
          onConfirm={(value) => onUpdate("date", formatTenantNoteDate(value))}
          title="Select note date"
          value={parseTenantNoteDate(form.date)}
        />
      ) : null}
    </View>
  );
}
