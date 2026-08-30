import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

import { colors } from "../../constants/colors";
import { AddEditModal } from "../ui/AddEditModal";
import type {
  CreateSupportTicketPayload,
  TicketPriority,
} from "../../types/domain/support";

const PRIORITIES: TicketPriority[] = ["Low", "Medium", "High", "Urgent"];

type SupportTicketModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateSupportTicketPayload) => Promise<void>;
  isPending: boolean;
};

export function SupportTicketModal({
  isVisible,
  onClose,
  onSubmit,
  isPending,
}: SupportTicketModalProps) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [category, setCategory] = useState("Technical");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!subject.trim()) {
      setError("Please enter a subject.");
      return;
    }
    if (!description.trim()) {
      setError("Please provide a description of the issue.");
      return;
    }

    setError(null);
    try {
      await onSubmit({
        subject: subject.trim(),
        description: description.trim(),
        priority,
        category,
      });
      setSubject("");
      setDescription("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create support ticket.");
    }
  }

  return (
    <AddEditModal
      formError={error}
      isPending={isPending}
      isVisible={isVisible}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText="Submit Ticket"
      subtitle="Our support team will respond promptly"
      title="Create Support Ticket"
    >
      <View className="gap-5">
        {/* Subject */}
        <View className="gap-2">
          <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description">
            Subject *
          </Text>
          <View className="h-14 justify-center rounded-2xl border border-primary/20 bg-white px-4">
            <TextInput
              accessibilityLabel="Ticket Subject"
              className="font-ralewayBold text-base text-textPrimary"
              onChangeText={setSubject}
              placeholder="e.g. Issue with payment ledger"
              placeholderTextColor={colors.description}
              value={subject}
            />
          </View>
        </View>

        {/* Priority Selector */}
        <View className="gap-2">
          <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description">
            Priority Level
          </Text>
          <View className="flex-row gap-2">
            {PRIORITIES.map((p) => {
              const isSelected = priority === p;
              return (
                <TouchableOpacity
                  key={p}
                  activeOpacity={0.8}
                  className={`flex-1 items-center justify-center rounded-xl border py-2.5 ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-primary/20 bg-white"
                  }`}
                  onPress={() => setPriority(p)}
                >
                  <Text
                    className={`font-ralewayBold text-xs ${
                      isSelected ? "text-white" : "text-textPrimary"
                    }`}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Description */}
        <View className="gap-2">
          <Text className="font-ralewayExtraBold text-[11px] uppercase tracking-wide text-description">
            Description & Details *
          </Text>
          <View className="h-32 rounded-2xl border border-primary/20 bg-white p-3.5">
            <TextInput
              accessibilityLabel="Ticket Description"
              className="flex-1 font-ralewayMedium text-sm text-textPrimary"
              multiline
              onChangeText={setDescription}
              placeholder="Describe what happened or what you need assistance with..."
              placeholderTextColor={colors.description}
              textAlignVertical="top"
              value={description}
            />
          </View>
        </View>
      </View>
    </AddEditModal>
  );
}
