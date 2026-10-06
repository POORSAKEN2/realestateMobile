import { router } from "expo-router";
import { appRoutes } from "../../constants/navigation";
import { useAccess } from "../../hooks/auth/useAccess";
import { useAuth } from "../../hooks/useAuth";
import { canManageStaff } from "../../utils/auth/staffAccess";
import {
  ProfileMenuSection,
  type ProfileMenuItem,
} from "../profile/ProfileMenuSection";

export function SettingsWorkspaceSection() {
  const { can } = useAccess();
  const { session } = useAuth();
  const items: ProfileMenuItem[] = [];
  if (can("settings.view"))
    items.push({
      icon: "options-outline",
      label: "Workspace",
      supportingText: "Identity, region, appearance, and maps",
      onPress: () => router.push(appRoutes.secondary.workspaceSettings),
    });
  if (canManageStaff(session?.user))
    items.push({
      icon: "people-outline",
      label: "Team & Access",
      supportingText: "Manager accounts and property access",
      onPress: () => router.push(appRoutes.secondary.staffManagement),
    });
  if (can("audit.view"))
    items.push({
      icon: "time-outline",
      label: "Audit History",
      supportingText: "Account changes and security events",
      onPress: () => router.push(appRoutes.secondary.auditHistory),
    });
  if (can("account.reviewDeletionRequests"))
    items.push({
      icon: "documents-outline",
      label: "Deletion Requests",
      supportingText: "Review data removal and tenant closure",
      onPress: () => router.push(appRoutes.secondary.deletionRequests),
    });
  return items.length ? (
    <ProfileMenuSection title="Administration" items={items} />
  ) : null;
}
