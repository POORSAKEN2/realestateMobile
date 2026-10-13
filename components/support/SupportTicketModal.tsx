import React, { useRef, useState } from "react";
import { Text, View } from "react-native";
import { AddEditModal } from "../ui/AddEditModal";
import { BaseField } from "../ui/fields/BaseField";
import { DropdownField } from "../ui/fields/DropdownField";
import { FormSection } from "../ui/forms/FormSection";
import type {
  CreateSupportTicketPayload,
  TicketCategory,
  TicketPriority,
} from "../../types/domain/support";
import {
  TICKET_CATEGORIES,
  ticketSubmissionError,
  validateTicket,
  type TicketFieldErrors,
} from "../../utils/support/ticketForm";

const PRIORITIES: TicketPriority[] = ["Low", "Medium", "High", "Urgent"];
const PRIORITY_OPTIONS = PRIORITIES.map((value) => ({ value, label: value }));
const CATEGORY_OPTIONS = TICKET_CATEGORIES.map((value) => ({
  value,
  label: value,
}));

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
  const [category, setCategory] = useState<TicketCategory>("Technical");
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<TicketFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const busy = isPending || submitting;

  function clearField(field: keyof CreateSupportTicketPayload) {
    setFields((current) => ({ ...current, [field]: undefined }));
    setError(null);
  }

  async function handleSubmit() {
    if (isPending || inFlight.current) return;
    const payload = {
      subject: subject.trim(),
      description: description.trim(),
      priority,
      category,
    };
    const validation = validateTicket(payload);
    setFields(validation);
    setError(null);
    if (Object.keys(validation).length) return;
    inFlight.current = true;
    setSubmitting(true);
    try {
      await onSubmit(payload);
      setSubject("");
      setDescription("");
      setPriority("Medium");
      setCategory("Technical");
      setFields({});
      setError(null);
      onClose();
    } catch (err) {
      const failure = ticketSubmissionError(err);
      setFields(failure.fields);
      setError(failure.message);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  function fieldError(field: keyof CreateSupportTicketPayload) {
    return fields[field] ? (
      <Text accessibilityRole="alert" className="text-sm text-danger">
        {fields[field]}
      </Text>
    ) : null;
  }

  return (
    <AddEditModal
      appearance="card"
      formError={error}
      isPending={busy}
      isVisible={isVisible}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitText="Submit Ticket"
      title="Create Support Ticket"
      subtitle="Describe your issue so our support team can review it."
      showCancelAction
    >
      <FormSection icon="ticket-outline" title="Ticket details" variant="card">
        <View className="gap-2">
          <BaseField
            variant="filled"
            label="Subject"
            required
            value={subject}
            editable={!busy}
            maxLength={255}
            autoCapitalize="sentences"
            placeholder="e.g. Issue with payment ledger"
            onChangeText={(value) => {
              setSubject(value);
              clearField("subject");
            }}
          />
          {fieldError("subject")}
        </View>
        <View className="gap-2">
          <DropdownField
            variant="filled"
            label="Category"
            required
            value={category}
            options={CATEGORY_OPTIONS}
            disabled={busy}
            onSelect={(value) => {
              setCategory(value);
              clearField("category");
            }}
          />
          {fieldError("category")}
        </View>
        <View className="gap-2">
          <DropdownField
            variant="filled"
            label="Priority level"
            value={priority}
            options={PRIORITY_OPTIONS}
            disabled={busy}
            onSelect={(value) => {
              setPriority(value);
              clearField("priority");
            }}
          />
          {fieldError("priority")}
        </View>
      </FormSection>
      <FormSection
        icon="text-box-outline"
        title="Issue description"
        variant="card"
      >
        <View className="gap-2">
          <BaseField
            variant="filled"
            label="Description & details"
            required
            multiline
            numberOfLines={5}
            style={{ minHeight: 120 }}
            value={description}
            editable={!busy}
            autoCapitalize="sentences"
            placeholder="Describe what happened or what you need assistance with."
            onChangeText={(value) => {
              setDescription(value);
              clearField("description");
            }}
          />
          {fieldError("description")}
        </View>
      </FormSection>
    </AddEditModal>
  );
}
