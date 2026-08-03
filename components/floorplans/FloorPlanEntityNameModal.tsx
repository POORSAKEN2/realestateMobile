import { AddEditModal } from "../ui/AddEditModal";
import { BaseField } from "../ui/fields/BaseField";

export type FloorPlanEntityNameModalProps = {
  editing: boolean;
  isPending: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  value: string;
  visible: boolean;
};

export function FloorPlanEntityNameModal({
  editing,
  createTitle,
  entityLabel,
  fieldLabel,
  isPending,
  onChange,
  onClose,
  onSubmit,
  placeholder,
  renameTitle,
  subtitle,
  value,
  visible,
}: FloorPlanEntityNameModalProps & {
  createTitle?: string;
  entityLabel: string;
  fieldLabel: string;
  placeholder: string;
  renameTitle?: string;
  subtitle: string;
}) {
  return (
    <AddEditModal
      appearance="card"
      formError={null}
      isPending={isPending}
      isVisible={visible}
      onClose={onClose}
      onSubmit={onSubmit}
      showCancelAction
      submitText={editing ? "Save name" : `Add ${entityLabel}`}
      subtitle={subtitle}
      title={
        editing
          ? (renameTitle ?? `Rename ${entityLabel}`)
          : (createTitle ?? `Add ${entityLabel}`)
      }
    >
      <BaseField
        autoFocus
        label={fieldLabel}
        onChangeText={onChange}
        placeholder={placeholder}
        required
        value={value}
        variant="filled"
      />
    </AddEditModal>
  );
}
