import type { Bedspace } from "../../types";
import { ActionSheet, type ActionSheetItem } from "../ui/ActionSheet";

export function BedspaceActionsSheet({
  bedspace,
  isBusy,
  onAssignLease,
  onClose,
  onDelete,
  onEdit,
  onViewLease,
}: {
  bedspace: Bedspace | null;
  isBusy: boolean;
  onAssignLease: (bedspace: Bedspace) => void;
  onClose: () => void;
  onDelete: (bedspace: Bedspace) => void;
  onEdit: (bedspace: Bedspace) => void;
  onViewLease: (bedspace: Bedspace) => void;
}) {
  const leaseAction: ActionSheetItem[] = bedspace
    ? bedspace.status === "Vacant"
      ? [
          {
            description: "Create a lease for this individual bedspace.",
            disabled: isBusy,
            icon: "account-plus-outline",
            label: "Assign tenant and lease",
            onPress: () => onAssignLease(bedspace),
          },
        ]
      : bedspace.status === "Occupied"
        ? [
            {
              description: "Open lease management for the active assignment.",
              disabled: isBusy,
              icon: "file-document-outline",
              label: "View leases",
              onPress: () => onViewLease(bedspace),
            },
          ]
        : []
    : [];
  const actions: ActionSheetItem[] = bedspace
    ? [
        ...leaseAction,
        {
          description: "Update its number, price, notes, or availability.",
          disabled: isBusy,
          icon: "pencil-outline",
          label: "Edit bedspace",
          onPress: () => onEdit(bedspace),
        },
        {
          description:
            bedspace.status === "Occupied"
              ? "Occupied inventory cannot be deleted."
              : "Deletion is blocked when lease history exists.",
          destructive: true,
          disabled: isBusy || bedspace.status === "Occupied",
          icon: "trash-can-outline",
          label: "Delete bedspace",
          onPress: () => onDelete(bedspace),
        },
      ]
    : [];

  return (
    <ActionSheet
      actions={actions}
      onClose={onClose}
      subtitle="Manage availability, pricing, and lease assignment."
      title={`Bedspace ${bedspace?.bedspaceNumber ?? "actions"}`}
      visible={Boolean(bedspace)}
    />
  );
}
